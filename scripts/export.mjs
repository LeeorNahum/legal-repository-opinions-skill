#!/usr/bin/env node
// Export an agreement's Markdown to a typeset HTML file and a signing PDF.
// Run with --help for the options. The Markdown is only read. The HTML and the
// PDF are written beside it, or into --out-dir. The PDF is printed by an
// installed Chrome, Edge, or Chromium, which the script finds itself.
// Needs Node.js 18.3 or later and no packages.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, delimiter, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const HELP = `legal-repository-opinions: export an agreement's Markdown to a typeset HTML file and a signing PDF.

Usage:
  export.mjs [options] <agreement.md>

Writes <agreement>.html and <agreement>.pdf beside the Markdown and prints one
JSON object naming both files and the PDF's page count. The Markdown is never
changed. Running it again replaces both files.

Options:
  --paper SIZE     letter (default) or a4.
  --out-dir DIR    Write the two files into DIR instead of beside the Markdown.
  --browser PATH   The Chrome, Edge, or Chromium executable to print with. Without
                   it the script looks in the usual install locations and on PATH.
                   The CHROME_PATH environment variable does the same.
  --help           Show this text.

What the Markdown may contain:
  Headings, paragraphs, tables, bullet and numbered lists, bold, and italic.
  Sections   A paragraph that opens with a section number such as 3.2, 4.1.2,
             or Section 3.2
             starts at the left margin with the number in bold, and its text
             runs on after it and wraps back to the margin. A sub-section such
             as 4.1.2 opens half an inch in, and each level below that half an
             inch more. The number has to continue the numbering: the same
             first number as the section or ARTICLE before it, or the next one.
             Any other paragraph that opens with a decimal stays a paragraph
             and is named in "warnings".
  Items      A paragraph that opens with (a), (ii), or (3) is set like a
             sub-section. A recital letter such as A. and a numbered list item
             are set like a section, with the number as typed. Bullets hang.
  Headings   The first top-level heading is the title, centered. Headings
             directly under it are subtitles, centered too, when a horizontal
             rule (---) closes them off from the text. "ARTICLE 3.
             Title" is centered. "Schedule A", "Exhibit B", "Annex 1",
             "Appendix I", and "Attachment 2", alone or followed by a title,
             are centered and start a new page. Every other heading is flush
             left.
  Blanks     Three or more underscores standing apart from a word are a fill-in
             blank, drawn at the length typed or the width of its line if that
             is shorter.
  Signing    Lines such as "Signature: ____", "By: ____", "Date: ____", or a bare
             blank, each its own paragraph or hard line break, form a signature
             block when one of them is a signature line or they sit under a
             "Signatures" heading. The signer's heading or name above them
             belongs to the block. A block that fits on a page is never
             split, blocks in a row share a page when they fit, and each
             line is 3.25 inches.
  Links      A link prints as its text, followed by its web or mail address
             in parentheses when the text is not the address itself.
  Quotes     Straight quotation marks print as curly ones, except straight
             after a digit.
  Left out   YAML frontmatter, HTML comments, and horizontal rules.

It will not write into a folder named Executed, "... (Executed)", or
"... Baseline", where the PDF beside the Markdown is the signed copy.
The Markdown must be UTF-8.

Needs Node.js 18.3 or later and Chrome, Edge, or Chromium 131 or later.

Exit codes:
  0  Both files written.
  2  Bad arguments, or the Markdown is missing or empty.
  3  No usable browser found.
  4  No PDF was produced, or the PDF already there could not be replaced.`;

const MIN_BROWSER_MAJOR = 131;

const PAPER = {
  letter: { css: "Letter", label: "Letter" },
  a4: { css: "A4", label: "A4" },
};

// Times New Roman is what model forms and filed agreements are set in. Times is
// its macOS name, and Liberation Serif and Nimbus Roman are its metric-compatible
// stand-ins on Linux. Every face in the list has lining numerals, and the
// stylesheet asks for them as well.
const FONT_STACK = `"Times New Roman", Times, "Liberation Serif", "Nimbus Roman", "Nimbus Roman No9 L", Tinos, serif`;

class Failure extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Markdown to blocks

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
// A line of underscores is a blank to fill in, so only hyphens and asterisks rule.
const RULE = /^ {0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,})$/;
const BULLET = /^([ \t]*)[-*+][ \t]+(.*)$/;
const ORDERED = /^([ \t]*)(\d{1,9}[.)])[ \t]+(.*)$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const TABLE_RULE = /^[ \t]*\|?[ \t]*:?-{1,}:?[ \t]*(?:\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/;

function stripMetadata(source, warnings) {
  let text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const frontmatter = /^---[ \t]*\n[\s\S]*?\n(?:---|\.\.\.)[ \t]*(?:\n|$)/.exec(text);
  if (frontmatter && /^[A-Za-z_][\w-]*[ \t]*:/m.test(frontmatter[0])) {
    text = text.slice(frontmatter[0].length);
    warnings.push("YAML frontmatter was left out of the export. An operative document should not carry any.");
  }
  let dropped = false;
  text = text.replace(/(`+)[\s\S]*?\1|<!--[\s\S]*?-->/g, (match) => {
    if (match.startsWith("`")) return match;
    dropped = true;
    return "";
  });
  if (dropped) {
    warnings.push("HTML comments were left out of the export.");
  }
  return text;
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  return row.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

function indentDepth(indent) {
  const width = indent.replace(/\t/g, "    ").length;
  return Math.min(3, Math.floor(width / 2));
}

function parseBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith(fence[1])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }
    if (RULE.test(line) && !/^_{3,}$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && TABLE_RULE.test(lines[i + 1])) {
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }
    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    if (bullet || ordered) {
      const item = bullet
        ? { type: "item", depth: indentDepth(bullet[1]), marker: null, lines: [bullet[2]] }
        : { type: "item", depth: indentDepth(ordered[1]), marker: ordered[2], lines: [ordered[3]] };
      i += 1;
      while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines, i)) {
        item.lines.push(lines[i].replace(/^[ \t]+/, ""));
        i += 1;
      }
      blocks.push(item);
      continue;
    }
    const para = [line.replace(/^ {1,3}/, "")];
    i += 1;
    while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines, i)) {
      para.push(lines[i].replace(/^[ \t]+/, ""));
      i += 1;
    }
    blocks.push({ type: "para", lines: para });
  }
  return blocks;
}

function startsBlock(lines, i) {
  const line = lines[i];
  if (HEADING.test(line) || FENCE.test(line) || BULLET.test(line)) return true;
  if (RULE.test(line) && !/^_{3,}$/.test(line.trim())) return true;
  if (ORDERED.test(line)) return true;
  return line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && TABLE_RULE.test(lines[i + 1]);
}

// ---------------------------------------------------------------------------
// Inline text

// Underscores inside a word, as in an identifier, are not a blank.
const BLANK_RUN = /(?<![\p{L}\p{N}_\\])(?:\\?_){3,}(?![\p{L}\p{N}_])/gu;
const LINE_WIDTH_EM = 39;
const notices = new Set();

// Text that is already final is held out of the way of the later passes behind
// two marker characters. They are picked from the private-use range so that
// neither one occurs anywhere in the document.
const marks = { open: "", close: "", pattern: null };
function chooseMarks(document) {
  const free = [];
  for (let code = 0xe000; code <= 0xf8ff && free.length < 2; code += 1) {
    const ch = String.fromCharCode(code);
    if (!document.includes(ch)) free.push(ch);
  }
  if (free.length < 2) throw new Failure(2, "The Markdown uses every private-use character, so it cannot be exported.");
  [marks.open, marks.close] = free;
  marks.pattern = new RegExp(`${marks.open}(\\d+)${marks.close}`, "g");
}

// A backslash ends a line with a hard break only when it is not itself escaped.
const HARD_BREAK = / {2,}$|(?<!\\)(?:\\\\)*\\$/;
function splitBreak(line) {
  if (/ {2,}$/.test(line)) return { text: line.replace(/ +$/, ""), hard: true };
  if (HARD_BREAK.test(line)) return { text: line.slice(0, -1), hard: true };
  return { text: line.trimEnd(), hard: false };
}

// A character reference typed in the Markdown, such as &amp; or &#36;, prints as
// its character, so it is let through after everything else is escaped.
const ESCAPED_REFERENCE = /&amp;(#\d{1,7}|#[xX][0-9A-Fa-f]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});/g;
function printable(text) {
  return escapeHtml(text).replace(ESCAPED_REFERENCE, "&$1;");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Straight quotes become curly ones. Emphasis markers are skipped when looking
// at what stands before a quote, so a quoted term in bold still opens correctly.
function curlQuotes(text) {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch !== '"' && ch !== "'") {
      out += ch;
      continue;
    }
    let j = i - 1;
    while (j >= 0 && (text[j] === "*" || text[j] === "_")) j -= 1;
    const before = j >= 0 ? text[j] : "";
    if (/\d/.test(before)) {
      out += ch;
      continue;
    }
    const opens = before === "" || /[\s(\[{\u2014\u2013/-]/.test(before) || before === "\u201C" || before === "\u2018";
    if (ch === '"') out += opens ? "\u201C" : "\u201D";
    else out += opens && /[A-Za-z]/.test(text[i + 1] ?? "") ? "\u2018" : "\u2019";
  }
  return out;
}

function blankWidth(run) {
  const count = run.replace(/\\/g, "").length;
  if (count * 0.5 > LINE_WIDTH_EM) notices.add(`A blank of ${count} underscores is longer than a line and was drawn at the full line width.`);
  return (count * 0.5).toFixed(1).replace(/\.0$/, "");
}

function renderInline(raw) {
  const held = [];
  const hold = (html) => {
    held.push(html);
    return `${marks.open}${held.length - 1}${marks.close}`;
  };
  let text = raw;
  text = text.replace(/(`+)([\s\S]*?)\1/g, (_, ticks, code) => hold(`<code>${escapeHtml(/^ .*\S.* $/s.test(code) ? code.slice(1, -1) : code)}</code>`));
  text = text.replace(/(?<!\\)!\[([^\]]*)\]\((?:[^()\s]|\([^()]*\))*(?:\s+"[^"]*")?\)/g, "$1");
  // A printed page cannot follow a link, so a web or mail address is printed
  // after its text. Links to files and anchors keep their text only. The address
  // is held as typed, before anything can read its characters as markup.
  text = text.replace(/(?<!\\)\[([^\]]*[^\]\\])\]\(<?((?:[^()\s<>]|\([^()]*\))*)>?(?:\s+"[^"]*")?\)/g, (_, label, target) => {
    const typed = target.replace(/\\([!-\/:-@\[-`{-~])/g, "$1");
    const address = typed.replace(/^mailto:/i, "");
    return /^(?:https?:|mailto:)/i.test(typed) && label.trim() !== address && label.trim() !== typed ? `${label} (${hold(printable(address))})` : label;
  });
  text = text.replace(/<((?:https?:\/\/|mailto:)[^>\s]+)>/g, (_, url) => hold(printable(url.replace(/^mailto:/, ""))));
  text = text.replace(BLANK_RUN, (run) => hold(`<span class="blank" style="width:${blankWidth(run)}em"></span>`));
  text = text.replace(/\\([!-\/:-@\[-`{-~])/g, (_, ch) => hold(escapeHtml(ch)));
  text = text.replace(/<br\s*\/?>/gi, () => hold("<br>"));
  text = escapeHtml(text);
  text = text.replace(ESCAPED_REFERENCE, "&$1;");
  text = curlQuotes(text);
  text = text.replace(/(?<![A-Za-z0-9*])\*\*(?=[^\s*])([\s\S]*?[^\s*])\*\*(?![A-Za-z0-9*])/g, "<strong>$1</strong>");
  text = text.replace(/(?<![A-Za-z0-9_])__(?=\S)([\s\S]*?\S)__(?![A-Za-z0-9_])/g, "<strong>$1</strong>");
  text = text.replace(/(?<![A-Za-z0-9*])\*(?=[^\s*])([^*]*?[^\s*])\*(?![A-Za-z0-9*])/g, "<em>$1</em>");
  text = text.replace(/(?<![A-Za-z0-9_])_(?=\S)([^_]*?\S)_(?![A-Za-z0-9_])/g, "<em>$1</em>");
  return text.replace(marks.pattern, (_, index) => held[Number(index)]);
}

function joinLines(lines) {
  return lines
    .map((line, index) => {
      if (index === lines.length - 1) return line.trimEnd();
      const { text, hard } = splitBreak(line);
      return hard ? `${text}<br>` : `${text} `;
    })
    .join("");
}

function plainText(raw) {
  return raw
    .replace(BLANK_RUN, " ")
    .replace(/[*`]/g, "")
    .replace(/\\(.)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Blocks to HTML

const ARTICLE = /^article\s+(?:\d+|[ivxlcdm]+)\b[.:]?/i;
const ATTACHMENT_WORD = /^(?:schedule|exhibit|annex|appendix|attachment)\b/i;
const ATTACHMENT_REST = /^\s*(?:[.:]|$)|^\s+(?:[A-Z]{1,2}|\d{1,3}|[IVXLC]{1,6})(?:[-.]\d{1,3})?(?=$|[\s.:,-])/;
// "Schedule A", "Exhibit B. Form of Note", "Annex 1", but not a heading that
// only happens to open with one of these words.
const ATTACHMENT = {
  test(text) {
    const word = ATTACHMENT_WORD.exec(text);
    return Boolean(word) && ATTACHMENT_REST.test(text.slice(word[0].length));
  },
};
const SIGNATURES = /^(?:signatures?(?:\s+(?:page|block))?|execution)\s*[.:]?$/i;
const HEADING_NUMBER = /^((?:Section[ \t]+)?\d+(?:\.\d+)*\.?)[ \t]+(?=\S)/;
const SECTION_NUMBER = /^(\*\*)?((?:Section[ \t]+)?\d+(?:\.\d+){1,4}\.?)(\*\*)?[ \t]+(?=\S)/;
// (a), (B), (aa), (iv), (12). A parenthesized word such as (Note) is prose.
const ENUM_MARKER = /^(\*\*)?(\((?:[A-Za-z]|([a-z])\3|[ivxl]{2,5}|[IVXL]{2,5}|\d{1,3})\))(\*\*)?[ \t]+(?=\S)/;
const SIGNING_LABEL = /^(?:(?:authorized |witness )?signature(?: of [^:]+)?|signed(?: by)?|sign here|by):$/i;
// The fields that sit beside a signature line. Under a Signatures heading any
// labeled line counts. Elsewhere only these do, so a form's other fill-in
// fields are not drawn into a signature block.
const SIGNING_FIELD = /^(?:(?:printed |print )?name|title|its|date|dated|e-?mail|address|phone|company|entity|witness):$/i;
const ENTITY_SUFFIX = /\b(?:Inc|Ltd|Co|Corp|LLC|L\.L\.C|LLP|L\.L\.P|LP|L\.P|N\.A|P\.C|PLLC)\.$/;
const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
const RECITAL_LETTER = /^([A-Z]\.)[ \t]+(?=\S)/;
const LABELED_LINE = /^(?:\*\*)?([A-Za-z][A-Za-z0-9 .'/&-]{0,29}?)(?:\*\*)?:(?:\*\*)?[ \t]*(.*)$/;
const FULL_BLANK = /^(?:\*\*)?(?:\\?_){3,}(?:\*\*)?$/;
const OPENING_PART = /^(?:recitals?|background|preamble|whereas|definitions?|parties|agreement|terms|purpose)\b/i;

function hasBlank(raw) {
  BLANK_RUN.lastIndex = 0;
  return BLANK_RUN.test(raw);
}

function capsSpan(text) {
  return /[A-Z]/.test(text) && !/[a-z]/.test(text.replace(/&[a-z]+;/g, "")) ? ` caps` : "";
}

function renderHeading(block, state) {
  const text = block.text;
  const bare = plainText(text);
  const tag = `h${Math.min(block.level, 6)}`;
  if (!state.titled && block.level === 1) {
    state.titled = true;
    state.title = bare;
    return `<h1 class="title${capsSpan(bare)}">${renderInline(text)}</h1>`;
  }
  const article = ARTICLE.exec(bare);
  const named = article || ATTACHMENT.test(bare) || SIGNATURES.test(bare) || HEADING_NUMBER.test(bare) || OPENING_PART.test(bare);
  if (block.subtitle && !named) return `<${tag} class="subtitle${capsSpan(bare)}">${renderInline(text)}</${tag}>`;
  if (article) {
    state.inAttachment = false;
    const numeral = /(\d+|[ivxlcdm]+)\b/i.exec(article[0].replace(/^article\s+/i, ""))[1];
    state.top = /^\d+$/.test(numeral) ? Number(numeral) : romanValue(numeral);
    // The label is spaced as capitals only when the heading carries no markup
    // in front of it, so the split below cuts where the label really ends.
    if (capsSpan(bare) || !text.startsWith(article[0])) return `<${tag} class="article${capsSpan(bare)}">${renderInline(text)}</${tag}>`;
    return `<${tag} class="article"><span class="caps">${escapeHtml(article[0])}</span>${renderInline(text.slice(article[0].length))}</${tag}>`;
  }
  if (ATTACHMENT.test(bare)) {
    state.inAttachment = true;
    state.top = null;
    return `<${tag} class="attachment${capsSpan(bare)}">${renderInline(text)}</${tag}>`;
  }
  if (SIGNATURES.test(bare)) {
    state.inAttachment = false;
    return `<${tag} class="head signatures">${renderInline(text)}</${tag}>`;
  }
  const number = HEADING_NUMBER.exec(bare);
  if (number) {
    state.top = Number(/\d+/.exec(number[1])[0]);
    // The number hangs in its own column only when no markup stands in front
    // of it. A heading wrapped in bold is set whole.
    if (text.startsWith(number[0])) {
      return `<${tag} class="head numbered"><span class="num">${escapeHtml(number[1])}</span>${renderInline(text.slice(number[0].length))}</${tag}>`;
    }
  }
  return `<${tag} class="head${capsSpan(bare)}">${renderInline(text)}</${tag}>`;
}

function romanValue(numeral) {
  const digits = Array.from(numeral.toLowerCase(), (ch) => ROMAN[ch]);
  return digits.reduce((sum, value, index) => sum + (value < (digits[index + 1] ?? 0) ? -value : value), 0);
}

// A section number continues the numbering: its first number is that of the
// section or article before it, or the next one. Anything else that opens with a
// decimal, such as an amount, is prose.
function continuesNumbering(number, state) {
  const top = Number(/\d+/.exec(number)[0]);
  if (state.top !== null && top !== state.top && top !== state.top + 1) {
    notices.add(`The paragraph opening "${number}" was set as plain text, because ${number} does not follow section ${state.top}. If it is a section, check the numbering.`);
    return false;
  }
  state.top = top;
  return true;
}

function renderPara(block, state) {
  const raw = joinLines(block.lines);
  if (block.inSignature) {
    // Only a blank that is the whole entry is a line to sign or write on. A blank
    // inside a sentence keeps the length it was written with.
    const line = `<span class="blank line"></span>`;
    const labeled = labeledLine(raw);
    if (labeled) {
      const entry = FULL_BLANK.test(labeled.value) ? line : renderInline(labeled.value);
      return `<p class="sigline"><span class="lbl">${renderInline(labeled.label)}</span>${entry}</p>`;
    }
    if (FULL_BLANK.test(raw.trim())) return `<p class="sigline">${line}</p>`;
    return `<p class="sigline">${renderInline(raw)}</p>`;
  }
  const section = SECTION_NUMBER.exec(raw);
  if (section && (section[1] || !section[3]) && continuesNumbering(section[2], state)) {
    const depth = Math.min(5, section[2].replace(/\.$/, "").split(".").length);
    // Bold that opens before the number and closes after it wraps the number
    // alone. Bold that opens before the number and runs on is a run-in heading.
    const rest = section[1] && !section[3] ? `**${raw.slice(section[0].length)}` : raw.slice(section[0].length);
    return `<p class="sec s${depth}"><span class="num">${escapeHtml(section[2])}</span>${renderInline(rest)}</p>`;
  }
  const item = ENUM_MARKER.exec(raw);
  if (item && Boolean(item[1]) === Boolean(item[4])) {
    return `<p class="sec enum"><span class="num">${escapeHtml(item[2])}</span>${renderInline(raw.slice(item[0].length))}</p>`;
  }
  const recital = RECITAL_LETTER.exec(raw);
  if (recital) {
    return `<p class="sec"><span class="num">${escapeHtml(recital[1])}</span>${renderInline(raw.slice(recital[0].length))}</p>`;
  }
  return `<p>${renderInline(raw)}</p>`;
}

// A numbered list item is set like a section, with the number as typed. Only
// bullets hang.
function renderItem(block) {
  const text = renderInline(joinLines(block.lines));
  if (block.marker) return `<p class="sec o${block.depth}"><span class="num">${escapeHtml(block.marker)}</span>${text}</p>`;
  return `<p class="item d${block.depth}"><span class="num">\u2022</span>${text}</p>`;
}

function renderTable(block) {
  const width = Math.max(block.header.length, ...block.rows.map((row) => row.length));
  if (block.rows.some((row) => row.length !== block.header.length)) {
    notices.add(`A table under the heading row "${block.header.join(" | ")}" has a row with a different number of cells. Check its columns, and write a literal | inside a cell as \\|.`);
  }
  const pad = (row) => Array.from({ length: width }, (_, index) => row[index] ?? "");
  const head = pad(block.header).map((cell) => `<th>${renderInline(cell)}</th>`).join("");
  const body = block.rows.map((row) => `<tr>${pad(row).map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("\n");
  return `<table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table>`;
}

// A signature block is a run of signing lines, each a label with its entry
// ("Date: ____") or a bare blank, at least one of them a blank to fill in, with
// the heading or short line that names the signer when there is one. It is
// wrapped so it cannot be split across pages. Blocks that follow one another,
// with the Signatures heading above them, are wrapped again so they share a page
// whenever they fit on one.
// A line that is a label, a colon, and what follows. The label may be in bold.
// The value is returned exactly as typed.
function labeledLine(raw) {
  const whole = /^\*\*((?:(?!\*\*).)+)\*\*$/.exec(raw.trim());
  const match = LABELED_LINE.exec(whole ? whole[1] : raw.trim());
  return match ? { label: `${match[1]}:`, value: match[2].trim() } : null;
}

// What one line contributes to a signature block: "sign" for a signature line,
// "blank" for another field left to fill in, "filled" for a field already
// filled in, and null for a line that is not a signing line at all. Outside a
// Signatures heading only the fields that belong beside a signature count.
function signingEntry(raw, underSignatures) {
  if (FULL_BLANK.test(raw.trim())) return "sign";
  const labeled = labeledLine(raw);
  if (!labeled) return null;
  const signs = SIGNING_LABEL.test(labeled.label);
  if (!signs && !underSignatures && !SIGNING_FIELD.test(labeled.label)) return null;
  if (!FULL_BLANK.test(labeled.value)) return "filled";
  return signs ? "sign" : "blank";
}

// A line that can stand above signing lines as the signer's name, such as a
// person or a company. A sentence is not one.
function looksLikeName(raw, underSignatures) {
  const text = plainText(raw);
  if (text === "" || hasBlank(raw)) return false;
  if (underSignatures) return true;
  if (text.length > 120) return false;
  if (/[;:,?!]$/.test(text) || /[.;:?!]\s/.test(text.replace(/\b[A-Z]\.\s/g, ""))) return false;
  return !/\.$/.test(text) || ENTITY_SUFFIX.test(text);
}

// Everything under a Signatures heading, up to the next heading of its level or
// the next article or attachment, is signing context.
function markSigningContext(blocks) {
  let sectionLevel = 0;
  for (const block of blocks) {
    if (block.type === "heading") {
      const text = plainText(block.text);
      if (SIGNATURES.test(text)) sectionLevel = block.level;
      else if (block.level <= sectionLevel || ARTICLE.test(text) || ATTACHMENT.test(text)) sectionLevel = 0;
    }
    block.underSignatures = sectionLevel > 0;
  }
}

// Signing lines typed as one paragraph with hard line breaks become one
// paragraph each, so they are measured and kept together like the rest. The
// first line may be the signer's name.
function splitSigningParagraphs(blocks) {
  return blocks.flatMap((block) => {
    if (block.type !== "para" || block.lines.length < 2) return [block];
    const parts = block.lines.map(splitBreak);
    if (!parts.slice(0, -1).every((part) => part.hard)) return [block];
    const entries = parts.map((part) => signingEntry(part.text, block.underSignatures));
    const named = entries[0] === null && looksLikeName(parts[0].text, block.underSignatures);
    const fields = named ? entries.slice(1) : entries;
    if (fields.length === 0 || fields.includes(null) || !fields.some((entry) => entry !== "filled")) return [block];
    return parts.map((part) => ({ type: "para", lines: [part.text], underSignatures: block.underSignatures }));
  });
}

function markSignatureBlocks(blocks) {
  const entryOf = (block) => (block.type === "para" ? signingEntry(joinLines(block.lines), block.underSignatures) : null);
  const isSignaturesHeading = (block) => block?.type === "heading" && SIGNATURES.test(plainText(block.text));
  const namesSigner = (block) => {
    if (block?.type === "para") return looksLikeName(joinLines(block.lines), block.underSignatures);
    if (block?.type !== "heading") return false;
    const text = plainText(block.text);
    return block.level > 1 && !SIGNATURES.test(text) && !ARTICLE.test(text) && !ATTACHMENT.test(text);
  };
  let i = 0;
  while (i < blocks.length) {
    if (!entryOf(blocks[i])) {
      i += 1;
      continue;
    }
    let end = i;
    while (end < blocks.length && entryOf(blocks[end])) end += 1;
    const entries = blocks.slice(i, end).map(entryOf);
    // A run with a blank is a signature block only when it holds a signature
    // line or sits under a Signatures heading. Other fill-in fields stay as typed.
    if (entries.includes("sign") || (entries.includes("blank") && blocks[i].underSignatures)) {
      const start = namesSigner(blocks[i - 1]) ? i - 1 : i;
      blocks[start].openSignature = true;
      blocks[end - 1].closeSignature = true;
      for (let k = start; k < end; k += 1) blocks[k].inSignature = true;
    }
    i = end;
  }
  let open = -1;
  let last = -1;
  const close = () => {
    if (open >= 0 && last >= 0) {
      blocks[open].openSignaturePage = true;
      blocks[last].closeSignaturePage = true;
    }
    open = -1;
    last = -1;
  };
  blocks.forEach((block, index) => {
    if (block.inSignature) {
      if (open < 0) open = index;
      last = index;
    } else if (isSignaturesHeading(block)) {
      close();
      open = index;
    } else if (block.type === "para" && last < 0 && (open >= 0 || /^in witness whereof\b/i.test(plainText(joinLines(block.lines))))) {
      // The execution statement above the first block travels with the blocks.
      if (open < 0) open = index;
    } else if (block.type !== "rule") {
      close();
    }
  });
  close();
}

// The headings directly under the title, when a horizontal rule closes them off
// from the text, are subtitles and are centered with the title.
function markSubtitles(blocks) {
  const title = blocks.findIndex((block) => block.type === "heading" && block.level === 1);
  if (title < 0) return;
  let end = title + 1;
  while (blocks[end]?.type === "heading") end += 1;
  if (blocks[end]?.type !== "rule") return;
  for (let i = title + 1; i < end; i += 1) blocks[i].subtitle = true;
}

function renderBody(parsed, warnings) {
  markSigningContext(parsed);
  const blocks = splitSigningParagraphs(parsed);
  markSignatureBlocks(blocks);
  markSubtitles(blocks);
  const state = { titled: false, title: "", inAttachment: false, top: null };
  const out = [];
  let ruleSeen = false;
  for (const block of blocks) {
    if (block.openSignaturePage) out.push(`<div class="sigpage${block.type === "heading" && state.inAttachment ? " newpage" : ""}">`);
    if (block.openSignature) out.push(`<div class="sigblock">`);
    if (block.type === "heading") {
      const html = renderHeading(block, state);
      out.push(block.inSignature ? html.replace('class="head', 'class="head signer') : html);
    } else {
      if (block.type === "para") out.push(renderPara(block, state));
      else if (block.type === "item") out.push(renderItem(block));
      else if (block.type === "table") out.push(renderTable(block));
      else if (block.type === "code") out.push(`<pre>${escapeHtml(block.text)}</pre>`);
      else if (block.type === "rule") ruleSeen = true;
    }
    if (block.closeSignature) out.push(`</div>`);
    if (block.closeSignaturePage) out.push(`</div>`);
  }
  if (ruleSeen) warnings.push("Horizontal rules were left out. Headings and spacing separate the parts of the document.");
  return { html: out.join("\n"), title: state.title };
}

// ---------------------------------------------------------------------------
// Page

function stylesheet(paper) {
  return `
@page {
  size: ${paper.css};
  margin: 1in;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-family: ${FONT_STACK};
    font-size: 10pt;
    font-variant-numeric: lining-nums;
    color: #000;
    vertical-align: top;
    padding-top: 0.35in;
  }
}
html {
  font-family: ${FONT_STACK};
  font-size: 12pt;
  line-height: 1.3;
  font-variant-numeric: lining-nums;
  font-kerning: normal;
  text-rendering: optimizeLegibility;
}
body { margin: 0; color: #000; background: #fff; orphans: 2; widows: 2; }
@media screen { body { max-width: 6.5in; margin: 1in auto; padding: 0 0.25in; } }
p { margin: 0 0 8pt; }
strong, th, h1, h2, h3, h4, h5, h6, .num { font-weight: 700; }
h1, h2, h3, h4, h5, h6 { font-size: 12pt; line-height: 1.25; margin: 14pt 0 6pt; break-after: avoid; break-inside: avoid; }
.caps { letter-spacing: 0.05em; }
.title { font-size: 14pt; text-align: center; margin: 0 0 14pt; }
.subtitle { text-align: center; margin: -8pt 0 14pt; }
.article, .attachment { text-align: center; margin: 20pt 0 10pt; }
.attachment, .newpage { break-before: page; }
.numbered { margin: 12pt 0 4pt; }
.num { margin-right: 0.75em; font-variant-numeric: lining-nums tabular-nums; }
.s3, .enum, .o1 { text-indent: 0.5in; }
.s4, .o2 { text-indent: 1in; }
.s5, .o3 { text-indent: 1.5in; }
.item { padding-left: 0.35in; text-indent: -0.35in; }
.item .num { display: inline-block; min-width: 0.35in; margin-right: 0; text-indent: 0; font-weight: 400; }
.item.d1 { padding-left: 0.7in; }
.item.d2 { padding-left: 1.05in; }
.item.d3 { padding-left: 1.4in; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 10.5pt; line-height: 1.25; break-inside: avoid; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th, td { border: 0.5pt solid #000; padding: 4pt 6pt; text-align: left; vertical-align: top; overflow-wrap: break-word; }
pre, code { font-family: Consolas, Menlo, "DejaVu Sans Mono", monospace; font-size: 10pt; }
pre { white-space: pre-wrap; margin: 0 0 8pt; }
.blank { display: inline-block; border-bottom: 0.6pt solid #000; max-width: 100%; }
.sigpage, .sigblock { break-inside: avoid; }
.sigblock { margin: 0 0 30pt; }
.signer { margin: 26pt 0 4pt; }
.sigline { margin: 0; padding-top: 15pt; }
/* The first line under a signer is the one signed, so it gets room for an e-signature field. */
.signer + .sigline, .sigblock > .sigline:first-child { padding-top: 34pt; }
.sigline .lbl { display: inline-block; min-width: 1.1in; }
.blank.line { width: 3.25in; }
`;
}

function buildHtml(markdown, paper, fallbackTitle, warnings) {
  const text = stripMetadata(markdown, warnings);
  chooseMarks(text);
  const blocks = parseBlocks(text);
  if (blocks.every((block) => block.type === "rule")) throw new Failure(2, "The Markdown file has no content to export.");
  const body = renderBody(blocks, warnings);
  // The title comes from the document's own top heading and never from a file
  // or folder name, which can carry a date or a status.
  const title = escapeHtml(body.title || fallbackTitle);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${stylesheet(paper)}</style>
</head>
<body>
${body.html}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Browser

function browserCandidates() {
  const list = [];
  if (process.platform === "win32") {
    const roots = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
    const apps = [
      ["Google", "Chrome", "Application", "chrome.exe"],
      ["Microsoft", "Edge", "Application", "msedge.exe"],
      ["Chromium", "Application", "chrome.exe"],
    ];
    for (const app of apps) for (const root of roots) list.push(join(root, ...app));
  } else if (process.platform === "darwin") {
    const apps = [
      "Google Chrome.app/Contents/MacOS/Google Chrome",
      "Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "Chromium.app/Contents/MacOS/Chromium",
    ];
    for (const app of apps) for (const root of ["/Applications", join(homedir(), "Applications")]) list.push(join(root, app));
  }
  const names = ["google-chrome", "google-chrome-stable", "chrome", "microsoft-edge", "microsoft-edge-stable", "msedge", "chromium", "chromium-browser"];
  const extensions = process.platform === "win32" ? [".exe"] : [""];
  for (const dir of (process.env.PATH ?? "").split(delimiter).filter(Boolean)) {
    for (const name of names) for (const extension of extensions) list.push(join(dir, name + extension));
  }
  if (process.platform === "linux") list.push("/snap/bin/chromium");
  return list;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// The major version of a Chrome, Edge, or Chromium executable, or null when the
// file is not one. On Windows the executable prints nothing for --version, so
// the version is read from the file's own properties.
function browserMajor(path) {
  if (!/chrom|edge/i.test(basename(path))) return null;
  let text = "";
  if (process.platform === "win32") {
    const bundled = join(process.env.SystemRoot ?? process.env.windir ?? "C:/Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    const result = spawnSync(isFile(bundled) ? bundled : "powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "(Get-Item -LiteralPath $env:AGREEMENT_EXPORT_BROWSER).VersionInfo.ProductVersion"], {
      encoding: "utf8",
      timeout: 20000,
      env: { ...process.env, AGREEMENT_EXPORT_BROWSER: path },
    });
    text = result.stdout ?? "";
  } else {
    const result = spawnSync(path, ["--version"], { encoding: "utf8", timeout: 15000 });
    text = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  }
  const match = /(\d+)\.\d+\.\d+/.exec(text);
  return match ? Number(match[1]) : null;
}

function findBrowser(explicit) {
  if (explicit) {
    if (!isFile(explicit)) throw new Failure(3, `No browser at ${explicit}. Pass --browser the path of a Chrome, Edge, or Chromium executable.`);
    const major = browserMajor(explicit);
    if (major === null) throw new Failure(3, `${explicit} is not a Chrome, Edge, or Chromium executable whose version can be read.`);
    if (major < MIN_BROWSER_MAJOR) {
      throw new Failure(3, `${explicit} is version ${major}. Page numbers need version ${MIN_BROWSER_MAJOR} or later. Update it or pass another with --browser.`);
    }
    return explicit;
  }
  const unusable = [];
  const seen = new Set();
  for (const candidate of browserCandidates()) {
    if (seen.has(candidate) || !isFile(candidate)) continue;
    seen.add(candidate);
    const major = browserMajor(candidate);
    if (major !== null && major >= MIN_BROWSER_MAJOR) return candidate;
    unusable.push(`${candidate} (${major === null ? "version unreadable" : `version ${major}`})`);
  }
  if (unusable.length) {
    throw new Failure(3, `Found no browser that can print page numbers, which needs version ${MIN_BROWSER_MAJOR} or later: ${unusable.join(", ")}. Update one, or pass another with --browser. The HTML file was still written.`);
  }
  throw new Failure(
    3,
    "No Chrome, Edge, or Chromium found. Install one, or pass its executable with --browser or the CHROME_PATH environment variable. The HTML file was still written.",
  );
}

// The browser prints into a scratch folder, and the PDF is moved into place only
// once it is known to be this run's output. An older PDF that cannot be
// replaced, because a viewer holds it open, is then a failure, not a success.
function printPdf(browser, htmlPath, pdfPath) {
  const scratch = mkdtempSync(join(tmpdir(), "agreement-export-"));
  const printed = join(scratch, "print.pdf");
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pdf-header-footer",
    `--user-data-dir=${join(scratch, "profile")}`,
    `--print-to-pdf=${printed}`,
    pathToFileURL(htmlPath).href,
  ];
  if (typeof process.getuid === "function" && process.getuid() === 0) args.unshift("--no-sandbox");
  try {
    const result = spawnSync(browser, args, { encoding: "utf8", timeout: 120000 });
    const head = existsSync(printed) ? readFileSync(printed).subarray(0, 5).toString("latin1") : "";
    if (head !== "%PDF-") {
      const detail = (result.stderr ?? "").trim().split("\n").slice(-3).join(" ") || (result.error ? result.error.message : `exit status ${result.status}`);
      throw new Failure(4, `${browser} did not produce a PDF. Browser said: ${detail}`);
    }
    try {
      copyFileSync(printed, pdfPath);
    } catch (error) {
      throw new Failure(4, `Could not write ${pdfPath}, so the PDF there is not this export. Close it if a viewer has it open, then run again. (${error.code ?? error.message})`);
    }
  } finally {
    try {
      rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // A browser still releasing its profile is not a failed export.
    }
  }
}

function countPages(pdfPath) {
  const text = readFileSync(pdfPath).toString("latin1");
  return (text.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
}

// ---------------------------------------------------------------------------
// Command line

function main() {
  let parsed;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        paper: { type: "string", default: "letter" },
        "out-dir": { type: "string" },
        browser: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
    });
  } catch (error) {
    throw new Failure(2, `${error.message}. Run with --help for the options.`);
  }
  const { values, positionals } = parsed;
  if (values.help) {
    console.log(HELP);
    return;
  }
  if (positionals.length !== 1) throw new Failure(2, "Give exactly one Markdown file. Usage: export.mjs [--paper letter|a4] [--out-dir DIR] <agreement.md>");
  const paperName = values.paper ?? "letter";
  const paper = PAPER[String(paperName).toLowerCase()];
  if (!paper) throw new Failure(2, `--paper must be letter or a4. Received: "${paperName}"`);
  const source = resolve(positionals[0]);
  if (!isFile(source)) throw new Failure(2, `No Markdown file at ${source}.`);
  if (!/^\.(md|markdown)$/i.test(extname(source))) throw new Failure(2, `${source} is not a .md file. Export from the canonical Markdown.`);

  const outDir = values["out-dir"] ? resolve(values["out-dir"]) : dirname(source);
  // In an executed folder the PDF beside the Markdown is the signed copy.
  const signed = outDir.split(/[\\/]/).find((part) => /^executed$/i.test(part) || /\(executed\)$/i.test(part) || /\bbaseline$/i.test(part));
  if (signed) throw new Failure(2, `${outDir} is an executed folder ("${signed}"), where the PDF is the signed copy. Export a draft, or pass --out-dir to write somewhere else.`);
  mkdirSync(outDir, { recursive: true });
  const stem = basename(source, extname(source));
  const htmlPath = join(outDir, `${stem}.html`);
  const pdfPath = join(outDir, `${stem}.pdf`);

  const warnings = [];
  const bytes = readFileSync(source);
  let markdown;
  try {
    markdown = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Failure(2, `${source} is not UTF-8 text. Save it as UTF-8 and export again.`);
  }
  if (markdown.includes("\0")) throw new Failure(2, `${source} is not UTF-8 text. Save it as UTF-8 and export again.`);
  writeFileSync(htmlPath, buildHtml(markdown, paper, "Document", warnings), "utf8");
  warnings.push(...notices);
  const browser = findBrowser(values.browser ?? process.env.CHROME_PATH);
  printPdf(browser, htmlPath, pdfPath);

  const pages = countPages(pdfPath);
  if (pages === 0) throw new Failure(4, `${pdfPath} has no pages. The browser did not finish printing. Run again.`);
  console.log(JSON.stringify({ source, html: htmlPath, pdf: pdfPath, pages, paper: paper.label, browser, warnings }, null, 2));
}

try {
  main();
} catch (error) {
  if (error instanceof Failure) {
    console.error(`Error: ${error.message}`);
    process.exit(error.code);
  }
  if (typeof error?.code === "string" && error.syscall) {
    console.error(`Error: ${error.message}`);
    process.exit(2);
  }
  throw error;
}
