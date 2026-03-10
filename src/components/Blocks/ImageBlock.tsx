"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageBlock as ImageBlockType, ImageAlignment } from "@/types/blocks";
import { useEditorStore } from "@/store/editorStore";

type Tab = "upload" | "url";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  block: ImageBlockType;
}

export default function ImageBlock({ block }: Props) {
  const { updateBlock } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tab, setTab] = useState<Tab>("upload");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [changing, setChanging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // ── Handlers ─────────────────────────────────────────────────────

  const applyFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const src = await readFileAsDataURL(file);
    updateBlock(block.id, { src, alt: file.name });
    setChanging(false);
  };

  const applyUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setUrlError("URL must start with http:// or https://");
        return;
      }
    } catch {
      setUrlError("Please enter a valid URL.");
      return;
    }
    updateBlock(block.id, { src: url, alt: "" });
    setUrlInput("");
    setUrlError("");
    setChanging(false);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    // Use the actual rendered container width so the first drag frame is accurate
    startWidthRef.current =
      block.width ?? containerRef.current?.offsetWidth ?? 600;
    setIsResizing(true);

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startXRef.current;
      updateBlock(block.id, { width: Math.max(100, startWidthRef.current + delta) });
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ── Shared insertion UI (used for both empty state and "Change") ─

  const InsertionPanel = (
    <div
      className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) applyFile(file);
      }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white">
        {(["upload", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "text-indigo-700 border-b-2 border-indigo-500 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "upload" ? "📁 Upload from device" : "🔗 Paste URL"}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div
          className="p-8 text-center cursor-pointer select-none"
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-4xl mb-2">🖼</div>
          <p className="text-gray-600 text-sm font-medium">
            {isDragging ? "Drop image here" : "Click to choose or drag & drop"}
          </p>
          <p className="text-gray-400 text-xs mt-1">PNG, JPG, GIF, WebP</p>
        </div>
      )}

      {/* URL tab */}
      {tab === "url" && (
        <div className="p-5 space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="https://example.com/photo.jpg"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            />
            <button
              onClick={applyUrl}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              Insert
            </button>
          </div>
          {urlError && <p className="text-red-500 text-xs">{urlError}</p>}
        </div>
      )}

      {/* Hidden file input shared between both tabs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) applyFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );

  // ── Empty state ───────────────────────────────────────────────────

  if (!block.src) return InsertionPanel;

  // ── Change-image overlay ──────────────────────────────────────────

  if (changing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-gray-500 font-medium">Replace image</span>
          <button
            onClick={() => setChanging(false)}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            ✕ Cancel
          </button>
        </div>
        {InsertionPanel}
      </div>
    );
  }

  // ── Image display ─────────────────────────────────────────────────

  const alignment = block.alignment ?? "left";
  const outerAlignClass: Record<ImageAlignment, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  /**
   * When the user clicks an alignment button and the image has no explicit
   * width yet, lock in the current rendered width first so the justify-*
   * class has a narrower element to actually reposition.
   */
  const applyAlignment = (a: ImageAlignment) => {
    const updates: Partial<ImageBlockType> = { alignment: a };
    if (!block.width && containerRef.current) {
      updates.width = containerRef.current.offsetWidth;
    }
    updateBlock(block.id, updates);
  };

  return (
    /*
     * Outer div: full-width flex row → controls horizontal alignment.
     * Inner div (containerRef): constrains the width and stacks image +
     * caption vertically with flex-col. group is here so absolute-
     * positioned controls inside the image wrapper respond to hover.
     */
    <div className={`w-full flex ${outerAlignClass[alignment]}`}>
      <div
        ref={containerRef}
        className="group flex flex-col"
        style={{
          width: block.width ? `${block.width}px` : "100%",
          maxWidth: "100%",
        }}
      >
        {/* Image + overlay controls + resize handle */}
        <div className="relative">
          <Image
            src={block.src}
            alt={block.alt ?? "image"}
            width={block.width ?? 800}
            height={block.height ?? 450}
            className="rounded-xl object-cover w-full block"
            unoptimized
            onError={() => updateBlock(block.id, { src: "" })}
          />

          {/* ── Hover control bar ── */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {(["left", "center", "right"] as ImageAlignment[]).map((a) => (
              <button
                key={a}
                title={`Align ${a}`}
                onClick={() => applyAlignment(a)}
                className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                  alignment === a
                    ? "bg-indigo-600 text-white"
                    : "bg-black/60 hover:bg-black/80 text-white"
                }`}
              >
                {a === "left" ? "←" : a === "center" ? "↔" : "→"}
              </button>
            ))}

            <div className="w-px bg-white/30 mx-0.5" />

            <button
              onClick={() => setChanging(true)}
              className="bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
            >
              Change
            </button>
            <button
              onClick={() => updateBlock(block.id, { src: "" })}
              className="bg-black/60 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>

          {/* ── Right-edge resize handle ── */}
          <div
            title="Drag to resize"
            className={`absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-r bg-indigo-500/40 opacity-0 group-hover:opacity-100 transition-opacity ${
              isResizing ? "opacity-100!" : ""
            }`}
            onMouseDown={handleResizeStart}
          />
        </div>

        {/* ── Caption — always below the image inside the flex-col ── */}
        <input
          className="w-full text-xs text-gray-400 bg-transparent border-none outline-none text-center placeholder-gray-300 focus:placeholder-gray-400 mt-1.5"
          placeholder="Add a caption…"
          value={block.caption ?? ""}
          onChange={(e) =>
            updateBlock(block.id, { caption: e.target.value || undefined })
          }
        />
      </div>
    </div>
  );
}
