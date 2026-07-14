# CLAUDE.md

本文件说明在此仓库维护 Skill 时必须遵守的仓库级约定。

## 仓库定位

本仓库是多个 Agent Skill 的单一版本来源。可安装内容只在 `skills/<skill-name>/`；`docs/<skill-name>/` 存放不随安装分发的人类说明；`tests/`、根 README、CHANGELOG 和仓库脚本不进入安装目录。

安装目录是生成目标，不是维护来源。默认目标是 `~/.codex/skills`，其他宿主通过 `--destination-root` 指定。安装器采用完整镜像语义：目标中的额外或过期文件会从活动目录移除，但旧目录会先完整备份。

## 常用命令

```shell
npm ci

# Node 单元测试 + 仓库/领域静态与契约校验
npm run validate
npm run validate -- --skill patent-disclosure

# 安装前查看差异，再执行完整镜像同步
npm run skill:install -- --name patent-disclosure --dry-run
npm run skill:install -- --name patent-disclosure
npm run skill:install -- --all --destination-root ~/.cc-switch/skills

# 验证现有安装与源码完全一致
npm run validate -- --installed-root ~/.codex/skills

# 专利 Word 导出（仅此功能需要 Python 3 + python-docx）
npm run test:docx
npm run patent:export -- input.md output.docx
```

Node.js 最低版本为 20。默认安装和 `npm run validate` 不依赖 PowerShell 或 Python；Python 只用于专利 DOCX 导出和独立冒烟测试。

## 校验体系

1. **仓库级** `tests/validate-repository.mjs`：自动发现 `skills/` 下含 `SKILL.md` 的目录，检查名称、frontmatter、description、顶层内容、跨 Skill 重复触发语、评测数据结构和人类文档链接。
2. **领域级** `tests/<skill-name>/validate.mjs`：检查每个 Skill 的静态硬约束、直接路由、领域契约和行为证据。
3. **工具回归** `tests/validator.test.mjs` 与 `tests/install-skill.test.mjs`：检查错误输入、dry-run、备份、完整镜像、失败不覆盖和自动发现。
4. **执行评测** `evals.json` 与 `trigger_evals.json`：前者保存真实任务验收点，后者固定为 10 条应触发和 10 条不应触发请求；静态校验只检查结构，行为变化仍需用旧版快照对照复核。
5. **DOCX 冒烟** `tests/patent-disclosure/test_generate_docx.py`：独立于默认验证执行，覆盖 A4、Mermaid 占位、页码字段和退出码。

`behavior_cases.json` 的 `contains_all` 是逐字符证据串。先修改 Skill，再从最终文本复制证据，不要凭记忆重打。

## 单一契约来源

安装器与仓库校验器共同读取 `tests/lib/validation.mjs` 中的 `ALLOWED_TOP_LEVEL`。新增可安装顶层类型时只修改该常量，并同步更新根 README 的人类说明；不要在安装器中再维护副本。

两个 Skill 的领域硬约束：

- **design-image-prompt-engineer**：SKILL.md 正文不超过 90 行；每个 reference 必须由明确任务条件直达；平台资料必须有可解析核验日期和官方来源；禁止旧 `--style raw` 及错误的 DALL·E/FLUX 负向推荐。
- **patent-disclosure**：现有技术检索不得设置任意近年下限；评估不得使用固定重合度或过审率；rules/workflows/references/templates 下所有文件必须由 SKILL.md 的任务路由直达。

## 安装器行为

`scripts/install-skill.mjs` 的顺序固定为：Node 校验 → 计算差异 → staging 复制与 SHA-256 校验 → 旧目录完整备份 → 同卷切换 → 安装后精确镜像校验。切换失败时恢复旧目录。

- `--dry-run` 必须零写入，并列出新增、更新和删除项。
- 源或目标中的符号链接、路径穿越、源码/目标重叠必须拒绝。
- 不允许按 Skill 名称维护 deprecated 文件特判；删除语义由完整镜像自然完成。
- `.artifacts/`、`node_modules/`、`__pycache__/` 和 `*.pyc` 不进入版本控制或 Skill 源目录。

## 修改惯例

- 修改触发或输出行为时，同步维护 `behavior_cases.json`、`evals.json` 和 `trigger_evals.json`，并用旧版快照对照复核。
- 两个 Skill 的人类文档均维护 `README.zh-CN.md` 与 `README.md`；中文和英文必须表达同一能力、边界和命令。
- Skill 界面元数据统一放在 `agents/openai.yaml`，`default_prompt` 必须包含对应 `$skill-name`。
- 版本记录只写根 `CHANGELOG.md`；新增 Skill 由目录自动发现，不维护额外清单。
- 交流与仓库主文档默认使用中文。
