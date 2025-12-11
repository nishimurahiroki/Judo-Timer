"use client";

type OsaekomiDisplayProps = {
  seconds: number;
  side: "white" | "blue";
  onClick?: () => void;
  colorClass?: string;
};

export function OsaekomiDisplay({
  seconds,
  side,
  onClick,
  colorClass,
}: OsaekomiDisplayProps) {
  const defaultColorClass = side === "white" ? "text-[rgb(255,0,0)]" : "text-white";
  const effectiveColorClass = colorClass ?? defaultColorClass;
  const value = String(seconds).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 cursor-pointer select-none ${effectiveColorClass}`}
    >
      <span className="font-mono font-bold text-[144px] leading-none">
        {value}
      </span>
      <span className="font-sm text-[18px] opacity-100">Osaekomi</span>
    </button>
  );
}
