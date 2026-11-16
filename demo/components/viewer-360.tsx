"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Rotate3d } from "lucide-react";

/** Vue 360° à partir d'une série de photos du même article sous plusieurs angles : glisser pour tourner. */
export function Viewer360({ frames, alt }: { frames: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [hint, setHint] = useState(true);
  const start = useRef<{ x: number; i: number } | null>(null);

  useEffect(() => {
    frames.forEach((f) => { const im = new Image(); im.src = f; });
    let k = 0;
    const t = setInterval(() => { k++; setI(k % frames.length); if (k >= frames.length) clearInterval(t); }, 260);
    return () => clearInterval(t);
  }, [frames]);

  return (
    <div
      className="relative h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={(e) => { start.current = { x: e.clientX, i }; setHint(false); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const step = Math.round((e.clientX - start.current.x) / 38);
        setI(((start.current.i - step) % frames.length + frames.length) % frames.length);
      }}
      onPointerUp={() => (start.current = null)}
    >
      {frames.map((f, k) => (
        <img key={f} src={f} alt={k === 0 ? alt : ""} draggable={false} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150" style={{ opacity: k === i ? 1 : 0 }} />
      ))}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-[11.5px] text-paper backdrop-blur">
        <Rotate3d className="size-3.5" /> 360° · {hint ? "glissez pour tourner" : `vue ${i + 1}/${frames.length}`}
      </div>
      <div className="absolute bottom-[52px] left-1/2 flex -translate-x-1/2 gap-1">
        {frames.map((_, k) => <motion.span key={k} className="h-1 rounded-full bg-paper" animate={{ width: k === i ? 14 : 5, opacity: k === i ? 1 : 0.5 }} />)}
      </div>
    </div>
  );
}
