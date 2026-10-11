# Usage

Version 0.7.0: follow the [enforced workflow](../references/enforced-workflow.md) and [current four-gate contract](../references/gates.md). Flags select phases; they are not approval evidence. Explicit current-job delegation still requires actual bound review. Each scene uses one style, and every style is used at most once in a video.

## Install

```bash
git clone https://github.com/cytxnyu/auto-edit-pro.git
cd auto-edit-pro
npm ci
```

Requirements: Node.js 20+, FFmpeg, and ffprobe. The Agent Skill entrypoint is `SKILL.md`.

## Inputs

- one UTF-8 SRT file;
- for composite output, one finished center-presenter talking-head video matching that SRT;
- for SRT-only overlay output, target width, height, and fps (defaults: 1920×1080, 30fps);
- caption mode: `burned-in`, `none`, or `generated`;
- renderer: `remotion` by default, or `hyperframes` for compatible project output;
- a writable output directory.

New scenes use the whole screen as a stage, with free size/position/opacity and deliberate person occlusion. Use synchronized transparent person frames for depth interaction and timed keyword handoffs for briefly covered captions. See ../references/whole-screen-stage.md. Legacy no-stage storyboards retain their saved layout.

The Skill does not repair repeated lines, missing lines, breaths, long pauses, or edit mistakes. Finish the talking-head edit and re-export its matching SRT before packaging.

## Output modes

- `--output-mode composite` is the recommended default. It requires `--video` and `--srt`, then outputs `renders/packaged.mp4` with the original picture, audio, and graphics combined.
- `--output-mode overlay` accepts SRT without video and outputs a silent `renders/overlay.mov` as ProRes 4444 with Alpha. Supply `--width`, `--height`, and `--fps` when they differ from 1920×1080/30. SRT-only mode cannot verify the real face or burned-in subtitle position. Gate D checks that sampled Alpha values actually vary instead of trusting the pixel-format name alone.

Use `--captions burned-in` when the source edit already contains visible subtitles, `--captions generated` when the rendered package must add subtitles, and `--captions none` when no subtitle layer is wanted.

## Gate A — plan only

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in
```

Outputs: `BRIEF.md`, `SOURCE_PROBE.json`, `STORYBOARD.md`, `storyboard.json`, and `input-manifest.json`. Review and approve this exact plan before continuing.

## Gate B to C — build inputs and automatically generate review evidence

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --approve-gate-a --approve-gate-b
```

The A/B flags record execution authorized by approval of this job's Gate A plan, not two human approval requests. This may create a continuous H.264/AAC proxy for browser-incompatible codecs. Once Gate B inputs are ready, it automatically generates Gate C review stills and a contact sheet without requesting a separate B-to-C approval. It does not render the final MP4.

## Optional Gate B only

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --approve-gate-a --approve-gate-b --gate-b-only
```

Use this only when the user explicitly requests input preparation without review stills. The default B-to-C path generates eight review stills and a contact sheet from eight distinct semantic structures. The legacy `--approve-gate-c` flag remains accepted but is optional. Review the evidence, then wait for explicit Gate D approval.

## Gate D — final render

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --approve-gate-a --approve-gate-b --approve-gate-d --render
```

Only explicit Gate D approval plus `--render` authorizes final export; B or C completion alone does not. Gate D renders H.264/AAC, performs full decode and black-frame checks, extracts eight representative frames, builds a contact sheet, and writes `RENDER_MANIFEST.json`.

## Optional HyperFrames output

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer hyperframes --captions burned-in --approve-gate-a --approve-gate-b --gate-b-only
npx hyperframes@0.7.99 lint ./run/hyperframes
npx hyperframes@0.7.99 check ./run/hyperframes --snapshots
```

The adapter preserves the same ten semantic identifiers and seek-safe absolute timeline. Gate C review stills and Gate D rendering use the default Remotion path.

## Caption modes

- `burned-in`: keep existing source captions and generate no duplicate layer.
- `none`: render no caption layer.
- `generated`: render captions from the SRT.

## Evidence

Only use `evidence-panel` when an approved image exists. Include `src`, `label`, and optional `sourceUrl`. If the source is missing, use `thesis-and-proof` and keep the statement attributed. A semantic doodle is explanatory, never evidentiary.
