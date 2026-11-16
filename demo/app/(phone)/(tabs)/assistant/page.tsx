"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, RotateCcw, Sparkles } from "lucide-react";
import { useStore, wardrobeStateOf, type ChatMessage } from "@/lib/store";
import { useToday, useWardrobe } from "@/lib/hooks";
import { streamAssistant } from "@/lib/assistant-client";
import { SUGGESTIONS } from "@/lib/scenarios";
import { CardView } from "@/components/chat-cards";
import { TAB_BAR_SPACE } from "@/components/tab-bar";
import { user } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Rendu minimal : **gras** et paragraphes. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.trim().split(/\n{2,}/).map((para, k) => (
        <p key={k} className={k ? "mt-2.5" : ""}>
          {para.split(/(\*\*[^*]+\*\*)/g).map((s, j) => (s.startsWith("**") && s.endsWith("**") ? <strong key={j} className="font-semibold">{s.slice(2, -2)}</strong> : <span key={j}>{s}</span>))}
        </p>
      ))}
    </>
  );
}

function Thinking({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-1.5">
      {steps.map((s, k) => {
        const last = k === steps.length - 1;
        return (
          <motion.p key={s + k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className={cn("flex items-center gap-2 text-[12.5px]", last ? "text-ink" : "text-mute")}>
            {last ? <span className="relative flex size-3.5 items-center justify-center"><span className="absolute size-3.5 animate-ping rounded-full bg-rust/40" /><span className="size-2 rounded-full bg-rust" /></span> : <Check className="size-3.5 text-ok" />}
            {s}
          </motion.p>
        );
      })}
    </div>
  );
}

function AssistantInner() {
  const router = useRouter();
  const q = useSearchParams().get("q");
  const today = useToday();
  const items = useWardrobe();
  const chat = useStore((s) => s.chat);
  const pushMessage = useStore((s) => s.pushMessage);
  const patchMessage = useStore((s) => s.patchMessage);
  const clearChat = useStore((s) => s.clearChat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const sentQ = useRef<string | null>(null);

  const scrollDown = () => requestAnimationFrame(() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }));

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setInput("");
    const s = useStore.getState();
    const history = [...s.chat.filter((m) => !m.pending && m.text), { id: "x", role: "user" as const, text: t, cards: [] }].slice(-8).map((m) => ({ role: m.role, text: m.text }));
    pushMessage({ id: `u${Date.now()}`, role: "user", text: t, cards: [] });
    const aid = `a${Date.now()}`;
    pushMessage({ id: aid, role: "assistant", text: "", cards: [], pending: true, steps: [] });
    scrollDown();
    await streamAssistant({ messages: history, state: wardrobeStateOf(s), today, budget: s.budget }, (e) => {
      if (e.type === "mode") useStore.getState().set({ lastAssistantMode: e.mode });
      if (e.type === "step") patchMessage(aid, (m) => ({ ...m, steps: [...(m.steps ?? []), e.label] }));
      if (e.type === "text") patchMessage(aid, (m) => {
        const parts = [...(m.parts ?? [])];
        const last = parts[parts.length - 1];
        if (last && last.t === "text") parts[parts.length - 1] = { t: "text", v: last.v + e.delta };
        else parts.push({ t: "text", v: e.delta });
        return { ...m, text: m.text + e.delta, parts };
      });
      if (e.type === "card") { patchMessage(aid, (m) => ({ ...m, cards: [...m.cards, e.card], parts: [...(m.parts ?? []), { t: "card", card: e.card }] })); scrollDown(); }
    });
    patchMessage(aid, (m) => ({ ...m, pending: false }));
    setBusy(false);
  };

  useEffect(() => {
    if (q && sentQ.current !== q) {
      sentQ.current = q;
      router.replace("/assistant");
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => { scrollDown(); }, [chat.length]);

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="z-20 flex items-center gap-3 border-b border-line/70 bg-paper/90 px-5 pb-3 backdrop-blur-xl" style={{ paddingTop: "calc(var(--top) + 6px)" }}>
        <span className="flex size-10 items-center justify-center rounded-full bg-ink text-paper"><Sparkles className="size-[18px]" strokeWidth={1.6} /></span>
        <div className="flex-1">
          <p className="text-[15px] font-semibold leading-tight">Votre styliste</p>
          <p className="text-[11.5px] text-mute">Connaît vos {items.length} pièces, votre agenda et la météo</p>
        </div>
        {chat.length > 0 && <button aria-label="Nouvelle conversation" onClick={() => !busy && clearChat()} className="tap rounded-full p-2 text-mute hover:bg-black/5"><RotateCcw className="size-4" /></button>}
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 no-scrollbar" style={{ paddingBottom: 16 }}>
        {chat.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-1 pt-6">
            <p className="font-display text-[34px] font-medium leading-[1.05]">Bonjour {user.firstName},<br />que puis-je préparer ?</p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-mute">Une tenue pour une occasion, un accord, une valise, ou ce qui manque vraiment à votre dressing.</p>
            <div className="mt-6 space-y-2">
              {SUGGESTIONS.map((s, k) => (
                <motion.button key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.07 }} onClick={() => send(s)} className="tap block w-full rounded-2xl bg-white px-4 py-3.5 text-left text-[13.5px] leading-snug hover:bg-white/70">
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {chat.map((m: ChatMessage) =>
            m.role === "user" ? (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <p className="max-w-[82%] rounded-[20px] rounded-br-md bg-ink px-4 py-2.5 text-[14px] leading-snug text-paper">{m.text}</p>
              </motion.div>
            ) : (
              <div key={m.id} className="space-y-3">
                {m.pending && !m.text && !m.cards.length && (
                  <div className="rounded-[20px] rounded-bl-md bg-white px-4 py-3.5">
                    {m.steps?.length ? <Thinking steps={m.steps} /> : <span className="flex gap-1">{[0, 1, 2].map((k) => <motion.span key={k} className="size-1.5 rounded-full bg-mute" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: k * 0.15 }} />)}</span>}
                  </div>
                )}
                {(m.text || m.cards.length > 0) && <Interleaved m={m} items={items} />}
              </div>
            ),
          )}
        </div>
      </div>

      <div className="z-20 border-t border-line/70 bg-paper/95 px-3 pt-2.5 backdrop-blur-xl" style={{ paddingBottom: `calc(${TAB_BAR_SPACE} - 62px + 6px)`, marginBottom: 62 }}>
        <AnimatePresence>
          {chat.length > 0 && !busy && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.filter((s) => !chat.some((m) => m.text === s)).map((s) => (
                <button key={s} onClick={() => send(s)} className="tap shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[12px]">{s.length > 42 ? s.slice(0, 40) + "…" : s}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 ring-1 ring-line">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Demandez une tenue, une valise…" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-mute" />
          <button aria-label="Envoyer" disabled={!input.trim() || busy} className="tap flex size-9 items-center justify-center rounded-full bg-ink text-paper transition disabled:bg-line disabled:text-mute"><ArrowUp className="size-4" /></button>
        </form>
      </div>
    </div>
  );
}

/** Texte et cartes, dans l'ordre où le styliste les a produits. */
function Interleaved({ m, items }: { m: ChatMessage; items: ReturnType<typeof useWardrobe> }) {
  const parts = m.parts ?? [{ t: "text" as const, v: m.text }, ...m.cards.map((card) => ({ t: "card" as const, card }))];
  return (
    <>
      {parts.map((p, k) =>
        p.t === "text" ? (
          p.v.trim() ? <div key={k} className="max-w-[94%] rounded-[20px] rounded-bl-md bg-white px-4 py-3 text-[14px] leading-relaxed"><Rich text={p.v} /></div> : null
        ) : (
          <motion.div key={k} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 22 }}>
            <CardView card={p.card} items={items} />
          </motion.div>
        ),
      )}
    </>
  );
}

export default function Assistant() {
  return <Suspense><AssistantInner /></Suspense>;
}
