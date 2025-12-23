// lib/debugAudioAudit.ts
// グローバルに HTMLMediaElement.play と Audio コンストラクタをフックして
// どこから音が鳴っているかを開発時だけログ出力する。

export function installAudioAudit() {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined") return;

  const win = window as any;
  if (win.__audioAuditInstalled) return;
  win.__audioAuditInstalled = true;

  try {
    const HTMLMediaProto: any = (window as any).HTMLMediaElement?.prototype;
    if (HTMLMediaProto && typeof HTMLMediaProto.play === "function") {
      const originalPlay = HTMLMediaProto.play;

      HTMLMediaProto.play = function patchedPlay(this: HTMLMediaElement, ...args: any[]) {
        try {
          const src = this.currentSrc || (this as any).src || "";
          const info = {
            tag: this.tagName,
            src,
            volume: this.volume,
            muted: this.muted,
            t: typeof performance !== "undefined" ? performance.now() : undefined,
            ts: new Date().toISOString(),
          };
          const stack = new Error().stack
            ? new Error().stack!.split("\n").slice(0, 7).join("\n")
            : undefined;
          // eslint-disable-next-line no-console
          console.log("[AudioAudit] play()", info, stack);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[AudioAudit] play() logging failed:", e);
        }
        return originalPlay.apply(this, args);
      };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[AudioAudit] Failed to patch HTMLMediaElement.play:", e);
  }

  try {
    const OriginalAudio = (window as any).Audio as any;
    if (typeof OriginalAudio === "function") {
      const PatchedAudio = function (this: any, src?: string) {
        try {
          const stack = new Error().stack
            ? new Error().stack!.split("\n").slice(0, 7).join("\n")
            : undefined;
          // eslint-disable-next-line no-console
          console.log("[AudioAudit] new Audio()", { src }, stack);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn("[AudioAudit] new Audio() logging failed:", e);
        }
        // @ts-ignore - construct underlying Audio
        const audio = new OriginalAudio(src);
        return audio;
      } as any;

      PatchedAudio.prototype = OriginalAudio.prototype;
      (window as any).Audio = PatchedAudio;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[AudioAudit] Failed to patch Audio constructor:", e);
  }
}


