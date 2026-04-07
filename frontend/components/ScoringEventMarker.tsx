
import React from 'react'

type ScoringEventMarkerProps = {
  positionPercent: number;
  reviewStatus: "pending" | "accepted" | "rejected";
  isSelected?: boolean;
  onSelect?: () => void;
};

const ScoringEventMarker = ({ positionPercent, reviewStatus, isSelected, onSelect }: ScoringEventMarkerProps) => {
  
  const reviewStatusColors = {
    pending: "bg-slate-500",
    accepted: "bg-emerald-500",
    rejected: "bg-rose-500",
  };


  return (
    <button 
      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${reviewStatus && reviewStatusColors[reviewStatus]} ${isSelected ? 'scale-125 ring-4 ring-slate-900/15 shadow-sm' : ''} cursor-pointer transition-transform hover:scale-110 hover:ring-slate-300`}
      style={{ left: `${positionPercent}%` }}
      onClick={onSelect}
    />
  )
}

export default ScoringEventMarker