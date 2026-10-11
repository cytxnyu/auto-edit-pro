import {renderToStaticMarkup} from 'react-dom/server';
import {PALETTES} from '../../core/src/palettes';
import type {SemanticStructure, TemplateContent} from '../../core/src/template-contracts';
import {structureRegistry} from '../src/structures';
export const fixtureContent: Record<SemanticStructure, TemplateContent> = {
  'editorial-dual-rail': {structure: 'editorial-dual-rail', kicker: '核心信息', headline: '结构服务内容', leftItems: [{label: '现状', detail: '重复卡片难理解'}], rightItems: [{label: '行动', detail: '按语义选择结构'}], takeaway: '先讲清楚，再做漂亮'},
  'thesis-and-proof': {structure: 'thesis-and-proof', thesis: '不是换颜色', reason: '而是更换信息结构', sourceLabel: '设计原则'},
  'bidirectional-flow': {structure: 'bidirectional-flow', leftLabel: '脚本', rightLabel: '视频', forwardAction: '生成', returnAction: '反馈修正', result: '形成闭环'},
  'command-palette': {structure: 'command-palette', commandTitle: '执行清单', actions: ['读取字幕', '生成方案', '等待确认'], resultState: 'READY'},
  'four-stage-pipeline': {structure: 'four-stage-pipeline', title: '包装流程', stages: ['分析', '设计', '验收', '导出'], output: '可复现成片'},
  'before-after-scrub': {structure: 'before-after-scrub', before: '统一文字卡', after: '语义化结构', criterion: '视觉表达'},
  'evidence-panel': {structure: 'evidence-panel', evidenceAsset: 'evidence/doc.png', caption: '官方文档', sourceLabel: '一手来源', interpretation: '证据优先于装饰'},
  'metric-odometer': {structure: 'metric-odometer', metrics: [{value: '10', unit: '类', label: '独立结构', evidenceStatus: 'sourced', sourceLabel: 'V2合同'}]},
  'signal-route': {structure: 'signal-route', nodes: ['字幕', '语义', '模板', '成片'], routeLabel: '信息路径', result: '结构与内容一致'},
  'semantic-doodle': {structure: 'semantic-doodle', subject: '创作者', action: '推动流程', outcome: '完成交付', accent: '#e97a5f'},
};

export const renderStructure = (structure: SemanticStructure): string => {
  const entry = structureRegistry[structure];
  return renderToStaticMarkup(
    <entry.Component
      content={fixtureContent[structure]}
      progress={0.72}
      palette={PALETTES[structure === 'semantic-doodle' ? 'paper-sketch' : 'deep-ocean']}
      placement={entry.safeZone === 'full' ? 'full' : 'left'}
      {...(structure === 'evidence-panel' ? {evidence: {src: 'evidence/doc.png', label: '官方文档'}} : {})}
    />,
  );
};

