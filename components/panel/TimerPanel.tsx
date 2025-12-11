"use client";

import { useState } from "react";

type OsaeSide = "white" | "blue";

type TimerPanelProps = {
  // メインタイマー
  mainSeconds: number;
  onAdjustMainSeconds: (delta: number) => void;
  onResetMain: () => void;

  // 抑え込み
  osaekomiSelectedSide?: OsaeSide;
  whiteOsaeSeconds: number;
  blueOsaeSeconds: number;
  osaekomiMaxSeconds: number;
  onAdjustOsaekomiSeconds: (side: OsaeSide, delta: number) => void;
  onChangeOsaekomiMaxSeconds: (next: number) => void;
  onResetOsaekomi: () => void;

  // GS モード
  isGoldenScore: boolean;
  onToggleGoldenScore: () => void;

  // All reset
  onAllReset: () => void;

  // DONE
  onDone: () => void;
};

export function TimerPanel({
  mainSeconds,
  onAdjustMainSeconds,
  onResetMain,
  osaekomiSelectedSide = "white",
  whiteOsaeSeconds,
  blueOsaeSeconds,
  osaekomiMaxSeconds,
  onAdjustOsaekomiSeconds,
  onChangeOsaekomiMaxSeconds,
  onResetOsaekomi,
  isGoldenScore,
  onToggleGoldenScore,
  onAllReset,
  onDone,
}: TimerPanelProps) {
  const [selectedSide, setSelectedSide] =
    useState<OsaeSide>(osaekomiSelectedSide);

  const displayMainMinutes = Math.floor(mainSeconds / 60)
    .toString()
    .padStart(2, "0");
  const displayMainSeconds = (mainSeconds % 60).toString().padStart(2, "0");

  const currentOsaeSeconds =
    selectedSide === "white" ? whiteOsaeSeconds : blueOsaeSeconds;

  return (
    <div className="w-full bg-neutral-900/80 text-white rounded-xl px-6 py-4">
      {/* Row1: 4 カラム（抑え込みは col-span-2） */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* 1) メインタイマー手動調整 */}
        <div className="flex flex-col items-center justify-between bg-neutral-800 rounded-lg px-3 py-3">
          <div className="text-xs opacity-80 mb-1">
            メインタイマー
          </div>
          <div className="font-mono text-2xl mb-2">
            {displayMainMinutes}:{displayMainSeconds}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onAdjustMainSeconds(-1)}
            >
              -1s
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onAdjustMainSeconds(1)}
            >
              +1s
            </button>
          </div>
        </div>

        {/* 2) 抑え込み手動調整（col-span-2） */}
        <div className="col-span-2 flex flex-col items-center justify-between bg-neutral-800 rounded-lg px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setSelectedSide("white")}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedSide === "white"
                  ? "bg-red-600 text-white border-red-300"
                  : "bg-neutral-700 border-neutral-500"
              }`}
            >
              P1
            </button>
            <button
              type="button"
              onClick={() => setSelectedSide("blue")}
              className={`px-3 py-1 rounded-full text-sm border ${
                selectedSide === "blue"
                  ? "bg-blue-600 text-white border-blue-300"
                  : "bg-neutral-700 border-neutral-500"
              }`}
            >
              P2
            </button>
          </div>
          <div className="text-xs opacity-80 mb-1">
            抑え込み秒（選択側）
          </div>
          <div className="font-mono text-3xl mb-2">
            {currentOsaeSeconds.toString().padStart(2, "0")}s
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onAdjustOsaekomiSeconds(selectedSide, -1)}
            >
              -1
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onAdjustOsaekomiSeconds(selectedSide, 1)}
            >
              +1
            </button>
          </div>
        </div>

        {/* 3) 一本秒設定（maxSeconds） */}
        <div className="flex flex-col items-center justify-between bg-neutral-800 rounded-lg px-3 py-3">
          <div className="text-xs opacity-80 mb-1">
            抑え込み一本秒
          </div>
          <div className="font-mono text-3xl mb-2">
            {osaekomiMaxSeconds}s
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onChangeOsaekomiMaxSeconds(osaekomiMaxSeconds - 1)}
            >
              -1
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-neutral-700 text-base"
              onClick={() => onChangeOsaekomiMaxSeconds(osaekomiMaxSeconds + 1)}
            >
              +1
            </button>
          </div>
        </div>
      </div>

      {/* Row2: 4 ボタン */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* 1) メインタイマー Reset */}
        <button
          type="button"
          className="flex flex-col items-center justify-center bg-neutral-800 rounded-lg px-3 py-3 text-sm"
          onClick={onResetMain}
        >
          <span className="text-lg mb-1">↻</span>
          <span>メイン Reset</span>
        </button>

        {/* 2) 抑え込み Reset */}
        <button
          type="button"
          className="flex flex-col items-center justify-center bg-neutral-800 rounded-lg px-3 py-3 text-sm"
          onClick={onResetOsaekomi}
        >
          <span className="text-lg mb-1">⏲</span>
          <span>抑え込み Reset</span>
        </button>

        {/* 3) GS トグル */}
        <button
          type="button"
          className={`flex flex-col items-center justify-center rounded-lg px-3 py-3 text-sm ${
            isGoldenScore
              ? "bg-yellow-500 text-black"
              : "bg-neutral-800 text-white"
          }`}
          onClick={onToggleGoldenScore}
        >
          <span className="text-base mb-1 font-semibold">GS</span>
          <span>{isGoldenScore ? "GS ON" : "GS OFF"}</span>
        </button>

        {/* 4) All reset */}
        <button
          type="button"
          className="flex flex-col items-center justify-center bg-red-700 rounded-lg px-3 py-3 text-sm"
          onClick={onAllReset}
        >
          <span className="text-lg mb-1">✕</span>
          <span>All Reset</span>
        </button>
      </div>

      {/* Row3: DONE ボタン */}
      <div className="flex justify-center">
        <button
          type="button"
          className="w-1/2 py-3 rounded-full bg-neutral-700 hover:bg-neutral-600 text-base font-semibold"
          onClick={onDone}
        >
          DONE
        </button>
      </div>
    </div>
  );
}




