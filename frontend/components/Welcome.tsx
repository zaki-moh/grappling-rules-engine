import Link from "next/link";

const Welcome = () => {
  const rulesets = ["IBJJF", "ADCC", "EBI", "Custom"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#eeece5] bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-3xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-950">
            Grappling Rules Engine
          </Link>
          <Link
            href="/matches/new"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Start Match
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-18">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Reviewable scoring desk for grappling footage
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Score grappling footage with confidence.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Choose a ruleset, analyze match footage, and review every
              detected scoring event before the score becomes final.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/matches/new"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Get Started
              </Link>
              <Link
                href="/matches/1"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Open Review Demo
              </Link>
            </div>
          </div>

          <div className="relative min-h-[34rem] rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl ring-1 ring-black/10">
            <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
              <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
              <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute inset-x-8 top-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            <div className="relative flex h-full min-h-[31rem] flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Tournament Engine</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Rules-aware scoring review
                  </p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10">
                  Processing
                </div>
              </div>

              <div className="relative my-auto flex min-h-80 items-center justify-center">
                <div className="absolute h-64 w-64 rounded-full border border-white/10" />
                <div className="absolute h-44 w-44 rounded-full border border-white/10" />
                <div className="ruleset-orbit absolute h-64 w-64">
                  {rulesets.map((ruleset, index) => (
                    <span
                      key={ruleset}
                      className="ruleset-orbit-label absolute rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg"
                      style={{
                        left: index === 0 || index === 2 ? "50%" : index === 1 ? "100%" : "0%",
                        top: index === 1 || index === 3 ? "50%" : index === 0 ? "0%" : "100%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {ruleset}
                    </span>
                  ))}
                </div>

                <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white text-center text-slate-950 shadow-2xl">
                  <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                    Score
                  </span>
                  <span className="mt-2 text-2xl font-semibold">Engine</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Proposed
                  </p>
                  <p className="mt-2 text-2xl font-semibold">7 - 4</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Events
                  </p>
                  <p className="mt-2 text-2xl font-semibold">12</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <p className="mt-2 text-2xl font-semibold">Review</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          {[
            ["01", "Create Match", "Pick a ruleset and name the competitors before analysis starts."],
            ["02", "Run Analysis", "Use the pipeline to generate proposed scoring events from footage."],
            ["03", "Review Score", "Accept, reject, reset, and annotate events before confirming the score."],
          ].map(([step, title, description]) => (
            <article
              key={step}
              className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur"
            >
              <p className="text-xs font-semibold text-slate-400">{step}</p>
              <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Welcome;
