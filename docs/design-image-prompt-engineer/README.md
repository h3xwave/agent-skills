# design-image-prompt-engineer Skill

`design-image-prompt-engineer` turns a text brief, an existing prompt, or a reference image into an executable image prompt, a diagnosis, or reference-image guidance. It supports photography, illustration, graphic design, vector, collage, 3D/CGI, anime, and related media. Runtime activation and routing are defined by [SKILL.md](../../skills/design-image-prompt-engineer/SKILL.md).

Chinese documentation: [README.zh-CN.md](README.zh-CN.md).

## Fit and Boundaries

Use this Skill to:

- Write a general or platform-adapted image prompt from a text brief.
- Improve an existing prompt without replacing its subject or aesthetic intent.
- Diagnose AI-looking output, mixed media language, platform syntax conflicts, or harmful negative instructions.
- Analyze a reference image, extract a reusable style template, or write a complete prompt for a user-specified subject.
- Diagnose identity, proportion, or expression failures in person-reference workflows and assign a clear role to each reference.

Do not use it to:

- Generate, redraw, or edit an image directly; use an image generation or editing tool instead.
- Critique an image when no prompt, generation diagnosis, or reference workflow is requested.
- Humanize unrelated text or optimize a non-image prompt.

Person-reference guidance is limited to the user or people whose images the user is authorized to use. A text prompt alone cannot guarantee identity consistency, and unseen body characteristics are treated as generation assumptions rather than facts.

## Task Modes

| Mode | Deliverable |
| --- | --- |
| Write from scratch | A general natural-language prompt, with platform syntax only when requested |
| Optimize or diagnose | Causes, fix priority, and a revision that preserves the original intent |
| Style analysis | A structured account of medium, composition, lighting, color, and style |
| Reusable template | Style controls plus an explicit subject placeholder |
| Specific new subject | A complete prompt containing the requested product, character, brand, or copy |
| Person reference | Reference roles, generation steps, conflict diagnosis, and a revised prompt |

Platform syntaxes are never mixed. An independent negative prompt, `--no`, or another platform-specific control is emitted only when the selected platform supports it and the task needs it.

## Example Requests

```text
Turn this product brief into a general image prompt.
Diagnose why this photography prompt looks AI-generated and give me an improved version.
Analyze this reference image and create a reusable style template with a subject placeholder.
Keep the reference style but replace the subject with my branded coffee machine.
My full-body generations from my own headshot have unstable proportions and expressions. Diagnose and rewrite the prompt.
```

A request such as “change the clothes in this portrait and generate the finished image” should use an image editing tool instead of this Skill.

## Platform Freshness

Model versions, parameters, and reference-image capabilities change over time. Platform notes are loaded only when the user names a platform or platform syntax is required. Their verification date and official sources are the authority, and exact versions or parameters should be rechecked before use.

## Install and Use

From the repository root:

```shell
npm ci
npm run skill:install -- --name design-image-prompt-engineer --dry-run
npm run skill:install -- --name design-image-prompt-engineer
```

Install for another host:

```shell
npm run skill:install -- --name design-image-prompt-engineer --destination-root ~/.cc-switch/skills
```

Explicit invocation:

```text
Use $design-image-prompt-engineer to analyze this reference image and write a complete prompt for my specified product.
```
