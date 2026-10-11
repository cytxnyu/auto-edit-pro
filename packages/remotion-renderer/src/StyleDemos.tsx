import type {ReactElement} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {StoryboardSchema, type Storyboard} from '../../core/src/schema';
import {VideoPackaging} from './VideoPackaging';

export const STYLE_DEMOS = [
  {id: 'StyleDemoBalatro', file: '01-balatro', title: '液态观点组件', subtitle: 'BALATRO / 观点与解释', styleIds: ['balatro']},
  {id: 'StyleDemoCrtCubes', file: '02-crt-cubes', title: '指令与方块组件', subtitle: 'CRT WARP → CUBES / 同片换风格', styleIds: ['crt-warp', 'cubes']},
  {id: 'StyleDemoHyperspeed', file: '03-hyperspeed', title: '高速流程组件', subtitle: 'HYPERSPEED / 任务执行路径', styleIds: ['hyperspeed']},
] as const;

export type StyleDemoIndex = 0 | 1 | 2;
export const styleDemoStoryboard = (index: StyleDemoIndex): Storyboard => {
  const common = {
    version: '2.0', presentation: 'whole-screen-stage', id: STYLE_DEMOS[index].file,
    title: STYLE_DEMOS[index].title, duration: 6, fps: 30, width: 1280, height: 720,
    captionsMode: 'none', source: {video: 'synthetic-component-demo.mp4'},
    theme: {background: '#090b10', foreground: '#f3f2ed', accent: '#e86b51'},
    styleMix: {mode: 'seeded-shuffle', seed: 20260929, pool: ['balatro', 'crt-warp', 'cubes', 'hyperspeed']},
  };
  const stage = {x: .025, y: .135, width: .95, height: .655, depth: 'front', surface: 'opaque', surfaceOpacity: 1, interaction: 'speech', coverSubtitles: false};
  const style = (id: string, seed: number) => ({id, seed, intensity: .85});
  const beatCommon = {placement: 'full', stage, directorRole: 'mechanism', reason: 'Synthetic component demonstration; not footage, evidence, or a packaged source video.'};
  if (index === 0) return StoryboardSchema.parse({...common, beats: [{
    ...beatCommon, id: 'balatro-thesis', start: 0, end: 6, text: '让 AI 不只回答，而是完成任务',
    structure: 'thesis-and-proof', motions: ['reveal'], palette: 'balatro', visualStyle: style('balatro', 2718),
    content: {structure: 'thesis-and-proof', thesis: '让 AI 不只回答，而是完成任务', reason: '先明确目标，再执行步骤，最后检查结果。'},
  }]});
  if (index === 1) return StoryboardSchema.parse({...common, beats: ['crt-warp', 'cubes'].map((id, i) => ({
    ...beatCommon, id: `command-${id}`, start: i * 3, end: (i + 1) * 3,
    stage: {...stage, x: .08, width: .84}, text: '读取素材、组织内容、检查结果',
    structure: 'command-palette', motions: ['focus', 'reveal'], palette: id, visualStyle: style(id, 4096 + i),
    content: {structure: 'command-palette', commandTitle: '把指令变成行动', actions: ['读取素材', '组织内容', '检查结果'], resultState: '示例流程'},
  }))});
  return StoryboardSchema.parse({...common, beats: [{
    ...beatCommon, id: 'hyperspeed-route', start: 0, end: 6, text: '从输入到执行，再到验证',
    structure: 'signal-route', motions: ['route', 'trace'], palette: 'hyperspeed', visualStyle: style('hyperspeed', 8192),
    content: {structure: 'signal-route', nodes: ['输入', '执行', '验证'], routeLabel: '任务执行路径', result: '每一步都有结果'},
  }]});
};

export const StyleDemo = ({demoIndex = 0}: {demoIndex?: StyleDemoIndex}): ReactElement => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const demo = STYLE_DEMOS[demoIndex];
  const storyboard = styleDemoStoryboard(demoIndex);
  const active = storyboard.beats.find((beat) => frame >= beat.start * 30 && frame < beat.end * 30)!;
  const labels: Record<string, string> = {'balatro': '液态旋涡 · 大字观点', 'crt-warp': '曲面扫描 · 指令聚焦', 'cubes': '方块阵列 · 空间波动', 'hyperspeed': '透视光轨 · 路径推进'};
  return <AbsoluteFill style={{background: '#090b10', color: '#f3f2ed', fontFamily: '"Microsoft YaHei", "Noto Sans SC", sans-serif'}}>
    <VideoPackaging storyboard={storyboard} overlayOnly/>
    <header style={{position: 'absolute', left: 42, right: 42, top: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 18, letterSpacing: '0.1em'}}>
      <span>AUTO EDIT PRO / STYLE LAB</span><span style={{color: '#9ea8b7'}}>0{demoIndex + 1} · 动态组件示例</span>
    </header>
    <footer style={{position: 'absolute', left: 46, right: 46, bottom: 35}}>
      <div style={{display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 24}}>
        <div><div style={{fontSize: 30, fontWeight: 700}}>{labels[active.visualStyle?.id ?? 'balatro']}</div><div style={{fontSize: 16, color: '#a6adbb', marginTop: 8}}>{demo.subtitle}</div></div>
        <div style={{fontSize: 15, color: '#a6adbb'}}>合成示例 · 无原片 / 无口播音轨</div>
      </div>
      <div style={{height: 3, background: '#232934', marginTop: 20}}><div style={{height: 3, width: `${(frame + 1) / durationInFrames * 100}%`, background: '#e7e8e8'}}/></div>
    </footer>
  </AbsoluteFill>;
};

