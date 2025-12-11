// components/programTimer/ProgramCreateOverlay.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { EditorRow, Program } from "@/lib/programTimer/types";
import { formatSecondsToTime } from "@/lib/programTimer/utils";
import { generateUUID } from "@/lib/programTimer/expand";

type ProgramCreateOverlayProps = {
  onClose: () => void;
  onSave: (program: Program, autoRun: boolean) => void;
  initialProgram?: Program | null;
};

// タイマー行コンポーネント
function TimerRow({
  row,
  index,
  isSelected,
  onToggleSelect,
  onChange,
  onDelete,
  showTapHint,
}: {
  row: EditorRow;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChange: (row: EditorRow) => void;
  onDelete: () => void;
  showTapHint: boolean;
}) {
  const handleTimeChange = (seconds: number) => {
    onChange({ ...row, durationSec: seconds });
  };

  const handleDecrement = () => {
    const newSec = Math.max(0, row.durationSec - 1);
    handleTimeChange(newSec);
  };

  const handleIncrement = () => {
    handleTimeChange(row.durationSec + 1);
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center gap-4 w-full">
        {/* (1) Drag handle icon (three horizontal lines) */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-800"
          aria-label="Drag handle"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* (2) Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />

        {/* (3) Timer index badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4882FF] flex items-center justify-center text-white font-semibold text-sm">
          {index + 1}
        </div>

        {/* (4) Round Name input */}
        <input
          type="text"
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="Round Name"
          className="flex-1 max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-[#AAA9A9] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* (5) "-" button */}
        <button
          type="button"
          onClick={handleDecrement}
          className="text-gray-800 text-2xl font-bold hover:text-gray-600 transition-colors"
          aria-label="Decrement time"
        >
          −
        </button>

        {/* (6) Time display with "Tap" hint */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              // Placeholder for time picker - will be implemented later
            }}
            className="font-mono text-4xl font-bold text-black hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Time display"
          >
            {formatSecondsToTime(row.durationSec)}
          </button>
          {showTapHint && (
            <span className="mt-1 px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
              Tap
            </span>
          )}
        </div>

        {/* (7) "+" button */}
        <button
          type="button"
          onClick={handleIncrement}
          className="text-gray-800 text-2xl font-bold hover:text-gray-600 transition-colors"
          aria-label="Increment time"
        >
          +
        </button>

        {/* (8) Delete button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded-lg bg-[#FFC5C5] px-3 py-2 hover:bg-[#FFB0B0] transition-colors"
          aria-label="Delete row"
        >
          <svg
            className="w-5 h-5 text-[#FF0000]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ProgramCreateOverlay({
  onClose,
  onSave,
  initialProgram,
}: ProgramCreateOverlayProps) {
  const [programTitle, setProgramTitle] = useState(
    initialProgram?.title ?? "",
  );

  const [rows, setRows] = useState<EditorRow[]>(() => {
    if (initialProgram?.rows && initialProgram.rows.length > 0) {
      return initialProgram.rows;
    }
    // 初期状態では1つの行を作成
    return [
      {
        id: `row-${Date.now()}`,
        name: "",
        durationSec: 0,
        setCount: 1,
        hasSides: false,
      },
    ];
  });

  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(
    new Set(),
  );

  // "Tap" hint表示制御（最初のクリックで非表示）
  const [showTapHint, setShowTapHint] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTapHint) return;

    const handleClick = (e: MouseEvent) => {
      // オーバーレイ内の任意の要素がクリックされたら"Tap"ラベルを非表示
      setShowTapHint(false);
    };

    const overlay = overlayRef.current;
    if (overlay) {
      overlay.addEventListener("click", handleClick, { once: true });
      return () => {
        overlay.removeEventListener("click", handleClick);
      };
    }
  }, [showTapHint]);

  const handleAddRow = () => {
    const newRow: EditorRow = {
      id: `row-${Date.now()}-${rows.length}`,
      name: "",
      durationSec: 0,
      setCount: 1,
      hasSides: false,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleUpdateRow = (id: string, updated: EditorRow) => {
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      // すべて削除された場合は、新しい空の行を追加
      if (filtered.length === 0) {
        return [
          {
            id: `row-${Date.now()}`,
            name: "",
            durationSec: 0,
            setCount: 1,
            hasSides: false,
          },
        ];
      }
      return filtered;
    });
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = (autoRun: boolean) => {
    if (!rows.length) return;

    const programId = initialProgram?.id ?? generateUUID();

    const program: Program = {
      id: programId,
      title: programTitle || "Timer Name",
      rows,
    };

    onSave(program, autoRun);
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/40 flex items-center justify-center p-2 md:p-4">
      {/* Inner container: PC = 1370:1080 aspect ratio, Mobile = full screen */}
      <div
        ref={overlayRef}
        className="bg-[#E9E8E8] rounded-xl shadow-xl flex flex-col p-4 md:p-8 relative w-full h-full md:w-auto md:h-auto"
        style={{
          ...(typeof window !== "undefined" && window.innerWidth >= 768
            ? {
                aspectRatio: "1370 / 1080",
                width: "min(80vw, calc(80vh * 1370 / 1080))",
                maxHeight: "80vh",
              }
            : {
                maxWidth: "100%",
                maxHeight: "100%",
              }),
        }}
      >
        {/* Top section: Timer Name input, Grouping button, and Close X */}
        <div className="flex items-start justify-between gap-2 md:gap-4 mb-4 md:mb-6 flex-shrink-0 flex-wrap">
          {/* Timer Name input (left side) */}
          <input
            type="text"
            value={programTitle}
            onChange={(e) => setProgramTitle(e.target.value)}
            placeholder="Timer Name"
            className="flex-1 min-w-0 rounded-lg border border-gray-400 bg-white px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-black placeholder-[#AAA9A9] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Grouping button - hidden on mobile */}
          <button
            type="button"
            className="hidden md:block px-4 py-2 rounded-lg bg-[#0044FF] text-white font-bold hover:bg-[#0033CC] transition-colors flex-shrink-0 text-sm md:text-base"
          >
            Grouping
          </button>

          {/* Close X icon */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Timer rows container with scroll */}
        <div className="flex-1 flex flex-col gap-4 mb-6 min-h-0 overflow-y-auto">
          {rows.map((row, index) => (
            <TimerRow
              key={row.id}
              row={row}
              index={index}
              isSelected={selectedRowIds.has(row.id)}
              onToggleSelect={() => handleToggleSelect(row.id)}
              onChange={(updated) => handleUpdateRow(row.id, updated)}
              onDelete={() => handleDeleteRow(row.id)}
              showTapHint={showTapHint && index === 0}
            />
          ))}

          {/* "+ Timer" button (aligned left, directly under the last timer) */}
          <button
            type="button"
            onClick={handleAddRow}
            className="self-start px-4 py-2 text-[#0077FF] font-semibold hover:text-[#0055CC] transition-colors flex-shrink-0"
          >
            + Timer
          </button>
        </div>

        {/* Bottom buttons: Save and Save & Start */}
        <div className="flex justify-end gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-6 py-3 rounded-lg bg-[#0044FF] text-white font-bold hover:bg-[#0033CC] transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-6 py-3 rounded-lg bg-[#00E467] text-white font-bold hover:bg-[#00CC55] transition-colors"
          >
            Save & Start
          </button>
        </div>
      </div>
    </div>
  );
}
