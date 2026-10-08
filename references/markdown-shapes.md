# Markdown Shapes

The export script sets a document by the shape of its Markdown. Write these shapes exactly. Running the script with `--help` lists every shape it reads.

```markdown
# <Document Name>

This <Document Type> (this "Agreement") is between <Party One> and <Party Two>.

## ARTICLE 1. <Article Title>

1.1 <A section is one paragraph that opens with its number.>

1.2 <A section that introduces a list.>

(a) <Each lettered item is a paragraph of its own.>

(b) <A blank line separates it from the next.>

## Signatures

### <Signer's Full Name>

Signature: ______________________________

Date: ______________________________

Email: ______________________________
```

## Body

- The first `#` heading is the document's name. It prints as the heading on page 1.
- An article is a heading that opens with `ARTICLE 3`. A schedule or exhibit is a heading that opens with `Schedule A` or `Exhibit B`, and it starts a new page.
- A section is its own paragraph opening with its number (`3.2`, `4.1.2`), typed as plain text, not as a Markdown list. A section with a title of its own is a heading opening with its number.
- A lettered item is its own paragraph opening with `(a)`, `(ii)`, or `(3)`, typed plain. The script indents it and aligns its wrapped lines.
- Do not open an ordinary paragraph with a decimal amount or with a single letter or numeral in parentheses, because the script sets the first as a section when it fits the numbering and the second as an item.
- Use heading levels for the title, the articles, and any titled section, never bold text standing in for a heading.
- A fill-in blank is three or more underscores, drawn at the length typed. Make it long enough to write on.

## Signature Block

- One `## Signatures` heading, then a `###` heading per signer carrying the signer's printed name, then one paragraph per line: `Signature:`, `Date:`, and `Email:`, each followed by its blank.
- When an entity signs, the `###` heading is the entity's name, and the lines are `By:` with its blank, then `Name:` and `Title:` filled in with the person signing, then `Date:` and `Email:`.
- The email address is where notices to that signer go. The signature and the signed date are bare blanks, with no month or year typed in, so an e-signature tool can place its field on each.
- All spacing in the block comes from the script: the room above the signature line, the gap between signers, the length of each line, and keeping a block on one page. Never add blank lines, line breaks, or spacer characters to make room.
