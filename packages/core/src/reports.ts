import {validateDirectorPlan} from './director-validation';
import type {Storyboard, StoryboardBeat} from './schema';
import type {MediaProbe, SrtCue} from './types';

const evidenceStatus = (beat: StoryboardBeat): string => {
  if (beat.structure === 'evidence-panel') return beat.evidence ? `source: ${beat.evidence.label}` : 'missing source';
  if (beat.content.structure === 'metric-odometer') {
    return [...new Set(beat.content.metrics.map((metric) => metric.evidenceStatus))].join(', ');
  }
  return 'not required';
};

export const gateABrief = ({storyboard, probe, cues}: {storyboard: Storyboard; probe: MediaProbe; cues: SrtCue[]}): string => {
  const issues = validateDirectorPlan(storyboard);
  return `# Gate A Brief

- Example: ${storyboard.id}
- Title: ${storyboard.title}
- Source duration: ${probe.duration.toFixed(3)} seconds
- Source video: ${probe.video.codec}, ${probe.video.width}×${probe.video.height}, ${probe.video.fps.toFixed(3)} fps
- Source audio: ${probe.audio ? `${probe.audio.codec}, ${probe.audio.sampleRate} Hz, ${probe.audio.channels} channels` : 'none'}
- SRT cues: ${cues.length}
- Captions mode: ${storyboard.captionsMode}
- Presentation: ${storyboard.presentation ?? 'original V2 layout'}
- Stage beats: ${storyboard.beats.filter((beat) => beat.stage).length}; semantic templates retained
- Visual style mix: ${storyboard.styleMix ? `${storyboard.styleMix.mode}; seed=${storyboard.styleMix.seed}; pool=${storyboard.styleMix.pool.join(', ')}` : 'legacy; original palettes retained'}
- Subject cutout: ${storyboard.source.subject ? `${storyboard.source.subject.type}, ${storyboard.source.subject.frameCount} aligned frames; runtime alpha verification required` : 'not supplied; behind-person interactions remain unavailable until actual aligned alpha frames exist'}
- Gesture observations: ${storyboard.beats.filter((beat) => beat.stage?.gesture).length} beats; speech-only drafts do not claim observed hand actions
- Planned visual beats: ${storyboard.beats.length}
- Distinct semantic structures: ${new Set(storyboard.beats.map((beat) => beat.structure)).size}
- Maximum visual beat: ${Math.max(...storyboard.beats.map((beat) => beat.end - beat.start)).toFixed(3)} seconds
- Director issues: ${issues.length}

Gate A is analysis only. Rendering requires explicit approval for every later gate.
`;
};

export const storyboardMarkdown = (storyboard: Storyboard): string => `# Storyboard

- Style mix: ${storyboard.styleMix ? `${storyboard.styleMix.mode}; seed=${storyboard.styleMix.seed}; pool=${storyboard.styleMix.pool.join(', ')}` : 'legacy'}

| ID | Time | Structure | Visual style / seed / intensity | Why | Placement / stage | Evidence | Copy |
|---|---:|---|---|---|---|---|---|
${storyboard.beats.map((beat) => `| ${beat.id} | ${beat.start.toFixed(3)}–${beat.end.toFixed(3)} | ${beat.structure} | ${beat.visualStyle ? `${beat.visualStyle.id} / ${beat.visualStyle.seed} / ${beat.visualStyle.intensity}` : `legacy / ${beat.palette}`} | ${(beat.reason ?? 'Selected from spoken semantics').replaceAll('|', '\\|')} | ${beat.stage ? `stage x=${beat.stage.x}, y=${beat.stage.y}, w=${beat.stage.width}, h=${beat.stage.height}; ${beat.stage.depth}; alpha=${beat.stage.opacity ?? 1}; surface=${beat.stage.surfaceOpacity ?? 1}; ${beat.stage.interaction ?? 'speech'}${beat.stage.coverSubtitles ? '; keyword handoff only during declared cover windows' : ''}` : beat.placement} | ${evidenceStatus(beat).replaceAll('|', '\\|')} | ${beat.text.replaceAll('|', '\\|')} |`).join('\n')}
`;
