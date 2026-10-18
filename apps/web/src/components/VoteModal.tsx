"use client";

import React, { useState } from "react";
import { Proposal } from "@/data/mockProposals";
import { useWallet, useAddress, useAssets } from "@meshsdk/react";
import { X, Check, Vote, ShieldAlert, Sparkles, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { calculateVotePower } from "@feed-me/offchain";

interface VoteModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onVoteSuccess?: (proposalId: string, tokens: number, power: number) => void;
}

export function VoteModal({ proposal, isOpen, onClose, onVoteSuccess }: VoteModalProps) {
  const { connected, wallet } = useWallet();
  const address = useAddress();
  const assets = useAssets();

  const [voteType, setVoteType] = useState<boolean>(true); // true = YES, false = NO
  const [feedTokens, setFeedTokens] = useState<number>(16);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  // Calculate user's available $FEED
  const feedAsset = assets?.find((a) => a.unit.toLowerCase().includes("46454544"));
  const userFeedBalance = feedAsset ? Number(feedAsset.quantity) : 100; // default 100 demo tokens if wallet balance pending

  const votePower = calculateVotePower(feedTokens);

  const quickPresets = [1, 4, 9, 16, 25, 49, 100];

  const handleSubmitVote = async () => {
    if (!connected || !wallet) {
      setErrorMessage("Vui lòng kết nối ví Cardano trước khi bỏ phiếu.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Simulate lock ticket transaction building
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const fakeTxHash = "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e";
      setTxHash(fakeTxHash);

      if (onVoteSuccess) {
        onVoteSuccess(proposal.id, feedTokens, votePower);
      }
    } catch (err: unknown) {
      console.error("Vote failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Giao dịch thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-stone-100 flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-canteen-amber/20 flex items-center justify-center text-deep-navy">
              <Vote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-deep-navy">Biểu Quyết Căn Bậc Hai</h2>
              <p className="text-[10px] text-stone-500">Quadratic Voting Ticket</p>
            </div>
          </div>
          <button
            onClick={() => {
              setTxHash(null);
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Success Screen */}
        {txHash ? (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-fresh-mint/20 text-fresh-mint flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-lg text-deep-navy">Bỏ Phiếu Thành Công!</h3>
            <p className="text-xs text-stone-600">
              Đã khóa <strong>{feedTokens} $FEED</strong> để nhận <strong>+{votePower} điểm biểu quyết</strong> ({voteType ? "Đồng thuận" : "Phản đối"}).
            </p>
            <div className="p-3 bg-stone-50 rounded-2xl w-full text-left text-[11px] font-mono break-all text-stone-500">
              TxHash: {txHash.slice(0, 24)}...
            </div>
            <a
              href={`https://preview.cardanoscan.io/transaction/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-warm-terracotta hover:underline"
            >
              <span>Xem trên CardanoScan Preview</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => {
                setTxHash(null);
                onClose();
              }}
              className="w-full mt-2 py-3 rounded-full bg-deep-navy text-white font-bold text-xs shadow-md"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <>
            {/* Proposal Brief */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Đề xuất biểu quyết
              </span>
              <h4 className="font-bold text-sm text-deep-navy line-clamp-1">{proposal.title}</h4>
              <p className="text-[11px] text-stone-500">
                Người nhận: <strong>{proposal.creator.name}</strong> • Cần:{" "}
                <strong className="text-deep-navy">{proposal.requestedAda} ADA</strong>
              </p>
            </div>

            {/* Vote Choice (YES / NO) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-deep-navy">Lựa chọn của bạn</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoteType(true)}
                  className={`py-2.5 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    voteType
                      ? "bg-fresh-mint/15 border-fresh-mint text-emerald-800 shadow-sm"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-fresh-mint" />
                  <span>Đồng thuận (YES)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoteType(false)}
                  className={`py-2.5 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    !voteType
                      ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                      : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Phản đối (NO)</span>
                </button>
              </div>
            </div>

            {/* Token Amount Slider & Stepper */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-deep-navy">Số $FEED khóa:</span>
                <span className="font-extrabold text-sm text-warm-terracotta">
                  {feedTokens} $FEED
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={Math.min(userFeedBalance, 100)}
                value={feedTokens}
                onChange={(e) => setFeedTokens(Number(e.target.value))}
                className="w-full accent-canteen-amber cursor-pointer"
              />

              {/* Quick Select Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {quickPresets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFeedTokens(val)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors ${
                      feedTokens === val
                        ? "bg-canteen-amber text-deep-navy"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Real-time Quadratic Formula Display */}
            <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-canteen-amber" />
                  <span>Điểm biểu quyết thực tế</span>
                </span>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-deep-navy">+{votePower}</span>
                  <span className="text-[10px] text-stone-500 ml-1">Power</span>
                </div>
              </div>

              <div className="p-2 bg-white/80 rounded-xl text-[11px] font-mono text-center text-stone-600 border border-amber-100">
                Power = ⌊√Tokens⌋ = ⌊√{feedTokens}⌋ = <strong>{votePower} điểm</strong>
              </div>

              <p className="text-[10px] text-stone-500 leading-tight">
                💡 <strong>Cơ chế Quadratic Voting</strong>: Để tăng gấp đôi tiếng nói (2 → 4), bạn cần khóa gấp 4 lần token (4 → 16 $FEED). Token sẽ được hoàn trả 100% sau thời hạn.
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <button
              onClick={handleSubmitVote}
              disabled={isSubmitting}
              className="w-full h-11 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-deep-navy" />
                  <span>Đang ký giao dịch trên Cardano...</span>
                </>
              ) : (
                <>
                  <Vote className="w-4 h-4 text-deep-navy" />
                  <span>Xác nhận khóa {feedTokens} $FEED biểu quyết</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
