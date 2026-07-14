# patent-disclosure Skill

`patent-disclosure` 把发明想法、研发资料或已有交底书整理成供企业知识产权部门或专利代理人复核的技术材料。默认面向中国专利实践并输出中文 Markdown；运行时边界和任务路由以 [SKILL.md](../../skills/patent-disclosure/SKILL.md) 为准。

English documentation: [README.md](README.md).

## 适合与边界

适合：

- 从宽泛研发方向梳理候选保护点。
- 通过少量、自适应问题补齐发明信息。
- 检索专利、论文、标准、产品和公开实现，形成初步现有技术评估。
- 按保护点报告定性风险、证据覆盖度、置信度和未知项。
- 起草、审阅、补强或润色专利交底书。
- 整理供代理人转化的保护点和权利要求素材。
- 将符合约束的 Markdown 交底书导出为 `.docx`。

不适合：

- 代替代理人或律师给出正式法律意见、侵权/FTO 结论或授权承诺。
- 生成未经专业复核即可提交的申请文本或最终权利要求。
- 代用户向专利局提交申请。

## 两种工作模式

| 模式 | 适用情况 | 行为 |
| --- | --- | --- |
| 完整模式 | 只有初步想法，或明确要求现有技术检索/风险评估 | 公开风险确认 → 自适应访谈 → 现有技术评估 → 用户确认 → 起草 |
| 快速模式 | 已有较完整材料，只需整理、审阅、补强、润色、提炼保护点或导出 Word | 保留用户结构或模板，说明未检索事项，但不强制联网、预判报告或固定轮次访谈 |

专利现有技术检索不限定在最近几年，而是围绕保护点、分类号、引用链和相关日期上限覆盖历史资料。报告使用高/中/低风险，不输出固定授权率或“过审率”。

## 典型请求

```text
我有一个传感器结构创新，想走完整流程形成给代理人的交底材料。
这是已有研发说明，请按我的模板快速整理，暂时不要联网。
检索这个机械连接结构的历史现有技术，并按保护点给出定性风险。
把已经定稿的交底书 Markdown 导出为 Word，不要重新检索。
```

## 时效与保密

联网检索只用于方向挖掘、现有技术评估或用户明确要求的研究。未公开的项目代号、内部参数、客户名称、源代码和完整方案不得直接作为外部查询词；应先抽象为技术问题、技术手段和技术效果。

检索结论受数据库覆盖、检索截止日期和未公开资料限制，应交由专业代理人复核。

## Word 导出

Word 导出需要 Python 3 和 `python-docx`。在仓库根目录执行：

```shell
python -m pip install python-docx
npm run test:docx
npm run patent:export -- input.md output.docx
```

输出使用 A4 页面。脚本不会渲染 Mermaid；Mermaid 代码块会转换为手动插图占位文字，本地图片也需在 Word 中后处理。完整输入限制以 [导出工作流](../../skills/patent-disclosure/workflows/export-docx.md) 为准。

## 安装与使用

```shell
npm ci
npm run skill:install -- --name patent-disclosure --dry-run
npm run skill:install -- --name patent-disclosure
```

显式调用示例：

```text
使用 $patent-disclosure，把这份研发说明整理成供专利代理人复核的交底材料。
```

仓库静态与契约校验使用 `npm run validate -- --skill patent-disclosure`；DOCX 冒烟独立执行，不会让默认安装依赖 Python。
