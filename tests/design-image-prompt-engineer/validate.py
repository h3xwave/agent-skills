#!/usr/bin/env python3
"""Static validator for the design-image-prompt-engineer source and install."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ALLOWED_FRONTMATTER = {"name", "description"}
EXPECTED_TOP_LEVEL = {"SKILL.md", "agents", "references"}
EXPECTED_TEMPLATE_FILES = {
    "references/photography-templates.md",
    "references/non-photographic-templates.md",
    "references/negative-prompt-strategies.md",
}
OLD_TEMPLATE_FILE = "references/prompt-templates.md"
REFERENCE_PLACEHOLDER = "[在此处替换为您想要生成的主体内容]"
PLATFORM_FLAGS = re.compile(r"(?<!\w)--(?:ar|raw|v|niji|oref|ow|sref|sw|stylize|no)\b", re.I)
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
FENCE = re.compile(r"```(?:text)?\s*\n(.*?)```", re.I | re.S)


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
    validation.require(bool(keys), "SKILL.md must have YAML frontmatter")
    validation.require(set(keys) == ALLOWED_FRONTMATTER, f"frontmatter keys must be exactly {sorted(ALLOWED_FRONTMATTER)}; got {keys}")
    validation.require(len(keys) == len(set(keys)), "frontmatter keys must not be duplicated")
    validation.require(60 <= len(body.splitlines()) <= 120, f"SKILL.md body should stay near 90 lines (accepted 60-120); got {len(body.splitlines())}")


def validate_layout(skill_dir: Path, validation: Validation) -> None:
    actual = {path.name for path in skill_dir.iterdir()} if skill_dir.is_dir() else set()
    validation.require(actual <= EXPECTED_TOP_LEVEL, f"source skill contains unexpected top-level entries: {sorted(actual - EXPECTED_TOP_LEVEL)}")
    validation.require(EXPECTED_TOP_LEVEL <= actual, f"source skill is missing top-level entries: {sorted(EXPECTED_TOP_LEVEL - actual)}")
    for rel in sorted(EXPECTED_TEMPLATE_FILES):
        validation.require((skill_dir / rel).is_file(), f"missing split template file: {rel}")
    validation.require(not (skill_dir / OLD_TEMPLATE_FILE).exists(), f"legacy combined template must be removed: {OLD_TEMPLATE_FILE}")


def validate_links(skill_dir: Path, validation: Validation) -> None:
    markdown_files = sorted(skill_dir.rglob("*.md"))
    for markdown in markdown_files:
        for target in local_markdown_targets(markdown, read_text(markdown)):
            validation.require(target.exists(), f"broken Markdown path in {markdown.relative_to(skill_dir)}: {target}")

    skill_text = read_text(skill_dir / "SKILL.md")
    references = sorted((skill_dir / "references").glob("*.md"))
    for reference in references:
        rel = reference.relative_to(skill_dir).as_posix()
        validation.require(rel in skill_text, f"reference is not routed directly from SKILL.md: {rel}")


def validate_stale_phrasing(skill_dir: Path, validation: Validation) -> None:
    files = sorted(skill_dir.rglob("*.md"))
    corpus = "\n".join(read_text(path) for path in files)
    validation.require("--style raw" not in corpus, "obsolete Midjourney syntax found: --style raw")
    old_default_patterns = [
        r"默认.{0,16}(?:Midjourney|MJ).{0,16}V7",
        r"(?:Midjourney|MJ).{0,16}(?:默认|当前默认).{0,16}V7",
        r"当前默认版本为\s*\*{0,2}V7\b",
    ]
    for pattern in old_default_patterns:
        validation.require(not re.search(pattern, corpus, re.I), f"obsolete default Midjourney V7 wording found: {pattern}")

    for line in corpus.splitlines():
        if re.search(r"DALL[·.-]?E", line, re.I) and re.search(r"推荐|首选|默认", line):
            allowed_deprecation = any(
                marker in line
                for marker in ("不再推荐", "不推荐", "不作为", "没有推荐", "不再把", "deprecated")
            )
            validation.require(allowed_deprecation, f"DALL·E appears recommended for new work: {line.strip()}")

    bad_flux_markers = (
        "FLUX 使用 negative prompt",
        "FLUX 提供 negative prompt",
        "FLUX 支持 negative prompt",
        "FLUX 负向提示词：",
    )
    for marker in bad_flux_markers:
        validation.require(marker not in corpus, f"FLUX must not receive a negative prompt: {marker}")


def validate_platform_and_negative_strategy(skill_dir: Path, validation: Validation) -> None:
    platform = read_text(skill_dir / "references/platform-notes.md")
    negatives = read_text(skill_dir / "references/negative-prompt-strategies.md")
    required_platform_terms = (
        "2026-07-10",
        "V8.1",
        "--raw",
        "--oref",
        "Niji 7",
        "GPT Image 2",
        "deprecated",
        "Nano Banana 2",
        "Nano Banana Pro",
        "FLUX.2",
        "ControlNet",
        "IP-Adapter",
    )
    for term in required_platform_terms:
        validation.require(term in platform, f"platform snapshot is missing required term: {term}")
    for term in ("Midjourney", "--no", "Stable Diffusion", "独立 negative prompt", "自然语言平台", "正向", "FLUX 不支持负向提示词"):
        validation.require(term in negatives, f"negative strategy is missing platform separation evidence: {term}")


def validate_templates(skill_dir: Path, validation: Validation) -> None:
    photography = read_text(skill_dir / "references/photography-templates.md")
    for term in ("基础模板 + 一条摄影轨道 + 可选成像修饰器", "统一摄影轨道", "商业精修", "干净真实", "生活抓拍", "一个完整成像预设计为一个锚点"):
        validation.require(term in photography, f"photography templates are missing unified routing rule: {term}")

    non_photo = read_text(skill_dir / "references/non-photographic-templates.md")
    fenced_templates = "\n".join(FENCE.findall(non_photo))
    forbidden_in_non_photo_templates = (
        re.compile(r"\b(?:16|24|28|35|50|70|85|100|135)\s*mm\b", re.I),
        re.compile(r"\bf\s*/?\s*\d(?:\.\d+)?\b", re.I),
        re.compile(r"摄影景深|浅景深|胶片颗粒|相机型号"),
    )
    for pattern in forbidden_in_non_photo_templates:
        validation.require(not pattern.search(fenced_templates), f"photography-only language leaked into a non-photographic template: {pattern.pattern}")


def validate_reference_contract(skill_dir: Path, validation: Validation) -> None:
    contract = read_text(skill_dir / "references/reference-image-contract.md")
    validation.require(contract.count(REFERENCE_PLACEHOLDER) == 1, "reference-image contract must contain the exact subject placeholder once")
    validation.require(not PLATFORM_FLAGS.search(contract), "reference-image style contract must not contain platform flags")
    validation.require("不附负向提示词" in contract, "reference-image contract must forbid negative prompts")


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
                validation.require(any(term in text for term in alternatives), f"behavior case {case_id} lacks every alternative in {rel}: {alternatives}")


def validate_installed_dir(skill_dir: Path, installed_dir: Path, validation: Validation) -> None:
    validation.require(installed_dir.is_dir(), f"installed skill directory does not exist: {installed_dir}")
    if not installed_dir.is_dir():
        return
    validation.require(not (installed_dir / OLD_TEMPLATE_FILE).exists(), f"installed skill retains legacy template: {OLD_TEMPLATE_FILE}")
    forbidden_names = {"README.md", "CHANGELOG.md", "behavior_cases.json", "behavior-cases.json", "validate_skill.py"}
    for path in installed_dir.rglob("*"):
        rel = path.relative_to(installed_dir)
        lower_parts = {part.lower() for part in rel.parts}
        is_test_artifact = "tests" in lower_parts or (path.is_file() and (path.name.startswith("test_") or path.name.endswith("_test.py")))
        validation.require(path.name not in forbidden_names and not is_test_artifact, f"installed skill contains repository-only artifact: {rel}")
    for source_file in sorted(path for path in skill_dir.rglob("*") if path.is_file()):
        rel = source_file.relative_to(skill_dir)
        installed_file = installed_dir / rel
        validation.require(installed_file.is_file(), f"installed skill is missing source file: {rel}")
        if installed_file.is_file():
            validation.require(source_file.read_bytes() == installed_file.read_bytes(), f"installed file differs from source: {rel}")


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
        validate_links(skill_dir, validation)
        validate_stale_phrasing(skill_dir, validation)
        validate_platform_and_negative_strategy(skill_dir, validation)
        validate_templates(skill_dir, validation)
        validate_reference_contract(skill_dir, validation)
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
