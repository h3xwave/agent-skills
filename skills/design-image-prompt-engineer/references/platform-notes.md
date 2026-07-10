# Platform Notes

平台参数只在用户指定平台或交付物确实需要时加入。先写清主体、场景、构图、光线、材质与媒介，再适配平台；不要把不同平台的参数、模型名或负向语法混进同一份 prompt。

本文分为两层：前半部分是相对稳定的能力与写法，末尾是截至 **2026-07-10** 的版本快照。版本、模型 ID 与兼容性会变化；需要长期复用时优先写模型家族名称，执行前再核对快照和官方链接。

## 平台速选

- 自然语言生成、编辑、多轮迭代：GPT Image、Nano Banana、FLUX.2。
- Midjourney 风格探索与明确的参数控制：Midjourney；减少默认审美介入时用 `--raw`。
- 角色、物体或产品参考：Midjourney Omni Reference 使用专门的 V7 工作流；GPT Image、Nano Banana、FLUX.2 使用自然语言说明各参考图用途。
- 本地工作流、显式负向提示与结构控制：Stable Diffusion + negative prompt / ControlNet / IP-Adapter。
- 动漫与东方插画：Midjourney Niji 或 Stable Diffusion 的相应动漫模型。
- 用户要求 Ideogram、Recraft 等其他平台时，以清晰自然语言输出；除非另行核验，不推测当前模型版本或专有参数。

## 负向策略必须隔离

三种机制不可共享一套“通用负向词”，也不要把某平台的负向区块复制到另一平台：

| 目标平台 | 正确做法 | 禁止做法 |
| --- | --- | --- |
| Midjourney | 仅在必要时于参数尾部使用 `--no item1, item2`，优先列简短、独立的对象或特征 | 输出 Stable Diffusion 式 negative prompt；把复杂短语塞进 `--no` |
| Stable Diffusion | 正向 prompt 与独立 negative prompt 分栏，按当前 checkpoint 和工作流定制 | 把 `--no` 当作 SD 语法；无差别堆叠通用质量词 |
| GPT Image、Nano Banana、FLUX | 在主 prompt 中正向描述目标状态，如“背景保持空旷”“全景清晰”“只出现一位人物” | 附加 `--no` 或 Stable Diffusion 式负向词表；为 FLUX 输出独立 negative prompt |

否定不是默认必需项。能用正向、可观察的目标表达时，优先写目标，不要写一长串“不要”。

## Midjourney：稳定写法

- 正文保持简洁、以画面内容为主，专有参数统一放在末尾；常用参数包括 `--ar`、`--raw`、`--stylize`、`--sref`、`--sw` 与 `--no`。
- Raw 当前只写作 `--raw`。它降低平台自动添加的风格化，让 prompt 对结果影响更直接；写实、品牌控制或用户明确说“不要 AI 味”时可用，但不必机械添加。
- Style Reference 用 `--sref <URL或代码>` 传递整体视觉风格，用 `--sw` 调整影响；它不是角色或物体身份参考。
- Omni Reference 用于人物、物体、车辆等身份或形态参考。它有独立版本兼容要求，必须按末尾快照切换版本，不能沿用当前默认版本。
- `--no` 会逐词解释内容。对“不要现代服装”这类可能被拆错的复杂概念，改为在正文正向指定目标服装。
- 不要同时使用 `--v` 与 `--niji`；动漫任务按快照使用 Niji 路径。

## GPT Image：稳定写法

- 使用完整自然语言描述生成或编辑目标，不添加 Midjourney 参数尾缀。
- 生成任务写清主体、背景、构图、光线、材质、画幅与需要呈现的准确文字；编辑任务明确“改什么、保留什么”，多张参考图逐张说明用途。
- 单次生成或编辑可走 Image API；需要对话式、多轮、上下文内编辑时可走 Responses API 的图像生成工具。交付提示词时通常不必暴露 API 细节。
- 文档与推荐使用 **GPT Image 家族**名称；具体当前模型只放在版本快照。DALL·E 属于旧代模型，不作为新任务推荐。
- 需要排除元素时用正向结果约束，例如“纯净无人的室内空间”“画面只包含产品与底座”，不附加独立 negative prompt。

## Nano Banana（Gemini）：稳定写法

- 像向设计师下指令一样使用完整自然语言，不添加 `--ar`、`--v`、`--sref` 等参数；画幅、分辨率倾向与版式直接写入句子。
- 支持文本与图像组合输入、生成、编辑和对话式迭代。多图任务明确“图 1 提供主体、图 2 提供风格、图 3 提供构图”，并说明哪些内容保持不变。
- 系列图明确要求保持角色、产品外观、材质、配色和标识位置一致；局部编辑明确修改范围及其余区域保持不变。
- 需要画面文字时给出准确文本、语言、位置与层级；不需要文字时写正向版式约束，如“纯图形画面，仅保留无文字留白区”。
- Nano Banana 2、Nano Banana Pro 与旧 Nano Banana 是不同模型，按末尾快照选择，不能把名称当作同一模型的别名。

## FLUX.2 / FLUX Kontext：稳定写法

- FLUX 使用具体、描述性的自然语言；可按“主体 + 动作 + 风格/媒介 + 场景/光线”组织，但不必僵化成关键词串。
- 新的生成、编辑与多参考工作流优先使用 FLUX.2。逐张说明参考图用途，编辑时清楚写出要改变的内容和必须保留的内容。
- FLUX Kontext 是上下文编辑家族；用户明确指定旧 Kontext 接口时可按其工作流输出，但新项目的默认选择以快照中的官方建议为准。
- **不要为 FLUX 输出 negative prompt。** 改写为正向目标：`no blur` → “sharp focus throughout”；`no people` → “an empty scene”；`no text` → “a clean image with an unmarked surface”。
- 需要精确控制时，可写清镜头、材质、对象对应的 HEX 色值和参考图角色；不要只堆“masterpiece”“best quality”等空泛质量词。

## Stable Diffusion：独立工作流

- Stable Diffusion 保留独立 negative prompt；它不与 Midjourney 的 `--no` 或自然语言平台的正向约束共用词表。
- 正向 prompt 按当前 checkpoint 的习惯组织主体、环境、光线、镜头/空间、媒介与风格；negative prompt 只排除当前模型确实常见且与目标相关的缺陷。
- 构图、姿态、边缘、深度等结构约束走 ControlNet；风格、角色或产品参考走 IP-Adapter。具体节点、权重和预处理器由用户实际使用的 WebUI / ComfyUI 工作流决定。
- 写实任务不要把合理噪点、自然高光或真实暗部一概列为缺陷；只在与目标冲突时排除**过度 HDR、过度数字锐化、塑料皮肤、过度磨皮**等现象。

## 版本快照（最后核验：2026-07-10）

### Midjourney

- 当前默认版本为 **V8.1**。普通任务可依赖默认版本；需要可复现的明确交付时可写 `--v 8.1`。
- 当前 Raw 语法为 `--raw`。写实控制示例：`... --ar 4:5 --raw --stylize 50 --v 8.1`。
- Style Reference 可用于 V6 及以后版本；V8.1 示例：`... --sref <URL> --sw 100 --v 8.1`。
- **Omni Reference 仍只兼容 V7**，参数为 `--oref <URL>`，权重为 `--ow`。如果用户要求 Omni Reference，自动切到兼容路径：`... --oref <URL> --ow 100 --raw --v 7`；不要把 `--oref` 与 `--v 8.1` 组合。
- 当前动漫版本为 **Niji 7**，写作 `--niji 7`；不要同时附加 `--v 8.1`。
- 官方依据：[Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)、[Raw](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw)、[Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)、[Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)、[`--no`](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No)。

### OpenAI

- 当前 GPT Image 主模型为 **GPT Image 2**，API 模型 ID 为 `gpt-image-2`；文档将其列为当前先进的图像生成与编辑模型。
- **DALL·E 2 与 DALL·E 3 均已标为 deprecated**，本 Skill 不再推荐它们用于新任务，也不把“GPT Image / DALL·E”并列写成当前方案。
- 长期文案写“GPT Image 家族”；仅在用户要求当前 API 模型或代码时写 `gpt-image-2`。
- 官方依据：[GPT Image 2 model](https://developers.openai.com/api/docs/models/gpt-image-2)、[Image generation guide](https://developers.openai.com/api/docs/guides/image-generation)、[All models](https://developers.openai.com/api/docs/models/all)。

### Google

- **Nano Banana 2** = Gemini 3.1 Flash Image，模型 ID `gemini-3.1-flash-image`；作为通用任务默认选择，兼顾速度、质量、多参考和文字渲染。
- **Nano Banana Pro** = Gemini 3 Pro Image，模型 ID `gemini-3-pro-image`；用于复杂指令、专业资产、世界知识与更精确的创意控制。
- **旧 Nano Banana** = Gemini 2.5 Flash Image，模型 ID `gemini-2.5-flash-image`；它是旧代的高吞吐、低延迟路径，不等同于 Nano Banana 2。
- 官方依据：[Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation)。

### Black Forest Labs

- 当前推荐家族为 **FLUX.2**，覆盖生成与编辑；主要变体包括 `[max]`、`[pro]`、`[flex]`、`[klein]` 与本地开发向 `[dev]`。按质量、规模、控制、延迟与部署方式选择，不把某一变体硬编码为所有任务默认。
- FLUX.2 支持多参考编辑；API 与 playground 的输入上限可能不同，交付通用 prompt 时只说明每张参考图用途，不承诺固定数量。
- **FLUX.1 Kontext 是上一代生成/编辑家族；官方建议新项目优先 FLUX.2。** 用户明确使用既有 Kontext 接口时再保留该路径。
- FLUX.2 官方 prompting guide 明确不支持 negative prompts；本 Skill 对 FLUX.2 / Kontext 输出统一采用正向描述，不提供独立负向区块。
- 官方依据：[FLUX.2 overview](https://docs.bfl.ai/flux_2/flux2_overview)、[FLUX.2 prompting guide](https://docs.bfl.ai/guides/prompting_guide_flux2)、[FLUX.2 image editing](https://docs.bfl.ai/flux_2/flux2_image_editing)、[FLUX Kontext overview](https://docs.bfl.ai/kontext/kontext_overview)。

## 交付前检查

- 是否只使用目标平台自己的语法，并把参数放在正确位置？
- Midjourney 是否使用 `--raw`，且 Omni Reference 是否自动切到 `--v 7`？
- 是否没有推荐 DALL·E 2/3，也没有把旧 Nano Banana 当作 Nano Banana 2？
- FLUX 是否完全没有独立 negative prompt，并已把否定改成正向、可观察的目标？
- Stable Diffusion 的 negative prompt 是否独立、精简，并与 ControlNet / IP-Adapter 职责区分？
- 参考图风格模板模式是否仍遵守纯 Prompt 契约，不附加任何平台参数或负向区块？
