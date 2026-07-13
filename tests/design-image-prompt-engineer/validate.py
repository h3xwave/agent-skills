#!/usr/bin/env python3
"""Static and contract validator for design-image-prompt-engineer."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import unquote


ALLOWED_FRONTMATTER = {"name", "description"}
EXPECTED_TOP_LEVEL = {"SKILL.md", "agents", "references"}
LEGACY_FILES = {
    "references/photorealism.md",
    "references/platform-notes.md",
    "references/reference-image-contract.md",
    "references/style-dimensions.md",
    "references/visual-trends.md",
}
REQUIRED_FILES = {
    "references/photography-framework.md",
    "references/photography-templates.md",
    "references/non-photographic-templates.md",
    "references/reference-image-workflow.md",
    "references/platforms/midjourney.md",
    "references/platforms/gpt-image.md",
    "references/platforms/nano-banana.md",
    "references/platforms/flux.md",
    "references/platforms/stable-diffusion.md",
}
PLATFORM_FILES = tuple(sorted(path for path in REQUIRED_FILES if path.startswith("references/platforms/")))
REFERENCE_PLACEHOLDER = "[在此处替换为您想要生成的主体内容]"
MARKDOWN_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
FENCE = re.compile(r"```(?:text)?\s*\n(.*?)```", re.I | re.S)
VERIFIED = re.compile(r"^Last verified:\s*(\d{4}-\d{2}-\d{2})\s*$", re.M)


class Validation:
    def __init__(self) -> None:
        self.checks = 0
        self.errors: list[str] = []
        self.warnings: list[str] = []

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
    validation.require("use imagegen instead" in read_text(skill_file), "description must hand direct image generation/editing to imagegen")


def validate_layout_and_routing(skill_dir: Path, validation: Validation) -> None:
    actual = {path.name for path in skill_dir.iterdir()} if skill_dir.is_dir() else set()
    validation.require(actual == EXPECTED_TOP_LEVEL, f"top-level entries must be exactly {sorted(EXPECTED_TOP_LEVEL)}; got {sorted(actual)}")
    for rel in sorted(REQUIRED_FILES):
        validation.require((skill_dir / rel).is_file(), f"missing required resource: {rel}")
    for rel in sorted(LEGACY_FILES):
        validation.require(not (skill_dir / rel).exists(), f"legacy resource must be removed: {rel}")

    skill_text = read_text(skill_dir / "SKILL.md")
    references = sorted((skill_dir / "references").rglob("*.md"))
    for reference in references:
        rel = reference.relative_to(skill_dir).as_posix()
        validation.require(rel in skill_text, f"reference lacks a direct SKILL.md task route: {rel}")

    for markdown in sorted(skill_dir.rglob("*.md")):
        for target in local_markdown_targets(markdown, read_text(markdown)):
            validation.require(target.exists(), f"broken Markdown path in {markdown.relative_to(skill_dir)}: {target}")


def validate_single_authority_and_templates(skill_dir: Path, validation: Validation) -> None:
    photography = read_text(skill_dir / "references/photography-framework.md")
    for term in ("## 摄影三轨", "## 真实感锚点预算", "## 成像修饰器", "## 可解释的主导光源"):
        validation.require(term in photography, f"photography authority is missing: {term}")

    for rel in ("references/photography-templates.md", "references/non-photographic-templates.md"):
        lines = read_text(skill_dir / rel).splitlines()
        validation.require(len(lines) <= 90, f"template exceeds 90 lines: {rel} ({len(lines)})")

    non_photo = read_text(skill_dir / "references/non-photographic-templates.md")
    fenced_templates = "\n".join(FENCE.findall(non_photo))
    for pattern in (r"\b(?:16|24|28|35|50|70|85|100|135)\s*mm\b", r"\bf\s*/?\s*\d(?:\.\d+)?\b", r"摄影景深|相机型号"):
        validation.require(not re.search(pattern, fenced_templates, re.I), f"photography language leaked into non-photo templates: {pattern}")


def validate_reference_workflow(skill_dir: Path, validation: Validation) -> None:
    workflow = read_text(skill_dir / "references/reference-image-workflow.md")
    validation.require(workflow.count(REFERENCE_PLACEHOLDER) == 1, "reference workflow must contain the subject placeholder exactly once")
    for term in ("风格分析", "可替换主体模板", "具体主体完整 Prompt", "不得默认把“分析”改成纯 Prompt", "用户明确指定的新主体、自有角色、品牌、Logo、文案"):
        validation.require(term in workflow, f"reference workflow is missing contract evidence: {term}")


def validate_platform_files(skill_dir: Path, validation: Validation) -> None:
    today = date.today()
    for rel in PLATFORM_FILES:
        text = read_text(skill_dir / rel)
        match = VERIFIED.search(text)
        validation.require(bool(match), f"platform file lacks Last verified YYYY-MM-DD: {rel}")
        validation.require("https://" in text and ("Official" in text or "Canonical" in text), f"platform file lacks official/canonical source links: {rel}")
        if match:
            verified = datetime.strptime(match.group(1), "%Y-%m-%d").date()
            validation.require(verified <= today, f"platform verification date is in the future: {rel} ({verified})")
            if (today - verified).days > 90:
                validation.warnings.append(f"platform snapshot is older than 90 days: {rel} ({verified})")

    midjourney = read_text(skill_dir / "references/platforms/midjourney.md")
    for term in ("`--raw`", "Omni Reference", "`--oref <URL>`"):
        validation.require(term in midjourney, f"Midjourney notes are missing: {term}")
    flux = read_text(skill_dir / "references/platforms/flux.md")
    validation.require("不要输出独立 negative prompt" in flux, "FLUX notes must forbid an independent negative prompt")
    stable = read_text(skill_dir / "references/platforms/stable-diffusion.md")
    for term in ("独立 negative prompt", "ControlNet", "IP-Adapter"):
        validation.require(term in stable, f"Stable Diffusion notes are missing: {term}")


def validate_stale_phrasing(skill_dir: Path, validation: Validation) -> None:
    corpus = "\n".join(read_text(path) for path in sorted(skill_dir.rglob("*.md")))
    validation.require("--style raw" not in corpus, "obsolete Midjourney syntax found: --style raw")
    for line in corpus.splitlines():
        if re.search(r"DALL[·.-]?E", line, re.I) and re.search(r"推荐|首选|默认", line):
            validation.require(any(marker in line for marker in ("不再推荐", "不推荐", "不作为", "deprecated")), f"DALL·E appears recommended: {line.strip()}")
    for marker in ("FLUX 使用 negative prompt", "FLUX 支持 negative prompt", "FLUX 负向提示词："):
        validation.require(marker not in corpus, f"FLUX must not receive a negative prompt: {marker}")


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


def validate_installed_dir(skill_dir: Path, installed_dir: Path, validation: Validation) -> None:
    validation.require(installed_dir.is_dir(), f"installed skill directory does not exist: {installed_dir}")
    if not installed_dir.is_dir():
        return
    forbidden_names = {"README.md", "CHANGELOG.md", "behavior_cases.json", "evals.json", "trigger_evals.json", "validate.py"}
    for path in installed_dir.rglob("*"):
        validation.require(path.name not in forbidden_names, f"installed skill contains repository-only artifact: {path.relative_to(installed_dir)}")
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
        validate_single_authority_and_templates(skill_dir, validation)
        validate_reference_workflow(skill_dir, validation)
        validate_platform_files(skill_dir, validation)
        validate_stale_phrasing(skill_dir, validation)
        validate_contract_cases(skill_dir, args.behavior_cases.resolve(), validation)
    if args.installed_dir:
        validate_installed_dir(skill_dir, args.installed_dir.resolve(), validation)

    for warning in validation.warnings:
        print(f"WARNING: {warning}")
    if validation.errors:
        print(f"FAILED: {len(validation.errors)} of {validation.checks} checks failed", file=sys.stderr)
        for error in validation.errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"PASS: {validation.checks} static and contract checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
