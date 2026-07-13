---
name: design-image-prompt-engineer
description: >
  Use when the deliverable is an AI image prompt, prompt diagnosis, reusable
  visual-style prompt, or reference-image workflow guidance. Trigger for requests
  such as "写图片提示词", "优化摄影/插画提示词", "图片不要 AI 味", "生活抓拍提示词",
  Midjourney/GPT Image/Nano Banana/FLUX/Stable Diffusion prompt, 反推或提取图片风格,
  "保留风格替换主体", and AI image-reference generation problems involving the same
  person's identity, proportions, or expression. Covers photography, illustration, graphic
  design, vector, collage, glitch, 3D/CGI, mixed media, and anime. Use only for
  prompt delivery, diagnosis, or reference usage guidance; if the user asks Codex
  to actually generate or edit the image, use imagegen instead.
---

# Design Image Prompt Engineer

把文字 brief、已有 Prompt 或参考图转成可执行的图像 Prompt、诊断或参考图用法说明。先保留用户意图，再做媒介与平台适配。

## 边界

- 本 Skill 只交付 Prompt、诊断或参考图工作流说明，不直接生成或编辑图片；直接出图请求转交 `imagegen`。
- 默认输出中文；用户指定英文、双语或平台语言时服从用户。
- 只有分析具体画面必需时才索要参考图；一般故障诊断先给可验证的原因与修复顺序。
- 人物参考仅处理用户本人或已获授权的照片；不承诺文字 Prompt 单独保证身份一致。

## 任务路由

只读取命中任务条件的文件；平台与负向资料均按需读取。

| 任务条件 | 必读 | 按需补充 |
| --- | --- | --- |
| 摄影、照片感、像实拍、不要 AI 味 | [摄影框架](references/photography-framework.md) | [摄影模板](references/photography-templates.md)、[风格库](references/style-library.md)、[布光](references/lighting-techniques.md)、[构图与镜头](references/composition-camera-language.md)、[调色](references/color-grade-library.md) |
| 插画、平面、矢量、拼贴、glitch、3D、动漫 | [非摄影框架](references/non-photographic-framework.md) | [非摄影模板](references/non-photographic-templates.md)、[风格库](references/non-photo-style-library.md)、[技法库](references/illustration-technique-library.md) |
| 优化、解释或诊断已有 Prompt | [优化流程](references/prompt-optimization.md) | 再按媒介读取上列框架；含负向内容时读取[负向策略](references/negative-prompt-strategies.md) |
| 参考图风格分析、模板或换具体主体 | [参考图工作流](references/reference-image-workflow.md) | 再按参考图媒介选择相关词库 |
| 用照片保持同一人物，或诊断比例、表情、一致性 | [人物参考一致性](references/person-reference.md) | 再按目标媒介读取摄影或非摄影框架 |
| 用户要求 negative prompt、`--no`，或现有 Prompt 含负向内容 | [负向策略](references/negative-prompt-strategies.md) | 同时读取目标平台文件 |
| 用户指定 Midjourney | [Midjourney](references/platforms/midjourney.md) | 需要排除项时再读负向策略 |
| 用户指定 GPT Image | [GPT Image](references/platforms/gpt-image.md) | 需要排除项时再读负向策略 |
| 用户指定 Nano Banana / Gemini Image | [Nano Banana](references/platforms/nano-banana.md) | 需要排除项时再读负向策略 |
| 用户指定 FLUX / Kontext | [FLUX](references/platforms/flux.md) | 用户索要负向内容时再读负向策略 |
| 用户指定 Stable Diffusion / SD / ComfyUI | [Stable Diffusion](references/platforms/stable-diffusion.md) | 需要 negative prompt 时再读负向策略 |

## 执行顺序

1. 确认交付是从零 Prompt、优化、诊断、参考图分析、可替换模板，还是带具体新主体的完整 Prompt。
2. 判断摄影或非摄影媒介；人物身份保留路由优先于普通风格迁移。
3. 读取对应框架，从主体、场景、构图/版式、光影、空间、材质、媒介技法和风格/后期中选择与任务相关的要素；摄影仅在有助于控制画面时补镜头、焦段和景深。
4. 仅在用户指定平台时加入该平台语法；未指定时输出通用自然语言 Prompt。
5. 优化模式保留原主体、媒介和关键审美，消解冲突与冗余，不为套模板推翻原意。

## 输出规则

- 诊断先给原因和修复优先级；需要时再给改写后的 Prompt 与参考图用法。
- 参考图模式严格区分“风格分析 / 可替换模板 / 具体主体完整 Prompt”，遵守各自输出契约。
- 用户明确指定的新主体、自有角色、品牌、Logo、文案和其他身份元素应保留；只泛化参考图附带且用户未要求迁移的专有元素，并继续服从上层安全规则。
- 不例行加入“无文字、无 Logo、无品牌”。正常招牌、包装和品牌可按真实语境出现；准确内容需写清文字、位置和层级。
- 平台语法不得混用；只在目标平台支持时输出独立 negative prompt 或专用负向参数。

## 交付检查

- 媒介语言一致，非摄影未被无关焦段、景深或胶片词污染。
- 摄影轨道、真实感锚点预算和主导光源符合摄影框架。
- 人物照片职责清楚，表情与头部角度只有一个指令来源；头像扩展全身时已声明身体假设或补充结构参考。
- 参考图输出模式正确，用户明确指定的新主体或品牌没有被擅自泛化。
- 最终内容具体可执行，不依赖“高级、好看、氛围感”等空泛词。
