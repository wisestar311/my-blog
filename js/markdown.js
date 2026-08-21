// Lightweight markdown + frontmatter parser. No external dependencies.

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const [, block, body] = match;
  const meta = {};
  block.split(/\r?\n/).forEach((line) => {
    const lineMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!lineMatch) return;
    const [, key, rawValue] = lineMatch;
    let value = rawValue.trim();
    if (key === "tags") {
      value = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
    meta[key] = value;
  });
  return { meta, body };
}

function renderInline(text) {
  let out = escapeHtml(text);
  // images ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">');
  // links [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  // bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italic *text*
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // inline code `code`
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;
  let paragraphBuf = [];
  let listBuf = null; // { type: 'ul'|'ol', items: [] }
  let quoteBuf = null;

  function flushParagraph() {
    if (paragraphBuf.length) {
      html.push(`<p>${renderInline(paragraphBuf.join(" "))}</p>`);
      paragraphBuf = [];
    }
  }

  function flushList() {
    if (listBuf) {
      const tag = listBuf.type;
      const items = listBuf.items.map((item) => `<li>${renderInline(item)}</li>`).join("");
      html.push(`<${tag}>${items}</${tag}>`);
      listBuf = null;
    }
  }

  function flushQuote() {
    if (quoteBuf) {
      html.push(`<blockquote><p>${renderInline(quoteBuf.join(" "))}</p></blockquote>`);
      quoteBuf = null;
    }
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  function splitTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  while (i < lines.length) {
    const line = lines[i];

    // table
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);
    const nextIsSeparator = isTableRow && lines[i + 1] && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1]);
    if (isTableRow && nextIsSeparator) {
      flushAll();
      const headerCells = splitTableRow(line);
      const bodyRows = [];
      i += 2;
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        bodyRows.push(splitTableRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headerCells.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${bodyRows
        .map((row) => `<tr>${row.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      html.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // code block
    const fenceMatch = line.match(/^```(.*)$/);
    if (fenceMatch) {
      flushAll();
      const lang = fenceMatch[1].trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html.push(`<pre><code${langClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    // heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll();
      html.push("<hr>");
      i++;
      continue;
    }

    // blockquote
    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      if (!quoteBuf) quoteBuf = [];
      if (quoteMatch[1]) quoteBuf.push(quoteMatch[1]);
      i++;
      continue;
    } else if (quoteBuf) {
      flushQuote();
    }

    // unordered list
    const ulMatch = line.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      flushQuote();
      if (!listBuf || listBuf.type !== "ul") {
        flushList();
        listBuf = { type: "ul", items: [] };
      }
      listBuf.items.push(ulMatch[1]);
      i++;
      continue;
    }

    // ordered list
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      flushQuote();
      if (!listBuf || listBuf.type !== "ol") {
        flushList();
        listBuf = { type: "ol", items: [] };
      }
      listBuf.items.push(olMatch[1]);
      i++;
      continue;
    }

    // blank line
    if (line.trim() === "") {
      flushAll();
      i++;
      continue;
    }

    // otherwise: paragraph text
    flushList();
    flushQuote();
    paragraphBuf.push(line.trim());
    i++;
  }

  flushAll();
  return html.join("\n");
}

window.BlogMarkdown = { parseFrontmatter, renderMarkdown, escapeHtml };
