"use client";

import { useState } from "react";
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
import { GraphBlock as GraphBlockType, ChartType } from "@/types/blocks";
import { useEditorStore } from "@/store/editorStore";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

interface Props {
  block: GraphBlockType;
}

function parseLabelsValues(labelsText: string, valuesText: string) {
  const labels = labelsText.split(",").map((s) => s.trim()).filter(Boolean);
  const values = valuesText
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n));
  return { labels, values };
}

export default function GraphBlock({ block }: Props) {
  const { updateBlock } = useEditorStore();
  const [editing, setEditing] = useState(false);
  const [labelsText, setLabelsText] = useState(block.data.labels.join(", "));
  const [valuesText, setValuesText] = useState(block.data.values.join(", "));
  const [localTitle, setLocalTitle] = useState(block.title ?? "");

  const chartData = block.data.labels.map((label, i) => ({
    name: label,
    value: block.data.values[i] ?? 0,
  }));

  const applyEdit = () => {
    const { labels, values } = parseLabelsValues(labelsText, valuesText);
    updateBlock(block.id, {
      title: localTitle,
      data: { labels, values },
    } as Partial<GraphBlockType>);
    setEditing(false);
  };

  const renderChart = () => {
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1" }}
              />
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
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="font-semibold text-gray-700 text-sm">
          {block.title || "Chart"}
        </span>
        <div className="flex items-center gap-2">
          {/* Chart type switcher */}
          {(["bar", "line", "pie"] as ChartType[]).map((t) => (
            <button
              key={t}
              onClick={() => updateBlock(block.id, { chartType: t } as Partial<GraphBlockType>)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                block.chartType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setEditing(!editing)}
            className="ml-1 px-2 py-1 text-xs rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            {editing ? "Cancel" : "Edit Data"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Chart title"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Labels (comma-separated)
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={labelsText}
              onChange={(e) => setLabelsText(e.target.value)}
              placeholder="Jan, Feb, Mar"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Values (comma-separated)
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={valuesText}
              onChange={(e) => setValuesText(e.target.value)}
              placeholder="30, 45, 28"
            />
          </div>
          <button
            onClick={applyEdit}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">{renderChart()}</div>
    </div>
  );
}
