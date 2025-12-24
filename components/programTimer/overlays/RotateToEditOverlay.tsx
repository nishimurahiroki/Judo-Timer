// components/programTimer/overlays/RotateToEditOverlay.tsx
"use client";

import { useVisibleViewport } from "@/hooks/useVisibleViewport";

type RotateToEditOverlayProps = {
  onClose: () => void;
};

export function RotateToEditOverlay({ onClose }: RotateToEditOverlayProps) {
  const { vvW, vvH } = useVisibleViewport();
  const isMobile = vvW > 0 && vvW < 1024;

  // ProgramCreateOverlay と同じコンテナスタイルを計算
  // 通常パス（非FORCE_RATIOS）のスタイルを再利用
  const overlayStyle: React.CSSProperties = isMobile
    ? {
        width: "95%",
        maxWidth: "95vw",
        maxHeight: "90vh",
        height: "auto",
      }
    : {
        aspectRatio: "1370 / 1080",
        width: "min(80vw, calc(80vh * 1370 / 1080))",
        maxHeight: "80vh",
        overflowY: "auto",
      };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      style={{
        padding: "0.5rem",
        paddingTop: "calc(env(safe-area-inset-top) + 8px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
      }}
    >
      <div
        className="bg-[#E9E8E8] rounded-xl shadow-xl flex flex-col min-h-0 p-4 md:p-8 relative overflow-y-auto"
        style={overlayStyle}
      >
        {/* Close X button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0 z-10"
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

        {/* Centered content */}
        <div className="flex flex-col items-center justify-center text-center flex-1 min-h-0 py-8 md:py-12">
          {/* Rotate icon */}
          <div className="mb-6 md:mb-8">
            <svg
              width="96"
              height="96"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </div>

          {/* Message text */}
          <p className="text-base md:text-lg text-gray-800 font-medium px-4">
            編集は縦画面で行います。端末を縦にしてください
          </p>
        </div>
      </div>
    </div>
  );
}

