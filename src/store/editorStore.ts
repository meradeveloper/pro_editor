import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Block, BlockType, DocumentState } from "@/types/blocks";

interface EditorState {
  document: DocumentState;
  activeBlockId: string | null;
  isPreviewMode: boolean;

  // Document actions
  setTitle: (title: string) => void;

  // Block actions
  addBlock: (type: BlockType, afterId?: string) => string;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  duplicateBlock: (id: string) => void;

  // UI state
  setActiveBlock: (id: string | null) => void;
  togglePreview: () => void;

  // Import
  importBlocks: (blocks: Block[], title?: string) => void;

  // Publish
  publishDocument: (slug: string) => void;

  // Horizontal layout
  groupBlocksInRow: (draggedId: string, targetId: string) => void;
  unGroupBlock: (id: string) => void;
}

function createDefaultBlock(type: BlockType): Block {
  const id = uuidv4();
  switch (type) {
    case "paragraph":
      return { id, type: "paragraph", content: "" };
    case "heading":
      return { id, type: "heading", level: 1, content: "" };
    case "image":
      return { id, type: "image", src: "" };
    case "graph":
      return {
        id,
        type: "graph",
        chartType: "bar",
        title: "My Chart",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          values: [30, 45, 28, 60, 40],
        },
      };
    case "divider":
      return { id, type: "divider" };
    case "code":
      return { id, type: "code", content: "", language: "javascript" };
  }
}

const initialDocument: DocumentState = {
  id: uuidv4(),
  title: "Untitled Page",
  blocks: [
    {
      id: uuidv4(),
      type: "paragraph",
      content: "",
    },
  ],
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      document: initialDocument,
      activeBlockId: null,
      isPreviewMode: false,

      setTitle: (title) =>
        set((state) => ({
          document: { ...state.document, title },
        })),

      addBlock: (type, afterId) => {
        const newBlock = createDefaultBlock(type);
        set((state) => {
          const blocks = [...state.document.blocks];
          if (afterId) {
            const idx = blocks.findIndex((b) => b.id === afterId);
            blocks.splice(idx + 1, 0, newBlock);
          } else {
            blocks.push(newBlock);
          }
          return {
            document: { ...state.document, blocks },
            activeBlockId: newBlock.id,
          };
        });
        return newBlock.id;
      },

      updateBlock: (id, updates) =>
        set((state) => ({
          document: {
            ...state.document,
            blocks: state.document.blocks.map((b) =>
              b.id === id ? ({ ...b, ...updates } as Block) : b
            ),
          },
        })),

      deleteBlock: (id) =>
        set((state) => {
          const blocks = state.document.blocks.filter((b) => b.id !== id);
          // Always keep at least one block
          if (blocks.length === 0) {
            blocks.push({ id: uuidv4(), type: "paragraph", content: "" });
          }
          return {
            document: { ...state.document, blocks },
            activeBlockId: null,
          };
        }),

      moveBlock: (fromIndex, toIndex) =>
        set((state) => {
          const blocks = [...state.document.blocks];
          const [removed] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, removed);
          return { document: { ...state.document, blocks } };
        }),

      duplicateBlock: (id) => {
        const state = get();
        const block = state.document.blocks.find((b) => b.id === id);
        if (!block) return;
        const newBlock = { ...block, id: uuidv4() };
        set((s) => {
          const blocks = [...s.document.blocks];
          const idx = blocks.findIndex((b) => b.id === id);
          blocks.splice(idx + 1, 0, newBlock);
          return { document: { ...s.document, blocks } };
        });
      },

      importBlocks: (blocks, title) =>
        set((state) => ({
          document: {
            ...state.document,
            blocks,
            ...(title !== undefined ? { title } : {}),
          },
          activeBlockId: null,
        })),

      setActiveBlock: (id) => set({ activeBlockId: id }),

      togglePreview: () =>
        set((state) => ({ isPreviewMode: !state.isPreviewMode })),

      publishDocument: (slug) =>
        set((state) => ({
          document: {
            ...state.document,
            slug,
            publishedAt: new Date().toISOString(),
          },
        })),

      groupBlocksInRow: (draggedId, targetId) =>
        set((state) => {
          let blocks = [...state.document.blocks];
          const targetIdx = blocks.findIndex((b) => b.id === targetId);
          const draggedIdx = blocks.findIndex((b) => b.id === draggedId);
          if (targetIdx === -1 || draggedIdx === -1) return state;

          const target = blocks[targetIdx];
          const rowId = target.rowId ?? `row-${targetId}`;

          // Remove dragged block from its current position
          const [dragged] = blocks.splice(draggedIdx, 1);

          // Find insertion point: right after the last member of the target row
          const newTargetIdx = blocks.findIndex((b) => b.id === targetId);
          let insertAt = newTargetIdx + 1;
          while (insertAt < blocks.length && blocks[insertAt].rowId === rowId) {
            insertAt++;
          }

          // Insert with shared rowId
          blocks.splice(insertAt, 0, { ...dragged, rowId });

          // Stamp target block with the rowId too
          blocks = blocks.map((b) =>
            b.id === targetId ? { ...b, rowId } : b
          );

          return { document: { ...state.document, blocks } };
        }),

      unGroupBlock: (id) =>
        set((state) => ({
          document: {
            ...state.document,
            blocks: state.document.blocks.map((b) =>
              b.id === id ? { ...b, rowId: undefined } : b
            ),
          },
        })),
    }),
    {
      name: "micro-website-builder",
    }
  )
);
