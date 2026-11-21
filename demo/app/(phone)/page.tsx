"use client";

import { useStatusTone } from "@/lib/tone";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/logo";
import { useStore } from "@/lib/store";
import { APP_TAGLINE } from "@/lib/config";

export default function Splash() {
  useStatusTone("dark");
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);
  useEffect(() => {
    const t = setTimeout(() => router.replace(onboarded ? "/accueil" : "/bienvenue"), 1500);
    return () => clearTimeout(t);
  }, [router, onboarded]);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-paper text-ink">
      <motion.div aria-hidden className="aura-halo absolute h-[520px] w-[520px]" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} />
      <motion.div className="relative" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
        <Logo size={64} />
      </motion.div>
      <motion.p className="relative mt-3 font-display text-[22px] italic text-rust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
        {APP_TAGLINE}
      </motion.p>
      <motion.div className="absolute bottom-16 h-px w-24 origin-left bg-aura" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
    </div>
  );
}
