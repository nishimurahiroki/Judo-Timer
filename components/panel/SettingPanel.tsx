"use client";

import { useState } from "react";
import type { AppSettings, LayoutColorKey } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings";

type SettingSection = "mainTimer" | "rule" | "players" | "score" | "osaekomi" | "layout" | "sound";

type SettingPanelProps = {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function SettingPanel({
  settings,
  onSettingsChange,
  onSave,
  onCancel,
}: SettingPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingSection>("mainTimer");
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);

  // Main timer: minutes / seconds segments
  const initialMinutes = Math.floor(settings.mainTimerSeconds / 60);
  const initialSeconds = settings.mainTimerSeconds % 60;
  const [activeSegment, setActiveSegment] = useState<"min" | "sec">("min");
  const [timerMinutes, setTimerMinutes] = useState<number>(initialMinutes);
  const [timerSeconds, setTimerSeconds] = useState<number>(initialSeconds);

  const layoutColorBgClass: Record<LayoutColorKey, string> = {
    blue: "bg-[rgb(0,0,255)]",
    red: "bg-[rgb(255,0,0)]",
    green: "bg-[rgb(0,255,0)]",
    yellow: "bg-[rgb(255,255,0)]",
    orange: "bg-[rgb(255,165,0)]",
    cyan: "bg-[rgb(0,255,255)]",
    black: "bg-black",
    white: "bg-white",
  };

  const updateDraft = (updates: Partial<AppSettings>) => {
    const next = { ...draftSettings, ...updates };
    setDraftSettings(next);
    onSettingsChange(next);
  };

  const updateScore = (updates: Partial<AppSettings["score"]>) => {
    updateDraft({ score: { ...draftSettings.score, ...updates } });
  };

  const updateOsaekomi = (updates: Partial<AppSettings["osaekomi"]>) => {
    updateDraft({ osaekomi: { ...draftSettings.osaekomi, ...updates } });
  };

  const updateLayout = (updates: Partial<AppSettings["layout"]>) => {
    updateDraft({ layout: { ...draftSettings.layout, ...updates } });
  };

  const updatePlayerNames = (updates: Partial<AppSettings["playerNames"]>) => {
    updateDraft({ playerNames: { ...draftSettings.playerNames, ...updates } });
  };

  const updateSound = (updates: Partial<AppSettings["sound"]>) => {
    updateDraft({ sound: { ...draftSettings.sound, ...updates } });
  };

  const clampSegment = (value: number) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(59, Math.max(0, value));
  };

  const applySegments = (minutes: number, seconds: number) => {
    const clampedMinutes = clampSegment(minutes);
    const clampedSeconds = clampSegment(seconds);
    setTimerMinutes(clampedMinutes);
    setTimerSeconds(clampedSeconds);
    const total = clampedMinutes * 60 + clampedSeconds;
    updateDraft({ mainTimerSeconds: total });
  };

  const handleAppendDigit = (digit: string) => {
    const d = parseInt(digit, 10);
    if (Number.isNaN(d)) return;

    if (activeSegment === "min") {
      const next = (timerMinutes % 10) * 10 + d;
      applySegments(next, timerSeconds);
    } else {
      const next = (timerSeconds % 10) * 10 + d;
      applySegments(timerMinutes, next);
    }
  };

  const handleBackspace = () => {
    if (activeSegment === "min") {
      const next = Math.floor(timerMinutes / 10);
      applySegments(next, timerSeconds);
    } else {
      const next = Math.floor(timerSeconds / 10);
      applySegments(timerMinutes, next);
    }
  };

  const handleClear = () => {
    applySegments(0, 0);
  };

  const handleCommitTimer = () => {
    applySegments(timerMinutes, timerSeconds);
  };

  const menuItems: { key: SettingSection; label: string }[] = [
    { key: "mainTimer", label: "Main Timer" },
    { key: "rule", label: "Rule" },
    { key: "players", label: "Players" },
    { key: "score", label: "Score" },
    { key: "osaekomi", label: "Osaekomi" },
    { key: "layout", label: "Layout" },
    { key: "sound", label: "Sound" },
  ];

  const colorOptions: LayoutColorKey[] = [
    "blue",
    "red",
    "green",
    "yellow",
    "orange",
    "cyan",
    "black",
    "white",
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "mainTimer":
        return (
          <div className="flex h-full w-full items-center justify-center">
            <div className="w-full max-w-[640px] rounded-xl bg-neutral-900/80 shadow-lg flex flex-col max-h-[810px] overflow-y-auto"
            >
              {/* Display: MM min : SS sec */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <div className="text-lg font-medium text-slate-200">
                  Main Timer
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSegment("min")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-base ${
                      activeSegment === "min"
                        ? "bg-blue-600 border-blue-300 text-white"
                        : "bg-neutral-800 border-neutral-600 text-slate-100"
                    }`}
                  >
                    <span className="font-mono text-3xl">
                      {timerMinutes.toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs uppercase">min</span>
                  </button>
                  <span className="text-xl text-slate-300">:</span>
                  <button
                    type="button"
                    onClick={() => setActiveSegment("sec")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-base ${
                      activeSegment === "sec"
                        ? "bg-blue-600 border-blue-300 text-white"
                        : "bg-neutral-800 border-neutral-600 text-slate-100"
                    }`}
                  >
                    <span className="font-mono text-3xl">
                      {timerSeconds.toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs uppercase">sec</span>
                  </button>
                </div>
              </div>

              {/* Info row */}
              <div className="px-4 py-1 text-xs text-slate-300 flex justify-between">
                <span></span>
                <span>
                  Total:{" "}
                  {Math.floor(draftSettings.mainTimerSeconds / 60)
                    .toString()
                    .padStart(2, "0")}
                  :
                  {(draftSettings.mainTimerSeconds % 60)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>

              {/* Keypad */}
              <div className="px-3 pb-3 pt-1 flex flex-col flex-1 overflow-y-auto max-h-[630px]"
              >
                <div className="grid grid-cols-3 gap-3">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleAppendDigit(d)}
                      className="h-14 rounded-lg bg-neutral-100 text-neutral-900 text-2xl font-medium shadow-inner active:scale-95 transition-transform"
                    >
                      {d}
                    </button>
                  ))}

                  {/* Clear */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-14 rounded-lg bg-neutral-700 text-sm text-white font-medium shadow-inner active:scale-95 transition-transform"
                  >
                    Clear
                  </button>

                  {/* 0 */}
                  <button
                    type="button"
                    onClick={() => handleAppendDigit("0")}
                    className="h-11 sm:h-14 rounded-lg bg-neutral-100 text-neutral-900 text-lg sm:text-2xl font-medium shadow-inner active:scale-95 transition-transform"
                  >
                    0
                  </button>

                  {/* Backspace (arrow icon) */}
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-14 rounded-lg bg-emerald-500 text-white text-2xl font-semibold shadow-inner active:scale-95 transition-transform"
                  >
                    ←
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "rule":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Rule</h3>
            <div className="text-lg space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rule"
                  value="judo"
                  checked={draftSettings.rule === "judo"}
                  onChange={() => updateDraft({ rule: "judo" })}
                />
                <span>Judo</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rule"
                  value="kosen"
                  checked={draftSettings.rule === "kosen"}
                  onChange={() => updateDraft({ rule: "kosen" })}
                />
                <span>Kosen</span>
              </label>
            </div>
          </div>
        );

      case "players":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Players Names</h3>
            <div className="space-y-2">
              <label className="block text-lg">
                Player 1
                <input
                  type="text"
                  value={draftSettings.playerNames.white}
                  onChange={(e) => updatePlayerNames({ white: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-2 text-base"
                />
              </label>
              <label className="block text-lg">
                Player 2
                <input
                  type="text"
                  value={draftSettings.playerNames.blue}
                  onChange={(e) => updatePlayerNames({ blue: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-2 text-base"
                />
              </label>
            </div>
          </div>
        );

      case "score":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Score</h3>
            <div className="space-y-4">
              <label className="text-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draftSettings.score.useYuko}
                  onChange={(e) => updateScore({ useYuko: e.target.checked })}
                />
                <span>Use Yuko</span>
              </label>
              <div>
                <label className="block text-base">
                  Max Shido to Hansokumake (0-4)
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={draftSettings.score.maxShidoToHansokumake}
                    onChange={(e) =>
                      updateScore({
                        maxShidoToHansokumake: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-1 text-base"
                  />
                </label>
              </div>
              <div>
                <label className="block text-base">
                  Ippon to Win (1-9)
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={draftSettings.score.ipponToWin}
                    onChange={(e) =>
                      updateScore({ ipponToWin: parseInt(e.target.value) || 1 })
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-1 text-base"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case "osaekomi":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Osaekomi</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base">
                  Yuko Seconds
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={draftSettings.osaekomi.yukoSeconds}
                    onChange={(e) =>
                      updateOsaekomi({ yukoSeconds: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-1 text-base"
                  />
                </label>
              </div>
              <div>
                <label className="block text-base">
                  Waza-ari Seconds
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={draftSettings.osaekomi.wazaariSeconds}
                    onChange={(e) =>
                      updateOsaekomi({
                        wazaariSeconds: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-1 text-sm"
                  />
                </label>
              </div>
              <div>
                <label className="block text-base">
                  Ippon Seconds
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={draftSettings.osaekomi.ipponSeconds}
                    onChange={(e) =>
                      updateOsaekomi({ ipponSeconds: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-black/30 px-5 py-1 text-sm"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case "layout":
        return (
          <div className="flex flex-col h-full min-h-0">
            <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Layout</h3>
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Background Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateLayout({ backgroundColor: color })}
                      className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                        draftSettings.layout.backgroundColor === color
                          ? "border-yellow-300 ring-2 ring-yellow-400"
                          : "border-slate-600"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-full block ${layoutColorBgClass[color]}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Main Timer Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateLayout({ mainTimerColor: color })}
                      className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                        draftSettings.layout.mainTimerColor === color
                          ? "border-yellow-300 ring-2 ring-yellow-400"
                          : "border-slate-600"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-full block ${layoutColorBgClass[color]}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Player 1 Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateLayout({ player1Color: color })}
                      className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                        draftSettings.layout.player1Color === color
                          ? "border-yellow-300 ring-2 ring-yellow-400"
                          : "border-slate-600"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-full block ${layoutColorBgClass[color]}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Player 2 Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateLayout({ player2Color: color })}
                      className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${
                        draftSettings.layout.player2Color === color
                          ? "border-yellow-300 ring-2 ring-yellow-400"
                          : "border-slate-600"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-full block ${layoutColorBgClass[color]}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset to default layout */}
              <div className="pt-4 border-t border-neutral-800 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    updateLayout({
                      backgroundColor: DEFAULT_SETTINGS.layout.backgroundColor,
                      mainTimerColor: DEFAULT_SETTINGS.layout.mainTimerColor,
                      player1Color: DEFAULT_SETTINGS.layout.player1Color,
                      player2Color: DEFAULT_SETTINGS.layout.player2Color,
                    })
                  }
                    className="px-4 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-slate-100"
                >
                  Reset to default
                </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "sound":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sound</h3>
            <div className="space-y-4">
              <label className="text-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draftSettings.sound.enabled}
                  onChange={(e) => updateSound({ enabled: e.target.checked })}
                />
                <span>Sound ON/OFF</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex z-20">
      <div className="flex w-full">
        {/* Left Menu */}
        <div className="w-48 bg-neutral-900 border-r border-neutral-700 flex flex-col">
          <div className="p-4 border-b border-neutral-700">
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <nav className="flex-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  activeSection === item.key
                    ? "bg-neutral-800 text-white border-l-4 border-yellow-400"
                    : "text-slate-300 hover:bg-neutral-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        <div className="flex-1 min-h-0 p-6 flex items-center justify-center">
          <div className="w-full max-w-[1280px] h-full rounded-xl bg-neutral-950/70 border border-neutral-800 shadow-inner overflow-hidden p-6 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {renderContent()}
            </div>
          </div>
          </div>

          {/* Save Button at Bottom */}
          <div className="border-t border-neutral-700 p-12 bg-neutral-900">
            <div className="flex gap-4 max-w-4xl mx-auto">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 rounded bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="flex-1 py-3 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

