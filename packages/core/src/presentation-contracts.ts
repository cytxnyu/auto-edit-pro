import type {SemanticStructure} from './template-contracts';

export type PresentationMode = 'presenter-safe' | 'opaque-full-screen' | 'whole-screen-stage' | 'adaptive';

export const PRESENTATION_MODE_BY_STRUCTURE: Record<SemanticStructure, PresentationMode> = {
  'editorial-dual-rail': 'presenter-safe',
  'thesis-and-proof': 'adaptive',
  'bidirectional-flow': 'opaque-full-screen',
  'command-palette': 'presenter-safe',
  'four-stage-pipeline': 'opaque-full-screen',
  'before-after-scrub': 'opaque-full-screen',
  'evidence-panel': 'opaque-full-screen',
  'metric-odometer': 'presenter-safe',
  'signal-route': 'opaque-full-screen',
  'semantic-doodle': 'opaque-full-screen',
};

export const resolvePresentationMode = (
  structure: SemanticStructure,
  placement: 'left' | 'right' | 'full',
  stage?: object,
): Exclude<PresentationMode, 'adaptive'> => {
  if (stage) return 'whole-screen-stage';
  const mode = PRESENTATION_MODE_BY_STRUCTURE[structure];
  if (mode !== 'adaptive') return mode;
  return placement === 'full' ? 'opaque-full-screen' : 'presenter-safe';
};
