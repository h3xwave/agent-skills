# FLUX Prompt Notes

Last verified: 2026-07-10

只在用户指定 FLUX、FLUX.2 或 FLUX Kontext 时读取。使用具体自然语言描述主体、动作、媒介、场景、光线和保留项；不要输出独立 negative prompt。

## 写法

- 新的生成、编辑和多参考工作流优先使用 FLUX.2；逐张说明参考图用途。
- 编辑任务清楚区分要改变的内容与必须保留的内容。
- 需要精确控制时写明镜头或观察角度、材质、对象对应的 HEX 色值和参考图职责，不堆 `masterpiece`、`best quality` 等空泛词。
- FLUX.2 / Kontext 不使用 negative prompt、`--no` 或 Stable Diffusion 负向字段。把 `no blur` 改成“sharp focus throughout”，把 `no people` 改成“an empty scene”。用户索要负向内容时读取 [negative-prompt-strategies.md](../negative-prompt-strategies.md) 并只输出正向替代表达。

## 版本快照

- 当前推荐家族为 **FLUX.2**，覆盖生成与编辑；主要变体包括 `[max]`、`[pro]`、`[flex]`、`[klein]` 和本地开发向 `[dev]`。
- 按质量、控制、延迟、规模和部署方式选择变体，不硬编码单一默认。
- FLUX.2 支持多参考编辑；API 与 playground 的输入上限可能不同，通用 Prompt 只声明每张图的职责，不承诺固定数量。
- FLUX.1 Kontext 是上一代生成/编辑家族；新项目优先 FLUX.2，用户明确使用既有 Kontext 接口时再保留该路径。

## 交付检查

- 是否完全没有独立 negative prompt 或 `--no`？
- 排除意图是否已改成可观察的正向目标？
- 编辑 Prompt 是否明确修改项、保留项和逐图职责？

## Official sources

- [FLUX.2 overview](https://docs.bfl.ai/flux_2/flux2_overview)
- [FLUX.2 prompting guide](https://docs.bfl.ai/guides/prompting_guide_flux2)
- [FLUX.2 image editing](https://docs.bfl.ai/flux_2/flux2_image_editing)
- [FLUX Kontext overview](https://docs.bfl.ai/kontext/kontext_overview)
