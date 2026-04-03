const SelectedEventPanel = () => {
  return (
    <aside className="flex w-full flex-col gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:max-w-sm xl:max-w-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">Selected Event</p>
          <h2 className="text-xl font-semibold text-slate-900">Guard Pass</h2>
          <p className="text-sm text-slate-500">Review the detected action before confirming points.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          Pending
        </span>
      </div>


      {/* Event summary */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Event Summary</p>
          <p className="font-mono text-xs text-slate-500">01:42.35</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Competitor</p>
            <p className="mt-1 font-medium text-slate-900">Blue</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Points</p>
            <p className="mt-1 font-medium text-slate-900">3 Proposed</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Position</p>
            <p className="mt-1 font-medium text-slate-900">Side Control</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confidence</p>
            <p className="mt-1 font-medium text-slate-900">89%</p>
          </div>
        </div>
      </div>

      {/* Reviewer actions */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Reviewer Actions</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Accept Event
          </button>
          <button
            type="button"
            className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Reject Event
          </button>
        </div>
      </div>


      {/* Review notes */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Review Note</p>
        <p className="mt-2 text-sm text-slate-500">
          Add reviewer feedback here later when we connect the real review workflow.
        </p>
      </div>
    </aside>
  )
}

export default SelectedEventPanel
