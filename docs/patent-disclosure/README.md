# Patent Disclosure Skill

`patent-disclosure` is a Codex skill for turning invention ideas, technical notes, or rough research directions into structured patent disclosure materials. It is designed for Chinese patent disclosure workflows and produces Chinese patent disclosure drafts by default, while also supporting invention mining, prior-art risk assessment, structured inventor interviews, revision of existing disclosure drafts, and Word document export.

Chinese documentation is available in [README.zh-CN.md](README.zh-CN.md).

This skill does not replace a patent attorney, patent agent, or legal opinion. It helps prepare technical materials that can be reviewed by an internal intellectual property team or an external patent agency.

## What This Skill Is For

Use this skill when a user asks Codex to:

- Draft a patent disclosure document.
- Convert an invention idea into a structured disclosure.
- Mine patentable directions from a broad technical topic.
- Assess authorization prospects or prior-art collision risk.
- Review, strengthen, or polish an existing disclosure draft.
- Generate or export a Word `.docx` disclosure document.

Typical user requests include:

```text
Help me write a patent disclosure.
I have an invention idea and want to apply for a patent.
Generate a patent disclosure from this technical solution.
Assess whether this database operations idea is patentable.
Review this disclosure and improve the technical solution.
Export this disclosure to Word.
```

Chinese triggers include:

```text
帮我写专利交底书
我有个发明想申请专利
帮我把技术方案整理成交底书
生成技术交底
评估授权前景
把这份交底书导出成 Word
```

## Skill Capabilities

The skill supports five main task types:

1. **Direction discovery**
   - Used when the user only has a broad technical field or a vague idea.
   - Produces three patentable angles with potential protection points, risks, and required follow-up information.

2. **Structured inventor interview**
   - Used when the invention is not fully described.
   - Collects information in ordered rounds: technical problem, prior art, defects, technical solution, drawings, and innovation points.

3. **Prior-art assessment**
   - Used before formal drafting.
   - Searches relevant patent and literature sources where available, compares high-risk references, and outputs a patent application prediction report.

4. **Disclosure drafting and revision**
   - Generates a Chinese disclosure draft using the standard five-section template.
   - Can also revise or strengthen existing disclosure materials.

5. **Word export**
   - Converts a completed Markdown disclosure draft into a `.docx` file using the bundled Python script.

## Directory Structure

```text
patent-disclosure/
├── SKILL.md
├── rules/
│   ├── core-rules.md
│   └── search-and-confidentiality.md
├── workflows/
│   ├── discovery.md
│   ├── interview.md
│   ├── prior-art-assessment.md
│   ├── draft-disclosure.md
│   └── export-docx.md
├── references/
│   ├── analysis_framework.md
│   ├── scenarios.md
│   ├── search_strategy.md
│   ├── terminology.md
│   └── webSearch.csv
├── templates/
│   └── disclosure-template.md
└── scripts/
    └── generate_docx.py
```

## Required Workflow

The skill enforces a gated workflow. Do not skip the early gates unless the user explicitly only asks for narrow editing of existing text and the risk is clearly stated.

### Gate 1: Public Disclosure Check

Before drafting, ask whether the invention has already been disclosed through:

- Papers or preprints.
- Conferences or public talks.
- Product releases or marketing pages.
- Tender documents or customer-facing solutions.
- Open-source repositories.
- Articles, blogs, official accounts, or social media.

If the user says "I do not know" or gives an uncertain answer, treat the public disclosure status as unknown and perform a public-risk search using only generalized technical terms. Do not search internal product names, customer names, exact parameters, source code, or confidential implementation details unless the user explicitly confirms that they are safe to use.

### Gate 2: Information Collection

If the user has not provided a complete technical solution, run the interview workflow in order:

1. Technical problem and background.
2. Existing defects and invention purpose.
3. Technical solution, modules, steps, inputs, outputs, and diagrams.
4. Innovation points and technical effects.

Each round should ask no more than three questions.

If the user provides a complete document, technical note, or draft disclosure, use the existing-material path:

- Map the material to the five disclosure sections.
- Mark which parts are covered, partial, missing, or need confirmation.
- Ask no more than three key gap questions.

### Gate 3: Prior-Art Assessment

Before formal drafting, output a `Patent Application Prediction Report` that includes:

- Search cutoff date.
- Search goal.
- Search strategy, databases, keywords, classifications, and time window.
- Core concept definition.
- Prior-art conflict summary.
- Academic literature references where relevant.
- Optimistic, baseline, and pessimistic authorization scenarios.
- Factors affecting authorization prospects.
- Suggestions to improve patentability.
- Conclusion on whether to proceed with drafting.

The report must state that it is not legal advice and does not guarantee authorization.

### Gate 4: User Confirmation

Only proceed to formal disclosure drafting after the user confirms the assessment or explicitly asks to continue.

### Gate 5: Drafting

Draft using the fixed five-section template:

1. Technical problem to be solved.
2. Background technology.
3. Defects of the prior art and purpose of the invention.
4. Detailed technical solution.
5. Key points and desired protection points.

The draft should focus on technical problems, technical means, and technical effects. Avoid presenting business value, marketing claims, or management goals as the invention.

## Search and Confidentiality Rules

When search is available, use current-date-based time windows:

- Recent academic or open-source search: current year and previous year.
- Extended academic or trend search: current year and previous two years.
- Patent search: current year and previous three years, or wider if needed.
- Public-risk search: current year and previous three years.

Always include:

```text
Search cutoff date: YYYY-MM-DD
```

Use generalized search terms such as technical problem words, technical means words, technical effect words, synonyms, English equivalents, upper-level terms, lower-level terms, and IPC/CPC classification clues.

Do not expose:

- Internal project names.
- Customer names.
- Unpublished full technical schemes.
- Secret parameters.
- Source code.
- Commercially sensitive deployment details.

## How To Use This Skill In Codex

Ask naturally. The skill should activate automatically when the request matches patent disclosure work.

Example 1: broad direction discovery

```text
I want to generate a patent disclosure in database operations.
```

Expected behavior:

1. Ask about public disclosure risk.
2. Search generalized prior art.
3. Suggest three patentable directions.
4. Ask the user to choose or adjust a direction.

Example 2: invention idea to disclosure

```text
Help me write a patent disclosure for a multi-source database fault diagnosis method.
```

Expected behavior:

1. Check public disclosure status.
2. Interview for technical problem, prior art, defects, solution, and innovation points.
3. Output a prior-art assessment report.
4. Ask for confirmation before drafting.
5. Draft the disclosure in the fixed template.

Example 3: existing material

```text
Here is my technical solution. Please turn it into a patent disclosure.
```

Expected behavior:

1. Ask about public disclosure.
2. Map the provided material to the five disclosure sections.
3. Identify missing information.
4. Ask up to three key gap questions.
5. Assess prior art before formal drafting.

Example 4: Word export

```text
Export this patent disclosure to Word.
```

Expected behavior:

1. Confirm there is a complete Markdown disclosure body.
2. Use `scripts/generate_docx.py`.
3. Produce a `.docx` file.

## Word Export

The skill includes a Python script for Word generation:

```bash
python <path-to-skill>/scripts/generate_docx.py <input.md> <output.docx>
```

Requirements:

- Python 3.x.
- `python-docx`.

Output style:

- A4 page.
- 1.5 line spacing.
- Chinese text in `楷体_GB2312`.
- Western text in `Times New Roman`.
- Centered invention title.
- Auto-generated page numbers.

Mermaid diagrams are not rendered automatically by the script. The generated Word file inserts a placeholder asking the user to manually insert the corresponding flowchart or schematic image.

## Output Expectations

For disclosure drafting, the default output is Chinese Markdown.

The invention name should be concise, technical, and preferably no more than 25 Chinese characters. Avoid exaggerated words such as "best", "optimal", "super", or product/brand names.

The technical solution should be implementable:

- Method inventions should use ordered steps such as `S1`, `S2`, `S3`.
- Software inventions should describe inputs, processing, outputs, data structures, models, rules, and exception handling.
- System inventions should describe modules, module functions, data flow, and connections.
- Drawings should include a written explanation followed by Mermaid code.

## Limitations

This skill:

- Does not provide legal advice.
- Does not guarantee patent authorization.
- Does not replace a professional patent search.
- May miss paywalled, authenticated, unpublished, or non-indexed references.
- Must not fabricate technical features, parameter ranges, experimental data, or public-disclosure facts.

When information is missing, the skill should mark it as `to be confirmed` instead of inventing details.

## Best Practices For Users

Provide the following information when available:

- Technical field and application scenario.
- The technical problem being solved.
- Existing solution and its defects.
- Your specific technical steps, modules, algorithms, data structures, or system architecture.
- Inputs, outputs, and decision conditions.
- Any diagrams, logs, flowcharts, or implementation notes.
- Measured effects such as latency reduction, accuracy improvement, resource reduction, or failure-rate reduction.
- Whether the invention has been disclosed publicly and, if so, when and where.

Avoid sending unnecessary confidential information until the skill asks for it and explains why it is needed.
