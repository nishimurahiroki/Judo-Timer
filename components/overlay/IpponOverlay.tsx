"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

export type IpponOverlayProps = {
  visible: boolean;
  winner: "white" | "blue" | null;
  onClose: () => void;
};

/**
 * 一本勝ち時のフルスクリーン（16:9 内全面）動画オーバーレイ。
 *
 * - `visible` が false のときは何も描画しない
 * - 表示時に自動再生
 * - 再生終了後は最後のフレームで静止（ユーザーがタップするまでそのまま）
 * - どこをタップ / クリックしても `onClose` を呼んで閉じる
 */
export function IpponOverlay({ visible, winner, onClose }: IpponOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 表示開始時に動画を冒頭から再生し直す
  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;

    const playFromStart = async () => {
      try {
        // いったん停止してから 0 秒に戻す
        video.pause();
        video.currentTime = 0;
        await video.play();
      } catch {
        // 自動再生がブロックされた場合などは無視（ユーザータップで再生されうる）
      }
    };

    // iOS Safari などへの配慮で、readyState を見てから再生する
    if (video.readyState >= 2) {
      void playFromStart();
    } else {
      const onCanPlay = () => {
        video.removeEventListener("canplay", onCanPlay);
        void playFromStart();
      };
      video.addEventListener("canplay", onCanPlay);
      return () => {
        video.removeEventListener("canplay", onCanPlay);
      };
    }
  }, [visible]);

  // 再生終了時：最後のフレームで静止させる
  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    // currentTime は最後のフレームの位置になっているので、そのまま pause だけ行う
    video.pause();
  };

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black"
      onClick={onClose}
      onTouchEnd={onClose}
    >
      {/* 16:9 レイアウトに完全フィットさせる */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={asset("/videos/ippon-win.mp4")}
        autoPlay
        playsInline
        muted={false}
        onEnded={handleEnded}
      />

      {/* winner は将来のための予約（例：テキストやオーバーレイ追加など） */}
      {winner && (
        <span className="sr-only">
          {winner === "white" ? "White won by Ippon" : "Blue won by Ippon"}
        </span>
      )}
    </div>
  );
}











