#!/usr/bin/env python3
"""Smoke-test the patent disclosure Markdown-to-DOCX CLI contract."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

from docx import Document
from docx.shared import Mm


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def run_cli(script: Path, *args: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(script), *(str(arg) for arg in args)],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def main() -> int:
    repo_root = Path(__file__).resolve().parents[2]
    script = repo_root / "skills" / "patent-disclosure" / "scripts" / "generate_docx.py"
    require(script.is_file(), f"missing export script: {script}")

    sample = """一种自适应连接状态检测装置

日期：{系统当前日期}

1  本发明要解决的技术问题是什么？

现有连接状态检测存在响应延迟。

2  背景技术

2.1 作为本发明基础的公知技术内容

公知方案通过周期采样识别连接状态。

3  现有技术缺点推导及本发明目的说明

由于固定周期无法适应状态变化，导致检测延迟，从而影响控制稳定性。

4  技术方案深度构建

4.1 整体方案概述

装置根据状态变化自适应调整采样周期。

4.3 附图说明

```mermaid
flowchart TD
    A[采样] --> B[判断]
```

5  本发明的关键点和欲保护点是什么？

1. 根据状态变化调整采样周期。
"""

    with tempfile.TemporaryDirectory(prefix="patent-docx-smoke-") as temp_dir:
        temp = Path(temp_dir)
        source = temp / "input.md"
        output = temp / "output.docx"
        source.write_text(sample, encoding="utf-8")

        success = run_cli(script, source, output)
        require(success.returncode == 0, f"success path returned {success.returncode}: {success.stderr}")
        require(output.is_file() and output.stat().st_size > 0, "success path did not create a DOCX")

        doc = Document(output)
        section = doc.sections[0]
        width_mm = section.page_width / Mm(1)
        height_mm = section.page_height / Mm(1)
        require(abs(width_mm - 210) < 0.5, f"page width is not A4: {width_mm:.2f} mm")
        require(abs(height_mm - 297) < 0.5, f"page height is not A4: {height_mm:.2f} mm")

        body = "\n".join(paragraph.text for paragraph in doc.paragraphs)
        require("一种自适应连接状态检测装置" in body, "document title is missing")
        require("手动插入" in body, "Mermaid placeholder is missing")
        require("flowchart TD" not in body and "A[采样]" not in body, "Mermaid source leaked into DOCX")
        footer_xml = section.footer._element.xml
        require("PAGE" in footer_xml and "NUMPAGES" in footer_xml, "page number fields are missing")

        missing = run_cli(script, temp / "missing.md", temp / "missing.docx")
        require(missing.returncode == 2, f"missing input must return 2; got {missing.returncode}")

        no_args = run_cli(script)
        require(no_args.returncode == 2, f"missing arguments must return 2; got {no_args.returncode}")

        empty = temp / "empty.md"
        empty.write_text("", encoding="utf-8")
        empty_result = run_cli(script, empty, temp / "empty.docx")
        require(empty_result.returncode == 2, f"empty input must return 2; got {empty_result.returncode}")

        write_failure = run_cli(script, source, temp)
        require(write_failure.returncode == 1, f"write failure must return 1; got {write_failure.returncode}")

    print("PASS: DOCX A4 layout, Mermaid placeholder, footer fields, and CLI exit codes")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
