// components/programTimer/ProgramTimerHome.tsx
"use client";

import type { Program } from "@/lib/programTimer/types";
import { expandProgramRowsToSteps } from "@/lib/programTimer/expand";

type ProgramTimerHomeProps = {
  templates: Program[];
  saved: Program[];
  onCreateNew: () => void;
  onRunProgram: (program: Program) => void;
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
};

export function ProgramTimerHome({
  templates,
  saved,
  onCreateNew,
  onRunProgram,
  onEditProgram,
  onDeleteProgram,
}: ProgramTimerHomeProps) {
  // 総時間を計算（展開してから合計）
  const calculateTotalDuration = (program: Program): number => {
    const steps = expandProgramRowsToSteps(program.rows);
    return steps.reduce((sum, step) => sum + step.duration, 0);
  };

  const formatDuration = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    return `${min}分`;
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="aspect-video w-full max-w-6xl bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Program Timer
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              練習テンプレートを選ぶか、新しいProgramを作成してください。
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            新しいProgramを作成
          </button>
        </div>

        {/* body */}
        <div className="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* テンプレート一覧 */}
          <section className="flex flex-col border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              テンプレート
            </h2>
            {templates.length === 0 ? (
              <p className="text-xs text-gray-400">
                まだテンプレートはありません。（後で追加）
              </p>
            ) : (
              <ul className="space-y-2 overflow-auto">
                {templates.map((program) => {
                  const totalSec = calculateTotalDuration(program);
                  return (
                    <li
                      key={program.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {program.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDuration(totalSec)}
                        </span>
                      </div>
                      <button
                        onClick={() => onRunProgram(program)}
                        className="rounded bg-gray-900 px-3 py-1 text-xs font-semibold text-white"
                      >
                        実行
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 保存済みProgram一覧 */}
          <section className="flex flex-col border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              保存済みProgram
            </h2>
            {saved.length === 0 ? (
              <p className="text-xs text-gray-400">
                まだ保存されたProgramはありません。
              </p>
            ) : (
              <ul className="space-y-2 overflow-auto">
                {saved.map((program) => {
                  const totalSec = calculateTotalDuration(program);
                  return (
                    <li
                      key={program.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {program.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDuration(totalSec)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRunProgram(program)}
                          className="rounded bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
                        >
                          実行
                        </button>
                        <button
                          onClick={() => onEditProgram(program)}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => onDeleteProgram(program.id)}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                        >
                          削除
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}






