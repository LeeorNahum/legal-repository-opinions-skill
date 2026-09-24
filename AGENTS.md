# Maintenance contract: legal-repository-opinions

Rules for editing this skill. `SKILL.md` is the user-facing playbook and `README.md` is the short human skim layer.

## File roles

| File | Role |
| --- | --- |
| `SKILL.md` | The conventions: structure, lifecycle, naming, drafting anatomy, review, and audit for legal-document repositories. The only content file. |
| `README.md` | Short human summary of what the skill covers. |

## Editing

- The skill ships the rules only. It does not ship or assume a target repository's `AGENTS.md`. A target repo's own `AGENTS.md` holds that repo's specifics (parties, status, controlling version), written per repo, never as a generic template here.
- This is a generic, publishable skill. Do not bake in any specific person, company, matter, or jurisdiction. Use placeholders.
- This skill states conventions, not legal advice. Preserve the not-legal-advice posture in every edit. Do not let the wording drift into sounding like counsel.
- Keep the opinions general. The lifecycle, naming, and review discipline are the durable content. Specific clauses and jurisdiction rules are out of scope.
- Keep `SKILL.md` under 500 lines and focused. Put conditional detail in `references/` only when it is genuinely conditional. This skill ships none today.
- Bump `metadata.version` by the release-versioning skill's rules for skills.
- Update the README when needed.
- No em dashes in this skill's text.
- Quote every frontmatter string value. Keys stay unquoted.
- No semicolons used to join what should be separate sentences.

## Design notes

Notes, logs, the inbox, and the archive follow the same conventions as a general project-knowledge directory: four frontmatter fields, one owner per fact, a generated index, consolidation passes, append-only logs, and relocation rather than rewrite. Operative documents deliberately do not. Keep these out when editing:

- Frontmatter or a modified date on an operative document. Frontmatter leaks into the signed export, and an executed document never changes.
- A generated index as the record of which version controls. That fact is recorded by a person, never inferred, and operative documents have no descriptions to index.
- Consolidation across instruments or density limits on `Executed/`. Each executed document stands alone, and `Executed/` is chronological by design.
- Deleting duplicates. A duplicate signed copy may be evidence.
- HTML surfaces. Every document here must export cleanly for signing.

## Before finishing

- No real proper nouns introduced (person, company, matter, or jurisdiction).
- `metadata.version` bumped as the release-versioning skill requires.
- README matches the actual file layout.
