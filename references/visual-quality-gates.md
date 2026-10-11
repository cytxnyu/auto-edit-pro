# Blocking visual quality gates

These checks apply to each newly exported real project, including an old saved board. Passing tests, typecheck, renderer execution or pixel-change metrics does not establish visual acceptance. Read [Enforced workflow](enforced-workflow.md) for the bound contract/inventory and [Gates](gates.md) for the pending review files.

## 1. Visible styles, not metadata

Inspect the actual composed clip, with its source, authored layers, reading plates and final opacity/order. For each assigned style, identify its characteristic geometry/material/motion and the region/time where it is visible. Compare all beats: a palette swap or the same rectangle with different faint texture is not distinguishable style use. Enforce one style per scene and globally one occurrence per style; inspect boundaries for no simultaneous style backdrops or hidden nested style.

A style fails when its characteristic effect is hidden by an opaque reading plate, confined to an imperceptible sliver, weakened below recognition, or replaced by a raster screenshot of the component. Never approve a style from a standalone gallery if the final composition covers it. Report three separate quantities: registry size, assigned unique IDs, and styles actually reviewed as visibly distinguishable. The last count requires observed evidence, not a formula based on the first two.

Source footage, genuine screenshots and factual evidence may be static. Authored prompt/title/process cards are packaging and must use registered semantic components. A source video that already contains new authored cards is a precomposite, not a way around the layer inventory or this review.

## 2. Stable text with purposeful motion

Review entry, readable hold and exit in normal-speed playback. Readable hold means typography and factual evidence stop jittering, not that all decorative time stops. Effects and reading layers must be independently controlled; a flow, orbit, sweep, assembly or material change should retain the behavior declared for that beat. Assembly is allowed to finish and settle; not every effect needs perpetual movement.

Reject global `min(frame, ...)`/time clamps, stopped decorative clocks, identical poster holds or fade-only presentation used to claim sustained dynamic style. Diagnose the moving ancestor/transform causing text jitter and repair that layer. Do not reduce all motion or every intensity to zero to make a stable screenshot.

Gate C adds a `StyleProof` isolation check: it renders the actual `StageOverlay` (or saved legacy `BeatOverlay`) alone on a fixed background, excluding source video, presenter and captions. Two frames from the declared active window are compared after RGB decoding; sustained motion is sampled in the window's later portion. Completely identical compared pixels block that motion claim. `quiet-reading` is recorded for separate review rather than forced to animate. The `isolatedMotion` evidence includes the actual frames, hashes and pixel delta. It isolates the complete packaging layer, including semantic assembly; such content motion can create a difference without proving that the style backdrop itself moves or remains recognizable.

Same-seed same-frame reproducibility and different-frame pixel change are useful implementation checks, not proof of readable or meaningful motion. Camera movement, video playback, blinking subtitles and compression noise can change pixels while all graphics remain static. Judge the graphics themselves in their final layering.

## 3. Intentional whole-screen presentation

Judge composition, not preservation of a fixed center lane. Large foreground graphics, translucent face overlap, opaque full-screen, a clear presenter surrounded by graphics, and front/behind crossings are permitted. Record purpose, duration and reveal of coverage. Do not force a universal presenter position or a fixed percentage of screen coverage to manufacture variety.

Real gesture interaction uses observed source frames. Behind-subject effects use aligned transparent person frames; inspect entry, contact, depth-order transition, matte edges and exit. A translucent source duplicate does not pass as depth interaction. If no gesture/depth action is claimed, record a concrete not-applicable reason rather than pretending one was checked.

## 4. Content-fit, meaning and subtitle handoff

Keep headings, items, sources and takeaway readable and related; remove padded empty regions. Big components may cross the center or leave frame during motion, but their reading state must fit. Preserve semantic identities and source meaning; variation in color or style is not a new structure. Dense content needs sufficient reading time even if a minimum machine threshold passes.

Brief subtitle coverage requires an explicit time window and readable keywords carrying that spoken meaning. Inspect entry, handoff and restoration. No duplicate caption layer, meaningless decorative repetition, clipped evidence, false metric or invented asset is acceptable. A semantic doodle illustrates subject/action/outcome; it is not proof.

## 5. Required Gate C evidence

Gate C renders evidence from the current real composition, not a substitute demo:

1. Eight representative stills for videos over 30 seconds, at 72% of selected beats, with timestamps, beat/structure/style/seed and SHA-256, plus a contact sheet built from those exact files. Short videos use available meaningful beats; do not fabricate eight structures.
2. At least one complete-beat MP4 excerpt for **every assigned unique style**, including entry, hold and exit. In new single-use work this means every scene has its own clip. A user-authorized legacy shared treatment with materially different scale, occlusion, custom layers or interaction needs additional inspection; a clean example must not conceal a broken one.
3. Extra contact/depth/keyword frames or excerpts wherever the ordinary selection misses those transitions.
4. A generated evidence report binding the actual clips, stills, isolated packaging-motion frame pairs, props, media and implementation revision; an initially pending review file, never an automatically accepted one.
5. A reviewer who actually opens/plays the evidence, writes concrete observations and records pass/fail for the required dimensions and every clip. Observations name what changed, where/when it was visible and what remained readable. Generic “looks good,” copied statements or invented playback do not count.

Stills cannot replace playback. A clip thumbnail cannot replace playback. If the reviewer has inspected only sampled frames, state that limitation and leave motion acceptance pending rather than asserting that playback passed. Automated rendering success cannot fill human review fields.

## 6. Blocking decision and re-review

The following block Gate D:

- missing inventory, undeclared authored card/precomposite or unauthorized legacy/static-card workaround;
- a repeated style anywhere in a non-legacy video, more than one style inside a scene, or simultaneous styled scenes;
- a style listed in JSON but not recognizably visible in the composed excerpt;
- static/fade-only repeated cards or globally frozen decorations presented as varied motion;
- movement that makes evidence or reading text jitter, swim or become unreadable;
- accidental occlusion, clipping, poor contrast or insufficient reading time;
- visibly wrong gesture contact, matte or depth ordering;
- covered captions with no same-meaning handoff and restoration;
- a structure chosen only for variety, fabricated evidence, or illustration treated as proof;
- an unpersisted/live-random effect that changes on repeated seeks;
- a failed, pending, missing or unverifiable manual check;
- an approval/review/evidence hash that no longer matches the locked revision.

Fix the offending layers, regenerate Gate C, inspect the new evidence and record the valid user approval or explicitly delegated agent decision for that revision. Delegation is limited to the exact authorized job and never permits unobserved PASS entries. Do not reuse rejected stills, copy old `PASS` entries or edit a report hash to disguise changed evidence. Gate D must validate the existing evidence before export; it must not quietly regenerate C and treat the new, unseen files as approved.
