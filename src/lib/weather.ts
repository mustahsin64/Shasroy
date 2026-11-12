// Live weather at the visitor's approximate location sets the storefront
// background scene. Open-Meteo is free and needs no API key; responses are
// cached for 30 minutes per rounded location.

import type { VisitorLocation } from "@/lib/visitor-location";

export type WeatherKind = "hot" | "rain" | "winter" | "normal";

export const WEATHER_KINDS: readonly WeatherKind[] = ["hot", "rain", "winter", "normal"];

export const WEATHER_LABEL_BN: Record<WeatherKind, string> = {
  hot: "প্রখর রোদ",
  rain: "বৃষ্টি",
  winter: "শীতের আমেজ",
  normal: "মনোরম আবহাওয়া",
};

export type ShopWeather = {
  kind: WeatherKind;
  cityName: string;
  isDay: boolean;
  /** Rounded °C; null when live weather was unavailable and the season was used instead. */
  temperatureC: number | null;
};

// WMO weather codes: drizzle, freezing drizzle, rain, freezing rain, showers, thunderstorms.
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const FOG_CODES = new Set([45, 48]);

export function classifyWeather(input: {
  temperatureC: number;
  apparentC: number;
  weatherCode: number;
  precipitationMm: number;
  month: number;
}): WeatherKind {
  const { temperatureC, apparentC, weatherCode, precipitationMm, month } = input;
  if (RAIN_CODES.has(weatherCode) || precipitationMm >= 0.2) return "rain";
  // Bangladesh summers are humid, so "feels like" matters as much as the reading.
  if (temperatureC >= 33 || apparentC >= 36) return "hot";
  const winterMonth = month === 12 || month <= 2;
  if (temperatureC <= 18 || (winterMonth && temperatureC <= 24) || (FOG_CODES.has(weatherCode) && temperatureC <= 24)) {
    return "winter";
  }
  return "normal";
}

/** Bangladesh seasons, used when live weather cannot be fetched. */
export function seasonalWeather(month: number): WeatherKind {
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "hot";
  if (month <= 9) return "rain";
  return "normal";
}

/** Month (1-12) and hour (0-23) in Bangladesh time, which is UTC+6 all year. */
export function dhakaMonthHour(ms: number) {
  const d = new Date(ms + 6 * 3_600_000);
  return { month: d.getUTCMonth() + 1, hour: d.getUTCHours() };
}

/** Month and hour in the given IANA zone; Bangladesh time when the zone is unknown. */
export function localMonthHour(ms: number, timeZone: string | null) {
  if (!timeZone) return dhakaMonthHour(ms);
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric", hour: "numeric", hourCycle: "h23" }).formatToParts(ms);
    const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const month = pick("month");
    const hour = pick("hour");
    return Number.isInteger(month) && Number.isInteger(hour) ? { month, hour } : dhakaMonthHour(ms);
  } catch {
    return dhakaMonthHour(ms);
  }
}

type OpenMeteoCurrent = {
  temperature_2m?: number;
  apparent_temperature?: number;
  weather_code?: number;
  precipitation?: number;
  is_day?: number;
};

export async function getWeatherAt(location: VisitorLocation): Promise<ShopWeather> {
  const { month, hour } = localMonthHour(Date.now(), location.timeZone);
  const fallback: ShopWeather = { kind: seasonalWeather(month), cityName: location.cityName, isDay: hour >= 6 && hour < 18, temperatureC: null };
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,weather_code,precipitation,is_day",
    timezone: "auto",
  }).toString();
  try {
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return fallback;
    const current = ((await res.json()) as { current?: OpenMeteoCurrent }).current;
    if (typeof current?.temperature_2m !== "number") return fallback;
    const temperatureC = current.temperature_2m;
    return {
      kind: classifyWeather({
        temperatureC,
        apparentC: current.apparent_temperature ?? temperatureC,
        weatherCode: current.weather_code ?? 0,
        precipitationMm: current.precipitation ?? 0,
        month,
      }),
      cityName: location.cityName,
      isDay: current.is_day === undefined ? fallback.isDay : current.is_day === 1,
      temperatureC: Math.round(temperatureC),
    };
  } catch {
    // Offline build, timeout or API outage: the season is a good enough guess.
    return fallback;
  }
}
