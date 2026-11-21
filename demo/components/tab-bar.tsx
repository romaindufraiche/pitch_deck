"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, ShoppingBag, Sparkles, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: typeof Home; main?: boolean; also?: string[] }[] = [
  { href: "/accueil", label: "Accueil", icon: Home },
  { href: "/dressing", label: "Dressing", icon: Shirt },
  { href: "/assistant", label: "Styliste", icon: Sparkles, main: true },
  { href: "/catalogue", label: "Catalogue", icon: ShoppingBag, also: ["/boutiques"] },
  { href: "/profil", label: "Profil", icon: User },
];

export const TAB_BAR_SPACE = "calc(var(--bottom) + 84px)";

export function TabBar() {
  const path = usePathname();
  const onboarded = useStore((s) => s.onboarded);
  if (!onboarded || path === "/dressing/ajout") return null;
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-line/80 bg-paper/85 backdrop-blur-xl" style={{ paddingBottom: "var(--bottom)" }}>
      <ul className="flex h-[62px] items-center justify-around px-2">
        {TABS.map((t) => {
          const active = path === t.href || (t.href !== "/accueil" && path.startsWith(t.href)) || !!t.also?.some((a) => path.startsWith(a));
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link href={t.href} className="tap flex w-16 flex-col items-center gap-1">
                {t.main ? (
                  <span className={cn("-mt-1 flex size-11 items-center justify-center rounded-full transition", active ? "bg-aura text-white shadow-[0_6px_18px_-6px_rgba(138,91,255,0.7)]" : "bg-ink text-paper")}>
                    <Icon className="size-[19px]" strokeWidth={1.6} />
                  </span>
                ) : (
                  <Icon className={cn("size-[21px] transition", active ? "text-ink" : "text-mute")} strokeWidth={active ? 1.9 : 1.5} />
                )}
                <span className={cn("text-[10px] tracking-wide", active ? "font-semibold text-ink" : "text-mute", t.main && "sr-only")}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
