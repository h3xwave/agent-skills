# Nano Banana Prompt Notes

Last verified: 2026-07-10

只在用户指定 Nano Banana、Gemini Image 或 Google 图像模型时读取。像向设计师下指令一样使用完整自然语言，不添加 `--ar`、`--v`、`--sref` 等参数。

## 写法

- 把画幅、分辨率倾向、主体、场景、构图、材质、色彩和版式直接写入句子。
- 多图任务逐张声明用途，例如“图 1 提供主体，图 2 提供风格，图 3 提供构图”，并列出保持不变的内容。
- 系列图明确保持角色、产品形态、材质、配色和标识位置一致；局部编辑说明修改范围及其余区域保持不变。
- 需要画面文字时给出准确文本、语言、位置和层级；不需要文字时写正向版式目标，而不是附通用负向词表。
- 只有用户明确索要负向内容或现有 Prompt 含负向逻辑时，才读取 [negative-prompt-strategies.md](../negative-prompt-strategies.md) 并转换为正向目标。

## 版本快照

- **Nano Banana 2** 对应 Gemini 3.1 Flash Image，模型 ID `gemini-3.1-flash-image`；适合通用任务、速度、质量、多参考与文字渲染的平衡。
- **Nano Banana Pro** 对应 Gemini 3 Pro Image，模型 ID `gemini-3-pro-image`；适合复杂指令、专业资产和更精确的创意控制。
- 旧 Nano Banana 对应 Gemini 2.5 Flash Image，模型 ID `gemini-2.5-flash-image`；它不是 Nano Banana 2 的别名。

## 交付检查

- 是否按用户实际图序声明每张参考图职责？
- 系列一致性与局部编辑保留项是否可观察？
- 是否没有混入其他平台参数或伪造独立 negative prompt？

## Official source

- [Gemini image generation](https://ai.google.dev/gemini-api/docs/image-generation)
