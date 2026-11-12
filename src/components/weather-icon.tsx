import { CloudFog, CloudRain, CloudSun, Moon, Sun } from "lucide-react";
import type { ShopWeather } from "@/lib/weather";

export function WeatherIcon({ weather, size = 15 }: { weather: ShopWeather; size?: number }) {
  const Icon = weather.kind === "hot" ? Sun : weather.kind === "rain" ? CloudRain : weather.kind === "winter" ? CloudFog : weather.isDay ? CloudSun : Moon;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
