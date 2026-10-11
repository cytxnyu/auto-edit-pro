import type {ReactElement} from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Storyboard} from '../../core/src/schema';
import {PALETTES} from '../../core/src/palettes';
import type {SrtCue} from '../../core/src/types';
import {illustrationRegistry} from './illustrations';
import {structureRegistry} from './structures';
import {StageOverlay, StageKeyword} from './stage/StageOverlay';
import {activeCaptionHandoff, resolveStageFrame, subjectFramePath} from './stage/model';

export type VideoPackagingProps = {
  storyboard: Storyboard;
  overlayOnly?: boolean;
  cues?: SrtCue[];
};
export const buildCompositionPlan = ({storyboard, overlayOnly = false, cues = []}: VideoPackagingProps) => {
  const durationInFrames = Math.round(storyboard.duration * storyboard.fps);
  return {
    durationInFrames,
    background: overlayOnly ? 'transparent' : storyboard.theme.background,
    videoTracks: overlayOnly ? [] : [{src: storyboard.source.video, from: 0, durationInFrames, audio: true}],
    captionTracks: storyboard.captionsMode === 'generated' ? cues : [],
    overlays: storyboard.beats.map((beat) => ({
      ...beat,
      from: Math.round(beat.start * storyboard.fps),
      durationInFrames: Math.max(1, Math.round((beat.end - beat.start) * storyboard.fps)),
      safeZone: structureRegistry[beat.structure].safeZone,
    })),
  };
};

export const BeatOverlay = ({beat}: {beat: Storyboard['beats'][number]}): ReactElement => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const duration = Math.max(1, Math.round((beat.end - beat.start) * fps));
  const progress = Math.max(0, Math.min(1, frame / Math.max(1, duration - 1)));
  const definition = structureRegistry[beat.structure];
  const Structure = definition.Component;
  const palette = PALETTES[beat.palette];
  const Illustration = beat.illustration ? illustrationRegistry[beat.illustration.type] : undefined;
  const evidence = beat.evidence ? {...beat.evidence, src: staticFile(beat.evidence.src)} : undefined;

  return (
    <AbsoluteFill data-beat={beat.id} data-safe-zone={definition.safeZone}>
      <Structure
        content={beat.content}
        progress={progress}
        palette={palette}
        placement={beat.placement}
        evidence={evidence}
        Illustration={Illustration}
      />
    </AbsoluteFill>
  );
};

const GeneratedCaptions = ({cues}: {cues: SrtCue[]}): ReactElement => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const cue = cues.find((item) => item.start <= time && item.end > time);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 52}}>
      {cue ? <div style={{maxWidth: 1450, padding: '12px 22px', borderRadius: 12, color: '#fff', background: 'rgba(2,8,23,.78)', font: '800 44px/1.3 "Microsoft YaHei", system-ui', textAlign: 'center'}}>{cue.text}</div> : null}
    </AbsoluteFill>
  );
};

const StageVideoPackaging = ({storyboard, overlayOnly = false, cues = []}: VideoPackagingProps): ReactElement => {
  const frame = useCurrentFrame();
  const plan = buildCompositionPlan({storyboard, overlayOnly, cues});
  const active = plan.overlays.find((beat) => frame >= beat.from && frame < beat.from + beat.durationInFrames);
  const localFrame = active ? frame - active.from : 0;
  const pose = active?.stage ? resolveStageFrame(active.stage, localFrame) : undefined;
  const handoff = active?.stage ? activeCaptionHandoff(active.stage, localFrame) : undefined;
  const behind = pose?.depth === 'behind-subject';
  if (behind && !storyboard.source.subject) throw new Error('Behind-subject stage requires an aligned transparent PNG subject sequence');
  const renderBeat = (beat: (typeof plan.overlays)[number]) => <Sequence key={beat.id} from={beat.from} durationInFrames={beat.durationInFrames} premountFor={storyboard.fps}>
    {beat.stage ? <StageOverlay beat={beat}/> : <BeatOverlay beat={beat}/>}
  </Sequence>;
  return <AbsoluteFill data-presentation="whole-screen-stage" style={{background: plan.background, isolation: 'isolate'}}>
    {overlayOnly ? null : <Video src={staticFile(storyboard.source.video)} style={{width: '100%', height: '100%'}} objectFit="cover" disallowFallbackToOffthreadVideo/>}
    {handoff && active ? <div data-subtitle-cover="authorized-window" style={{position: 'absolute', left: 0, right: 0, top: '82%', bottom: 0, background: PALETTES[active.palette].canvas}}/> : null}
    {behind && active ? renderBeat(active) : null}
    {behind && storyboard.source.subject ? <Img data-subject-alpha="source-aligned" src={staticFile(subjectFramePath(storyboard.source.subject, frame))} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/> : null}
    {plan.overlays.filter((beat) => !(behind && beat.id === active?.id)).map(renderBeat)}
    {storyboard.captionsMode === 'generated' && !handoff ? <GeneratedCaptions cues={cues}/> : null}
    {handoff && active ? <StageKeyword handoff={handoff} paletteId={active.palette} canvasWidth={storyboard.width}/> : null}
  </AbsoluteFill>;
};

export const VideoPackaging = (props: VideoPackagingProps): ReactElement => {
  const {storyboard, overlayOnly = false, cues = []} = props;
  if (storyboard.beats.some((beat) => beat.stage)) return <StageVideoPackaging {...props}/>;
  const plan = buildCompositionPlan(props);
  return (
    <AbsoluteFill style={{backgroundColor: plan.background}}>
      {!overlayOnly ? <Video src={staticFile(storyboard.source.video)} style={{width: '100%', height: '100%'}} objectFit="cover" disallowFallbackToOffthreadVideo/> : null}
      {plan.overlays.map((beat) => <Sequence key={beat.id} from={beat.from} durationInFrames={beat.durationInFrames} premountFor={storyboard.fps}><BeatOverlay beat={beat}/></Sequence>)}
      {storyboard.captionsMode === 'generated' ? <GeneratedCaptions cues={cues}/> : null}
    </AbsoluteFill>
  );
};
