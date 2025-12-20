// components/layout/JudoTimerScreen.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJudoTimer } from "@/hooks/useJudoTimer";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { useOsaekomiTimers } from "@/hooks/useOsaekomiTimers";
import { SideScore } from "@/components/score/SideScore";
import { OsaekomiDisplay } from "@/components/osaekomi/OsaekomiDisplay";
import { TimerPanel } from "@/components/panel/TimerPanel";
import { ScorePanel } from "@/components/panel/ScorePanel";
import { SettingPanel } from "@/components/panel/SettingPanel";
import { useSoundManager } from "@/hooks/useSoundManager";
import { IpponOverlay } from "@/components/overlay/IpponOverlay";
import {
  type AppSettings,
  type LayoutColorKey,
  DEFAULT_SETTINGS,
  DEFAULT_KOSEN_SETTINGS,
} from "@/lib/settings";

type PanelKey = "timer" | "score" | "setting" | "none";

// page.tsx / ScoreBoard など共通の型
type ScoreState = {
  ippon: number;
  wazaari: number;
  yuko: number;
  shido: number;
};

type Side = "white" | "blue";

type AllScores = {
  white: ScoreState;
  blue: ScoreState;
};

type ThemeKey = "dark" | "blue" | "red";

const themeClassMap: Record<ThemeKey, string> = {
  dark: "bg-black text-white",
  blue: "bg-sky-900 text-white",
  red: "bg-[rgb(255,0,0)] text-white",
};

const layoutBackgroundClassMap: Record<LayoutColorKey, string> = {
  blue: "bg-[rgb(0,0,255)]",
  red: "bg-[rgb(255,0,0)]",
  green: "bg-[rgb(0,255,0)]",
  yellow: "bg-[rgb(255,255,0)]",
  orange: "bg-[rgb(255,165,0)]",
  cyan: "bg-[rgb(0,255,255)]",
  black: "bg-black",
  white: "bg-white text-black",
};

const layoutTextClassMap: Record<LayoutColorKey, string> = {
  blue: "text-[rgb(0,0,255)]",
  red: "text-[rgb(255,0,0)]",
  green: "text-[rgb(0,255,0)]",
  yellow: "text-[rgb(255,255,0)]",
  orange: "text-[rgb(255,165,0)]",
  cyan: "text-[rgb(0,255,255)]",
  black: "text-black",
  white: "text-white",
};

const layoutStrokeColorMap: Record<LayoutColorKey, string> = {
  blue: "2px [rgb(0,0,255)]",
  red: "2px [rgb(255,0,0)]",
  green: "2px rgb(0,255,0)",
  yellow: "2px rgb(255,255,0)",
  orange: "2px rgb(255,165,0)",
  cyan: "2px rgb(0,255,255)",
  black: "2px rgb(0 0 0)",
  white: "2px rgb(255 255 255)",
};

const JUDO_MAX_SHIDO = 3;

// 中央のパネル切り替え用ナビ（タイマー / スコア / 設定）
type PanelNavProps = {
  active: PanelKey;
  onChange: (panel: PanelKey) => void;
};

function PanelNav({ active, onChange }: PanelNavProps) {
  const baseCircle =
    "flex items-center justify-center rounded-full border-2 border-orange-200 bg-orange-200 text-black transition-colors focus:outline-none";

  // ★ 3つとも w-16 h-16 で統一
  return (
    <div className="flex flex-col items-center justify-between h-full">
      {/* 上：タイマーボタン */}
      <button
        type="button"
        onClick={() => onChange(active === "timer" ? "none" : "timer")}
        className={`${baseCircle} w-11 h-11 text-xl ${
          active === "timer" ? "ring-2 ring-yellow-300" : ""
        }`}
      >
        ⏱
      </button>

      {/* 中央：score ボタン */}
      <button
        type="button"
        onClick={() => onChange(active === "score" ? "none" : "score")}
        className={`${baseCircle} w-11 h-11 text-sm font-semibold ${
          active === "score" ? "ring-2 ring-yellow-300" : ""
        }`}
      >
        score
      </button>

      {/* 下：設定ボタン */}
      <button
        type="button"
        onClick={() => onChange(active === "setting" ? "none" : "setting")}
        className={`${baseCircle} w-11 h-11 text-xl ${
          active === "setting" ? "ring-2 ring-yellow-300" : ""
        }`}
      >
        ⚙
      </button>
    </div>
  );
}

type JudoTimerScreenProps = {
  initialSettings?: AppSettings;
};

export function JudoTimerScreen({
  initialSettings = DEFAULT_SETTINGS,
}: JudoTimerScreenProps) {
  const router = useRouter();
  // 表示するパネル（タイマー / スコア / 設定）
  // 初期値は "timer" に固定（SSR/CSR のハイドレーションエラーを防ぐため）
  const [activePanel, setActivePanel] = useState<PanelKey>("timer");
  
  // フルスクリーン状態
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 設定状態（ルールごとの初期値を注入）
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [draftSettings, setDraftSettings] =
    useState<AppSettings>(initialSettings);

  // サウンドマネージャー
  const { play, unlockAudio } = useSoundManager(settings.sound.enabled);
  
  // iPhone検出（オーディオアンロック用）
  const isIPhoneRef = useRef<boolean | null>(null);
  const audioUnlockedOnceRef = useRef(false);
  
  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      isIPhoneRef.current = /iPhone/.test(navigator.userAgent);
      
      // iPhoneの場合、最初のtouchendイベントでオーディオをアンロック（フォールバック）
      if (isIPhoneRef.current && !audioUnlockedOnceRef.current) {
        const unlockOnce = () => {
          if (!audioUnlockedOnceRef.current) {
            unlockAudio();
            audioUnlockedOnceRef.current = true;
          }
        };
        
        window.addEventListener("touchend", unlockOnce, { once: true });
        
        return () => {
          window.removeEventListener("touchend", unlockOnce);
        };
      }
    }
  }, [unlockAudio]);

  // メイン試合タイマー（設定の mainTimerSeconds に追従）
  const { remainingSeconds, isRunning, start, stop, reset, adjustMainSeconds } =
    useJudoTimer({
      mainSeconds: settings.mainTimerSeconds,
      osaekomiSeconds: settings.osaekomi.ipponSeconds,
    });

  // 抑え込みタイマー：初期値はルールごとの一本秒
  const initialOsaekomiIpponSeconds = initialSettings.osaekomi.ipponSeconds;
  const {
    whiteSeconds: whiteOsae,
    blueSeconds: blueOsae,
    maxSeconds: osaekomiMaxSeconds,
    runningSide,
    startOsaekomi,
    stopOsaekomi,
    resetOsaekomi,
    setMaxSeconds: setOsaekomiMaxSeconds,
    setOsaekomiSeconds,
    adjustOsaekomiSeconds,
  } = useOsaekomiTimers({ maxSeconds: initialOsaekomiIpponSeconds });

  // スコア（white / blue を1つの state にまとめる）
  const [scores, setScores] = useState<AllScores>({
    white: { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
    blue: { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
  });

  // 一本勝ちアニメーションオーバーレイ
  const [ipponOverlayVisible, setIpponOverlayVisible] = useState(false);
  const [ipponWinner, setIpponWinner] = useState<Side | null>(null);

  const showIpponOverlayIfFirstIppon = (
    side: Side,
    prevIppon: number,
    nextIppon: number
  ) => {
    // 設定で指定された「Ippon to win」の本数に到達した瞬間のみ一本演出を出す
    const ipponToWin = settings.score.ipponToWin ?? 1;
    // ちょうど閾値に到達したときだけ発火（例: ipponToWin=2 のとき 1→2 で発火し、2→3 では発火しない）
    if (prevIppon < ipponToWin && nextIppon >= ipponToWin) {
      setIpponWinner(side);
      setIpponOverlayVisible(true);

      // 一本が入った時点でメインタイマー / GS / 抑え込みを停止する
      // （スコア表示はそのまま維持）
      if (isGoldenScore) {
        setIsGoldenRunning(false);
        clearGoldenIntervalIfNeeded();
      } else {
        // 通常タイマー
        stop();
      }
      // 抑え込みタイマーも停止
      stopOsaekomi();
    }
  };

  // ★ 抑え込みで「どこまでポイントを付けたか」を覚える
  const osaeMilestonesRef = useRef({
    white: { y: false, w: false, i: false },
    blue: { y: false, w: false, i: false },
  });

  // タイマー開始サウンド用：前回のisRunning状態を追跡
  const prevIsRunningRef = useRef(isRunning);
  const hasPlayedStartSoundRef = useRef(false);
  // タイマー終了サウンド用：前回のremainingSecondsを追跡
  const prevRemainingSecondsRef = useRef(remainingSeconds);

  const whiteScore = scores.white;
  const blueScore = scores.blue;

  const addIppon = (side: Side) => {
    setScores((prev) => {
      const prevWhite = prev.white.ippon;
      const prevBlue = prev.blue.ippon;

      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      if (side === "white") {
        next.white.ippon += 1;
      } else {
        next.blue.ippon += 1;
      }

      const targetPrevIppon = side === "white" ? prevWhite : prevBlue;
      const targetNextIppon = side === "white" ? next.white.ippon : next.blue.ippon;

      if (targetNextIppon >= 10) {
        return prev;
      }

      showIpponOverlayIfFirstIppon(side, targetPrevIppon, targetNextIppon);

      return next;
    });
  };

  // 自動スコアリング用（OsaekomiTimerから呼ばれる）：Waza-ari 2つで Ippon 昇格
  const addWazaari = (side: Side) => {
    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;
      const prevIppon = target.ippon;
      if (target.ippon >= 9) {
        return prev;
      }
      const prevWazaari = target.wazaari;
      target.wazaari += 1;

      // Waza-ari 2つで Ippon 昇格（自動スコアリング時のみ）
      if (target.wazaari >= 2) {
        target.ippon = 1;
        target.wazaari = 0;
        const nextIppon = target.ippon;
        showIpponOverlayIfFirstIppon(side, prevIppon, nextIppon);
      } else {
        // 実際にwazaariが+1された時のみサウンドを再生
        if (target.wazaari > prevWazaari) {
          play("scoreWazaYuko");
        }
      }

      return next;
    });
  };

  // 手動操作用（SideScoreタップ・ScorePanelから呼ばれる）：自動変換なし
  const addWazaariManual = (side: Side) => {
    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;
      if (target.ippon >= 9) {
        return prev;
      }
      // 手動操作では自動変換しない（Waza-ari=2でもそのまま保持）
      const prevWazaari = target.wazaari;
      if (target.wazaari < 9) {
        target.wazaari += 1;
        // 実際にwazaariが+1された時のみサウンドを再生
        if (target.wazaari > prevWazaari) {
          play("scoreWazaYuko");
        }
      }

      return next;
    });
  };

  // 抑え込みタイマー：Waza-ari を 1 減らす（0 未満にはしない）
  const subWazaari = (side: Side) => {
    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;

      if (target.wazaari <= 0) return prev;
      target.wazaari -= 1;
      return next;
    });
  };

  const addYuko = (side: Side) => {
    // Yuko を使用しない設定の場合は何もしない
    if (!settings.score.useYuko) return;

    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;
      if (target.yuko >= 9) {
        return prev;
      }
      const prevYuko = target.yuko;
      target.yuko += 1;

      // 実際にyukoが+1された時のみサウンドを再生
      if (target.yuko > prevYuko) {
        play("scoreWazaYuko");
      }

      return next;
    });
  };

  // 抑え込みタイマー：Yuko を 1 減らす（0 未満にはしない）
  const subYuko = (side: Side) => {
    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;

      if (target.yuko <= 0) return prev;
      target.yuko -= 1;
      return next;
    });
  };

  const maxShidoLimit =
    settings.score.maxShidoToHansokumake || JUDO_MAX_SHIDO;

  const addShido = (side: Side) => {
    setScores((prev) => {
      // まず現在の shido をチェック
      const currentShido =
        side === "white" ? prev.white.shido : prev.blue.shido;

      // すでに上限に達しているなら何もしない（それ以上は無視）
      if (currentShido >= maxShidoLimit) {
        return prev;
      }

      // ここから実際に更新
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;
      const opponent = side === "white" ? next.blue : next.white;
      const opponentSide: Side = side === "white" ? "blue" : "white";
      const prevOpponentIppon =
        opponentSide === "white" ? prev.white.ippon : prev.blue.ippon;

      // 1 増やす（最大でも maxShidoLimit まで）
      target.shido = currentShido + 1;

      // ちょうど maxShidoLimit 回目の Shido で相手に Ippon +1
      if (target.shido === maxShidoLimit) {
        opponent.ippon += 1;
        const nextOpponentIppon = opponent.ippon;
        showIpponOverlayIfFirstIppon(
          opponentSide,
          prevOpponentIppon,
          nextOpponentIppon
        );
      }

      return next;
    });
  };

  const resetScore = () => {
    setScores({
      white: { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
      blue: { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
    });
  };

  // ScorePanel用のスコア調整関数（直接値を設定、クランプ処理付き）
  const adjustScore = (
    side: Side,
    field: "ippon" | "wazaari" | "yuko" | "shido",
    delta: number
  ) => {
    setScores((prev) => {
      const next: AllScores = {
        white: { ...prev.white },
        blue: { ...prev.blue },
      };

      const target = side === "white" ? next.white : next.blue;
      const prevValue = target[field];
      const maxValue = field === "shido" ? 3 : 9;
      const newValue = Math.max(0, Math.min(maxValue, target[field] + delta));
      target[field] = newValue;

      // Waza-ariまたはYukoが+1された時のみサウンドを再生
      if (delta > 0 && (field === "wazaari" || field === "yuko")) {
        if (newValue > prevValue) {
          play("scoreWazaYuko");
        }
      }

      return next;
    });
  };

  // ルール変更時に即座に反映（SettingPanelが開いている間のみ）
  const previousRuleRef = useRef<AppSettings["rule"]>(settings.rule);

  // 設定パネルを開いたときにdraftSettingsを初期化
  useEffect(() => {
    if (activePanel === "setting") {
      setDraftSettings(settings);
      previousRuleRef.current = settings.rule;
    }
  }, [activePanel, settings]);
  useEffect(() => {
    if (activePanel !== "setting") return;
    if (draftSettings.rule === previousRuleRef.current) return;

    // ルールが変更された場合、そのルールに応じたデフォルト設定を適用
    const ruleDefaults =
      draftSettings.rule === "kosen" ? DEFAULT_KOSEN_SETTINGS : DEFAULT_SETTINGS;

    // ルール固有の設定を更新（osaekomi、score設定）
    const updatedDraft: AppSettings = {
      ...draftSettings,
      mainTimerSeconds: ruleDefaults.mainTimerSeconds,
      osaekomi: ruleDefaults.osaekomi,
      score: ruleDefaults.score,
    };

    setDraftSettings(updatedDraft);
    previousRuleRef.current = draftSettings.rule;

    // 即座に設定を適用
    const newSettings = updatedDraft;

    // ルール変更時はフルリセット
    // GS モード OFF & カウントアップ停止
    setIsGoldenScore(false);
    setGoldenSeconds(0);
    setIsGoldenRunning(false);
    clearGoldenIntervalIfNeeded();
    // 抑え込みタイマー両方リセット & 停止
    resetOsaekomi();
    osaeMilestonesRef.current.white = { y: false, w: false, i: false };
    osaeMilestonesRef.current.blue = { y: false, w: false, i: false };
    // スコア & Shido リセット
    resetScore();

    // 設定を適用
    setSettings(newSettings);
    // 抑え込みタイマーのmaxSecondsも更新
    setOsaekomiMaxSeconds(newSettings.osaekomi.ipponSeconds);
  }, [draftSettings.rule, activePanel]);

  // 設定保存処理
  const handleSaveSettings = () => {
    const previousSettings = settings;
    const newSettings = draftSettings;

    // RuleまたはMain Timer secondsが変更された場合、フルリセット
    const shouldReset =
      previousSettings.rule !== newSettings.rule ||
      previousSettings.mainTimerSeconds !== newSettings.mainTimerSeconds;

    if (shouldReset) {
      // GS モード OFF & カウントアップ停止
      setIsGoldenScore(false);
      setGoldenSeconds(0);
      setIsGoldenRunning(false);
      clearGoldenIntervalIfNeeded();
      // 抑え込みタイマー両方リセット & 停止
      resetOsaekomi();
      osaeMilestonesRef.current.white = { y: false, w: false, i: false };
      osaeMilestonesRef.current.blue = { y: false, w: false, i: false };
      // スコア & Shido リセット
      resetScore();
    }

    // 設定を適用
    setSettings(newSettings);

    // パネルを閉じる
    setActivePanel("none");
  };

  // 設定キャンセル処理
  const handleCancelSettings = () => {
    setDraftSettings(settings);
    setActivePanel("none");
  };

  // 名前（設定から取得）
  const whiteName = settings.playerNames.white;
  const blueName = settings.playerNames.blue;

  const layoutBgClass =
    layoutBackgroundClassMap[settings.layout.backgroundColor];
  const mainTimerTextClass =
    layoutTextClassMap[settings.layout.mainTimerColor] ?? "text-orange-400";
  const player1TextClass =
    layoutTextClassMap[settings.layout.player1Color] ?? "text-[rgb(255,0,0)]";
  const player2TextClass =
    layoutTextClassMap[settings.layout.player2Color] ?? "text-blue-500";
  const player1Stroke = layoutStrokeColorMap[settings.layout.player1Color];
  const player2Stroke = layoutStrokeColorMap[settings.layout.player2Color];

  // テーマ（現状は未使用だが保持）
  const [theme, setTheme] = useState<ThemeKey>("dark");

  // GS モード & カウントアップ用
  const [isGoldenScore, setIsGoldenScore] = useState(false);
  const [goldenSeconds, setGoldenSeconds] = useState(0);
  const [isGoldenRunning, setIsGoldenRunning] = useState(false);
  const goldenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const clearGoldenIntervalIfNeeded = () => {
    if (goldenIntervalRef.current) {
      clearInterval(goldenIntervalRef.current);
      goldenIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isGoldenScore || !isGoldenRunning) {
      clearGoldenIntervalIfNeeded();
      return;
    }

    if (goldenIntervalRef.current) return;

    goldenIntervalRef.current = setInterval(() => {
      setGoldenSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearGoldenIntervalIfNeeded();
    };
  }, [isGoldenScore, isGoldenRunning]);

  // All reset（TimerPanel から使用）
  const handleAllReset = () => {
    // メインタイマー初期化 & 停止
    reset();
    // GS モード OFF & カウントアップ停止
    setIsGoldenScore(false);
    setGoldenSeconds(0);
    setIsGoldenRunning(false);
    clearGoldenIntervalIfNeeded();
    // 抑え込みタイマー両方リセット & 停止
    resetOsaekomi();
    osaeMilestonesRef.current.white = { y: false, w: false, i: false };
    osaeMilestonesRef.current.blue = { y: false, w: false, i: false };
    // スコア & Shido リセット
    resetScore();
    // パネルは閉じない（仕様に明記なしのため）
  };

  const handleMainTimerClick = () => {
    // iPhone Safari: 最初のユーザー操作でオーディオをアンロック
    if (isIPhoneRef.current && !audioUnlockedOnceRef.current && !isRunning) {
      unlockAudio();
      audioUnlockedOnceRef.current = true;
    }

    if (isGoldenScore) {
      // GS 中はカウントアップの開始/停止のみ行う（GS ON/OFF は変えない）
      setIsGoldenRunning((prev) => {
        const next = !prev;
        if (!next) {
          clearGoldenIntervalIfNeeded();
        }
        return next;
      });
      return;
    }

    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  // 抑え込みタイマーのクリックハンドラー
  const handleOsaekomiClick = (side: "white" | "blue") => {
    const isWhiteSide = side === "white";
    const currentSeconds = isWhiteSide ? whiteOsae : blueOsae;

    if (runningSide === side) {
      // 実行中 → 停止
      stopOsaekomi();
      return;
    } else if (side === "white" ? whiteOsae > 0 : blueOsae > 0) {
      // 停止中（値がある） → リセット
      resetOsaekomi(side);
    } else {
      // 停止中（値がない） → 開始
      startOsaekomi(side);
    }

    if (currentSeconds > 0) {
      resetOsaekomi(side);
      osaeMilestonesRef.current[side] = { y: false, w: false, i: false };
      return;
    }

    //停止中で0のとき→　新しく開始するのでフラグも初期化
    osaeMilestonesRef.current[side] = { y: false, w: false, i: false };
    startOsaekomi(side);
  };

  // タイマー開始サウンド：stopped → running の時のみ再生（pauseからの再開では再生しない）
  useEffect(() => {
    // タイマーがリセットされたらフラグもリセット
    if (!isRunning && remainingSeconds === settings.mainTimerSeconds) {
      hasPlayedStartSoundRef.current = false;
    }

    // stopped → running の遷移で、かつリセット後の最初の開始時のみ再生
    if (
      !isGoldenScore &&
      !prevIsRunningRef.current &&
      isRunning &&
      !hasPlayedStartSoundRef.current &&
      remainingSeconds === settings.mainTimerSeconds
    ) {
      play("timerStart");
      hasPlayedStartSoundRef.current = true;
    }
    prevIsRunningRef.current = isRunning;
  }, [isRunning, remainingSeconds, settings.mainTimerSeconds, isGoldenScore, play]);

  // タイマー終了サウンド：00:00になった時（GSモードでは再生しない）
  useEffect(() => {
    if (
      !isGoldenScore &&
      prevRemainingSecondsRef.current > 0 &&
      remainingSeconds === 0
    ) {
      play("timerEnd");
    }
    prevRemainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds, isGoldenScore, play]);

  // フルスクリーン状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        ),
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // フルスクリーン切り替え関数
  const toggleFullscreen = async () => {
    try {
      if (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) {
        // Exit fullscreen
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
        // Enter fullscreen
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

  // ★ 白側の抑え込み → 設定値に応じて自動スコア
  useEffect(() => {
    if (runningSide !== "white") return;

    const ms = osaeMilestonesRef.current.white;
    const yukoSec = settings.osaekomi.yukoSeconds;
    const wazaSec = settings.osaekomi.wazaariSeconds;

    if (whiteOsae >= yukoSec && !ms.y) {
      ms.y = true;
      addYuko("white");
    }

    if (whiteOsae >= wazaSec && !ms.w) {
      ms.w = true;
      addWazaari("white");
      subYuko("white");
    }

    if (whiteOsae >= osaekomiMaxSeconds && !ms.i) {
      ms.i = true;
      addIppon("white");
      subWazaari("white");
    }
  }, [whiteOsae, runningSide, osaekomiMaxSeconds, settings.osaekomi]);

  // ★ 青側の抑え込み → 設定値に応じて自動スコア
  useEffect(() => {
    if (runningSide !== "blue") return;

    const ms = osaeMilestonesRef.current.blue;
    const yukoSec = settings.osaekomi.yukoSeconds;
    const wazaSec = settings.osaekomi.wazaariSeconds;

    if (blueOsae >= yukoSec && !ms.y) {
      ms.y = true;
      addYuko("blue");
    }

    if (blueOsae >= wazaSec && !ms.w) {
      ms.w = true;
      addWazaari("blue");
      subYuko("blue");
    }

    if (blueOsae >= osaekomiMaxSeconds && !ms.i) {
      ms.i = true;
      addIppon("blue");
      subWazaari("blue");
    }
  }, [blueOsae, runningSide, osaekomiMaxSeconds, settings.osaekomi]);

  return (
    <main
      className={`flex items-center justify-center w-full h-full ${
        themeClassMap[theme]
      }`}
    >
      <div
        className={`w-full h-full flex flex-col relative ${
          isGoldenScore ? "bg-yellow-400 text-white" : layoutBgClass
        }`}
      >
        {/* Homeボタン - Fullscreenボタンと同じ高さに配置（左側） */}
        <button
          onClick={() => {
            router.push("/");
          }}
          className="absolute top-4 left-4 z-[100] rounded-md px-3 py-2 transition-colors"
          style={{ color: "white" }}
          aria-label="Home"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>
        
        {/* フルスクリーンボタン - Player名と同じ高さに配置 */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-[100] rounded-md px-3 py-2 transition-colors shadow-lg bg-white text-black hover:bg-gray-100 border-2 border-black"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>
        {/* 上半分：メインタイマー + 抑え込み（レイアウトは常に固定） */}
        <div className="flex-1 flex items-end justify-center px-8 pt-4">
          {/* 左 Osaekomi */}
          <div className="flex-1 flex justify-start">
            <div className="flex flex-col items-center self-end">
              <OsaekomiDisplay
                seconds={whiteOsae}
                side="white"
                colorClass={player1TextClass}
                onClick={() => handleOsaekomiClick("white")}
              />
            </div>
          </div>

          {/* 中央メインタイマー（一番大きい） */}
          <div className="flex-1 flex justify-center">
            <div className="flex flex-col items-center self-end">
              <TimerDisplay
                remainingSeconds={
                  isGoldenScore ? goldenSeconds : remainingSeconds
                }
                onClick={handleMainTimerClick}
                colorClass={isGoldenScore ? "text-black" : mainTimerTextClass}
              />
            </div>
          </div>

          {/* 右 Osaekomi */}
          <div className="flex-1 flex justify-end">
            <div className="flex flex-col items-center self-end">
              <OsaekomiDisplay
                seconds={blueOsae}
                side="blue"
                colorClass={player2TextClass}
                onClick={() => handleOsaekomiClick("blue")}
              />
            </div>
          </div>
        </div>

        {/* 下半分：Player / Score / 中央ボタン群 */}
        <div className="flex-1 flex items-start justify-center px-8 pb-4">
          {/* 左 Player ブロック */}
          <div className="flex-1 flex justify-start">
            <div className="self-start">
              <SideScore
                side="white"
                align="left"
                name={whiteName}
                score={whiteScore}
                colorClass={player1TextClass}
                strokeColor={player1Stroke}
                showYuko={settings.score.useYuko}
                onAddIppon={() => addIppon("white")}
                onAddWazaari={() => addWazaariManual("white")}
                onAddYuko={() => addYuko("white")}
              />
            </div>
          </div>

          {/* 中央：警告インジケータ（S/S(/S)/H） + パネルボタン */}
          <div className="flex flex-col items-center justify-start">
            <div className="flex items-stretch gap-8 h-48 justify-center">
              {/* 左 SSH（white） */}
              <div className="flex flex-col items-center justify-between h-full font-semibold">
                {Array.from(
                  { length: maxShidoLimit === 4 ? 4 : 3 },
                  (_, idx) => {
                    const isLast = idx === (maxShidoLimit === 4 ? 3 : 2);
                    const label = isLast ? "H" : "S";
                    const requiredCurrent = idx;
                    const isOn = whiteScore.shido >= idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (whiteScore.shido === requiredCurrent) {
                            addShido("white");
                          }
                        }}
                        className={`cursor-pointer text-4xl select-none ${
                          isOn ? "text-green-400" : "text-green-400/20"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>

              {/* 中央：タイマー / スコア / 設定ボタン（縦） */}
              <div className="flex items-stretch justify-center color-orange-400">
                {/* PanelNav 自体が h-full を持っている */}
                <PanelNav active={activePanel} onChange={setActivePanel} />
              </div>

              {/* 右 SSH（blue） */}
              <div className="flex flex-col items-center justify-between h-full font-semibold">
                {Array.from(
                  { length: maxShidoLimit === 4 ? 4 : 3 },
                  (_, idx) => {
                    const isLast = idx === (maxShidoLimit === 4 ? 3 : 2);
                    const label = isLast ? "H" : "S";
                    const requiredCurrent = idx;
                    const isOn = blueScore.shido >= idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (blueScore.shido === requiredCurrent) {
                            addShido("blue");
                          }
                        }}
                        className={`cursor-pointer text-4xl select-none ${
                          isOn ? "text-green-400" : "text-green-400/20"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* 右 Player ブロック */}
          <div className="flex-1 flex justify-end">
            <div className="self-end">
              <SideScore
                side="blue"
                align="right"
                name={blueName}
                score={blueScore}
                colorClass={player2TextClass}
                strokeColor={player2Stroke}
                showYuko={settings.score.useYuko}
                onAddIppon={() => addIppon("blue")}
                onAddWazaari={() => addWazaariManual("blue")}
                onAddYuko={() => addYuko("blue")}
              />
            </div>
          </div>
        </div>

        {/* 一本勝ちアニメーション動画オーバーレイ（16:9 全面） */}
        <IpponOverlay
          visible={ipponOverlayVisible}
          winner={ipponWinner}
          onClose={() => setIpponOverlayVisible(false)}
        />
      </div>

      {/* TimerPanel オーバーレイ：ベースレイアウトを変えずに下半分を覆う */}
      {activePanel === "timer" && (
        <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center z-10">
          <div className="flex flex-col w-full max-w-[1280px] px-8">
            {/* 上半分は透過させ、メインタイマーのすぐ下からパネルを出すイメージ */}
            <div className="flex-1 pointer-events-none" />
            <div className="flex-1 flex items-start justify-center pb-4 pointer-events-auto">
              <div className="w-full max-w-[960px] max-h-[360px] overflow-y-auto overflow-visible">
                <TimerPanel
                  mainSeconds={isGoldenScore ? goldenSeconds : remainingSeconds}
                  onAdjustMainSeconds={adjustMainSeconds}
                  osaekomiSelectedSide="white"
                  whiteOsaeSeconds={whiteOsae}
                  blueOsaeSeconds={blueOsae}
                  osaekomiMaxSeconds={osaekomiMaxSeconds}
                  onAdjustOsaekomiSeconds={adjustOsaekomiSeconds}
                  onChangeOsaekomiMaxSeconds={setOsaekomiMaxSeconds}
                  onResetMain={() => {
                    if (isGoldenScore) {
                      setGoldenSeconds(0);
                      setIsGoldenRunning(false);
                      clearGoldenIntervalIfNeeded();
                    } else {
                      reset();
                    }
                  }}
                  onResetOsaekomi={() => {
                    resetOsaekomi();
                    osaeMilestonesRef.current.white = {
                      y: false,
                      w: false,
                      i: false,
                    };
                    osaeMilestonesRef.current.blue = {
                      y: false,
                      w: false,
                      i: false,
                    };
                  }}
                  isGoldenScore={isGoldenScore}
                  onToggleGoldenScore={() => {
                    if (!isGoldenScore) {
                      // GS を開始（00:00 で停止状態から）
                      setGoldenSeconds(0);
                      setIsGoldenScore(true);
                      setIsGoldenRunning(false);
                      clearGoldenIntervalIfNeeded();
                      stop(); // 通常タイマーは停止
                    } else {
                      // GS を終了し、通常タイマーへ戻す
                      setIsGoldenScore(false);
                      setIsGoldenRunning(false);
                      clearGoldenIntervalIfNeeded();
                      reset(); // 通常タイマーを初期状態へ
                    }
                  }}
                  onAllReset={handleAllReset}
                  onDone={() => setActivePanel("none")}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ScorePanel オーバーレイ：ベースレイアウトを変えずに下半分を覆う */}
      {activePanel === "score" && (
        <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center z-10">
          <div className="flex flex-col w-full max-w-[1280px] px-8">
            {/* 上半分は透過させ、メインタイマーのすぐ下からパネルを出すイメージ */}
            <div className="flex-1 pointer-events-none" />
            <div className="flex-1 flex items-start justify-center pb-4 pointer-events-auto">
              <div className="w-full max-w-[960px] max-h-[360px] overflow-y-auto overflow-visible">
                <ScorePanel
                  whiteIppon={whiteScore.ippon}
                  whiteWazaari={whiteScore.wazaari}
                  whiteYuko={whiteScore.yuko}
                  whiteShido={whiteScore.shido}
                  onAdjustWhiteIppon={(delta) =>
                    adjustScore("white", "ippon", delta)
                  }
                  onAdjustWhiteWazaari={(delta) =>
                    adjustScore("white", "wazaari", delta)
                  }
                  onAdjustWhiteYuko={(delta) =>
                    adjustScore("white", "yuko", delta)
                  }
                  onAdjustWhiteShido={(delta) =>
                    adjustScore("white", "shido", delta)
                  }
                  blueIppon={blueScore.ippon}
                  blueWazaari={blueScore.wazaari}
                  blueYuko={blueScore.yuko}
                  blueShido={blueScore.shido}
                  onAdjustBlueIppon={(delta) =>
                    adjustScore("blue", "ippon", delta)
                  }
                  onAdjustBlueWazaari={(delta) =>
                    adjustScore("blue", "wazaari", delta)
                  }
                  onAdjustBlueYuko={(delta) =>
                    adjustScore("blue", "yuko", delta)
                  }
                  onAdjustBlueShido={(delta) =>
                    adjustScore("blue", "shido", delta)
                  }
                  useYuko={settings.score.useYuko}
                  onDone={() => setActivePanel("none")}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SettingPanel オーバーレイ：全画面 */}
      {activePanel === "setting" && (
        <SettingPanel
          settings={draftSettings}
          onSettingsChange={setDraftSettings}
          onSave={handleSaveSettings}
          onCancel={handleCancelSettings}
        />
      )}
    </main>
  );
}


