#!/usr/bin/env python3
"""Validate every installable Skill and its optional domain-specific checks."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


ALLOWED_FRONTMATTER = {"name", "description"}
ALLOWED_TOP_LEVEL = {
    "SKILL.md",
    "agents",
    "references",
    "scripts",
    "assets",
    "rules",
    "workflows",
    "templates",
    "docs",
}
SKILL_NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
FRONTMATTER_KEY = re.compile(r"^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$")
QUOTED_PHRASE = re.compile(r'["“]([^"”]{2,})["”]')


def read_frontmatter(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8-sig")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, ""
    try:
        closing = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration:
        return {}, ""

    fields: dict[str, str] = {}
    block = "\n".join(lines[1:closing])
    for line in lines[1:closing]:
        match = FRONTMATTER_KEY.match(line)
        if match:
            fields[match.group(1)] = (match.group(2) or "").strip().strip("'\"")
    return fields, block


def run_check(command: list[str], label: str, errors: list[str]) -> None:
    print(f"\n== {label} ==", flush=True)
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        errors.append(f"{label} failed with exit code {result.returncode}")


def validate_eval_fixtures(tests_dir: Path, skill_name: str, errors: list[str]) -> None:
    """Validate repository-only execution and trigger eval fixture schemas."""
    evals_path = tests_dir / "evals.json"
    if evals_path.is_file():
        try:
            payload = json.loads(evals_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{skill_name}: invalid evals.json: {exc}")
        else:
            if payload.get("skill_name") != skill_name:
                errors.append(f"{skill_name}: evals.json skill_name must match the Skill")
            evals = payload.get("evals")
            if not isinstance(evals, list) or len(evals) < 8:
                errors.append(f"{skill_name}: evals.json must contain at least 8 execution evals")
            else:
                ids: set[int] = set()
                for item in evals:
                    eval_id = item.get("id") if isinstance(item, dict) else None
                    if not isinstance(eval_id, int) or eval_id in ids:
                        errors.append(f"{skill_name}: eval ids must be unique integers; got {eval_id!r}")
                        continue
                    ids.add(eval_id)
                    for field in ("prompt", "expected_output"):
                        if not isinstance(item.get(field), str) or not item[field].strip():
                            errors.append(f"{skill_name}: eval {eval_id} lacks non-empty {field}")
                    expectations = item.get("expectations")
                    if not isinstance(expectations, list) or not expectations or not all(
                        isinstance(value, str) and value.strip() for value in expectations
                    ):
                        errors.append(f"{skill_name}: eval {eval_id} needs non-empty expectations")

    trigger_path = tests_dir / "trigger_evals.json"
    if trigger_path.is_file():
        try:
            trigger_evals = json.loads(trigger_path.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{skill_name}: invalid trigger_evals.json: {exc}")
        else:
            if not isinstance(trigger_evals, list) or len(trigger_evals) != 20:
                errors.append(f"{skill_name}: trigger_evals.json must contain exactly 20 queries")
            else:
                queries: set[str] = set()
                labels = {True: 0, False: 0}
                for item in trigger_evals:
                    query = item.get("query") if isinstance(item, dict) else None
                    expected = item.get("should_trigger") if isinstance(item, dict) else None
                    if not isinstance(query, str) or not query.strip() or query in queries:
                        errors.append(f"{skill_name}: trigger queries must be unique, non-empty strings")
                        continue
                    queries.add(query)
                    if not isinstance(expected, bool):
                        errors.append(f"{skill_name}: trigger query lacks a boolean should_trigger: {query!r}")
                    else:
                        labels[expected] += 1
                if labels[True] != 10 or labels[False] != 10:
                    errors.append(
                        f"{skill_name}: trigger evals need 10 positive and 10 negative cases; got {labels}"
                    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skill", help="validate one Skill after checking repository-wide uniqueness")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    skills_root = repo_root / "skills"
    tests_root = repo_root / "tests"
    quick_validate = Path.home() / ".codex" / "skills" / ".system" / "skill-creator" / "scripts" / "quick_validate.py"
    errors: list[str] = []

    if not skills_root.is_dir():
        print(f"FAILED: missing skills directory: {skills_root}", file=sys.stderr)
        return 1
    if not quick_validate.is_file():
        print(f"FAILED: official quick validator not found: {quick_validate}", file=sys.stderr)
        return 1

    candidate_dirs = sorted(
        path for path in skills_root.iterdir() if path.is_dir() and not path.name.startswith(".")
    )
    if not candidate_dirs:
        errors.append("skills directory contains no Skill folders")

    skill_dirs: dict[str, Path] = {}
    phrase_owners: dict[str, str] = {}
    for skill_dir in candidate_dirs:
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.is_file():
            errors.append(f"Skill folder is missing SKILL.md: {skill_dir.name}")
            continue

        fields, frontmatter = read_frontmatter(skill_file)
        keys = set(fields)
        if keys != ALLOWED_FRONTMATTER:
            errors.append(
                f"{skill_dir.name}: frontmatter keys must be exactly {sorted(ALLOWED_FRONTMATTER)}; got {sorted(keys)}"
            )

        declared_name = fields.get("name", "")
        if declared_name != skill_dir.name:
            errors.append(
                f"{skill_dir.name}: frontmatter name must match folder name; got {declared_name!r}"
            )
        if not SKILL_NAME.fullmatch(skill_dir.name):
            errors.append(f"invalid Skill folder name: {skill_dir.name}")
        if declared_name in skill_dirs:
            errors.append(f"duplicate Skill name: {declared_name}")
        else:
            skill_dirs[declared_name] = skill_dir

        unexpected = sorted(path.name for path in skill_dir.iterdir() if path.name not in ALLOWED_TOP_LEVEL)
        if unexpected:
            errors.append(f"{skill_dir.name}: unexpected installable top-level entries: {unexpected}")

        for phrase in QUOTED_PHRASE.findall(frontmatter):
            normalized = " ".join(phrase.casefold().split())
            owner = phrase_owners.get(normalized)
            if owner and owner != skill_dir.name:
                errors.append(
                    f"duplicate quoted trigger phrase across Skills: {phrase!r} ({owner}, {skill_dir.name})"
                )
            else:
                phrase_owners[normalized] = skill_dir.name

    if args.skill:
        selected = skill_dirs.get(args.skill)
        if selected is None:
            errors.append(f"requested Skill not found: {args.skill}")
            selected_dirs: list[Path] = []
        else:
            selected_dirs = [selected]
    else:
        selected_dirs = [path for name, path in sorted(skill_dirs.items()) if name]

    if errors:
        print(f"FAILED: {len(errors)} repository structure check(s) failed", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    for skill_dir in selected_dirs:
        validate_eval_fixtures(tests_root / skill_dir.name, skill_dir.name, errors)
        run_check(
            [sys.executable, str(quick_validate), str(skill_dir)],
            f"official validation: {skill_dir.name}",
            errors,
        )
        domain_validator = tests_root / skill_dir.name / "validate.py"
        if domain_validator.is_file():
            run_check(
                [sys.executable, str(domain_validator), str(skill_dir)],
                f"domain static/contract validation: {skill_dir.name}",
                errors,
            )
        else:
            print(f"\nINFO: no domain validator for {skill_dir.name}; official validation only")

    if errors:
        print(f"\nFAILED: {len(errors)} validation command(s) failed", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"\nPASS: repository structure and {len(selected_dirs)} Skill validation set(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
