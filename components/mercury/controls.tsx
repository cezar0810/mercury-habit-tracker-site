"use client";

import { Check } from "lucide-react";
import { tabs, type Tab } from "./data";

export function CheckBox({
  checked,
  onClick,
  label,
  compact = false,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
      className={
        "grid shrink-0 place-items-center border transition " +
        (compact ? "size-6 rounded-lg " : "size-8 rounded-xl ") +
        (checked
          ? "border-[#347cf6] bg-[#347cf6] text-white shadow-[0_5px_15px_rgba(52,124,246,0.3)]"
          : "border-white/25 bg-transparent text-transparent hover:border-[#347cf6]")
      }
    >
      <Check className={(compact ? "size-3" : "size-4") + " stroke-[3]"} />
    </button>
  );
}

export function BottomNavigation({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="mx-2 mb-3 grid grid-cols-4 rounded-[25px] bg-[#0b0c0d] px-1 py-1.5 shadow-[0_-8px_36px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.025] sm:mx-4 sm:mb-4"
    >
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = item.id === tab;
        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onChange(item.id)}
            className={
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] text-[11px] font-medium transition " +
              (active
                ? "bg-[#112b58] text-[#347cf6]"
                : "text-white/55 hover:bg-white/[0.035] hover:text-white/85")
            }
          >
            <Icon className={"size-6 " + (active ? "stroke-[2.7]" : "stroke-[2]")} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
