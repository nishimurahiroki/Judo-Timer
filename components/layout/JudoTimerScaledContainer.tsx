// components/layout/JudoTimerScaledContainer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

type JudoTimerScaledContainerProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

// デスクトップベース解像度（元のサイズ）
const DESKTOP_BASE_W = 1600;
const DESKTOP_BASE_H = 900;

// ベース解像度とズームファクターをビューポート幅に応じて動的に決定
function getBaseResolutionAndZoom(
  viewportWidth: number,
  viewportHeight: number,
): { width: number; height: number; zoomFactor: number } {
  // デスクトップ（>= 1200px）: 1600 × 900（元のサイズ、ズームなし）
  if (viewportWidth >= 1200) {
    return {
      width: DESKTOP_BASE_W,
      height: DESKTOP_BASE_H,
      zoomFactor: 1,
    };
  }

  // モバイル横向き（< 1200px かつ横向き）: ズームファクターを適用
  const isMobileLandscape =
    viewportWidth < 1200 && viewportWidth > viewportHeight;

  if (isMobileLandscape) {
    const zoomFactor = 0.7; // モバイル横向きでより大きく表示
    return {
      width: DESKTOP_BASE_W,
      height: DESKTOP_BASE_H,
      zoomFactor,
    };
  }

  // その他（縦向きなど）: デスクトップサイズを使用
  return {
    width: DESKTOP_BASE_W,
    height: DESKTOP_BASE_H,
    zoomFactor: 1,
  };
}

export function JudoTimerScaledContainer({
  children,
  className,
  id,
}: JudoTimerScaledContainerProps) {
  const [scale, setScale] = useState(1);
  const [baseWidth, setBaseWidth] = useState(1600);
  const [baseHeight, setBaseHeight] = useState(900);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // スケール計算
  const calculateScale = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // ビューポート幅と高さに応じてベース解像度とズームファクターを決定
    const { width, height, zoomFactor } = getBaseResolutionAndZoom(
      viewportWidth,
      viewportHeight,
    );

    // ズームファクターを適用してベースサイズを縮小
    const scaledBaseW = width * zoomFactor;
    const scaledBaseH = height * zoomFactor;

    setBaseWidth(scaledBaseW);
    setBaseHeight(scaledBaseH);

    // スケール計算：ビューポートを超えないようにする
    const scaleX = viewportWidth / scaledBaseW;
    const scaleY = viewportHeight / scaledBaseH;
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale);

    // 縦向き検出
    setIsPortrait(viewportHeight > viewportWidth);
    // モバイル判定
    setIsMobile(viewportWidth > 0 && viewportWidth < 1024);
  };

  // リサイズ・フルスクリーン変更時のスケール更新
  useEffect(() => {
    calculateScale();

    const handleResize = () => {
      calculateScale();
    };

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      // フルスクリーン変更時もスケール再計算
      setTimeout(calculateScale, 100);
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    // 画面回転検出（モバイル）
    const handleOrientationChange = () => {
      setTimeout(calculateScale, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  // フルスクリーン切り替え
  const toggleFullscreen = async () => {
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        // フルスクリーン終了
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } else {
        // フルスクリーン開始
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  return (
    <div id={id} className={`fixed inset-0 flex items-center justify-center overflow-hidden z-50 ${className || "bg-black"}`}>
      {/* 16:9 ルートコンテナ */}
      <div
        ref={containerRef}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="relative"
      >
        {/* 既存のJudoTimer UI */}
        {children}
      </div>

      {/* 縦向きオーバーレイ - モバイルのみ表示 */}
      {isPortrait && isMobile && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          {/* Rotate icon - centered horizontally, above text */}
          <div className="mb-6">
            <svg
              width="96"
              height="96"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </div>

          {/* Message text - single sentence, English only */}
          <p className="text-white text-center px-8 text-lg font-medium">
            Rotate your device to landscape to start the timer.
          </p>
        </div>
      )}
    </div>
  );
}

