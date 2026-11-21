"use client";

import { APP_NAME } from "@/lib/config";
import { useLongPress } from "./presentation-menu";
import { cn } from "@/lib/utils";

/** Logotype Aura : capitales serif + pastille au dégradé de la charte. Appui long : menu de présentation. */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  const lp = useLongPress();
  return (
    <span {...lp} className={cn("tap inline-flex select-none items-start font-display uppercase", className)} style={{ fontSize: size * 0.92, lineHeight: 1, letterSpacing: "0.04em" }}>
      {APP_NAME}
      <span aria-hidden className="aura-dot ml-[0.12em] mt-[0.08em]" style={{ width: size * 0.2, height: size * 0.2 }} />
    </span>
  );
}
