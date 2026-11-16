"use client";

import { APP_NAME } from "@/lib/config";
import { useLongPress } from "./presentation-menu";
import { cn } from "@/lib/utils";

/** Logotype de l'app. Appui long : menu de présentation. */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  const lp = useLongPress();
  return (
    <span {...lp} className={cn("tap select-none font-display font-semibold tracking-[-0.01em]", className)} style={{ fontSize: size, lineHeight: 1 }}>
      {APP_NAME}
      <span className="text-rust">.</span>
    </span>
  );
}
