import {buildTemplateContent} from './content-builders';
import {PALETTES, paletteForRole} from './palettes';
import {StoryboardSchema, type Storyboard, type StoryboardBeat} from './schema';
import {chooseDirectorRole, chooseIllustration, classifySemanticStructure, motionsForStructure} from './semantic-rules';
import type {SemanticStructure} from './template-contracts';
import type {MediaProbe, SrtCue} from './types';
import {deriveStyleSeed, seededStyleAssignments, validateStyleOptions, VISUAL_STYLE_IDS, type StyleMix, type StyleOptions} from './visual-styles';

type PlannerEvidence = {src: string; label: string; sourceUrl?: string};

type PlannerInput = StyleOptions & {
  id: string;
  title: string;
  cues: SrtCue[];
  probe: MediaProbe;
  captionsMode: Storyboard['captionsMode'];
  sourceVideo: string;
  sourceSrt?: string;
  evidenceByCue?: Record<number, PlannerEvidence>;
  presentation?: 'whole-screen-stage' | 'legacy';
};

const overlayText = (text: string): string => {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length <= 34 ? compact : `${compact.slice(0, 33)}…`;
};

const choosePlacement = (
  structure: SemanticStructure,
  directorRole: StoryboardBeat['directorRole'],
  lastSide: 'left' | 'right',
): 'left' | 'right' | 'full' => {
  const fullStructures = new Set<SemanticStructure>([
    'four-stage-pipeline',
    'before-after-scrub',
    'evidence-panel',
    'metric-odometer',
    'signal-route',
    'semantic-doodle',
    'bidirectional-flow',
  ]);
  if (directorRole === 'hook' || fullStructures.has(structure)) return 'full';
  return lastSide === 'left' ? 'right' : 'left';
};

const makeBeat = (
  cue: SrtCue,
  index: number,
  lastSide: 'left' | 'right',
  evidence: PlannerEvidence | undefined,
): StoryboardBeat => {
  const text = overlayText(cue.text);
  const classified = classifySemanticStructure(text, index);
  const structure: SemanticStructure = classified === 'evidence-panel' && !evidence
    ? 'thesis-and-proof'
    : classified;
  const illustration = chooseIllustration(text);
  const directorRole = chooseDirectorRole(text, index);
  const content = buildTemplateContent(structure, text, {evidence});
  return {
    id: `beat-${String(index + 1).padStart(2, '0')}`,
    start: Number(cue.start.toFixed(3)),
    end: Number(cue.end.toFixed(3)),
    text,
    structure,
    content,
    motions: motionsForStructure(structure),
    placement: choosePlacement(structure, directorRole, lastSide),
    palette: paletteForRole(directorRole, index, Boolean(illustration)),
    directorRole,
    reason: classified === 'evidence-panel' && !evidence
      ? 'Evidence wording detected but no approved source asset was supplied; downgraded to thesis-and-proof.'
      : `Selected from spoken semantics: ${structure}.`,
    ...(evidence && structure === 'evidence-panel' ? {evidence} : {}),
    ...(illustration ? {illustration: {type: illustration, label: text.slice(0, 18)}} : {}),
  };
};

const mergeVisualCues = (cues: SrtCue[]): SrtCue[] => {
  const merged: SrtCue[] = [];
  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    const next = cues[index + 1];
    const isShortBridge = cue.end - cue.start < .9 && cue.text.trim().length <= 8;
    const isAdjacent = next && next.start - cue.end <= .35;
    if (isShortBridge && isAdjacent) {
      merged.push({...cue, end: next.end, text: `${cue.text.trim()}，${next.text.trim()}`});
      index += 1;
    } else {
      merged.push(cue);
    }
  }
  return merged;
};

const splitLongVisualCue = (cue: SrtCue): SrtCue[] => {
  const duration = cue.end - cue.start;
  if (duration <= 3.2) return [cue];

  const compact = cue.text.replace(/\s+/g, ' ').trim();
  const metric = /\d+(?:\.\d+)?%?|百分之[^，。！？,.!?]*|几万|几十|几个月|万|千|分钟|小时|倍/.exec(compact);
  const connector = /还有|以及|同时/.exec(compact);
  let splitAt = -1;
  let secondPrefix = '';

  if (metric) {
    const beforeMetric = compact.slice(0, metric.index);
    const semanticLead = /(几乎|每条|只需要|只用了|仅用了|进入|达到|提升|下降|消耗)[^，。！？,.!?]*$/.exec(beforeMetric);
    splitAt = semanticLead?.index ?? metric.index;
    secondPrefix = /我|本人|我的|新账号/.test(compact) ? '个人案例：' : '';
  } else if (connector) {
    splitAt = connector.index;
    secondPrefix = '继续分享：';
  } else {
    const punctuation = [...compact.matchAll(/[，。；：,.!?！？]/g)]
      .map((match) => match.index ?? -1)
      .filter((index) => index > 0);
    splitAt = punctuation.sort((left, right) => Math.abs(left - compact.length / 2) - Math.abs(right - compact.length / 2))[0]
      ?? Math.floor(compact.length / 2);
  }

  if (splitAt <= 0 || splitAt >= compact.length - 1) splitAt = Math.floor(compact.length / 2);
  const firstText = compact.slice(0, splitAt).replace(/[，。；：,.!?！？]+$/, '').trim();
  const secondText = compact.slice(splitAt).replace(/^[，。；：,.!?！？]+/, '').trim();
  if (!firstText || !secondText) return [cue];

  const midpoint = Number((cue.start + duration / 2).toFixed(3));
  return [
    {...cue, end: midpoint, text: firstText},
    {...cue, start: midpoint, text: `${secondPrefix}${secondText}`},
  ];
};

// Presentation and visual style are independent of semantic content and cue timing.
const stageForBeat = (beat: StoryboardBeat, fps: number): NonNullable<StoryboardBeat['stage']> => {
  const geometry = beat.directorRole === 'hook' ? {x: .03, y: .05, width: .94, height: .73}
    : beat.structure === 'before-after-scrub' || beat.structure === 'evidence-panel' ? {x: .01, y: .04, width: .98, height: .75}
    : beat.structure === 'four-stage-pipeline' || beat.structure === 'signal-route' || beat.structure === 'bidirectional-flow' ? {x: .04, y: .14, width: .92, height: .62}
    : beat.structure === 'command-palette' ? {x: .12, y: .09, width: .78, height: .68}
    : beat.structure === 'metric-odometer' ? {x: .16, y: .12, width: .68, height: .57}
    : beat.structure === 'semantic-doodle' ? {x: .1, y: .04, width: .8, height: .74}
    : {x: .08, y: .1, width: .84, height: .65};
  const last = Math.max(0, Math.round((beat.end - beat.start) * fps) - 1);
  const settle = Math.max(1, Math.min(last - 1, Math.round(fps * .3)));
  return {
    ...geometry, scale: 1, rotation: 0, opacity: 1, surfaceOpacity: .72,
    depth: 'front', surface: 'template', interaction: 'speech', coverSubtitles: false,
    ...(last >= 2 ? {keyframes: [
      {frame: 0, scale: .94, opacity: .25},
      {frame: settle, scale: 1, opacity: 1},
      {frame: last, scale: 1, opacity: 1},
    ]} : {}),
  };
};

export const planStoryboard = (input: PlannerInput): Storyboard => {
  validateStyleOptions(input);
  if (input.cues.length === 0) throw new Error('At least one SRT cue is required');
  const beats: StoryboardBeat[] = [];
  const fps = Math.round(input.probe.video.fps || 30);
  const stageEnabled = input.presentation !== 'legacy';
  if (!stageEnabled && (input.styleMix === 'seeded-shuffle' || input.styleSeed !== undefined || input.stylePool !== undefined)) throw new Error('Visual style mixing requires whole-screen-stage presentation');
  const styleMix: StyleMix | undefined = stageEnabled && input.styleMix !== 'legacy'
    ? {mode: 'seeded-shuffle', usage: 'single-use', seed: input.styleSeed ?? deriveStyleSeed(input.id), pool: input.stylePool ?? [...VISUAL_STYLE_IDS]}
    : undefined;
  let lastSide: 'left' | 'right' = 'right';
  mergeVisualCues(input.cues).flatMap(splitLongVisualCue).forEach((cue, index) => {
    const beat = makeBeat(cue, index, lastSide, input.evidenceByCue?.[cue.index]);
    if (stageEnabled) beat.stage = stageForBeat(beat, fps);
    beats.push(beat);
    if (beat.placement === 'left' || beat.placement === 'right') lastSide = beat.placement;
  });
  if (styleMix) {
    const assignments = seededStyleAssignments(beats.length, styleMix);
    beats.forEach((beat, index) => {
      beat.visualStyle = {id: assignments[index], seed: deriveStyleSeed(`${styleMix.seed}:${beat.id}`), intensity: beat.directorRole === 'evidence' || beat.directorRole === 'data' || beat.structure === 'evidence-panel' || beat.structure === 'metric-odometer' ? .25 : .65};
      beat.palette = assignments[index];
    });
  }
  const firstPalette = styleMix ? PALETTES[beats[0].palette] : undefined;
  return StoryboardSchema.parse({
    version: '2.0',
    ...(stageEnabled ? {presentation: 'whole-screen-stage'} : {}),
    ...(styleMix ? {styleMix} : {}),
    id: input.id,
    title: input.title,
    duration: Number(input.probe.duration.toFixed(3)),
    fps,
    width: input.probe.video.width,
    height: input.probe.video.height,
    captionsMode: input.captionsMode,
    source: {video: input.sourceVideo, ...(input.sourceSrt ? {srt: input.sourceSrt} : {})},
    theme: firstPalette ? {background: firstPalette.canvas, foreground: firstPalette.foreground, accent: firstPalette.accent} : {background: '#07111f', foreground: '#f6f8fb', accent: '#5eead4'},
    beats,
  });
};
