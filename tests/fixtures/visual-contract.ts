import type {Storyboard} from '../../packages/core/src/schema';
import type {VisualContract} from '../../packages/core/src/visual-contract';
import {VISUAL_STYLE_IDS} from '../../packages/core/src/visual-styles';

// Test-only synthetic claims. Never use this helper as a real-media approval.
export const readyVisualContractForTest = (board: Storyboard): VisualContract => {
  const custom = Boolean(board.styleMix && board.styleMix.pool.length !== VISUAL_STYLE_IDS.length);
  const legacy = !board.styleMix;
  const contract: VisualContract = {
    version: '1.0', storyboardId: board.id, status: 'ready',
    stylePolicy: {mode: legacy ? 'user-legacy' : custom ? 'user-custom' : 'default-71', ...((custom || legacy) ? {exceptionId: 'test-style-request'} : {})},
    exceptions: custom || legacy ? [{id: 'test-style-request', kind: legacy ? 'legacy-style' : 'custom-style-pool', beatIds: board.beats.map(beat => beat.id), reason: 'Synthetic test explicitly exercises the chosen style policy.', userRequest: {quote: 'Synthetic user requests this exact saved style pool for the fixture.', evidenceRef: 'test-only:style-request'}}] : [],
    sourceAudit: {videoKind: 'raw', inspectedBy: 'test-fixture', inspectionEvidence: 'Synthetic source contains no embedded authored graphics.', embeddedGraphicsAssetIds: []},
    assets: [{id: 'source-video', path: board.source.video, kind: 'source-media', sourceRef: 'Synthetic source fixture, never real-media review evidence.', usage: [{start: 0, end: board.duration}]}],
    beats: board.beats.map((beat, index) => {
      const frames = Math.max(1, Math.round((beat.end - beat.start) * board.fps));
      const startFrame = Math.min(Math.ceil(board.fps * .35), Math.floor(frames * .5));
      return {
        beatId: beat.id, styleId: beat.visualStyle?.id ?? 'legacy',
        visibleFeature: {family: index % 2 ? 'light-field' : 'geometry', description: index % 2 ? 'Distinct animated rays trace the meaning-driven nodes.' : 'Layered geometric units assemble around the spoken subject.', layoutRole: 'Composition supports the semantic structure without replacing its content.', region: {x: .1, y: .05, width: .8, height: .8}, startFrame: 0, endFrame: frames},
        motion: {mechanism: index % 2 ? 'trace' : 'assembly', phase: 'sustained', activeWindows: [{startFrame: 0, endFrame: frames}], decoratedProperty: 'Decorative geometry advances independently of the readable text.', description: 'Seeded scene-local movement continues through the reading hold.', textIndependent: true},
        reading: {startFrame, endFrame: frames, stableText: true, description: 'The content text holds its geometry while the decorative layer moves.'},
        assetIds: [], ...(beat.visualStyle && beat.visualStyle.intensity < .35 ? {lowIntensityReason: 'Source evidence or measured data requires subdued decoration for legibility.'} : {}),
      };
    }),
  };
  board.beats.forEach((beat, index) => {
    if (beat.evidence) {
      const assetId = `evidence-${index}`;
      contract.assets.push({id: assetId, path: beat.evidence.src, kind: 'source-evidence', sourceRef: 'Synthetic evidence fixture with traceable source attribution.', usage: [{start: beat.start, end: beat.end}]});
      contract.beats[index].assetIds.push(assetId);
    }
  });
  return contract;
};
