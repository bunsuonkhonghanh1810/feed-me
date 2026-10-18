"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ImpactBanner } from "@/components/ImpactBanner";
import { CategoryFilters, CategoryFilter } from "@/components/CategoryFilters";
import { ProposalCard } from "@/components/ProposalCard";
import { MOCK_PROPOSALS, Proposal } from "@/data/mockProposals";
import { UtensilsCrossed, ShieldCheck } from "lucide-react";

const VoteModal = dynamic(
  () => import("@/components/VoteModal").then((mod) => mod.VoteModal),
  { ssr: false }
);

export default function HomePage() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  const filteredProposals = proposals.filter((p) => {
    if (activeCategory === "all") return true;
    return p.category === activeCategory;
  });

  const handleOpenVote = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsVoteModalOpen(true);
  };

  const handleVoteSuccess = (proposalId: string, tokens: number, power: number) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          return {
            ...p,
            yesVotesSqrt: p.yesVotesSqrt + power,
            totalVotesSqrt: p.totalVotesSqrt + power,
            voterCount: p.voterCount + 1,
          };
        }
        return p;
      })
    );
  };

  return (
    <main className="flex flex-col gap-5 pt-4 pb-12">
      {/* 1. Top Impact Banner */}
      <ImpactBanner />

      {/* 2. Filter Category Chips */}
      <CategoryFilters
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* 3. Section Title */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-base font-extrabold text-deep-navy flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-canteen-amber" />
          <span>Đơn Chờ Duyệt Lương Thực</span>
        </h2>
        <span className="text-xs font-semibold text-stone-500">
          {filteredProposals.length} đề xuất
        </span>
      </div>

      {/* 4. Proposals Feed Stream */}
      <div className="flex flex-col gap-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={handleOpenVote}
          />
        ))}
      </div>

      {/* 5. Quadratic Voting Modal */}
      <VoteModal
        proposal={selectedProposal}
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        onVoteSuccess={handleVoteSuccess}
      />

      {/* 6. Footer Tech Stack Note */}
      <footer className="text-center text-xs text-stone-400 pt-6 flex items-center justify-center gap-1.5 pb-8">
        <ShieldCheck className="w-4 h-4 text-fresh-mint" />
        <span>Bảo mật bởi Aiken Plutus V3 & MeshJS • Cardano Preview</span>
      </footer>
    </main>
  );
}
