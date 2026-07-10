# Word 导出流程

## 用途

当用户要求生成 `.docx` Word 文档时使用。

## 输入约束

- 输入 Markdown 必须遵循 `templates/disclosure-template.md` 的纯数字章节标题格式（如 `1 `、`2.1 `）；`#`、`##` 等 Markdown 标题不会被识别为章节标题，首行以 `# ` 或 `一种` 开头的行仅识别为发明名称。
- 正文不得包含 Markdown 表格：脚本不渲染表格，表格线会按普通正文输出。
- Mermaid 代码块不会被渲染，导出时会替换为提示用户手动插图的占位文字。

## 本地 CLI 环境

1. 确认已有完整 Markdown 交底书正文。
2. 确认本地 Python 环境已安装 `python-docx`；未安装时提示用户安装。
3. 运行：

```bash
python <path-to-skill>/scripts/generate_docx.py <输入的markdown文件路径> <输出的docx文件路径>
```

4. 输出文档前检查发明名称是否位于文档最顶部，且不超过 25 字。

## 网页版或沙盒环境

1. 如果环境支持 Python 代码执行，优先复用 `scripts/generate_docx.py` 中的逻辑。
2. 如果无法执行 Python 或无法安装依赖，直接输出完整 Markdown 正文，并说明用户可在本地运行脚本转换。
3. 网页版或 Python 沙盒通常无法自动处理 Markdown 本地图片路径，应提示用户在 Word 中手动插入图片。

## 样式规范

| 元素 | 规范 |
|---|---|
| 依赖环境 | Python 3.x 与 `python-docx` |
| 页面 | A4，行距 1.5 倍，自动生成页码 |
| 发明名称 | 居中，14pt，楷体_GB2312，加粗 |
| 正文/章节标题 | 楷体_GB2312，12pt，黑色 |
| 全文西文 | Times New Roman |
| 图片处理 | 本地图片路径需用户在 Word 中手动插入 |

## 完成检查

- 已说明依赖环境。
- 已给出输入 Markdown 与输出 `.docx` 的路径要求。
- 已说明图片处理限制。

