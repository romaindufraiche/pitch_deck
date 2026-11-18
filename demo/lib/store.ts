"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrandId, ItemStatus, WardrobeItem } from "./types";
import type { ItemOverride, WardrobeState } from "./wardrobe";
import type { Card } from "./cards";
import { personas } from "./data";
import type { PersonaId } from "./types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards: Card[];
  /** segments dans l'ordre d'arrivée (texte et cartes entrelacés) */
  parts?: ({ t: "text"; v: string } | { t: "card"; card: Card })[];
  /** réponse en cours de génération */
  pending?: boolean;
  /** étapes affichées pendant l'analyse (agenda, météo…) */
  steps?: string[];
};

export type CartLine = { productId: string; size: string };
export type PlacedOrder = { id: string; date: string; lines: CartLine[]; total: number };

type Profile = { firstName: string; age: number; heightCm: number; weightKg: number; build: string };
type Consents = { wardrobe: boolean; purchases: boolean; anonymized: boolean };

type State = WardrobeState & {
  onboarded: boolean;
  account: "apple" | "google" | "email" | null;
  profile: Profile;
  quiz: string[];
  colors: string[];
  budget: number;
  consents: Consents;
  merges: Record<string, "merged" | "separate">;
  answeredPrompts: string[];
  cart: CartLine[];
  placedOrders: PlacedOrder[];
  chat: ChatMessage[];
  /** dernier mode de l'assistant (« live » ou « secours ») : visible seulement dans le menu présentation */
  lastAssistantMode: "live" | "secours" | null;
};

type Actions = {
  set: (p: Partial<State>) => void;
  setProfile: (p: Partial<Profile>) => void;
  setConsents: (p: Partial<Consents>) => void;
  connect: (id: BrandId) => void;
  disconnect: (id: BrandId) => void;
  override: (itemId: string, o: ItemOverride) => void;
  setStatus: (itemId: string, status: ItemStatus) => void;
  addItem: (it: WardrobeItem) => void;
  answerPrompt: (key: string) => void;
  addToCart: (l: CartLine) => void;
  clearCart: () => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (o: PlacedOrder) => void;
  pushMessage: (m: ChatMessage) => void;
  patchMessage: (id: string, fn: (m: ChatMessage) => ChatMessage) => void;
  clearChat: () => void;
  reset: () => void;
  prefill: (persona?: PersonaId) => void;
  /** choix du profil à l'inscription : remet le dressing à zéro pour ce profil */
  choosePersona: (persona: PersonaId) => void;
};

const initial: State = {
  persona: "thomas",
  connected: [],
  scanned: false,
  prefilled: false,
  overrides: {},
  added: [],
  onboarded: false,
  account: null,
  profile: { firstName: "", age: 28, heightCm: 178, weightKg: 72, build: "Normale" },
  quiz: [],
  colors: [],
  budget: 100,
  consents: { wardrobe: true, purchases: true, anonymized: false },
  merges: {},
  answeredPrompts: [],
  cart: [],
  placedOrders: [],
  chat: [],
  lastAssistantMode: null,
};

export const PREFILLS: Record<PersonaId, Partial<State>> = {
  thomas: {
    persona: "thomas",
    connected: ["verac", "bastide", "kolm", "ferrand"],
    quiz: ["lk-smart-casual", "lk-navy-blazer", "lk-camel-street"],
    colors: ["Marine", "Gris", "Blanc", "Beige", "Vert olive"],
  },
  lea: {
    persona: "lea",
    connected: ["verac", "bastide", "kolm", "ferrand", "bitume"],
    quiz: ["lkf-street-cargo", "lkf-beige-suit", "lkf-white-blazer"],
    colors: ["Noir", "Blanc", "Beige", "Vert olive", "Camel"],
  },
};
const prefillFor = (id: PersonaId): Partial<State> => {
  const u = personas[id];
  return {
    ...PREFILLS[id], scanned: true, prefilled: true, onboarded: true, account: "apple",
    profile: { firstName: u.firstName, age: u.age, heightCm: u.heightCm, weightKg: u.weightKg, build: id === "lea" ? "Fine" : "Normale" },
    budget: u.monthlyBudget, consents: { wardrobe: true, purchases: true, anonymized: true },
  };
};

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      set: (p) => set(p),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setConsents: (p) => set((s) => ({ consents: { ...s.consents, ...p } })),
      connect: (id) => set((s) => ({ connected: s.connected.includes(id) ? s.connected : [...s.connected, id] })),
      disconnect: (id) => set((s) => ({ connected: s.connected.filter((x) => x !== id) })),
      override: (itemId, o) => set((s) => ({ overrides: { ...s.overrides, [itemId]: { ...s.overrides[itemId], ...o } } })),
      setStatus: (itemId, status) => set((s) => ({ overrides: { ...s.overrides, [itemId]: { ...s.overrides[itemId], status } } })),
      addItem: (it) => set((s) => ({ added: [it, ...s.added] })),
      answerPrompt: (key) => set((s) => ({ answeredPrompts: [...s.answeredPrompts, key] })),
      addToCart: (l) => set((s) => ({ cart: [...s.cart.filter((x) => x.productId !== l.productId), l] })),
      clearCart: () => set({ cart: [] }),
      removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      placeOrder: (o) => set((s) => ({ placedOrders: [o, ...s.placedOrders], cart: [] })),
      pushMessage: (m) => set((s) => ({ chat: [...s.chat, m] })),
      patchMessage: (id, fn) => set((s) => ({ chat: s.chat.map((m) => (m.id === id ? fn(m) : m)) })),
      clearChat: () => set({ chat: [] }),
      reset: () => set({ ...initial }),
      prefill: (persona = "thomas") => set({ ...initial, ...prefillFor(persona) }),
      choosePersona: (persona) => {
        const u = personas[persona];
        set({ persona, connected: [], scanned: false, prefilled: false, overrides: {}, added: [], merges: {}, answeredPrompts: [], cart: [], chat: [], budget: u.monthlyBudget,
          profile: { firstName: u.firstName, age: u.age, heightCm: u.heightCm, weightKg: u.weightKg, build: persona === "lea" ? "Fine" : "Normale" }, quiz: [], colors: [] });
      },
    }),
    { name: "dressr-demo", version: 2, migrate: () => ({ ...initial }) as never },
  ),
);

/** sélection sérialisable de l'état utile à la garde-robe */
export const wardrobeStateOf = (s: WardrobeState): WardrobeState => ({
  persona: s.persona ?? "thomas", connected: s.connected, scanned: s.scanned, prefilled: s.prefilled, overrides: s.overrides, added: s.added,
});
