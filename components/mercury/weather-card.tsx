"use client";

import { CloudRain, Droplets, Gauge, LocateFixed, RefreshCw, Wind } from "lucide-react";
import { useEffect, useState } from "react";

const LOCATION_KEY = "mercury-weather-location-v1";
const DEFAULT_LOCATION = {
  latitude: -20.5575,
  longitude: -48.5678,
  label: "Barretos",
};

type WeatherLocation = typeof DEFAULT_LOCATION;

type WeatherResult = {
  temperature: number;
  minTemperature: number;
  maxTemperature: number;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
  precipitationNextHour: number | null;
  symbolCode: string;
};

function windDirection(degrees: number | null) {
  if (degrees === null || !Number.isFinite(degrees)) return "";
  return ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(degrees / 45) % 8];
}

function weatherPresentation(symbolCode: string) {
  const code = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  const night = symbolCode.endsWith("_night");
  if (code.includes("thunder")) return { icon: "⛈️", description: "Trovoadas" };
  if (code.includes("snow")) return { icon: "🌨️", description: "Neve" };
  if (code.includes("sleet")) return { icon: "🌧️", description: "Chuva gelada" };
  if (code.includes("rain") || code.includes("drizzle")) return { icon: "🌧️", description: "Chuva" };
  if (code.includes("fog")) return { icon: "🌫️", description: "Neblina" };
  if (code.includes("partlycloudy")) return { icon: night ? "☁️" : "🌤️", description: "Parcialmente nublado" };
  if (code.includes("cloudy")) return { icon: "☁️", description: "Nublado" };
  if (code.includes("fair")) return { icon: night ? "🌙" : "🌤️", description: "Poucas nuvens" };
  return { icon: night ? "🌙" : "☀️", description: "Céu limpo" };
}

export function WeatherCard({ compact = false }: { compact?: boolean }) {
  const [location, setLocation] = useState<WeatherLocation>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadWeather(nextLocation: WeatherLocation) {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        lat: String(nextLocation.latitude),
        lon: String(nextLocation.longitude),
      });
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) throw new Error("weather unavailable");
      const result = await response.json() as WeatherResult;
      setWeather(result);
    } catch {
      setMessage("Clima indisponível agora");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let initial = DEFAULT_LOCATION;
    try {
      const saved = window.localStorage.getItem(LOCATION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WeatherLocation>;
        if (Number.isFinite(parsed.latitude) && Number.isFinite(parsed.longitude)) {
          initial = {
            latitude: Number(parsed.latitude),
            longitude: Number(parsed.longitude),
            label: typeof parsed.label === "string" ? parsed.label : "Sua localização",
          };
        }
      }
    } catch {
      window.localStorage.removeItem(LOCATION_KEY);
    }
    setLocation(initial);
    void loadWeather(initial);
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Localização não disponível neste navegador");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: Math.round(position.coords.latitude * 10_000) / 10_000,
          longitude: Math.round(position.coords.longitude * 10_000) / 10_000,
          label: "Sua localização",
        };
        setLocation(nextLocation);
        window.localStorage.setItem(LOCATION_KEY, JSON.stringify(nextLocation));
        void loadWeather(nextLocation);
      },
      () => {
        setLoading(false);
        setMessage("Permissão de localização não concedida");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1_800_000 },
    );
  }

  const presentation = weatherPresentation(weather?.symbolCode || "clearsky_day");
  if (compact) return <details className="group max-w-full rounded-2xl border border-sky-300/15 bg-[linear-gradient(135deg,rgba(29,78,146,0.28),rgba(12,16,23,0.95))] px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-white/80 marker:hidden"><span aria-hidden="true" className="text-2xl">{weather ? presentation.icon : "🌤️"}</span><span className="min-w-0 flex-1"><strong className="block truncate text-base text-white">{loading ? "Carregando clima…" : weather ? `${Math.round(weather.temperature)}° · ${presentation.description}` : "Clima indisponível"}</strong><span className="block truncate text-xs text-sky-100/55">{location.label}{weather ? ` · mínima ${Math.round(weather.minTemperature)}° / máxima ${Math.round(weather.maxTemperature)}°` : ""}</span></span><span className="text-xs text-white/40 transition group-open:rotate-180">⌄</span></summary>
    {weather ? <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs text-white/68">
      <span className="flex min-h-10 items-center gap-2"><Droplets className="size-4 text-sky-300" />Umidade {weather.humidity === null ? "—" : `${Math.round(weather.humidity)}%`}</span>
      <span className="flex min-h-10 items-center gap-2"><Wind className="size-4 text-sky-300" />Vento {weather.windSpeed === null ? "—" : `${Math.round(weather.windSpeed)} m/s ${windDirection(weather.windDirection)}`}</span>
      <span className="flex min-h-10 items-center gap-2"><CloudRain className="size-4 text-sky-300" />Próx. hora {weather.precipitationNextHour === null ? "—" : `${weather.precipitationNextHour.toLocaleString("pt-BR")} mm`}</span>
      <span className="flex min-h-10 items-center gap-2"><Gauge className="size-4 text-sky-300" />Pressão {weather.pressure === null ? "—" : `${Math.round(weather.pressure)} hPa`}</span>
    </div> : <p className="mt-3 border-t border-white/10 pt-3 text-white/65">{message}</p>}
    <button type="button" onClick={useCurrentLocation} className="mt-2 min-h-11 text-[#a8c8ff]">Usar minha localização</button>
    <a href="https://www.met.no/en" target="_blank" rel="noreferrer" className="block pb-2 text-xs text-white/55">Dados: MET Norway</a>
    {message && weather && <p className="text-xs text-white/60">{message}</p>}
  </details>;
  return (
    <section className="relative min-h-[154px] overflow-hidden rounded-[25px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(24,88,178,0.3),rgba(12,13,14,0.94)_65%)] p-5">
      <div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-100/65">Agora em {location.label}</p>
          {loading ? (
            <div className="mt-3 h-10 w-24 animate-pulse rounded-xl bg-white/10" />
          ) : weather ? (
            <>
              <p className="mt-1 text-[38px] font-black tracking-[-0.05em]">{Math.round(weather.temperature)}°</p>
              <p className="text-sm text-white/58">{presentation.description}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/38">
                <span>Mín. {Math.round(weather.minTemperature)}° · Máx. {Math.round(weather.maxTemperature)}°</span>
                {weather.humidity !== null && <span>Umidade {Math.round(weather.humidity)}%</span>}
                {weather.windSpeed !== null && <span>Vento {Math.round(weather.windSpeed)} m/s</span>}
                {weather.precipitationNextHour !== null && <span>Chuva na próxima hora {weather.precipitationNextHour.toLocaleString("pt-BR")} mm</span>}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-white/55">{message}</p>
          )}
        </div>
        <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.07] text-[34px] shadow-[0_12px_30px_rgba(0,0,0,0.18)]" aria-label={presentation.description}>
          {presentation.icon}
        </div>
      </div>
      <div className="relative mt-3 flex items-center justify-between gap-3">
        <a href="https://www.met.no/en" target="_blank" rel="noreferrer" className="text-[11px] text-white/32 hover:text-white/55">
          Dados: MET Norway
        </a>
        <button type="button" onClick={weather ? useCurrentLocation : () => void loadWeather(location)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-semibold text-white/58 hover:bg-white/[0.06]" aria-label={weather ? "Usar minha localização" : "Tentar carregar o clima novamente"}>
          {weather ? <LocateFixed className="size-3.5" /> : <RefreshCw className="size-3.5" />}
          {weather ? "Meu local" : "Tentar de novo"}
        </button>
      </div>
      {message && weather && <p className="relative mt-2 text-[11px] text-amber-100/55">{message}</p>}
    </section>
  );
}
