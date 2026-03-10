"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Block } from "@/types/blocks";
import { useEditorStore } from "@/store/editorStore";
import SlashCommandMenu from "./SlashCommandMenu";
import Toolbar from "./Toolbar";
import { BlockType } from "@/types/blocks";

interface Props {
  block: Block;
  isActive: boolean;
  onActivate: () => void;
}

export default function BlockEditor({ block, isActive, onActivate }: Props) {
  const { updateBlock, addBlock, deleteBlock } = useEditorStore();
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const content =
    block.type === "paragraph" || block.type === "heading"
      ? (block as { content: string }).content
      : "";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands or start writing…",
      }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (block.type === "paragraph" || block.type === "heading") {
        updateBlock(block.id, { content: html } as Partial<Block>);
      }

      // Check for slash command
      const { state } = editor;
      const { from } = state.selection;
      const text = state.doc.textBetween(Math.max(0, from - 30), from, "\n");
      const slashIdx = text.lastIndexOf("/");
      if (slashIdx !== -1) {
        const q = text.slice(slashIdx + 1);
        if (!/\s/.test(q)) {
          setSlashQuery(q);
          const slashPos = Math.max(1, from - q.length - 1);
          try {
            const coords = editor.view.coordsAtPos(slashPos);
            setMenuPos({ top: coords.bottom + 4, left: coords.left });
          } catch {
            // coordsAtPos can throw for out-of-bound positions; ignore
          }
          setShowSlash(true);
          return;
        }
      }
      setShowSlash(false);
    },
    onFocus: onActivate,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[1.5em]",
      },
      handleKeyDown: (view, event) => {
        // Delete empty block on Backspace
        if (event.key === "Backspace") {
          const { state } = view;
          const { from, to } = state.selection;
          if (from === 1 && to === 1) {
            setTimeout(() => deleteBlock(block.id), 0);
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      setShowSlash(false);
      if (!editor) return;

      // Remove the slash + query from editor
      const { state } = editor;
      const { from } = state.selection;
      const text = state.doc.textBetween(Math.max(0, from - 40), from, "\n");
      const slashIdx = text.lastIndexOf("/");
      if (slashIdx !== -1) {
        const deleteFrom = from - (text.length - slashIdx);
        editor
          .chain()
          .focus()
          .deleteRange({ from: deleteFrom, to: from })
          .run();
      }

      // If current block is empty paragraph, convert it; otherwise add after
      const isEmpty = editor.isEmpty;
      if (isEmpty && block.type === "paragraph") {
        // Replace this block
        if (type !== "paragraph") {
          addBlock(type, block.id);
          deleteBlock(block.id);
        }
      } else {
        addBlock(type, block.id);
      }
    },
    [editor, block, addBlock, deleteBlock]
  );

  // Sync content if changed externally
  useEffect(() => {
    if (!editor) return;
    if (block.type !== "paragraph" && block.type !== "heading") return;
    const currentHtml = editor.getHTML();
    const newContent = (block as { content: string }).content;
    if (currentHtml !== newContent && newContent !== undefined) {
      editor.commands.setContent(newContent || "<p></p>", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (block.type === "divider") {
    return (
      <div className="py-4">
        <hr className="border-gray-300" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {isActive && (block.type === "paragraph" || block.type === "heading") && (
        <Toolbar editor={editor} />
      )}
      <div
        className={`min-h-[1.5em] ${
          block.type === "heading" ? "text-3xl font-bold" : ""
        }`}
      >
        <EditorContent editor={editor} />
      </div>
      {showSlash && (
        <SlashCommandMenu
          query={slashQuery}
          position={menuPos}
          onSelect={handleSlashSelect}
          onClose={() => setShowSlash(false)}
        />
      )}
    </div>
  );
}
