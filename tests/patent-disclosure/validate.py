#!/usr/bin/env python3
"""Static, contract, and DOCX smoke validator for patent-disclosure."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote


ALLOWED_FRONTMATTER = {"name", "description"}
EXPECTED_TOP_LEVEL = {"SKILL.md", "rules", "workflows", "references", "templates", "scripts"}
ROUTED_DIRS = ("rules", "workflows", "references", "templates")
FORBIDDEN_NAMES = {"README.md", "README.zh-CN.md", "CHANGELOG.md", "behavior_cases.json", "evals.json", "trigger_evals.json", "validate.py"}
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
NUMERIC_PERCENT = re.compile(r"(?:重合|过审|授权|通过)[^\n]{0,30}\b\d{1,3}\s*%", re.I)


class Validation:
    def __init__(self) -> None:
        self.checks = 0
        self.errors: list[str] = []

    def require(self, condition: bool, message: str) -> None:
        self.checks += 1
        if not condition:
            self.errors.append(message)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig")


def parse_frontmatter(text: str) -> tuple[list[str], str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return [], text
    try:
        closing = next(i for i, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        return [], text
    keys = []
    for line in lines[1:closing]:
        match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*):", line)
        if match:
            keys.append(match.group(1))
    return keys, "\n".join(lines[closing + 1 :])


def local_markdown_targets(path: Path, text: str) -> list[Path]:
    targets: list[Path] = []
    for raw_target in MARKDOWN_LINK.findall(text):
        target = raw_target.strip().strip("<>")
        if not target or target.startswith(("#", "http://", "https://", "mailto:")):
            continue
        target = unquote(target.split("#", 1)[0])
        if target:
            targets.append((path.parent / target).resolve())
    return targets


def validate_frontmatter(skill_dir: Path, validation: Validation) -> None:
    skill_file = skill_dir / "SKILL.md"
    validation.require(skill_file.is_file(), f"missing required file: {skill_file}")
    if not skill_file.is_file():
        return
    keys, body = parse_frontmatter(read_text(skill_file))
    validation.require(set(keys) == ALLOWED_FRONTMATTER, f"frontmatter keys must be exactly {sorted(ALLOWED_FRONTMATTER)}; got {keys}")
    validation.require(len(keys) == len(set(keys)), "frontmatter keys must not be duplicated")
    validation.require(len(body.splitlines()) <= 90, f"SKILL.md body exceeds 90 lines: {len(body.splitlines())}")
    description = read_text(skill_file).split("---", 2)[1]
    for term in ("不承诺生成可直接提交的", "不用于侵权/FTO 分析"):
        validation.require(term in description, f"description boundary is missing: {term}")


def validate_layout_and_routing(skill_dir: Path, validation: Validation) -> None:
    actual = {path.name for path in skill_dir.iterdir()} if skill_dir.is_dir() else set()
    validation.require(actual == EXPECTED_TOP_LEVEL, f"top-level entries must be exactly {sorted(EXPECTED_TOP_LEVEL)}; got {sorted(actual)}")
    for path in skill_dir.rglob("*"):
        validation.require(path.name not in FORBIDDEN_NAMES and path.suffix != ".pyc" and path.name != "__pycache__", f"skill contains repository-only/generated artifact: {path.relative_to(skill_dir)}")

    skill_text = read_text(skill_dir / "SKILL.md")
    for directory in ROUTED_DIRS:
        for path in sorted((skill_dir / directory).rglob("*")):
            if path.is_file():
                rel = path.relative_to(skill_dir).as_posix()
                validation.require(rel in skill_text, f"file lacks a direct task route in SKILL.md: {rel}")
    validation.require("scripts/generate_docx.py" in skill_text, "export script lacks a direct task route")

    for markdown in sorted(skill_dir.rglob("*.md")):
        for target in local_markdown_targets(markdown, read_text(markdown)):
            validation.require(target.exists(), f"broken Markdown path in {markdown.relative_to(skill_dir)}: {target}")


def validate_modes_and_search(skill_dir: Path, validation: Validation) -> None:
    skill = read_text(skill_dir / "SKILL.md")
    core = read_text(skill_dir / "rules/core-rules.md")
    search = read_text(skill_dir / "rules/search-and-confidentiality.md")
    strategy = read_text(skill_dir / "references/search_strategy.md")
    assessment = read_text(skill_dir / "references/analysis_framework.md")
    interview = read_text(skill_dir / "workflows/interview.md")

    for term in ("### 快速模式", "### 完整模式", "直接执行 `scripts/generate_docx.py`，无需先读取源码"):
        validation.require(term in skill, f"SKILL mode/routing contract is missing: {term}")
    for term in ("快速模式不以公开风险询问、联网检索或预判报告作为强制前置条件", "每轮最多提出 3 个影响最大的缺口问题"):
        validation.require(term in core, f"core mode contract is missing: {term}")
    validation.require("不设置“近几年”的下限" in search, "prior-art search must not have an arbitrary recent lower bound")
    validation.require("不设近年下限" in strategy, "search strategy must cover historical prior art")
    validation.require("不要把趋势检索的近期窗口用于现有技术检索" in strategy, "recent discovery window must not constrain prior-art search")
    for term in ("## 二、风险等级", "## 三、检索覆盖度与结论置信度", "## 四、未知项清单"):
        validation.require(term in assessment, f"qualitative risk framework is missing: {term}")
    validation.require("不机械执行固定四轮" in interview, "interview must be adaptive rather than fixed-round")

    corpus = "\n".join(read_text(path) for path in sorted(list(skill_dir.rglob("*.md")) + list(skill_dir.rglob("*.csv"))))
    validation.require(not NUMERIC_PERCENT.search(corpus), "fixed overlap/grant percentage found in installable content")
    for phrase in ("重合（≥80%）", "40%–80%", "无冲突 | 85%", "每轮必须按顺序", "不得随意增删章节"):
        validation.require(phrase not in corpus, f"obsolete rigid contract found: {phrase}")


def validate_contract_cases(skill_dir: Path, cases_path: Path, validation: Validation) -> None:
    validation.require(cases_path.is_file(), f"missing contract cases: {cases_path}")
    if not cases_path.is_file():
        return
    data = json.loads(read_text(cases_path))
    cases = data.get("cases", [])
    validation.require(len(cases) >= 10, f"expected at least 10 contract cases; got {len(cases)}")
    seen: set[str] = set()
    for case in cases:
        case_id = case.get("id", "<missing-id>")
        validation.require(case_id not in seen, f"duplicate contract case id: {case_id}")
        seen.add(case_id)
        validation.require(bool(case.get("request")) and bool(case.get("expected")), f"contract case lacks request/expected: {case_id}")
        for evidence in case.get("evidence", []):
            rel = evidence.get("path", "")
            path = skill_dir / rel
            validation.require(path.is_file(), f"contract case {case_id} references missing file: {rel}")
            if path.is_file():
                text = read_text(path)
                for term in evidence.get("contains_all", []):
                    validation.require(term in text, f"contract case {case_id} lacks evidence in {rel}: {term}")


def validate_docx_smoke(validation: Validation) -> None:
    smoke = Path(__file__).with_name("test_generate_docx.py")
    validation.require(smoke.is_file(), f"missing DOCX smoke test: {smoke}")
    if not smoke.is_file():
        return
    result = subprocess.run([sys.executable, str(smoke)], check=False, capture_output=True, text=True, encoding="utf-8", errors="replace")
    validation.require(result.returncode == 0, f"DOCX smoke failed ({result.returncode}): {(result.stdout + result.stderr).strip()}")


def validate_installed_dir(skill_dir: Path, installed_dir: Path, validation: Validation) -> None:
    validation.require(installed_dir.is_dir(), f"installed skill directory does not exist: {installed_dir}")
    if not installed_dir.is_dir():
        return
    for path in installed_dir.rglob("*"):
        validation.require(path.name not in FORBIDDEN_NAMES and path.suffix != ".pyc" and path.name != "__pycache__", f"installed skill contains repository-only/generated artifact: {path.relative_to(installed_dir)}")
    for source_file in sorted(path for path in skill_dir.rglob("*") if path.is_file()):
        rel = source_file.relative_to(skill_dir)
        installed_file = installed_dir / rel
        validation.require(installed_file.is_file(), f"installed skill is missing source file: {rel}")
        if installed_file.is_file():
            validation.require(source_file.read_bytes() == installed_file.read_bytes(), f"installed file differs from source: {rel}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill_dir", type=Path)
    parser.add_argument("--installed-dir", type=Path)
    parser.add_argument("--behavior-cases", type=Path, default=Path(__file__).with_name("behavior_cases.json"))
    args = parser.parse_args()

    skill_dir = args.skill_dir.resolve()
    validation = Validation()
    validation.require(skill_dir.is_dir(), f"source skill directory does not exist: {skill_dir}")
    if skill_dir.is_dir():
        validate_frontmatter(skill_dir, validation)
        validate_layout_and_routing(skill_dir, validation)
        validate_modes_and_search(skill_dir, validation)
        validate_contract_cases(skill_dir, args.behavior_cases.resolve(), validation)
        validate_docx_smoke(validation)
    if args.installed_dir:
        validate_installed_dir(skill_dir, args.installed_dir.resolve(), validation)

    if validation.errors:
        print(f"FAILED: {len(validation.errors)} of {validation.checks} checks failed", file=sys.stderr)
        for error in validation.errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"PASS: {validation.checks} static, contract, and DOCX smoke checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
