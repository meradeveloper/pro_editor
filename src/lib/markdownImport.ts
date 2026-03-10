import { marked, Tokens } from "marked";
import { v4 as uuidv4 } from "uuid";
import { Block, ImageAlignment } from "@/types/blocks";

export interface ImportResult {
  title: string | undefined;
  blocks: Block[];
}

/**
 * Pre-processes an MDX string by extracting uppercase JSX self-closing tags
 * (e.g. <Image ... /> <Graph ... />) and replacing them with HTML comment
 * placeholders so that marked v17 does not tokenize them as mdxJsxFlowElement.
 */
function extractJSXComponents(mdx: string): {
  processed: string;
  components: Map<string, string>;
} {
  const components = new Map<string, string>();
  let idx = 0;
  // Match self-closing JSX tags starting with an uppercase letter,
  // including multi-line ones (e.g. <Image\n  src="..."\n/>).
  const processed = mdx.replace(
    /<([A-Z][a-zA-Z0-9]*)(\s[\s\S]*?)?\/>/g,
    (match) => {
      const key = `__MDX_${idx++}__`;
      components.set(key, match);
      return `\n<!-- MDX_BLOCK: ${key} -->\n`;
    }
  );
  return { processed, components };
}

/**
 * Parses a Markdown string into an array of editor Blocks.
 * The first H1 heading is extracted as the page title (not rendered as a block).
 * Standalone images (a paragraph containing only ![alt](url)) become ImageBlocks.
 * MDX <Graph /> components found in HTML tokens are re-hydrated as GraphBlocks.
 */
export function markdownToBlocks(markdown: string): ImportResult {
  const { processed, components } = extractJSXComponents(markdown);
  const tokens = marked.lexer(processed);
  const blocks: Block[] = [];
  let title: string | undefined;

  for (const token of tokens) {
    if (token.type === "space") continue;

    // ── Heading ────────────────────────────────────────────────────
    if (token.type === "heading") {
      const t = token as Tokens.Heading;
      // First H1 becomes the page title instead of a heading block
      if (t.depth === 1 && !title) {
        title = t.text;
        continue;
      }
      const level = Math.min(t.depth, 3) as 1 | 2 | 3;
      const inlineHtml = marked.parseInline(t.text) as string;
      blocks.push({
        id: uuidv4(),
        type: "heading",
        level,
        content: `<h${t.depth}>${inlineHtml}</h${t.depth}>`,
      });
      continue;
    }

    // ── Paragraph (or standalone image) ───────────────────────────
    if (token.type === "paragraph") {
      const t = token as Tokens.Paragraph;
      // Detect a bare image: ![alt](url)
      const imgMatch = t.text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        blocks.push({
          id: uuidv4(),
          type: "image",
          src: imgMatch[2],
          alt: imgMatch[1] || undefined,
        });
        continue;
      }
      const inlineHtml = marked.parseInline(t.text) as string;
      blocks.push({
        id: uuidv4(),
        type: "paragraph",
        content: `<p>${inlineHtml}</p>`,
      });
      continue;
    }

    // ── Fenced code block ──────────────────────────────────────────
    if (token.type === "code") {
      const t = token as Tokens.Code;
      blocks.push({
        id: uuidv4(),
        type: "code",
        content: t.text,
        language: t.lang || undefined,
      });
      continue;
    }

    // ── Horizontal rule → Divider ──────────────────────────────────
    if (token.type === "hr") {
      blocks.push({ id: uuidv4(), type: "divider" });
      continue;
    }

    // ── List → paragraph with <ul>/<ol> ───────────────────────────
    if (token.type === "list") {
      const t = token as Tokens.List;
      const tag = t.ordered ? "ol" : "ul";
      const items = t.items
        .map(
          (item) =>
            `<li>${marked.parseInline(item.text) as string}</li>`
        )
        .join("");
      blocks.push({
        id: uuidv4(),
        type: "paragraph",
        content: `<${tag}>${items}</${tag}>`,
      });
      continue;
    }

    // ── Blockquote ─────────────────────────────────────────────────
    if (token.type === "blockquote") {
      const t = token as Tokens.Blockquote;
      const innerText = t.tokens
        .filter((tok) => tok.type === "paragraph")
        .map((tok) => (tok as Tokens.Paragraph).text)
        .join(" ");
      const inlineHtml = marked.parseInline(innerText) as string;
      blocks.push({
        id: uuidv4(),
        type: "paragraph",
        content: `<blockquote><p>${inlineHtml}</p></blockquote>`,
      });
      continue;
    }

    // ── Raw HTML — re-hydrate exported MDX components ─────────────
    if (token.type === "html") {
      const t = token as Tokens.HTML;

      // Resolve placeholder comments left by extractJSXComponents()
      const placeholderMatch = t.text.match(/<!--\s*MDX_BLOCK:\s*(__MDX_\d+__)\s*-->/);
      const rawJSX = placeholderMatch ? components.get(placeholderMatch[1]) ?? t.text : t.text;

      // <Image src="…" width={n} alignment="…" caption="…" />
      const imageMatch = rawJSX.match(/<Image[\s\S]*?\bsrc="([^"]*)"[\s\S]*?\/>/);
      if (imageMatch) {
        const altM      = rawJSX.match(/\balt="([^"]*)"/);
        const widthM    = rawJSX.match(/\bwidth=\{(\d+)\}/);
        const heightM   = rawJSX.match(/\bheight=\{(\d+)\}/);
        const alignM    = rawJSX.match(/\balignment="(\w+)"/);
        const captionM  = rawJSX.match(/\bcaption="([^"]*)"/);
        blocks.push({
          id: uuidv4(),
          type: "image",
          src: imageMatch[1],
          alt:       altM?.[1]                              || undefined,
          width:     widthM  ? parseInt(widthM[1])          : undefined,
          height:    heightM ? parseInt(heightM[1])         : undefined,
          alignment: alignM  ? (alignM[1] as ImageAlignment): undefined,
          caption:   captionM?.[1]                          || undefined,
        });
        continue;
      }

      // <Graph type="…" labels="…" values="…" />
      const graphMatch = rawJSX.match(
        /<Graph[\s\S]*?\btype="(\w+)"[\s\S]*?\blabels="([^"]*)"[\s\S]*?\bvalues="([^"]*)"[\s\S]*?\/>/
      );
      if (graphMatch) {
        const labels = graphMatch[2].split(",").map((s) => s.trim()).filter(Boolean);
        const values = graphMatch[3]
          .split(",")
          .map((s) => parseFloat(s.trim()))
          .filter((n) => !isNaN(n));
        const titleMatch = rawJSX.match(/\btitle="([^"]*)"/);
        blocks.push({
          id: uuidv4(),
          type: "graph",
          chartType: graphMatch[1] as "bar" | "line" | "pie",
          title: titleMatch?.[1],
          data: { labels, values },
        });
        continue;
      }
    }
  }

  if (blocks.length === 0) {
    blocks.push({ id: uuidv4(), type: "paragraph", content: "" });
  }

  return { title, blocks };
}
