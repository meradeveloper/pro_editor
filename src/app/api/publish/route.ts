import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { DocumentState, Block } from "@/types/blocks";

function blockToHtml(block: Block): string {
  switch (block.type) {
    case "paragraph":
      return block.content || "<p></p>";
    case "heading":
      return block.content || `<h${block.level}></h${block.level}>`;
    case "image":
      if (!block.src) return "";
      return `<img src="${block.src}" alt="${block.alt ?? ""}" style="max-width:100%;border-radius:12px;" />`;
    case "graph":
      return `<div style="padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;text-align:center;">
        <p style="font-weight:600;margin-bottom:8px;">${block.title ?? "Chart"}</p>
        <p style="color:#6b7280;font-size:14px;">📊 ${block.chartType} chart — ${block.data.labels.join(", ")}</p>
      </div>`;
    case "divider":
      return "<hr style='border:none;border-top:1px solid #e5e7eb;margin:32px 0;' />";
    case "code":
      return `<pre style="background:#1f2937;color:#d1fae5;padding:16px;border-radius:12px;overflow-x:auto;"><code>${block.content}</code></pre>`;
  }
}

function generateHtml(doc: DocumentState): string {
  const blocksHtml = doc.blocks.map(blockToHtml).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${doc.title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .container { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6; }
    h2 { font-size: 1.875rem; font-weight: 700; margin: 24px 0 12px; }
    h3 { font-size: 1.5rem; font-weight: 600; margin: 20px 0 10px; }
    p { margin: 0 0 12px; }
    ul, ol { padding-left: 24px; margin-bottom: 12px; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #6b7280; font-style: italic; margin: 16px 0; }
    pre { background: #1f2937; color: #d1fae5; padding: 16px; border-radius: 12px; overflow-x: auto; }
    code { background: #f3f4f6; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
    pre code { background: transparent; color: inherit; padding: 0; }
    img { max-width: 100%; border-radius: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${doc.title}</h1>
    ${blocksHtml}
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const { slug, document } = (await request.json()) as {
      slug: string;
      document: DocumentState;
    };

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const html = generateHtml(document);
    const siteDir = path.join(process.cwd(), "public", "sites");
    await mkdir(siteDir, { recursive: true });
    await writeFile(path.join(siteDir, `${slug}.json`), JSON.stringify(document, null, 2));
    await writeFile(path.join(siteDir, `${slug}.html`), html);

    return NextResponse.json({ ok: true, url: `/site/${slug}` });
  } catch (err) {
    console.error("Publish error:", err);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
