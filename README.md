# Skills Repository

本仓库集中维护可独立发现、验证和安装的Skills。每个 Skill 都有自己的触发范围、说明文件和可选资源；仓库级脚本负责统一验证、备份与同步。

仓库是所有 Skill 的唯一可版本控制主来源。可安装内容只位于 `skills/<skill-name>/`；根目录文档、测试和安装脚本不会同步进 Codex Skill 目录。

## Skill 清单

| Skill | 用途 |
| --- | --- |
| `design-image-prompt-engineer` | 创作、诊断和优化多媒介 AI 图像提示词，支持参考图分析/模板/具体主体与人物一致性用法；直接出图转交图像工具（详见 [docs/design-image-prompt-engineer/README.zh-CN.md](docs/design-image-prompt-engineer/README.zh-CN.md)） |
| `patent-disclosure` | 方向挖掘、自适应访谈、定性现有技术风险评估、交底书快速/完整模式与 Word 导出（详见 [docs/patent-disclosure/README.zh-CN.md](docs/patent-disclosure/README.zh-CN.md)） |

## 目录

```text
.
├── skills/
│   ├── design-image-prompt-engineer/
│   │   ├── SKILL.md
│   │   ├── agents/openai.yaml
│   │   └── references/
│   └── patent-disclosure/
│       ├── SKILL.md
│       ├── rules/
│       ├── workflows/
│       ├── references/
│       ├── templates/
│       └── scripts/
├── tests/
│   ├── validate_repository.py
│   ├── design-image-prompt-engineer/
│   │   ├── validate.py
│   │   ├── behavior_cases.json
│   │   ├── evals.json
│   │   └── trigger_evals.json
│   └── patent-disclosure/
│       ├── validate.py
│       ├── test_generate_docx.py
│       ├── behavior_cases.json
│       ├── evals.json
│       └── trigger_evals.json
├── docs/
│   ├── design-image-prompt-engineer/
│   │   └── README.zh-CN.md
│   └── patent-disclosure/
│       ├── README.md
│       └── README.zh-CN.md
├── scripts/
│   └── install-skill.ps1
├── README.md
└── CHANGELOG.md
```

每个 `skills/<name>/` 目录只能包含可安装内容。支持的顶层项目为 `SKILL.md`、`agents/`、`references/`、`scripts/`、`assets/`、`rules/`、`workflows/`、`templates/` 和 `docs/`；测试、README 与变更记录放在 Skill 目录之外。

## 验证

验证仓库中的全部 Skill：

```powershell
py -3 ".\tests\validate_repository.py"
```

只验证一个 Skill：

```powershell
py -3 ".\tests\validate_repository.py" --skill design-image-prompt-engineer
```

仓库级校验会检查 Skill 名称、目录、frontmatter、可安装内容、重复触发语和评测数据结构，并为每个 Skill 自动运行官方 `quick_validate.py`；存在 `tests/<name>/validate.py` 时还会运行该 Skill 的静态与契约检查。

`behavior_cases.json` 用于锁定文档契约，不代表模型行为已经通过。`evals.json` 保存真实执行任务与验收点，`trigger_evals.json` 保存 10 条应触发和 10 条不应触发的边界请求；修改 Skill 行为时应以旧版快照为基线运行这些评测并人工复核输出。

专利 Skill 的 Word 导出及其冒烟测试依赖 `python-docx`；首次验证或导出前安装：

```powershell
py -3 -m pip install python-docx
```

## 安装

安装脚本按名称从 `skills/<name>/` 读取源文件。默认目标根目录是 `$HOME\.codex\skills`。

```powershell
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer -DryRun
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer
```

如果当前通过 `.cc-switch` 加载 Skill，显式指定目标根目录：

```powershell
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer -DestinationRoot "$HOME\.cc-switch\skills" -DryRun
.\scripts\install-skill.ps1 -Name design-image-prompt-engineer -DestinationRoot "$HOME\.cc-switch\skills"
```

正式同步会先把旧安装完整备份到 `.artifacts/backups/<timestamp>/<skill-name>/`，再复制全部源文件并核对 SHA-256。目标目录中的未知文件会保留；验证失败时不会覆盖现有安装。

## 新增 Skill

1. 在 `skills/<skill-name>/` 创建独立 Skill；目录名必须与 `SKILL.md` 的 `name` 一致。
2. frontmatter 只保留 `name` 和 `description`，不要添加 `primary` 等非官方字段。
3. 让不同 Skill 的 `description` 和自然语言触发语保持清晰、互不重叠。
4. 需要领域回归时，在 `tests/<skill-name>/` 添加 `validate.py` 和行为案例；没有专用测试时仍会运行官方校验。
5. 运行仓库级验证，再通过 `install-skill.ps1 -Name <skill-name>` 安装。

不需要维护额外的 Skill 清单或安装清单：`skills/` 下含 `SKILL.md` 的目录会被自动发现。README 中的表格仅用于人工浏览。
