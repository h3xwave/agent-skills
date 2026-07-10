# Skills Repository

本仓库集中维护可独立发现、验证和安装的Skills。每个 Skill 都有自己的触发范围、说明文件和可选资源；仓库级脚本负责统一验证、备份与同步。

仓库是所有 Skill 的唯一可版本控制主来源。可安装内容只位于 `skills/<skill-name>/`；根目录文档、测试和安装脚本不会同步进 Codex Skill 目录。

## Skill 清单

| Skill | 用途 |
| --- | --- |
| `design-image-prompt-engineer` | 根据文字 brief、已有 Prompt 或参考图，创作、诊断和优化多媒介 AI 图像提示词 |
| `patent-disclosure` | 专利交底书编写助手：方向挖掘、结构化访谈、授权前景预判、交底书起草与 Word 导出（详见 [docs/patent-disclosure/README.zh-CN.md](docs/patent-disclosure/README.zh-CN.md)） |

## design-image-prompt-engineer 核心行为

- “像实拍 / 不要 AI 味”默认走干净真实，不自动添加噪点、杂物、过曝或抓拍动作。
- 摄影分为商业精修、干净真实、生活抓拍三轨；手机、胶片、一次性相机、早期 CCD 和扫描底片作为统一成像修饰器叠加。
- 企业头像可以直视镜头；产品、建筑、房产、汽车和风光不会被强行套用 candid 语言。
- 普通生活照默认使用静态、干净真实的人像路径；只有明确抓拍、随手拍、纪实或动作瞬间才进入生活抓拍。
- 人物参考任务可诊断比例与表情故障，并区分面部身份、全身体型/姿势、构图、场景和风格参考。
- 参考图风格模板只输出可复用 Prompt，主体占位符仅出现一次，不附负向提示词或平台参数。
- 插画、矢量、海报和 3D 等非摄影媒介使用自己的技法语言，不受摄影规则污染。
- 除非用户明确要求纯图、无文字或无品牌，否则不自动排除正常品牌、Logo、招牌、包装文字和其他场景文字。

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
│   │   └── behavior_cases.json
│   └── patent-disclosure/
│       ├── validate.py
│       └── behavior_cases.json
├── docs/
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

仓库级校验会检查 Skill 名称、目录、frontmatter、可安装内容和重复触发语，并为每个 Skill 自动运行官方 `quick_validate.py`；存在 `tests/<name>/validate.py` 时还会运行该 Skill 的领域回归检查。

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
