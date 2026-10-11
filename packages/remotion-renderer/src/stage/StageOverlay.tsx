import type {ReactElement} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Stage, Storyboard} from '../../../core/src/schema';
import {PALETTES} from '../../../core/src/palettes';
import {illustrationRegistry} from '../illustrations';
import {structureRegistry} from '../structures';
import {typography} from '../structures/shared';
import {StyleBackdrop, styleMaterial} from '../styles';
import {StageContext} from './context';
import {resolveStageFrame, stageSubtitleClip, stageViewport} from './model';

type Beat = Storyboard['beats'][number];
export const structureProgress = (frame: number, duration: number, fps: number, styled: boolean): number => {
  // Leave a genuine completed-content reading hold. Decorative StyleBackdrop
  // still receives the unmodified frame below; only semantic assembly settles.
  const readingFrames = Math.min(Math.ceil(.8 * fps), Math.ceil(duration * .4));
  const settle = styled ? Math.min(duration - 1, fps * .85, duration - readingFrames) : duration - 1;
  return Math.max(0, Math.min(1, frame / Math.max(1, settle)));
};
export const StageOverlay = ({beat}: {beat: Beat}): ReactElement => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const stage = beat.stage!;
  const pose = resolveStageFrame(stage, frame);
  const physicalWidth = pose.width * width;
  const physicalHeight = pose.height * height;
  const viewport = stageViewport(beat.structure, beat.placement, physicalWidth, physicalHeight);
  const duration = Math.max(1, Math.round((beat.end - beat.start) * fps));
  // Preserve multi-step meaning, then hold completed text for the minimum
  // reading interval. Stage keyframes own entry; style decorations keep moving.
  const progress = structureProgress(frame, duration, fps, Boolean(beat.visualStyle));
  const material = beat.visualStyle ? styleMaterial(beat.visualStyle.id) : undefined;
  const Structure = structureRegistry[beat.structure].Component;
  const Illustration = beat.illustration ? illustrationRegistry[beat.illustration.type] : undefined;
  return <AbsoluteFill data-beat={beat.id} data-stage-depth={pose.depth} style={{clipPath: stageSubtitleClip(stage, frame)}}>
    <div data-stage-geometry="normalized-top-left" style={{
      position: 'absolute', left: pose.x * width, top: pose.y * height,
      width: physicalWidth, height: physicalHeight, opacity: pose.opacity,
      transform: `rotate(${pose.rotation}deg) scale(${pose.scale})`, transformOrigin: '50% 50%',
    }}>
      <div data-stage-visual-style={beat.visualStyle?.id} style={{position: 'absolute', width: viewport.width, height: viewport.height, transform: `scale(${viewport.fit})`, transformOrigin: '0 0', ...(material ? {overflow: 'hidden', borderRadius: material.radius, isolation: 'isolate'} : {})}}>
        {beat.visualStyle && material ? <>
          <style>{`[data-stage-visual-style="${beat.visualStyle.id}"] [data-critical-content] {font-family:${material.fontFamily}!important;letter-spacing:${material.letterSpacing}} [data-stage-visual-style="${beat.visualStyle.id}"] h2 {text-wrap:balance}`}</style>
          {stage.surface !== 'transparent' ? <div data-stage-effect-bounds="stage-only" style={{position: 'absolute', inset: 0, opacity: pose.surfaceOpacity}}>
            <StyleBackdrop style={beat.visualStyle} frame={frame} fps={fps} width={viewport.width} height={viewport.height}/>
          </div> : null}
        </> : null}
        <StageContext.Provider value={{surface: stage.surface, surfaceOpacity: pose.surfaceOpacity, dualRail: beat.structure === 'editorial-dual-rail', visualStyle: beat.visualStyle?.id}}>
          <Structure content={beat.content} progress={progress} palette={PALETTES[beat.palette]} placement={beat.placement}
            evidence={beat.evidence ? {...beat.evidence, src: staticFile(beat.evidence.src)} : undefined} Illustration={Illustration}/>
        </StageContext.Provider>
      </div>
    </div>
  </AbsoluteFill>;
};

export const StageKeyword = ({handoff, paletteId, canvasWidth}: {
  handoff: NonNullable<Stage['captionHandoffs']>[number]; paletteId: Beat['palette']; canvasWidth: number;
}): ReactElement => {
  const palette = PALETTES[paletteId];
  return <div data-caption-handoff={handoff.keyword} style={{
    ...typography, position: 'absolute', zIndex: 30,
    left: `${2 + handoff.x * 96}%`, top: `${2 + handoff.y * 96}%`,
    transform: `translate(-${handoff.x * 100}%, -${handoff.y * 100}%)`,
    maxWidth: '90%', padding: `${canvasWidth * .009}px ${canvasWidth * .018}px`,
    borderRadius: canvasWidth * .009, border: `${Math.max(2, canvasWidth * .002)}px solid ${palette.accent}`,
    background: palette.surface, color: palette.foreground, boxShadow: `0 12px 36px ${palette.canvas}88`,
    fontSize: canvasWidth * .036, lineHeight: 1.18, fontWeight: 950, textAlign: 'center', overflowWrap: 'anywhere',
  }}>{handoff.keyword}</div>;
};
