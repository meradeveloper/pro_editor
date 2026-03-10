"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEditorStore } from "@/store/editorStore";
import { Block } from "@/types/blocks";

// ── Render groups ────────────────────────────────────────────────────────────
type RenderGroup =
  | { type: "solo"; block: Block }
  | { type: "row"; rowId: string; blocks: Block[] };

function computeRenderGroups(blocks: Block[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    if (seen.has(block.id)) continue;
    if (block.rowId) {
      const rowBlocks = blocks.filter((b) => b.rowId === block.rowId);
      rowBlocks.forEach((b) => seen.add(b.id));
      groups.push({ type: "row", rowId: block.rowId, blocks: rowBlocks });
    } else {
      seen.add(block.id);
      groups.push({ type: "solo", block });
    }
  }
  return groups;
}
import BlockWrapper from "./Editor/BlockWrapper";
import Preview from "./Preview/Preview";
import PublishModal from "./PublishModal";
import ImportModal from "./ImportModal";
import { exportToMDX, downloadMDX } from "@/lib/mdxExport";

export default function EditorLayout() {
  const {
    document,
    setTitle,
    moveBlock,
    isPreviewMode,
    togglePreview,
    addBlock,
    updateBlock,
    groupBlocksInRow,
  } = useEditorStore();
  const [showPublish, setShowPublish] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editorDragOver, setEditorDragOver] = useState(false);
  const [rightDropTarget, setRightDropTarget] = useState<string | null>(null);

  // Global file-drop: image files dropped anywhere on the editor pane
  // create a new image block at the end.
  const handleEditorDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setEditorDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const id = addBlock("image");
    const reader = new FileReader();
    reader.onload = () =>
      updateBlock(id, { src: reader.result as string, alt: file.name });
    reader.readAsDataURL(file);
  };

  const handleExportMDX = async () => {
    setExporting(true);
    try {
      const mdx = await exportToMDX(document);
      downloadMDX(mdx, document.title);
    } finally {
      setExporting(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /** Returns true when the dragged item's center X is clearly right of the target's center. */
  const isRightSideDrop = (event: DragEndEvent | DragOverEvent): boolean => {
    const { active, over } = event;
    if (!over || active.id === over.id) return false;
    const translated = active.rect.current.translated;
    const overRect = over.rect;
    if (!translated || !overRect) return false;
    const activeCenterX = translated.left + translated.width / 2;
    const overCenterX = overRect.left + overRect.width / 2;
    return activeCenterX > overCenterX + 24;
  };

  const handleDragOver = (event: DragOverEvent) => {
    setRightDropTarget(isRightSideDrop(event) ? (event.over!.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setRightDropTarget(null);
    if (!over || active.id === over.id) return;

    if (isRightSideDrop(event)) {
      groupBlocksInRow(active.id as string, over.id as string);
      return;
    }

    const fromIdx = document.blocks.findIndex((b) => b.id === active.id);
    const toIdx = document.blocks.findIndex((b) => b.id === over.id);
    if (fromIdx !== -1 && toIdx !== -1) {
      moveBlock(fromIdx, toIdx);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-indigo-600">✦ Builder</span>
          <input
            value={document.title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-gray-700 font-medium bg-transparent border-none outline-none text-sm px-2 py-1 hover:bg-gray-100 rounded-lg focus:bg-gray-100 w-52"
            placeholder="Untitled Page"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-1.5 text-sm rounded-lg font-medium bg-gray-100 text-red-600 hover:bg-gray-200 transition-colors"
          >
            Import MD
          </button>
          <button
            onClick={handleExportMDX}
            disabled={exporting}
            className="px-4 py-1.5 text-sm rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {exporting ? "Exporting…" : "Export MDX"}
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <button
            onClick={togglePreview}
            className={`px-4 py-1.5 text-sm rounded-lg font-medium transition-colors ${
              isPreviewMode
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {isPreviewMode ? "← Edit" : "Preview"}
          </button>
          <button
            onClick={() => setShowPublish(true)}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Publish →
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        {!isPreviewMode && (
          <div
            className={`flex-1 overflow-y-auto bg-white transition-colors ${
              editorDragOver ? "bg-indigo-50" : ""
            }`}
            onDragOver={(e) => {
              // Only intercept file drags, not dnd-kit block reorder drags
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                setEditorDragOver(true);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setEditorDragOver(false);
              }
            }}
            onDrop={handleEditorDrop}
          >
            <div className="max-w-2xl mx-auto px-16 py-12">
              {/* Page title */}
              <input
                className="w-full text-4xl font-bold text-gray-900 bg-transparent border-none outline-none mb-8 placeholder-gray-300"
                value={document.title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title"
              />

              {/* Blocks */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={document.blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 pl-20">
                    {computeRenderGroups(document.blocks).map((group) =>
                      group.type === "row" ? (
                        <div key={group.rowId} className="flex gap-3">
                          {group.blocks.map((block) => (
                            <div key={block.id} className="flex-1 min-w-0">
                              <BlockWrapper
                                block={block}
                                index={document.blocks.findIndex((b) => b.id === block.id)}
                                isRightDropTarget={rightDropTarget === block.id}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <BlockWrapper
                          key={group.block.id}
                          block={group.block}
                          index={document.blocks.findIndex((b) => b.id === group.block.id)}
                          isRightDropTarget={rightDropTarget === group.block.id}
                        />
                      )
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add block at end */}
              <button
                className="mt-6 ml-20 flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors group"
                onClick={() => addBlock("paragraph")}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-md border border-gray-300 group-hover:border-gray-400 text-xs">
                  +
                </span>
                Add a block
              </button>
            </div>
          </div>
        )}

        {/* Preview pane — always visible in split mode, full screen when isPreviewMode */}
        {isPreviewMode ? (
          <div className="flex-1 overflow-hidden">
            <Preview />
          </div>
        ) : (
          <div className="w-[45%] border-l border-gray-200 overflow-hidden shrink-0">
            <Preview />
          </div>
        )}
      </div>

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
