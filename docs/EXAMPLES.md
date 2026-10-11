# 合成示例

本仓库不分发私人真人视频或其截图。下面的测试图案与正弦音由本地 FFmpeg 生成，不能用作真人互动或审美验收的证据。

```bash
npm run make:synthetic
npm run example:synthetic
```

第一条命令生成合成输入，第二条命令只生成 Gate A。后续按 [强制工作流](../references/enforced-workflow.md) 补全当前合同、记录实际授权、执行 B/C 并观看真实片段，再按 [四阶段合同](../references/gates.md) 进入 D。显式委托审片只改变审批主体，不跳过检查、哈希绑定或失败阻断。

`npm run demo:styles -- --out DEMO_DIR` 是显式请求时使用的组件合成预览，不代表任何真人成片通过验收。历史私有案例脚本为向后兼容而保留；其输入不随本仓库提供。
