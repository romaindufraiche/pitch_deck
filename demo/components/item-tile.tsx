"use client";

import Link from "next/link";
import type { DerivedItem } from "@/lib/wardrobe";
import { cn } from "@/lib/utils";

export function StatusDot({ status }: { status: DerivedItem["status"] }) {
  if (status === "disponible") return null;
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur", status === "au linge" ? "bg-[#dfe8f1]/90 text-ink" : "bg-[#efe3d3]/90 text-[#7a4b1e]")}>{status === "au linge" ? "Au linge" : "Au pressing"}</span>;
}

export function ItemTile({ item, compact = false }: { item: DerivedItem; compact?: boolean }) {
  return (
    <Link href={`/dressing/${item.id}`} className="tap group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-paper-2">
        <img src={item.image} alt={item.name} loading="lazy" className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", item.status !== "disponible" && "opacity-70 grayscale-[35%]")} />
        <div className="absolute left-2 top-2 flex gap-1"><StatusDot status={item.status} /></div>
        {item.quantity > 1 && <span className="absolute right-2 top-2 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-paper">×{item.quantity}</span>}
        {item.missing.length > 0 && <span className="absolute bottom-2 right-2 size-2 rounded-full bg-rust ring-2 ring-paper" title="Fiche à compléter" />}
      </div>
      {!compact && (
        <div className="mt-1.5 px-0.5">
          <p className="truncate text-[12px] font-medium leading-tight">{item.name}</p>
          <p className="truncate text-[11px] text-mute">{item.brandName}</p>
        </div>
      )}
    </Link>
  );
}
