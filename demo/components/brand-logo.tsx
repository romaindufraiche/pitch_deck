import type { Brand } from "@/lib/types";

const FONT: Record<Brand["logo"]["font"], string> = {
  serif: "var(--font-cormorant), Georgia, serif",
  sans: "var(--font-inter), Arial, sans-serif",
  mono: "ui-monospace, monospace",
  condensed: "var(--font-oswald), 'Arial Narrow', sans-serif",
  script: "var(--font-cormorant), Georgia, serif",
  wide: "var(--font-inter), Arial, sans-serif",
};

/** Logotype purement typographique (texte), aux couleurs de la marque fictive. */
export function BrandLogo({ brand, size = 15, color, className }: { brand: Brand; size?: number; color?: string; className?: string }) {
  const l = brand.logo;
  const text = l.uppercase ? brand.name.toUpperCase() : brand.name;
  return (
    <span
      className={className}
      style={{
        fontFamily: FONT[l.font],
        fontWeight: l.weight,
        letterSpacing: `${l.tracking}em`,
        fontStyle: l.italic ? "italic" : "normal",
        fontSize: l.font === "serif" || l.font === "script" ? size * 1.25 : l.font === "wide" ? size * 0.8 : size,
        color: color ?? brand.color,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/** Pastille carrée avec monogramme, pour les listes. */
export function BrandMark({ brand, size = 44 }: { brand: Brand; size?: number }) {
  const initials = brand.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  const l = brand.logo;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: brand.color, color: brand.ink, fontFamily: FONT[l.font], fontWeight: l.weight, fontStyle: l.italic ? "italic" : "normal", fontSize: size * (l.font === "serif" ? 0.46 : 0.36), letterSpacing: l.font === "wide" ? "0.12em" : 0 }}
    >
      {l.uppercase ? initials.toUpperCase() : initials}
    </span>
  );
}
