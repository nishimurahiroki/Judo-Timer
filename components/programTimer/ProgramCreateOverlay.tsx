// components/programTimer/ProgramCreateOverlay.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EditorRow, Program, RoleGroup } from "@/lib/programTimer/types";
import { formatSecondsToTime } from "@/lib/programTimer/utils";
import { generateUUID } from "@/lib/programTimer/expand";

type ProgramCreateOverlayProps = {
  onClose: () => void;
  onSave: (program: Program, autoRun: boolean) => void;
  initialProgram?: Program | null;
  activeTimerId?: string | null; // 実行モードで現在アクティブなタイマーのID
  currentStepIndex?: number; // 実行モードで現在のステップインデックス
  currentStep?: { roundNumber?: number } | null; // 実行モードで現在のステップ情報
  onProgramUpdate?: (program: Program, isActiveTimerEdit: boolean, newDuration?: number) => void; // 実行モードでの更新コールバック
  /** ProgramRunScreen などから呼び出すときに、背景の黒い半透明レイヤーを消したい場合に使用 */
  transparentBackground?: boolean;
};

// 時間ピッカーコンポーネント（3行表示）
function TimePickerOverlay({
  isOpen,
  timerIndex,
  initialSeconds,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  timerIndex: number;
  initialSeconds: number;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
}) {
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedSeconds, setSelectedSeconds] = useState(0);
  const minutesScrollRef = useRef<HTMLDivElement>(null);
  const secondsScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const secondsScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bodyScrollLockRef = useRef<string | null>(null);
  const isScrollingProgrammaticallyRef = useRef<boolean>(false); // プログラムによるスクロール中フラグ
  const selectedFontSize = "text-7xl"; // 選択値のフォントサイズ（大きめ）
  const unselectedFontSize = "text-5xl"; // 非選択値のフォントサイズ（小さめ）
  const paddingItems = 100; // 循環スクロール用のパディング項目数
  
  // Mobile detection for correct scroll calculations
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 背景スクロールの無効化
  useEffect(() => {
    if (isOpen) {
      // 現在のbodyのoverflowスタイルを保存
      bodyScrollLockRef.current = document.body.style.overflow;
      // bodyのスクロールを無効化
      document.body.style.overflow = "hidden";
    } else {
      // bodyのスクロールを復元
      if (bodyScrollLockRef.current !== null) {
        document.body.style.overflow = bodyScrollLockRef.current;
      } else {
        document.body.style.overflow = "";
      }
    }

    // クリーンアップ：モーダルが閉じられたときに確実に復元
    return () => {
      if (bodyScrollLockRef.current !== null) {
        document.body.style.overflow = bodyScrollLockRef.current;
    } else {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // 初期値を設定し、スクロール位置を初期化
  useEffect(() => {
    if (isOpen) {
      const minutes = Math.floor(initialSeconds / 60);
      const seconds = initialSeconds % 60;
      setSelectedMinutes(minutes);
      setSelectedSeconds(seconds);
      
      // スクロール位置を設定（選択値が中央に来るように）
      // プログラムによるスクロール中フラグを設定
      isScrollingProgrammaticallyRef.current = true;
      // 動的な値を計算（モバイル/PC対応）
      const currentItemHeight = isMobile ? 66 : 100;
      const currentContainerHeight = isMobile ? 200 : 300;
      const currentCenterOffset = currentContainerHeight / 2 - currentItemHeight / 2;
      if (minutesScrollRef.current) {
        const scrollPosition = (paddingItems + minutes) * currentItemHeight - currentCenterOffset;
        minutesScrollRef.current.scrollTop = scrollPosition;
      }
      if (secondsScrollRef.current) {
        const scrollPosition = (paddingItems + seconds) * currentItemHeight - currentCenterOffset;
        secondsScrollRef.current.scrollTop = scrollPosition;
      }
      // フラグをリセット
      setTimeout(() => {
        isScrollingProgrammaticallyRef.current = false;
      }, 100);
    }
  }, [isOpen, initialSeconds, isMobile]);

  // 値をラップ（循環）
  const wrapMinutes = (value: number): number => {
    return ((value % 100) + 100) % 100;
  };

  const wrapSeconds = (value: number): number => {
    return ((value % 60) + 60) % 60;
  };

  // スクロール位置から選択値を計算（ネイティブスクロール用）
  const handleMinutesScroll = (e?: React.UIEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // プログラムによるスクロール中は値を更新しない
    if (isScrollingProgrammaticallyRef.current) {
      return;
    }
    if (minutesScrollRef.current) {
      const scrollTop = minutesScrollRef.current.scrollTop;
      // 動的な中央オフセットを使用（モバイル/PC対応）
      const currentItemHeight = isMobile ? 66 : 100;
      const currentContainerHeight = isMobile ? 200 : 300;
      const currentCenterOffset = currentContainerHeight / 2 - currentItemHeight / 2;
      const itemIndex = Math.round((scrollTop + currentCenterOffset) / currentItemHeight);
      const actualIndex = itemIndex - paddingItems;
      const wrappedValue = wrapMinutes(actualIndex);
      setSelectedMinutes(wrappedValue);
    }
  };

  const handleSecondsScroll = (e?: React.UIEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // プログラムによるスクロール中は値を更新しない
    if (isScrollingProgrammaticallyRef.current) {
      return;
    }
    if (secondsScrollRef.current) {
      const scrollTop = secondsScrollRef.current.scrollTop;
      // 動的な中央オフセットを使用（モバイル/PC対応）
      const currentItemHeight = isMobile ? 66 : 100;
      const currentContainerHeight = isMobile ? 200 : 300;
      const currentCenterOffset = currentContainerHeight / 2 - currentItemHeight / 2;
      const itemIndex = Math.round((scrollTop + currentCenterOffset) / currentItemHeight);
      const actualIndex = itemIndex - paddingItems;
      const wrappedValue = wrapSeconds(actualIndex);
      setSelectedSeconds(wrappedValue);
    }
  };

  // 選択値を中央にスナップ（初期化時のみ）
  const snapMinutesToCenter = (skipScrollEvent = false) => {
    if (minutesScrollRef.current) {
      const currentItemHeight = isMobile ? 66 : 100;
      const currentContainerHeight = isMobile ? 200 : 300;
      const targetScroll = (paddingItems + selectedMinutes) * currentItemHeight;
      // 動的な中央オフセットを使用（モバイル/PC対応）
      const currentCenterOffset = currentContainerHeight / 2 - currentItemHeight / 2;
      if (skipScrollEvent) {
        isScrollingProgrammaticallyRef.current = true;
      }
      minutesScrollRef.current.scrollTo({
        top: targetScroll - currentCenterOffset,
        behavior: skipScrollEvent ? "auto" : "smooth",
      });
      if (skipScrollEvent) {
        // スクロール完了後にフラグをリセット
        setTimeout(() => {
          isScrollingProgrammaticallyRef.current = false;
        }, 50);
      }
    }
  };

  const snapSecondsToCenter = (skipScrollEvent = false) => {
    if (secondsScrollRef.current) {
      const currentItemHeight = isMobile ? 66 : 100;
      const currentContainerHeight = isMobile ? 200 : 300;
      const targetScroll = (paddingItems + selectedSeconds) * currentItemHeight;
      // 動的な中央オフセットを使用（モバイル/PC対応）
      const currentCenterOffset = currentContainerHeight / 2 - currentItemHeight / 2;
      if (skipScrollEvent) {
        isScrollingProgrammaticallyRef.current = true;
      }
      secondsScrollRef.current.scrollTo({
        top: targetScroll - currentCenterOffset,
        behavior: skipScrollEvent ? "auto" : "smooth",
      });
      if (skipScrollEvent) {
        setTimeout(() => {
          isScrollingProgrammaticallyRef.current = false;
        }, 50);
      }
    }
  };

  // スクロール停止時の処理（スナップはCSSで自動処理）
  const handleMinutesScrollEnd = () => {
    if (minutesScrollTimeoutRef.current) {
      clearTimeout(minutesScrollTimeoutRef.current);
    }
    // スクロール停止後に値を再計算（中央スナップはCSSで自動処理）
    minutesScrollTimeoutRef.current = setTimeout(() => {
      handleMinutesScroll();
    }, 100);
  };

  const handleSecondsScrollEnd = () => {
    if (secondsScrollTimeoutRef.current) {
      clearTimeout(secondsScrollTimeoutRef.current);
    }
    secondsScrollTimeoutRef.current = setTimeout(() => {
      handleSecondsScroll();
    }, 100);
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (minutesScrollTimeoutRef.current) {
        clearTimeout(minutesScrollTimeoutRef.current);
      }
      if (secondsScrollTimeoutRef.current) {
        clearTimeout(secondsScrollTimeoutRef.current);
      }
    };
  }, []);

  // タッチイベントの伝播を停止（モバイル対応）
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  // 分と秒のオプションを生成（循環スクロール用）
  const generateMinutesItems = () => {
    const items = [];
    // パディング（上側）
    for (let i = 0; i < paddingItems; i++) {
      const value = wrapMinutes(99 - (paddingItems - 1 - i));
      items.push(value);
    }
    // メイン（0-99を複数回）
    for (let repeat = 0; repeat < 3; repeat++) {
      for (let i = 0; i < 100; i++) {
        items.push(i);
      }
    }
    // パディング（下側）
    for (let i = 0; i < paddingItems; i++) {
      const value = wrapMinutes(i);
      items.push(value);
    }
    return items;
  };

  const generateSecondsItems = () => {
    const items = [];
    // パディング（上側）
    for (let i = 0; i < paddingItems; i++) {
      const value = wrapSeconds(59 - (paddingItems - 1 - i));
      items.push(value);
    }
    // メイン（0-59を複数回）
    for (let repeat = 0; repeat < 3; repeat++) {
      for (let i = 0; i < 60; i++) {
        items.push(i);
      }
    }
    // パディング（下側）
    for (let i = 0; i < paddingItems; i++) {
      const value = wrapSeconds(i);
      items.push(value);
    }
    return items;
  };

  const minutesItems = generateMinutesItems();
  const secondsItems = generateSecondsItems();

  const handleConfirm = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    onConfirm(totalSeconds);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Mobile: smaller to fit viewport, PC: original size
  const cardWidth = isMobile 
    ? "min(90vw, 85vh * 631 / 681)" // Fit within viewport
    : "min(60vw, 60vh * 631 / 681)";
  const cardMaxWidth = isMobile 
    ? "90vw" // Fit within viewport
    : "500px";
  const cardMaxHeight = isMobile 
    ? "85vh" // Fit within viewport with safe margins
    : "90vh";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
      onClick={handleBackdropClick}
      onWheel={(e) => e.stopPropagation()} // 背景へのホイールイベント伝播を停止
      onTouchMove={handleTouchMove} // タッチイベントの伝播を停止
    >
      <div
        className="bg-white rounded-2xl shadow-2xl relative"
        style={{
          aspectRatio: "631 / 681",
          width: cardWidth,
          maxWidth: cardMaxWidth,
          maxHeight: cardMaxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()} // カード内のホイールイベント伝播を停止
        onTouchMove={handleTouchMove} // タッチイベントの伝播を停止
      >
        {/* 内側の影効果 */}
        <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />

        {/* コンテンツ */}
        <div className={`relative h-full flex flex-col overflow-hidden ${isMobile ? "p-4" : "p-6"}`}>
          {/* ヘッダー */}
          <div className={`flex items-center justify-between flex-shrink-0 ${isMobile ? "mb-3" : "mb-4"}`}>
            {/* 左上：タイマーインデックスバッジ */}
            <div className={`flex-shrink-0 rounded-full bg-[#4882FF] flex items-center justify-center text-white font-semibold ${isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-sm"}`}>
              {timerIndex + 1}
            </div>

            {/* 右上：閉じるXボタン */}
      <button
        type="button"
              onClick={onClose}
              className={`rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors ${isMobile ? "w-7 h-7" : "w-8 h-8"}`}
              aria-label="Close"
            >
              <svg
                className={`text-gray-700 ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
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

          {/* 時間ピッカー（3行表示 + セパレーター線） - 上に移動してスペースを作る */}
          <div className={`flex items-center justify-center flex-shrink-0 ${isMobile ? "gap-3 my-2" : "gap-4 my-4"}`}>
            {/* 分のピッカー */}
            <div className="flex flex-col items-center">
              <div
                ref={minutesScrollRef}
                className={`overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden relative ${isMobile ? "h-[200px]" : "h-[300px]"}`}
                onScroll={handleMinutesScroll}
                onTouchEnd={handleMinutesScrollEnd}
                onMouseUp={handleMinutesScrollEnd}
                onWheel={(e) => e.stopPropagation()}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {minutesItems.map((value, index) => {
                  const isSelected = value === selectedMinutes;
                  return (
                    <div
                      key={`min-${index}-${value}`}
                      className={`flex items-center justify-center snap-center relative ${isMobile ? "h-[66px]" : "h-[100px]"}`}
                    >
                      {/* 上側のセパレーター線（最初の行以外） */}
                      {index > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" />
                      )}
                      <span
                        className={`font-mono transition-all duration-200 ${
                          isSelected
                            ? `${isMobile ? "text-5xl" : selectedFontSize} text-black font-bold`
                            : `${isMobile ? "text-3xl" : unselectedFontSize} text-[#CDCDCD]`
                        }`}
                      >
                        {String(value).padStart(2, "0")}
                      </span>
                      {/* 下側のセパレーター線 */}
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
                    </div>
                  );
                })}
              </div>
              {/* minラベル（フォントサイズは選択値の半分） */}
              <span className={`text-gray-600 font-mono ${isMobile ? "mt-1 text-lg" : "mt-2 text-3xl"}`}>min</span>
            </div>

        {/* コロン */}
            <div className={`flex items-center ${isMobile ? "h-[200px]" : "h-[300px]"}`}>
              <span className={`font-mono text-black font-bold ${isMobile ? "text-5xl" : selectedFontSize}`}>:</span>
            </div>

            {/* 秒のピッカー */}
            <div className="flex flex-col items-center">
              <div
                ref={secondsScrollRef}
                className={`overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden relative ${isMobile ? "h-[200px]" : "h-[300px]"}`}
                onScroll={handleSecondsScroll}
                onTouchEnd={handleSecondsScrollEnd}
                onMouseUp={handleSecondsScrollEnd}
                onWheel={(e) => e.stopPropagation()}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {secondsItems.map((value, index) => {
                  const isSelected = value === selectedSeconds;
                  return (
                    <div
                      key={`sec-${index}-${value}`}
                      className={`flex items-center justify-center snap-center relative ${isMobile ? "h-[66px]" : "h-[100px]"}`}
                    >
                      {/* 上側のセパレーター線（最初の行以外） */}
                      {index > 0 && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" />
                      )}
                      <span
                        className={`font-mono transition-all duration-200 ${
                          isSelected
                            ? `${isMobile ? "text-5xl" : selectedFontSize} text-black font-bold`
                            : `${isMobile ? "text-3xl" : unselectedFontSize} text-[#CDCDCD]`
                        }`}
                      >
                        {String(value).padStart(2, "0")}
                      </span>
                      {/* 下側のセパレーター線 */}
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
                    </div>
                  );
                })}
              </div>
              {/* secラベル（フォントサイズは選択値の半分） */}
              <span className={`text-gray-600 font-mono ${isMobile ? "mt-1 text-lg" : "mt-2 text-3xl"}`}>sec</span>
            </div>
      </div>

          {/* Doneボタン - カード内に収める */}
          <div className={`mt-auto flex-shrink-0 ${isMobile ? "pt-3" : "pt-4"}`}>
      <button
        type="button"
              onClick={handleConfirm}
              className={`w-full rounded-lg bg-[#0044FF] text-white font-bold hover:bg-[#0033CC] transition-colors ${isMobile ? "py-3 text-base" : "py-4"}`}
      >
              Done
      </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// タイマー行コンポーネント（ソート可能）
function TimerRow({
  row,
  index,
  isSelected,
  onToggleSelect,
  onChange,
  onDelete,
  showTapHint,
  onOpenTimePicker,
  backgroundColor,
}: {
  row: EditorRow;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onChange: (row: EditorRow) => void;
  onDelete: () => void;
  showTapHint: boolean;
  onOpenTimePicker: () => void;
  backgroundColor?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  // 背景色を決定（チェック状態またはロールグループの色）
  const finalBackgroundColor = backgroundColor || "white";

  // Mobile: Measure left cluster width to constrain Round Name input
  const leftClusterRef = useRef<HTMLDivElement>(null);
  const [roundNameMaxWidth, setRoundNameMaxWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateRoundNameWidth = () => {
      if (leftClusterRef.current && window.innerWidth < 768) {
        const leftClusterWidth = leftClusterRef.current.offsetWidth;
        setRoundNameMaxWidth(leftClusterWidth);
      } else {
        setRoundNameMaxWidth(undefined);
      }
    };

    updateRoundNameWidth();
    window.addEventListener("resize", updateRoundNameWidth);
    return () => window.removeEventListener("resize", updateRoundNameWidth);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: finalBackgroundColor,
      }}
      className="w-full rounded-lg shadow-md border border-gray-200 p-3 md:p-4 transition-colors"
    >
      {/* Top row: Round Name input (mobile only) - left aligned */}
      <div className="flex items-center gap-2 mb-2 md:mb-0 md:hidden w-full">
        <input
          type="text"
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="Round Name"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-0.5 py-1 text-xs text-black placeholder-[#AAA9A9] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Main row: Controls and time display - single line on mobile */}
      <div className="flex flex-row items-center gap-1 md:gap-4 w-full">
        {/* Left cluster: Menu + Checkbox + Number */}
        <div 
          ref={leftClusterRef}
          className="flex items-center gap-1.5 md:gap-4 flex-shrink-0"
        >
        {/* (1) Drag handle icon (three horizontal lines) */}
          <button
          type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-800 touch-none flex-shrink-0"
          aria-label="Drag handle"
        >
          <svg
              className="w-5 h-5 md:w-6 md:h-6"
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
            className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
          />

        {/* (3) Timer index badge */}
          <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#4882FF] flex items-center justify-center text-white font-semibold text-xs md:text-sm">
            {index + 1}
          </div>
        </div>

        {/* Round Name input (desktop only) */}
        <input
          type="text"
          value={row.name}
          onChange={(e) => onChange({ ...row, name: e.target.value })}
          placeholder="Round Name"
          className="hidden md:block flex-1 max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder-[#AAA9A9] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Center: Minus + Time + Plus - mobile: larger buttons and time */}
        <div className="flex items-center gap-1 md:gap-4 flex-1 md:flex-shrink-0 md:ml-0 justify-center">
          {/* (5) "-" button - mobile: larger */}
        <button
          type="button"
          onClick={handleDecrement}
            className="text-gray-800 text-3xl md:text-2xl font-bold hover:text-gray-600 transition-colors flex-shrink-0 min-w-[44px] md:min-w-0"
            style={{ fontSize: "clamp(3rem, 4vw, 4rem)" }}
          aria-label="Decrement time"
        >
          −
        </button>

          {/* (6) Time display with "Tap" hint - mobile: as large as possible */}
          <div className="flex flex-col items-center flex-shrink-0">
          <button
            type="button"
            onClick={onOpenTimePicker}
              className="font-mono font-bold text-black hover:text-gray-700 transition-colors cursor-pointer leading-none"
              style={{ 
                fontSize: "clamp(2.5rem, 8vw, 4rem)",
              }}
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

          {/* (7) "+" button - mobile: larger */}
        <button
          type="button"
          onClick={handleIncrement}
            className="text-gray-800 text-3xl md:text-2xl font-bold hover:text-gray-600 transition-colors flex-shrink-0 min-w-[44px] md:min-w-0"
            style={{ fontSize: "clamp(3rem, 4vw, 4rem)" }}
          aria-label="Increment time"
        >
          +
        </button>
        </div>

        {/* Right: Delete button */}
        <button
          type="button"
          onClick={onDelete}
          className="flex-shrink-0 rounded-lg bg-[#FFC5C5] hover:bg-[#FFB0B0] transition-colors ml-1 md:ml-0 flex items-center justify-center aspect-square w-[35px] h-[35px] md:w-auto md:h-auto md:px-3 md:py-2"
          aria-label="Delete row"
        >
          <svg
            className="w-6 h-6 md:w-4 md:h-4 text-[#FF0000]"
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
  activeTimerId,
  currentStepIndex,
  currentStep,
  onProgramUpdate,
  transparentBackground = false,
}: ProgramCreateOverlayProps) {
  const [programTitle, setProgramTitle] = useState(
    initialProgram?.title ?? "",
  );
  
  // 実行モードかどうか（activeTimerIdが設定されている場合）
  const isRunMode = activeTimerId !== null && activeTimerId !== undefined;
  
  // 実行モードでは、programDraftとして管理
  const [programDraft, setProgramDraft] = useState<Program | null>(() => {
    if (initialProgram) {
      return {
        ...initialProgram,
        rows: initialProgram.rows.map(row => ({ ...row })),
      };
    }
    return null;
  });

  const [rows, setRows] = useState<EditorRow[]>(() => {
    if (initialProgram?.rows && initialProgram.rows.length > 0) {
      return initialProgram.rows.map(row => ({ ...row }));
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

  // 初期プログラムからroleGroupsを読み込む（後方互換性のため）
  useEffect(() => {
    // roleGroupsが既に読み込まれている場合はスキップ
    if (roleGroups.length > 0) return;
    
    // 後方互換性: 既存のrowsからroleGroupsを構築
    if (initialProgram?.rows) {
      const groupMap = new Map<string, RoleGroup>();
      const orderedGroupIds: string[] = [];
      
      initialProgram.rows.forEach((row) => {
        if (row.roleGroupId) {
          if (!groupMap.has(row.roleGroupId)) {
            // 新しいグループを作成
            const group: RoleGroup = {
              id: row.roleGroupId,
              color: "#00EEFF", // デフォルト色（後で更新される可能性がある）
              timerIds: [],
              setsMode: row.setsMode || "fixed",
              fixedSetsCount: row.fixedSetsCount,
              personAlternationEnabled: row.personAlternationEnabled || false,
            };
            groupMap.set(row.roleGroupId, group);
            orderedGroupIds.push(row.roleGroupId);
          }
          groupMap.get(row.roleGroupId)!.timerIds.push(row.id);
        }
      });
      
      // 順序を保持して配列に変換
      const builtGroups = orderedGroupIds.map((id) => groupMap.get(id)!);
      if (builtGroups.length > 0) {
        // 最初のグループの色を設定
        builtGroups[0].color = FIRST_GROUP_COLOR;
        // 2番目以降のグループの色を生成
        const usedColors = new Set<string>([FIRST_GROUP_COLOR]);
        for (let i = 1; i < builtGroups.length; i++) {
          builtGroups[i].color = generateRandomColor(usedColors);
          usedColors.add(builtGroups[i].color);
        }
        setRoleGroups(builtGroups);
      }
    }
  }, [initialProgram]);

  // 確定されたRoleGroupに属するタイマー（読み取り専用、自動管理）
  // これは表示用のみで、ユーザーが直接変更できない
  const committedSelectedRowIds = useMemo(() => {
    const committed = new Set<string>();
    rows.forEach((row) => {
      if (row.roleGroupId) {
        committed.add(row.id);
      }
    });
    return committed;
  }, [rows]);

  // 新しいRoleGroup作成のための一時的な選択（draft selection）
  // これはユーザーがチェックボックスで操作できる
  const [draftSelectedRowIds, setDraftSelectedRowIds] = useState<Set<string>>(new Set());

  // "Tap" hint表示制御（最初のクリックで非表示）
  const [showTapHint, setShowTapHint] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // 前回のrowsを保持（非アクティブなタイマーの編集を監視するため）
  const prevRowsRef = useRef<EditorRow[]>(rows);
  const isInitialMountRef = useRef(true);

  // 時間ピッカーの状態管理
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Role settingパネルの状態管理
  const [roleSettingOpen, setRoleSettingOpen] = useState(false);
  const [setsMode, setSetsMode] = useState<"infinite" | "fixed">("fixed");
  const [fixedSetsCount, setFixedSetsCount] = useState<number>(1);
  const [personAlternationEnabled, setPersonAlternationEnabled] = useState<boolean>(false);
  
  // Role設定パネルを開く前のdraft選択状態を保存（キャンセル時に復元するため）
  const [draftSelectedRowIdsBeforeRoleSetting, setDraftSelectedRowIdsBeforeRoleSetting] = useState<Set<string> | null>(null);

  // ロールグループの管理（明示的なデータ構造）
  const [roleGroups, setRoleGroups] = useState<RoleGroup[]>(() => {
    // 初期プログラムからroleGroupsを読み込む
    if (initialProgram?.roleGroups && initialProgram.roleGroups.length > 0) {
      return initialProgram.roleGroups;
    }
    // 後方互換性: 既存のrowsからroleGroupsを構築
    if (initialProgram?.rows) {
      const groupMap = new Map<string, RoleGroup>();
      const orderedGroupIds: string[] = [];
      
      initialProgram.rows.forEach((row) => {
        if (row.roleGroupId) {
          if (!groupMap.has(row.roleGroupId)) {
            // 新しいグループを作成
            const group: RoleGroup = {
              id: row.roleGroupId,
              color: "#00EEFF", // デフォルト色（後で更新される可能性がある）
              timerIds: [],
              setsMode: row.setsMode || "fixed",
              fixedSetsCount: row.fixedSetsCount,
              personAlternationEnabled: row.personAlternationEnabled || false,
            };
            groupMap.set(row.roleGroupId, group);
            orderedGroupIds.push(row.roleGroupId);
          }
          groupMap.get(row.roleGroupId)!.timerIds.push(row.id);
        }
      });
      
      // 順序を保持して配列に変換
      return orderedGroupIds.map((id) => groupMap.get(id)!);
    }
    return [];
  });

  // 後方互換性のため、roleGroupOrderも維持（色の取得に使用）
  const roleGroupOrder = roleGroups.map((g) => g.id);

  // 最初のグループの色（固定）
  const FIRST_GROUP_COLOR = "#00EEFF";

  // 利用可能な色のパレット（2番目以降のグループ用）
  const availableColors = [
    "#FF6B9D", // ピンク
    "#9B59B6", // パープル
    "#3498DB", // ブルー
    "#2ECC71", // グリーン
    "#F39C12", // オレンジ
    "#E74C3C", // レッド
    "#1ABC9C", // ターコイズ
    "#34495E", // ダークグレー
    "#16A085", // ダークターコイズ
    "#E67E22", // ダークオレンジ
    "#8E44AD", // ダークパープル
    "#27AE60", // ダークグリーン
  ];

  // HSL色を解析してhue, saturation, lightnessを取得
  const parseHSL = (color: string): { h: number; s: number; l: number } | null => {
    // #RRGGBB形式をHSLに変換
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16) / 255;
      const g = parseInt(color.slice(3, 5), 16) / 255;
      const b = parseInt(color.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) {
          h = ((g - b) / delta) % 6;
        } else if (max === g) {
          h = (b - r) / delta + 2;
        } else {
          h = (r - g) / delta + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
      }
      
      const l = (max + min) / 2;
      const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
      
      return { h, s: s * 100, l: l * 100 };
    }
    
    // hsl(h, s%, l%)形式を解析
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      return {
        h: parseInt(hslMatch[1], 10),
        s: parseInt(hslMatch[2], 10),
        l: parseInt(hslMatch[3], 10),
      };
    }
    
    return null;
  };

  // 2つの色が視覚的に区別できるかチェック
  const isColorDistinct = (color1: string, color2: string): boolean => {
    const hsl1 = parseHSL(color1);
    const hsl2 = parseHSL(color2);
    
    if (!hsl1 || !hsl2) {
      // 解析できない場合は色が異なれば区別可能とみなす
      return color1 !== color2;
    }
    
    // hueの差が30度未満の場合は類似色とみなす
    const hueDiff = Math.abs(hsl1.h - hsl2.h);
    const minHueDiff = Math.min(hueDiff, 360 - hueDiff);
    if (minHueDiff < 30) {
      return false;
    }
    
    // 明度の差が10%未満の場合は類似色とみなす
    if (Math.abs(hsl1.l - hsl2.l) < 10) {
      return false;
    }
    
    return true;
  };

  // ランダムな色を生成（視覚的に区別できる明るい/鮮やかな色）
  const generateRandomColor = (excludeColors: Set<string>): string => {
    // 既存の色と衝突しないランダムな色を生成
    let attempts = 0;
    while (attempts < 200) {
      // 鮮やかで明るい色を生成（彩度70-100%、明度50-70%）
      const hue = Math.floor(Math.random() * 360);
      const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
      const lightness = 50 + Math.floor(Math.random() * 20); // 50-70%
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // 既存の色と視覚的に区別できるかチェック
      let isDistinct = true;
      for (const excludeColor of excludeColors) {
        if (!isColorDistinct(color, excludeColor)) {
          isDistinct = false;
          break;
        }
      }
      
      if (isDistinct) {
        return color;
      }
      attempts++;
    }
    
    // フォールバック: 黄金角を使用して均等に分散
    const hue = (excludeColors.size * 137.508) % 360;
    return `hsl(${hue}, 80%, 60%)`;
  };

  // 次のRoleGroup用のプレビュー色（draft選択時に表示）
  const draftColorForNextGroup = useMemo(() => {
    const usedColors = new Set<string>();
    usedColors.add(FIRST_GROUP_COLOR);
    roleGroups.forEach((g) => {
      usedColors.add(g.color);
    });
    return generateRandomColor(usedColors);
  }, [roleGroups]);

  // ロールグループの色を取得（roleGroupsから直接取得）
  const getRoleGroupColor = (roleGroupId: string): string => {
    const group = roleGroups.find((g) => g.id === roleGroupId);
    if (group) {
      return group.color;
    }
    
    // フォールバック: グループが見つからない場合
    const groupIndex = roleGroupOrder.indexOf(roleGroupId);
    if (groupIndex === 0) {
      return FIRST_GROUP_COLOR;
    }
    
    // 使用中の色を取得
    const usedColors = new Set<string>();
    usedColors.add(FIRST_GROUP_COLOR);
    roleGroups.forEach((g) => {
      if (g.id !== roleGroupId) {
        usedColors.add(g.color);
      }
    });
    
    return generateRandomColor(usedColors);
  };

  // 行の背景色を取得（確定されたRoleGroupの色、draft選択のプレビュー色、または白）
  const getRowBackgroundColor = (row: EditorRow): string | undefined => {
    // 確定されたRoleGroupに属している場合: 確定されたグループ色を表示
    if (row.roleGroupId) {
      return getRoleGroupColor(row.roleGroupId);
    }
    // draft選択に含まれている場合: プレビュー色を表示
    if (draftSelectedRowIds.has(row.id)) {
      return draftColorForNextGroup;
    }
    // デフォルトの白背景
    return undefined;
  };

  // ドラッグ&ドロップ用のセンサー
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始（誤タップ防止）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
  
  // 実行モードで非アクティブなタイマーの編集を即座に適用（useEffectで監視）
  useEffect(() => {
    // 初回マウント時はスキップ
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevRowsRef.current = rows;
      return;
    }
    
    if (!isRunMode || !onProgramUpdate || !currentStep) {
      prevRowsRef.current = rows;
      return;
    }
    
    const activeRowIndex = currentStep.roundNumber ? currentStep.roundNumber - 1 : null;
    if (activeRowIndex === null) {
      prevRowsRef.current = rows;
      return;
    }
    
    // 前回のrowsと比較して、変更があった行を特定
    let hasNonActiveChanges = false;
    for (let i = 0; i < rows.length; i++) {
      // アクティブなタイマーはスキップ
      if (i === activeRowIndex) continue;
      
      const row = rows[i];
      const prevRow = prevRowsRef.current[i];
      
      // 新しい行が追加された場合
      if (!prevRow) {
        hasNonActiveChanges = true;
        break;
      }
      
      // 変更があったかチェック
      if (
        row.name !== prevRow.name ||
        row.durationSec !== prevRow.durationSec ||
        row.setCount !== prevRow.setCount ||
        row.hasSides !== prevRow.hasSides ||
        row.roleGroupId !== prevRow.roleGroupId
      ) {
        hasNonActiveChanges = true;
        break;
      }
    }
    
    // 行が削除された場合もチェック
    if (rows.length !== prevRowsRef.current.length) {
      hasNonActiveChanges = true;
    }
    
    if (hasNonActiveChanges) {
      // roleGroupsを保存（timerIdsを更新）
      const savedRoleGroups: RoleGroup[] = roleGroups.map((group) => {
        const currentTimerIds = rows
          .filter((row) => row.roleGroupId === group.id)
          .map((row) => row.id);
        return {
          ...group,
          timerIds: currentTimerIds,
        };
      }).filter((group) => group.timerIds.length > 0); // 空のグループは保存しない
      
      const program: Program = {
        id: initialProgram?.id ?? generateUUID(),
        title: programTitle || "Timer Name",
        rows,
        roleGroups: savedRoleGroups.length > 0 ? savedRoleGroups : undefined,
      };
      
      // 次のイベントループで実行（レンダリング中ではないことを保証）
      queueMicrotask(() => {
        onProgramUpdate(program, false);
      });
    }
    
    // 前回のrowsを更新
    prevRowsRef.current = rows;
  }, [rows, isRunMode, onProgramUpdate, currentStep, roleGroups, initialProgram?.id, programTitle]);

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
    // draft選択からも削除
    setDraftSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleSelect = (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    
    // 確定されたRoleGroupに属しているタイマーの場合
    if (row.roleGroupId) {
      // チェックを外すことでRoleGroupから外す
      const roleGroupId = row.roleGroupId;
      
      // 1) タイマーからRoleGroupの割り当てとRole設定を削除
      setRows((prevRows) => {
        return prevRows.map((r) => {
          if (r.id === id) {
            // roleGroupIdとRole設定を削除
            const { roleGroupId, setsMode, fixedSetsCount, personAlternationEnabled, ...rest } = r;
            return rest;
          }
          return r;
        });
      });
      
      // 2) roleGroupsからこのタイマーIDを削除
      setRoleGroups((prevGroups) => {
        return prevGroups
          .map((group) => {
            if (group.id === roleGroupId) {
              // このタイマーIDを削除
              const updatedTimerIds = group.timerIds.filter((timerId) => timerId !== id);
              return {
                ...group,
                timerIds: updatedTimerIds,
              };
            }
            return group;
          })
          .filter((group) => group.timerIds.length > 0); // 空のグループを削除
      });
      
      return;
    }
    
    // RoleGroupに属していないタイマーの場合: draft選択のみを操作
    setDraftSelectedRowIds((prev) => {
      const next = new Set(prev);
      const wasSelected = next.has(id);
      
      if (wasSelected) {
        // チェックを外す場合（draft選択から削除）
        next.delete(id);
      } else {
        // チェックを付ける場合（draft選択に追加）
        next.add(id);
      }
      
      return next;
    });
  };

  // 空のロールグループを削除し、ロールグループに属するタイマーを自動チェックするuseEffect
  useEffect(() => {
    // 現在のrowsから、実際に存在するロールグループIDとタイマーIDを収集
    const activeGroupIds = new Set<string>();
    const roleGroupRowIds = new Set<string>();
    const groupTimerMap = new Map<string, string[]>();
    
    rows.forEach((row) => {
      if (row.roleGroupId) {
        activeGroupIds.add(row.roleGroupId);
        roleGroupRowIds.add(row.id);
        
        if (!groupTimerMap.has(row.roleGroupId)) {
          groupTimerMap.set(row.roleGroupId, []);
        }
        groupTimerMap.get(row.roleGroupId)!.push(row.id);
      }
    });

    // roleGroupsから、空のグループまたは存在しないグループを削除
    setRoleGroups((prevGroups) => {
      return prevGroups
        .filter((group) => activeGroupIds.has(group.id))
        .map((group) => {
          // timerIdsを更新
          const currentTimerIds = groupTimerMap.get(group.id) || [];
          return {
            ...group,
            timerIds: currentTimerIds,
          };
        });
    });
    
    // 注意: 確定されたRoleGroupに属するタイマーはcommittedSelectedRowIdsで自動管理されるため、
    // ここでselectedRowIdsを更新する必要はない
  }, [rows]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRows((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleOpenTimePicker = (index: number) => {
    setEditingRowIndex(index);
    setTimePickerOpen(true);
  };

  const handleCloseTimePicker = () => {
    setTimePickerOpen(false);
    setEditingRowIndex(null);
  };

  const handleTimePickerConfirm = (seconds: number) => {
    if (editingRowIndex !== null) {
      const row = rows[editingRowIndex];
      if (row) {
        handleUpdateRow(row.id, { ...row, durationSec: seconds });
      }
    }
    handleCloseTimePicker();
  };

  const handleRoleSettingConfirm = () => {
    // draft選択から有効なタイマーIDを取得（既にRoleGroupに属していないもののみ）
    const validSelectedIds = Array.from(draftSelectedRowIds).filter((id) => {
      const row = rows.find((r) => r.id === id);
      return row && !row.roleGroupId;
    });
    
    if (validSelectedIds.length === 0) {
      // 有効なタイマーがない場合は何もしない
      setRoleSettingOpen(false);
      setDraftSelectedRowIdsBeforeRoleSetting(null);
      return;
    }
    
    // 新しいロールグループIDを生成
    const newRoleGroupId = generateUUID();
    
    // 使用中の色を取得
    const usedColors = new Set<string>();
    usedColors.add(FIRST_GROUP_COLOR); // 最初のグループの色は常に除外
    roleGroups.forEach((g) => {
      usedColors.add(g.color);
    });
    
    // 新しいグループの色を生成
    const groupIndex = roleGroups.length;
    let newColor: string;
    if (groupIndex === 0) {
      // 最初のグループは固定色
      newColor = FIRST_GROUP_COLOR;
    } else {
      // 2番目以降はランダムな色を生成
      newColor = generateRandomColor(usedColors);
    }
    
    // チェックされた行にRole設定を適用
    const updatedRows = rows.map((row) => {
      if (validSelectedIds.includes(row.id)) {
        return {
          ...row,
          roleGroupId: newRoleGroupId,
          setsMode,
          fixedSetsCount: setsMode === "fixed" ? fixedSetsCount : undefined,
          personAlternationEnabled,
        };
      }
      return row;
    });
    
    // 新しいロールグループを作成
    const newRoleGroup: RoleGroup = {
      id: newRoleGroupId,
      color: newColor,
      timerIds: validSelectedIds,
      setsMode,
      fixedSetsCount: setsMode === "fixed" ? fixedSetsCount : undefined,
      personAlternationEnabled,
    };
    
    // roleGroupsを更新（新しいグループを最後に追加）
    setRoleGroups((prev) => [...prev, newRoleGroup]);
    
    setRows(updatedRows);
    
    // draft選択をクリア（RoleGroupが確定されたため）
    setDraftSelectedRowIds(new Set());
    setDraftSelectedRowIdsBeforeRoleSetting(null);
    
    setRoleSettingOpen(false);
  };

  const handleRoleSettingClose = () => {
    // キャンセル時: draft選択を元に戻す
    if (draftSelectedRowIdsBeforeRoleSetting !== null) {
      setDraftSelectedRowIds(new Set(draftSelectedRowIdsBeforeRoleSetting));
      setDraftSelectedRowIdsBeforeRoleSetting(null);
    } else {
      // 保存された状態がない場合は、draft選択をクリア
      setDraftSelectedRowIds(new Set());
    }
    
    setRoleSettingOpen(false);
    // 設定は保存せずに閉じる
  };

  const handleSave = (autoRun: boolean) => {
    if (!rows.length) return;

    const programId = initialProgram?.id ?? generateUUID();
    const templateIdFromOrigin =
      initialProgram?.origin?.templateId ??
      (initialProgram?.origin?.type === "template"
        ? initialProgram.origin.templateId
        : undefined);
    const programOrigin: Program["origin"] = {
      type: "saved",
      ...(templateIdFromOrigin ? { templateId: templateIdFromOrigin } : {}),
    };

    // roleGroupsを保存（timerIdsを更新）
    const savedRoleGroups: RoleGroup[] = roleGroups.map((group) => {
      const currentTimerIds = rows
        .filter((row) => row.roleGroupId === group.id)
        .map((row) => row.id);
      return {
        ...group,
        timerIds: currentTimerIds,
      };
    }).filter((group) => group.timerIds.length > 0); // 空のグループは保存しない

    const program: Program = {
      id: programId,
      title: programTitle || "Timer Name",
      rows,
      roleGroups: savedRoleGroups.length > 0 ? savedRoleGroups : undefined,
      origin: programOrigin,
    };

    // 実行モードの場合
    if (isRunMode && onProgramUpdate && currentStep) {
      const activeRowIndex = currentStep.roundNumber ? currentStep.roundNumber - 1 : null;
      if (activeRowIndex !== null && rows[activeRowIndex]) {
        // アクティブなタイマーの編集：原子論的に適用
        const newDuration = rows[activeRowIndex].durationSec;
        onProgramUpdate(program, true, newDuration);
      } else {
        // アクティブなタイマーがない場合（通常は発生しない）
        onProgramUpdate(program, false);
      }
      onClose();
    } else {
      // 通常モード（ホーム画面からの編集）
    onSave(program, autoRun);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-30 flex items-center justify-center p-2 md:p-4 ${
        transparentBackground ? "bg-transparent" : "bg-black/40"
      }`}
    >
      {/* Inner container: PC = 1370:1080 aspect ratio, Mobile = 95% width, auto height */}
      <div
        ref={overlayRef}
        className="bg-[#E9E8E8] rounded-xl shadow-xl flex flex-col p-4 md:p-8 relative w-[95%] max-h-[90vh] md:w-auto md:h-auto overflow-y-auto"
        style={{
          ...(typeof window !== "undefined" && window.innerWidth >= 768
            ? {
                aspectRatio: "1370 / 1080",
                width: "min(80vw, calc(80vh * 1370 / 1080))",
                maxHeight: "80vh",
                overflowY: "auto",
              }
            : {
                width: "95%",
                maxWidth: "95vw",
                maxHeight: "90vh",
                height: "auto",
              }),
        }}
      >
        {/* Top section: Timer Name input, Grouping button, and Close X */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-2 md:gap-4 mb-4 md:mb-6 flex-shrink-0">
          {/* Top row: Timer Name input and Close X */}
          <div className="flex items-start justify-between gap-2 w-full md:w-auto md:flex-1">
            {/* Timer Name input */}
            <input
            type="text"
              value={programTitle}
              onChange={(e) => setProgramTitle(e.target.value)}
            placeholder="Timer Name"
            className="flex-1 min-w-0 rounded-lg border border-gray-400 bg-white px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-black placeholder-[#AAA9A9] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

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

          {/* Select Role button - visible on mobile */}
          <button
            type="button"
            onClick={() => {
              if (draftSelectedRowIds.size > 0) {
                // Role設定パネルを開く前に、現在のdraft選択状態を保存
                setDraftSelectedRowIdsBeforeRoleSetting(new Set(draftSelectedRowIds));
                setRoleSettingOpen(true);
              }
            }}
            disabled={draftSelectedRowIds.size === 0}
            className={`w-full md:w-auto px-4 py-2 rounded-lg text-white font-bold transition-colors flex-shrink-0 text-sm md:text-base ${
              draftSelectedRowIds.size > 0
                ? "bg-[#0044FF] hover:bg-[#0033CC] cursor-pointer"
                : "bg-[#00258B] cursor-not-allowed opacity-60"
            }`}
          >
            Select Role
                </button>
              </div>

        {/* Timer rows container with scroll */}
        <div className="flex-1 flex flex-col gap-4 mb-6 min-h-0 overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rows.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
              {rows.map((row, index) => {
                // ロールグループの背景色を計算
                const rowBackgroundColor = getRowBackgroundColor(row);
                // チェック状態: 確定されたRoleGroupに属しているか、draft選択に含まれているか
                const isSelected = committedSelectedRowIds.has(row.id) || draftSelectedRowIds.has(row.id);
                return (
                  <TimerRow
                    key={row.id}
                    row={row}
                    index={index}
                    isSelected={isSelected}
                    onToggleSelect={() => handleToggleSelect(row.id)}
                    onChange={(updated) => handleUpdateRow(row.id, updated)}
                    onDelete={() => handleDeleteRow(row.id)}
                    showTapHint={showTapHint && index === 0}
                    onOpenTimePicker={() => handleOpenTimePicker(index)}
                    backgroundColor={rowBackgroundColor}
                  />
                );
              })}
              </SortableContext>
            </DndContext>

          {/* "+ Timer" button (aligned left, directly under the last timer) */}
            <button
            type="button"
              onClick={handleAddRow}
            className="self-start px-4 py-2 text-[#0077FF] font-semibold hover:text-[#0055CC] transition-colors flex-shrink-0"
            >
            + Timer
            </button>
          </div>

        {/* Bottom buttons: Save and Save & Start (or Done in run mode) */}
        <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 flex-shrink-0">
          {isRunMode ? (
            // 実行モード: Doneボタンのみ
              <button
            type="button"
                onClick={() => handleSave(false)}
              className="w-full md:w-auto px-6 py-3 rounded-lg bg-[#00E467] text-white font-bold hover:bg-[#00CC55] transition-colors"
            >
              Done
            </button>
          ) : (
            // 通常モード: SaveとSave & Start
            <>
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-[#0044FF] text-white font-bold hover:bg-[#0033CC] transition-colors"
              >
            Save
              </button>
              <button
            type="button"
                onClick={() => handleSave(true)}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-[#00E467] text-white font-bold hover:bg-[#00CC55] transition-colors"
              >
            Save & Start
              </button>
            </>
          )}
            </div>
          </div>

      {/* 時間ピッカーオーバーレイ */}
      {timePickerOpen && editingRowIndex !== null && (
        <TimePickerOverlay
          isOpen={timePickerOpen}
          timerIndex={editingRowIndex}
          initialSeconds={rows[editingRowIndex]?.durationSec ?? 0}
          onClose={handleCloseTimePicker}
          onConfirm={handleTimePickerConfirm}
        />
      )}

      {/* Role settingパネル */}
      {roleSettingOpen && (
        <RoleSettingPanel
          isOpen={roleSettingOpen}
          setsMode={setsMode}
          fixedSetsCount={fixedSetsCount}
          personAlternationEnabled={personAlternationEnabled}
          onSetsModeChange={setSetsMode}
          onFixedSetsCountChange={setFixedSetsCount}
          onPersonAlternationChange={setPersonAlternationEnabled}
          onConfirm={handleRoleSettingConfirm}
          onClose={handleRoleSettingClose}
        />
      )}
        </div>
  );
}

// Role settingパネルコンポーネント
function RoleSettingPanel({
  isOpen,
  setsMode,
  fixedSetsCount,
  personAlternationEnabled,
  onSetsModeChange,
  onFixedSetsCountChange,
  onPersonAlternationChange,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  setsMode: "infinite" | "fixed";
  fixedSetsCount: number;
  personAlternationEnabled: boolean;
  onSetsModeChange: (mode: "infinite" | "fixed") => void;
  onFixedSetsCountChange: (count: number) => void;
  onPersonAlternationChange: (enabled: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  // Track if the value is user-entered (not default)
  const [isUserValue, setIsUserValue] = useState(false);
  // Track the display value (for clearing default on focus)
  const [displayValue, setDisplayValue] = useState<string>("");

  // Reset state when panel opens or setsMode changes
  useEffect(() => {
    if (isOpen) {
      setIsUserValue(false);
      if (fixedSetsCount === 1) {
        setDisplayValue("1");
      } else {
        setDisplayValue(String(fixedSetsCount));
        setIsUserValue(true);
      }
    }
  }, [isOpen, setsMode, fixedSetsCount]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFixedSetsCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Mark as user-entered value (user is typing)
    setIsUserValue(true);
    
    // If empty, allow it (will show placeholder)
    if (value === "") {
      setDisplayValue("");
      // Keep the value as 1 internally but show empty
      return;
    }
    
    // Only allow digits
    if (!/^\d+$/.test(value)) {
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 99) {
      // Limit to 2 digits
      if (value.length <= 2) {
        setDisplayValue(value);
        onFixedSetsCountChange(numValue);
      }
    }
  };

  const handleInputFocus = () => {
    // If showing default value 1, clear it on focus
    if (fixedSetsCount === 1 && !isUserValue && displayValue === "1") {
      setDisplayValue("");
    }
  };

  const handleInputBlur = () => {
    // If empty on blur, restore default value 1
    if (displayValue === "") {
      setDisplayValue("1");
      setIsUserValue(false);
      onFixedSetsCountChange(1);
    }
  };

  // Mobile detection for viewport fit
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  // Mobile: 20% larger (1.2x), PC: original size
  const modalWidth = isMobile 
    ? "min(72vw, 72vh * 631 / 681)" // 60vw * 1.2 = 72vw, 60vh * 1.2 = 72vh
    : "min(60vw, 60vh * 631 / 681)";
  const modalMaxWidth = isMobile 
    ? "600px" // 500px * 1.2 = 600px, but ensure it fits viewport
    : "500px";
  const modalMaxHeight = isMobile 
    ? "90vh" // Ensure it fits within viewport
    : "90vh";
  
  // Mobile: increase height by 20% (adjust aspectRatio)
  // Original: 631 / 681, Height increase by 20%: 681 * 1.2 = 817.2
  // New aspectRatio: 631 / 817.2 ≈ 631 / 817
  const modalAspectRatio = isMobile ? "631 / 817" : "631 / 681";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl relative"
        style={{
          aspectRatio: modalAspectRatio,
          width: modalWidth,
          maxWidth: modalMaxWidth,
          maxHeight: modalMaxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 内側の影効果 */}
        <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none" />

        {/* コンテンツ */}
        <div className="relative h-full flex flex-col p-6 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            {/* タイトル */}
            <h2 className="text-xl font-bold text-black flex-1 text-center">Role setting</h2>

            {/* 閉じるXボタン */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-700"
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

          {/* Sets行 */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-black">Sets</span>
              <div className="flex flex-col items-end gap-2">
                {/* Infinity toggle button */}
                <button
                  type="button"
                  onClick={() => {
                    onSetsModeChange(setsMode === "infinite" ? "fixed" : "infinite");
                  }}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    setsMode === "infinite"
                      ? "bg-[#0015FF] text-white"
                      : "bg-white text-black border border-gray-300"
                  }`}
                >
                  <span className="text-2xl font-bold">∞</span>
                </button>
                {/* Numeric input */}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={setsMode === "fixed" ? displayValue : ""}
                  onChange={handleFixedSetsCountChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  disabled={setsMode === "infinite"}
                  placeholder="1"
                  className={`w-20 px-3 py-2 rounded-lg border text-center text-base ${
                    setsMode === "infinite"
                      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      : "bg-white border-gray-300"
                  }`}
                  style={{
                    color: setsMode === "infinite" 
                      ? "#9CA3AF" 
                      : (fixedSetsCount === 1 && !isUserValue && displayValue === "1")
                        ? "#AAA9A9"
                        : "#000000"
                  }}
                />
              </div>
            </div>
          </div>

          {/* セパレーター線 */}
          <div className="h-px bg-gray-300 mb-6 flex-shrink-0" />

          {/* Person1,2行 */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-black">Person1,2</span>
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => onPersonAlternationChange(!personAlternationEnabled)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  personAlternationEnabled ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    personAlternationEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Doneボタン */}
          <div className="mt-auto pt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-4 rounded-lg bg-[#0044FF] text-white font-bold hover:bg-[#0033CC] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
