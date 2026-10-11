import {readFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {PALETTES} from '../../core/src/palettes';
import type {TemplateContent} from '../../core/src/template-contracts';
import {StageContext} from '../src/stage/context';
import {stageViewport} from '../src/stage/model';
import {structureRegistry} from '../src/structures';
import {fixtureContent} from './stage-fixtures';

const render=(content:TemplateContent,progress=1)=>{
  const Component=structureRegistry[content.structure].Component;
  return renderToStaticMarkup(<StageContext.Provider value={{surface:'opaque',surfaceOpacity:1,dualRail:content.structure==='editorial-dual-rail',visualStyle:'hyperspeed'}}><Component content={content} progress={progress} palette={PALETTES.hyperspeed} placement="full"/></StageContext.Provider>);
};

describe('physical-size content-fit stage layouts',()=>{
  it.each(Object.values(fixtureContent))('$structure selects a distinct stage layout without changing its identity',(content)=>{
    const html=render(content);
    expect(html).toContain(`data-stage-layout="${content.structure}"`);
    expect(html).toContain('data-density-mode="physical-content-fit"');
    expect(html).toContain('container-type:size');
    expect(html).not.toContain('data-presenter-window');
  });
  it.each([[1250,720],[1100,300],[700,260],[500,900],[1800,350]])('keeps physical %d × %d stage bounds and physical typography',(width,height)=>{
    expect(stageViewport('signal-route','full',width,height)).toEqual({width,height,fit:1});
  });
  it('renders four complete long actions with numbered steps and the result',()=>{
    const actions=['请打开软件并新建一个空白建模项目','根据参考图片创建主体结构和基础材质','调整灯光、摄像机位置并检查模型细节','完成后保存工程文件并输出预览结果'];
    const html=render({structure:'command-palette',commandTitle:'按要求操作',actions,resultState:'检查每一步的画面结果'});
    for(const text of actions)expect(html).toContain(text);
    expect((html.match(/data-command-row="/g)??[])).toHaveLength(4);
    expect(html).toContain('font-size:40px');
    expect(html).toContain('检查每一步的画面结果');
    expect(html).not.toMatch(/text-overflow:ellipsis|white-space:nowrap/);
  });
  it('preserves one literal prompt instead of fabricating a second action',()=>{
    const literal='请创建 Kawasaki Ninja H2R（川崎 Ninja H2R）摩托车模型，并保留绿色车架。';
    const html=render({structure:'command-palette',commandTitle:'输入建模请求',actions:[literal],resultState:'按口播整理'});
    expect(html).toContain(literal);
    expect((html.match(/data-command-row="/g)??[])).toHaveLength(1);
  });
  it('keeps shallow before/after states in normal flow, never under a moving crop',()=>{
    const html=render({structure:'before-after-scrub',before:'帮我做模型',after:'创建白色圆角立方体并添加柔光',criterion:'补上明确要求'});
    expect(html).toContain('data-before-after-layout="two-anchored-states"');
    expect(html).not.toContain('clip-path:');
    expect(html).not.toContain('margin-top:120px');
  });
  it('anchors all five long route labels to visible normal-flow node tracks',()=>{
    const nodes=['输入完整建模要求','观察当前软件窗口','执行下一步界面操作','检查生成模型结果','保存最终工程文件'];
    const html=render({structure:'signal-route',nodes,routeLabel:'逐步完成任务',result:'检查完成再保存'});
    for(const node of nodes)expect(html).toContain(node);
    expect((html.match(/data-route-label-anchor="node-/g)??[])).toHaveLength(5);
    expect(html).not.toContain('<foreignObject');
  });
  it('replaces the default unrelated boulder with explicit unfilled window/action/result lines',()=>{
    const html=render({structure:'semantic-doodle',subject:'Computer Use',action:'操作软件窗口',outcome:'模型出现在工作区',accent:'#55d7ff'});
    expect(html).toContain('data-doodle-semantic="window-pointer-result"');
    expect(html).toContain('操作流程示意 · 非软件证据');
    for(const shape of html.match(/<(?:path|rect|circle)\b[^>]*>/g)??[])expect(shape).toContain('fill="none"');
    expect(html).not.toContain('boulder');
  });
  it('settles semantic entry without wall clocks, hidden truncation or changing style time',()=>{
    const source=readFileSync(new URL('../src/structures/stageLayouts.tsx',import.meta.url),'utf8');
    expect(source).not.toMatch(/Math\.random|Date\.now|setInterval|setTimeout|requestAnimationFrame|@keyframes/);
    expect(source).not.toMatch(/textOverflow|lineClamp/);
    expect(render(fixtureContent['command-palette'],1)).toBe(render(fixtureContent['command-palette'],1));
    expect(render(fixtureContent['command-palette'],.1)).not.toBe(render(fixtureContent['command-palette'],1));
  });
});
