#!/usr/bin/env python3
"""Static validator for the patent-disclosure source and install."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ALLOWED_FRONTMATTER = {"name", "description"}
EXPECTED_TOP_LEVEL = {"SKILL.md", "rules", "workflows", "references", "templates", "scripts"}
ROUTED_DIRS = ("rules", "workflows", "references", "templates")
FORBIDDEN_NAMES = {"README.md", "README.zh-CN.md", "CHANGELOG.md", "behavior_cases.json", "validate.py"}
HARDCODED_YEAR = re.compile(r"(?<![\dA-Za-z_])20\d{2}(?![\dA-Za-z_])")
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
STALE_PHRASES = (
    "从属权利要求必用",
    "检索专利的前景",
    "wipo.int/classifications/ipc",
    "假设 Y=",
)


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
    keys, _body = parse_frontmatter(read_text(skill_file))
    validation.require(bool(keys), "SKILL.md must have YAML frontmatter")
    validation.require(
        set(keys) == ALLOWED_FRONTMATTER,
        f"frontmatter keys must be exactly {sorted(ALLOWED_FRONTMATTER)}; got {keys}",
    )
    validation.require(len(keys) == len(set(keys)), "frontmatter keys must not be duplicated")


def validate_layout(skill_dir: Path, validation: Validation) -> None:
    actual = {path.name for path in skill_dir.iterdir()} if skill_dir.is_dir() else set()
    validation.require(
        actual <= EXPECTED_TOP_LEVEL,
        f"source skill contains unexpected top-level entries: {sorted(actual - EXPECTED_TOP_LEVEL)}",
    )
    validation.require(
        EXPECTED_TOP_LEVEL <= actual,
        f"source skill is missing top-level entries: {sorted(EXPECTED_TOP_LEVEL - actual)}",
    )
    for path in skill_dir.rglob("*"):
        rel = path.relative_to(skill_dir)
        validation.require(
            path.name not in FORBIDDEN_NAMES and path.suffix != ".pyc" and path.name != "__pycache__",
            f"skill contains repository-only or generated artifact: {rel}",
        )


def validate_routing(skill_dir: Path, validation: Validation) -> None:
    skill_text = read_text(skill_dir / "SKILL.md")
    for directory in ROUTED_DIRS:
        for path in sorted((skill_dir / directory).rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(skill_dir).as_posix()
            validation.require(rel in skill_text, f"file is not routed directly from SKILL.md: {rel}")
    validation.require(
        "scripts/generate_docx.py" in skill_text,
        "export script is not routed from SKILL.md: scripts/generate_docx.py",
    )
    for markdown in sorted(skill_dir.rglob("*.md")):
        for target in local_markdown_targets(markdown, read_text(markdown)):
            validation.require(
                target.exists(),
                f"broken Markdown path in {markdown.relative_to(skill_dir)}: {target}",
            )


def validate_stale_phrasing(skill_dir: Path, validation: Validation) -> None:
    files = sorted(list(skill_dir.rglob("*.md")) + list(skill_dir.rglob("*.csv")))
    for path in files:
        rel = path.relative_to(skill_dir)
        text = read_text(path)
        for match in HARDCODED_YEAR.finditer(text):
            validation.require(
                False,
                f"hardcoded four-digit year in {rel}: ...{text[max(0, match.start() - 20):match.end() + 20]!r}...",
            )
        for phrase in STALE_PHRASES:
            validation.require(phrase not in text, f"stale or incorrect wording found in {rel}: {phrase}")


def validate_behavior_cases(skill_dir: Path, cases_path: Path, validation: Validation) -> None:
    validation.require(cases_path.is_file(), f"missing behavior cases: {cases_path}")
    if not cases_path.is_file():
        return
    data = json.loads(read_text(cases_path))
    cases = data.get("cases", [])
    validation.require(len(cases) >= 10, f"expected at least 10 behavior cases; got {len(cases)}")
    seen: set[str] = set()
    for case in cases:
        case_id = case.get("id", "<missing-id>")
        validation.require(case_id not in seen, f"duplicate behavior case id: {case_id}")
        seen.add(case_id)
        validation.require(bool(case.get("request")), f"behavior case lacks request: {case_id}")
        validation.require(bool(case.get("expected")), f"behavior case lacks expected result: {case_id}")
        for evidence in case.get("evidence", []):
            rel = evidence.get("path", "")
            path = skill_dir / rel
            validation.require(path.is_file(), f"behavior case {case_id} references missing file: {rel}")
            if not path.is_file():
                continue
            text = read_text(path)
            for term in evidence.get("contains_all", []):
                validation.require(term in text, f"behavior case {case_id} lacks evidence in {rel}: {term}")
            alternatives = evidence.get("contains_any", [])
            if alternatives:
                validation.require(
                    any(term in text for term in alternatives),
                    f"behavior case {case_id} lacks every alternative in {rel}: {alternatives}",
                )


def validate_installed_dir(skill_dir: Path, installed_dir: Path, validation: Validation) -> None:
    validation.require(installed_dir.is_dir(), f"installed skill directory does not exist: {installed_dir}")
    if not installed_dir.is_dir():
        return
    for path in installed_dir.rglob("*"):
        rel = path.relative_to(installed_dir)
        lower_parts = {part.lower() for part in rel.parts}
        is_test_artifact = "tests" in lower_parts or (
            path.is_file() and (path.name.startswith("test_") or path.name.endswith("_test.py"))
        )
        validation.require(
            path.name not in FORBIDDEN_NAMES and path.suffix != ".pyc" and not is_test_artifact,
            f"installed skill contains repository-only artifact: {rel}",
        )
    for source_file in sorted(path for path in skill_dir.rglob("*") if path.is_file()):
        rel = source_file.relative_to(skill_dir)
        installed_file = installed_dir / rel
        validation.require(installed_file.is_file(), f"installed skill is missing source file: {rel}")
        if installed_file.is_file():
            validation.require(
                source_file.read_bytes() == installed_file.read_bytes(),
                f"installed file differs from source: {rel}",
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill_dir", type=Path, help="source skill directory")
    parser.add_argument("--installed-dir", type=Path, help="optional installed skill directory to inspect")
    parser.add_argument("--behavior-cases", type=Path, default=Path(__file__).with_name("behavior_cases.json"))
    args = parser.parse_args()

    skill_dir = args.skill_dir.resolve()
    validation = Validation()
    validation.require(skill_dir.is_dir(), f"source skill directory does not exist: {skill_dir}")
    if skill_dir.is_dir():
        validate_frontmatter(skill_dir, validation)
        validate_layout(skill_dir, validation)
        validate_routing(skill_dir, validation)
        validate_stale_phrasing(skill_dir, validation)
        validate_behavior_cases(skill_dir, args.behavior_cases.resolve(), validation)
    if args.installed_dir:
        validate_installed_dir(skill_dir, args.installed_dir.resolve(), validation)

    if validation.errors:
        print(f"FAILED: {len(validation.errors)} of {validation.checks} checks failed", file=sys.stderr)
        for error in validation.errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"PASS: {validation.checks} static and behavior-contract checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
