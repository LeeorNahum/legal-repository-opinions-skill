---
name: "legal-repository-opinions"
description: "Opinionated defaults and standards for repositories of operative legal and business documents: operating and partnership agreements, asset assignments, amendments, member exits, dissolutions, contracts, and negotiation and review notes. Covers repository structure, document grouping, lifecycle and which version controls, file and version naming, drafting anatomy (articles, recitals, definitions, boilerplate, defined terms, signature blocks, e-signature placeholders), protection review, and export-to-signing discipline. Use when creating, organizing, naming, drafting, redlining, reviewing, auditing, or archiving legal or contract documents in a repository, or when deciding which executed version is in force."
metadata:
  author: "Leeor Nahum"
  version: "1.0.0"
---

# Legal Repository Opinions

A legal repository is more than a folder of documents. The real artifacts are operative instruments, and what matters about each one is the same set of facts: who the parties are, which version is executed, which version is in force, and what every other file is relative to it. Keep those facts explicit so a draft is never mistaken for a signed agreement, and a superseded version is never mistaken for the one that controls.

These are opinionated defaults, not a jurisdiction-specific form. Apply what fits the matter; the structure, naming, and review discipline are the point, and the specific clauses are yours.

## Repo Shape

```text
<legal-repo>/
├── AGENTS.md           # this repo's specifics: parties, status, which version controls
├── README.md           # human-facing purpose, parties, and current status
├── Active/             # work toward the next execution, grouped by set
│   └── <Set>/
│       └── <Entity> <Document> <YYYY-MM-DD> (Draft).md
├── Executed/           # signed, immutable, dated baselines; the latest set is in force
│   └── <Entity> <YYYY-MM-DD> Baseline/
│       ├── <Entity> <Document> <YYYY-MM-DD> (Executed).md
│       └── <Entity> <Document> <YYYY-MM-DD> (Executed).md
├── Archive/
│   ├── Superseded Drafts/      # drafts that were never executed
│   └── Legacy and Reference/   # older versions, source templates, reference agreements
└── Notes/              # negotiation notes, redline summaries, checklists, talking points
```

Group related documents into a subfolder within each state folder rather than leaving files loose at its top. A set is the documents drafted, executed, or superseded together, such as an operating agreement and the asset assignment signed with it. Name the set folder for what unites it: the execution date for a signed baseline, or the matter for a draft set. A single standalone document may sit directly in the state folder.

Create a folder when it holds a real document. Do not pre-create empty buckets or add placeholder files to keep them in Git. This skill supplies the rules. A repository's specifics, its parties, current status, and which version controls, live in that repository's own `AGENTS.md` or `README`, written for the matter. Do not assume a repository already has one, and do not seed a generic one.

## Document Lifecycle And Controlling Version

- A document moves forward by version: draft, redline, executed, superseded. It never moves forward by editing an executed file in place.
- An executed document is immutable. To change executed terms, draft the next version in `Active/`, either a new dated document or an amendment, execute it, then move it to `Executed/`.
- Which version controls is a fact you record, not one you infer from folder placement. Name the controlling executed document and its date in a durable repo file, its `AGENTS.md` or `README`, because "the newest file in `Executed/`" is not safe to assume during a transition with several documents in flight.
- An amendment modifies the base agreement; it does not replace it. Keep both in `Executed/` and note in that same record that the base reads subject to the amendment.

## Naming

- Use ISO dates, `YYYY-MM-DD`, in every filename. They sort chronologically and never read ambiguously across regions. Do not use `M.D.YYYY` or written-out months.
- Shape: `<Entity> <Document Type> <YYYY-MM-DD> [(<Status>)].md`. The date is that version's date, the draft date or the execution date, not today's date.
- Status markers are a closed set, each mapping to one lifecycle point: `(Draft)` early working text, `(Redline)` a marked-up comparison against the controlling version, `(Unsigned)` final text circulated for signature, `(Executed)` signed and in force, `(Superseded)` replaced by a later version. The version date plus a marker replaces free-text version words. Do not name files `Final`, `Revised`, or `Re-Revised`; those do not scale and stop being true the moment the next version exists.
- Title Case for folder names and document filenames.
- One matter or entity per repository by default. If a repository holds more than one, lead each filename with the entity so files group correctly.

## Keep Metadata Out Of The Document Body

- Operative documents are export-and-sign artifacts. Do not put YAML frontmatter, agent notes, version tags, or process labels inside an agreement body; they leak into the exported, printed, or signed copy.
- Carry version metadata in the filename and in the repo's durable record (`AGENTS.md` or `README`), not in the document.
- `Notes/` files are internal working material and may carry frontmatter. Operative documents may not.
- Internal strategy, the reasons behind a deal, negotiation playbooks, and enforceability reasoning live only in `Notes/`, clearly marked as internal and never shared with another party. Keep them out of any document or note that could be sent.

## Document Anatomy

For agreements and similar instruments, hold to these:

- Numbered hierarchy (`ARTICLE 1`, `Section 1.1`, `1.1.1`), a Recitals section for context and purpose, and a Definitions article or defined terms on first use.
- The boilerplate set: Governing Law, Amendment, Severability, Notices, Counterparts, Binding Effect, Entire Agreement, and dispute resolution. Flag any that is missing.
- Order each signature block as the printed name, then a blank line for the signature, then a date line, and ideally an email line, so an e-signature tool can map a field to each in turn.
- Define each party and term once, capitalize defined terms, and use one consistent label afterward; never an ambiguous pronoun where a party label belongs. Keep every section cross-reference correct after renumbering.
- A capitalized word reads as a defined term: define it on first use or do not capitalize it. Do not rely on a superseded or terminated agreement for a definition; carry any needed definition into the new document.
- `shall` obligates, `may` permits, `will` states a future fact; do not mix them loosely.
- Explicit placeholders for the effective date and any unknown dates, addresses, or amounts, written so they cannot be missed at signing.
- For fields an e-signature tool will fill, the signatures and the signed dates, leave a bare blank the tool can replace, with no pre-filled month or year, so it can place its field cleanly.
- Use heading levels for the document hierarchy (title, party block, articles, sections), not bold text, so the markdown stays valid and converts cleanly.
- Make every fill-in blank long enough to write on or print.

## Review And Redline

When reviewing a document, work against the controlling executed baseline, not against memory:

1. Diff against the controlling version. List every substantive change, and flag any change that was not discussed or agreed.
2. Quantify impact per party where numbers exist: ownership, splits, caps, and distributions. Show before and after.
3. Check protections: notice and cure periods before forfeiture or removal; exit, buyout, and dissolution terms; anti-dilution and anti-starvation for minority parties; audit and inspection rights; clear IP ownership and a license-back on departure.
4. Flag common gaps: undefined financial triggers such as break-even, caps, or "net"; missing boilerplate; vague contribution or termination standards; control that can override a minority party on everything; and IP whose ownership or reversion is unclear.
5. Separate operational control from economic interest where they legitimately diverge, and say so plainly rather than letting a reader assume they track each other.
6. Ground every asset and IP division in records, receipts, repositories, purchase logs, or commit history, not assertions. A party claims only what the records substantiate, and does not reach for what another party paid for or built.
7. Prefer concrete, bounded terms over vague ones. A restriction with an undefined standard, or an open-ended "similar" or "related" scope, invites future disputes and is hard to enforce; pin it to specific, checkable boundaries or cut it.

Keep advice in plain language, propose specific replacement wording rather than only naming a concern, and recommend a licensed attorney for anything consequential. When a transcript or discussion records what the parties said, draft to what they actually need and are entitled to, not a verbatim memorialization of everything said, some of which may be careless or against a party's interest.

## Export And Signing

- The markdown file is the source of truth. When a document is exported to another format for signing, a shared doc or a PDF, record that the export exists and which file it came from. Do not let an export silently diverge from its source. A round trip through another editor degrades formatting and can drop content, so the markdown stays canonical.
- Fill the effective date at signing, or state that the document is effective on a named event, rather than leaving the date implied.
- Once every party has signed, save the executed copy to `Executed/` with `(Executed)` and the execution date, and stop editing it.

## Dissolution and Exit

When a party leaves, an entity dissolves, or an agreement is unwound:

- Read the controlling agreement first and surface every right and protection the represented party already holds, such as continuation or buyout rights, payouts on dissolution, and notice or cure periods. Do not let a party waive a right without knowing it; flag each one being given up.
- Settle money and assets explicitly. Confirm the represented party owes nothing and is owed nothing, or state exactly what remains.
- Close with a full mutual release of claims under every prior agreement, and terminate those agreements so no obligation silently survives. A single general termination is cleaner, and draws less attention, than enumerating each removed restriction.
- Keep the operative document neutral. The reasons for the split stay out of it and live only in internal notes.
- Archive the prior agreements a release references, so the references are backed by the actual documents.
- Retire shared assets by category, not by naming a third-party product, and do not bar a party from independently licensing a commercially available tool.

## Core Non-Negotiables

- An executed document is immutable; change terms by drafting the next version, never by editing the signed file.
- Which executed version controls is recorded in a durable repo file (`AGENTS.md` or `README`), not inferred from folder placement.
- ISO `YYYY-MM-DD` dates and the closed status-marker set in every filename; no `Final`, `Revised`, or `Re-Revised`.
- Related documents are grouped into set subfolders within each state folder, not left loose.
- No agent metadata, frontmatter, or process labels inside an operative document body.
- Every term and party is defined once and labeled consistently; `shall` obligates and `may` permits; unknown values are explicit placeholders.
- Reviews run against the controlling baseline and flag every undiscussed change.
- Asset and IP divisions are grounded in records, not assertions; a party claims only what the records substantiate.

## Legal Repository Audit

When invoked to audit a legal repository, walk it and confirm each convention above holds, reporting by document and category:

1. The controlling executed version is named in a durable repo file (`AGENTS.md` or `README`), not left to inference.
2. Executed files are immutable and dated, drafts and superseded material are separated into `Active/` and `Archive/`, and related documents are grouped into set subfolders rather than left loose.
3. Filenames follow the naming rule, and no operative document body carries frontmatter or process labels.
4. Each agreement has the expected anatomy, consistent defined terms, resolvable cross-references, and complete, e-signature-ready signature blocks.
5. The active draft, diffed against the controlling baseline, surfaces every undiscussed substantive change.
6. Exports are tracked to their source file and have not diverged.

Never paste a party's private contact details or signature image into the report.

Ask before: editing anything in `Executed/`; changing a party, an effective date, or an executed term; deleting or overwriting any version; or sending a document to another party. These are hard to reverse and outward-facing.
