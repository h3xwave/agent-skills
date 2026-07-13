# Midjourney Prompt Notes

Last verified: 2026-07-10

只在用户指定 Midjourney 时读取。先写清画面内容，专有参数统一放在末尾；不要混入 Stable Diffusion negative prompt 或其他平台语法。

## 稳定写法

- 正文保持简洁，以主体、场景、构图、光线、材质和风格为主。
- 常用参数包括 `--ar`、`--raw`、`--stylize`、`--sref`、`--sw`、`--no`；只加入任务确实需要的参数。
- Raw 写作 `--raw`，用于减少平台默认审美介入；写实或品牌控制可按需使用，不机械添加。
- Style Reference 用 `--sref <URL或代码>` 传递整体视觉风格，`--sw` 调节影响；它不负责人物或物体身份。
- Omni Reference 用于人物、产品、车辆等身份或形态参考，不能拿 `--sref` 替代。
- 只有用户要求排除内容或现有 Prompt 已含负向逻辑时，才读取 [negative-prompt-strategies.md](../negative-prompt-strategies.md)。`--no` 只列简短对象或特征，复杂否定改写为正文中的正向目标。

## 版本快照

- 当前默认版本为 **V8.1**；需要可复现交付时可写 `--v 8.1`。
- Style Reference 可用于 V6 及以后版本；V8.1 示例：`... --sref <URL> --sw 100 --v 8.1`。
- **Omni Reference 仍只兼容 V7**，使用 `--oref <URL>` 与 `--ow`。命中此任务时自动切到兼容路径，如 `... --oref <URL> --ow 100 --raw --v 7`；不要与 `--v 8.1` 组合。
- 当前动漫路径为 **Niji 7**，写作 `--niji 7`；不要同时附加 `--v 8.1`。

## 交付检查

- 参数是否全部位于正文之后，且只属于 Midjourney？
- Omni Reference 是否走 V7，普通当前路径是否未误用已经废弃的旧 Raw 语法？
- 风格参考与身份参考的职责是否清楚？

## Official sources

- [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)
- [Raw](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw)
- [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)
- [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)
- [`--no`](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No)
