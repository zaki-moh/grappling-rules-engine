'use client'
import Link from "next/link";
import { startMatchAnalysis, createMatch, getRulesets, uploadMatchVideo } from '@/app/api'
import type { Ruleset } from "@/types/api";
import React from "react";
import { useRouter } from "next/navigation";

type SetupFeedback = {
  tone: "error" | "success";
  message: string;
} | null;


type RulesetCard = Ruleset & {
  meta: string;
};

const buildRulesetCards = (rulesets: Ruleset[]): RulesetCard[] => {
  return rulesets.map((ruleset) => ({
    ...ruleset,
    meta: ruleset.type === "system" ? "Tournament standard" : "Gym configurable",
  }));
};


const NewMatchPage = () => {

  const [selectedRulesetId, setSelectedRulesetId] = React.useState("ibjjf");
  const [redCompetitor, setRedCompetitor] = React.useState("");
  const [blueCompetitor, setBlueCompetitor] = React.useState("");
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [isSavingReview, setIsSavingReview] = React.useState(false);
  const [setupFeedback, setSetupFeedback] = React.useState<SetupFeedback>(null);
  const [rulesets, setRulesets] = React.useState<RulesetCard[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const loadRulesets = async () => {
      try {
        const response = await getRulesets();
        const rulesetCards = buildRulesetCards(response.rulesets);

        setRulesets(rulesetCards);
        setSelectedRulesetId(rulesetCards[0]?.id ?? "");
      } catch {
        setSetupFeedback({
          tone: "error",
          message: "We could not load rulesets. Please refresh and try again.",
        });
      }
    };

    loadRulesets();
  }, []);
  
  const handleAnalysisStart = async () => {
    
    if (isSavingReview) {
      return;
    }

    const redCompetitorName = redCompetitor.trim();
    const blueCompetitorName = blueCompetitor.trim();

    if (!selectedRulesetId) {
      setSetupFeedback({
        tone: "error",
        message: "Choose a ruleset before starting analysis.",
      });
      return;
    }

    if (!redCompetitorName && !blueCompetitorName) {
      setSetupFeedback({
        tone: "error",
        message: "Enter names for both competitors before starting analysis.",
      });
      return;
    }

    if (!redCompetitorName) {
      setSetupFeedback({
        tone: "error",
        message: "Enter a name for the red competitor before starting analysis.",
      });
      return;
    }

    if (!blueCompetitorName) {
      setSetupFeedback({
        tone: "error",
        message: "Enter a name for the blue competitor before starting analysis.",
      });
      return;
    }

    if (!videoFile) {
      setSetupFeedback({
        tone: "error",
        message: "Attach match footage before starting analysis.",
      });
      return;
    }

    try {
      setIsSavingReview(true);
      setSetupFeedback(null);

      const createdMatch = await createMatch({
        ruleset_id: selectedRulesetId,
        red_competitor: redCompetitorName,
        blue_competitor: blueCompetitorName,
      });

      await uploadMatchVideo(createdMatch.match.id, videoFile);
      await startMatchAnalysis(createdMatch.match.id);
      setSetupFeedback({
        tone: "success",
        message: "Match created and analysis started. The review workspace is being prepared.",
      });
      router.push(`/matches/${createdMatch.match.id}`);
    } catch (error) {
      setSetupFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not start analysis. Please try again.",
      });
    } finally {
      setIsSavingReview(false);
    } 
  };

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
                {["Configure ruleset", "Name red and blue corners", "Attach footage", "Start analysis"].map(
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
                  {rulesets.map((ruleset) => (
                    <button
                      key={ruleset.id}
                      type="button"
                      onClick={() => setSelectedRulesetId(ruleset.id)}
                      className={`group rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                        ruleset.id === selectedRulesetId
                          ? "border-slate-950 bg-slate-950 text-white shadow-md"
                          : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      <span className={ruleset.id === selectedRulesetId ? "text-xs font-medium text-blue-200" : "text-xs font-medium text-slate-500"}>
                        {ruleset.meta}
                      </span>
                      <span className="mt-3 block text-lg font-semibold">{ruleset.name}</span>
                      <span className={ruleset.id === selectedRulesetId ? "mt-3 block text-sm leading-6 text-blue-200" : "mt-3 block text-sm leading-6 text-slate-600"}>
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
                      onChange={(e) => setRedCompetitor(e.target.value)}
                    />
                  </label>

                  <label className="block rounded-3xl bg-blue-50 p-4 ring-1 ring-blue-100">
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Blue competitor
                    </span>
                    <input
                      className="mt-3 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      placeholder="e.g. Athlete B"
                      onChange={(e) => setBlueCompetitor(e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-950">Footage</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Attach the match video that the backend analysis pipeline should inspect.
                </p>
                <label className="mt-4 block cursor-pointer overflow-hidden rounded-3xl bg-slate-950 p-4 text-white shadow-sm ring-1 ring-black/10">
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setVideoFile(file);
                    }}
                  />

                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-6">
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-8 text-center ring-1 ring-white/10">
                      <div className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-950">
                        Match Video
                      </div>
                      <p className="mt-4 text-sm font-medium text-white">
                        {videoFile ? videoFile.name : "Drop match footage here"}
                      </p>

                      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                        {videoFile
                          ? "Video selected. It will upload when analysis starts."
                          : "Click to choose a video file or drag one here later."}
                      </p>

                      <div className="mt-6 flex w-full max-w-md items-center gap-2">
                        <span className="h-2 flex-1 rounded-full bg-rose-500/80" />
                        <span className="h-2 flex-[1.4] rounded-full bg-slate-700" />
                        <span className="h-2 flex-1 rounded-full bg-blue-500/80" />
                      </div>
                    </div>
                  </div>
                </label>
              </section>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-md">
                  <p className="text-sm leading-6 text-slate-500">
                    Next step: create the match, start analysis, then route into the review workspace.
                  </p>
                  {setupFeedback ? (
                    <p
                      className={`mt-3 rounded-2xl px-4 py-3 text-sm font-medium ring-1 ${
                        setupFeedback.tone === "error"
                          ? "bg-rose-50 text-rose-900 ring-rose-100"
                          : "bg-emerald-50 text-emerald-900 ring-emerald-100"
                      }`}
                      role={setupFeedback.tone === "error" ? "alert" : "status"}
                    >
                      {setupFeedback.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isSavingReview}
                  className={`rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition ${
                    isSavingReview
                      ? "cursor-not-allowed bg-slate-500 opacity-80"
                      : "bg-slate-950 hover:-translate-y-0.5 hover:bg-slate-800"
                  }`}
                  onClick={handleAnalysisStart}
                >
                  {isSavingReview ? "Starting analysis..." : "Start Analysis"}
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
