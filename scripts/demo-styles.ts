import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {STYLE_DEMOS, styleDemoStoryboard, type StyleDemoIndex} from '../packages/remotion-renderer/src/StyleDemos';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out' || !args[1])) throw new Error('Usage: npm run demo:styles -- --out OUTPUT_DIRECTORY');
const root = resolve(import.meta.dirname, '..');
const skillVersion: string = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const out = resolve(args[1] ?? join(root, 'examples', 'style-demos', 'rendered'));
mkdirSync(out, {recursive: true});
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const run = (command: string, values: string[]) => {
  const result = spawnSync(command, values, {encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024});
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}: ${result.stderr}`);
  return {stdout: result.stdout, stderr: result.stderr, exitCode: result.status};
};
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? (process.platform === 'win32'
  ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  : undefined);
const serveUrl = await bundle({entryPoint: join(root, 'packages/remotion-renderer/src/index.ts'), publicDir: null});
const browser = await openBrowser('chrome', {browserExecutable, logLevel: 'error'});
const rendered = [];
try {
  for (const [index, demo] of STYLE_DEMOS.entries()) {
    const inputProps = {demoIndex: index as StyleDemoIndex};
    const storyboard = styleDemoStoryboard(index as StyleDemoIndex);
    writeFileSync(join(out, `${demo.file}.storyboard.json`), JSON.stringify(storyboard, null, 2));
    const composition = await selectComposition({serveUrl, id: demo.id, inputProps, puppeteerInstance: browser});
    const stills = [];
    for (const [sample, frame] of [30, 86, 129, 171, 30, 129].entries()) {
      const file = `${demo.file}-f${frame}${sample >= 4 ? '-repeat' : ''}.png`;
      await renderStill({serveUrl, composition, inputProps, frame, output: join(out, file), puppeteerInstance: browser, logLevel: 'error'});
      // Exclude the changing footer/progress bar from component-motion evidence.
      const componentSha256 = run('ffmpeg', ['-v', 'error', '-i', join(out, file), '-vf', 'crop=1200:440:40:110', '-f', 'hash', '-hash', 'sha256', '-']).stdout.trim();
      stills.push({frame, file, sha256: hash(join(out, file)), componentSha256});
    }
    if (stills[0].sha256 !== stills[4].sha256 || stills[2].sha256 !== stills[5].sha256) throw new Error(`${demo.id}: repeated out-of-order frame differs`);
    if (stills[0].componentSha256 === stills[1].componentSha256 || stills[2].componentSha256 === stills[3].componentSha256) throw new Error(`${demo.id}: expected component-area animation in both halves`);
    const video = `${demo.file}.mp4`;
    await renderMedia({serveUrl, composition, inputProps, codec: 'h264', outputLocation: join(out, video),
      puppeteerInstance: browser, concurrency: 2, muted: true, crf: 19, logLevel: 'error'});
    const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', join(out, video)]).stdout);
    const stream = probe.streams.find((s: {codec_type: string}) => s.codec_type === 'video');
    if (!stream || stream.width !== 1280 || stream.height !== 720 || stream.r_frame_rate !== '30/1' || Number(stream.nb_frames) !== 180 || Math.abs(Number(probe.format.duration) - 6) > .04) throw new Error(`${video}: wrong dimensions, fps, frame count or duration`);
    if (probe.streams.some((s: {codec_type: string}) => s.codec_type === 'audio')) throw new Error(`${video}: silent fixture unexpectedly contains audio`);
    run('ffmpeg', ['-v', 'error', '-i', join(out, video), '-f', 'null', '-']);
    const black = run('ffmpeg', ['-hide_banner', '-i', join(out, video), '-vf', 'blackdetect=d=0.1:pix_th=0.05', '-an', '-f', 'null', '-']);
    if (/black_start:/.test(black.stderr)) throw new Error(`${video}: detected black segment`);
    const result = {id: demo.id, title: demo.title, file: video, poster: stills[2].file, styles: demo.styleIds,
      sha256: hash(join(out, video)), width: stream.width, height: stream.height, fps: 30, frames: 180, duration: 6,
      fullDecodeExit: 0, blackSegments: 0, audioTracks: 0, repeatedFrameMatches: true, repeatedFrames: [30, 129], componentMotionBothHalves: true, stills};
    rendered.push(result);
    console.log(`DEMO_OK ${video} 1280x720 30fps 6s 180frames decode=0 repeatedFrame=true`);
  }
} finally {
  await browser.close({silent: true});
}
const manifest = {kind: 'synthetic-component-previews-not-packaged-source-video', version: skillVersion, deterministic: true,
  implementation: 'Local frame-driven visual interpretations of the linked style references; no React Bits source embedded.',
  samples: rendered};
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
const cards = rendered.map((demo, index) => `<article><div class="eyebrow">0${index + 1} / ${demo.styles.join(' + ')}</div><h2>${demo.title}</h2><video controls playsinline loop muted preload="metadata" poster="${demo.poster}" src="${demo.file}"></video><p>${index === 1 ? '前半段 CRT 扫描，后半段 Cubes 方块：同一段内容内切换风格。' : index === 0 ? '液态纹理承载大标题与解释，观察纹理流动和文字入场。' : '向消失点收束的光轨承载输入、执行、验证路径。'}</p><div class="meta">6 秒 · 1280 × 720 · 30 fps · 点击播放</div></article>`).join('');
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auto Edit Pro · 多风格组件</title><style>*{box-sizing:border-box}body{margin:0;background:#0c0e12;color:#efede8;font-family:"Microsoft YaHei",system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:52px 32px}header{border-bottom:1px solid #31343b;padding-bottom:28px;margin-bottom:36px}.eyebrow{font-size:12px;letter-spacing:.12em;color:#d3c3ae;text-transform:uppercase}h1{font-size:clamp(28px,4vw,48px);letter-spacing:-.045em;line-height:1.2;margin:14px 0}header p{color:#adb1bc;max-width:760px;line-height:1.7}.grid{display:grid;grid-template-columns:1fr;gap:40px}article{min-width:0}h2{font-size:23px;margin:9px 0 18px}video{width:100%;aspect-ratio:16/9;display:block;background:#0a0c11;border:1px solid #292d35;border-radius:12px}article p{line-height:1.65;color:#bfc3cd;margin-bottom:7px}.meta{font-size:12px;color:#8f98a7}footer{margin-top:42px;padding-top:23px;border-top:1px solid #31343b;color:#8f98a7;font-size:13px;line-height:1.8}a{color:#d1def7}@media(min-width:1080px){.grid{grid-template-columns:1fr 1fr}.grid article:first-child{grid-column:1/-1;max-width:100%}}@media(max-width:500px){main{padding:28px 16px}}button{background:#efede8;color:#11151c;border:0;border-radius:6px;padding:10px 17px;font:inherit;cursor:pointer;margin-right:8px}</style></head><body><main><header><div class="eyebrow">AUTO EDIT PRO / STYLE SYSTEM ${skillVersion}</div><h1>同一个视频，可以不止一种气质。</h1><p>四种已接入的逐帧风格，三个真实动态组件。这里是无口播的合成示例，使用升级后的同一套渲染组件；不是原片成片。</p><button id="play">依次播放</button><button id="pause">全部暂停</button></header><section class="grid">${cards}</section><footer>随机编排：场景级洗牌 · 固定种子可复现 · 配色与材质一起变化 · 语义结构保持独立<br>参考：<a href="https://reactbits.dev/backgrounds/balatro">Balatro</a> / <a href="https://reactbits.dev/backgrounds/crt-warp">CRT Warp</a> / <a href="https://reactbits.dev/animations/cubes">Cubes</a> / <a href="https://reactbits.dev/backgrounds/hyperspeed">Hyperspeed</a><br>组件为本地逐帧视觉实现；<a href="manifest.json">渲染与验证记录</a></footer></main><script>const videos=[...document.querySelectorAll('video')];videos.forEach(v=>v.addEventListener('play',()=>videos.filter(x=>x!==v).forEach(x=>x.pause())));document.getElementById('play').onclick=()=>{videos.forEach(v=>{v.loop=false;v.pause();v.currentTime=0});videos.forEach((v,i)=>v.onended=()=>{if(videos[i+1]){videos[i+1].scrollIntoView({behavior:'smooth',block:'center'});videos[i+1].play()}});videos[0].scrollIntoView({behavior:'smooth',block:'center'});videos[0].play()};document.getElementById('pause').onclick=()=>videos.forEach(v=>v.pause());</script></body></html>`);
console.log(`GALLERY_OK ${join(out, 'index.html')}`);
