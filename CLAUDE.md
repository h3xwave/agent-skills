# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库定位

多 Agent Skill 的唯一可版本控制主来源。可安装内容只在 `skills/<skill-name>/`；`docs/<skill-name>/` 放各技能的人类文档（不随安装分发）；`tests/`、README、CHANGELOG 永不进入安装目录。安装目标是 `~/.codex/skills/<name>`（默认）或通过 `-DestinationRoot` 指定的其他宿主（如 `$HOME\.claude\skills`）。

## 常用命令

```powershell
# 校验全部 Skill（结构 + 官方校验 + 领域校验）
py -3 tests/validate_repository.py

# 只校验一个 Skill
py -3 tests/validate_repository.py --skill patent-disclosure

# 单独跑某个 Skill 的领域校验器（含行为用例检查）
py -3 tests/patent-disclosure/validate.py skills/patent-disclosure

# 安装（先自动跑全部校验，失败不覆盖；DryRun 只打印计划）
.\scripts\install-skill.ps1 -Name <skill-name> -DryRun
.\scripts\install-skill.ps1 -Name <skill-name>
.\scripts\install-skill.ps1 -Name <skill-name> -DestinationRoot "$HOME\.claude\skills"

# patent-disclosure 的 Word 导出冒烟（需 python-docx）
py -3 skills/patent-disclosure/scripts/generate_docx.py <input.md> <output.docx>
```

Windows 环境，Python 用 `py -3` 调用。官方校验器位于 `~/.codex/skills/.system/skill-creator/scripts/quick_validate.py`，仓库校验器会自动调用它，缺失时整体失败。

## 校验体系（四层，理解这个再动手改）

1. **仓库级** `tests/validate_repository.py`：自动发现 `skills/` 下含 SKILL.md 的目录。检查目录名与 frontmatter `name` 一致、frontmatter 只含 `name`/`description`、顶层内容在白名单内、不同 Skill 的 description 中带引号触发语不重复。
2. **官方** `quick_validate.py`：frontmatter YAML 合法性、name/description 约束（description ≤1024 字符、不含尖括号）。
3. **领域级** `tests/<skill-name>/validate.py` + `behavior_cases.json`：每个 Skill 自己的静态硬约束和文档契约。存在即自动运行，但不等同于真实模型行为测试。
4. **执行评测** `evals.json` + `trigger_evals.json`：前者保存真实任务与验收点，后者固定为 10 条应触发和 10 条不应触发请求。修改行为时以旧版 Skill 快照为基线运行并人工复核；仓库校验只检查这些评测文件的结构。

### 顶层白名单是双份的，必须同步改

`tests/validate_repository.py` 的 `ALLOWED_TOP_LEVEL` 和 `scripts/install-skill.ps1` 的 `$allowedTopLevel` 是同一份契约的两个副本（当前：`SKILL.md, agents, references, scripts, assets, rules, workflows, templates, docs`）。加新目录类型时两处都要改，并更新 README 中的支持项列表。

### 契约用例的证据串是逐字符匹配

`behavior_cases.json` 中 `contains_all` 的证据串必须与技能文件文本**逐字符一致**（注意全角标点、en dash）。先改技能文件，再从改后的原文里复制证据串，不要手打。它只证明规则存在；最终输出行为由执行评测验证。

### 各 Skill 领域校验器的硬约束（改文件前先了解，否则校验挂）

- **design-image-prompt-engineer**：SKILL.md 正文只设 90 行上限、不设下限；每个引用必须从明确任务条件直达；平台快照必须有可解析核验日期和官方来源；全库禁 `--style raw`、推荐 DALL·E 和 FLUX 负向提示词。
- **patent-disclosure**：近期年份窗口只能用于趋势/方向挖掘，专利现有技术检索不得设置任意近年下限；评估输出不得使用固定重合度或过审率；rules/workflows/references/templates 下所有文件必须由 SKILL.md 的对应任务直达。

## 安装脚本行为

`install-skill.ps1` 正式安装前：跑仓库校验（失败即止）→ 把旧安装完整备份到 `.artifacts/backups/<timestamp>/<name>/` → 复制全部源文件 → SHA-256 逐文件核对。目标目录中的未知文件保留不删。`.artifacts/` 和 `__pycache__/` 已被 gitignore，但注意安装是"复制源目录全部文件"，技能目录里不要留生成物（领域校验器也会拦 `.pyc`）。

## 修改惯例

- 改技能规则时同步维护 `behavior_cases.json`；改触发或输出行为时还必须更新 `evals.json` / `trigger_evals.json`，并用旧版快照做对比评测。
- 版本记录只写仓库根 `CHANGELOG.md`（Keep a Changelog 格式，每个 Skill 独立 semver）。
- 新增 Skill：目录名必须与 frontmatter `name` 一致；不同 Skill 的 description 触发语保持互不重叠；无需维护任何清单文件（自动发现），README 的表格仅供人工浏览。
- 交流与文档默认使用中文。
