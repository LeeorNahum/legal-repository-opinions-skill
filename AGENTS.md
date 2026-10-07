# Maintenance contract: legal-repository-opinions

Rules for editing this skill. `SKILL.md` is the user-facing playbook and `README.md` is the short human skim layer.

## File roles

| File | Role |
| --- | --- |
| `SKILL.md` | The conventions: structure, lifecycle, naming, drafting anatomy, review, export, signing, and audit for legal-document repositories. The only content file. |
| `scripts/export.mjs` | The agent-facing export: one agreement's Markdown in, its typeset HTML and signing PDF out. Node.js standard library only, printed by an installed Chrome, Edge, or Chromium. |
| `package.json` | Lets `npx` run the export from the repository. Its `version` equals `metadata.version`. |
| `README.md` | Short human summary of what the skill covers. |

## Editing

- The skill ships the rules only. It does not ship or assume a target repository's `AGENTS.md`. A target repo's own `AGENTS.md` holds that repo's specifics (parties, status, controlling version), written per repo, never as a generic template here.
- This is a generic, publishable skill. Do not bake in any specific person, company, matter, or jurisdiction. Use placeholders.
- This skill states conventions, not legal advice. Preserve the not-legal-advice posture in every edit. Do not let the wording drift into sounding like counsel.
- Keep the opinions general. The lifecycle, naming, and review discipline are the durable content. Specific clauses and jurisdiction rules are out of scope.
- Keep `SKILL.md` under 500 lines and focused. Put conditional detail in `references/` only when it is genuinely conditional. This skill ships none today.
- Bump `metadata.version` by the release-versioning skill's rules for skills, and `package.json` with it.
- Update the README when needed.
- No em dashes in this skill's text.
- Quote every frontmatter string value. Keys stay unquoted.
- No semicolons used to join what should be separate sentences.

## Design notes

Internal notes are project knowledge, and the context-memory skill owns how they are written, indexed, consolidated, and archived. This skill says only where they live and what is particular to legal work: internal reasoning is never in anything that could be sent, and tidying notes never touches an operative document. Do not restate context-memory's rules here. Operative documents deliberately follow none of them. Keep these out when editing:

- Frontmatter or a modified date on an operative document. Frontmatter leaks into the signed export, and an executed document never changes.
- A generated index as the record of which version controls. That fact is recorded by a person, never inferred, and operative documents have no descriptions to index.
- Consolidation across instruments or density limits on `Executed/`. Each executed document stands alone, and `Executed/` is chronological by design.
- Deleting duplicates. A duplicate signed copy may be evidence.
- An ignored inbox. `Inbox/` is tracked, because a received draft is evidence.
- HTML surfaces. Every document here must export cleanly for signing. The only HTML in a legal repository is the file the export script generates.

## Export script

- The house style lives in the script's stylesheet and nowhere else. `SKILL.md` says to use the script and what Markdown shapes it reads, not what the type looks like.
- Lining numerals are required of every face in the font stack. A face with old-style numerals drops the digits of every section number below the line.
- The style follows how model forms and filed agreements are set, not a typography manual: Times New Roman, 12 point on 1.3 line spacing, 1 inch margins, the title, a subtitle under it, and the article and schedule headings centered, every other heading flush left, and each section starting at the left margin with its number in bold and its text running on and wrapping back to the margin. A sub-section opens half an inch in, and each level below it half an inch more. Nothing hangs in a column except bullets. Text is set flush left, though most filed agreements justify it, because justified text without hyphenation spaces badly. Tables are 10.5 point with hairline rules, and "Page n of N" is centered in the bottom margin.
- Before changing the layout, open several current model forms and executed agreements filed as exhibits and count what they do. Change it on that count, not on taste.
- Keep it dependency-free and cross-platform. No package to install, no network at run time, and no font that is not already on a stock Windows, macOS, or Linux machine.
- The script never writes to the Markdown and never prints a folder name, status marker, date, or generator note in either output. The PDF's file properties still hold the document's title, the browser that printed it, and the print time, which the browser writes.
- After changing the script, export a long agreement with articles, numbered sections, a table, a schedule, and two signers, and a short agreement of about a page, then look at the first page, a page of numbered sections, the table, and the signature page. Page numbers come from CSS page margin boxes, so a browser change is the first thing to suspect when the footer disappears.

## Before finishing

- No real proper nouns introduced (person, company, matter, or jurisdiction).
- `metadata.version` bumped as the release-versioning skill requires.
- README matches the actual file layout.
- The skill-forge validator passes.
