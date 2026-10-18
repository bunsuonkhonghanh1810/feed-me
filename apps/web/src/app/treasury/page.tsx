"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const TreasuryContent = dynamic(
  () => import("@/components/TreasuryContent").then((mod) => mod.TreasuryContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-canteen-amber" />
        <p className="text-xs text-stone-500 font-semibold">Đang tải Quỹ Căn-tin Cardano...</p>
      </div>
    ),
  }
);

export default function TreasuryPage() {
  return <TreasuryContent />;
}
