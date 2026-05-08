import { NextResponse } from "next/server";

import {
  normalizeCountryCode,
  normalizeItunesSearchResponse,
} from "../../../../../lib/musicSearch";
import { getAdminSession } from "../../../../../lib/adminAuth";

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const SEARCH_LIMIT = "25";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { error: "Admin authentication required.", results: [] },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term")?.trim() ?? "";
  const country = normalizeCountryCode(searchParams.get("country"));

  if (!term) {
    return NextResponse.json(
      { error: "Search term is required.", results: [] },
      { status: 400 },
    );
  }

  const itunesSearchUrl = new URL(ITUNES_SEARCH_URL);
  itunesSearchUrl.searchParams.set("term", term);
  itunesSearchUrl.searchParams.set("country", country);
  itunesSearchUrl.searchParams.set("media", "music");
  itunesSearchUrl.searchParams.set("entity", "song");
  itunesSearchUrl.searchParams.set("limit", SEARCH_LIMIT);

  try {
    const response = await fetch(itunesSearchUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Music search failed. Please try again.", results: [] },
        { status: 502 },
      );
    }

    const data = await response.json();
    const results = normalizeItunesSearchResponse(data, country);

    return NextResponse.json({
      country,
      results,
      source: "itunes",
      term,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Music search is unavailable right now.", results: [] },
      { status: 502 },
    );
  }
}
