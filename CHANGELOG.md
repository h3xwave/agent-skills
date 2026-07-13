# Changelog

本仓库及其 Skills 的重要变更记录于此。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)，Skill 版本遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### design-image-prompt-engineer 2.4.0

- 收紧 Prompt 与直接出图的边界：直接生成/编辑图片转交图像工作流，人物参考分支只负责 Prompt、诊断和参考图用法。
- 将摄影三轨、真实感锚点和主导光源合并为单一权威摄影框架；其余词库改为按任务读取，不再复制全套规则。
- 参考图工作流拆分风格分析、可复用模板和具体新主体三种交付模式；保留用户明确指定的新品牌、自有角色与产品。
- 平台资料按平台变体独立路由，负向策略只在相关任务读取；压缩摄影/非摄影模板并移除易过期的视觉趋势运行时文件。
- description、静态校验和触发评测同步更新，不再用 SKILL.md 最小行数维持表面完整性。

### patent-disclosure 1.1.0

- 新增完整模式与快速模式：已有材料整理、润色和 Word 导出不再强制联网、预判报告或多轮确认。
- 专利现有技术检索取消任意近年下限，以相关优先权日或拟申请日为日期上限；近期窗口仅用于趋势和方向挖掘。
- 删除固定技术重合百分比与过审率，改为逐保护点的高/中/低风险、证据覆盖度、置信度、未知项和后续建议。
- 访谈改为覆盖驱动的自适应追问；用户提供的交底模板优先，Mermaid 不再作为强制输出。
- Word 导出补 A4 页面、输入校验和稳定退出码，同时保留 Mermaid/本地图片需后处理的明确限制。

### 评测与验证

- 将原 `behavior_cases.json` 明确为静态契约夹具；图像 Skill 新增 9 个、专利 Skill 新增 8 个执行评测，每个 Skill 新增 20 个触发边界评测。
- 仓库校验新增评测数据结构检查；执行评测以旧版快照为基线，记录质量对照并生成静态人工评审页面；耗时与 token 仅在评测运行器提供时记录。

### 仓库结构

- 将单一 `skill/` 源目录迁移为可自动发现多个 Skill 的 `skills/<skill-name>/` 结构。
- 将图片提示词 Skill 的领域校验和行为案例移动到 `tests/design-image-prompt-engineer/`。
- 新增仓库级校验器，统一检查名称、frontmatter、目录内容和跨 Skill 重复触发语，并调用官方与领域校验。
- 将安装脚本参数化为 `-Name`、`-SourceRoot` 和 `-DestinationRoot`，支持按名称验证、备份和同步任意 Skill。
- 可安装内容顶层白名单新增 `templates/`（仓库校验器与安装脚本同步）；新增仓库根 `docs/` 存放各 Skill 的人类文档。
- 仓库 README 精简为仓库级介绍（清单、目录、验证、安装、新增流程）；design-image-prompt-engineer 核心行为说明移至 `docs/design-image-prompt-engineer/README.zh-CN.md`。

### patent-disclosure 1.0.0（新增）

专利交底书编写 Skill：方向挖掘、检索驱动的结构化访谈、授权前景预判、五章模板交底书起草与修改、Word 导出。含公开风险与预判报告双确认门槛、动态年份检索窗口、保密检索边界和 `generate_docx.py` 导出脚本。

### patent-disclosure 修复

- 结构合规：`README.md`、`README.zh-CN.md` 移出可安装目录至 `docs/patent-disclosure/`；删除 `scripts/__pycache__/`；`templates/` 通过白名单纳入可安装内容。此前该 Skill 无法通过仓库校验且安装脚本直接拒绝。
- `terminology.md`：修正"其特征在于（从属权利要求必用）"与独立权利要求三段式模板的自相矛盾；"一案两报"补充仅限产品类方案、须同日申请并声明。
- `core-rules.md` 公开风险门槛补适用范围：约束访谈/已有材料路径/起草之前，方向挖掘阶段允许先用抽象词检索——与 `discovery.md` 的实际步骤顺序对齐。
- `search_strategy.md` 与 `search-and-confidentiality.md`：示例中的硬编码年份改为 `{Y-1} {Y}` 占位符写法；IPC 分类表链接统一为 `wipo.int/en/web/classification-ipc`。
- `interview.md` 收束话术病句"检索专利的前景"改为"检索现有技术并评估授权前景"。
- `SKILL.md` description 触发语"帮我整理技术方案"收窄为"帮我把技术方案整理成交底书"，避免非专利语境误触发（两份 README 同步）。
- `export-docx.md` 新增输入约束：纯数字章节标题格式、正文不得含 Markdown 表格、Mermaid 不渲染只留占位。
- 新增 `tests/patent-disclosure/`：领域校验器（布局/路由/硬编码年份/回归禁语/行为契约）与 13 条行为验收用例。

## [2.3.2] - 2026-07-10

### 修复

- 移除默认“无可读文字、无 Logo、无品牌”的通用约束；正常品牌、Logo、招牌、包装文字和其他场景文字现在可按现实语境自然出现。
- 仅在用户明确要求纯图、无文字或无品牌时排除对应元素；准确文案或特定品牌按用户提供的内容与位置描述。
- 同步更新负向策略、非摄影框架与模板、摄影模板和 Prompt 优化检查，并新增行为回归案例。

## [2.3.1] - 2026-07-10

### 修复

- 将人物参考故障诊断纳入触发范围，并让人物身份保留路由优先于参考图风格迁移。
- 将普通生活照与生活方式人像默认路由到干净真实；只有明确抓拍、随手拍、纪实、未摆拍或动作瞬间才进入生活抓拍。
- 新增头像扩展为全身的静态 Prompt 骨架，区分面部身份、体型/比例、姿势、构图、场景与风格参考职责。
- 明确头像未展示的身体属于生成假设，不代表本人真实体型；比例稳定不能由 Prompt 单独保证。

## [2.3.0] - 2026-07-10

新增人物参考一致性模块：用人物照片生成新画面时，系统性防止头身比例失调与表情怪异。

### 新增

- `references/person-reference.md`：照片职责声明、附属特征与发型改动的单一指令源、多人参考逐人绑定、取景匹配与按年龄段的头身比例锚点、体态与裁切规则、表情主权唯一、身份与风格优先级（含具名画风权利边界）、Prompt 骨架、两步法（先锁比例再注入身份）、照片质量门槛与失败模式速查表。
- 行为验收案例 ×4：头像出半身的比例锚点、大笑的表情双重指令、远景两步法、动漫风格化的优先级说明。

### 变更

- `SKILL.md`：Workflow 增人物参考路由步骤，Reference Routes 与 Self-Check 各加人物参考条目；触发词补“用照片里的人生成、人物一致性、换场景保持同一人物、人物比例失调、表情怪异”。
- `prompt-optimization.md`：诊断清单加“人物参考冲突”项；常见劣质模式加“头像出全身”与“表情双重指令”。
- `reference-image-contract.md`、`style-dimensions.md`：加与人物参考任务的分流说明——要求保留人物身份时不走风格模板的身份剥离规则。
- `photography-templates.md`：人像模板补人物参考照片的前置规则指引。
- `agents/openai.yaml`：default prompt 补人物一致性能力。

## [2.2.1] - 2026-07-10

修复写实摄影路由、平台资料、模板冲突、Skill 合规和安装漂移，并建立可版本控制的单一主来源。

### 新增

- 摄影三轨路由：商业精修、干净真实、生活抓拍；“像实拍 / 不要 AI 味”默认进入干净真实。
- 手机、胶片、一次性相机、早期 CCD、扫描底片统一为成像修饰器，并纳入整条 Prompt 的真实感锚点总预算。
- 独立的参考图输出契约与三份模板/负向策略 reference。
- `tests/validate_skill.py` 静态回归检查与行为验收案例。
- `scripts/install-skill.ps1`：校验、dry-run、完整备份、受控同步与哈希核对。

### 变更

- `SKILL.md` frontmatter 只保留 `name`、`description`，补充自然写实触发语，并明确直接生成/编辑图片不属于本 Skill。
- 所有 reference 从 `SKILL.md` 一层直达；仓库 README、CHANGELOG、测试和安装脚本移出可安装目录。
- 主导光源改为“一个可解释的主导光源，可有真实环境光或弱辅助光”；企业头像和证件式肖像允许直视镜头。
- 产品、建筑、房产、汽车和风光获得干净真实路径；建筑/房产允许合理包围曝光与克制合成。
- 平台说明改为“稳定能力 + 2026-07-10 快照”，按官方资料更新 Midjourney、GPT Image、Gemini/Nano Banana、FLUX 与 Stable Diffusion 路径。
- Midjourney `--no`、Stable Diffusion negative prompt 和自然语言正向约束分开维护；FLUX 不再输出 negative prompt。

### 修复

- 模板自带锚点未计入总预算，导致真实感要素叠加过量。
- “真实”被错误等同为 subject unaware、mid-motion、噪点、过曝或杂物。
- “HDR 痕迹 / 数字锐化”被一概排除，误伤手机计算摄影和 JPEG 直出；现仅避免过度 HDR 与过度数字锐化。
- 旧 `--style raw`、默认 Midjourney V7、推荐 DALL·E 与 FLUX negative prompt 等过期或冲突表述。

## [2.2.0] - 2026-07-10

反 AI 味升级：摄影输出引入「商业精修 / 真实抓拍」双轨制，系统性解决出图过度精修、缺乏真实照片质感的问题。

### 新增
- `references/photorealism.md`：真实抓拍专用模块，含真实感锚点词库（设备语境 / 现场缺陷 / 环境杂讯 / 抓拍语言）、瑕疵预算（每条 1–2 个不完美项）、单一光线逻辑、AI 味诊断清单（典型特征 → 解药词）。
- `style-library.md` Real / Film 组扩充 5 条：Phone snapshot、Early digital CCD、Flash overexposed night、Scanned negative、Disposable camera。
- `platform-notes.md` 新增「写实任务平台策略」小节，并在平台速选加真实抓拍条目。
- `prompt-templates.md` 新增「摄影·真实抓拍类负向」档，9 个摄影模板附「真实抓拍取向」变体提示行。

### 变更
- `photography-framework.md` 质量描述拆为商业精修组 / 真实抓拍组；Lighting 补单一光线逻辑提示。
- `SKILL.md`：Workflow 第 3 步补取向判断，Reference Routing 与 Self-Check 各加真实抓拍相关条目。

### 修复
- 「摄影·人物 / 人像类负向」删除 `高噪点 / 过曝 / 死黑 / 构图混乱`——这些负向会扼杀真实照片感、把输出推向 AI 精修味（负向自杀）。
- 「摄影·产品 / 场景类负向」标注仅适用商业精修取向，避免误套到写实需求。

## [2.1.0] - 2026-06-03

多媒介扩展的深度补强与发布收尾：摄影与非摄影补成对称的"脊柱 + 具名深挖库 + 模板"两层结构，三种模式全部接入深挖库。

### 新增
- 非摄影具名深挖库 ×2：`references/non-photo-style-library.md`（29 条美学流派）、`references/illustration-technique-library.md`（30 条上色/线条/印刷/数字/3D 技法）。
- 摄影调色深挖库：`references/color-grade-library.md`（胶片仿真 / 数字调色 / 黑白 / 工艺痕迹）。
- prompt 优化诊断库：`references/prompt-optimization.md`（诊断清单 + 改进流程 + 常见劣质模式 + 优化示例）。
- 模板共 30：非摄影 +6（编辑插画 / 等距信息图 / 漫画分格 / 图标 UI 系统 / 绘本 / 概念美术），摄影 +5（婚礼活动 / 街拍 / 静物 / 宠物 / 房产）。
- `references/lighting-techniques.md` 补「Automotive / 大面积曲面布光」与「Architectural / Interior 布光」两组。
- 平台支持：Ideogram、Recraft、Stable Diffusion ControlNet / IP-Adapter、FLUX Kontext，并加「媒介 → 平台速选」矩阵。
- `README.md` 使用说明；本 `CHANGELOG.md`。

### 变更
- 文字策略改为三档口径：默认剥离可读文字 / 文字 brief 模式下用户自有原创文案可渲染清晰（推荐 Ideogram、Recraft）/ 参考图风格模式一律全剥离。
- 负向提示词从 2 块拆为 6 块媒介感知（摄影：人像 / 产品场景 / 胶片纪实；非摄影：干净矢量 / 做旧 glitch 印刷 / 3D），并加原则"别把想要的质感写进负向"。
- 三种模式全部接入具名深挖库：从零构建（Workflow 3）、参考图反推迁移（Workflow 4 / `style-dimensions.md`）、优化已有 prompt（Workflow 5 / `prompt-optimization.md`）。
- `references/non-photographic-framework.md` 每媒介补「签名技法 + 避免」守则。
- Self-Check 增非摄影防回归项（未误用镜头 / 景深 / 胶片颗粒）；触发词补二次元 / 信息图 / 漫画 / 概念美术 / 拼贴。
- 趋势文件去年号化：`visual-trends-2026.md` → `visual-trends.md`。
- 作者标注统一为 HXW。

### 修复
- `visual-trends` 此前 100% 摄影偏置，非摄影需求无趋势可用。
- 摄影负向中 `高噪点 / 过曝` 会扼杀技能自身鼓励的胶片 / 做旧颗粒美学的冲突。
- 非摄影负向中 `3D 渲染 / 脏乱线条 / 色彩溢出` 会误伤 3D / glitch / riso 目标质感的冲突。

## [2.0.0]

从纯摄影提示词工程扩展为多媒介：新增 `references/non-photographic-framework.md`，覆盖插画 / 平面 / 矢量 / 拼贴 / glitch / 3D / 混合媒介 / 动漫，并补多媒介模板与平台说明。

## [1.0.0]

摄影向图像提示词工程：人像 / 产品 / 风光 / 时尚等模板，配摄影框架、布光、构图镜头与风格库。
