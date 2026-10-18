"use client";

import React, { useState } from "react";
import { useWallet, useWalletList } from "@meshsdk/react";
import { X, Wallet, ExternalLink, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connecting, connected, name: activeWalletName, disconnect } = useWallet();
  const wallets = useWalletList();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (walletName: string) => {
    try {
      setErrorMsg(null);
      await connect(walletName);
      onClose();
    } catch (err) {
      console.error("Connect wallet error:", err);
      setErrorMsg("Không thể kết nối ví. Vui lòng thử lại hoặc mở khóa ví.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-100 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-canteen-amber/20 flex items-center justify-center text-canteen-amber">
              <Wallet className="w-5 h-5 text-deep-navy" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-deep-navy">Kết Nối Ví Cardano</h2>
              <p className="text-xs text-stone-500">CIP-30 Web3 Wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Wallets List */}
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto py-1">
          {wallets && wallets.length > 0 ? (
            wallets.map((w) => {
              const isSelected = connected && activeWalletName?.toLowerCase() === w.name.toLowerCase();

              return (
                <button
                  key={w.name}
                  onClick={() => handleConnect(w.name)}
                  disabled={connecting}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? "border-fresh-mint bg-fresh-mint/10"
                      : "border-stone-200 hover:border-canteen-amber hover:bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {w.icon ? (
                      <img src={w.icon} alt={w.name} className="w-8 h-8 rounded-xl object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-canteen-amber flex items-center justify-center font-bold text-white text-xs">
                        {w.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-sm text-deep-navy capitalize">{w.name}</div>
                      <div className="text-[11px] text-stone-400">Đã cài đặt trên trình duyệt</div>
                    </div>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-fresh-mint" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 flex flex-col items-center gap-3">
              <p className="text-xs text-stone-600 font-medium">
                Chưa phát hiện ví Cardano nào trên trình duyệt của bạn.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full pt-2">
                <a
                  href="https://eternl.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-deep-navy"
                >
                  <span>Cài Eternl</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.lace.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-deep-navy"
                >
                  <span>Cài Lace</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Disconnect if already connected */}
        {connected ? (
          <button
            onClick={() => {
              disconnect();
              onClose();
            }}
            className="w-full py-2.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
          >
            Ngắt kết nối ví
          </button>
        ) : (
          <div className="text-center text-[11px] text-stone-400">
            Dự án vận hành trên Cardano <span className="font-semibold text-deep-navy">Preview Testnet</span>
          </div>
        )}
      </div>
    </div>
  );
}
