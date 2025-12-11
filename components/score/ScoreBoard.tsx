// components/score/ScoreBoard.tsx
"use client";

// page.tsx / ScoreBoard など共通の型
type ScoreState = {
  ippon: number;
  wazaari: number;
  yuko: number;
  shido: number;
};


type Side = "white" | "blue";

type ScoreBoardProps = {
  whiteLabel: string;
  blueLabel: string;
  whiteScore: ScoreState;
  blueScore: ScoreState;
  onAddIppon: (side: Side) => void;
  onAddWazaari: (side: Side) => void;
  onAddYuko: (side: Side) => void;
  onAddShido: (side: Side) => void;
  onReset: () => void;
  useYuko?: boolean;
};

export function ScoreBoard({
  whiteLabel,
  blueLabel,
  whiteScore,
  blueScore,
  onAddIppon,
  onAddWazaari,
  onAddYuko,
  onAddShido,
  onReset,
  useYuko = true,
}: ScoreBoardProps) {
  return (
    <div className="flex flex-col gap-6 items-center">
      <h2 className="text-lg font-semibold">Score</h2>

      <div className="flex gap-8">
        {/* White */}
        <ScoreColumn
          label={whiteLabel}
          score={whiteScore}
          onAddIppon={() => onAddIppon("white")}
          onAddWazaari={() => onAddWazaari("white")}
          onAddYuko={() => onAddYuko("white")}
          onAddShido={() => onAddShido("white")}
          useYuko={useYuko}
        />

        {/* Blue */}
        <ScoreColumn
          label={blueLabel}
          score={blueScore}
          onAddIppon={() => onAddIppon("blue")}
          onAddWazaari={() => onAddWazaari("blue")}
          onAddYuko={() => onAddYuko("blue")}
          onAddShido={() => onAddShido("blue")}
          useYuko={useYuko}
        />
      </div>

      <button
        className="mt-4 px-4 py-2 rounded bg-red-700 text-sm"
        onClick={onReset}
      >
        Reset Score
      </button>
    </div>
  );
}

type ScoreColumnProps = {
  label: string;
  score: ScoreState;
  onAddIppon: () => void;
  onAddWazaari: () => void;
  onAddYuko: () => void;
  onAddShido: () => void;
  useYuko: boolean;
};

function ScoreColumn({
  label,
  score,
  onAddIppon,
  onAddWazaari,
  onAddYuko,
  onAddShido,
  useYuko,
}: ScoreColumnProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm uppercase">{label}</div>

      <div className="flex gap-4">
        <ScoreBox title="Ippon" value={score.ippon} />
        <ScoreBox title="Waza-ari" value={score.wazaari} />
        {useYuko && <ScoreBox title="Yuko" value={score.yuko} />}
        <ScoreBox title="Shido" value={score.shido} />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          className="px-2 py-1 rounded bg-slate-700 text-xs"
          onClick={onAddIppon}
        >
          +Ippon
        </button>
        <button
          className="px-2 py-1 rounded bg-slate-700 text-xs"
          onClick={onAddWazaari}
        >
          +Waza-ari
        </button>
        {useYuko && (
          <button
            className="px-2 py-1 rounded bg-slate-700 text-xs"
            onClick={onAddYuko}
          >
            +Yuko
          </button>
        )}
        <button
          className="px-2 py-1 rounded bg-slate-700 text-xs"
          onClick={onAddShido}
        >
          +Shido
        </button>
      </div>
    </div>
  );
}

type ScoreBoxProps = {
  title: string;
  value: number;
};

function ScoreBox({ title, value }: ScoreBoxProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs">{title}</span>
      <span className="text-3xl font-mono">{value}</span>
    </div>
  );
}
