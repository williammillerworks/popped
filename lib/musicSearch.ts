import type { MusicSearchResult } from "../types/music";

type ItunesSearchResponse = {
  resultCount?: number;
  results?: ItunesTrackResult[];
};

type ItunesTrackResult = {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  releaseDate?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  country?: string;
  primaryGenreName?: string;
  trackExplicitness?: string;
};

export function normalizeCountryCode(country: string | null): string {
  const normalizedCountry = (country ?? "US").trim().toUpperCase();

  if (/^[A-Z]{2}$/.test(normalizedCountry)) {
    return normalizedCountry;
  }

  return "US";
}

export function normalizeItunesSearchResponse(
  response: ItunesSearchResponse,
  fallbackCountry: string,
): MusicSearchResult[] {
  return (response.results ?? [])
    .map((result) => normalizeItunesTrackResult(result, fallbackCountry))
    .filter((result): result is MusicSearchResult => Boolean(result));
}

function normalizeItunesTrackResult(
  result: ItunesTrackResult,
  fallbackCountry: string,
): MusicSearchResult | null {
  if (
    result.wrapperType !== "track" ||
    result.kind !== "song" ||
    typeof result.trackId !== "number" ||
    !result.trackName ||
    !result.artistName
  ) {
    return null;
  }

  return {
    source: "itunes",
    trackId: result.trackId,
    trackName: result.trackName,
    artistName: result.artistName,
    collectionName: result.collectionName,
    releaseDate: result.releaseDate,
    artworkUrl: upgradeArtworkUrl(result.artworkUrl100),
    previewUrl: result.previewUrl,
    country: fallbackCountry,
    primaryGenreName: result.primaryGenreName,
    trackExplicitness: result.trackExplicitness,
  };
}

function upgradeArtworkUrl(artworkUrl?: string): string | undefined {
  return artworkUrl?.replace("100x100bb", "600x600bb");
}
