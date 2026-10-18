"use client";

import React, { useState } from "react";
import { useWallet, useAddress, useLovelace, useAssets } from "@meshsdk/react";
import {
  Landmark,
  Zap,
  Flame,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Coins,
  History,
  TrendingUp,
  Loader2,
  Lock,
} from "lucide-react";

export function TreasuryContent() {
  const { connected, wallet } = useWallet();
  const address = useAddress();
  const lovelace = useLovelace();
  const assets = useAssets();

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeAmount, setStakeAmount] = useState<number>(50);
  const [unstakeAmount, setUnstakeAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const walletAda = lovelace ? Number(lovelace) / 1_000_000 : 125.4;
  const feedAsset = assets?.find((a) => a.unit.toLowerCase().includes("46454544"));
  const userFeedBalance = feedAsset ? Number(feedAsset.quantity) : 120;

  const handleMaxStake = () => {
    // Leave 3 ADA for transaction fees & collateral
    setStakeAmount(Math.max(1, Math.floor(walletAda - 3)));
  };

  const handleMaxUnstake = () => {
    setUnstakeAmount(userFeedBalance);
  };

  const handleExecuteTransaction = async () => {
    if (!connected || !wallet) {
      setStatusMessage("Vui lòng kết nối ví Cardano để thực hiện giao dịch.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      // Simulate offchain transaction execution with Plutus V3 Treasury
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const mockHash =
        activeTab === "stake"
          ? "7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b"
          : "3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d";

      setTxHash(mockHash);
    } catch (err: unknown) {
      console.error("Treasury tx failed:", err);
      setStatusMessage(err instanceof Error ? err.message : "Giao dịch thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col gap-5 pt-4 pb-12">
      {/* 1. Treasury Overview Card (Hero) */}
      <section className="relative overflow-hidden rounded-3xl bg-deep-navy text-white shadow-xl p-5 border border-stone-800">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-canteen-amber/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-fresh-mint/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-fresh-mint animate-pulse" />
              <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider">
                Epoch 490 Đang Hoạt Động
              </span>
            </div>
            <span className="text-xs text-canteen-amber font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-fresh-mint" />
              <span>[FEED1] Stake Pool</span>
            </span>
          </div>

          <div>
            <p className="text-xs text-stone-300 font-medium">Tổng Quy Mô Quỹ Căn-tin Cardano</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                125,400 <span className="text-lg text-canteen-amber">ADA</span>
              </h1>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Ủy thác phi tập trung vào node cộng đồng • 0% Margin
            </p>
          </div>

          {/* Staking Yield Badge */}
          <div className="flex items-center gap-2.5 bg-fresh-mint/15 border border-fresh-mint/30 p-2.5 rounded-2xl">
            <span className="text-lg font-extrabold text-fresh-mint">~3.8%</span>
            <div className="flex flex-col text-[11px] leading-tight">
              <span className="font-extrabold text-white">Lãi Kép Liquid Staking</span>
              <span className="text-stone-300">
                100% phần thưởng ủy thác được tài trợ trực tiếp cho bữa ăn sinh viên 🍲
              </span>
            </div>
          </div>

          {/* Stats 3 columns */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Suất cơm</span>
              <div className="font-extrabold text-base text-white">342</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Người gửi</span>
              <div className="font-extrabold text-base text-white">1,280</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Phí quản lý</span>
              <div className="font-extrabold text-base text-fresh-mint">0%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Staking Position Card */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-stone-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-canteen-amber/20 flex items-center justify-center text-deep-navy">
              <Coins className="w-4 h-4 text-deep-navy" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-deep-navy">Vị Thế Staking Của Bạn</h2>
              <p className="text-[10px] text-stone-400">Tỷ lệ mint 1:1 nhận $FEED</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
            Tự lưu ký (Non-custodial)
          </span>
        </div>

        {/* 1:1 Exchange Pill */}
        <div className="flex items-center justify-between bg-surface-container-low p-3 rounded-2xl">
          <div>
            <span className="text-[10px] text-stone-500 font-semibold block">ADA đã gửi quỹ</span>
            <span className="font-extrabold text-base text-deep-navy">120 ₳</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-warm-terracotta">
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-emerald-700 font-semibold block">Quyền biểu quyết</span>
            <span className="font-extrabold text-base text-emerald-800">120 $FEED</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Staking / Unstaking Panel */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-stone-100 flex flex-col gap-4">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab("stake");
              setTxHash(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "stake"
                ? "bg-canteen-amber text-deep-navy shadow-sm"
                : "text-stone-500 hover:text-deep-navy"
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-deep-navy" />
            <span>Nạp ADA (Mint $FEED)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("unstake");
              setTxHash(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "unstake"
                ? "bg-warm-terracotta text-white shadow-sm"
                : "text-stone-500 hover:text-deep-navy"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Rút ADA (Đốt $FEED)</span>
          </button>
        </div>

        {/* Success Modal / Banner */}
        {txHash ? (
          <div className="py-4 flex flex-col items-center gap-2 text-center bg-fresh-mint/10 border border-fresh-mint/30 rounded-2xl p-4">
            <CheckCircle2 className="w-8 h-8 text-fresh-mint" />
            <h4 className="font-extrabold text-sm text-deep-navy">
              {activeTab === "stake" ? "Nạp ADA Thành Công!" : "Rút ADA Thành Công!"}
            </h4>
            <p className="text-xs text-stone-600">
              {activeTab === "stake"
                ? `Đã nạp ${stakeAmount} ADA vào Quỹ Căn-tin và nhận về ${stakeAmount} $FEED.`
                : `Đã đốt ${unstakeAmount} $FEED và nhận lại ${unstakeAmount} ADA về ví.`}
            </p>
            <a
              href={`https://preview.cardanoscan.io/transaction/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-warm-terracotta hover:underline flex items-center gap-1 mt-1"
            >
              <span>Xem giao dịch CardanoScan Preview</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setTxHash(null)}
              className="mt-2 px-4 py-1.5 rounded-full bg-deep-navy text-white font-bold text-xs"
            >
              Tiếp tục
            </button>
          </div>
        ) : (
          <>
            {/* STAKE TAB CONTENT */}
            {activeTab === "stake" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-deep-navy">Số lượng ADA nạp vào quỹ:</label>
                  <span className="text-stone-400">
                    Ví: <strong className="text-deep-navy">{walletAda.toFixed(1)} ADA</strong>
                  </span>
                </div>

                {/* Input box */}
                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 gap-2 focus-within:border-canteen-amber focus-within:bg-white transition-all">
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-xs font-bold text-xs text-deep-navy">
                    <span>₳</span>
                    <span>ADA</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-full bg-transparent font-extrabold text-lg text-deep-navy outline-none"
                  />
                  <button
                    onClick={handleMaxStake}
                    className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-deep-navy transition-colors"
                  >
                    MAX
                  </button>
                </div>

                {/* Receive Preview */}
                <div className="p-3 bg-fresh-mint/10 border border-fresh-mint/20 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span className="text-emerald-900 font-medium">Nhận token quản trị:</span>
                  </div>
                  <span className="font-extrabold text-sm text-emerald-800">
                    +{stakeAmount} $FEED
                  </span>
                </div>

                {statusMessage && (
                  <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                    {statusMessage}
                  </div>
                )}

                <button
                  onClick={handleExecuteTransaction}
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-deep-navy" />
                      <span>Đang tạo giao dịch Plutus V3...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-deep-navy" />
                      <span>Stake {stakeAmount} ADA & Mint $FEED</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-stone-400 text-center">
                  Tiền luôn thuộc quyền kiểm soát của bạn. Rút tự do bất kỳ lúc nào mà không bị giam vốn.
                </p>
              </div>
            ) : (
              /* UNSTAKE TAB CONTENT */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-deep-navy">Số lượng $FEED muốn đốt để rút ADA:</label>
                  <span className="text-stone-400">
                    Khả dụng: <strong className="text-deep-navy">{userFeedBalance} $FEED</strong>
                  </span>
                </div>

                <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl px-3 py-2 gap-2 focus-within:border-warm-terracotta focus-within:bg-white transition-all">
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-xs font-bold text-xs text-warm-terracotta">
                    <span>🥣</span>
                    <span>$FEED</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={userFeedBalance}
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(Number(e.target.value))}
                    className="w-full bg-transparent font-extrabold text-lg text-deep-navy outline-none"
                  />
                  <button
                    onClick={handleMaxUnstake}
                    className="px-2 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-[10px] font-bold text-deep-navy transition-colors"
                  >
                    MAX
                  </button>
                </div>

                <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-warm-terracotta" />
                    <span className="text-amber-950 font-medium">Nhận lại vào ví:</span>
                  </div>
                  <span className="font-extrabold text-sm text-warm-terracotta">
                    {unstakeAmount} ADA
                  </span>
                </div>

                {statusMessage && (
                  <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                    {statusMessage}
                  </div>
                )}

                <button
                  onClick={handleExecuteTransaction}
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-full bg-warm-terracotta text-white font-extrabold text-xs shadow-md hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Đang đốt token $FEED trên Cardano...</span>
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      <span>Đốt {unstakeAmount} $FEED & Rút ADA Gốc</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 4. Live Meal Allocations (On-chain Ledger) */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-deep-navy flex items-center gap-1.5">
            <History className="w-4 h-4 text-canteen-amber" />
            <span>Lịch Sử Giải Ngân Bữa Ăn Gần Đây</span>
          </h3>
          <span className="text-[10px] font-bold text-fresh-mint flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-fresh-mint animate-pulse" />
            <span>On-chain Ledger</span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-fresh-mint/15 flex items-center justify-center text-xs">
                🍱
              </div>
              <div>
                <span className="font-bold text-xs text-deep-navy block">
                  Đức Hùng • ĐH Sư Phạm Kỹ Thuật
                </span>
                <span className="text-[10px] text-stone-400">Phiếu ăn sáng 1 tháng • 2 giờ trước</span>
              </div>
            </div>
            <span className="font-extrabold text-xs text-fresh-mint-dark bg-fresh-mint/10 px-2.5 py-1 rounded-full">
              +45 ADA
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-stone-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-canteen-amber/15 flex items-center justify-center text-xs">
                🍜
              </div>
              <div>
                <span className="font-bold text-xs text-deep-navy block">
                  Phương Uyên • ĐH Kinh Tế HCM
                </span>
                <span className="text-[10px] text-stone-400">Cơm trưa mùa thi • 1 ngày trước</span>
              </div>
            </div>
            <span className="font-extrabold text-xs text-fresh-mint-dark bg-fresh-mint/10 px-2.5 py-1 rounded-full">
              +30 ADA
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
