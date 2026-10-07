---
name: "legal-repository-opinions"
description: "Use when creating, drafting, redlining, reviewing, exporting, signing, organizing, naming, auditing, or archiving legal or contract documents in a repository, such as operating and partnership agreements, asset assignments, amendments, member exits, dissolutions, and contracts, or when deciding which executed version is in force. Opinionated defaults and standards for repositories of operative legal and business documents."
compatibility: "The bundled export script requires Node.js 18.3 or later and an installed Chrome, Edge, or Chromium at version 131 or later."
metadata:
  author: "Leeor Nahum"
  version: "2.0.0"
---

# Legal Repository Opinions

A legal repository is more than a folder of documents. The real artifacts are operative instruments, and what matters about each one is the same set of facts: who the parties are, which version is executed, which version is in force, and what every other file is relative to it. Keep those facts explicit so a draft is never mistaken for a signed agreement, and a superseded version is never mistaken for the one that controls.

These are opinionated defaults, not a jurisdiction-specific form. Apply what fits the matter. The structure, naming, and review discipline are the point, and the specific clauses are yours.

## Repo Shape

```text
<legal-repo>/
├── AGENTS.md           # this repo's specifics: parties, status, which version controls
├── README.md           # human-facing purpose, linking to AGENTS.md for status
├── Inbox/              # drafts and signed copies received from another party, waiting to be filed
├── Active/             # work toward the next execution
│   └── <Matter> <YYYY-MM-DD> (Draft)/      # the version lives on the folder
│       └── <Document Title>.md             # clean title, no date or status
├── Executed/           # signed, immutable, dated baselines
│   └── <Matter> <YYYY-MM-DD> Baseline/
│       ├── <Document Title>.md
│       ├── <Document Title>.pdf            # the signed copy
│       └── <Other Document Title>.md       # a set signed together shares the folder
└── Archive/
    ├── Superseded Drafts/      # drafts that were never executed
    │   └── <Matter> <YYYY-MM-DD> (Superseded)/
    │       └── <Document Title>.md
    └── Legacy and Reference/   # older versions, source and reference agreements
```

Every operative document lives in its own dated folder. Never leave one loose in a state folder. One folder can hold a set drafted, executed, or superseded together (an operating agreement and the asset assignment signed with it), in which case the folder is the set and each file is one document.

Create a folder when it holds a real document. Do not pre-create empty buckets or add placeholder files to keep them in Git. This skill supplies the rules. A repository's specifics, its parties, current status, and which version controls, live in that repository's own `AGENTS.md`, written for the matter, and nowhere else. Its `README` describes the purpose for a human and links there rather than repeating them. Do not assume a repository already has an `AGENTS.md`, and do not seed a generic one.

## Document Lifecycle And Controlling Version

- A document moves forward by version: draft, redline, executed, superseded. It never moves forward by editing an executed file in place.
- An executed document is immutable. To change executed terms, draft the next version in `Active/`, either a new dated document or an amendment, execute it, then move it to `Executed/`.
- Which version controls is a fact you record, not one you infer from folder placement. Name the controlling executed document and its date in the repository's `AGENTS.md`, because "the newest file in `Executed/`" is not safe to assume during a transition with several documents in flight. That file is the one owner of this fact. Other files link to it, and no generated list or index stands in for it.
- An amendment modifies the base agreement. It does not replace it. Keep both in `Executed/` and note in that same record that the base reads subject to the amendment.

## Naming

- Use ISO dates, `YYYY-MM-DD`, wherever a folder or file name carries a date. They sort chronologically and never read ambiguously across regions. Do not use `M.D.YYYY` or written-out months.
- The version lives on the folder: `<Matter or Set> <YYYY-MM-DD> (<Status>)/`. The document file inside is named by its title only, `<Document Title>.md`, with no date or status, which keeps its filename clean for export and signing. The date is that version's date, the draft or execution date, not today's date.
- Status markers are a closed set, each mapping to one lifecycle point: `(Draft)` early working text, `(Redline)` a marked-up comparison against the controlling version, `(Unsigned)` final text circulated for signature, `(Executed)` signed and in force, `(Superseded)` replaced by a later version. A signed baseline folder may use `Baseline` in place of `(Executed)`. The folder date plus a marker replaces free-text version words. Do not name a folder `Final`, `Revised`, or `Re-Revised`. Those do not scale and stop being true the moment the next version exists.
- Title Case for folder names and document filenames.
- One matter or entity per repository by default. If a repository holds more than one, lead each filename with the entity so files group correctly.

## Keep Metadata Out Of The Document Body

- Operative documents are export-and-sign artifacts. Do not put YAML frontmatter, agent notes, version tags, or process labels inside an agreement body. They leak into the exported, printed, or signed copy. The version and status live on the folder, never in the file.
- Internal strategy, the reasons behind a deal, negotiation playbooks, and enforceability reasoning live only in internal notes, clearly marked as internal and never shared with another party. Keep them out of any document or note that could be sent.

## Internal Notes

Review notes, negotiation notes, call transcripts, and message drafts are project knowledge, not legal documents. They live outside this tree, in the project's `Context/` directory, in a folder named for the matter, and the context-memory skill governs how they are written, indexed, and archived: [![context-memory on RemoteSkill](https://remoteskill.md/context-memory-V1EeZf7zmcow/badge.svg)](https://remoteskill.md/context-memory-V1EeZf7zmcow). A repository that holds only legal documents keeps that `Context/` at its root, beside `Active/`.

A `Notes/` folder already sitting among the legal folders stays where it is until it is moved on purpose, in one change that carries every note across whole and retargets every link to it. Never delete it or leave it half moved.

Tidying or consolidating notes never touches an operative document. Each executed document stands alone.

## Inbox

`Inbox/` holds what arrives from another party: a draft or redline, a signed page, a scan of either. Track it in git and never ignore it, because a received version is evidence of what was sent and when. File each item, then leave the inbox empty. A received draft goes to its own dated folder in `Active/` under the status it arrived in, and a signed copy goes beside its document in `Executed/`. A transcript or recording of a conversation is a note, not a received document, and is filed with the notes. Move the file as received. When an editable Markdown version is needed, put it beside the original rather than in its place.

## Archive

`Archive/` at the repository root is the only archive for legal documents. Superseded drafts and legacy and reference agreements move into it. Archiving is relocation, not rewrite: a file moves whole and unedited. Delete almost nothing. A superseded version, a received draft, or a duplicate signed copy may be evidence.

## Document Anatomy

For agreements and similar instruments, hold to these:

- Numbered hierarchy (`ARTICLE 1`, `Section 1.1`, `1.1.1`), a Recitals section for context and purpose, and a Definitions article or defined terms on first use.
- The boilerplate set: Governing Law, Amendment, Severability, Notices, Counterparts, Binding Effect, Entire Agreement, and dispute resolution. Flag any that is missing.
- Order each signature block as the printed name, then a blank line for the signature, then a date line, and ideally an email line, so an e-signature tool can map a field to each in turn.
- Define each party and term once, capitalize defined terms, and use one consistent label afterward, never an ambiguous pronoun where a party label belongs. Keep every section cross-reference correct after renumbering.
- A capitalized word reads as a defined term: define it on first use or do not capitalize it. Do not rely on a superseded or terminated agreement for a definition. Carry any needed definition into the new document.
- `shall` obligates, `may` permits, `will` states a future fact. Do not mix them loosely.
- Explicit placeholders for the effective date and any unknown dates, addresses, or amounts, written so they cannot be missed at signing.
- For fields an e-signature tool will fill, the signatures and the signed dates, leave a bare blank the tool can replace, with no pre-filled month or year, so it can place its field cleanly.
- Use heading levels for the title, the party block, the articles, and any section that has a title of its own, not bold text, so the markdown stays valid and converts cleanly. A section with no title is a paragraph that opens with its number.
- Make every fill-in blank long enough to write on or print.

## Review And Redline

When reviewing a document, work against the controlling executed baseline, not against memory:

1. Diff against the controlling version. List every substantive change, and flag any change that was not discussed or agreed.
2. Quantify impact per party where numbers exist: ownership, splits, caps, and distributions. Show before and after.
3. Check protections: notice and cure periods before forfeiture or removal, the exit, buyout, and dissolution terms, anti-dilution and anti-starvation for minority parties, audit and inspection rights, and clear IP ownership with a license-back on departure.
4. Flag common gaps: undefined financial triggers (break-even, caps, or "net"), missing boilerplate, vague contribution or termination standards, control that can override a minority party on everything, and IP whose ownership or reversion is unclear.
5. Separate operational control from economic interest where they legitimately diverge, and say so plainly rather than letting a reader assume they track each other.
6. Ground every asset and IP division in records, receipts, repositories, purchase logs, or commit history, not assertions. A party claims only what the records substantiate, and does not reach for what another party paid for or built.
7. Prefer concrete, bounded terms over vague ones. A restriction with an undefined standard, or an open-ended "similar" or "related" scope, invites future disputes and is hard to enforce. Pin it to specific, checkable boundaries or cut it.

Keep advice in plain language, propose specific replacement wording rather than only naming a concern, and recommend a licensed attorney for anything consequential. When a transcript or discussion records what the parties said, draft to what they actually need and are entitled to, not a verbatim memorialization of everything said, some of which may be careless or against a party's interest.

## Export And Signing

- The markdown file is the source of truth. When a document is exported to another format for signing, a shared doc or a PDF, record that the export exists and which file it came from. Do not let an export silently diverge from its source. A round trip through another editor degrades formatting and can drop content, so the markdown stays canonical.
- Make the signing PDF with the [export script](scripts/export.mjs), which sets every document in one typeface and layout. Do not hand-build the HTML, restyle one matter, or use a general Markdown converter, where a numbered list can be renumbered, a run of underscores can become emphasis so a signature line prints short, and a signature block can break across two pages. The script writes the HTML and the PDF beside the Markdown, leaves the Markdown untouched, and prints JSON with the page count and any `warnings`. Add `--paper a4` for A4.

  ```bash
  npx --yes github:LeeorNahum/legal-repository-opinions-skill "<Document Title>.md"
  node <skill-root>/scripts/export.mjs "<Document Title>.md"
  ```

- Write the Markdown in the shapes the script reads, which `--help` lists in full. Each section is its own paragraph, or its own heading, opening with its number (`3.2`, `4.1.2`), and each lettered item its own paragraph opening with `(a)`. An article is a heading opening with `ARTICLE 3`. A schedule or exhibit is a heading opening with `Schedule A` or `Exhibit B`, and it starts a new page. Each signing line, such as `Signature:` followed by its blank, is its own paragraph under the signer's heading. Do not open an ordinary paragraph with a decimal amount, because one that fits the numbering is set as a section.
- Both files are generated. Change the Markdown and export again, never the HTML or the PDF. The signed PDF in `Executed/` is not an export, and the script refuses to write there. Before the PDF goes to anyone, read the `warnings`, then the PDF itself: the page count, where each page ends, and the signature page.
- Fill the effective date at signing, or state that the document is effective on a named event, rather than leaving the date implied.
- Once every party has signed, save the executed copy to `Executed/` with `(Executed)` and the execution date, and stop editing it.

## Dissolution and Exit

When a party leaves, an entity dissolves, or an agreement is unwound:

- Read the controlling agreement first and surface every right and protection the represented party already holds, such as continuation or buyout rights, payouts on dissolution, and notice or cure periods. Do not let a party waive a right without knowing it. Flag each one being given up.
- Settle money and assets explicitly. Confirm the represented party owes nothing and is owed nothing, or state exactly what remains.
- Close with a full mutual release of claims under every prior agreement, and terminate those agreements so no obligation silently survives. Prefer a general termination of prior agreements over enumerating each removed restriction.
- Keep the operative document neutral. The reasons for the split stay out of it and live only in internal notes.
- Archive the prior agreements a release references, so the references are backed by the actual documents.

## Legal Repository Audit

When invoked to audit a legal repository, walk it against every section above: the recorded controlling version, immutable executed files, folder and file naming, no frontmatter or other metadata in any operative document, no internal reasoning in anything that could be sent, one archive for legal documents, an empty inbox, document anatomy, and exports that match their source. Diff the active draft against the controlling baseline as Review And Redline describes.

Report as a Markdown table with one row per finding and columns for document, category, and finding. Never paste a party's private contact details or signature image into the report.

Ask before any of these, which are hard to reverse and outward-facing:

- Editing anything in `Executed/`.
- Changing a party, an effective date, or an executed term.
- Deleting or overwriting any version.
- Sending a document to another party.
