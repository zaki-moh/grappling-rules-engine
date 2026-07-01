import { formatClock, positionLabel } from "@/lib/display";
import type { AnalyticsSummary, AthleteAnalytics } from "@/types/api";
import type { Position } from "@/types/types";

type AnalyticsPanelProps = {
  analytics: AnalyticsSummary | null;
  redName: string;
  blueName: string;
};

const COUNT_ROWS: { key: keyof AthleteAnalytics; label: string }[] = [
  { key: "guard_passes", label: "Guard passes" },
  { key: "sweeps", label: "Sweeps / reversals" },
  { key: "back_takes", label: "Back takes" },
  { key: "submission_attempts", label: "Submission attempts" },
  { key: "escapes", label: "Escapes" },
];

const AnalyticsPanel = ({ analytics, redName, blueName }: AnalyticsPanelProps) => {
  if (!analytics) {
    return null;
  }

  const { red, blue, time_in_position, major_transitions, estimated_points } = analytics;
  const totalControl = red.control_time_seconds + blue.control_time_seconds;
  const redControlPct = totalControl > 0 ? (red.control_time_seconds / totalControl) * 100 : 50;

  const positionEntries = Object.entries(time_in_position).sort((a, b) => b[1] - a[1]);
  const maxPositionTime = positionEntries.length ? positionEntries[0][1] : 0;

  return (
    <section className="flex w-full flex-col gap-5 rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">Match Breakdown</p>
          <p className="text-xs text-slate-500">Derived from the position timeline</p>
        </div>
        {estimated_points ? (
          <div className="rounded-2xl bg-slate-950 px-4 py-2 text-right text-white">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Est. points (high-confidence)
            </p>
            <p className="font-mono text-sm">
              {redName} {estimated_points.red} · {estimated_points.blue} {blueName}
            </p>
          </div>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
            Points: low confidence
          </span>
        )}
      </div>

      {/* Control time */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>{redName} control · {formatClock(red.control_time_seconds)}</span>
          <span>{formatClock(blue.control_time_seconds)} · {blueName} control</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="bg-rose-500" style={{ width: `${redControlPct}%` }} />
          <div className="bg-blue-500" style={{ width: `${100 - redControlPct}%` }} />
        </div>
      </div>

      {/* Per-athlete counts */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#eeece5] text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-right font-medium text-rose-700">{redName}</th>
              <th className="px-3 py-2 text-right font-medium text-blue-700">{blueName}</th>
            </tr>
          </thead>
          <tbody>
            {COUNT_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-600">{row.label}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{red[row.key]}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-900">{blue[row.key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Time in position */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          Time in position
        </p>
        <div className="flex flex-col gap-2">
          {positionEntries.map(([position, seconds]) => (
            <div key={position} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-slate-600">
                {positionLabel(position as Position)}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{ width: `${maxPositionTime ? (seconds / maxPositionTime) * 100 : 0}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-500">
                {formatClock(seconds)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {major_transitions.length} major transitions detected.
      </p>
    </section>
  );
};

export default AnalyticsPanel;
