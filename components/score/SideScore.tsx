"use client";

// page.tsx / ScoreBoard など共通の型
type ScoreState = {
  ippon: number;
  wazaari: number;
  yuko: number;
  shido: number;
};

type Side = "white" | "blue";
type Align = "left" | "right";

type SideScoreProps = {
  side: Side;        // "white" or "blue"
  name: string;      // Player1 / Player2 など
  score: ScoreState; // Ippon / Waza-ari / Yuko / Shido
  align?: Align;     // 左右どちら側に置くか
  onAddIppon?: () => void;
  onAddWazaari?: () => void;
  onAddYuko?: () => void;
  colorClass?: string;
  strokeColor?: string;
  showYuko?: boolean;
};

export function SideScore({
  side,
  name,
  score,
  align = "left",
  onAddIppon,
  onAddWazaari,
  onAddYuko,
  colorClass,
  strokeColor,
  showYuko = true,
}: SideScoreProps) {
  const isWhite = side === "white";

  const effectiveColorClass =
    colorClass ?? (isWhite ? "text-[rgb(255,0,0)]" : "text-white");
  const alignClass = align === "left" ? "items-start" : "items-end";
  const effectiveStroke =
    strokeColor ??
    (isWhite ? "2px rgb(255 0 0)" : "2px rgb(255 255 255)");

  return (
    <div className={`flex flex-col ${alignClass} gap-2`}>
      {/* プレイヤー名 */}
      <div
        className={`${effectiveColorClass} text-[40px] font-semibold text-center w-full`}
      >
        {name}
      </div>

      {/* I / W / Y ラベル + スコア数字（3カラム構造） */}
      <div className="flex justify-between w-[400px] mt-0">
        {isWhite ? (
          <>
            {/* Player1: 表示順を Y / W / I に変更 */}
            {/* Y 列（Yuko を使う場合のみ表示） */}
            {showYuko && (
              <div className="flex flex-col items-center">
                <span
                  className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
                >
                  Y
                </span>
                <span
                  className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                  onClick={() => onAddYuko?.()}
                  style={{
                    WebkitTextStroke: effectiveStroke,
                  }}
                >
                  {score.yuko}
                </span>
              </div>
            )}

            {/* W 列 */}
            <div className="flex flex-col items-center">
              <span
                className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
              >
                W
              </span>
              <span
                className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                onClick={() => onAddWazaari?.()}
                style={{
                  WebkitTextStroke: effectiveStroke,
                }}
              >
                {score.wazaari}
              </span>
            </div>

            {/* I 列 */}
            <div className="flex flex-col items-center">
              <span
                className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
              >
                I
              </span>
              <span
                className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                onClick={() => onAddIppon?.()}
                style={{
                  WebkitTextStroke: effectiveStroke,
                }}
              >
                {score.ippon}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Player2 など: 既存どおり I / W / Y の順番 */}
            {/* I 列 */}
            <div className="flex flex-col items-center">
              <span
                className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
              >
                I
              </span>
              <span
                className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                onClick={() => onAddIppon?.()}
                style={{
                  WebkitTextStroke: effectiveStroke,
                }}
              >
                {score.ippon}
              </span>
            </div>

            {/* W 列 */}
            <div className="flex flex-col items-center">
              <span
                className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
              >
                W
              </span>
              <span
                className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                onClick={() => onAddWazaari?.()}
                style={{
                  WebkitTextStroke: effectiveStroke,
                }}
              >
                {score.wazaari}
              </span>
            </div>

            {/* Y 列（Yuko を使う場合のみ表示） */}
            {showYuko && (
              <div className="flex flex-col items-center">
                <span
                  className={`text-[30px] tracking-wide mb-[-20px] ${effectiveColorClass}`}
                >
                  Y
                </span>
                <span
                  className={`cursor-pointer select-none font-bold text-[120px] font-mono ${effectiveColorClass}`}
                  onClick={() => onAddYuko?.()}
                  style={{
                    WebkitTextStroke: effectiveStroke,
                  }}
                >
                  {score.yuko}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
