"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const VotesContent = dynamic(
  () => import("@/components/VotesContent").then((mod) => mod.VotesContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-canteen-amber" />
        <p className="text-xs text-stone-500 font-semibold">Đang tải danh sách vé vote...</p>
      </div>
    ),
  }
);

export default function VotesPage() {
  return <VotesContent />;
}
