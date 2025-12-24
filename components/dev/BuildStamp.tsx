"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function BuildStampContent() {
  const searchParams = useSearchParams();
  const debugBuild = searchParams?.get("debugBuild") === "1";
  const [swController, setSwController] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.serviceWorker) {
      const checkController = () => {
        setSwController(!!navigator.serviceWorker?.controller);
      };
      checkController();
      navigator.serviceWorker.addEventListener("controllerchange", checkController);
      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", checkController);
      };
    } else {
      setSwController(false);
    }
  }, []);

  const shouldShow =
    process.env.NODE_ENV !== "production" || debugBuild;

  if (!shouldShow) return null;

  // NOTE:
  // Hydrationエラーを避けるため、ここでは Date.now() や new Date() で
  // 毎回変わる値を直接使わない。
  // すべてビルド時に固定される env 経由の値のみを描画に使う。
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID || "dev-local";
  const gitSha = process.env.NEXT_PUBLIC_GIT_SHA || "unknown";
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || "";

  return (
    <div
      className="fixed bottom-0 left-0 z-[99999] pointer-events-none bg-black/70 text-white text-[8px] font-mono px-1 py-0.5 rounded-tr"
      style={{ fontSize: "8px", lineHeight: "1.2" }}
    >
      <div>Build: {buildId}</div>
      <div>SHA: {gitSha.substring(0, 7)}</div>
      <div>Time: {buildTime || "n/a"}</div>
      {debugBuild && (
        <>
          <div>SW: {swController === null ? "?" : swController ? "ON" : "OFF"}</div>
          <div>Env: {process.env.NODE_ENV}</div>
        </>
      )}
    </div>
  );
}

export function BuildStamp() {
  return (
    <Suspense fallback={null}>
      <BuildStampContent />
    </Suspense>
  );
}

