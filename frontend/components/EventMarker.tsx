import { REVIEW_STATUS_DOT } from "@/lib/display";
import type { ReviewStatus } from "@/types/types";

type EventMarkerProps = {
  positionPercent: number;
  review_status: ReviewStatus;
  isSelected?: boolean;
  title?: string;
  onSelect?: () => void;
};

const EventMarker = ({
  positionPercent,
  review_status,
  isSelected,
  title,
  onSelect,
}: EventMarkerProps) => {
  return (
    <button
      type="button"
      title={title}
      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${REVIEW_STATUS_DOT[review_status]} ${
        isSelected ? "scale-125 ring-4 ring-slate-950/20 shadow-sm" : ""
      } cursor-pointer transition-transform hover:scale-110`}
      style={{ left: `${positionPercent}%` }}
      onClick={onSelect}
    />
  );
};

export default EventMarker;
