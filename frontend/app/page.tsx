import Link from "next/link";
import React from "react";

export default function Home() {

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Link
        href="/matches/1"
        className="rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
      >
        Review
      </Link>
      <Link
        href="/matches/1"
        className="pt-4 rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800"
      >
        Selected
      </Link>
    </div>
  );
}
