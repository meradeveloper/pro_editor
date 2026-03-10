"use client";

import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (
    active: boolean,
    onClick: () => void,
    label: string,
    title: string
  ) => (
    <button
      title={title}
      onClick={onClick}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-gray-800 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 flex-wrap">
      {btn(
        editor.isActive("heading", { level: 1 }),
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        "H1",
        "Heading 1 (Ctrl+Shift+1)"
      )}
      {btn(
        editor.isActive("heading", { level: 2 }),
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        "H2",
        "Heading 2 (Ctrl+Shift+2)"
      )}
      {btn(
        editor.isActive("heading", { level: 3 }),
        () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        "H3",
        "Heading 3"
      )}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      {btn(
        editor.isActive("bold"),
        () => editor.chain().focus().toggleBold().run(),
        "B",
        "Bold (Ctrl+B)"
      )}
      {btn(
        editor.isActive("italic"),
        () => editor.chain().focus().toggleItalic().run(),
        "I",
        "Italic (Ctrl+I)"
      )}
      {btn(
        editor.isActive("strike"),
        () => editor.chain().focus().toggleStrike().run(),
        "S̶",
        "Strikethrough"
      )}
      {btn(
        editor.isActive("code"),
        () => editor.chain().focus().toggleCode().run(),
        "</>",
        "Inline code"
      )}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      {btn(
        editor.isActive("bulletList"),
        () => editor.chain().focus().toggleBulletList().run(),
        "• List",
        "Bullet list"
      )}
      {btn(
        editor.isActive("orderedList"),
        () => editor.chain().focus().toggleOrderedList().run(),
        "1. List",
        "Numbered list"
      )}
      {btn(
        editor.isActive("blockquote"),
        () => editor.chain().focus().toggleBlockquote().run(),
        "❝",
        "Blockquote"
      )}
      {btn(
        editor.isActive("codeBlock"),
        () => editor.chain().focus().toggleCodeBlock().run(),
        "{ }",
        "Code block"
      )}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        title="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        ↩
      </button>
      <button
        title="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        ↪
      </button>
    </div>
  );
}
