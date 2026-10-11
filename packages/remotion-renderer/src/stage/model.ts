import type {Stage, StageRegion, SubjectSequence} from '../../../core/src/schema';

export const numericStageKeys = ['x', 'y', 'width', 'height', 'scale', 'rotation', 'opacity', 'surfaceOpacity'] as const;
type NumericStageKey = (typeof numericStageKeys)[number];
export type StageFrame = Record<NumericStageKey, number> & {depth: Stage['depth']};
const defaults = {scale: 1, rotation: 0, opacity: 1, surfaceOpacity: 1};

/** Sparse numeric tracks interpolate independently; depth changes exactly on its keyframe. */
export const resolveStageFrame = (stage: Stage, frame: number): StageFrame => {
  const resolved = {...defaults, ...stage} as StageFrame;
  for (const key of numericStageKeys) {
    const points = [{frame: 0, value: stage[key] ?? defaults[key as keyof typeof defaults]}];
    for (const point of stage.keyframes ?? []) {
      if (point[key] !== undefined) {
        if (point.frame === 0) points[0] = {frame: 0, value: point[key]!};
        else points.push({frame: point.frame, value: point[key]!});
      }
    }
    let value = points[0].value;
    for (let i = 1; i < points.length; i++) {
      const left = points[i - 1];
      const right = points[i];
      if (frame >= right.frame) value = right.value;
      else {
        const t = Math.max(0, Math.min(1, (frame - left.frame) / (right.frame - left.frame)));
        value = left.value + (right.value - left.value) * t;
        break;
      }
    }
    resolved[key] = value;
  }
  resolved.depth = stage.depth;
  for (const keyframe of stage.keyframes ?? []) {
    if (keyframe.frame <= frame && keyframe.depth) resolved.depth = keyframe.depth;
  }
  return resolved;
};

export const activeCaptionHandoff = (stage: Stage, frame: number) =>
  stage.coverSubtitles ? stage.captionHandoffs?.find((h) => frame >= h.startFrame && frame < h.endFrame) : undefined;

export const stageSubtitleClip = (stage: Stage, frame: number): string =>
  activeCaptionHandoff(stage, frame) ? 'inset(0 0 0 0)' : 'inset(0 0 18% 0)';

export const subjectFramePath = (subject: SubjectSequence, globalFrame: number): string => {
  if (!Number.isInteger(globalFrame) || globalFrame < 0 || globalFrame >= subject.frameCount) {
    throw new Error(`Subject sequence has no aligned source frame ${globalFrame}`);
  }
  return subject.pattern.replace('{frame}', String(globalFrame).padStart(6, '0'));
};

/** Physical rectangle becomes a proportionate design viewport, not the old safe-gap canvas. */
export const stageViewport = (structure: string, placement: string, width: number, height: number) => {
  // Stage-specific layouts use physical typography and container-relative spacing.
  // Retain the call shape for legacy boards, but never shrink 40px semantic text
  // through a 1920px virtual canvas merely because a presenter occupies the right.
  void structure; void placement;
  return {width, height, fit: 1};
};

/** Regions remain static within the stage; only the outer stage pose animates. */
export const isFullStageRegion = (region?: StageRegion): boolean => !region ||
  (region.x === 0 && region.y === 0 && region.width === 1 && region.height === 1);

/** Return physical pixels without a design-canvas scale or typography shrink. */
export const stageRegionRect = (region: StageRegion | undefined, width: number, height: number) => ({
  left: (region?.x ?? 0) * width,
  top: (region?.y ?? 0) * height,
  width: (region?.width ?? 1) * width,
  height: (region?.height ?? 1) * height,
});
