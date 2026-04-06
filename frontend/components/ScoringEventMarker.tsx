
import React from 'react'

type ScoringEventMarkerProps = {
  positionPercent: number;
  isSelected?: boolean;
  onSelect?: () => void;
};

const ScoringEventMarker = ({ positionPercent, isSelected, onSelect }: ScoringEventMarkerProps) => {
  return (
    <button 
      className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${isSelected ? 'bg-blue-500' : 'bg-slate-500'} cursor-pointer transition-transform hover:scale-110 hover:ring-slate-300`}
      style={{ left: `${positionPercent}%` }}
      onClick={onSelect}
    />
  )
}

export default ScoringEventMarker