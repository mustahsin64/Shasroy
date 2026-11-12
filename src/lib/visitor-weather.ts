import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { locationFromHeaders } from "@/lib/visitor-location";
import { getWeatherAt, type ShopWeather } from "@/lib/weather";

/** Weather where the visitor is; shared by the layout and header within one request. */
export const getVisitorWeather = cache(async (): Promise<ShopWeather> => getWeatherAt(locationFromHeaders(await headers())));
