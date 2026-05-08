export type MusicSearchResult = {
  source: "itunes";
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  releaseDate?: string;
  artworkUrl?: string;
  previewUrl?: string;
  country?: string;
  primaryGenreName?: string;
  trackExplicitness?: string;
};
