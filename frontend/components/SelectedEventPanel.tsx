import { ScoringEvent } from "@/types/types";

type SelectedEventPanelProps = {
  scoringEvent: ScoringEvent | null;
  isSavingReview: boolean;
  reviewError: string | null;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
  onNoteChange: (note: string) => void;
};

const SelectedEventPanel = ({
  scoringEvent,
  isSavingReview,
  reviewError,
  onAccept,
  onReject,
  onReset,
  onNoteChange,
}: SelectedEventPanelProps) => {
  const reviewStatusColors = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };

  const displayTeam = scoringEvent?.team
    ? scoringEvent.team.charAt(0).toUpperCase() + scoringEvent.team.slice(1)
    : "";

  return (
    <aside className="flex w-full flex-col gap-5 rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur lg:max-w-sm xl:max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">Selected Event</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {scoringEvent?.event_type}
          </h2>
          <p className="text-sm text-slate-500">
            Review the detected action before confirming points.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${reviewStatusColors[scoringEvent?.review_status as keyof typeof reviewStatusColors] || "bg-slate-100 text-slate-800"}`}>
          {scoringEvent?.review_status}
        </span>
      </div>

      <div className="rounded-2xl bg-[#eeece5] p-4 ring-1 ring-black/5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Event Summary</p>
          <p className="font-mono text-xs text-slate-500">{scoringEvent?.timestamp}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Competitor</p>
            <p className="mt-1 font-medium text-slate-900">
              {displayTeam}
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Points</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent?.points} Proposed
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Position</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent?.position}
            </p>
          </div>
          <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent ? (scoringEvent.confidence * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-sm ring-1 ring-black/10">
        <p className="mb-3 text-sm font-semibold text-white">Reviewer Actions</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onAccept}
            disabled={!scoringEvent || isSavingReview}
          >
            {isSavingReview ? "Saving..." : "Accept Event"}
          </button>
          <button
            type="button"
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onReject}
            disabled={!scoringEvent || isSavingReview}
          >
            Reject Event
          </button>
          <button
            type="button"
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onReset}
            disabled={!scoringEvent || isSavingReview || scoringEvent.review_status === "pending"}
          >
            Reset to Pending
          </button>
          {reviewError ? (
            <p className="text-sm text-rose-200">{reviewError}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-[#eeece5] p-4">
        <p className="text-sm font-semibold text-slate-900">Review Note</p>
        <textarea
          className="mt-3 min-h-28 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Add reviewer feedback, corrections, or context for this event."
          value={scoringEvent?.review_note ?? ""}
          onChange={(event) => onNoteChange(event.target.value)}
          disabled={!scoringEvent || isSavingReview}
        />
      </div>
    </aside>
  );
};

export default SelectedEventPanel;
