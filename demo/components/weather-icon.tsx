import { Cloud, CloudDrizzle, CloudRain, CloudSun, Sun } from "lucide-react";
import type { WeatherDay } from "@/lib/types";

export function WeatherIcon({ c, className = "size-5" }: { c: WeatherDay["condition"]; className?: string }) {
  const I = c === "pluie" ? CloudRain : c === "averses" ? CloudDrizzle : c === "soleil" ? Sun : c === "éclaircies" ? CloudSun : Cloud;
  return <I className={className} strokeWidth={1.5} />;
}
