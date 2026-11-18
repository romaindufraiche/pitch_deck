import brandsJson from "@/data/brands.json";
import productsJson from "@/data/products.json";
import personasJson from "@/data/personas.json";
import ordersJson from "@/data/orders.json";
import wardrobeJson from "@/data/wardrobe.json";
import wearLogJson from "@/data/wear-log.json";
import calendarJson from "@/data/calendar.json";
import weatherJson from "@/data/weather.json";
import type { Brand, BrandId, CalendarTemplate, Gender, Order, PersonaId, Product, UserProfile, WardrobeItem, WearLog, WeatherDay } from "./types";

export const brands = brandsJson as unknown as Brand[];
export const products = productsJson as unknown as Product[];
export const personas = personasJson as unknown as Record<PersonaId, UserProfile>;
/** profil par défaut (utilisé quand aucun profil n'est encore choisi) */
export const user = personas.thomas;
export const personaOf = (id: PersonaId | undefined | null) => personas[id ?? "thomas"] ?? personas.thomas;
export const orders = ordersJson as unknown as Order[];
export const baseWardrobe = wardrobeJson as unknown as WardrobeItem[];
export const wearLogs = wearLogJson as unknown as Record<PersonaId, WearLog>;
export const calendarTemplates = calendarJson as unknown as CalendarTemplate[];
export const weather = weatherJson as unknown as { city: string; days: WeatherDay[] };

export const brandById = Object.fromEntries(brands.map((b) => [b.id, b])) as Record<BrandId, Brand>;
export const productById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;
export const ordersByBrand = (id: BrandId, persona: PersonaId = "thomas") => orders.filter((o) => o.brandId === id && o.persona === persona);
/** produits visibles pour un profil : son genre + mixte */
export const forGender = (g: Gender | "tous") => (p: Product) => g === "tous" || p.gender === g || p.gender === "mixte";
export const formatPrice = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;
export const formatSize = (s: string | null) => (s === "TU" ? "unique" : s ? s.replace(".", ",") : "—");
