# legal-repository-opinions

Opinionated structure and drafting conventions for repositories of operative legal and business documents: agreements, asset assignments, amendments, and dissolutions.

It covers the document lifecycle (draft to executed to superseded), which version controls, ISO-dated version folders with a closed set of status markers, drafting anatomy (articles, recitals, definitions, boilerplate, signature blocks), redline and protection review, dissolution and release drafting, exporting a typeset signing PDF, e-signature-ready signing, and the inbox and single archive around the documents. Internal notes about a matter are left to the context-memory skill.

These are conventions, not legal advice, and not a substitute for a licensed attorney.

The skill is the rules. A repository's own `AGENTS.md` holds that repo's specifics (parties, status, which version controls). The skill neither ships nor assumes one.

## Files

- `SKILL.md` - the conventions, loaded by the agent.
- `scripts/export.mjs` - exports an agreement's Markdown to a typeset HTML file and a signing PDF. Needs Node.js 18.3 or later and Chrome, Edge, or Chromium.
- `package.json` - lets `npx` run the export script from this repository.
- `AGENTS.md` - maintenance contract for editing this skill.
