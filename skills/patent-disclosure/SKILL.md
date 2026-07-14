---
name: patent-disclosure
description: >
  专利交底书与发明披露材料助手。用于用户说“我有个发明想申请专利”或
  “把技术方案整理成交底书”，把发明想法、研发资料或已有交底材料整理、审阅和补强，
  提炼供代理人撰写权利要求的保护点素材，或开展初步现有技术检索与可专利性风险梳理。
  仅提供供专利部门或代理人复核的技术材料和初步检索辅助；不承诺生成可直接提交的
  正式申请文本、最终权利要求或法律意见，也不用于侵权/FTO 分析。
---

# 专利交底书编写 Skill

默认面向中国专利实践，以中文 Markdown 形成交给企业专利部门或专利代理人的技术材料。根据用户目标选择快速模式或完整模式，不把完整流程机械套到单纯整理、润色或导出任务上。

## Always Read

1. `rules/core-rules.md`

## 工作模式

### 快速模式

适用于已有材料整理、结构检查、局部补强、语言润色、提炼保护点素材和 Word 导出。快速模式不强制联网检索或输出预判报告；应保留用户原结构/模板，明确未核验的事实、检索缺口和需要代理人确认的事项。

### 完整模式

适用于从发明想法形成完整交底书，或用户明确要求现有技术检索、冲突分析和可专利性风险评估。按“公开风险 → 自适应访谈/材料审查 → 现有技术评估 → 用户确认 → 起草”推进。联网不可用时可以继续整理，但必须说明检索未完成及其影响，不得把离线判断写成最新结论。

用户明确选择的模式优先；若未说明，根据任务目标选择，并用一句话告知采用的模式。用户可要求从完整模式切换到快速模式。

## Session Discipline

- 每个新任务重新核对 Common Tasks；不要沿用上一个任务的检索或起草阶段。
- 仅在任务路由需要联网检索时读取检索材料，并使用系统当前日期确定检索截止日期。
- 多目标任务按依赖关系执行；无依赖的润色、格式化或导出不等待检索。

## Common Tasks

| 用户任务 | 按阶段读取 | 执行流程 |
|---|---|---|
| 挖掘可申请方向、寻找潜力切入点 | `rules/search-and-confidentiality.md` + `references/search_strategy.md` + `references/webSearch.csv` | `workflows/discovery.md` |
| 从想法或零散材料形成完整交底书 | 先读 `workflows/interview.md`；进入评估时再读检索材料和 `references/analysis_framework.md`；进入起草时再读模板/术语材料 | `workflows/interview.md` → `workflows/prior-art-assessment.md` → `workflows/draft-disclosure.md`（完整模式） |
| 评估现有技术冲突、可专利性风险 | `rules/search-and-confidentiality.md` + `references/search_strategy.md` + `references/analysis_framework.md` + `references/webSearch.csv` | `workflows/prior-art-assessment.md` |
| 快速整理、补强或润色已有材料 | 用户模板（如有）优先；否则读 `templates/disclosure-template.md`；按需读 `references/terminology.md`、`references/scenarios.md` | `workflows/draft-disclosure.md`（快速模式） |
| 已完成评估后起草完整交底书 | 用户模板（如有）优先；否则读 `templates/disclosure-template.md`；按需读 `references/terminology.md`、`references/scenarios.md` | `workflows/draft-disclosure.md`（完整模式） |
| 生成或导出 Word 文档 | `workflows/export-docx.md` | 直接执行 `scripts/generate_docx.py`，无需先读取源码 |

## Known Gotchas

- 专利现有技术检索不设“近几年”下限；以优先权日或拟申请日为时间上限，未知时用系统当前日期并声明假设。近期年份窗口只用于趋势和方向挖掘。
- 不把未公开的完整方案、内部参数、客户名称、产品代号或源代码直接作为搜索词。
- 风险评估使用高/中/低风险、检索覆盖度、置信度和未知项，不输出无依据的固定过审率。
- 用户模板优先于默认五章模板；Mermaid 图仅在有助于理解且用户需要时生成。
- 快速模式未做检索时，必须明确其结论仅是材料整理或结构性意见。

## Rule Priority

1. 用户明确要求和用户提供的模板
2. 本文件的任务边界与模式选择
3. `rules/` 中的强制规则
4. `workflows/` 中的步骤流程
5. `references/`、`templates/` 与脚本实现

## Project Boundaries

- 产出是供专利部门或代理人继续处理的技术材料，不是可直接提交的正式申请文件。
- 不承诺授权结果，不用固定百分比制造确定性；涉及新颖性、创造性、公开宽限期、权属、侵权或 FTO 时建议咨询专利代理师或律师。
- 不主动要求用户披露不必要的商业秘密；需要敏感细节时先说明用途和风险。
- 默认输出 Markdown；仅在用户要求 Word 时执行导出流程。
