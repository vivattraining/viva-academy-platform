"use client";

import { Fragment, ReactNode } from "react";

/**
 * Minimal markdown renderer for chapter content.
 *
 * Faculty write markdown in the curriculum JSON (chapter.summary).
 * The student LMS calls <ChapterRichText markdown={summary}/> to
 * render bold, italic, links, lists, headings, blockquotes, images,
 * and inline code. No third-party dependency — keeps the bundle
 * lean and dodges the supply-chain risk of a markdown library.
 *
 * Safety: every inline element is rendered through React (which
 * escapes text by default). Links are restricted to http/https/mailto
 * — javascript: and data: URLs are stripped to plain text. Images
 * have no event handlers. There is no HTML passthrough.
 *
 * Backwards compatible: plain text summaries (current state of the
 * curriculum) render as a single paragraph with no markup applied,
 * so this is a drop-in replacement for `<p>{chapter.summary}</p>`.
 */
export function ChapterRichText({ markdown }: { markdown: string }) {
  const text = markdown || "";
  const blocks = parseBlocks(text);
  return (
    <div className="chapter-rich-text" style={{ lineHeight: 1.65, fontSize: 15 }}>
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}

type Block =
  | { type: "p"; content: string }
  | { type: "h"; level: 2 | 3 | 4; content: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "img"; alt: string; url: string }
  | { type: "blockquote"; content: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Headings (## h2, ### h3, #### h4 — h1 is reserved for chapter title)
    const hMatch = /^(#{2,4})\s+(.+)$/.exec(trimmed);
    if (hMatch) {
      blocks.push({ type: "h", level: hMatch[1].length as 2 | 3 | 4, content: hMatch[2] });
      i++;
      continue;
    }

    // Standalone image
    const imgMatch = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (imgMatch) {
      blocks.push({ type: "img", alt: imgMatch[1], url: imgMatch[2] });
      i++;
      continue;
    }

    // Bullet list (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Numbered list (1. 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", content: quoteLines.join(" ") });
      continue;
    }

    // Paragraph — accumulate until blank line or special-block start
    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (/^(#{2,4})\s+/.test(t)) break;
      if (/^[-*]\s+/.test(t)) break;
      if (/^\d+\.\s+/.test(t)) break;
      if (t.startsWith(">")) break;
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      blocks.push({ type: "p", content: paraLines.join(" ") });
    }
  }
  return blocks;
}

function renderBlock(block: Block, idx: number): ReactNode {
  const key = `b${idx}`;
  switch (block.type) {
    case "h": {
      const sizes = { 2: "1.35rem", 3: "1.15rem", 4: "1rem" } as const;
      const Tag = (`h${block.level}` as "h2" | "h3" | "h4");
      return (
        <Tag key={key} style={{ marginTop: 18, marginBottom: 8, fontSize: sizes[block.level], fontWeight: 600, color: "var(--ink, #111d23)" }}>
          {renderInline(block.content, key)}
        </Tag>
      );
    }
    case "p":
      return (
        <p key={key} style={{ margin: "10px 0" }}>
          {renderInline(block.content, key)}
        </p>
      );
    case "ul":
      return (
        <ul key={key} style={{ margin: "10px 0 10px 22px", padding: 0 }}>
          {block.items.map((it, j) => (
            <li key={j} style={{ margin: "4px 0" }}>{renderInline(it, `${key}-${j}`)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} style={{ margin: "10px 0 10px 22px", padding: 0 }}>
          {block.items.map((it, j) => (
            <li key={j} style={{ margin: "4px 0" }}>{renderInline(it, `${key}-${j}`)}</li>
          ))}
        </ol>
      );
    case "img":
      if (!isSafeUrl(block.url)) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={block.url}
          alt={block.alt}
          style={{ maxWidth: "100%", height: "auto", borderRadius: 8, margin: "14px 0", display: "block" }}
          loading="lazy"
        />
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          style={{
            margin: "14px 0",
            padding: "10px 16px",
            borderLeft: "3px solid var(--accent, #b8860b)",
            background: "rgba(31, 78, 216, 0.04)",
            color: "var(--muted, #2f3140)",
            fontStyle: "italic",
            borderRadius: 0,
          }}
        >
          {renderInline(block.content, key)}
        </blockquote>
      );
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode {
  // Inline parser. Order matters: bold (**) before italic (*) before code (`)
  // before links/images. We work left-to-right, emitting React nodes.
  const out: ReactNode[] = [];
  let buffer = "";
  let key = 0;
  const flush = () => {
    if (buffer) {
      out.push(<Fragment key={`${keyPrefix}-t-${key++}`}>{buffer}</Fragment>);
      buffer = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    // **bold**
    if (ch === "*" && text[i + 1] === "*") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        out.push(
          <strong key={`${keyPrefix}-b-${key++}`}>
            {renderInline(text.slice(i + 2, end), `${keyPrefix}-b${key}`)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }

    // *italic* — but not when preceded/followed by another * (bold case)
    if (ch === "*" && text[i + 1] !== "*" && text[i - 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        flush();
        out.push(
          <em key={`${keyPrefix}-i-${key++}`}>
            {renderInline(text.slice(i + 1, end), `${keyPrefix}-i${key}`)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }

    // `code`
    if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        flush();
        out.push(
          <code
            key={`${keyPrefix}-c-${key++}`}
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "0.9em",
              padding: "1px 6px",
              background: "rgba(11, 31, 58, 0.07)",
              borderRadius: 3,
            }}
          >
            {text.slice(i + 1, end)}
          </code>
        );
        i = end + 1;
        continue;
      }
    }

    // ![image](url) — inline image (rare; standalone is handled at block level)
    if (ch === "!" && text[i + 1] === "[") {
      const close = text.indexOf("]", i + 2);
      if (close !== -1 && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          const alt = text.slice(i + 2, close);
          const url = text.slice(close + 2, urlEnd);
          if (isSafeUrl(url)) {
            flush();
            out.push(
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${keyPrefix}-img-${key++}`}
                src={url}
                alt={alt}
                style={{ maxWidth: "100%", height: "auto", verticalAlign: "middle" }}
                loading="lazy"
              />
            );
            i = urlEnd + 1;
            continue;
          }
        }
      }
    }

    // [link](url)
    if (ch === "[") {
      const close = text.indexOf("]", i + 1);
      if (close !== -1 && text[close + 1] === "(") {
        const urlEnd = text.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          const linkText = text.slice(i + 1, close);
          const url = text.slice(close + 2, urlEnd);
          flush();
          if (isSafeUrl(url)) {
            out.push(
              <a
                key={`${keyPrefix}-a-${key++}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1f4ed8", textDecoration: "underline" }}
              >
                {renderInline(linkText, `${keyPrefix}-a${key}`)}
              </a>
            );
          } else {
            // Unsafe URL — render the visible text only, drop the link.
            out.push(<Fragment key={`${keyPrefix}-x-${key++}`}>{linkText}</Fragment>);
          }
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buffer += ch;
    i++;
  }
  flush();
  return out;
}

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^(https?:|mailto:|\/)/i.test(trimmed);
}
