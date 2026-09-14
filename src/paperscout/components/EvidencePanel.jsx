import {
  BookOpenCheck,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";

import { saveEvidenceItems } from "../api/evidence.js";
import { useToast } from "./Toast.jsx";
import { Pill } from "./ui.jsx";

export function EvidencePanel({ claim, items = [] }) {
  const { showToast } = useToast();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
    setSavedIds(new Set());
    setExpandedId("");
  }, [items]);

  function toggleSelected(itemId) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  async function handleSave() {
    const selectedItems = items.filter(
      (item) => item.supported && selectedIds.has(item.id),
    );

    if (selectedItems.length === 0 || saving) return;

    setSaving(true);
    try {
      await saveEvidenceItems({
        claim,
        items: selectedItems.map((item) => ({
          paperId: item.paperId,
          chunkId: item.chunkId,
        })),
      });

      setSavedIds((current) => {
        const next = new Set(current);
        selectedItems.forEach((item) => next.add(item.id));
        return next;
      });
      setSelectedIds(new Set());
      showToast(`已保存 ${selectedItems.length} 条证据`);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) return null;

  const selectableCount = items.filter(
    (item) => item.supported && !savedIds.has(item.id),
  ).length;

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <BookOpenCheck size={15} className="text-teal-700" aria-hidden="true" />
        <p className="text-xs font-black text-slate-800">证据候选</p>
        <Pill tone="teal">{items.length} 篇论文</Pill>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const expanded = expandedId === item.id;
          const saved = savedIds.has(item.id);

          return (
            <div
              key={item.id}
              className="rounded-md border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <label className="mt-0.5 inline-flex items-center">
                  <span className="sr-only">选择证据</span>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    disabled={!item.supported || saved}
                    onChange={() => toggleSelected(item.id)}
                    className="size-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </label>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">
                      {item.paperTitle}
                    </p>
                    <Pill>{item.paperYear}</Pill>
                    <Pill tone={item.supported ? "teal" : "amber"}>
                      {saved
                        ? "已保存"
                        : item.supported
                          ? "找到支持"
                          : "未找到支持"}
                    </Pill>
                  </div>

                  {item.supported ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? "" : item.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
                      aria-expanded={expanded}
                    >
                      <FileText size={13} aria-hidden="true" />
                      {expanded ? "收起片段" : "展开片段"}
                      {expanded ? (
                        <ChevronUp size={13} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={13} aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      当前论文的摘要片段中没有找到直接支持该问题的内容。
                    </p>
                  )}

                  {expanded && item.supported ? (
                    <div className="mt-3 rounded-md bg-slate-50 p-3">
                      <p className="text-sm leading-6 text-slate-700">
                        {item.quote}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        判断理由：{item.reason}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={selectedIds.size === 0 || saving}
        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-teal-700 px-3 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "保存中..." : `保存为证据（${selectedIds.size}/${selectableCount}）`}
      </button>
    </div>
  );
}
