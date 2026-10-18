import React from "react";
import { UtensilsCrossed, Sparkles, HeartHandshake, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen max-w-md mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-canteen-amber flex items-center justify-center text-white font-bold text-xl shadow-md">
            🥣
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-deep-navy">Feed Me</h1>
            <p className="text-xs text-deep-navy/70">Cardano Community Canteen</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white shadow-sm border border-stone-200 text-xs font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-fresh-mint animate-pulse" />
          <span>Preview Testnet</span>
        </div>
      </header>

      {/* Hero Stats Card */}
      <section className="bg-warm-terracotta text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-bold">
            Quỹ Căn-tin Cardano
          </span>
          <Sparkles className="w-5 h-5 text-canteen-amber" />
        </div>
        <div>
          <div className="text-3xl font-extrabold tracking-tight">125,400 ADA</div>
          <p className="text-xs text-white/90 mt-1">Đang ủy thác sinh lãi • ~3.8% APY • Epoch 490</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="h-11 rounded-full bg-canteen-amber text-deep-navy font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Stake ADA
          </button>
          <button className="h-11 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5">
            <HeartHandshake className="w-4 h-4" />
            Gửi đề xuất
          </button>
        </div>
      </section>

      {/* Feed Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-deep-navy flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-canteen-amber" />
          Đơn Chờ Duyệt Lương Thực
        </h2>
        <span className="text-xs font-semibold text-deep-navy/60">342 bạn đã nhận</span>
      </div>

      {/* Sample Proposal Card */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="bg-fresh-mint/15 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
            🍱 Suất cơm SV
          </span>
          <span className="text-stone-400">Còn 18 giờ</span>
        </div>
        <h3 className="font-bold text-base text-deep-navy">
          Cơm trưa 2 tuần ôn thi tốt nghiệp - ĐHBK
        </h3>
        <p className="text-xs text-stone-600 line-clamp-2">
          Em là sinh viên năm cuối đang hoàn thành đồ án tốt nghiệp, cần hỗ trợ tiền ăn trưa qua ngày để tập trung làm đồ án.
        </p>

        {/* Voting Progress */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold">
            <span>Tiến độ biểu quyết: 82%</span>
            <span className="text-fresh-mint">Đạt điều kiện (≥75%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-fresh-mint rounded-full" style={{ width: "82%" }} />
          </div>
        </div>

        <button className="mt-2 w-full h-11 rounded-full bg-canteen-amber text-deep-navy font-bold text-sm shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
          <span>🗳️</span>
          <span>Bỏ phiếu bằng $FEED (√Token)</span>
        </button>
      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-stone-400 pt-6 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-fresh-mint" />
        <span>Bảo mật bởi Aiken Plutus V3 & MeshJS</span>
      </footer>
    </main>
  );
}
