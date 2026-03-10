import { DocumentState, Block, ImageBlock } from "@/types/blocks";

/**
 * Converts a single Block to its MDX/Markdown representation.
 * Requires TurndownService to be passed in for HTML→MD conversion
 * (it is created lazily in exportToMDX to avoid SSR issues).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockToMDX(block: Block, td: any): string {
  switch (block.type) {
    case "paragraph":
    case "heading": {
      const content = (block as { content: string }).content;
      if (!content || content === "<p></p>") return "";
      return td.turndown(content);
    }

    case "image": {
      if (!block.src) return "";
      const img = block as ImageBlock;
      const attrs: string[] = [`  src="${img.src}"`];
      if (img.alt)       attrs.push(`  alt="${img.alt}"`);
      if (img.width)     attrs.push(`  width={${img.width}}`);
      if (img.height)    attrs.push(`  height={${img.height}}`);
      if (img.alignment) attrs.push(`  alignment="${img.alignment}"`);
      if (img.caption)   attrs.push(`  caption="${img.caption}"`);
      return `<Image\n${attrs.join("\n")}\n/>`;
    }

    case "graph": {
      const lines = [
        `<Graph`,
        `  type="${block.chartType}"`,
        block.title ? `  title="${block.title}"` : null,
        `  labels="${block.data.labels.join(",")}"`,
        `  values="${block.data.values.join(",")}"`,
        `/>`,
      ].filter(Boolean);
      return lines.join("\n");
    }

    case "divider":
      return "---";

    case "code":
      return `\`\`\`${block.language ?? ""}\n${block.content}\n\`\`\``;
  }
}

/**
 * Exports the full document to an MDX string with YAML frontmatter.
 * TurndownService is dynamically imported so this is safe to call from
 * client-side event handlers without breaking SSR.
 */
export async function exportToMDX(document: DocumentState): Promise<string> {
  // Dynamic import keeps Turndown out of the SSR bundle
  const TurndownService = (await import("turndown")).default;
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Better fenced-code-block rule (preserves language tag)
  td.addRule("fencedCode", {
    filter: (node: HTMLElement) =>
      node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
    replacement: (_: string, node: HTMLElement) => {
      const code = node.firstChild as HTMLElement;
      const lang =
        code.getAttribute?.("class")?.replace("language-", "") ?? "";
      return `\n\`\`\`${lang}\n${code.textContent ?? ""}\n\`\`\`\n`;
    },
  });

  const hasGraph = document.blocks.some((b) => b.type === "graph");
  const hasImage = document.blocks.some((b) => b.type === "image" && (b as ImageBlock).src);

  const parts: string[] = [
    // YAML frontmatter
    "---",
    `title: "${document.title.replace(/"/g, '\\"')}"`,
    `date: "${new Date().toISOString().split("T")[0]}"`,
    "---",
    "",
  ];

  if (hasImage) {
    parts.push('import { Image } from "@/components/mdx/Image"');
  }
  if (hasGraph) {
    parts.push('import { Graph } from "@/components/mdx/Graph"');
  }
  if (hasImage || hasGraph) {
    parts.push("");
  }

  // Page title as H1
  parts.push(`# ${document.title}`);
  parts.push("");

  for (const block of document.blocks) {
    const mdx = blockToMDX(block, td);
    if (mdx) {
      parts.push(mdx);
      parts.push("");
    }
  }

  return parts.join("\n");
}

/** Triggers a browser download of the MDX string as <title>.mdx */
export function downloadMDX(mdxContent: string, title: string): void {
  const filename =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "document";
  const blob = new Blob([mdxContent], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `${filename}.mdx`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
