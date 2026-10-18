"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, Landmark, PlusCircle, Ticket } from "lucide-react";

export type NavTab = "feed" | "treasury" | "create" | "votes";

interface BottomNavProps {
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export function BottomNav({ currentTab = "feed", onTabChange }: BottomNavProps) {
  const pathname = usePathname();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; href?: string }[] = [
    {
      id: "feed",
      label: "Bảng tin",
      icon: <UtensilsCrossed className="w-5 h-5" />,
      href: "/",
    },
    {
      id: "treasury",
      label: "Quỹ chung",
      icon: <Landmark className="w-5 h-5" />,
      href: "/treasury",
    },
    {
      id: "create",
      label: "Tạo đề xuất",
      icon: <PlusCircle className="w-5 h-5" />,
      href: "/create",
    },
    {
      id: "votes",
      label: "Vé đã bỏ",
      icon: <Ticket className="w-5 h-5" />,
      href: "/votes",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/80 px-4 py-2 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;

          const handleClick = () => {
            if (onTabChange) {
              onTabChange(item.id);
            }
          };

          const buttonContent = (
            <div
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? "bg-canteen-amber/15 text-deep-navy font-extrabold scale-105"
                  : "text-stone-400 hover:text-stone-600 font-semibold"
              }`}
            >
              <div className={isActive ? "text-warm-terracotta" : "text-stone-400"}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-1 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </div>
          );

          if (item.href && !onTabChange) {
            return (
              <Link key={item.id} href={item.href} className="block">
                {buttonContent}
              </Link>
            );
          }

          return (
            <button key={item.id} onClick={handleClick} className="w-full">
              {buttonContent}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
