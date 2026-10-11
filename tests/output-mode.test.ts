import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {selectDynamicBeats} from '../scripts/lib/visual-gates';
import {buildMasterAudioMuxArgs, buildOverlayFfmpegArgs, buildOverlaySequenceFlags, buildRemotionOutputFlags, resolveOutputMode, syntheticOverlayProbe} from '../scripts/lib/output-mode';

const cues = [
  {index: 1, start: 0, end: 2.4, text: '第一句'},
  {index: 2, start: 2.5, end: 7.25, text: '第二句'},
];

describe('packaging output modes', () => {
  it('defaults to composite and requires a source video', () => {
    expect(resolveOutputMode({}, 'input.mp4')).toBe('composite');
    expect(() => resolveOutputMode({'output-mode': 'composite'}, undefined)).toThrow(/requires --video/i);
    expect(resolveOutputMode({'output-mode': 'composite'}, 'input.mp4')).toBe('composite');
  });

  it('allows SRT-only overlay rendering with explicit canvas defaults', () => {
    expect(resolveOutputMode({'output-mode': 'overlay'})).toBe('overlay');
    expect(syntheticOverlayProbe({cues, width: 1920, height: 1080, fps: 30})).toEqual({
      duration: 7.25,
      size: 0,
      video: {codec: 'transparent-canvas', width: 1920, height: 1080, fps: 30},
      audio: null,
    });
  });

  it('rejects unknown modes and invalid canvas settings', () => {
    expect(() => resolveOutputMode({'output-mode': 'unknown'}, 'input.mp4')).toThrow(/output-mode/i);
    expect(() => syntheticOverlayProbe({cues, width: 0, height: 1080, fps: 30})).toThrow(/width/i);
  });

  it('renders overlays as silent ProRes 4444 Alpha assets', () => {
    expect(buildRemotionOutputFlags('overlay')).toEqual([
      '--codec', 'prores',
      '--prores-profile', '4444',
      '--pixel-format', 'yuva444p10le',
      '--image-format', 'png',
      '--muted',
    ]);
    expect(buildRemotionOutputFlags('composite')).toEqual(['--codec', 'h264', '--crf', '14', '--image-format', 'png', '--pixel-format', 'yuv420p', '--color-space', 'bt709']);
    expect(buildOverlaySequenceFlags()).toEqual(['--sequence', '--image-format', 'png', '--image-sequence-pattern', 'frame-[frame].[ext]', '--muted']);
    expect(buildOverlayFfmpegArgs({sequenceDir: 'C:/frames', output: 'C:/out/overlay.mov', fps: 30, totalFrames: 1478})).toEqual([
      '-y', '-v', 'error', '-framerate', '30', '-start_number', '0',
      '-i', join('C:/frames', 'frame-%04d.png'), '-an',
      '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le',
      '-threads', '1', '-filter_threads', '1', '-filter_complex_threads', '1',
      'C:/out/overlay.mov',
    ]);
  });
});

it('muxes the bound lossless audio master only once without transcoding the video', () => {
  expect(buildMasterAudioMuxArgs({video: 'silent.mp4', audioMaster: 'voice.wav', output: 'out.mp4', duration: 12700/60})).toEqual([
    '-y', '-v', 'error', '-i', 'silent.mp4', '-i', 'voice.wav', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', String(12700/60), '-movflags', '+faststart', 'out.mp4',
  ]);
  expect(() => buildMasterAudioMuxArgs({video: 'a', audioMaster: 'b', output: 'c', duration: NaN})).toThrow(/positive/);
});

it('does not add the following style frame through floating-point clip rounding', () => {
  const selection = selectDynamicBeats({duration: 211.666667, fps: 60, beats: [{id: 'last', start: 207.7666666667, end: 211.666667, visualStyle: {id: 'cubes'}}]} as any);
  expect(selection[0]).toMatchObject({startFrame: 12466, endFrame: 12699});
});
