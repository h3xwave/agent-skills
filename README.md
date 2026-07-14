# Skills Repository

本仓库是两个 Agent Skill 的单一版本来源，统一维护可安装内容、触发边界、领域校验和本地安装工具。可安装文件只位于 `skills/<skill-name>/`；人类文档、测试和仓库脚本不会进入 Skill 安装目录。

## Skill 清单

| Skill | 适合任务 | 不适合任务 | 文档 |
| --- | --- | --- | --- |
| `design-image-prompt-engineer` | 编写或诊断图像 Prompt、分析参考图用法、提取风格、处理人物一致性 | 直接生成/编辑图片、普通图片点评、文本润色 | [中文](docs/design-image-prompt-engineer/README.zh-CN.md) · [English](docs/design-image-prompt-engineer/README.md) |
| `patent-disclosure` | 整理发明材料、初步现有技术评估、交底书起草/补强、Word 导出 | 正式法律意见、FTO/侵权分析、直接提交申请、最终权利要求 | [中文](docs/patent-disclosure/README.zh-CN.md) · [English](docs/patent-disclosure/README.md) |

## Quick Start

安装 Node.js 20+ 和 npm，然后在仓库根目录执行：

```shell
npm ci
npm run validate
npm run skill:install -- --name design-image-prompt-engineer --dry-run
npm run skill:install -- --name design-image-prompt-engineer
```

默认目标根目录是 `~/.codex/skills`。安装全部 Skill：

```shell
npm run skill:install -- --all --dry-run
npm run skill:install -- --all
```

通过其他宿主加载时显式指定目标根目录；安装器会展开路径开头的 `~`：

```shell
npm run skill:install -- --all --destination-root ~/.cc-switch/skills --dry-run
npm run skill:install -- --all --destination-root ~/.cc-switch/skills
```

安装后可直接描述任务，也可显式点名：

```text
使用 $design-image-prompt-engineer，分析这张参考图并为我的产品编写完整 Prompt。
使用 $patent-disclosure，把这份研发说明整理成供专利代理人复核的交底材料。
```

## 安装行为

安装器按名称自动发现 `skills/` 下的 Skill，不维护额外安装清单。每次正式安装都会：

1. 运行仓库与目标 Skill 的 Node 校验。
2. 在目标根目录旁创建 staging，复制源码并核对 SHA-256。
3. 将旧安装完整备份到 `.artifacts/backups/<timestamp>/<skill-name>/`。
4. 用已验证的 staging 替换目标目录；切换失败时恢复旧目录。
5. 再次核对目标文件集合和哈希。

目标目录是源码的完整镜像。源码中已经删除的文件、目标中的额外文件和生成物会从活动安装目录移除，但仍保留在安装前备份中。不要把安装目录当作人工维护来源；正式修改应回到本仓库。

为避免链接指向仓库外位置而被误删，安装器拒绝直接替换符号链接形式的 Skill 目录。如果某个宿主通过符号链接共享另一套 Skill，请用 `--destination-root` 指向链接的真实目标目录；安装后仍可用 `--installed-root` 从两个宿主视图分别验证。

支持的参数：

```text
--name <skill-name> | --all
--dry-run
--source-root <path>
--destination-root <path>
--backup-root <path>
```

## 验证与 Word 导出

默认校验完全由 Node 执行，不依赖 PowerShell 或 Python：

```shell
npm run validate
npm run validate -- --skill patent-disclosure
npm run validate -- --installed-root ~/.codex/skills
```

校验覆盖 Skill 名称和 frontmatter、目录白名单、description 触发短语、任务路由、Markdown 链接、领域契约、平台资料日期、行为夹具和触发评测结构。`behavior_cases.json` 锁定文档契约，`evals.json` 与 `trigger_evals.json` 用于真实输出和触发边界复核；静态通过不等同于模型行为已经通过。

专利 Word 导出仍使用 Python 3 和 `python-docx`。在所用 Python 环境安装依赖后执行：

```shell
python -m pip install python-docx
npm run test:docx
npm run patent:export -- input.md output.docx
```

`npm run test:docx` 是独立冒烟，不属于默认 `npm run validate`，因此安装图像 Skill 不需要 Python。

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
│       ├── agents/openai.yaml
│       ├── rules/
│       ├── workflows/
│       ├── references/
│       ├── templates/
│       └── scripts/
├── tests/
│   ├── validate-repository.mjs
│   ├── validator.test.mjs
│   ├── install-skill.test.mjs
│   └── <skill-name>/
├── docs/<skill-name>/
│   ├── README.zh-CN.md
│   └── README.md
├── scripts/
│   ├── install-skill.mjs
│   ├── validate.mjs
│   └── run-python.mjs
├── package.json
├── package-lock.json
├── README.md
└── CHANGELOG.md
```

每个 `skills/<name>/` 只能包含可安装内容。允许的顶层项目是 `SKILL.md`、`agents/`、`references/`、`scripts/`、`assets/`、`rules/`、`workflows/`、`templates/` 和 `docs/`；安装器与校验器从同一份代码常量读取该契约。

## 新增或修改 Skill

1. 在 `skills/<skill-name>/` 创建或修改 Skill；目录名必须与 frontmatter `name` 一致。
2. frontmatter 只保留 `name` 和 `description`；description 使用真实用户语言中的触发短语，并与其他 Skill 保持边界清晰。
3. 在 `tests/<skill-name>/` 维护 `validate.mjs`、行为契约、执行评测和 10 条正例/10 条负例触发评测。
4. 在 `docs/<skill-name>/` 同步维护中英文人类说明。
5. 运行 `npm run validate`，再用 `--dry-run` 检查安装差异。

README 中的清单只用于人工浏览；Skill 与安装目标均由目录自动发现。
