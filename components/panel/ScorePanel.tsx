"use client";

type ScorePanelProps = {
  // P1 (white) scores
  whiteIppon: number;
  whiteWazaari: number;
  whiteYuko: number;
  whiteShido: number;
  onAdjustWhiteIppon: (delta: number) => void;
  onAdjustWhiteWazaari: (delta: number) => void;
  onAdjustWhiteYuko: (delta: number) => void;
  onAdjustWhiteShido: (delta: number) => void;

  // P2 (blue) scores
  blueIppon: number;
  blueWazaari: number;
  blueYuko: number;
  blueShido: number;
  onAdjustBlueIppon: (delta: number) => void;
  onAdjustBlueWazaari: (delta: number) => void;
  onAdjustBlueYuko: (delta: number) => void;
  onAdjustBlueShido: (delta: number) => void;

  // DONE
  onDone: () => void;

  // 設定で Yuko を使わない場合の制御
  useYuko?: boolean;
};

export function ScorePanel({
  whiteIppon,
  whiteWazaari,
  whiteYuko,
  whiteShido,
  onAdjustWhiteIppon,
  onAdjustWhiteWazaari,
  onAdjustWhiteYuko,
  onAdjustWhiteShido,
  blueIppon,
  blueWazaari,
  blueYuko,
  blueShido,
  onAdjustBlueIppon,
  onAdjustBlueWazaari,
  onAdjustBlueYuko,
  onAdjustBlueShido,
  onDone,
  useYuko = true,
}: ScorePanelProps) {
  const ScoreControl = ({
    label,
    value,
    onAdjust,
    maxValue,
  }: {
    label: string;
    value: number;
    onAdjust: (delta: number) => void;
    maxValue: number;
  }) => (
    <div className="flex flex-col items-center justify-between bg-neutral-800 rounded-lg px-3 py-3">
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="font-mono text-3xl mb-2">{value}</div>
      <div className="flex gap-2">
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-neutral-700 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAdjust(-1)}
          disabled={value <= 0}
        >
          -1
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded bg-neutral-700 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => onAdjust(1)}
          disabled={value >= maxValue}
        >
          +1
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full bg-neutral-900/80 text-white rounded-xl px-6 py-4">
      {/* Row 1: P1 (white) scores */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <ScoreControl
          label="P1 Ippon"
          value={whiteIppon}
          onAdjust={onAdjustWhiteIppon}
          maxValue={9}
        />
        <ScoreControl
          label="P1 Waza-ari"
          value={whiteWazaari}
          onAdjust={onAdjustWhiteWazaari}
          maxValue={9}
        />
        {useYuko && (
          <ScoreControl
            label="P1 Yuko"
            value={whiteYuko}
            onAdjust={onAdjustWhiteYuko}
            maxValue={9}
          />
        )}
        <ScoreControl
          label="P1 Shido"
          value={whiteShido}
          onAdjust={onAdjustWhiteShido}
          maxValue={3}
        />
      </div>

      {/* Row 2: P2 (blue) scores */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <ScoreControl
          label="P2 Ippon"
          value={blueIppon}
          onAdjust={onAdjustBlueIppon}
          maxValue={9}
        />
        <ScoreControl
          label="P2 Waza-ari"
          value={blueWazaari}
          onAdjust={onAdjustBlueWazaari}
          maxValue={9}
        />
        {useYuko && (
          <ScoreControl
            label="P2 Yuko"
            value={blueYuko}
            onAdjust={onAdjustBlueYuko}
            maxValue={9}
          />
        )}
        <ScoreControl
          label="P2 Shido"
          value={blueShido}
          onAdjust={onAdjustBlueShido}
          maxValue={3}
        />
      </div>

      {/* Row 3: DONE button */}
      <div className="flex justify-center">
        <button
          type="button"
          className="w-1/2 py-3 rounded-full bg-neutral-700 hover:bg-neutral-600 text-base font-semibold"
          onClick={onDone}
        >
          DONE
        </button>
      </div>
    </div>
  );
}


