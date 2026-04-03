import Image from "next/image";

const VideoReviewPanel = () => {
  return (
    <div className="flex min-w-0 flex-[1.6] flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">

        {/* match header */}
        <div>
          <p className="text-sm font-medium text-slate-700">Match Footage</p>
          <p className="text-xs text-slate-500">Selected event replay and full video view</p>
        </div>
        <p className="font-mono text-sm text-slate-500">01:42.35</p>
      </div>
      
      {/* Video */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
        <Image
          src="/stock.jpg"
          alt="Grappling match video placeholder"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
        <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
          Full Match View
        </div>
      </div>

      {/* Focused replay*/}
      <div className="rounded-2xl bg-slate-950 p-3 text-white">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">Focused Replay</p>
          <p className="font-mono text-xs text-slate-300">01:40 - 01:45</p>
        </div>
        <div className="relative h-32 overflow-hidden rounded-xl">
          <Image
            src="/stock.jpg"
            alt="Focused scoring event replay placeholder"
            fill
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>

      {/* Scoring timeline */}
      <div className="rounded-xl bg-slate-100 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>Scoring Timeline</span>
          <span>3 markers</span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-200">
          <span className="absolute left-[18%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-blue-500 ring-2 ring-white" />
          <span className="absolute left-[46%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-500 ring-2 ring-white" />
          <span className="absolute left-[72%] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-500 ring-2 ring-white" />
          <span className="absolute left-[46%] top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-slate-900" />
        </div>
      </div>
    </div>
  )
}

export default VideoReviewPanel
