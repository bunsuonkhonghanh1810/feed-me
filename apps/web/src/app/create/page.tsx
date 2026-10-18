"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const CreateProposalContent = dynamic(
  () =>
    import("@/components/CreateProposalContent").then(
      (mod) => mod.CreateProposalContent
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-canteen-amber" />
        <p className="text-xs text-stone-500 font-semibold">
          Đang tải biểu mẫu đề xuất...
        </p>
      </div>
    ),
  }
);

export default function CreateProposalPage() {
  return <CreateProposalContent />;
}
