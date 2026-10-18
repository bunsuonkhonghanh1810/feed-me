"use client";

import React from "react";
import { Proposal } from "@/data/mockProposals";
import { CheckCircle2, Clock, Coins, Vote, Users } from "lucide-react";

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposal: Proposal) => void;
}

export function ProposalCard({ proposal, onVote }: ProposalCardProps) {
  const consensusPercent =
    proposal.totalVotesSqrt > 0
      ? Math.round((proposal.yesVotesSqrt / proposal.totalVotesSqrt) * 100)
      : 0;

  const isConsensusReached = consensusPercent >= 75;

  return (
    <article className="bg-white rounded-3xl p-4 shadow-[0_4px_16px_-2px_rgba(29,53,87,0.06)] border border-stone-100 flex flex-col gap-3">
      {/* Creator Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={proposal.creator.avatar}
            alt={proposal.creator.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-canteen-amber/30"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm text-deep-navy truncate">
                {proposal.creator.name}
              </span>
              {proposal.creator.verified && (
                <CheckCircle2 className="w-4 h-4 text-fresh-mint fill-fresh-mint/20 shrink-0" />
              )}
            </div>
            <span className="text-[11px] text-stone-400 block truncate">
              {proposal.creator.campus}
            </span>
          </div>
        </div>

        {/* Time Remaining Badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold shrink-0">
          <Clock className="w-3 h-3" />
          <span>Còn {proposal.deadlineHours}h</span>
        </span>
      </div>

      {/* Media Image with Target Overlay */}
      <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-stone-100">
        <img
          src={proposal.image}
          alt={proposal.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2 left-2 bg-deep-navy/85 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
          <Coins className="w-3.5 h-3.5 text-canteen-amber" />
          <span>
            Mục tiêu: {proposal.requestedAda} ADA (~{proposal.estimatedMeals} suất)
          </span>
        </div>
      </div>

      {/* Proposal Title & Description */}
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base text-deep-navy leading-snug">
          {proposal.title}
        </h3>
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {proposal.description}
        </p>
      </div>

      {/* Quadratic Voting Progress Bar */}
      <div className="bg-surface-container-low rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-stone-500 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{proposal.voterCount} sinh viên đã vote</span>
          </div>
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
              isConsensusReached
                ? "bg-fresh-mint/20 text-emerald-800"
                : "bg-canteen-amber/20 text-amber-900"
            }`}
          >
            {isConsensusReached ? "Đạt điều kiện (≥75%)" : "Cần thêm vote"}
          </span>
        </div>

        {/* Progress meter */}
        <div className="relative w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isConsensusReached ? "bg-fresh-mint" : "bg-canteen-amber"
            }`}
            style={{ width: `${Math.min(consensusPercent, 100)}%` }}
          />
          {/* 75% threshold guide line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-deep-navy/50 z-10"
            style={{ left: "75%" }}
            title="Mức tối thiểu giải ngân: 75%"
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-stone-400 font-medium">
          <span>Đồng thuận: <strong className="text-deep-navy font-bold">{consensusPercent}%</strong></span>
          <span>Ngưỡng Plutus: 75%</span>
        </div>
      </div>

      {/* Vote CTA Button */}
      <button
        onClick={() => onVote(proposal)}
        className="w-full h-11 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-1.5"
      >
        <Vote className="w-4 h-4 text-deep-navy" />
        <span>Bỏ phiếu bằng $FEED (Quadratic Voting)</span>
      </button>
    </article>
  );
}
