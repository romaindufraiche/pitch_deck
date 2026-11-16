"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Feuille glissante, contenue dans le cadre du téléphone. */
export function Sheet({ open, onClose, children, full = false, dark = false, title }: { open: boolean; onClose: () => void; children: React.ReactNode; full?: boolean; dark?: boolean; title?: string }) {
  // rendu dans le cadre du téléphone, au-dessus de l'écran défilant
  const host = typeof document !== "undefined" ? document.getElementById("phone") : null;
  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-[80] flex items-end bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={`relative w-full overflow-hidden rounded-t-[28px] ${dark ? "bg-ink text-paper" : "bg-paper"} ${full ? "h-[94%]" : "max-h-[90%]"}`}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-current opacity-15" />
            {title && <p className="px-6 pt-3 text-center text-[13px] font-medium">{title}</p>}
            <button aria-label="Fermer" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-black/5 p-1.5"><X className="size-4" /></button>
            <div className="h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: "calc(var(--bottom) + 12px)" }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    host,
  );
}
