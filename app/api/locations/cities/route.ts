import { NextResponse } from "next/server";
import { getNigerianCities } from "@/lib/nigeria-locations";

export async function GET(request: Request) {
  const state = new URL(request.url).searchParams.get("state") ?? "";
  try {
    const cities = await getNigerianCities(state);
    if (!cities) return NextResponse.json({ error: "Choose a valid Nigerian state." }, { status: 400 });
    return NextResponse.json({ cities }, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("Nigerian city lookup failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "City suggestions are temporarily unavailable." }, { status: 503 });
  }
}
