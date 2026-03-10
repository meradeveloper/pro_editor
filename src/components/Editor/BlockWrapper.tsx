"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "@/types/blocks";
import { useEditorStore } from "@/store/editorStore";
import BlockEditor from "./BlockEditor";
import ImageBlock from "@/components/Blocks/ImageBlock";
import GraphBlock from "@/components/Blocks/GraphBlock";

interface Props {
  block: Block;
  index: number;
  /** When true, shows a right-edge drop indicator (block is the horizontal drop target). */
  isRightDropTarget?: boolean;
}

export default function BlockWrapper({ block, index: _index, isRightDropTarget }: Props) {
  const { activeBlockId, setActiveBlock, deleteBlock, addBlock, unGroupBlock } =
    useEditorStore();
  const isActive = activeBlockId === block.id;
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const renderBlock = () => {
    switch (block.type) {
      case "image":
        return <ImageBlock block={block} />;
      case "graph":
        return <GraphBlock block={block} />;
      default:
        return (
          <BlockEditor
            block={block}
            isActive={isActive}
            onActivate={() => setActiveBlock(block.id)}
          />
        );
    }
  };

  return (
    /*
     * The outer wrapper extends all the way into the controls area (pl-10)
     * so that moving the mouse from the block to the buttons never exits
     * the hover zone. The controls sit inside the same hover boundary.
     */
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as { current: HTMLDivElement | null }).current = node;
      }}
      style={style}
      /* group: CSS group-hover keeps controls visible while anything inside is hovered */
      className="group relative pl-10"
      onClick={() => setActiveBlock(block.id)}
    >
      {/* Right-edge drop indicator — shown when another block is being dragged onto this one's right side */}
      {isRightDropTarget && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r z-20 pointer-events-none" />
      )}

      {/* Floating controls — always in DOM, shown/hidden via opacity + pointer-events */}
      <div
        className={`
          absolute left-0 top-1/2 -translate-y-1/2
          flex flex-col items-center gap-1 z-10
          transition-opacity duration-100
          opacity-0 pointer-events-none
          group-hover:opacity-100 group-hover:pointer-events-auto
          focus-within:opacity-100 focus-within:pointer-events-auto
        `}
      >
        {/* Add block below */}
        <button
          title="Add block below"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={(e) => {
            e.stopPropagation();
            addBlock("paragraph", block.id);
          }}
        >
          +
        </button>

        {/* Drag handle */}
        <button
          title="Drag to reorder"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-400"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>

        {/* Delete block */}
        <button
          title="Delete block"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
        >
          🗑
        </button>

        {/* Remove from row (only shown when block is part of a horizontal row) */}
        {block.rowId && (
          <button
            title="Remove from row"
            className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-orange-400 hover:text-orange-600 hover:bg-orange-50 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            onClick={(e) => {
              e.stopPropagation();
              unGroupBlock(block.id);
            }}
          >
            ↕
          </button>
        )}
      </div>

      {/* Block content */}
      <div
        className={`px-1 py-1 rounded-lg transition-colors ${
          isActive ? "bg-blue-50/30" : ""
        }`}
      >
        {renderBlock()}
      </div>
    </div>
  );
}
