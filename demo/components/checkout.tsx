"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, Package, Ruler, ShoppingBag, Trash2 } from "lucide-react";
import { brandById, formatPrice, formatSize, productById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Sheet } from "./sheet";
import { APP_NAME } from "@/lib/config";

/** Panier et paiement simulé, communs au catalogue, à l'assistant et aux pages produit. */
export function Checkout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useStore((s) => s.cart);
  const placeOrder = useStore((s) => s.placeOrder);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const [done, setDone] = useState<{ id: string; total: number; brands: string[] } | null>(null);
  const [paying, setPaying] = useState(false);
  const lines = cart.map((c) => ({ ...c, p: productById[c.productId] })).filter((l) => l.p);
  const total = lines.reduce((s, l) => s + l.p.price, 0);
  const close = () => { onClose(); setTimeout(() => setDone(null), 300); };
  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const id = `DR-${new Date().getFullYear().toString().slice(2)}-${String(Math.floor(100000 + Math.random() * 899999))}`;
      placeOrder({ id, date: new Date().toISOString().slice(0, 10), lines: cart, total });
      setDone({ id, total, brands: [...new Set(lines.map((l) => brandById[l.p.brandId].name))] });
      setPaying(false);
    }, 1200);
  };
  return (
    <Sheet open={open} onClose={close} title={done ? undefined : "Votre panier"}>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="px-6 pb-4 pt-8 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok text-paper"><Check className="size-8" /></motion.span>
            <p className="mt-5 font-display text-[22px] leading-tight">Commande confirmée</p>
            <p className="mt-2 text-[13px] text-mute">N° {done.id} · {formatPrice(done.total)}</p>
            <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 text-left text-[12.5px]">
              <p className="flex items-center gap-2"><Package className="size-4 shrink-0 text-mute" /> Livraison prévue sous 2 à 3 jours ouvrés, à domicile.</p>
              <p className="flex items-center gap-2"><Ruler className="size-4 shrink-0 text-mute" /> Tailles transmises à {done.brands.join(", ")}.</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-mute" /> Les pièces apparaîtront dans votre dressing à la livraison.</p>
            </div>
            <button onClick={close} className="tap mt-6 h-12 w-full rounded-full bg-ink text-[14px] font-medium text-paper">Continuer</button>
          </motion.div>
        ) : (
          <motion.div key="cart" className="px-5 pt-4">
            {!lines.length && <p className="py-10 text-center text-[13px] text-mute">Votre panier est vide.</p>}
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-3">
                  <img src={l.p.image} alt="" className="size-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{l.p.name}</p><p className="text-[11.5px] text-mute">{brandById[l.p.brandId].name} · taille {formatSize(l.size)}</p></div>
                  <span className="text-[13px] tabular-nums">{formatPrice(l.p.price)}</span>
                  <button aria-label="Retirer" onClick={() => removeFromCart(l.productId)} className="tap rounded-full p-1.5 text-mute hover:bg-black/5"><Trash2 className="size-3.5" /></button>
                </li>
              ))}
            </ul>
            {lines.length > 0 && (
              <>
                <div className="mt-4 space-y-1.5 rounded-2xl bg-white p-4 text-[13px]">
                  <div className="flex justify-between"><span className="text-mute">Sous-total</span><span>{formatPrice(total)}</span></div>
                  <div className="flex justify-between"><span className="text-mute">Livraison</span><span>Offerte</span></div>
                  <div className="flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>
                <p className="mt-3 text-[11.5px] text-mute">Commande passée via vos comptes marques connectés à {APP_NAME}. Paiement avec la carte enregistrée •••• 4421 · Livraison : 18 rue Oberkampf, 75011 Paris</p>
                <button disabled={paying} onClick={pay} className="tap mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-paper disabled:opacity-60">
                  {paying && <span className="size-4 animate-spin rounded-full border-2 border-paper border-t-transparent" />}
                  {paying ? "Paiement…" : `Payer ${formatPrice(total)}`}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/** Bouton panier avec compteur ; ouvre le panier. */
export function CartButton({ dark = false }: { dark?: boolean }) {
  const count = useStore((s) => s.cart.length);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button aria-label="Panier" onClick={() => setOpen(true)} className={`tap relative flex size-10 items-center justify-center rounded-full ${dark ? "bg-ink text-paper" : "bg-white"}`}>
        <ShoppingBag className="size-[18px]" strokeWidth={1.6} />
        {count > 0 && <motion.span key={count} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-rust text-[10px] font-semibold text-paper">{count}</motion.span>}
      </button>
      <Checkout open={open} onClose={() => setOpen(false)} />
    </>
  );
}
