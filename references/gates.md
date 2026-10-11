# Four cumulative gates with revision-bound evidence

By default there are two user approval boundaries: **the complete Gate A plan** and **the reviewed Gate C revision before Gate D export**. B→C is automatic after A approval, not another user checkpoint. A Skill upgrade, urgency, successful tests or approval of an older revision does not authorize a real-video export. An explicit current-job delegation may replace those user review checkpoints with actual agent review, using the bound records below; it never removes Gate C or weakens its checks.

## Gate A — source, inventory and plan

Run without approval flags:

```bash
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite
```

Write `BRIEF.md`, `SOURCE_PROBE.json`, `STORYBOARD.md`, `storyboard.json`, `input-manifest.json` and the workflow binding. Record hashes/media facts, every SRT cue, caption mode, semantic structures, evidence, whole-stage placement/scale/opacity/depth, observed gestures, subtitle handoffs and persisted style assignments.

For a separate lossless source-timeline audio master, composite mode accepts `--audio-master MASTER.wav`. It must have one PCM audio stream and no video. The input manifest records its SHA-256, size, duration, codec, sample rate and channels; all later gate commands must keep the same master. Changing or removing it invalidates the input binding and delegated authorization. Overlay rejects this option because its deliverable has no audio.

Complete the draft `visual-contract.json` using [Enforced workflow](enforced-workflow.md): inspect real source/precomposites, inventory authored/evidence layers, declare each beat's visible feature, motion and stable reading interval, and document any exact user-requested exception. A generated draft is deliberately insufficient for Gate B. After completing/changing it, rerun Gate A to lock the finished plan before presenting it for approval. Do not render review visuals or the final artifact at A.

`WORKFLOW_LEDGER.json` binds the actual inputs, absolute output-directory job ID, storyboard, contract, inventoried asset bytes, renderer/output mode and implementation fingerprint. Re-running A resets approval and delegation records to pending, even when the bytes happen to match. By default show the plan and stop. When the user approves this exact binding, record that genuine confirmation in the generated `USER_APPROVALS.json`; never generate approval text yourself. A genuine current-job delegation uses the separate record below, after the agent actually checks the completed plan.

## Gate B — composition inputs

```bash
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b
```

The A/B flags record requested execution of this approved plan; they are not approval evidence by themselves. The runner checks the ledger, completed visual contract and user approval record before preparing browser-compatible continuous source, props and renderer project. Keep authored graphics in the registered skill paths. No final video.

By default continue directly to C. Add `--gate-b-only` only when the user explicitly requests input preparation alone. Do not ask for approval at the B→C boundary.

## Gate C — real visual and motion evidence

Gate C runs automatically after B; `--approve-gate-c` is accepted for backward compatibility but unnecessary. Generate representative 72%-beat stills, a contact sheet and complete-beat MP4 excerpts for every assigned unique style from the **real composition**. Videos over 30 seconds require eight semantically distinct structures/stills; short videos use their available meaningful beats rather than inventing eight structures.

The report records actual clip/still paths and hashes, current props/public media and the locked revision. `isolatedMotion` also records two real `StageOverlay` frames (or the saved legacy `BeatOverlay`) rendered without source video, presenter or captions, their hashes and RGB pixel difference. Sustained motion is sampled late in its declared active window; completely identical pixels block that claim. Quiet-reading is separately flagged for review. This check detects sampled packaging-layer freezing only; semantic assembly can also change pixels, so it is not proof of motion in the style layer alone, style recognizability or aesthetic quality; see [Enforced workflow](enforced-workflow.md). The generated `VISUAL_REVIEW.json` begins pending. Read [Blocking visual QA](visual-quality-gates.md), actually inspect the clips/frames, then fill each required check and clip review with specific observed evidence. Review failed cases again after repair. Automated metrics, an open file handle or a successful render are not visual acceptance.

By default present the review and its distinguishable-style results to the user, then stop before final export. With a valid current-job delegation, the agent can continue after completing the same actual review and binding its decision. A pending/missing/failed review must remain pending/failed. A thumbnail is not playback and an unviewed file is not reviewed.

## Gate D — current review, explicit final approval, export

```bash
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-d --render
```

Gate D requires complete current visual acceptance and either the user's explicit final approval or a valid current-job delegated agent decision. It validates the existing report/evidence and their hashes before rendering; it does **not** regenerate unseen Gate C material and silently approve it. Missing/stale ledger, contract, approval, report, props/media, clip, still or review blocks export.

Only then render the final artifact, probe/decode it fully, inspect representative frames, and write `RENDER_MANIFEST.json` with hashes/media facts. Composite MP4 adds black-segment detection; overlay MOV requires ProRes 4444, no audio, alpha-capable pixels and sampled alpha variation. Never describe a project, component gallery, contact sheet or preview excerpt as a delivered final video.

## Evidence files and explicit paths

Defaults are under `--out RUN`:

| Default file | Purpose |
|---|---|
| `visual-contract.json` | Completed layer inventory and per-beat planned visibility/motion |
| `WORKFLOW_LEDGER.json` | Hash binding for the approved implementation and inputs |
| `USER_APPROVALS.json` | Actual Gate A and Gate D user confirmations for this binding |
| `GATE_C_REPORT.json` | Actual review evidence plus byte-level hashes |
| `VISUAL_REVIEW.json` | Initially pending checks and per-clip observed acceptance |

Use `--visual-contract PATH`, `--user-approvals PATH` or `--visual-review PATH` only to point to the corresponding real files; changing a path does not bypass their checks. Prefer the generated templates over writing undocumented schemas from memory.

Approval entries under `gateA` and `gateD` record `status:'approved'`, `actor:'user'`, actual `confirmationText`, the real conversation `sourceRef`, ISO `confirmedAt`, and `bindingSha256` copied from the current ledger. The D entry also binds `reportSha256` for the exact reviewed report. Empty text, an agent's plan to obtain approval or invented user quotations are not valid evidence.

The exact approval/review schema is maintained in [`scripts/lib/visual-gates.ts`](../scripts/lib/visual-gates.ts). `VISUAL_REVIEW.json` uses:

- `version:1`, overall `status:'pending'` until complete, then `PASS` only after actual inspection;
- `bindingSha256` and `reportSha256` matching this report/revision;
- actual `reviewer` and ISO `reviewedAt`;
- `checks` keyed by all items below, each with `status` and a concrete `observation`;
- one `clips` entry for every report clip: matching `id`, `styleId`, `fileSha256`, plus `status` and observed `observation`.

The 15 required check keys are:

```text
intentional-occlusion
gesture-alignment
subject-matte-and-depth
card-density
clipping
contrast
semantic-fit
subtitle-keyword-continuity
registered-workflow-no-bypass
style-identity-visible
style-not-palette-only
motion-visible-not-frozen
isolated-style-motion-not-source-motion
stable-content-no-continuous-jitter
varied-composition-not-repeated-static-cards
```

Observations need at least 12 trimmed characters and must describe actual evidence, not just `PASS`/“已检查”. Where no gesture or matte is claimed, record the concrete observed not-applicable reason under that check. A sufficiently long string is only a structural requirement; it cannot establish that someone genuinely watched a clip. Leave unobserved items pending. Software binds records to bytes; the agent remains responsible for truthful review and authentic user confirmation.

## Explicit current-job delegation

This path is opt-in only when the actual human explicitly asks to skip their own review and have the agent review/export this job. Preserve the genuine wording, even if short or in another language; do not infer delegation from urgency or a general “continue”. The tool validates the record structure and binding, not the authenticity or intent of a quotation. The recorder must check the real conversation.

In the generated `USER_APPROVALS.json`, fill `delegation` with:

- `status:'authorized'`, `actor:'user'`;
- `authorizationKind:'explicit-skip-user-review-and-export'`, `scope:'review-and-export-current-job'`;
- exact nonblank `authorizationText`, genuine conversation `sourceRef`, ISO `authorizedAt`;
- `jobId`, `inputManifestSha256`, `renderer`, `outputMode` copied from the current ledger binding.

Then record the agent's real decision under `gateA` / `gateD`: `status:'approved'`, `actor:'agent'`, actual `reviewer`, ISO `reviewedAt`, a concrete `observation` (at least 12 characters), and the current `bindingSha256`. These are agent decisions, not invented user confirmations. Gate D additionally requires `reportSha256` and `visualReviewSha256` for the exact current files; its `reviewer` and `reviewedAt` must match the actual `VISUAL_REVIEW.json`. All 15 checks and every dynamic clip observation must already pass. The runner still validates the complete Gate C evidence and hashes before and after final rendering.

Re-running A resets the template. A changed source/canvas/SRT, another output job, output mode or renderer invalidates the delegation. A modified plan/implementation still requires fresh A and C review bound to that revision, not copied old PASS entries. Re-record the genuine request only while it still applies to that same explicitly authorized task; never use this as permanent blanket authorization.

Reusable opt-in request:

```text
用 $auto-edit-pro 制作这个明确指定的视频项目。每个画面只有一个风格，风格全片只用一次；不足就先调整有效分镜或注册测试新风格。这次不用我验收，你实际完成 A 方案检查、C 所有片段播放和15项审查后直接导出；不跳过证据、不虚构我的验收，不授权其他项目。
```

## Changes and resumed jobs

Any change to source, board, contract, renderer/component implementation or the relevant props/media invalidates the corresponding evidence. Re-establish the Gate A binding/approval for a changed plan or implementation, regenerate C, inspect the replacement evidence and record the valid user or delegated final decision for that review. Do not edit ledger/report hashes merely to carry an earlier acceptance forward.

Saved seeds, pools, assignments and legacy-layout choice are not silently reshuffled or replaced. Renderer fixes may improve content timing and change the implementation fingerprint; they do not modify already rendered video files. A new export must nevertheless satisfy the current contract and review, with a user-requested legacy/custom exception where needed. Old files being readable does not make an old review current.

## Synthetic component examples — separate task

An explicit request for examples authorizes `npm run demo:styles -- --out DEMO_DIR`: three synthetic component MP4 previews covering the original four styles, plus stills/gallery, without user media. Probe/decode the actual previews, inspect and label them synthetic. This is neither real-video Gate C nor Gate D; it does not reuse source approvals. A request only to upgrade this Skill does not request an extra showcase or authorize re-exporting the user's video.
