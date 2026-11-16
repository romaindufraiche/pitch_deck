"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { PresentationMenu } from "./presentation-menu";
import { useStore } from "@/lib/store";

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    f();
    const i = setInterval(f, 15000);
    return () => clearInterval(i);
  }, []);
  return t;
}

function StatusBar() {
  const time = useClock();
  return (
    <div className="status-bar pointer-events-none absolute inset-x-0 top-0 z-[70] flex h-12 items-end justify-between px-8 pb-1.5 text-[14px] font-semibold text-ink transition-colors">
      <span className="w-14 tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor" aria-hidden><rect x="0" y="7" width="3" height="4" rx="0.7" /><rect x="5" y="5" width="3" height="6" rx="0.7" /><rect x="10" y="2.5" width="3" height="8.5" rx="0.7" /><rect x="15" y="0" width="3" height="11" rx="0.7" /></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden><path d="M8 2.2c2.2 0 4.2.9 5.7 2.3l1.1-1.1C13 1.6 10.6.6 8 .6S3 1.6 1.2 3.4l1.1 1.1C3.8 3.1 5.8 2.2 8 2.2Zm0 3.2c1.3 0 2.5.5 3.4 1.3l1.1-1.1C11.3 4.5 9.7 3.8 8 3.8s-3.3.7-4.5 1.8l1.1 1.1c.9-.8 2.1-1.3 3.4-1.3Zm0 3.2c-.5 0-1 .2-1.3.5L8 10.4l1.3-1.3c-.3-.3-.8-.5-1.3-.5Z" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" opacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" /><rect x="23.5" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.4" /></svg>
      </span>
    </div>
  );
}

/**
 * Sur grand écran (projection), l'app s'affiche dans un cadre de téléphone centré.
 * Sur un vrai téléphone, elle occupe tout l'écran.
 */
/** Hors de l'écran du téléphone (grand écran uniquement) : redémarre la démo depuis le début. */
function RestartButton() {
  const router = useRouter();
  const reset = useStore((s) => s.reset);
  const [done, setDone] = useState(false);
  return (
    <div className="fixed left-5 top-5 z-[200] hidden flex-col gap-1.5 md:flex">
      <button
        onClick={() => { reset(); router.push("/"); setDone(true); setTimeout(() => setDone(false), 1500); }}
        className="tap flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-paper shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] transition hover:bg-ink/85"
      >
        <RotateCcw className="size-4" /> {done ? "Démo redémarrée" : "Redémarrer la démo"}
      </button>
      <span className="pl-2 text-[11px] text-ink/45">Menu de présentation : Shift + D</span>
    </div>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-dvh w-full bg-[#e9e5de] md:flex md:items-center md:justify-center md:bg-[radial-gradient(ellipse_at_top,#f3f0ea_0%,#ddd7cc_100%)] md:py-6">
      <div
        id="phone"
        className="relative mx-auto h-dvh w-full overflow-hidden bg-paper md:h-[min(860px,calc(100dvh-48px))] md:w-[396px] md:rounded-[56px] md:shadow-[0_0_0_11px_#111,0_0_0_13px_#3a3a3a,0_40px_80px_-20px_rgba(0,0,0,0.45)]"
      >
        <div className="hidden md:block">
          <div className="status-bg pointer-events-none absolute inset-x-0 top-0 z-[65] h-[50px] bg-gradient-to-b from-paper from-55% to-paper/0" />
          <StatusBar />
          <div className="absolute left-1/2 top-[11px] z-[60] h-[32px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute bottom-[7px] left-1/2 z-[60] h-[5px] w-[132px] -translate-x-1/2 rounded-full bg-ink/80" />
        </div>
        {mounted ? children : null}
        {mounted && <PresentationMenu />}
      </div>
      {mounted && <RestartButton />}
    </div>
  );
}
