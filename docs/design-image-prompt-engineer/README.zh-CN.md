# design-image-prompt-engineer Skill

`design-image-prompt-engineer` 把文字 brief、已有 Prompt 或参考图转成可执行的图像 Prompt、诊断结论或参考图使用建议。支持摄影、插画、平面、矢量、拼贴、3D/CGI 和动漫等媒介；运行时触发范围与任务路由以 [SKILL.md](../../skills/design-image-prompt-engineer/SKILL.md) 为准。

English documentation: [README.md](README.md).

## 适合与边界

适合：

- 从文字 brief 编写通用或平台适配的图像 Prompt。
- 在保留主体和审美意图的前提下优化已有 Prompt。
- 诊断生成结果的 AI 感、媒介混乱、平台语法冲突或负向误伤。
- 分析参考图风格，生成可替换主体模板，或写入用户指定的新主体。
- 诊断人物参考中的身份一致性、比例和表情问题，并说明各参考图职责。

不适合：

- 直接生成、重绘或编辑图片；这类请求应使用图像生成/编辑工具。
- 只评价图片而不需要 Prompt、生成故障诊断或参考图用法。
- 与图像无关的“去 AI 味”、文案润色或通用文本 Prompt。

人物参考仅处理用户本人或已获授权的照片。文字 Prompt 不能单独保证身份一致，也不会把头像中不可见的身体特征描述成事实。

## 任务模式

| 模式 | 交付物 |
| --- | --- |
| 从零编写 | 一条通用自然语言 Prompt；指定平台时再加入平台语法 |
| 优化/诊断 | 原因、修复优先级和保留原意的改写版 |
| 风格分析 | 对媒介、构图、光线、色彩和风格的结构化说明 |
| 可替换模板 | 保留风格控制并提供明确的主体替换位 |
| 具体新主体 | 将用户指定的产品、角色、品牌或文案写进完整 Prompt |
| 人物参考 | 参考图职责、生成步骤、冲突诊断和修正版 Prompt |

平台语法不会混用。只有目标平台支持且任务需要时，才会输出独立 negative prompt、`--no` 或其他专用参数。

## 典型请求

```text
帮我把这段产品 brief 写成一条通用图像 Prompt。
诊断这条摄影 Prompt 为什么像 AI，并给出优化版。
分析这张参考图，给我一个可替换主体的风格模板。
保留参考图的风格，把主体换成我的品牌咖啡机，写完整 Prompt。
我用自己的头像生成全身照时比例和表情不稳定，请分析原因并改写 Prompt。
```

如果请求是“直接把这张头像换衣服并生成成品图”，则不应调用本 Skill。

## 平台资料时效

平台模型、参数和参考图能力会变化。只有用户指定平台或任务确实需要平台语法时，Skill 才读取对应平台资料，并以其中的核验日期和官方来源为准。精确版本或参数在使用前应重新核验。

## 安装与使用

在仓库根目录执行：

```shell
npm ci
npm run skill:install -- --name design-image-prompt-engineer --dry-run
npm run skill:install -- --name design-image-prompt-engineer
```

安装到其他宿主：

```shell
npm run skill:install -- --name design-image-prompt-engineer --destination-root ~/.cc-switch/skills
```

显式调用示例：

```text
使用 $design-image-prompt-engineer，分析这张参考图并为我指定的新产品编写完整 Prompt。
```
