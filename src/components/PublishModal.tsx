"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";

interface Props {
  onClose: () => void;
}

export default function PublishModal({ onClose }: Props) {
  const { document, publishDocument } = useEditorStore();
  const [slug, setSlug] = useState(
    document.slug ||
      document.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      "my-site"
  );
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    if (!slug.trim()) {
      setError("Slug cannot be empty");
      return;
    }
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, document }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Publish failed");
        return;
      }
      publishDocument(slug);
      setPublished(true);
    } catch {
      setError("Network error, please try again");
    } finally {
      setPublishing(false);
    }
  };

  const siteUrl = `/site/${slug}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Publish Website</h2>
          <p className="text-sm text-gray-500 mt-1">
            Share your microsite with the world
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!published ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site URL
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-300 whitespace-nowrap">
                    /site/
                  </span>
                  <input
                    className="flex-1 px-3 py-2 text-sm outline-none"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                      )
                    }
                    placeholder="my-project"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Your site will be available at{" "}
                  <span className="font-mono text-indigo-600">{siteUrl}</span>
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-semibold text-gray-800">Published!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your site is live at:
              </p>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm font-mono text-indigo-600 hover:underline"
              >
                {siteUrl}
              </a>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {published ? "Close" : "Cancel"}
          </button>
          {!published && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
