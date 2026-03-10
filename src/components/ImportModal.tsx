"use client";

import { useRef, useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { markdownToBlocks } from "@/lib/markdownImport";

interface Props {
  onClose: () => void;
}

export default function ImportModal({ onClose }: Props) {
  const { importBlocks, setTitle } = useEditorStore();
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMarkdown((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!markdown.trim()) {
      setError("Paste some Markdown or load a file first.");
      return;
    }
    try {
      const { title, blocks } = markdownToBlocks(markdown);
      // Replace all blocks in the store — each block gets a fresh ID so
      // React unmounts old BlockEditor instances and mounts new ones with
      // the correct content. No editor reinitialisation needed.
      importBlocks(blocks, title);
      if (title) setTitle(title);
      onClose();
    } catch {
      setError("Failed to parse Markdown. Please check the content.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Import Markdown</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Load a <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">.md</code> file or
            paste Markdown directly. The first <code className="text-xs bg-gray-100 px-1 py-0.5 rounded"># H1</code>{" "}
            becomes the page title.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* File picker */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              📂 Load .md file
            </button>
            {markdown && (
              <span className="text-xs text-gray-400">
                {markdown.split("\n").length} lines loaded
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".md,.mdx,.txt"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {/* Textarea */}
          <textarea
            className="w-full h-72 border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder={`# My Page Title\n\nThis is a paragraph with **bold** and _italic_ text.\n\n## Section Heading\n\nAnother paragraph.\n\n---\n\n\`\`\`js\nconsole.log("hello")\n\`\`\``}
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setError("");
            }}
            spellCheck={false}
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-400">
            Existing content will be replaced.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!markdown.trim()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
