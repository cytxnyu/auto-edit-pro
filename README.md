# 自动剪辑 Pro

公开仓库：[cytxnyu/auto-edit-pro](https://github.com/cytxnyu/auto-edit-pro) · 入口：[SKILL.md](SKILL.md)

一套可直接调用的 Agent Skill：把人物居中的横屏真人口播视频与 SRT 转成有节奏、有证据边界、可复现的视频包装工程。默认使用 Remotion 生成真实成片，也可以从同一份 storyboard 生成 HyperFrames 项目。

它不是“随便套几个字幕卡”的模板集合。完整流程会先检查源视频、逐条解析 SRT、生成并锁定 Gate A 审核稿；默认获得用户明确批准后才进入视觉实现和渲染。用户明确委托当前项目审查并导出时，agent 仍须实际完成绑定审查与全部质量门禁。最后检查真实成片，不用成功构建或静态页面代替交付证据。

## 你会得到什么

- 依据 SRT 语义自动规划的视觉节拍，普通片段优先控制在 1.6–3.2 秒，硬上限 6 秒。
- 10 种语义视觉结构、71 种可复现混合视觉风格；共 77 组配色（71 组风格配色 + 6 组不变的旧版配色），保留 10 种 seek-safe 动效原语、6 类程序化 SVG 简笔画。
- 三种清晰的字幕模式：原视频已经带有字幕（字幕已固定在画面中）；原视频没有字幕，希望 Skill 自动生成字幕；原视频没有字幕，并且只需要动效、不需要字幕。这样可以避免重复字幕。
- 证据卡、个人经验、估算和客观事实的边界控制。
- Remotion 默认渲染，以及仅限 legacy 布局/风格的可选 HyperFrames 项目生成。
- 输入哈希、媒体探测、storyboard、截图、输出 manifest、完整解码等验收证据。

## 视觉与动画能力

### 10 种语义视觉结构

`editorial-dual-rail`、`thesis-and-proof`、`bidirectional-flow`、`command-palette`、`four-stage-pipeline`、`before-after-scrub`、`evidence-panel`、`metric-odometer`、`signal-route`、`semantic-doodle`。

结构选择由口播逻辑、人物互动与遮挡设计和证据状态共同决定，不为了凑变化而随机套用。详见 [视觉结构说明](references/visual-structures.md)。

### 全屏舞台，71 种风格可在同一视频混合

整个屏幕都是人物、特效和组件共同表演的舞台。保留十种语义结构、源片/原声连续性及四阶段工作流；新方案默认从原有 21 种及新增 50 种风格以固定种子的 shuffle bag 随机混合，不再锁定原配色和卡片质感：

`balatro`、`crt-warp`、`cubes`、`hyperspeed`、`shape-waves`、`ripple-distortion`、`evil-eye`、`electric-border`、`lightning`、`grid-motion`、`waves`、`metallic-paint`、`circular-carousel`、`micro-slats`、`ghost-fibers`、`acid-squares`、`light-tunnel`、`light-pillar`、`floating-lines`、`grid-scan`、`prismatic-burst`。

以上为参考对应方向制作的本地原创逐帧实现，不是 React Bits 源码复制或逐像素复刻。动画/组件类仅改变装饰视觉；轮播默认用抽象几何，不凭空添加产品照片或证据；波纹、金属形变不作用于证据正文或原片。官方链接与各风格要求集中在[风格表](references/visual-style-mixing.md)。

- 大组件可跨越全屏、遮住人物、半透明覆盖，或环绕人物；不再固定在左右两侧。
- 动作呼应台词，并根据真实素材中的指向、抬手、挥手等动作设计接触和反馈。
- 通过同步透明人物层实现特效前后穿插；不把普通半透明覆盖冒充抠像互动。
- 允许短暂遮挡字幕，由对应关键文字承接，再恢复清晰字幕。
- 语义结构按内容选择，外观风格独立随机；每个画面恰好一个风格，风格全片只用一次；只洗牌一次、不回池，正文和背景不各套一套风格，也不同时叠两个风格画面。池不足会阻断，先减少非必要画面或注册并测试新风格；短片不为凑满 71 项插入镜头，保存后不重新抽签。
- 特效默认在组件表面与正文下方呈现，保留真实源背景，不因换风格而无差别遮挡字幕。

本次新增 **50 项：20 背景、15 动画、15 组件视觉方向**，逐项链接、机制与本地改编说明见[扩展目录](references/react-bits-catalog.md)。`npm run list:styles` 可列出全部 71 项，`npm run list:styles -- --category components --pool` 可取得组件类子池；这些是可导出的本地逐帧视觉改编，并非嵌入网页或上游交互组件原样移植。

具体输入与配置见 [全屏舞台](references/whole-screen-stage.md)与[视觉风格混合](references/visual-style-mixing.md)。旧工程保留已保存的 seed、pool、逐拍分配和 legacy 布局选择，不静默重新洗牌或把四风格池扩成 71 项。渲染器更新可能改善正文时序，并触发新 fingerprint 与重新验收；已导出的视频不变。仅在用户明确请求时，用 `--style-mix legacy` 选择旧审美或用 `--style-pool waves,metallic-paint,grid-scan` 指定子池，并在视觉合同记录对应例外；旧工程的新导出同样需要当前验收。

显式要求查看组件效果时，可运行 `npm run demo:styles -- --out DEMO_DIR`，生成覆盖原四种风格的三个既有合成组件 MP4 预览、静帧与画廊；该命令不是 71 风格全览。仅升级风格时不追加展示样例。任何合成预览都不代表真人视频已获 Gate A/D 批准。

### 10 种 seek-safe 动效原语

`hit`、`slide`、`lift`、`stamp`、`route`、`trace`、`count`、`reveal`、`relay`、`focus`。

所有动画都由当前帧、fps、起始帧和持续时间计算；相同帧永远得到相同状态，支持任意 seek 和逐帧渲染。

### 6 类程序化简笔画

`information-overload`、`climb-boulder`、`workstation-balance`、`paper-plane-route`、`route-activation`、`before-after-illustration`。

简笔画用于解释信息过载、困难推进、权衡、速度路径、流程激活和前后变化。SVG 线条显式使用 `fill="none"`，不会把解释性插画伪装成事实证据。详见 [动效与简笔画说明](references/motion-and-illustration.md)。

## 安装

环境要求：Node.js 20+、FFmpeg 与 ffprobe 可用。

```bash
git clone https://github.com/cytxnyu/auto-edit-pro.git
cd auto-edit-pro
npm ci
```

作为 Agent Skill 使用时，把整个仓库目录复制或链接到 Agent 的 Skills 目录。入口文件是 [SKILL.md](SKILL.md)，推荐触发语句：

> 使用 package-talking-head-video 检查这段 MP4 和 SRT，先生成 Gate A，未经我批准不要渲染。

## 前期素材准备

### 1. 先准备剪辑完成的真人口播视频

这个 Skill 负责的是**画面包装**，不处理重读、漏读和气口，也不负责修正口误、长停顿、错误镜头或其他基础剪辑问题。输入视频必须是顺序、声音和时长已经确定的完整成片。

推荐使用人物位于画面中间的 16:9 横屏素材。原视频如果已经带有字幕，而且字幕已经固定在画面中，后续应使用 `--captions burned-in`，避免再生成一层重复字幕。

如果源片没有字幕：希望最终包装包含字幕时改用 `--captions generated`；只要动效、不需要字幕时使用 `--captions none`。

### 2. 导出与成片完全对应的 SRT

在剪辑或字幕工具中完成字幕识别、校对和时间轴对齐，导出视频时同时勾选并导出 UTF-8 编码的 `.srt` 文件。视频如果又发生删改，必须重新导出 SRT；旧时间码不能继续使用。

SRT 是动效导演的核心输入。Skill 会读取全部字幕，根据每段口播的语义、时间码和事实属性匹配侧卡、流程、对比、数字、证据或简笔画结构，而不是简单地把字幕换一种颜色显示。

## 在 Codex 中怎么使用

是的，标准流程就是把**视频 + SRT** 一起提供给 Codex，并明确要求调用 `package-talking-head-video`。可以直接这样说：

> 请调用 auto-edit-pro。输入是 `input.mp4` 和 `input.srt`，人物在画面中间，源视频已经剪辑完成，字幕也已经固定在画面中。先分析全部 SRT 并输出 Gate A 包装方案，确认后再制作。最终使用 composite 模式直接输出包装完成的 MP4。

Codex 不会收到文件后立刻盲目导出。Skill 先生成 Gate A 方案，列出动效时间码、视觉结构、配色、人物与字幕/关键文字接续、简笔画和事实风险；方案确认后才进入实现、可视验收和最终导出。

### 0.7.0：全片单次风格与当前项目委托审查

以下真实视频命令的默认人工确认路线遵守同一顺序（当前项目明确委托时按下一段记录 agent 决定）：**首次 Gate A → 检查来源/预合成/自制图文层并补全 `visual-contract.json` → 重跑 Gate A 锁定合同 → 记录用户本版确认 → B/C 实际审查 → 记录用户对该版审查的 Gate D 确认 → 导出**。`USER_APPROVALS.json` 保存真实确认原文、来源与绑定；`VISUAL_REVIEW.json` 保存实际观看后的逐项/逐片观察，生成时是 pending。

**默认仍需 A/D 两次用户确认。** 仅当用户对当前项目明确说“这次不用我验收，你直接做出来后导出即可”等委托审查并导出的要求时，才按原话、真实来源、jobId 和 input-manifest 哈希记录 `delegation`，由真正检查的 agent 记录 A/D；不假装用户看过，不授权其他项目。15 项审查、逐片实际观看及所有哈希校验保持不变，缺失/失败仍阻断。详细字段见[当前项目委托](references/gates.md#explicit-current-job-delegation)。

`--approve-*` **只是阶段选择，不是用户批准或视觉验收证明**。`WORKFLOW_LEDGER.json` 和 `GATE_C_REPORT.json` 绑定实际输入、实现、素材、审查片段与哈希；缺文件、待审核或内容变更都会阻断后续导出。不要复制旧 PASS 或自动编造确认。字段和操作详见[强制工作流](references/enforced-workflow.md)与[四阶段合同](references/gates.md)。

## 两种输出与包装方式

| 方式 | 用户提供 | 最终输出 | 适合谁 |
|---|---|---|---|
| **方案一：透明叠加层** | 至少提供 SRT，并指定画布宽高和帧率 | 无音轨、带 Alpha 通道的 ProRes 4444 `overlay.mov` | 已经固定拍摄机位和工程规格、希望在剪映/Premiere/Final Cut 中自行叠加的人 |
| **方案二：直接合成（默认推荐）** | 同时提供剪辑完成的视频和对应 SRT | 已经叠加动效的 H.264/AAC `packaged.mp4` | 大多数第一次使用者、希望减少操作并进行真实人物/字幕遮挡检查的人 |

### 我的推荐

**保留两种方案让用户选择，但默认推荐方案二。** 原因是视频 + SRT 能让 Skill 根据真实分辨率、帧率、人物位置，以及原视频中已经固定的字幕位置完成可视质检，并直接交付成片，出错环节最少。

方案一更适合进阶工作流。只提供 SRT 时先做语义前景草案；真实手势、人物前后穿插和字幕遮挡须取得原片并观察后设计。因此需确认 `--width`、`--height` 和 `--fps`，默认值为 `1920×1080 / 30fps`。实际人物互动优先提供视频参考，或直接选择方案二。

### 方案一：只提供 SRT，输出透明 MOV

先生成方案：

```bash
npm run package-video -- --srt ./input.srt --out ./run-overlay --renderer remotion --captions burned-in --output-mode overlay --width 1920 --height 1080 --fps 30
```

补全合同并重跑以上 Gate A 后，先记录真实方案确认，再用同一组输入/目录加 `--approve-gate-a --approve-gate-b` 生成 B/C。实际审查完成 `VISUAL_REVIEW.json`、记录 Gate D 对本版报告的明确批准后，才执行以下最终命令：

```bash
npm run package-video -- --srt ./input.srt --out ./run-overlay --renderer remotion --captions burned-in --output-mode overlay --width 1920 --height 1080 --fps 30 --approve-gate-a --approve-gate-b --approve-gate-d --render
```

输出文件为 `run-overlay/renders/overlay.mov`。将它放在原口播视频上方同一起点叠加，不要改变速度、入点、出点或画布尺寸。导出会检查 ProRes 编码、Alpha 像素格式、真实透明度变化、无音轨、完整解码、时长、尺寸、帧率和 SHA-256。

上面的示例假定原视频已经带有字幕，而且字幕已固定在画面中，所以命令使用 `burned-in`。如果原视频没有字幕，并希望透明 MOV 包含可见字幕，把两条命令里的字幕参数改成 `--captions generated`。

### 方案二：视频 + SRT，直接合成 MP4

下面是完成合同、重跑 Gate A、记录确认、实际 B/C 审查及本版 Gate D 确认后的**最终命令**，不是首次启动命令。初次制作请按后面的“最短使用流程”，全程保持同一输出目录（此例为 `run-composite`）。

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run-composite --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-d --render
```

输出文件为 `run-composite/renders/packaged.mp4`，里面已经包含原口播画面、原声音和动效包装。

## 最短使用流程

### 硬规则：先出方案，以当前有效确认或明确委托再实施

每个视频都必须先执行不渲染的 Gate A，把源文件参数、SRT 节拍、视觉结构、语义配色、全屏构图、大小与透明度、前后层次时机、事实风险、字幕模式和安全区方案锁定。默认交给用户确认；只有当前视频的真实确认或明确的项目限定委托及实际 agent 方案检查完成后，才能进入视觉实现。沉默、催进度、其他视频的批准或笼统授权都不能代替它。

### 1. 只做 Gate A，不渲染

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite
```

会生成 `BRIEF.md`、`SOURCE_PROBE.json`、`STORYBOARD.md`、`storyboard.json`、`input-manifest.json`，以及合同/批准草稿和 `WORKFLOW_LEDGER.json`。检查原片和预合成、登记全部图文来源并补全 `visual-contract.json` 后，重跑这条 Gate A 命令。默认向用户呈现锁定后的方案，并将实际确认逐字记录在 `USER_APPROVALS.json.gateA`；明确委托则记录 `delegation` 及实际 agent 的 Gate A 检查。每次重跑 A 都会重置批准/委托为 pending。

### 2. Gate A 获批后完成 Gate B，并自动进入 Gate C

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b
```

此命令要求上一步已锁定完整合同并记录本版真实确认；A/B flags 只选择阶段，单独添加参数不会获得批准。它先准备 Gate B 输入，再生成 Gate C 静帧/联系表、**每个实际使用风格的完整拍节 MP4**及隔离包装层运动证据，不在 B 到 C 之间再次询问，也不导出最终成片。程序会在 HEVC 等浏览器不兼容输入时创建不改时序的 H.264/AAC 制作代理。

### 3. Gate C 可视验收；可选仅停留 Gate B

实际观看静帧与每个动态片段，检查风格是否被盖板吞掉、是否仅换色、装饰是否停动、文字是否抖动，以及人物/字幕互动与语义。把真实观察逐项、逐片写入 `VISUAL_REVIEW.json`；pending、失败或未观看都不填 PASS。分别报告注册风格数、分配 ID 数与实际可辨识验收数，不用配置计数冒充观感。

`StyleProof` 在固定底上渲染原样的舞台 `StageOverlay`（旧布局则为 `BeatOverlay`），排除源视频、人物和字幕；比较两帧 RGB 像素，持续动效取声明窗口后段，完全相同像素阻断。`quiet-reading` 另行审查。差值非零仅证明包装层采样有变化，其中可能包含语义组件组装，**不是风格本体持续运动的证明，也不等于审美或风格可辨识通过**。`GATE_C_REPORT.json.isolatedMotion` 保存帧、hash 与差值。完成实际审查后，默认请求用户批准该版 Gate D 并记录其确认与报告 hash；明确委托路线记录实际 agent 审查人、时间、report/review 双哈希。旧的 `--approve-gate-c` 保留兼容，但不必需。

只有用户明确要求仅准备输入、且合同/重跑 A/本版确认已经完成时，才增加 `--gate-b-only`：

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --gate-b-only
```

仅 Gate B 模式不生成审核静帧或最终成片。

### 4. Gate D 获批后生成 Remotion 成片

先完成当前 `VISUAL_REVIEW.json`，把用户对该版报告的真实批准写入 `USER_APPROVALS.json.gateD`。D 校验当前绑定、报告、素材与审查文件 hash，不会悄悄重新生成未观看的 C 并当作已获批。

```bash
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run --renderer remotion --captions burned-in --output-mode composite --approve-gate-a --approve-gate-b --approve-gate-d --render
```

程序生成最终 MP4、代表帧和 `RENDER_MANIFEST.json`，并执行 ffprobe、完整解码与黑帧扫描。

### 5. 可选：生成 HyperFrames 项目

仅用于用户明确请求的 legacy 输入准备。在独立 `run-hyperframes` 目录先执行不带批准 flags 的 A，补全合同（包含用户请求的 legacy 例外），重跑 A 并记录本版确认后，再运行 B。不要直接更换已有 Remotion 工程的 renderer 继承批准。

```bash
# Gate A；完成合同后重跑并记录确认，再执行后面的 Gate B。
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run-hyperframes --renderer hyperframes --captions burned-in
# 已完成合同、重跑 A 与实际确认，且用户仅要求输入准备：
npm run package-video -- --video ./input.mp4 --srt ./input.srt --out ./run-hyperframes --renderer hyperframes --captions burned-in --approve-gate-a --approve-gate-b --gate-b-only
npx hyperframes@0.7.99 lint ./run-hyperframes/hyperframes
npx hyperframes@0.7.99 check ./run-hyperframes/hyperframes --snapshots
```

Remotion 与 HyperFrames 共享基础 schema 和 storyboard，但 HyperFrames 只适用于 legacy 布局/风格，不能代替新版舞台和混合风格渲染。更完整的参数与字幕模式见 [使用说明](docs/USAGE.md)，案例见 [案例说明](docs/EXAMPLES.md)，异常处理见 [排障说明](docs/TROUBLESHOOTING.md)。

## 质量门禁

1. **Gate A — 分析与方案：** 探测媒体、计算哈希、解析全部 SRT、检查事实边界、生成分镜；禁止渲染。
2. **Gate B — 视觉实现：** 获批后实现视觉结构、动效和必要插画；不把画廊截图当成结果。
3. **Gate C — 动态视觉验收：** B 就绪后自动生成实际合成片段、静帧与隔离运动证据；实际观看并完成绑定审核，不把静帧或像素变化当作风格已验收。
4. **Gate D — 导出验收：** 获得明确导出授权后渲染，并用 ffprobe、完整解码和代表帧验证最终文件。

Gate C 的代表帧固定抽取在对应节拍的 72% 稳定位置，并逐张检查人物遮挡、卡片空白、内容重叠、可读性、语义匹配和字幕/关键文字接续；每个实际使用风格还必须观看真实完整拍节片段。任何一项失败、未审或哈希失配都阻断 Gate D。完整规则见 [视觉质检门禁](references/visual-quality-gates.md)。

## 事实与安全原则

- 不发明百分比、用户评价、平台能力、Logo 或产品成绩。
- 估算和个人实测必须保留归属，不能改写成普遍事实。
- 证据卡必须有真实素材；插画和通用图标不能充当证据。
- 默认保留原片剪辑、声音，以及原视频中已经固定在画面里的字幕。
- 仓库发布前扫描密钥、本地绝对路径、源媒体、大文件和未完成标记。
- README 截图必须来自同一个可验证的真实成片输出。

## 开发与验证

```bash
npm test
npm run typecheck
npm run build
npm run verify:public
npm audit --omit=dev
```

仓库使用 MIT License。Remotion 另有自身许可与商业使用条款；HyperFrames 可选适配器受其上游许可约束。使用第三方人物、商标、视频、图片与字体前，请自行确认授权。


## 公开分发与归属

本仓库只分发 Skill 代码、参考文档和可自行生成的合成示例，不附带私人视频、原声、截图、审片记录或历史真人案例。`example:auto-editing-0` 是保留的历史私有案例入口，不是本仓库自带示例；公开试运行请使用 `make:synthetic` 与 `example:synthetic`。

本项目在 Nana AI 的 MIT 许可代码基础上改进，原始版权与许可见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。当前维护与反馈：[GitHub Issues](https://github.com/cytxnyu/auto-edit-pro/issues)。
