"use client";

import React, { useState, useEffect } from "react";
import { useWallet, useAddress, useLovelace, useAssets } from "@meshsdk/react";
import { Wallet, ChevronDown, Sparkles } from "lucide-react";
import { WalletModal } from "./WalletModal";

export function Header() {
  const { connected, connecting } = useWallet();
  const address = useAddress();
  const lovelace = useLovelace();
  const assets = useAssets();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const adaBalance = lovelace ? (Number(lovelace) / 1_000_000).toFixed(2) : "0.00";

  // Calculate $FEED balance from wallet assets (FEED in hex is 46454544)
  const feedToken = assets?.find((a) => a.unit.toLowerCase().includes("46454544"));
  const feedBalance = feedToken ? Number(feedToken.quantity).toLocaleString() : "0";

  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-4)}`
    : "";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-soft-cream/90 backdrop-blur-md border-b border-stone-200/60 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-canteen-amber flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              🥣
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-deep-navy flex items-center gap-1.5">
                <span>Feed Me</span>
                <span className="text-[10px] bg-canteen-amber/20 text-on-primary-container font-bold px-1.5 py-0.5 rounded-full">
                  v0.1
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Bữa ăn cộng đồng Cardano</p>
            </div>
          </div>

          {/* Right Action: Network & Wallet Button */}
          <div className="flex items-center gap-2">
            {/* Network pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600 border border-stone-200">
              <span className="w-1.5 h-1.5 rounded-full bg-fresh-mint animate-pulse" />
              <span>Preview</span>
            </div>

            {/* Wallet Button */}
            {connected ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm hover:border-canteen-amber transition-all text-xs font-bold text-deep-navy active:scale-95"
              >
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-deep-navy">₳ {adaBalance}</span>
                  <span className="text-[10px] text-warm-terracotta font-semibold">
                    {feedBalance} $FEED
                  </span>
                </div>
                <div className="w-6 h-6 rounded-full bg-canteen-amber/20 flex items-center justify-center text-[10px] text-deep-navy font-bold">
                  {shortAddress.slice(0, 2)}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={connecting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-canteen-amber text-deep-navy font-extrabold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all"
              >
                <Wallet className="w-3.5 h-3.5 text-deep-navy" />
                <span>{connecting ? "Đang kết nối..." : "Kết nối ví"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
