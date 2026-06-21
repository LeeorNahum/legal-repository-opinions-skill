# Maintenance contract: legal-repository-opinions

Rules for editing this skill.

- `SKILL.md` is the agent-facing playbook and the only content file: structure, lifecycle, naming, drafting anatomy, review, and audit for legal-document repositories. Keep it user-facing usage only.
- The skill ships the rules only. It does not ship or assume a target repository's `AGENTS.md`. A target repo's own `AGENTS.md` holds that repo's specifics (parties, status, controlling version), written per repo, never as a generic template here.
- This is a generic, publishable skill. Do not bake in any specific person, company, matter, or jurisdiction. Use placeholders.
- This skill states conventions, not legal advice. Preserve the not-legal-advice posture in every edit; do not let the wording drift into sounding like counsel.
- Keep the opinions general. The lifecycle, naming, and review discipline are the durable content; specific clauses and jurisdiction rules are out of scope.
- Keep `SKILL.md` under 500 lines and focused. Put conditional detail in `references/` only when it is genuinely conditional; this skill ships none today.
- Bump `metadata.version` (semver) with any behavior change: patch for wording, minor for new guidance or structure, major for changed conventions or a rename.
- Update the README when needed.
- No em dashes in this skill's text.
