"use client";

import { APP_NAME } from "@/lib/config";
import { useLongPress } from "./presentation-menu";
import { cn } from "@/lib/utils";

/** Logotype de l'app. Appui long : menu de présentation. */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  const lp = useLongPress();
  return (
    <span {...lp} className={cn("tap select-none font-sans font-bold tracking-[-0.045em]", className)} style={{ fontSize: size * 0.82, lineHeight: 1 }}>
      {APP_NAME}
      <span className="opacity-40">.</span>
    </span>
  );
}
