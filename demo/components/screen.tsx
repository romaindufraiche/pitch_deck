"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAB_BAR_SPACE } from "./tab-bar";

/** Conteneur d'écran défilant, avec en-tête optionnel. */
export function Screen({ children, title, back, right, tabs = true, className, noTop = false }: { children: React.ReactNode; title?: React.ReactNode; back?: boolean | string; right?: React.ReactNode; tabs?: boolean; className?: string; noTop?: boolean }) {
  const router = useRouter();
  return (
    <div id="screen" className={cn("absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar", className)} style={{ paddingTop: noTop ? 0 : "var(--top)", paddingBottom: tabs ? TAB_BAR_SPACE : "calc(var(--bottom) + 16px)" }}>
      {(title || back || right) && (
        <header className="sticky top-0 z-30 -mt-px flex h-12 items-center gap-2 bg-paper/90 px-4 backdrop-blur-xl">
          {back && (
            <button aria-label="Retour" onClick={() => (typeof back === "string" ? router.push(back) : router.back())} className="tap -ml-1.5 rounded-full p-1.5 hover:bg-black/5">
              <ChevronLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</div>
          {right}
        </header>
      )}
      {children}
    </div>
  );
}
