"use client";

import React, { ReactNode } from "react";
import dynamic from "next/dynamic";
import { BottomNav } from "./BottomNav";

const DynamicHeader = dynamic(
  () => import("./Header").then((mod) => mod.Header),
  {
    ssr: false,
    loading: () => (
      <header className="sticky top-0 z-40 w-full bg-soft-cream/90 backdrop-blur-md border-b border-stone-200/60 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-canteen-amber flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              🥣
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-deep-navy">
                Feed Me
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Bữa ăn cộng đồng Cardano</p>
            </div>
          </div>
          <div className="h-8 w-24 rounded-full bg-stone-200/60 animate-pulse" />
        </div>
      </header>
    ),
  }
);

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DynamicHeader />
      <div className="flex-1 w-full max-w-md mx-auto px-4 pb-24">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
