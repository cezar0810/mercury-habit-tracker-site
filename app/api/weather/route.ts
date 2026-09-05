type MetForecast = {
  properties?: {
    timeseries?: Array<{
      time?: string;
      data?: {
        instant?: {
          details?: {
            air_temperature?: number;
            relative_humidity?: number;
            wind_speed?: number;
            wind_from_direction?: number;
            air_pressure_at_sea_level?: number;
          };
        };
        next_1_hours?: {
          summary?: { symbol_code?: string };
          details?: { precipitation_amount?: number };
        };
        next_6_hours?: { summary?: { symbol_code?: string } };
        next_12_hours?: { summary?: { symbol_code?: string } };
      };
    }>;
  };
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const latitude = Number(requestUrl.searchParams.get("lat"));
  const longitude = Number(requestUrl.searchParams.get("lon"));
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return Response.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  const lat = Math.round(latitude * 10_000) / 10_000;
  const lon = Math.round(longitude * 10_000) / 10_000;
  const endpoint = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
  endpoint.searchParams.set("lat", String(lat));
  endpoint.searchParams.set("lon", String(lon));

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MercuryHabitTracker/1.0 (https://mercury-habit-tracker-site.cezaraugust76.workers.dev/)",
      },
    });
    if (!response.ok) throw new Error(`MET Norway respondeu ${response.status}`);
    const forecast = await response.json() as MetForecast;
    const current = forecast.properties?.timeseries?.find(
      (item) => Number.isFinite(item.data?.instant?.details?.air_temperature),
    );
    const details = current?.data?.instant?.details;
    if (!current || !details || !Number.isFinite(details.air_temperature)) {
      throw new Error("Previsão sem temperatura atual");
    }
    const symbolCode =
      current.data?.next_1_hours?.summary?.symbol_code ||
      current.data?.next_6_hours?.summary?.symbol_code ||
      current.data?.next_12_hours?.summary?.symbol_code ||
      "cloudy";
    const observedAt = current.time ? Date.parse(current.time) : Date.now();
    const next24Hours = (forecast.properties?.timeseries || []).filter((item) => {
      const timestamp = item.time ? Date.parse(item.time) : Number.NaN;
      return Number.isFinite(timestamp) && timestamp >= observedAt && timestamp <= observedAt + 24 * 60 * 60 * 1000;
    });
    const temperatures = next24Hours
      .map((item) => item.data?.instant?.details?.air_temperature)
      .filter((value): value is number => Number.isFinite(value));

    return Response.json(
      {
        temperature: details.air_temperature,
        minTemperature: temperatures.length ? Math.min(...temperatures) : details.air_temperature,
        maxTemperature: temperatures.length ? Math.max(...temperatures) : details.air_temperature,
        humidity: details.relative_humidity ?? null,
        windSpeed: details.wind_speed ?? null,
        windDirection: details.wind_from_direction ?? null,
        pressure: details.air_pressure_at_sea_level ?? null,
        precipitationNextHour: current.data?.next_1_hours?.details?.precipitation_amount ?? null,
        symbolCode,
        observedAt: current.time ?? null,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Não foi possível consultar o clima agora." },
      { status: 502 },
    );
  }
}
