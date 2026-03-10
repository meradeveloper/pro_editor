"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Image from "next/image";
import { DocumentState, Block, GraphBlock as GraphBlockType } from "@/types/blocks";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function SiteGraph({ block }: { block: GraphBlockType }) {
  const chartData = block.data.labels.map((label, i) => ({
    name: label,
    value: block.data.values[i] ?? 0,
  }));
  switch (block.chartType) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
  }
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return <div className="preview-content mb-4" dangerouslySetInnerHTML={{ __html: block.content || "" }} />;
    case "heading":
      return <div className="preview-content mb-4" dangerouslySetInnerHTML={{ __html: block.content || "" }} />;
    case "image": {
      if (!block.src) return null;
      const alignClass = block.alignment === "center"
        ? "justify-center"
        : block.alignment === "right"
        ? "justify-end"
        : "justify-start";
      return (
        <div className={`mb-6 flex flex-col ${alignClass}`}>
          <div style={{ width: block.width ? `${block.width}px` : "100%", maxWidth: "100%" }}>
            <Image src={block.src} alt={block.alt ?? ""} width={block.width ?? 800}
              height={block.height ?? 450} className="rounded-2xl object-cover w-full" unoptimized />
            {block.caption && (
              <p className="text-xs text-gray-400 text-center mt-1.5">{block.caption}</p>
            )}
          </div>
        </div>
      );
    }
    case "graph":
      return (
        <div className="mb-6 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {block.title && (
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">{block.title}</h3>
            </div>
          )}
          <div className="p-5"><SiteGraph block={block} /></div>
        </div>
      );
    case "divider":
      return <hr className="border-gray-200 my-10" />;
    case "code":
      return (
        <pre className="bg-gray-900 text-green-400 rounded-2xl p-5 mb-6 overflow-x-auto text-sm font-mono">
          <code>{block.content}</code>
        </pre>
      );
  }
}

export default function SiteViewer({ document }: { document: DocumentState }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12 pb-8 border-b border-gray-100">
          <h1 className="text-5xl font-extrabold text-gray-900">{document.title}</h1>
          {document.publishedAt && (
            <p className="mt-3 text-sm text-gray-400">
              Published {new Date(document.publishedAt).toLocaleDateString()}
            </p>
          )}
        </header>
        <main className="space-y-1">
          {document.blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </main>
        <footer className="mt-16 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
          Built with ✦ Micro Website Builder
        </footer>
      </div>
    </div>
  );
}
