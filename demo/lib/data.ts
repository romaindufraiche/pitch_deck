import brandsJson from "@/data/brands.json";
import productsJson from "@/data/products.json";
import userJson from "@/data/user.json";
import ordersJson from "@/data/orders.json";
import wardrobeJson from "@/data/wardrobe.json";
import wearLogJson from "@/data/wear-log.json";
import calendarJson from "@/data/calendar.json";
import weatherJson from "@/data/weather.json";
import type { Brand, BrandId, CalendarTemplate, Order, Product, UserProfile, WardrobeItem, WearDay, WeatherDay } from "./types";

export const brands = brandsJson as unknown as Brand[];
export const products = productsJson as unknown as Product[];
export const user = userJson as unknown as UserProfile;
export const orders = ordersJson as unknown as Order[];
export const baseWardrobe = wardrobeJson as unknown as WardrobeItem[];
export const wearLog = wearLogJson as { days: WearDay[]; pinnedTuesday: { weekday: number; itemIds: string[]; occasion: string; laundry: string[] } };
export const calendarTemplates = calendarJson as unknown as CalendarTemplate[];
export const weather = weatherJson as unknown as { city: string; days: WeatherDay[] };

export const brandById = Object.fromEntries(brands.map((b) => [b.id, b])) as Record<BrandId, Brand>;
export const productById = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>;
export const ordersByBrand = (id: BrandId) => orders.filter((o) => o.brandId === id);
export const formatPrice = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;
export const formatSize = (s: string | null) => (s === "TU" ? "unique" : s ? s.replace(".", ",") : "—");
