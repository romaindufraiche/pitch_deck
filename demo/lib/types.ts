export type BrandId = "verac" | "bastide" | "kolm" | "norrland" | "ferrand" | "rivage";

export type Category =
  | "hauts"
  | "chemises"
  | "maille"
  | "pantalons"
  | "vestes"
  | "costumes"
  | "chaussures"
  | "accessoires"
  | "sport";

export type Color = { name: string; hex: string };

export type SizeGuide = {
  /** tendance de la marque par rapport à la taille habituelle */
  fit: "petit" | "normal" | "grand";
  /** décalage en nombre de tailles à appliquer (+1 = prendre une taille au-dessus) */
  offset: number;
  /** pour les chaussures : décalage en pointures (−0,5 = prendre une demi-pointure en dessous) */
  shoeOffset: number;
  summary: string;
  advice: string;
  /** systèmes utilisés par la marque */
  systems: string[];
  table: { label: string; values: Record<string, string> }[];
};

export type Brand = {
  id: BrandId;
  name: string;
  tagline: string;
  positioning: string;
  priceRange: [number, number];
  color: string;
  ink: string;
  logo: { font: "serif" | "sans" | "mono" | "condensed" | "script" | "wide"; weight: number; tracking: number; uppercase: boolean; italic?: boolean };
  members: number;
  founded: number;
  city: string;
  sizeGuide: SizeGuide;
  dataRequested: string[];
};

export type Product = {
  id: string;
  ref: string;
  brandId: BrandId;
  name: string;
  category: Category;
  subcategory: string;
  description: string;
  material: string;
  fit: string;
  color: Color;
  otherColors: Color[];
  sizes: { size: string; stock: number }[];
  price: number;
  rating: number;
  reviews: number;
  returnRate: number;
  image: string;
  season: string;
  formality: number;
};

export type ItemStatus = "disponible" | "au linge" | "au pressing";
export type ItemSource = "import" | "video" | "photo";

export type WardrobeItem = {
  id: string;
  source: ItemSource;
  category: Category;
  subcategory: string;
  name: string;
  brandId: BrandId | null;
  brandName: string;
  color: Color;
  material: string | null;
  size: string | null;
  fit: string | null;
  season: string;
  formality: number;
  purchaseDate: string | null;
  price: number | null;
  ref: string | null;
  productId: string | null;
  orderId: string | null;
  /** nombre de ports avant la période du journal (30 derniers jours) */
  baseWears: number;
  /** dernier port connu avant la période du journal, en jours */
  baseLastWornDaysAgo: number | null;
  status: ItemStatus;
  image: string;
  /** détection vidéo : quantité approximative */
  quantity: number;
  /** détection vidéo : champs encore à compléter */
  missing: string[];
  notes?: string;
  /** vues sous plusieurs angles (rotation 360° à partir de photos) */
  gallery?: string[];
};

export type Order = {
  id: string;
  brandId: BrandId;
  date: string;
  items: { productId: string; name: string; size: string; color: string; price: number; qty: number; returned?: { reason: string; date: string } }[];
  total: number;
  shipping: number;
  status: "livrée" | "retournée partiellement" | "remboursée";
};

export type WearDay = { daysAgo: number; itemIds: string[]; occasion: string };

export type CalendarTemplate = {
  id: string;
  /** "tomorrow" | "next:4" (prochain jeudi) | "offset:21" */
  when: string;
  time: string | null;
  durationDays?: number;
  title: string;
  place: string;
  dressCode: "business formel" | "smart casual" | "casual" | "habillé" | "sport";
  dressCodeNote: string;
};

export type WeatherDay = { offset: number; tempMin: number; tempMax: number; condition: "pluie" | "averses" | "nuageux" | "éclaircies" | "soleil" | "couvert"; rainProb: number; wind: number };

export type UserProfile = {
  firstName: string;
  lastName: string;
  age: number;
  job: string;
  city: string;
  heightCm: number;
  weightKg: number;
  build: string;
  style: string;
  favoriteColors: Color[];
  dislikes: string[];
  monthlyBudget: number;
  reference: { top: string; collar: string; waist: string; inseam: string; trousersFr: string; jacket: string; shoe: string; chestCm: number; waistCm: number };
  avatar: string;
};
