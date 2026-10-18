"use client";

import React, { useState } from "react";
import { useWallet, useAddress } from "@meshsdk/react";
import {
  Ticket,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface LockedTicket {
  id: string;
  proposalId: string;
  proposalTitle: string;
  lockedFeedTokens: number;
  votePower: number;
  voteType: boolean; // true = YES, false = NO
  expiryPosixTime: number;
  isExpired: boolean;
  status: "locked" | "reclaimed";
}

export function VotesContent() {
  const { connected, wallet } = useWallet();
  const address = useAddress();

  const [tickets, setTickets] = useState<LockedTicket[]>([
    {
      id: "ticket-1",
      proposalId: "prop-1",
      proposalTitle: "Cơm trưa 2 tuần ôn thi tốt nghiệp - ĐHBK",
      lockedFeedTokens: 16,
      votePower: 4,
      voteType: true,
      expiryPosixTime: Date.now() + 18 * 3600 * 1000,
      isExpired: false,
      status: "locked",
    },
    {
      id: "ticket-2",
      proposalId: "prop-3",
      proposalTitle: "Phiếu ăn sáng 1 tháng cho tân sinh viên khó khăn",
      lockedFeedTokens: 25,
      votePower: 5,
      voteType: true,
      expiryPosixTime: Date.now() - 3600 * 1000, // already expired!
      isExpired: true,
      status: "locked",
    },
  ]);

  const [reclaimingId, setReclaimingId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const totalLockedTokens = tickets
    .filter((t) => t.status === "locked")
    .reduce((sum, t) => sum + t.lockedFeedTokens, 0);

  const totalVotingPower = tickets
    .filter((t) => t.status === "locked")
    .reduce((sum, t) => sum + t.votePower, 0);

  const handleReclaimTicket = async (ticketId: string) => {
    if (!connected || !wallet) {
      alert("Vui lòng kết nối ví để rút lại token.");
      return;
    }

    try {
      setReclaimingId(ticketId);

      // Simulate Plutus V3 ReclaimTicket offchain transaction execution
      await new Promise((resolve) => setTimeout(resolve, 1600));

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "reclaimed" } : t))
      );

      setTxHash("8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b");
    } catch (err) {
      console.error("Reclaim failed:", err);
    } finally {
      setReclaimingId(null);
    }
  };

  return (
    <main className="flex flex-col gap-5 pt-4 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canteen-amber/20 text-on-primary-container w-fit">
          <Ticket className="w-3.5 h-3.5 text-deep-navy" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-deep-navy">
            Quadratic Voting Tickets
          </span>
        </div>
        <h1 className="font-extrabold text-2xl tracking-tight text-deep-navy mt-1">
          Vé Biểu Quyết Của Bạn
        </h1>
        <p className="text-xs text-stone-500 leading-relaxed">
          Quản lý các lượt vote đã khóa tại hợp đồng <code>vote_ticket.ak</code>. Bạn có thể rút lại
          100% token $FEED sau khi đề xuất kết thúc.
        </p>
      </div>

      {/* 2. Portfolio Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-400 uppercase font-bold">Đang Khóa Trong Vé</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-warm-terracotta">
              {totalLockedTokens}
            </span>
            <span className="text-xs font-bold text-stone-500">$FEED</span>
          </div>
          <span className="text-[10px] text-stone-400">Hoàn lại khi hết hạn</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col gap-1">
          <span className="text-[10px] text-stone-400 uppercase font-bold">Tổng Điểm Vote</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-deep-navy">+{totalVotingPower}</span>
            <span className="text-xs font-bold text-stone-500">Power</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">⌊√Tokens⌋ Quadratic</span>
        </div>
      </div>

      {/* Reclaim Success Banner */}
      {txHash && (
        <div className="p-3.5 bg-fresh-mint/15 border border-fresh-mint/30 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-fresh-mint shrink-0" />
            <div>
              <span className="font-bold text-deep-navy block">Đã Rút Token Thành Công!</span>
              <span className="text-[11px] text-stone-500">Token $FEED đã được hoàn trả về ví.</span>
            </div>
          </div>
          <button
            onClick={() => setTxHash(null)}
            className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-full border border-stone-200"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Tickets Stream */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold text-deep-navy flex items-center justify-between">
          <span>Danh Sách Vé Bỏ Phiếu</span>
          <span className="text-xs font-medium text-stone-400">
            {tickets.filter((t) => t.status === "locked").length} vé đang khóa
          </span>
        </h2>

        {tickets.map((ticket) => {
          const isReclaimed = ticket.status === "reclaimed";

          return (
            <div
              key={ticket.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col gap-3 ${
                isReclaimed
                  ? "bg-stone-50 border-stone-200/60 opacity-60"
                  : ticket.isExpired
                  ? "bg-amber-50/40 border-amber-200 shadow-xs"
                  : "bg-white border-stone-100 shadow-sm"
              }`}
            >
              {/* Ticket Top Meta */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    ticket.voteType
                      ? "bg-fresh-mint/20 text-emerald-800"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {ticket.voteType ? "Đồng thuận (YES)" : "Phản đối (NO)"}
                </span>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {ticket.isExpired ? "Đã hết hạn vote" : "Đang trong kỳ vote"}
                  </span>
                </div>
              </div>

              {/* Proposal Title */}
              <div>
                <h3 className="font-bold text-sm text-deep-navy line-clamp-1">
                  {ticket.proposalTitle}
                </h3>
              </div>

              {/* Token vs Power stats */}
              <div className="p-2.5 bg-stone-100/70 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold">Khóa tại script</span>
                  <span className="font-extrabold text-warm-terracotta">
                    {ticket.lockedFeedTokens} $FEED
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block font-semibold">Điểm biểu quyết</span>
                  <span className="font-extrabold text-deep-navy">
                    +{ticket.votePower} Power
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {isReclaimed ? (
                <div className="flex items-center justify-center gap-1.5 py-2 text-stone-400 font-bold text-xs bg-stone-100 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã nhận lại token</span>
                </div>
              ) : ticket.isExpired ? (
                <button
                  onClick={() => handleReclaimTicket(ticket.id)}
                  disabled={reclaimingId === ticket.id}
                  className="w-full h-10 rounded-full bg-fresh-mint text-deep-navy font-extrabold text-xs shadow-sm hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {reclaimingId === ticket.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang rút lại token...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Rút lại {ticket.lockedFeedTokens} $FEED (Hết kỳ vote)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1.5 py-2 text-stone-400 font-semibold text-xs bg-stone-100/60 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đang khóa đến khi kết thúc đơn</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
