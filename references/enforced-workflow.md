# Enforced workflow and visible-style contract

Use the supplied `package-video` runner for real jobs. Its checks are a delivery boundary: bypassing the runner, exporting from a different project or supplying a flattened substitute does not satisfy this Skill. This contract fixes two distinct failures: undocumented packaging that bypasses registered components, and declared style variety that is not visible in the final composition.

## 1. Inventory before approval

Inspect the supplied video and SRT, including graphics already baked into the video. Keep an auditable inventory of:

- actual source media and its origin;
- genuine screenshots/evidence, their source and usage intervals;
- every authored title, prompt card, step list, diagram, illustration and decorative asset;
- precomposed media and the authored graphic layers embedded within it.

Source/evidence may be static. Authored text/diagram packaging must use registered semantic structures and frame-driven style implementations in this Skill. Registered semantic structure IDs are checked by the storyboard schema. Track external authored/evidence files in the inventory, with actual existing paths and intended intervals; their bytes are bound to the workflow ledger. If a module itself is listed as an authored asset, give its actual file path. The inventory does not automatically prove that a file was classified truthfully. A custom semantic structure is admitted only after registration, schema/content-contract checks and tests. Otherwise obtain an explicit, layer-scoped user exception before using a static authored card. Do not relabel a rendered card as evidence, use PIL/canvas/exported slides to hide it, or bake it into a base video to disappear from the inventory.

Inventory alone cannot detect a false declaration. Source inspection and the final composed review must verify the declarations. Do not mark input as raw merely because its filename says input/base.

## 2. Fill the generated sidecar, not a self-certificate

Gate A creates `visual-contract.json` as a **draft** when it does not exist. Complete it from actual inspection and design decisions, then rerun Gate A to lock the resulting revision before requesting approval. Leaving a template blank, changing only `status` or copying generic observations is not completion.

The authoritative schema and checks are in [`packages/core/src/visual-contract.ts`](../packages/core/src/visual-contract.ts). The sidecar is separate from the storyboard so old projects remain readable.

| Field | Required meaning |
|---|---|
| `version`, `storyboardId`, `status` | Version `1.0`, this exact board ID, `ready` only after completion |
| `stylePolicy` | `default-71` for new mixed-style work; `user-custom`/`user-legacy` need a matching `exceptionId` |
| `exceptions[]` | `id`, `kind`, scoped `beatIds`, reason, and `userRequest.quote` plus `evidenceRef`; never invented confirmation |
| `sourceAudit` | `videoKind` raw/precomposed, actual `inspectedBy`, concrete `inspectionEvidence`, all `embeddedGraphicsAssetIds` |
| `assets[]` | Unique `id`, real file/component `path`, `kind`, `sourceRef`, usage time windows; static authored cards also need `exceptionId` |
| `beats[]` | One entry per board beat, same ID/style and the declarations below |

Asset kinds are `source-media`, `source-evidence`, `authored-graphic`, `authored-static-card`. Exception kinds are `custom-style-pool`, `legacy-style`, `static-card`, `quiet-motion`. Each exception must cover its actual affected beats. Every authored static card needs its own scoped exception record; multiple records may cite the same genuinely specific user request, but one record cannot silently exempt every card. A broad unrelated approval or another video's approval is not an exception.

### Per-beat fields

All frame windows are relative to that beat, not the global source timeline; asset `usage.start/end` are seconds on the source timeline. Regions use normalized canvas coordinates, not pixels.

- `visibleFeature`: `family`, concrete `description`, `layoutRole`, normalized `region:{x,y,width,height}`, `startFrame/endFrame`. Name the distinguishing geometry, material or motion and where it remains visible **after** content layers are added. A color name or style ID is not a description.
- `motion`: `mechanism`, `phase`, ordered non-overlapping `activeWindows`, actual `decoratedProperty`, `description`, `textIndependent:true`; use `exceptionId` only for a scoped quiet-motion exception.
- `reading`: `startFrame/endFrame`, `stableText:true` and a concrete explanation of what holds still. Animated reading text hidden behind a stable outline is not stable text.
- `assetIds`: every declared asset used by this beat, including its real evidence.
- `lowIntensityReason`: required only when actual intensity is below `0.35`, and only for evidence/data reading where the quieter treatment has a specific reason.

The schema intentionally allows different motion phases. `semantic-completion` may assemble/reveal and then settle; `sustained` must continue into the latter part of the beat. `quiet-reading` is for genuine evidence/data or an explicit user exception, not a blanket static-card mode.

### Mechanical rejection thresholds

These thresholds detect common bypasses, not aesthetic excellence:

- New default work retains the complete registered 71-style pool and whole-screen-stage mode. A short video need not use all 71 styles; shuffle assignments follow meaningful beats. Each beat has exactly one visualStyle and each style is used once globally (`usage:single-use`), including custom pools. No nested style declarations, alternate palette, reused ID or simultaneous styled beats; rendered frame rounding must not create an overlap. Pool exhaustion blocks planning rather than recycling the bag.
- Declared style IDs must match the saved assignments. Every beat needs a visible in-canvas feature and valid frame windows. Stage opacity below `0.25` is rejected; meeting that floor does not prove visibility.
- Intensity below `0.35` needs a source-evidence/data beat and a concrete reading reason. Uniform low intensity is not an acceptable generic design.
- Stable reading lasts at least `min(0.8 seconds, 40% of beat duration)`. This is a floor; long text can still fail actual reading review. For styled stage components, `StageOverlay.structureProgress` now completes semantic assembly no later than `duration - min(ceil(0.8 × fps), ceil(duration × 0.4))`, while `StyleBackdrop` still receives the original frame. This reserves completed-content time rather than freezing decoration. The contract must declare the actually readable window after assembly and before any stage exit/fade/movement; a stage exit must not consume the promised interval. The default timing alone is not a review PASS.
- `none`/`fade` do not count as rich decorative motion except genuine quiet reading or the scoped exception. Declared sustained motion reaches at least 60% of the beat; clamping all decorations at 0.9 seconds is not stabilization.
- Moving an entire stage during its declared reading interval is rejected because it moves its text. Animate the decorative children independently.
- Repeated identical feature/motion/layout declarations under different IDs are rejected in multi-beat default work. Rephrasing the same declaration does not make a repeated visual treatment acceptable to the reviewer.

## 3. Bind approvals to the revision

Gate A locks input hashes, storyboard, visual contract, inventoried asset hashes and implementation fingerprint in `WORKFLOW_LEDGER.json`. Later changes invalidate the corresponding approvals/review. Record actual user confirmations in `USER_APPROVALS.json`; the CLI boolean flags only identify the requested gate. Never generate affirmative user wording to make a command pass.

The default remains user approval at A/D. An explicit current-job instruction to delegate review and export can instead authorize real agent decisions, with the user quotation/source and job/input/mode bound in `delegation`; never imply the user watched those clips. All 15 C checks and byte-level evidence validation still apply. Follow [Gates](gates.md#explicit-current-job-delegation) for exact approval and visual-review fields. In particular, Gate D checks the current Gate C report hash. Rerendering changed clips does not automatically make an old acceptance current.

## 4. Prove visible use with the final composition

Gate C produces actual-composition stills (eight for videos over 30 seconds; available meaningful beats for shorter videos), complete-beat MP4 clips for every assigned unique style, a hashed report and a pending visual-review file. A gallery-only render, isolated effect with no content, screenshot or build log is not substitute evidence.

The reviewer must inspect the actual visuals, including normal-speed entry/hold/exit; record specific observed changes and why the text/evidence remain readable. Inspect every scene and all special occlusion/custom layers. New single-use projects have one clip per scene/style; only an explicitly authorized legacy plan may have repeated treatments, and each materially different use still needs inspection. Reject effects swallowed by opaque plates, tiny decorative fragments and same-layout palette swaps. Separate unsteady text from intentional decorative motion instead of globally stopping animation.

Record registry size, assigned unique ID count, and the number actually reviewed as visibly distinguishable separately. Contract metrics and clip-file counts are automated facts, not the third value. If manual acceptance is pending or inconclusive, keep it pending; never infer `PASS` from a successful render, same-frame hash or differing frame hashes.

### Isolated motion evidence is a freeze detector, not style acceptance

`StyleProof` renders the **actual, unmodified `StageOverlay`** for stage scenes, or the saved legacy **`BeatOverlay`** for legacy scenes, on a fixed background without source video, presenter or captions. Legacy mode does not skip isolation evidence. [`scripts/lib/style-motion-evidence.ts`](../scripts/lib/style-motion-evidence.ts) renders two distinct local frames for the selected style beat, decodes them as 320×180 RGB24 and counts changed pixels. It does not substitute a simplified demo component.

For `sustained` motion, frame selection samples the latter portion (55% and 85%) of the last declared active window; other active phases sample 15% and 85%. This avoids accepting an initial fade as proof that a claimed ongoing effect still moves later. Completely identical compared pixels block the declared active-motion check, even if the source camera, face or captions would have moved in the composite. The two images and their hashes/delta are recorded in `GATE_C_REPORT.json` under `isolatedMotion` and validated with the Gate C evidence. Each item contains `beatId`, `styleId`, `phase`, `status`, two `frames:{localFrame,file,sha256}` entries and `delta:{changedPixels,meanChannelDelta}`. Gate D checks the hashes, exact contract-derived local frames, phase/status and required nonzero delta for active motion.

`quiet-reading` is explicitly marked `quiet-reading-reviewed-separately`; it is not forced to move and does not earn an automatic visual PASS. The existing evidence/exception requirements and manual review still apply.

A nonzero difference proves only that these two sampled packaging frames differ. The isolated layer includes semantic content/assembly as well as decoration; movement of a semantic component can produce that difference, so this is not proof that the style backdrop itself remains animated or recognizable. Tiny motion, unreadable jitter, a generic fade, the wrong visual identity or effects hidden in the final composite can still fail. A zero difference may require correcting an inaccurately declared window or reviewing a periodic effect's sampling; it never justifies falsifying the result. Always complete the real-composition motion review as well.

## 5. Continue old work without silently weakening the gate

An old storyboard keeps its saved seed, pool, assignments and legacy-layout choice without silent reshuffling. It is not a promise of pixel-identical output across renderer versions: corrected content timing can change the implementation fingerprint and require fresh review. Already rendered videos remain unchanged. To export again, inventory the real source/layers, add the current sidecar, record any explicitly requested legacy/custom exception, rerun the current gates and review current evidence. Reading compatibility and approval compatibility are different contracts.

A Skill-update request authorizes Skill implementation/testing, not a new real-video export or unsolicited style-demo deliverable. Do not modify the user's existing video merely to demonstrate that these checks exist.

## Reusable execution prompt

```text
用 $auto-edit-pro 和其 package-video 工作流制作此项目。先检查原片、SRT、已烘焙图文及全部新增层，补全 visual-contract 后锁定 Gate A 供我确认。自制文字卡、提示词和流程组件使用注册路径；真实证据允许静态，自定义或静态卡例外逐项确认。采用完整 71 风格默认池但不凑镜头，每个画面一个风格、风格全片单次使用；池不足则先修订有效分镜或注册测试新风格。文字稳、装饰按各自机制运动，不以整体冻结修抖动。Gate C 给出每个实际分配风格的真实合成运动片段，实际检查后再填写视觉验收；注册数、分配数和可辨识验收数分开报告。任何失败、待验收或哈希变化均返修，最终只在我的该版 Gate D 确认后导出。
```
