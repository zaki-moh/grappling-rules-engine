"use client";

import React from "react";
import {
  EVENT_TYPES,
  POSITIONS,
  REVIEW_STATUS_BADGE,
  athleteLabel,
  eventLabel,
  positionLabel,
} from "@/lib/display";
import type { EventReviewRequest, SegmentReviewRequest } from "@/types/api";
import type {
  CompetitorSide,
  DisplayEvent,
  DisplaySegment,
  EventType,
  Position,
} from "@/types/types";

type SelectedItemPanelProps = {
  selectedEvent: DisplayEvent | null;
  selectedSegment: DisplaySegment | null;
  isSaving: boolean;
  error: string | null;
  onEventReview: (payload: EventReviewRequest) => void;
  onSegmentReview: (payload: SegmentReviewRequest) => void;
};

const athleteFromSelect = (value: string): CompetitorSide | null =>
  value === "red" || value === "blue" ? value : null;

const SELECT_CLASS =
  "w-full rounded-2xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

const SelectedItemPanel = ({
  selectedEvent,
  selectedSegment,
  isSaving,
  error,
  onEventReview,
  onSegmentReview,
}: SelectedItemPanelProps) => {
  // Local correction form, reset whenever the selected item changes.
  const [eventType, setEventType] = React.useState<EventType>("guard_pass");
  const [eventAthlete, setEventAthlete] = React.useState<string>("");
  const [position, setPosition] = React.useState<Position>("standing");
  const [topAthlete, setTopAthlete] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("");

  const selectionKey = selectedEvent
    ? `event-${selectedEvent.id}`
    : selectedSegment
      ? `segment-${selectedSegment.id}`
      : "none";

  React.useEffect(() => {
    if (selectedEvent) {
      setEventType(selectedEvent.event_type);
      setEventAthlete(selectedEvent.athlete ?? "");
      setNote(selectedEvent.review_note);
    } else if (selectedSegment) {
      setPosition(selectedSegment.position);
      setTopAthlete(selectedSegment.top_athlete ?? "");
      setNote(selectedSegment.review_note);
    }
  }, [selectionKey, selectedEvent, selectedSegment]);

  const item = selectedEvent ?? selectedSegment;

  if (!item) {
    return (
      <aside className="flex w-full flex-col gap-3 rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur lg:max-w-sm xl:max-w-md">
        <p className="text-sm font-semibold text-slate-950">Selected Item</p>
        <p className="text-sm text-slate-500">
          Select an event marker or a position segment to review and correct it.
        </p>
      </aside>
    );
  }

  const heading = selectedEvent
    ? eventLabel(selectedEvent.event_type)
    : positionLabel(selectedSegment!.position);

  return (
    <aside className="flex w-full flex-col gap-5 rounded-3xl bg-white/90 p-5 shadow-xl ring-1 ring-black/10 backdrop-blur lg:max-w-sm xl:max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">
            {selectedEvent ? "Selected Event" : "Selected Segment"}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
          <p className="text-sm text-slate-500">
            Confirm the detection, or correct it to feed future training data.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${REVIEW_STATUS_BADGE[item.review_status]}`}
        >
          {item.review_status}
        </span>
      </div>

      {/* Detail summary */}
      <div className="rounded-2xl bg-[#eeece5] p-4 ring-1 ring-black/5">
        {selectedEvent ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Athlete" value={athleteLabel(selectedEvent.athlete)} />
            <Detail label="Timestamp" value={selectedEvent.timestamp} mono />
            <Detail label="From" value={positionLabel(selectedEvent.from_position)} />
            <Detail label="To" value={positionLabel(selectedEvent.to_position)} />
            <Detail
              label="Confidence"
              value={`${(selectedEvent.confidence * 100).toFixed(0)}%`}
            />
            <Detail label="Replay" value={selectedEvent.replay_window} mono />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Top athlete" value={athleteLabel(selectedSegment!.top_athlete)} />
            <Detail label="Window" value={selectedSegment!.timeRange} mono />
            <Detail
              label="Confidence"
              value={`${(selectedSegment!.confidence * 100).toFixed(0)}%`}
            />
          </div>
        )}
      </div>

      {/* Quick decisions */}
      <div className="rounded-2xl bg-[#f8f4ec] p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold text-slate-950">Reviewer Actions</p>
        <p className="mt-1 text-xs text-slate-500">
          Confirm an accurate detection, reset to pending, or reject a false positive.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() =>
              selectedEvent
                ? onEventReview({ review_status: "confirmed" })
                : onSegmentReview({ review_status: "confirmed" })
            }
          >
            {isSaving ? "Saving..." : "Confirm"}
          </button>
          {selectedEvent ? (
            <button
              type="button"
              className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              onClick={() => onEventReview({ review_status: "rejected" })}
            >
              Reject
            </button>
          ) : (
            <span />
          )}
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving || item.review_status === "pending"}
          onClick={() =>
            selectedEvent
              ? onEventReview({ review_status: "pending" })
              : onSegmentReview({ review_status: "pending" })
          }
        >
          Reset to Pending
        </button>
      </div>

      {/* Correction form */}
      <div className="rounded-2xl border border-dashed border-slate-300 bg-[#eeece5] p-4">
        <p className="text-sm font-semibold text-slate-900">Correct Detection</p>
        <div className="mt-3 grid gap-3">
          {selectedEvent ? (
            <>
              <Field label="Event type">
                <select
                  className={SELECT_CLASS}
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value as EventType)}
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {eventLabel(type)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Athlete">
                <select
                  className={SELECT_CLASS}
                  value={eventAthlete}
                  onChange={(event) => setEventAthlete(event.target.value)}
                >
                  <option value="">Unclear</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Position">
                <select
                  className={SELECT_CLASS}
                  value={position}
                  onChange={(event) => setPosition(event.target.value as Position)}
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {positionLabel(pos)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Top athlete">
                <select
                  className={SELECT_CLASS}
                  value={topAthlete}
                  onChange={(event) => setTopAthlete(event.target.value)}
                >
                  <option value="">None</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                </select>
              </Field>
            </>
          )}

          <textarea
            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Optional note for this correction."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() =>
              selectedEvent
                ? onEventReview({
                    review_status: "corrected",
                    corrected_event_type: eventType,
                    corrected_athlete: athleteFromSelect(eventAthlete),
                    review_note: note || null,
                  })
                : onSegmentReview({
                    review_status: "corrected",
                    corrected_position: position,
                    corrected_top_athlete: athleteFromSelect(topAthlete),
                    review_note: note || null,
                  })
            }
          >
            Save Correction
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 ring-1 ring-rose-100">
          {error}
        </p>
      ) : null}
    </aside>
  );
};

const Detail = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-1 font-medium text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>
      {value}
    </p>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <div className="mt-1.5">{children}</div>
  </label>
);

export default SelectedItemPanel;
