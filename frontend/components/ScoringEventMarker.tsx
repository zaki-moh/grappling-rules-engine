
import React from 'react'

type ScoringEventMarkerProps = {
  positionPercent: number;
  review_status: "pending" | "accepted" | "rejected";
  isSelected?: boolean;
  onSelect?: () => void;
};

const ScoringEventMarker = ({ positionPercent, review_status, isSelected, onSelect }: ScoringEventMarkerProps) => {
  
  const reviewStatusColors = {
    pending: "bg-slate-500",
    accepted: "bg-emerald-500",
    rejected: "bg-rose-500",
  };


  return (
    <button 
      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#eeece5] ${reviewStatusColors[review_status]} ${isSelected ? 'scale-125 ring-4 ring-slate-950/20 shadow-sm' : ''} cursor-pointer transition-transform hover:scale-110 hover:ring-slate-400`}
      style={{ left: `${positionPercent}%` }}
      onClick={onSelect}
    />
  )
}

export default ScoringEventMarker
