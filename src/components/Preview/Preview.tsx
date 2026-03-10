"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Block, GraphBlock } from "@/types/blocks";
import { useEditorStore } from "@/store/editorStore";
import Image from "next/image";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function PreviewGraph({ block }: { block: GraphBlock }) {
  const chartData = block.data.labels.map((label, i) => ({
    name: label,
    value: block.data.values[i] ?? 0,
  }));

  switch (block.chartType) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
  }
}

function PreviewBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <div
          className="preview-content mb-3"
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );
    case "heading":
      return (
        <div
          className="preview-content mb-4"
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );
    case "image": {
      if (!block.src) return null;
      const alignClass = block.alignment === "center"
        ? "justify-center"
        : block.alignment === "right"
        ? "justify-end"
        : "justify-start";
      return (
        <div className={`mb-4 w-full flex ${alignClass}`}>
          <div style={{ width: block.width ? `${block.width}px` : "100%", maxWidth: "100%" }}>
            <Image
              src={block.src}
              alt={block.alt ?? "image"}
              width={block.width ?? 800}
              height={block.height ?? 450}
              className="rounded-xl object-cover w-full"
              unoptimized
            />
            {block.caption && (
              <p className="text-xs text-gray-400 text-center mt-1">{block.caption}</p>
            )}
          </div>
        </div>
      );
    }
    case "graph":
      return (
        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {block.title && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">{block.title}</h3>
            </div>
          )}
          <div className="p-4">
            <PreviewGraph block={block} />
          </div>
        </div>
      );
    case "divider":
      return <hr className="border-gray-200 my-8" />;
    case "code":
      return (
        <pre className="bg-gray-900 text-green-400 rounded-xl p-4 mb-4 overflow-x-auto text-sm font-mono">
          <code>{block.content}</code>
        </pre>
      );
  }
}

export default function Preview() {
  const { document } = useEditorStore();

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-xs text-gray-500 font-medium">Live Preview</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {/* Page title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-100">
            {document.title || "Untitled Page"}
          </h1>
          {/* Blocks */}
          {document.blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}
