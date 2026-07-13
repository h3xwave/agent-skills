# design-image-prompt-engineer Skill

`design-image-prompt-engineer` 用于编写、诊断和优化 AI 图像提示词，也可说明参考图应如何参与生成流程。它支持摄影、插画、平面、矢量、3D/CGI 等常见视觉媒介，但交付物始终是 Prompt、诊断结论或参考图使用建议。

运行时触发范围与任务路由以 [Skill 源文件](../../skills/design-image-prompt-engineer/SKILL.md) 为准；本文只帮助人阅读和安装，不复制运行时规则。

## 能力边界

适合使用本 Skill：

- 根据文字 brief 编写可直接使用的图像 Prompt。
- 诊断或优化已有 Prompt，修复媒介混乱、空泛描述、平台语法冲突等问题。
- 分析参考图、提取可复用风格，或为指定新主体编写完整 Prompt。
- 诊断人物参考中的一致性、比例或表情问题，并给出 Prompt 与参考图用法建议。
- 用户指定生成平台时，按需适配该平台的表达方式。

不适合使用本 Skill：

- 直接生成、重绘或编辑图片。这类请求应交给图像生成或编辑工具。
- 只需要评价图片好不好看，而不需要 Prompt、故障诊断或参考图使用建议。
- 与图像无关的“去 AI 味”、文案润色或通用文本提示词任务。

人物参考分支只负责 Prompt、故障诊断和参考图使用方式，不代替实际的人脸替换、换装、换背景或图片编辑。

## 任务模式

### 从文字或已有 Prompt 开始

可从零编写 Prompt，也可在保留主体和创作意图的前提下优化现有 Prompt。未指定平台时输出通用自然语言；指定平台后才读取相应平台资料。

### 使用参考图

参考图支持三种模式：

1. **分析模式**：解释画面的媒介、构图、光线、色彩和风格特征。
2. **模板模式**：提取可复用的风格 Prompt，并保留主体替换位置。
3. **具体新主体模式**：把用户明确指定的新主体写入完整 Prompt，不退化成占位模板。

风格迁移会避免无意复制参考图中附带的身份和专有内容，但不会擅自泛化用户明确指定的新品牌、自有角色、自有产品或其他有权使用的主体。

### 人物参考

当用户希望用人物照片编写新场景 Prompt，或需要诊断人物比例、表情和一致性问题时，本 Skill 可说明每张参考图的职责、Prompt 写法和可行的生成步骤。若用户要求实际生成或编辑图片，应切换到相应图像工具。

## 简短示例

- “帮我把这段产品 brief 写成一条通用图像 Prompt。”
- “诊断这条摄影 Prompt 为什么看起来很像 AI，并给出优化版。”
- “分析这张参考图，给我一个可替换主体的风格模板。”
- “保留参考图的视觉风格，把主体换成我的品牌咖啡机，写完整 Prompt。”
- “我用头像生成全身照时比例和表情不稳定，请分析原因并改写 Prompt。”

如果请求是“直接把这张头像换衣服并生成成图”，则不应调用本 Skill。

## 平台资料的时效

平台模型、参数和参考图能力会持续变化。Skill 只在用户指定平台或确实需要平台语法时读取平台资料，并以其中标注的核验日期和官方来源为准。长期复用的 Prompt 宜优先使用平台家族名称；需要精确版本或参数时，应在执行前重新核验。

## 安装与使用

默认安装到 `$HOME\.codex\skills`：

```powershell
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer -DryRun
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer
```

通过 `.cc-switch` 加载时，可显式指定目标目录：

```powershell
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer -DestinationRoot "$HOME\.cc-switch\skills"
```

安装后可直接用自然语言描述任务，也可显式点名：

```text
使用 $design-image-prompt-engineer，分析这张参考图并为我指定的新产品编写完整 Prompt。
```
