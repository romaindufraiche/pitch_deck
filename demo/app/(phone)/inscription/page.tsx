"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Apple, Check, ChevronLeft, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { user } from "@/lib/data";
import { cn } from "@/lib/utils";

const QUIZ = [
  "lk-smart-casual", "lk-navy-blazer", "lk-camel-street",
  "lk-linen-rooftop", "lk-beige-blazer", "lk-grey-blazer",
  "lk-leather-chino", "lk-denim-couch", "os-corduroy-camel",
];
const COLORS = [
  { name: "Marine", hex: "#1F2A44" }, { name: "Gris", hex: "#9A9DA1" }, { name: "Blanc", hex: "#F7F6F2" }, { name: "Beige", hex: "#C8B48F" },
  { name: "Vert olive", hex: "#5E6440" }, { name: "Noir", hex: "#141414" }, { name: "Camel", hex: "#B08355" }, { name: "Bleu ciel", hex: "#AFC8E0" },
  { name: "Bordeaux", hex: "#6E1F2E" }, { name: "Marron", hex: "#6B4428" }, { name: "Écru", hex: "#EFE8DA" }, { name: "Terracotta", hex: "#B5552D" },
];
const BUILDS = ["Fine", "Normale", "Athlétique", "Forte"];

export default function Inscription() {
  const router = useRouter();
  const st = useStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const total = 6;

  const next = () => setStep((s) => s + 1);
  const signIn = (m: "apple" | "google" | "email") => {
    setLoading(m);
    setTimeout(() => {
      st.set({ account: m });
      st.setProfile({ firstName: user.firstName, age: user.age, heightCm: user.heightCm, weightKg: user.weightKg, build: "Normale" });
      setLoading(null);
      next();
    }, 900);
  };
  const finish = () => router.push("/boutiques?onboarding=1");

  return (
    <div className="absolute inset-0 flex flex-col bg-paper" style={{ paddingTop: "var(--top)" }}>
      {step > 0 && (
        <div className="flex items-center gap-3 px-4 pb-2 pt-1">
          <button aria-label="Retour" onClick={() => setStep(step - 1)} className="tap rounded-full p-1.5 hover:bg-black/5"><ChevronLeft className="size-5" /></button>
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-line">
            <motion.div className="h-full bg-ink" animate={{ width: `${(step / (total - 1)) * 100}%` }} />
          </div>
          <span className="w-9 text-right text-[11px] tabular-nums text-mute">{step}/{total - 1}</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex min-h-0 flex-1 flex-col" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28 }}>
          {step === 0 && (
            <div className="flex flex-1 flex-col">
              <div className="relative mx-4 mt-2 flex-1 overflow-hidden rounded-[28px]">
                <img src="/images/px/hero-flatlay.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-paper"><Logo size={34} /><p className="mt-2 text-[14px] text-paper/85">Créez votre compte pour commencer.</p></div>
              </div>
              <div className="space-y-2.5 px-5 pt-6" style={{ paddingBottom: "calc(var(--bottom) + 16px)" }}>
                <AuthButton onClick={() => signIn("apple")} loading={loading === "apple"} className="bg-ink text-paper" icon={<Apple className="size-[18px]" fill="currentColor" />}>Continuer avec Apple</AuthButton>
                <AuthButton onClick={() => signIn("google")} loading={loading === "google"} className="border border-line bg-white" icon={<span className="font-semibold">G</span>}>Continuer avec Google</AuthButton>
                <AuthButton onClick={() => signIn("email")} loading={loading === "email"} className="border border-line" icon={<Mail className="size-[17px]" />}>Continuer avec un e-mail</AuthButton>
                <p className="px-4 pt-2 text-center text-[11px] leading-relaxed text-mute">En continuant, vous acceptez les Conditions d&apos;utilisation et la Politique de confidentialité.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <StepLayout title={`Enchanté, ${st.profile.firstName || "…"}.`} text="Quelques mesures pour que vos tailles soient justes dès le premier achat." onNext={next}>
              <div className="space-y-6">
                <Field label="Prénom"><input value={st.profile.firstName} onChange={(e) => st.setProfile({ firstName: e.target.value })} className="w-full border-b border-line bg-transparent py-2 text-[17px] outline-none focus:border-ink" /></Field>
                <Field label="Âge" value={`${st.profile.age} ans`}><Slider min={16} max={75} value={[st.profile.age]} onValueChange={(v) => st.setProfile({ age: Array.isArray(v) ? v[0] : v })} /></Field>
                <Field label="Taille" value={`${(st.profile.heightCm / 100).toFixed(2).replace(".", ",")} m`}><Slider min={155} max={205} value={[st.profile.heightCm]} onValueChange={(v) => st.setProfile({ heightCm: Array.isArray(v) ? v[0] : v })} /></Field>
                <Field label="Poids" value={`${st.profile.weightKg} kg`}><Slider min={50} max={120} value={[st.profile.weightKg]} onValueChange={(v) => st.setProfile({ weightKg: Array.isArray(v) ? v[0] : v })} /></Field>
                <Field label="Carrure">
                  <div className="mt-1 grid grid-cols-4 gap-2">
                    {BUILDS.map((b) => (
                      <button key={b} onClick={() => st.setProfile({ build: b })} className={cn("tap rounded-xl border py-2.5 text-[13px]", st.profile.build === b ? "border-ink bg-ink text-paper" : "border-line")}>{b}</button>
                    ))}
                  </div>
                </Field>
              </div>
            </StepLayout>
          )}

          {step === 2 && (
            <StepLayout title="Votre style" text="Choisissez les 3 tenues qui vous ressemblent le plus." onNext={next} disabled={st.quiz.length < 3} cta={st.quiz.length < 3 ? `Encore ${3 - st.quiz.length}` : "Continuer"}>
              <div className="grid grid-cols-3 gap-1.5">
                {QUIZ.map((q) => {
                  const on = st.quiz.includes(q);
                  return (
                    <button key={q} onClick={() => st.set({ quiz: on ? st.quiz.filter((x) => x !== q) : st.quiz.length < 3 ? [...st.quiz, q] : st.quiz })} className="tap relative aspect-[4/5] overflow-hidden rounded-xl">
                      <img src={`/images/px/${q}.jpg`} alt="" className={cn("h-full w-full object-cover transition", on ? "scale-[0.94] rounded-xl" : "")} />
                      {on && <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-ink text-paper"><Check className="size-3.5" /></span>}
                    </button>
                  );
                })}
              </div>
            </StepLayout>
          )}

          {step === 3 && (
            <StepLayout title="Vos couleurs" text="Celles que vous portez le plus volontiers. Votre styliste s'en servira en priorité." onNext={next} disabled={!st.colors.length}>
              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {COLORS.map((c) => {
                  const on = st.colors.includes(c.name);
                  return (
                    <button key={c.name} onClick={() => st.set({ colors: on ? st.colors.filter((x) => x !== c.name) : [...st.colors, c.name] })} className="tap flex flex-col items-center gap-1.5">
                      <span className={cn("flex size-14 items-center justify-center rounded-full border transition", on ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "border-line")} style={{ background: c.hex }}>
                        {on && <Check className="size-4" style={{ color: ["Blanc", "Écru", "Bleu ciel", "Beige"].includes(c.name) ? "#121212" : "#fff" }} />}
                      </span>
                      <span className="text-[11.5px]">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </StepLayout>
          )}

          {step === 4 && (
            <StepLayout title="Votre budget" text="Votre styliste ne vous proposera un achat que s'il manque vraiment une pièce, et dans ce budget." onNext={next}>
              <div className="rounded-3xl bg-white p-6 text-center">
                <p className="eyebrow">Budget mensuel moyen</p>
                <p className="mt-2 font-display text-[64px] leading-none">{st.budget} €</p>
                <p className="mt-1 text-[13px] text-mute">par mois, soit {st.budget * 12} € par an</p>
                <div className="mt-7"><Slider min={30} max={400} step={10} value={[st.budget]} onValueChange={(v) => st.set({ budget: Array.isArray(v) ? v[0] : v })} /></div>
                <div className="mt-6 flex justify-center gap-2">
                  {[80, 120, 200].map((b) => (
                    <button key={b} onClick={() => st.set({ budget: b })} className={cn("tap rounded-full border px-4 py-2 text-[13px]", st.budget === b ? "border-ink bg-ink text-paper" : "border-line")}>{b} €</button>
                  ))}
                </div>
              </div>
            </StepLayout>
          )}

          {step === 5 && (
            <StepLayout title="Vos données, vos choix" text="Chaque autorisation est indépendante. Vous pouvez les modifier à tout moment dans votre profil." onNext={finish} cta="Valider mes choix">
              <div className="space-y-2.5">
                <Consent title="Données de garde-robe" desc="Photos, descriptions et historique de port de vos vêtements. Nécessaire pour que le styliste fonctionne." checked={st.consents.wardrobe} onChange={(v) => st.setConsents({ wardrobe: v })} tag="Recommandé" />
                <Consent title="Import de vos achats" desc="Récupérer vos commandes, tailles et retours chez les marques que vous connectez. Uniquement les marques que vous choisissez." checked={st.consents.purchases} onChange={(v) => st.setConsents({ purchases: v })} />
                <Consent title="Partage anonymisé avec les marques" desc="Statistiques agrégées (jamais votre nom ni vos photos) pour aider les marques à mieux tailler leurs vêtements. Désactivé par défaut." checked={st.consents.anonymized} onChange={(v) => st.setConsents({ anonymized: v })} />
                <div className="flex gap-3 rounded-2xl bg-paper-2 p-4 text-[12px] leading-relaxed text-mute">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
                  <p>Données hébergées en France. Droits d&apos;accès, de rectification, d&apos;effacement et de portabilité (RGPD, art. 15 à 20) depuis Profil &gt; Mes données. Nous ne vendons aucune donnée personnelle.</p>
                </div>
              </div>
            </StepLayout>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AuthButton({ children, onClick, className, icon, loading }: { children: React.ReactNode; onClick: () => void; className?: string; icon: React.ReactNode; loading?: boolean }) {
  return (
    <button onClick={onClick} className={cn("tap relative flex h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-medium", className)}>
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      {loading ? "Connexion…" : children}
    </button>
  );
}

function StepLayout({ title, text, children, onNext, disabled, cta = "Continuer" }: { title: string; text: string; children: React.ReactNode; onNext: () => void; disabled?: boolean; cta?: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 no-scrollbar">
        <h1 className="mt-4 font-display text-[34px] font-medium leading-[1.05]">{title}</h1>
        <p className="mb-6 mt-2 text-[14px] leading-relaxed text-mute">{text}</p>
        {children}
      </div>
      <div className="px-5 pt-2" style={{ paddingBottom: "calc(var(--bottom) + 14px)" }}>
        <button disabled={disabled} onClick={onNext} className="tap h-[52px] w-full rounded-full bg-ink text-[15px] font-medium text-paper transition disabled:bg-line disabled:text-mute">{cta}</button>
      </div>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between"><span className="eyebrow">{label}</span>{value && <span className="text-[15px] font-medium tabular-nums">{value}</span>}</div>
      {children}
    </div>
  );
}

function Consent({ title, desc, checked, onChange, tag }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; tag?: string }) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-2xl bg-white p-4">
      <div className="flex-1">
        <p className="flex items-center gap-2 text-[14.5px] font-medium">{title}{tag && <span className="rounded-full bg-rust-soft px-2 py-0.5 text-[10px] font-medium text-rust">{tag}</span>}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mute">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1" />
    </label>
  );
}
