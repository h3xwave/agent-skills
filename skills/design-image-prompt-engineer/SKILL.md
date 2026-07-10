---
name: design-image-prompt-engineer
description: >
  Use when the requested deliverable is an AI image prompt, reusable visual-style
  prompt, prompt diagnosis, or reference-image usage guidance derived from a text
  brief, product concept, existing prompt, or uploaded reference image. Includes
  diagnosing and fixing person-consistency failures when keeping the same person
  across new scenes with stable proportions and expressions.
  Covers photography, illustration, poster/graphic design, vector,
  collage, glitch, 3D/CGI, mixed media, anime, and platform-ready prompt syntax.
  Trigger for 写图片提示词, 图像提示词, 优化写实提示词, 像实拍, 不要 AI 味,
  自然皮肤, 手机随手拍, 生活抓拍, 摄影 prompt, 插画提示词, Midjourney prompt,
  Nano Banana prompt, Flux prompt, 反推提示词, 提取图片风格, 保留风格替换主体,
  用照片里的人生成, 人物一致性, 换场景保持同一人物, 人物比例失调, 表情怪异,
  为什么人物比例怪, or 把这个画面想法写成 AI 绘图提示词. Use for prompt
  delivery, diagnosis, or reference-workflow guidance; do not activate when the
  user asks to directly generate or edit an image.
---

# Design Image Prompt Engineer

把文字 brief、已有提示词或参考图转化为可直接使用的专业图像提示词。保持媒介语言准确、平台语法适配，并让摄影写实需求按目标而不是按“瑕疵越多越真实”处理。

## Workflow

1. 判断任务是从零生成、优化已有 Prompt、故障诊断、参考图风格模板，还是参考图加具体新主体；再判断摄影或非摄影媒介。
2. 只有需要分析具体参考图画面或照片质量时，缺图才请用户上传；一般故障诊断先给原则性判断，不把图片作为阻塞条件。
3. 用户提供人物照片并要求同一人物出现在新画面，或询问人物参考导致的比例、表情与一致性故障时，优先读取[人物参考一致性](references/person-reference.md)；此路由优先于风格迁移，不剥离用户要求保留的人物身份。
4. 摄影任务读取[摄影框架](references/photography-framework.md)；按商业精修、干净真实、生活抓拍三轨选择[写实规则](references/photorealism.md)。普通生活照或生活方式人像默认干净真实；只有明确抓拍、随手拍、纪实、未摆拍或动作瞬间才进入生活抓拍。
5. 非摄影任务读取[非摄影框架](references/non-photographic-framework.md)，再按需选择具名风格与技法。
6. 优化已有 Prompt 时读取[优化规则](references/prompt-optimization.md)，保留原意并修复媒介模糊、空泛词、技法冲突与负向误伤。
7. 指定平台时读取[平台说明](references/platform-notes.md)与[负向策略](references/negative-prompt-strategies.md)；未指定平台时输出通用自然语言 Prompt。
8. 不属于人物参考一致性的参考图风格模板或可复用反推 Prompt，读取并遵守[参考图输出契约](references/reference-image-contract.md)；用户提供其他具体新主体并明确要完整 Prompt 时，改读[参考图分析维度](references/style-dimensions.md)，不保留原图身份。

## Photography Routing

- **商业精修**：受控布光、干净材质、精确后期；默认不添加瑕疵。
- **干净真实**：合理镜头、曝光、材质和阴影，可选 0–1 个轻微真实感锚点；“像实拍 / 不要 AI 味”默认走此轨。
- **生活抓拍**：只响应明确的抓拍或纪实意图；整条 Prompt 合计使用 1–2 个锚点。
- 手机、胶片、一次性相机、早期 CCD、扫描底片作为可叠加的成像修饰器；一个完整预设整体计为一个锚点。
- 人像是否看镜头服从场景；企业头像、证件式肖像可以直视镜头。产品、建筑、房产、汽车和风光不得自动套用 candid 语言。

## Reference Routes

所有 reference 均从此处一层直达；只读取当前任务需要的文件。

- 摄影结构：[photography-framework.md](references/photography-framework.md)
- 摄影写实轨道与锚点预算：[photorealism.md](references/photorealism.md)
- 摄影风格菜单：[style-library.md](references/style-library.md)
- 布光：[lighting-techniques.md](references/lighting-techniques.md)
- 构图与镜头语言：[composition-camera-language.md](references/composition-camera-language.md)
- 胶片、色彩与后期：[color-grade-library.md](references/color-grade-library.md)
- 摄影模板：[photography-templates.md](references/photography-templates.md)
- 非摄影结构：[non-photographic-framework.md](references/non-photographic-framework.md)
- 非摄影风格菜单：[non-photo-style-library.md](references/non-photo-style-library.md)
- 插画与渲染技法：[illustration-technique-library.md](references/illustration-technique-library.md)
- 非摄影模板：[non-photographic-templates.md](references/non-photographic-templates.md)
- 负向与正向约束策略：[negative-prompt-strategies.md](references/negative-prompt-strategies.md)
- 已有 Prompt 优化：[prompt-optimization.md](references/prompt-optimization.md)
- 平台能力与日期快照：[platform-notes.md](references/platform-notes.md)
- 参考图分析维度：[style-dimensions.md](references/style-dimensions.md)
- 参考图输出契约：[reference-image-contract.md](references/reference-image-contract.md)
- 人物参考一致性：[person-reference.md](references/person-reference.md)
- 当下视觉趋势：[visual-trends.md](references/visual-trends.md)

## Output Rules

- 默认输出中文 Prompt；用户要求英文、双语或特定平台语言时按要求调整。
- 故障诊断先给原因与修复顺序；人物参考任务可同时给 Prompt 与参考图用法说明。
- 从零生成或优化模式应覆盖主体、场景、构图/版式、光线/明暗、视角/空间、材质/细节、媒介技法与风格/后期；摄影再补镜头、焦段和景深。
- 只按平台能力决定是否给独立 negative prompt；不得把 Midjourney `--no`、Stable Diffusion negative prompt 和自然语言正向约束混成一套通用负向词。
- 除非用户明确要求纯图、无文字或无品牌，否则不要例行加入“不出现文字、Logo、标志或品牌”等限制；场景中的正常品牌、Logo、招牌、包装文字与其他可读文字可按现实语境自然出现。用户要求准确文案或特定品牌时，描述其内容、位置与层级。参考图风格模板仍剥离原图专有文字。
- 仅在参考图风格提取或迁移时，泛化原图中的具体人物身份、IP、商标、品牌、地标、台词和受保护视觉元素，只迁移可复用美学；从零构建场景时，不因本规则自动排除正常品牌、Logo或文字。人物参考一致性任务按 person-reference.md 保留授权人物的面部身份，其余元素照常泛化。

## Self-Check

- 媒介、构图、光线、材质和后期相互一致；非摄影输出未被无关镜头、景深、胶片颗粒污染。
- 摄影轨道选择符合用户意图，模板内已有锚点已计入总预算，主导光源可解释。
- 干净真实没有被误写成生活抓拍；商业产品没有被自动添加杂物、噪点或过曝。
- 平台参数与当前说明一致，FLUX 不输出 negative prompt，参考图模板不附平台参数。
- 人物参考任务：照片职责已声明，表情与头部角度只有一个指令来源，近景使用标准至中长焦平视，取景与照片匹配或已写头身比例锚点。
- 最终内容具体可执行，不依赖“高级、好看、氛围感”等空泛词。
