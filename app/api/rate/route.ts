const DATA_URL = "https://api.data.gov.my/data-catalogue?id=exchangerates_daily_0900&limit=30";

type ExchangeRateRow = {
  date?: string;
  rate_type?: string;
  vnd?: number | string;
};

export async function GET() {
  try {
    const response = await fetch(DATA_URL, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit);

    if (!response.ok) throw new Error(`Rate source returned ${response.status}`);

    const rows = await response.json() as ExchangeRateRow[];
    const latest = rows
      .filter((row) => row.rate_type === "middle" && row.date && Number(row.vnd) > 0)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];

    if (!latest) throw new Error("No current VND midpoint rate found");

    return Response.json({
      date: latest.date,
      ratePerHundred: Number(latest.vnd) * 100,
      source: "Bank Negara Malaysia via data.gov.my",
    }, {
      headers: { "Cache-Control": "public, max-age=1800, s-maxage=3600" },
    });
  } catch {
    return Response.json({ error: "Latest rate unavailable" }, { status: 503 });
  }
}
