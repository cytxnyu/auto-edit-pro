import type {ReactElement} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Storyboard} from '../../core/src/schema';
import {StageOverlay} from './stage/StageOverlay';
import {BeatOverlay} from './VideoPackaging';

export type StyleProofProps = {storyboard: Storyboard; beatId: string};
/** Render the unmodified packaging layer on a fixed background. Recorded video,
 * presenter motion and captions cannot satisfy the motion-evidence check. */
export const StyleProof = ({storyboard, beatId}: StyleProofProps): ReactElement => {
  const beat = storyboard.beats.find(item => item.id === beatId);
  if (!beat) throw new Error(`StyleProof requires a saved beat: ${beatId}`);
  return <AbsoluteFill style={{background: '#07101f'}}>{beat.stage ? <StageOverlay beat={beat}/> : <BeatOverlay beat={beat}/>}</AbsoluteFill>;
};
