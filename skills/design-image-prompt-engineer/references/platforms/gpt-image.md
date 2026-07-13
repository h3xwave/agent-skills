# GPT Image Prompt Notes

Last verified: 2026-07-10

只在用户指定 GPT Image、OpenAI 图像生成或相应 API 时读取。使用完整自然语言描述，不添加 Midjourney 参数尾缀或 Stable Diffusion 式 negative prompt。

## 写法

- 生成任务写清主体、背景、构图、光线、材质、画幅与需要呈现的文字。
- 编辑任务明确“改什么、保留什么”；多张参考图逐张说明主体、风格、构图或场景职责。
- 系列图写清人物、产品外观、材质、配色和标识位置等跨图不变量。
- 需要准确文字时给出原文、语言、位置、字号层级与版式关系。
- 排除意图优先改写成正向、可观察的目标，例如“画面只包含产品与底座”。只有用户明确索要负向策略时才读取 [negative-prompt-strategies.md](../negative-prompt-strategies.md)。

## 版本快照

- 当前 GPT Image 主模型为 **GPT Image 2**，API 模型 ID 为 `gpt-image-2`。
- 长期文案优先写“GPT Image 家族”；只有用户要求当前 API 模型或代码时才写具体 ID。
- DALL·E 2 与 DALL·E 3 已标为 deprecated，不作为新任务推荐。
- 单次生成或编辑可走 Image API；对话式、多轮或上下文内编辑可走 Responses API 的图像生成工具。交付 Prompt 时通常无需暴露 API 细节。

## 交付检查

- 是否使用自然语言而非其他平台参数？
- 编辑 Prompt 是否同时写明修改项与保留项？
- 多图职责和准确文字是否足够明确？

## Official sources

- [GPT Image 2 model](https://developers.openai.com/api/docs/models/gpt-image-2)
- [Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- [All models](https://developers.openai.com/api/docs/models/all)
