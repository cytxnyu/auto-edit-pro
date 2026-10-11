# Troubleshooting

## `ffprobe` or `ffmpeg` is not found

Install FFmpeg and ensure both executables are on `PATH`. The CLI deliberately calls executables without a shell-built command to avoid path interpolation problems.

## Remotion downloads a browser on first use

This is expected. Remotion uses a compatible Chrome Headless Shell for deterministic rendering. Later renders reuse the download.

## HEVC source is not visible in Chromium

The CLI creates a continuous H.264/AAC proxy. This is a codec compatibility step, not a recut. Compare durations before accepting the render.

## Source subtitles appear twice

Use `--captions burned-in`. The Skill never assumes burned-in captions automatically because that visual fact must be confirmed.

## Graphic coverage does not match the intended interaction

Deliberate partial, complete or translucent person coverage is valid in whole-screen stage scenes. Check the intended contact, readable meaning, reveal timing and person-layer alignment; adjust stage position/scale/opacity/depth rather than automatically shrinking into side lanes. If essential source UI or subtitles are obscured, provide a readable timed explanation/keyword handoff and restore continuity. Inspect actual frames and motion, not only markup.

## A number looks authoritative without proof

Keep it as an attributed speaker claim or remove the metric treatment. Add an evidence card only with an actual source and readable label.

## HyperFrames check cannot load GSAP

The optional project references the pinned GSAP CDN build. For an offline environment, download that exact file into the project and replace the script URL with the local path before validation.
