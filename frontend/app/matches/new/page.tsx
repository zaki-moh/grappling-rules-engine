import Link from "next/link";

const rulesets = [
  {
    id: "ibjjf",
    name: "IBJJF",
    description: "Gi and no-gi scoring with advantages, penalties, and positional points.",
    meta: "Tournament standard",
  },
  {
    id: "adcc",
    name: "ADCC",
    description: "Submission grappling rules with points windows and control emphasis.",
    meta: "Submission grappling",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Flexible setup for gyms, superfights, and experimental formats.",
    meta: "Gym configurable",
  },
];

const NewMatchPage = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eeece5] text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute -left-24 top-32 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="absolute -right-24 bottom-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-3xl bg-white/90 px-5 py-4 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-950">
            Grappling Rules Engine
          </Link>
          <Link
            href="/"
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
          >
            Back Home
          </Link>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:py-14">
          <div className="lg:sticky lg:top-8">
            <p className="mb-4 inline-flex rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white shadow-sm">
              Tournament intake desk
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Prepare the bout before the scoring engine starts.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Choose the ruleset, label each corner, and attach footage. The
              review workspace will use this match setup to load events,
              timestamps, and confirmed score summaries from the backend.
            </p>

            <div className="mt-8 rounded-3xl bg-white/85 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">What happens next</p>
                  <p className="mt-1 text-sm text-slate-500">
                    A quick setup path for coaches, gyms, and event operators.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  4 steps
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {["Choose ruleset", "Name red and blue corners", "Attach footage", "Start analysis"].map(
                  (item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-rose-50 p-4 shadow-sm ring-1 ring-rose-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                  Red corner
                </p>
                <p className="mt-2 text-sm text-rose-950">Score-side identity</p>
              </div>
              <div className="rounded-3xl bg-blue-50 p-4 shadow-sm ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Blue corner
                </p>
                <p className="mt-2 text-sm text-blue-950">Review-side identity</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-black/10 sm:p-6">
            <div className="absolute inset-x-0 top-0 flex h-2">
              <div className="flex-1 bg-rose-500" />
              <div className="flex-1 bg-blue-500" />
            </div>

            <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 pt-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Match intake</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Styled only for now. The backend workflow will be wired next.
                </p>
              </div>
              <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Draft setup
              </span>
            </div>

            <div className="mt-6 space-y-8">
              <section>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">Ruleset</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Pick the scoring rules the analysis pipeline should apply.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {rulesets.map((ruleset, index) => (
                    <button
                      key={ruleset.id}
                      type="button"
                      className={`group rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        index === 0
                          ? "border-slate-950 bg-slate-950 text-white shadow-md"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <span className={index === 0 ? "text-xs font-medium text-blue-200" : "text-xs font-medium text-slate-500"}>
                        {ruleset.meta}
                      </span>
                      <span className="mt-3 block text-lg font-semibold">{ruleset.name}</span>
                      <span className={index === 0 ? "mt-3 block text-sm leading-6 text-slate-300" : "mt-3 block text-sm leading-6 text-slate-600"}>
                        {ruleset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-950">Competitors</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Label the corners the same way the review desk and score cards will.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-100">
                    <span className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                      Red competitor
                    </span>
                    <input
                      className="mt-3 w-full rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. Athlete A"
                    />
                  </label>

                  <label className="block rounded-3xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Blue competitor
                    </span>
                    <input
                      className="mt-3 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Athlete B"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-950">Footage</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Upload will be wired later. This placeholder shows the future video intake surface.
                </p>
                <div className="mt-4 overflow-hidden rounded-3xl bg-slate-950 p-4 text-white shadow-sm ring-1 ring-black/10">
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6">
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-8 text-center ring-1 ring-white/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950">
                        MP4
                      </div>
                      <p className="mt-4 text-sm font-medium text-white">
                        Drop match footage here
                      </p>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                        Future support for uploads, timestamps, and analysis job status.
                      </p>
                      <div className="mt-6 flex w-full max-w-md items-center gap-2">
                        <span className="h-2 flex-1 rounded-full bg-rose-500/80" />
                        <span className="h-2 flex-[1.4] rounded-full bg-slate-700" />
                        <span className="h-2 flex-1 rounded-full bg-blue-500/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-sm leading-6 text-slate-500">
                  Next step: create the match, start analysis, then route into the review workspace.
                </p>
                <button
                  type="button"
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default NewMatchPage;
