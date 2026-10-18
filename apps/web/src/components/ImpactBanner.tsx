"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, HeartHandshake, Zap, Heart, Sprout } from "lucide-react";

export function ImpactBanner() {
  return (
    <section className="w-full rounded-3xl bg-secondary text-white p-5 shadow-[0_10px_24px_-4px_rgba(163,61,35,0.22)] relative overflow-hidden flex flex-col gap-3">
      {/* Background Graphic Watermark */}
      <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none select-none text-[120px] font-black">
        🥣
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        {/* Sub-badge */}
        <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full w-fit">
          <span className="text-sm">🥣</span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-white">
            Quỹ Căn-tin Cardano Cộng Đồng
          </span>
        </div>

        {/* Total ADA Staked Stat */}
        <div className="flex flex-col">
          <div className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            125,400 ADA
          </div>
          <div className="flex items-center gap-2 text-white/90 text-xs mt-0.5">
            <span className="flex items-center gap-1 font-semibold">
              <Heart className="w-3.5 h-3.5 text-canteen-amber fill-canteen-amber" />
              <span>342 bữa ăn đã trợ giá</span>
            </span>
            <span className="text-white/40">•</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-200">
              <Sprout className="w-3.5 h-3.5" />
              <span>Epoch 490</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link
            href="/treasury"
            className="flex items-center justify-center gap-1.5 bg-canteen-amber text-deep-navy h-11 px-3 rounded-full font-bold text-xs shadow-md active:scale-95 transition-all hover:bg-amber-400"
          >
            <Zap className="w-4 h-4 fill-deep-navy" />
            <span>Stake ADA</span>
          </Link>
          <Link
            href="/create"
            className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white h-11 px-3 rounded-full font-bold text-xs active:scale-95 transition-all"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Gửi đề xuất</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
