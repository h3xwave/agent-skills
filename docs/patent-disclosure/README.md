# Patent Disclosure Skill

`patent-disclosure` turns invention ideas, R&D material, or an existing disclosure into technical material for review by an internal IP team or patent professional. It targets Chinese patent-disclosure practice and produces Chinese Markdown by default.

Chinese documentation is available in [README.zh-CN.md](README.zh-CN.md). This Skill does not replace a patent attorney or legal opinion, promise grant outcomes, or produce filing-ready application documents without professional review.

## Capabilities

- Mine candidate protection points from a broad technical direction.
- Fill information gaps with a small, adaptive inventor interview.
- Research patents, papers, standards, products, and public implementations.
- Report qualitative risk, evidence coverage, confidence, and unknowns per protection point.
- Draft, strengthen, or polish a patent disclosure.
- Prepare protection-point and claim-drafting material for patent counsel.
- Export a compatible Markdown disclosure to `.docx`.

It does not submit applications, provide definitive legal conclusions, promise a grant rate, or replace counsel in producing filing-ready claims.

## Two Modes

### Full mode

Use full mode for an early invention idea or when prior-art assessment is requested. It covers disclosure-risk confirmation, an adaptive interview, qualitative prior-art assessment, user confirmation, and drafting.

Patent prior-art research is not limited to recent years. It searches historical material around the protection points, classifications, citation chains, and the relevant date cutoff. The report uses high/medium/low risk instead of fixed grant percentages.

### Fast mode

Use fast mode when the user already has substantial material or only wants organization, polishing, formatting, protection-point extraction, or Word export. The Skill states the limitations of omitted research but does not force network access, a prediction report, or a fixed interview sequence.

## Example Requests

```text
I have a sensor-structure invention. Take me through the full workflow and prepare material for patent counsel.
```

```text
Turn this complete R&D note into the five-section disclosure draft. Do not search the web yet.
```

```text
Search the historical prior art for this mechanical joint and give qualitative risk per protection point.
```

```text
Export the approved Markdown disclosure to Word without repeating the prior-art assessment.
```

## Word Export

The command-line interface remains:

```powershell
py -3 skills/patent-disclosure/scripts/generate_docx.py input.md output.docx
```

The document uses A4 pages. Mermaid is not rendered; Mermaid blocks become manual-insertion placeholders, and local images require Word post-processing. See the installed export workflow for complete input constraints.

## Install and Validate

```powershell
py -3 tests/validate_repository.py --skill patent-disclosure
.\scripts\install-skill.ps1 -Name patent-disclosure -DryRun
.\scripts\install-skill.ps1 -Name patent-disclosure
```

`behavior_cases.json` contains static contract fixtures. Real execution and trigger-boundary cases live in `evals.json` and `trigger_evals.json`; repository-only tests are not installed with the Skill.

## Freshness and Confidentiality

Network research is used only for invention discovery, prior-art assessment, or an explicit research request. Internal project names, confidential parameters, customer names, source code, and complete unpublished solutions must be abstracted into technical-problem, technical-means, and technical-effect terms before searching.

All findings remain limited by database coverage, the stated search cutoff, and unpublished information, and should be reviewed by a qualified patent professional.
