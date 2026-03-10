"use client";

import { useEffect, useRef, useState } from "react";
import { BlockType } from "@/types/blocks";

interface MenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

const MENU_ITEMS: MenuItem[] = [
  { type: "paragraph", label: "Text", description: "Plain text paragraph", icon: "T" },
  { type: "heading", label: "Heading", description: "Large section heading", icon: "H" },
  { type: "image", label: "Image", description: "Upload or embed an image", icon: "🖼" },
  { type: "graph", label: "Graph", description: "Insert a chart or graph", icon: "📊" },
  { type: "divider", label: "Divider", description: "Visual section separator", icon: "—" },
  { type: "code", label: "Code", description: "Code snippet block", icon: "</>" },
];

interface Props {
  query: string;
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export default function SlashCommandMenu({ query, position, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = MENU_ITEMS.filter(
    (item) =>
      !query ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selected]) onSelect(filtered[selected].type);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selected, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-72 py-2 overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
        Blocks
      </div>
      {filtered.map((item, i) => (
        <button
          key={item.type}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === selected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
          }`}
          onClick={() => onSelect(item.type)}
          onMouseEnter={() => setSelected(i)}
        >
          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-sm font-bold shrink-0">
            {item.icon}
          </span>
          <span>
            <span className="block font-medium text-sm">{item.label}</span>
            <span className="block text-xs text-gray-400">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
