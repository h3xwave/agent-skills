---
name: patent-disclosure
description: >
  专利交底书编写助手。当用户需要"专利交底书"、"发明披露"、"技术交底"、
  "申请专利"、"发明说明"、"权利要求草案"、"专利文本"、"发明人陈述"，
  或表示"我有个发明想申请专利"、"帮我把技术方案整理成交底书"时必须使用。
  Activate when the task requires patent disclosure drafting, invention-mining,
  prior-art conflict assessment, or converting an invention idea into materials
  suitable for patent counsel. 网络检索可用时必须检索；不可用时必须标注信息可能滞后。
---

# 专利交底书编写 Skill

帮助发明人完成方向挖掘、结构化访谈、授权前景预评估、交底书起草、修改和 Word 导出。默认面向中国专利实践，输出中文 Markdown 交底书正文。

## Always Read

1. `rules/core-rules.md`
2. `rules/search-and-confidentiality.md`
3. `references/webSearch.csv`

## Session Discipline

- 每个新任务都重新核对下方 Common Tasks 路由，不要凭上一次会话记忆直接执行。
- 如果用户同时要求多个目标，按"公开风险 → 检索/访谈 → 预判报告 → 起草 → 修改/导出"顺序处理。
- 任何联网检索均使用系统提供的当前日期计算时间窗口，并在报告中标注检索截止日期。

## Common Tasks

| 用户任务 | 读取材料 | 执行流程 |
|---|---|---|
| 挖掘可申请方向、寻找授权潜力切入点 | Always Read + `references/search_strategy.md` | `workflows/discovery.md` |
| 从发明想法整理成完整交底书 | Always Read + `references/search_strategy.md` + `references/analysis_framework.md` + `references/terminology.md` + `templates/disclosure-template.md` | `workflows/interview.md` → `workflows/prior-art-assessment.md` → `workflows/draft-disclosure.md` |
| 评估授权前景、撞车风险、现有技术冲突 | Always Read + `references/search_strategy.md` + `references/analysis_framework.md` | `workflows/prior-art-assessment.md` |
| 修改、补强或润色已有交底书 | Always Read + `references/terminology.md` + `references/scenarios.md` + `templates/disclosure-template.md` | `workflows/draft-disclosure.md` |
| 生成或导出 Word 文档 | Always Read + `scripts/generate_docx.py` | `workflows/export-docx.md` |

## Known Gotchas

- 未联网检索时不得假装信息最新；必须说明"信息可能滞后"。
- 检索年份不得硬编码，必须由系统 `currentDate` 推导。
- 未完成公开风险询问与授权前景预判前，不应直接起草正式交底书。
- 交底书只写技术问题、技术手段和技术效果，避免把商业卖点包装成技术贡献。
- 检索时不要把未公开的完整方案、内部参数或商业秘密直接作为搜索词。

## Rule Priority

1. 本文件的任务路由与边界
2. `rules/` 中的强制规则
3. `workflows/` 中的步骤流程
4. `references/` 中的参考资料
5. `templates/` 与 `scripts/` 中的输出/工具实现

## Project Boundaries

- 本 skill 提供交底书撰写和初步检索辅助，不替代专利代理师或律师的法律意见。
- 不承诺授权结果；过审率只能作为基于检索范围的情景化预估。
- 不主动要求用户披露不必要的商业秘密；需要细节时先说明用途和风险。
- 默认输出 Markdown；只有用户要求 Word 时才执行导出流程。

