# 全屏舞台：语义稳定，视觉风格可混合

整个屏幕都是特效和组件的舞台。人物不是必须避开的障碍，而是可以与图形共同表演的主体。十种语义结构、源片/原声连续性和四阶段工作流保持不变；配色、字体、材质与装饰动效可按[视觉风格混合](visual-style-mixing.md)升级。新方案默认从 21 种已登记风格按固定种子随机混合，短片不为凑满风格增加镜头；已保存的四项或其他子池保持原样，旧审美保留为 legacy 选项。

## 导演原则

- 不设“中心禁止进入”区域，不以人物是否被挡住作为失败判据。可使用巨大前景、半透明叠加、完全覆盖、周围铺满而人物清楚、前后穿插；按内容组合，不机械轮换。
- 风格随机只作用于已登记的视觉层，不随机改变语义结构、证据或手势。特效默认位于舞台组件底面，保留真实源背景；全屏遮挡与字幕接棒仍需明确设计。
- 先写“对象—动作—反应/结果”：讲“丢素材”可以由手势推送组件，讲“接力”可以从手指指向处发出路径。不是把现成卡片放大后仍然只做旁注。
- 先看实际视频，再记录手势所在源帧和屏幕位置。语音与关键字可驱动语义动作，SRT 不证明人做过某个动作。没有匹配手势的句子按台词设计，不伪造动作记录。
- 字幕允许短暂被遮挡，用同一句话中的清楚关键文字接棒；接棒窗口结束后恢复原字幕/单一字幕层。不要以“大特效”为由造成信息断档。
- 真人前后穿插需要同步透明人物层。制作执行者负责准备或复用已验证的人物层；它不是默认要求创作者另交的素材。检查头发、手指、身体边缘和原背景对齐，保持人物外观不变。

## 兼容边界

新增表现使用 Remotion。HyperFrames 仅使用 legacy 布局/风格；不静默丢弃舞台层次或混合风格。旧故事板不含 `stage` 时保持旧布局；不含新风格字段时保持旧审美。新自动草案默认 `presentation: "whole-screen-stage"` 和 `styleMix.mode: "seeded-shuffle"`，只生成语义前景，不凭空添加抠像或手势坐标；方案阶段须按实际素材精修。

## 配置合同

- `beat.stage.x/y/width/height`：相对输出画幅的比例，x/y 是左上位置；可以越过边界，尺寸没有固定最大值。
- `scale/rotation/opacity`：整体缩放、角度、透明度；`surfaceOpacity` 仅控制组件底面。
- `surface`：`template` 使用当前组件底面，`transparent` 去掉公共底面，`opaque` 使用实底；有 `beat.visualStyle` 时按该风格处理材质，没有该字段时维持旧版表现。
- `depth`：`front` 或 `behind-subject`。前后切换还可写在 `keyframes` 中；切换需设计遮挡交接，避免突跳。
- `keyframes[].frame`：**镜头内局部帧**，从 0 开始；可逐帧插值位置、尺寸、缩放、角度及透明度。
- `interaction`：`speech` 或 `gesture`。后者必须带 `gesture.observedFrames`（**源视频全局帧**）与真实观察描述。
- `coverSubtitles: true` 配合 `captionHandoffs`：`startFrame/endFrame` 是局部半开区间，`keyword` 为原台词关键短语，`x/y` 为文字中心位置。只有接棒窗口允许覆盖字幕带，窗口外恢复阅读。

以下仅是配置语法示例，观察帧和坐标必须替换为实际视频测得的数据；不是现成的真人追踪结果：

```json
{
  "x": 0.05, "y": 0.08, "width": 0.9, "height": 0.84,
  "scale": 1, "rotation": 0, "opacity": 1, "surfaceOpacity": 0.65,
  "surface": "template", "depth": "front", "interaction": "gesture",
  "gesture": {"observedFrames": [300, 315, 330], "description": "源片此段手从左向右推送；已逐帧核对接触点"},
  "keyframes": [
    {"frame": 0, "x": -0.2, "scale": 0.8},
    {"frame": 15, "x": 0.05, "scale": 1},
    {"frame": 30, "depth": "behind-subject"}
  ],
  "coverSubtitles": true,
  "captionHandoffs": [{"startFrame": 12, "endFrame": 27, "keyword": "素材", "x": 0.5, "y": 0.65}]
}
```

## 透明人物层

`source.subject` 使用 `{ "type": "png-sequence", "pattern": "subject/frame-{frame}.png", "frameCount": 300 }`。数值仅作示例，必须覆盖实际全片帧数。

PNG 与原片同画幅、同帧率、同源帧对齐，RGBA 含透明区域；不改变人物位置。第 0 帧为 `frame-000000.png`，之后逐帧递增。`{frame}` 会替换成六位**全局源帧**。普通带背景视频、只有一张静态人像或黑底人像，不等于透明动态人物层。

方案中存储此配置；工程阶段通过 `--subject-frames SUBJECT_DIR` 验证并复制。脚本检查每帧存在、尺寸及 alpha 通道，抽样解码 alpha 变化，并生成 `public/SUBJECT_MANIFEST.json`。这些检查不代替真人边缘和手部对齐的视觉审查。

## 继续制作同一方案

编辑 Gate A 保存的 `storyboard.json` 后，后续阶段读取该文件，不重新覆盖 stage 或风格配置、不重新抽签。也可通过 `--storyboard AUTHORED_STORYBOARD.json` 指定经过审定的分镜。画幅、时长、帧率必须与输入匹配。

```bash
# 首次调用仍先出 Gate A 方案
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --captions burned-in

# 方案获批、实际人物层准备完成后进入 Gate B
npm run package-video -- --video INPUT.mp4 --srt INPUT.srt --out RUN --captions burned-in --approve-gate-a --approve-gate-b --subject-frames SUBJECT_DIR
```

只有前后穿插需要透明人物层；纯前景、半透明、全屏包装不需要该参数。透明 overlay 文件只导出图形，不把人物复制进去；带人物层的交付采用 composite。

## 审片重点

保留原 Gate A/B/C/D，在原稳定帧审查之外重点检查动作开始、手与物件接触、前后切换、字幕接棒开始/结束和退出恢复。观看短动态片段验证节奏，随机跳帧验证同一帧一致。审查有目的的遮挡、读图顺序和动作后果，不再以“盖住脸”一项直接判失败。
