# React Bits 扩展随机池：本次新增 50 项

## 使用范围

当前版本 0.7.0：**21 项原有实现 + 50 项新增实现 = 71 项可执行风格，77 套配色（含 6 套 legacy 配色）**。本次新增涵盖 20 项背景、15 项动画、15 项组件；全部加入默认 `seeded-shuffle` 池，在同一视频按语义场景分配。单场只用一个风格、全片不重复，池不足时阻断而不循环补袋；保存 seed、pool、每段 visualStyle 后，回看和导出不重新抽签。短视频只用实际需要的项，不为展示目录增加镜头。

参考入口：[React Bits 官方索引](https://reactbits.dev/get-started/index)。这是一组**本地原创视频视觉改编**：提取视觉机制，再以 SVG、frame/fps 和固定种子实现；不是复制或安装上游源码、逐像素复刻网页、嵌入网站，也不是 50 个完整可点击的 Web 控件。上游 hover、click、scroll 或物理状态在视频中改为确定性编排。动画和组件方向提供抽象装饰几何与真实语义组件的配色/边框/阴影；台词对应的十种语义结构不被随机组件替换。

标题、正文、来源、数字与字幕维持独立阅读层；抽象卡片、图标和节点不代表事实/指标/真实操作已发生。默认不新增照片、logo、截图或真实素材。透明舞台不自动加上不透明背景；强度降低不等于自动通过可读性验收。

## 提取清单与本地适配

每项已核对官方源文件，原始机制与改编差异分别记录在 [背景 JSON](catalog-backgrounds.json)、[动画 JSON](catalog-animations.json)、[组件 JSON](catalog-components.json)。下表为中文速查；原有 21 项见 [风格混合](visual-style-mixing.md)。

### 背景 · 新增 20

| ID / 官方参考 | 本地视频方向 | 上游机制核对 |
|---|---|---|
| `aurora` / [Aurora](https://reactbits.dev/backgrounds/aurora) | 极光色幕与细束光线 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Aurora/Aurora.jsx) |
| `soft-aurora` / [SoftAurora](https://reactbits.dev/backgrounds/soft-aurora) | 宽带柔光极光 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/SoftAurora/SoftAurora.jsx) |
| `silk` / [Silk](https://reactbits.dev/backgrounds/silk) | 丝绸折面与游动高光 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Silk/Silk.jsx) |
| `iridescence` / [Iridescence](https://reactbits.dev/backgrounds/iridescence) | 虹彩干涉等高线 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Iridescence/Iridescence.jsx) |
| `orb` / [Orb](https://reactbits.dev/backgrounds/orb) | 空心能量球与呼吸边缘 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Orb/Orb.jsx) |
| `galaxy` / [Galaxy](https://reactbits.dev/backgrounds/galaxy) | 分层星野与旋臂 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Galaxy/Galaxy.jsx) |
| `particles` / [Particles](https://reactbits.dev/backgrounds/particles) | 视差漂浮粒子 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Particles/Particles.jsx) |
| `beams` / [Beams](https://reactbits.dev/backgrounds/beams) | 平行光平面 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Beams/Beams.jsx) |
| `light-rays` / [LightRays](https://reactbits.dev/backgrounds/light-rays) | 单光源放射光线 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/LightRays/LightRays.jsx) |
| `pixel-snow` / [PixelSnow](https://reactbits.dev/backgrounds/pixel-snow) | 下落像素雪 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/PixelSnow/PixelSnow.jsx) |
| `dither` / [Dither](https://reactbits.dev/backgrounds/dither) | 有序抖色与印刷颗粒 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Dither/Dither.jsx) |
| `ripple-grid` / [RippleGrid](https://reactbits.dev/backgrounds/ripple-grid) | 透视波纹网格 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/RippleGrid/RippleGrid.jsx) |
| `dot-grid` / [DotGrid](https://reactbits.dev/backgrounds/dot-grid) | 受力起伏点阵 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/DotGrid/DotGrid.jsx) |
| `threads` / [Threads](https://reactbits.dev/backgrounds/threads) | 横向交织细丝 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Threads/Threads.jsx) |
| `liquid-chrome` / [LiquidChrome](https://reactbits.dev/backgrounds/liquid-chrome) | 液态铬金属轮廓 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/LiquidChrome/LiquidChrome.jsx) |
| `prism` / [Prism](https://reactbits.dev/backgrounds/prism) | 旋转棱锥与折射暗示 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Prism/Prism.jsx) |
| `dark-veil` / [DarkVeil](https://reactbits.dev/backgrounds/dark-veil) | 低照度暗纱与细扫描线 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/DarkVeil/DarkVeil.jsx) |
| `gradient-blinds` / [GradientBlinds](https://reactbits.dev/backgrounds/gradient-blinds) | 渐变百叶切面 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/GradientBlinds/GradientBlinds.jsx) |
| `plasma` / [Plasma](https://reactbits.dev/backgrounds/plasma) | 扭曲能量管 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/Plasma/Plasma.jsx) |
| `color-bends` / [ColorBends](https://reactbits.dev/backgrounds/color-bends) | 宽幅弯曲交织色带 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Backgrounds/ColorBends/ColorBends.jsx) |

### 动画 · 新增 15

| ID / 官方参考 | 本地视频方向 | 上游机制核对 |
|---|---|---|
| `magic-rings` / [Magic Rings](https://reactbits.dev/animations/magic-rings) | 同心环波与呼吸光圈 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/MagicRings/MagicRings.jsx) |
| `laser-flow` / [Laser Flow](https://reactbits.dev/animations/laser-flow) | 转角光束与下落光流 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/LaserFlow/LaserFlow.jsx) |
| `magnet-lines` / [Magnet Lines](https://reactbits.dev/animations/magnet-lines) | 朝向焦点的磁针网格 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/MagnetLines/MagnetLines.jsx) |
| `antigravity` / [Antigravity](https://reactbits.dev/animations/antigravity) | 受力排斥的反重力粒子 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Antigravity/Antigravity.jsx) |
| `ribbons` / [Ribbons](https://reactbits.dev/animations/ribbons) | 逐渐收窄的彩带尾迹 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Ribbons/Ribbons.jsx) |
| `meta-balls` / [Meta Balls](https://reactbits.dev/animations/meta-balls) | 有机融合球体 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/MetaBalls/MetaBalls.jsx) |
| `star-border` / [Star Border](https://reactbits.dev/animations/star-border) | 沿边框运行的星芒 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/StarBorder/StarBorder.jsx) |
| `pixel-trail` / [Pixel Trail](https://reactbits.dev/animations/pixel-trail) | 栅格量化的像素拖尾 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/PixelTrail/PixelTrail.jsx) |
| `noise` / [Noise](https://reactbits.dev/animations/noise) | 种子驱动动态颗粒 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Noise/Noise.jsx) |
| `shape-blur` / [Shape Blur](https://reactbits.dev/animations/shape-blur) | 局部软化的几何轮廓 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ShapeBlur/ShapeBlur.jsx) |
| `crosshair` / [Crosshair](https://reactbits.dev/animations/crosshair) | 移动十字准星与刻度 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/Crosshair/Crosshair.jsx) |
| `click-spark` / [Click Spark](https://reactbits.dev/animations/click-spark) | 定时径向火花 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/ClickSpark/ClickSpark.jsx) |
| `pixel-transition` / [Pixel Transition](https://reactbits.dev/animations/pixel-transition) | 错相像素快门交换 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/PixelTransition/PixelTransition.jsx) |
| `glare-hover` / [Glare Hover](https://reactbits.dev/animations/glare-hover) | 斜向掠过的卡面反光 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/GlareHover/GlareHover.jsx) |
| `sticker-peel` / [Sticker Peel](https://reactbits.dev/animations/sticker-peel) | 贴纸卷角与揭起阴影 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/StickerPeel/StickerPeel.jsx) |

### 组件 · 新增 15

| ID / 官方参考 | 本地视频方向 | 上游机制核对 |
|---|---|---|
| `animated-list` / [Animated List](https://reactbits.dev/components/animated-list) | 错相进入的抽象列表行 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/AnimatedList/AnimatedList.jsx) |
| `magic-bento` / [Magic Bento](https://reactbits.dev/components/magic-bento) | 非均匀拼块布局 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/MagicBento/MagicBento.jsx) |
| `tilted-card` / [Tilted Card](https://reactbits.dev/components/tilted-card) | 倾斜卡面与深度阴影 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/TiltedCard/TiltedCard.jsx) |
| `spotlight-card` / [Spotlight Card](https://reactbits.dev/components/spotlight-card) | 巡游聚光卡片 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.jsx) |
| `pixel-card` / [Pixel Card](https://reactbits.dev/components/pixel-card) | 逐格明灭的像素卡面 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/PixelCard/PixelCard.jsx) |
| `glass-surface` / [Glass Surface](https://reactbits.dev/components/glass-surface) | 平面磨砂折射玻璃 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/GlassSurface/GlassSurface.jsx) |
| `fluid-glass` / [Fluid Glass](https://reactbits.dev/components/fluid-glass) | 曲面流动玻璃透镜 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/FluidGlass/FluidGlass.jsx) |
| `stack` / [Stack](https://reactbits.dev/components/stack) | 扇形叠卡 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Stack/Stack.jsx) |
| `card-swap` / [Card Swap](https://reactbits.dev/components/card-swap) | 纵深换卡 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/CardSwap/CardSwap.jsx) |
| `bounce-cards` / [Bounce Cards](https://reactbits.dev/components/bounce-cards) | 错相弹跳卡片 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/BounceCards/BounceCards.jsx) |
| `dock` / [Dock](https://reactbits.dev/components/dock) | 局部放大的程序坞 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Dock/Dock.jsx) |
| `gooey-nav` / [Gooey Nav](https://reactbits.dev/components/gooey-nav) | 有机粘连胶囊导航 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/GooeyNav/GooeyNav.jsx) |
| `stepper` / [Stepper](https://reactbits.dev/components/stepper) | 抽象节点与进度连线 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Stepper/Stepper.jsx) |
| `folder` / [Folder](https://reactbits.dev/components/folder) | 打开的文件夹和内页 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Folder/Folder.jsx) |
| `elastic-slider` / [Elastic Slider](https://reactbits.dev/components/elastic-slider) | 弹性轨道与滑块 | [对应源文件](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/ElasticSlider/ElasticSlider.jsx) |

## 选择与查询

```bash
# All 71 IDs, in canonical shuffle-pool order.
npm run list:styles
# Only the 50 additions, with official sources and adaptation details.
npm run list:styles -- --new --json
# Copy the last output line as a components-only pool (includes the old carousel).
npm run list:styles -- --category components --pool
# Only the 20 new backgrounds.
npm run list:styles -- --category backgrounds --new --pool
# A mixed-category subset for a NEW Gate A plan.
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out NEW_RUN --renderer remotion --style-seed 20260929 --style-pool aurora,magic-rings,magic-bento,liquid-chrome,sticker-peel,folder
```

`list:styles` 只读列目录，不创建视频、不批准任何阶段。上面的 `package-video` 命令仅创建新 Gate A；`NEW_RUN` 应为新的输出目录。续做已保存工程保留原池，四项池仍是四项、21 项池仍是 21 项。若用户要求升级已有视频外观，在新输出目录保留台词、镜头、时间轴、素材和语义内容后显式重分配视觉层，先复核新方案，不直接改写原工程。

可复用提示词：

```text
用 $auto-edit-pro 的 71 项风格池包装这条视频，背景、动画与组件视觉方向按场景 seeded-shuffle 混合，seed=20260929；语义内容跟随台词，保留源片/原声/证据/字幕时间轴和已存方案分配，短片不为凑满风格加镜头，先生成 Gate A。
```

## 实现入口与验收

- `packages/core/src/catalog-styles.ts`：新增 50 项 ID、20/15/15 分类；`visual-styles.ts` 合并为 71 项。
- `catalog-palettes.ts` 与 renderer 的 `catalog-materials.ts`：新增配色和语义组件材质；旧 21 项的 palette/material 保留。
- renderer 的 `styles/catalog-backgrounds.tsx`、`catalog-animations.tsx`、`catalog-components.tsx`：每项独立几何机制，不用一个效果换 50 个名称。
- `npm test` 检查单袋全局不重复、超池阻断、真实 Gate A CLI、旧 21 项帧/材质/配色回归、几何随帧和种子变化、非顺序跳帧一致、颜色与横竖画布。
- `npm run verify:styles -- --out INTERNAL_QA` 对所有 71 项走实际 VideoPackaging → StageOverlay → StyleBackdrop，内部渲染 91/113/91 帧，验证正文落定后背景变化、同帧一致、解码与尺寸。它是实现验收，不是交付展示样例或完成真实视频 Gate C/D。
- 新参考只有完成本地渲染适配、注册、测试与源核对后才入池；官方目录中其余未登记项仍不自动使用。
