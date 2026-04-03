import VideoReviewPanel from '@/components/VideoReviewPanel'
import React from 'react'

const page = () => {
  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 flex flex-col gap-6 p-6">
        <header className="gap-2">
            <h1 className="text-2xl font-semibold">Match Review</h1>
            <p className="text-sm text-slate-600">Red vs Blue • IBJJF</p>
        </header>
        <div>
          <VideoReviewPanel />
        </div>
    </main>
  )
}

export default page