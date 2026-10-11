---
name: auto-edit-pro
description: Use when packaging talking-head video or SRT into whole-screen motion graphics or a transparent overlay, with reproducible mixed visual styles, registered components and blocking motion review.
---

# 自动剪辑pro

Turn center-presenter talking-head content plus SRT into a reproducible, semantically directed packaging project. Accept SRT-only transparent-overlay or video-plus-SRT composite output. Preserve the source edit and voice; intentional coverage of burned-in captions requires timed keywords and restored subtitle continuity.

## Required workflow for real media

Read [Enforced workflow](references/enforced-workflow.md) before Gate A and [Blocking visual QA](references/visual-quality-gates.md) before Gate C. The supplied `package-video` runner is the delivery path; calling Remotion/FFmpeg directly does not complete a gate.

1. **Gate A — analyze and lock.** Parse/hash the SRT and probe/hash the video. For SRT-only output, lock width, height, fps and duration first. Inventory source media, screenshots, precomposites and every authored graphic layer; declare registered component/style paths and complete the visual contract. Default: Present the plan first. Do not continue until the user approves this exact job and its current binding. The only delegated exception is the explicit current-job review-and-export instruction described below. Silence, urgency, another job's approval, or broad permission is not approval. Gate A remains analysis only.
2. **Gate B — build the approved plan.** Use Remotion by default. Use the HyperFrames adapter only for an explicitly requested legacy presentation/style. Authored titles, prompt cards, step lists and diagrams must remain registered, frame-driven semantic components; do not replace them with PIL/canvas/image-generator raster cards or bake them secretly into the source video. Genuine source screenshots and evidence may remain static. A required custom structure needs registration and tests, or a recorded user-approved exception for that exact layer.
3. **Gate C — inspect the actual composition in motion.** After Gate A approval, automatically prepare B and generate C: representative review stills/contact sheet (eight for videos over 30 seconds) plus real-composition motion clips covering every assigned style. Do not ask for another approval between B and C. Gate C also checks two isolated packaging-layer frames to reject a completely frozen declared motion window; that check includes semantic-component motion and is not proof of the style layer alone or aesthetic acceptance. Inspect the clips and record specific observations in the pending visual-review document; neither code nor the agent may fill `PASS` without actually inspecting the evidence. Any failed, missing, stale or unchecked item blocks Gate D. By default stop before final video; a valid current-job delegation permits the actual reviewer to continue only after all 15 checks pass. Use `--gate-b-only` only when explicitly requested; `--approve-gate-c` remains optional compatibility syntax.
4. **Gate D — final approval, bound review, export.** After the user's final approval of the reviewed revision, or the real agent review under a valid current-job delegation, run the final command with the current approval/review files. It verifies the plan, implementation, inputs and Gate C evidence hashes before rendering; CLI flags alone are not approval or visual acceptance. Verify ffprobe, full decode, representative frames, hashes and manifest. Composite MP4 requires black-frame detection; transparent MOV requires ProRes 4444, no audio, alpha-capable pixels and sampled alpha variation.

The exact commands, review fields, approval evidence and invalidation rules are in [Four gates](references/gates.md). Source/plan/renderer/layer changes require a fresh bound review; never reuse an earlier video's review or fabricate user confirmation.

**Explicit delegated review/export (job-scoped, never a default).** When the user explicitly says, for example, “这次不用我验收，你直接做出来后导出即可”, preserve the exact request and source reference in `USER_APPROVALS.json.delegation`, bound to this job ID, input-manifest hash, renderer and output mode. Record the current Gate A/D decisions with `actor:'agent'` and the actual reviewer; keep the authorizing actor `user`. Never claim the user watched evidence reviewed by the agent. Gate C playback, all 15 checks, per-clip observations and current hashes remain mandatory. Changed inputs/scope or another job invalidate the authorization; re-locking A resets records. See [delegated record fields](references/gates.md#explicit-current-job-delegation).

## Output modes and CLI

- First-time default: `--output-mode composite`, both video and SRT, real presenter/subtitle inspection, `packaged.mp4`.
- Requested alpha output: `--output-mode overlay`, `overlay.mov`. Video is optional, but SRT/width/height/fps must match the edit. SRT-only input gives no evidence of real face position, subtitle height or gestures.
- Optional composite `--audio-master MASTER.wav` identifies one lossless PCM WAV master for the unchanged source timeline. Its exact bytes and audio metadata become part of `input-manifest.json` and the job binding; later removal/replacement invalidates approval. Overlay remains silent. Inventory the master and verify the delivered audio as well as picture; an untracked post-export audio swap does not satisfy the workflow.

```bash
# Gate A only. Complete its pending contract/inventory and rerun A before approval.
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite

# Approved A: B then C; flags accompany recorded approval, not replace it.
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b

# Inputs only, only if explicitly requested: append --gate-b-only to B.
# Final approved revision, after completed current visual review:
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-d --render

# SRT-only Gate A; subsequent gates use the same approval/review contract.
npm run package-video -- --srt INPUT.srt --out RUN --renderer remotion --captions burned-in --output-mode overlay --width 1920 --height 1080 --fps 30
```

## Mixed styles — visible use, not ID counting

New whole-screen-stage plans use `seeded-shuffle` across **71 registered styles**. Select only as many styles as meaningful beats require; do not add beats to exhaust the catalog. Save seed, pool and assignments; reopens and renders do not reshuffle. User-selected pools remain exact; legacy/custom presentation is available only on explicit user request, not as an expedient workaround.

**One scene, one style; every style only once in the entire video.** New plans save `styleMix.usage:'single-use'`. Each beat has exactly one `visualStyle`, with its matching palette; nested component/background style assignments and simultaneous styled beats are rejected. Shuffle the pool once without replacement: no cycling, adjacent repeats or nonadjacent reuse. Pool exhaustion blocks planning: reduce nonessential scenes or first register and test additional styles. A custom pool does not waive uniqueness. Old boards remain readable without reshuffling, but repeated assignments do not authorize a new export; only a genuine, scoped user-requested legacy plan can use the documented legacy exception.

- Original four: `balatro`, `crt-warp`, `cubes`, `hyperspeed`.
- Further original directions: `shape-waves`, `ripple-distortion`, `evil-eye`, `electric-border`, `lightning`, `grid-motion`, `waves`, `metallic-paint`, `circular-carousel`, `micro-slats`, `ghost-fibers`, `acid-squares`, `light-tunnel`, `light-pillar`, `floating-lines`, `grid-scan`, `prismatic-burst`.
- The [React Bits catalog](references/react-bits-catalog.md) adds 50 executable directions: 20 backgrounds, 15 animations and 15 component motifs. `npm run list:styles -- --category components --pool` prints a reusable pool.

Read [Visual style mixing](references/visual-style-mixing.md) for the schema and evidence contract. A style counts as used only when its characteristic geometry/material/motion is visibly identifiable in the actual clip. Merely changing colors, listing IDs, tiny hidden effects or an opaque plate swallowing the effect do not count. Report **registered catalog size**, **assigned unique IDs** and **visually reviewed distinguishable styles** separately; never turn the second number into the third.

Separate stable meaning from decorative motion: text/evidence stay readable; style surfaces retain their intended visible animation. Fix jitter at the offending transform, not by freezing all scene time, clamping all decoration after entry or turning motion graphics into static cards. A matched same-frame hash proves reproducibility, not good motion or style visibility.

These are local original frame-driven interpretations, not redistributed React Bits code or pixel-identical browser widgets. Carousel geometry is abstract unless assets are approved; no effect warps evidence text, captions or the presenter. Saved seeds, pools, assignments and legacy-layout choice are retained without reshuffling. Renderer upgrades may improve content timing and change the implementation fingerprint, requiring a new bound review; existing rendered files are unchanged. `--style-mix legacy` is for explicitly requested legacy work. Reading an old board does not authorize a new export without current checks.

For explicitly requested synthetic component examples, run `npm run demo:styles -- --out DEMO_DIR`: three existing MP4 previews cover the original four styles. Verify and label the actual previews synthetic; this does not approve Gate A or Gate D for any real video. A style-upgrade-only request does not also request presentation examples; use implementation tests without adding a showcase deliverable.

## Semantic structures

Choose by spoken meaning, independently of visual style:

| Registered structure | Meaning contract |
|---|---|
| `editorial-dual-rail` | Two-sided facts, categories or action lists |
| `thesis-and-proof` | Claim plus reason, attribution or proof boundary |
| `bidirectional-flow` | Input/output, human/AI or generate/review loop |
| `command-palette` | Literal operations, checks, approvals or run steps |
| `four-stage-pipeline` | Three or four ordered stages |
| `before-after-scrub` | Exactly two anchored states and one criterion |
| `evidence-panel` | Real approved screenshot/document, source and interpretation |
| `metric-odometer` | One to three attributed/source-backed numbers |
| `signal-route` | Three to five nodes on a traceable path |
| `semantic-doodle` | Subject/action/outcome metaphor, never evidence |

## Non-negotiable visual rules

- Maintain one continuous source video/audio track. Do not silently recut or reorder it, or conceal added packaging inside a precomposite.
- **The whole screen is the stage / 整个屏幕都是特效和组件的舞台.** New work defaults to whole-screen-stage composition. Foreground coverage, translucent overlays, opaque full-screen, surrounding graphics and depth crossings can mix; there is no fixed center exclusion, side-card size cap or forced alternation.
- Deliberate partial or complete face/body coverage is valid; record reason, duration and reveal. Components remain content-fit and readable. Large is permitted, not compulsory; style variation is not a new semantic layout.
- Interaction requires subject, action and consequence. Inspect source frames before claiming real gestures. Real depth uses a synchronized transparent foreground person layer, correct occlusion and inspected matte edges; an opaque/translucent source duplicate is not a cutout.
- Intentional subtitle coverage requires exact timed keywords and restored continuity. Use `burned-in` for burned-in captions; no duplicate caption track, decorative full-subtitle repetition or meaning gap.
- Visual beats normally last 1.6–3.2 seconds and never exceed six seconds. Videos over 30 seconds require at least eight semantically valid structures; no structure more than twice consecutively. Never invent meaning to meet a variety count.
- Evidence needs a real asset and readable attribution; do not invent metrics, logos, testimonials or capabilities. Programmatic line illustrations use explicit SVG `fill="none"` and integrated subject/action/outcome; they do not prove claims.
- Every animation is frame-driven and seek-safe. No live randomness, timers, wall-clock animation, stateful transitions or poster-only substitutions. Same seed/frame reproduces the state, while different frames preserve the intended visible motion.
- Review style continuity frame-by-frame at scene boundaries: one styled scene ends before the next begins; no crossfade of two style backdrops. Text/semantic elements within a scene inherit that scene's one style, rather than each choosing another catalog style.
- Gate C stills at 72% of the beat complement, not replace, manual frame review and motion playback. Check occlusion, gesture/matte alignment, density, clipping, contrast, semantic fit, subtitle continuity and visibly distinct styles. A component gallery, build or contact sheet never proves a final video.

## Focused references

`docs/superpowers/` contains historical plans, not active constraints. Read only the reference needed:

- Workflow enforcement, inventories and review evidence: [enforced-workflow](references/enforced-workflow.md)
- Gate commands and approval boundaries: [gates](references/gates.md)
- Stage size, opacity, interaction and keyword handoffs: [whole-screen-stage](references/whole-screen-stage.md)
- Style pool, visibility and extension: [visual-style-mixing](references/visual-style-mixing.md)
- Blocking visual acceptance: [visual-quality-gates](references/visual-quality-gates.md)
- Meaning and evidence: [director-rules](references/director-rules.md), [visual-structures](references/visual-structures.md)
- Animation/illustration and artifact QA: [motion-and-illustration](references/motion-and-illustration.md), [qa-and-troubleshooting](references/qa-and-troubleshooting.md)
