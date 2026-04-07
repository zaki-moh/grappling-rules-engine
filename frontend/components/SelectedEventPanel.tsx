import { ScoringEvent } from "@/types/types";

type SelectedEventPanelProps = {
  scoringEvent: ScoringEvent | null;
  onAccept: () => void;
  onReject: () => void;
};

const SelectedEventPanel = ({ scoringEvent, onAccept, onReject }: SelectedEventPanelProps) => {

  const reviewStatusColors = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
  };

  return (
    <aside className="flex w-full flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:max-w-sm xl:max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">Selected Event</p>
          <h2 className="text-xl font-semibold text-slate-900">
            {scoringEvent?.eventType}
          </h2>
          <p className="text-sm text-slate-500">
            Review the detected action before confirming points.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${reviewStatusColors[scoringEvent?.reviewStatus as keyof typeof reviewStatusColors] || "bg-slate-100 text-slate-800"}`}>
          {scoringEvent?.reviewStatus}
        </span>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Event Summary</p>
          <p className="font-mono text-xs text-slate-500">{scoringEvent?.timestamp}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Competitor</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent?.competitor}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Points</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent?.points} Proposed
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Position</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent?.position}
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
            <p className="mt-1 font-medium text-slate-900">
              {scoringEvent ? (scoringEvent.confidence * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Reviewer Actions</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
            onClick={onAccept}
          >
            Accept Event
          </button>
          <button
            type="button"
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
            onClick={onReject}
          >
            Reject Event
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Review Note</p>
        <p className="mt-2 text-sm text-slate-500">
          Add reviewer feedback here later when we connect the real review workflow.
        </p>
      </div>
    </aside>
  );
};

export default SelectedEventPanel;