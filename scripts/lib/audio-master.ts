import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileDigest} from './visual-gates';

export type AudioMasterRecord = {sha256: string; size: number; duration: number; codec: string; sampleRate: number; channels: number};

/** A separately supplied lossless master is an input, not an untracked post-export
 * replacement. This probe records its exact bytes for the job's Gate A binding. */
export const probeAudioMaster = (file: string): AudioMasterRecord => {
  if (!existsSync(file)) throw new Error('Audio master does not exist');
  const result = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=format_name,duration,size:stream=codec_type,codec_name,sample_rate,channels', '-of', 'json', '--', file], {encoding: 'utf8', windowsHide: true}));
  const streams = result.streams ?? [];
  const audio = streams.filter((stream: any) => stream.codec_type === 'audio');
  const format = result.format ?? {};
  if (audio.length !== 1 || streams.some((stream: any) => stream.codec_type === 'video') || format.format_name !== 'wav' || !/^pcm_/.test(audio[0]?.codec_name ?? '')) throw new Error('Audio master must be a WAV with one lossless PCM audio stream and no video');
  const record = {sha256: fileDigest(file), size: Number(format.size), duration: Number(format.duration), codec: audio[0].codec_name as string, sampleRate: Number(audio[0].sample_rate), channels: Number(audio[0].channels)};
  if (![record.size, record.duration, record.sampleRate, record.channels].every(value => Number.isFinite(value) && value > 0)) throw new Error('Audio master metadata must have a positive duration, size, sample rate and channel count');
  return record;
};
