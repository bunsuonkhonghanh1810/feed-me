"use client";

import React from "react";

export type CategoryFilter = "all" | "meal" | "books" | "urgent";

interface CategoryFiltersProps {
  activeCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
}

export function CategoryFilters({
  activeCategory,
  onSelectCategory,
}: CategoryFiltersProps) {
  const categories: { id: CategoryFilter; label: string; isUrgent?: boolean }[] = [
    { id: "all", label: "Tất cả" },
    { id: "meal", label: "🍱 Suất cơm SV" },
    { id: "books", label: "📚 Sách & Giáo trình" },
    { id: "urgent", label: "Cấp bách", isUrgent: true },
  ];

  return (
    <nav
      aria-label="Bộ lọc đề xuất"
      className="w-full overflow-x-auto no-scrollbar flex items-center gap-2 py-1"
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              isActive
                ? "bg-canteen-amber text-deep-navy shadow-sm"
                : "bg-white border border-stone-200/80 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {cat.isUrgent && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <span>{cat.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
