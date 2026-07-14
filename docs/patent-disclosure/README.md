# patent-disclosure Skill

`patent-disclosure` turns an invention idea, R&D material, or an existing disclosure into technical material for review by an internal IP team or patent professional. It targets Chinese patent-disclosure practice and produces Chinese Markdown by default. Runtime boundaries and routing are defined by [SKILL.md](../../skills/patent-disclosure/SKILL.md).

Chinese documentation: [README.zh-CN.md](README.zh-CN.md).

## Fit and Boundaries

Use this Skill to:

- Mine candidate protection points from a broad R&D direction.
- Fill invention-information gaps with a small adaptive interview.
- Research patents, papers, standards, products, and public implementations for an initial prior-art assessment.
- Report qualitative risk, evidence coverage, confidence, and unknowns per protection point.
- Draft, review, strengthen, or polish a patent disclosure.
- Prepare protection-point and claim-drafting material for patent counsel.
- Export a compatible Markdown disclosure to `.docx`.

Do not use it to:

- Replace patent counsel or provide definitive legal, infringement, or FTO conclusions.
- Promise grant outcomes or produce filing-ready application text or final claims without professional review.
- Submit an application to a patent office on the user's behalf.

## Two Modes

| Mode | Use When | Behavior |
| --- | --- | --- |
| Full | The user has an early idea or requests prior-art research or risk assessment | Disclosure-risk confirmation → adaptive interview → prior-art assessment → user confirmation → drafting |
| Fast | The user already has substantial material and wants organization, review, strengthening, polishing, protection-point extraction, or Word export | Preserve the user's structure or template and disclose omitted research, without forcing web access, a prediction report, or fixed interview rounds |

Patent prior-art research is not limited to recent years. It follows the protection points, classifications, citation chains, and relevant date cutoff across historical material. Reports use high/medium/low risk instead of fixed grant percentages.

## Example Requests

```text
I have a sensor-structure invention. Take me through the full workflow and prepare material for patent counsel.
Here is a complete R&D note. Organize it using my template without web research for now.
Search the historical prior art for this mechanical joint and report qualitative risk per protection point.
Export the approved Markdown disclosure to Word without repeating the prior-art assessment.
```

## Freshness and Confidentiality

Network research is used only for invention discovery, prior-art assessment, or an explicit research request. Internal project names, confidential parameters, customer names, source code, and complete unpublished solutions must be abstracted into technical-problem, technical-means, and technical-effect terms before searching.

Findings remain limited by database coverage, the stated search cutoff, and unpublished information and should be reviewed by a qualified patent professional.

## Word Export

Word export requires Python 3 and `python-docx`. From the repository root:

```shell
python -m pip install python-docx
npm run test:docx
npm run patent:export -- input.md output.docx
```

The document uses A4 pages. Mermaid is not rendered; Mermaid blocks become manual-insertion placeholders, and local images require Word post-processing. See the [export workflow](../../skills/patent-disclosure/workflows/export-docx.md) for complete input constraints.

## Install and Use

```shell
npm ci
npm run skill:install -- --name patent-disclosure --dry-run
npm run skill:install -- --name patent-disclosure
```

Explicit invocation:

```text
Use $patent-disclosure to turn this R&D note into technical disclosure material for patent-counsel review.
```

Run `npm run validate -- --skill patent-disclosure` for static and contract validation. The DOCX smoke test is separate, so default installation does not require Python.
