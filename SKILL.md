---
name: "legal-repository-opinions"
description: "Use when creating, drafting, redlining, reviewing, exporting, signing, organizing, naming, auditing, or archiving legal or contract documents in a repository, such as operating and partnership agreements, asset assignments, amendments, member exits, dissolutions, and contracts, or when deciding which executed version is in force. Opinionated defaults and standards for repositories of operative legal and business documents."
compatibility: "The bundled export script requires Node.js 18.3 or later and an installed Chrome, Edge, or Chromium at version 131 or later."
metadata:
  author: "Leeor Nahum"
  version: "2.1.0"
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
│   └── <Document Name> <YYYY-MM-DD> (Draft)/   # the version lives on the folder
│       └── <Document Name>.md                  # the same name, no date or status
├── Executed/           # signed, immutable, dated baselines
│   └── <Document Or Set Name> <YYYY-MM-DD> Baseline/
│       ├── <Document Name>.md
│       ├── <Document Name>.pdf             # the signed copy
│       └── <Other Document Name>.md        # a set signed together shares the folder
└── Archive/
    ├── Superseded Drafts/      # drafts that were never executed
    │   └── <Document Name> <YYYY-MM-DD> (Superseded)/
    │       └── <Document Name>.md
    └── Legacy and Reference/   # older versions, source and reference agreements
```

Every operative document lives in its own dated folder. Never leave one loose in a state folder. One folder can hold a set drafted, executed, or superseded together (an operating agreement and the asset assignment signed with it), in which case the folder is the set and each file is one document.

Create a folder when it holds a real document. Do not pre-create empty buckets or add placeholder files to keep them in Git. This skill supplies the rules. A repository's specifics, its parties, current status, and which version controls, live in that repository's own `AGENTS.md`, written for the matter, and nowhere else. Its `README` describes the purpose for a human and links there rather than repeating them. Do not assume a repository already has an `AGENTS.md`, and do not seed a generic one.

## Document Lifecycle And Controlling Version

- A document moves forward by version: draft, redline, executed, superseded. It never moves forward by editing an executed file in place.
- A draft is edited in place, in its own folder, with no backup copies kept while it changes. Git history is the backup. A draft that was circulated but not signed is still a draft and is edited the same way. It moves to `Archive/Superseded Drafts/` only when it is abandoned, never each time it changes. What another party sent is kept as received, as Inbox describes.
- An executed document, one that was signed or otherwise agreed, is immutable and stays unedited in its own folder for good. To change executed terms, draft the next version in `Active/`, either a new dated document or an amendment, execute it, then move it to `Executed/`.
- Which version controls is a fact you record, not one you infer from folder placement. Name the controlling executed document and its date in the repository's `AGENTS.md`, because "the newest file in `Executed/`" is not safe to assume during a transition with several documents in flight. That file is the one owner of this fact. Other files link to it, and no generated list or index stands in for it.
- An amendment modifies the base agreement. It does not replace it. Keep both in `Executed/` and note in that same record that the base reads subject to the amendment.

## Naming

- Name a document after the venture or party it belongs to plus its type, `<Venture Or Party> <Document Type>`, for example "Acme Founders Agreement". Use that one name for the folder, the file, and the heading on page 1. A file named only "Founders Agreement.pdf" says nothing once it is emailed out of its folder. A folder holding a set is named the same way for the set.
- Use ISO dates, `YYYY-MM-DD`, wherever a folder or file name carries a date. They sort chronologically and never read ambiguously across regions. Do not use `M.D.YYYY` or written-out months.
- The version lives on the folder: `<Document Or Set Name> <YYYY-MM-DD> (<Status>)/`. The document file inside carries the name only, `<Document Name>.md`, with no date or status, which keeps its filename clean for export and signing. The date is that version's date, the draft or execution date, not today's date.
- Status markers are a closed set, each mapping to one lifecycle point: `(Draft)` early working text, `(Redline)` a marked-up comparison against the controlling version, `(Unsigned)` final text circulated for signature, `(Executed)` signed and in force, `(Superseded)` replaced by a later version. A signed baseline folder may use `Baseline` in place of `(Executed)`. The folder date plus a marker replaces free-text version words. Do not name a folder `Final`, `Revised`, or `Re-Revised`. Those do not scale and stop being true the moment the next version exists.
- Title Case for folder names and document filenames.
- One matter or entity per repository by default. Where a repository holds more than one, the leading venture or party already groups the files.

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

## Drafting

Do not pad, and equally do not leave out something that cannot safely be assumed.

- Establish the facts before drafting. From a short request, work out what you can and ask the user for the rest: at minimum the governing state or country, who the parties are and whether each is a person or an entity, what the document must do, and anything else the result turns on. Jurisdiction changes names, formation, and defaults. Then follow these opinions and fill the rest with defaults, and say so when another state or structure would suit the user better. Where the ask-questions skill is available, it governs how to ask.
- When someone asks a question about a clause, answer the question. Do not respond by drafting more text into it. Add words only when the governing law's default or another clause does not already give the result. Test each sentence by what breaks if it is deleted.
- State each rule once, in the section that owns it, and cross-reference it elsewhere. Do not write a section that only says what a later agreement will address. Decide the term now or leave it out.
- Recitals are optional. Open with who the parties are and what the agreement governs, in a few sentences. History and reasons live in internal notes.
- Numbered hierarchy (`ARTICLE 1`, `Section 1.1`, `1.1.1`), and a Definitions article or defined terms on first use.
- Boilerplate is chosen, not completed. Governing Law, Amendment, Severability, Notices, Counterparts, Binding Effect, Entire Agreement, and dispute resolution each go in when this agreement needs them, in a sentence where a sentence does the job. Flag one as missing only when its absence leaves a real gap.
- Define each party and term once, capitalize defined terms, and use one consistent label afterward, never an ambiguous pronoun where a party label belongs. Keep every section cross-reference correct after renumbering.
- A capitalized word reads as a defined term: define it on first use or do not capitalize it. Do not rely on a superseded or terminated agreement for a definition. Carry any needed definition into the new document.
- `shall` obligates, `may` permits, `will` states a future fact. Do not mix them loosely.
- While drafting, mark an unknown date, address, or amount with an explicit placeholder that cannot be missed. Make the document effective on a stated date or a named event, such as the last signature, so the effective date is never a blank.
- Before a draft reaches its owner, have a reviewer who did not write it, a person or a fresh agent session given only the document, read it cold for length, repetition, blanks, and whether the opening says what the document is. The writer's own re-read does not count, because the writer reads what was meant.

Read [Markdown shapes](references/markdown-shapes.md) before writing or editing a document's Markdown, its signature block included. It holds the exact shapes the export script reads.

Read [Term opinions](references/term-opinions.md) when drafting or reviewing an agreement among the owners of a venture, such as a founders, partnership, or operating agreement. It holds default positions on roles, vesting, leaving, money, background technology, and notices.

## Review And Redline

When reviewing a document, work against the controlling executed baseline, not against memory:

1. Diff against the controlling version. List every substantive change, and flag any change that was not discussed or agreed.
2. Quantify impact per party where numbers exist: ownership, splits, caps, and distributions. Show before and after.
3. Check protections: notice and cure periods before forfeiture or removal, the exit, buyout, and dissolution terms, anti-dilution and anti-starvation for minority parties, audit and inspection rights, and clear IP ownership with a license-back on departure.
4. Flag common gaps: undefined financial triggers (break-even, caps, or "net"), boilerplate whose absence leaves a real gap, vague contribution or termination standards, control that can override a minority party on everything, and IP whose ownership or reversion is unclear.
5. Separate operational control from economic interest where they legitimately diverge, and say so plainly rather than letting a reader assume they track each other.
6. Ground every asset and IP division in records, receipts, repositories, purchase logs, or commit history, not assertions. A party claims only what the records substantiate, and does not reach for what another party paid for or built.
7. Prefer concrete, bounded terms over vague ones. A restriction with an undefined standard, or an open-ended "similar" or "related" scope, invites future disputes and is hard to enforce. Pin it to specific, checkable boundaries or cut it.

Keep advice in plain language, and propose specific replacement wording rather than only naming a concern. When a transcript or discussion records what the parties said, draft to what they actually need and are entitled to, not a verbatim memorialization of everything said, some of which may be careless or against a party's interest.

## Export And Signing

- The markdown file is the source of truth. When a document is exported to another format for signing, a shared doc or a PDF, record that the export exists and which file it came from. Do not let an export silently diverge from its source. A round trip through another editor degrades formatting and can drop content, so the markdown stays canonical.
- Make the signing PDF with the [export script](scripts/export.mjs), which sets every document in one typeface and layout. Do not hand-build the HTML, restyle one matter, or use a general Markdown converter, where a numbered list can be renumbered, a run of underscores can become emphasis so a signature line prints short, and a signature block can break across two pages. The script writes the HTML and the PDF beside the Markdown, leaves the Markdown untouched, and prints JSON with the page count and any `warnings`. Add `--paper a4` for A4.

  ```bash
  npx --yes github:LeeorNahum/legal-repository-opinions-skill "<Document Name>.md"
  node <skill-root>/scripts/export.mjs "<Document Name>.md"
  ```

- Both files are generated. Change the Markdown and export again, never the HTML or the PDF. The signed PDF in `Executed/` is not an export, and the script refuses to write there. Before the PDF goes to anyone, read the `warnings`, then the PDF itself: the page count, where each page ends, and the signature page.
- Resolve every blank except the signature fields before the document circulates. A signer fills in only their own signature, date, and email address, never a term.
- When the same document is signed separately with several counterparties, each one gets a copy of their own, and each executed PDF carries the counterparty's name after the document's.
- Once every party has signed, save the executed copy to `Executed/` with `(Executed)` and the execution date, and stop editing it. Save the e-signature tool's audit certificate beside it. It is the evidence of who signed and when.
- For signing on paper, print one copy per party, have everyone sign every copy, let each party keep an original, and save a scan of one original as the executed copy.

## Dissolution and Exit

When a party leaves, an entity dissolves, or an agreement is unwound:

- Read the controlling agreement first and surface every right and protection the represented party already holds, such as continuation or buyout rights, payouts on dissolution, and notice or cure periods. Do not let a party waive a right without knowing it. Flag each one being given up.
- Settle money and assets explicitly. Confirm the represented party owes nothing and is owed nothing, or state exactly what remains.
- Close with a full mutual release of claims under every prior agreement, and terminate those agreements so no obligation silently survives. Prefer a general termination of prior agreements over enumerating each removed restriction.
- Keep the operative document neutral. The reasons for the split stay out of it and live only in internal notes.
- Archive the prior agreements a release references, so the references are backed by the actual documents.

## Legal Repository Audit

When invoked to audit a legal repository, walk it against every section above: the recorded controlling version, immutable executed files, folder, file, and page 1 naming, no frontmatter or other metadata in any operative document, no internal reasoning in anything that could be sent, one archive for legal documents, an empty inbox, drafting, and exports that match their source. Diff the active draft against the controlling baseline as Review And Redline describes.

Report as a Markdown table with one row per finding and columns for document, category, and finding. Never paste a party's private contact details or signature image into the report.

Ask before any of these, which are hard to reverse and outward-facing:

- Editing anything in `Executed/`.
- Changing a party, an effective date, or an executed term.
- Deleting or overwriting any version.
- Sending a document to another party.
