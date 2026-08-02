import type { PuzzleEditor } from "../types/puzzle";

export const LEGACY_EDITOR: PuzzleEditor = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Anita Lee Miller",
};

const MISSING_EDITOR_SCHEMA_CODES = new Set([
  "42703",
  "PGRST200",
  "PGRST204",
  "PGRST205",
]);

export function isMissingEditorSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";

  return (
    MISSING_EDITOR_SCHEMA_CODES.has(code) &&
    (message.includes("editor_id") ||
      message.includes("editors") ||
      message.includes("relationship"))
  );
}
