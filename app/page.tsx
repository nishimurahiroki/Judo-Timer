// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Hero セクション */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          All-in-one Judo Timer App
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
            Gatame Judo Timer
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl">
            Judo matches, Kosen Judo rules, and training programs.
            One web app to run your competitions and practice sessions,
            both on PC and mobile.
          </p>
        </div>

        {/* メインCTAボタン群 */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/judo"
            className="rounded-lg bg-white text-black text-sm sm:text-base px-4 py-2 font-medium hover:bg-neutral-100 transition"
          >
            Start Judo Timer
          </Link>
          <Link
            href="/kosen"
            className="rounded-lg border border-neutral-600 text-sm sm:text-base px-4 py-2 font-medium hover:bg-neutral-800 transition"
          >
            Start Kosen Timer
          </Link>
          <Link
            href="/program"
            className="rounded-lg border border-emerald-500/70 text-emerald-300 text-sm sm:text-base px-4 py-2 font-medium hover:bg-emerald-500/10 transition"
          >
            Open Program Timer
          </Link>
        </div>
      </section>

      {/* 機能カード 3枚 */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Choose your timer
        </h2>
        <p className="text-sm text-neutral-300">
          Use different timers for different situations: matches, Kosen rules,
          and structured training menus.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {/* JudoTimer */}
          <Link
            href="/judo"
            className="group rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-neutral-500 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">
                Judo Timer
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300">
                Standard judo match timer with 16:9 layout,
                match time control, and score sounds (Ippon, Waza-ari, etc.).
              </p>
            </div>
            <span className="mt-3 inline-flex items-center text-xs text-neutral-300 group-hover:text-white">
              Open &rarr;
            </span>
          </Link>

          {/* KosenTimer */}
          <Link
            href="/kosen"
            className="group rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-neutral-500 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">
                Kosen Timer
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300">
                Timer tuned for Kosen Judo rules.
                Same 16:9 match screen with Kosen-specific settings.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center text-xs text-neutral-300 group-hover:text-white">
              Open &rarr;
            </span>
          </Link>

          {/* ProgramTimer */}
          <Link
            href="/program"
            className="group rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 hover:border-emerald-500/70 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-semibold">
                Program Timer
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300">
                Create training menus that auto-run step by step.
                Save them to your browser and reuse anytime.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center text-xs text-emerald-300 group-hover:text-emerald-100">
              Open &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* Help への導線 */}
      <section className="space-y-3 border-t border-neutral-900 pt-6">
        <h2 className="text-lg sm:text-xl font-semibold">
          Need help?
        </h2>
        <p className="text-sm text-neutral-300">
          Basic usage, recommended settings, and tips for matches and
          practice sessions are summarized in the help page.
        </p>
        <Link
          href="/help"
          className="inline-flex items-center text-sm text-emerald-300 hover:text-emerald-100"
        >
          Open Help page &rarr;
        </Link>
      </section>
    </div>
  );
}
