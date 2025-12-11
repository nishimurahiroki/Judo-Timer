// components/timer/TimerDisplay.tsx
"use client";

type TimerDisplayProps = {
  remainingSeconds: number;
  onClick?: () => void;
  colorClass?: String;
};

export function TimerDisplay({
  remainingSeconds,
  onClick,
  colorClass = "text-black",
}: TimerDisplayProps) {
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[280px] leading-none focus:outline-none cursor-pointer select-none ${colorClass}`}
    >
      {minutes}:{seconds}
    </button>
  );
}
