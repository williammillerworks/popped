import type { LocalPlayerProfile } from "../types/player";

export const PLAYER_PROFILE_STORAGE_KEY = "popped-player-profile-v1";

const PLAYER_PROFILE_STORAGE_EVENT = "popped-player-profile-storage";
let fallbackIdSequence = 0;

export function getStoredPlayerProfileValue(): string | null {
  try {
    return window.localStorage.getItem(PLAYER_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseStoredPlayerProfile(
  storedValue: string | null,
): LocalPlayerProfile | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    return isLocalPlayerProfile(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function saveStoredPlayerProfile(
  profile: LocalPlayerProfile,
): boolean {
  try {
    window.localStorage.setItem(
      PLAYER_PROFILE_STORAGE_KEY,
      JSON.stringify(profile),
    );
    window.dispatchEvent(new Event(PLAYER_PROFILE_STORAGE_EVENT));
    return true;
  } catch {
    // Player memory is progressive enhancement and must never block the game.
    return false;
  }
}

export function initializeLocalPlayerProfile(
  now = new Date(),
): LocalPlayerProfile | null {
  const timestamp = now.toISOString();
  const storedProfile = parseStoredPlayerProfile(
    getStoredPlayerProfileValue(),
  );
  const profile: LocalPlayerProfile = storedProfile
    ? {
        ...storedProfile,
        lastSeenAt: timestamp,
      }
    : {
        schemaVersion: 1,
        anonymousPlayerId: createAnonymousPlayerId(now),
        createdAt: timestamp,
        lastSeenAt: timestamp,
        onboarding: {
          completedVersion: null,
        },
      };

  return saveStoredPlayerProfile(profile) ? profile : null;
}

export function recordOnboardingCompleted(
  completedVersion: number,
  now = new Date(),
): LocalPlayerProfile | null {
  if (!Number.isInteger(completedVersion) || completedVersion < 1) {
    return null;
  }

  return updateStoredPlayerProfile(now, (profile, timestamp) => ({
    ...profile,
    lastSeenAt: timestamp,
    onboarding: {
      ...profile.onboarding,
      completedAt: timestamp,
      completedVersion,
    },
  }));
}

export function recordOnboardingSkipped(
  now = new Date(),
): LocalPlayerProfile | null {
  return updateStoredPlayerProfile(now, (profile, timestamp) => ({
    ...profile,
    lastSeenAt: timestamp,
    onboarding: {
      ...profile.onboarding,
      skippedAt: timestamp,
    },
  }));
}

export function shouldAutoShowOnboarding(
  profile: LocalPlayerProfile | null,
): boolean {
  return Boolean(
    !profile?.onboarding.completedAt && !profile?.onboarding.skippedAt,
  );
}

export function subscribeToStoredPlayerProfileChanges(
  onStoreChange: () => void,
): () => void {
  try {
    function handleStorage(event: StorageEvent) {
      if (event.key === PLAYER_PROFILE_STORAGE_KEY || event.key === null) {
        onStoreChange();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PLAYER_PROFILE_STORAGE_EVENT, onStoreChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PLAYER_PROFILE_STORAGE_EVENT, onStoreChange);
    };
  } catch {
    return () => {};
  }
}

function updateStoredPlayerProfile(
  now: Date,
  update: (
    profile: LocalPlayerProfile,
    timestamp: string,
  ) => LocalPlayerProfile,
): LocalPlayerProfile | null {
  const timestamp = now.toISOString();
  const storedProfile = parseStoredPlayerProfile(
    getStoredPlayerProfileValue(),
  );
  const profile =
    storedProfile ??
    ({
      schemaVersion: 1,
      anonymousPlayerId: createAnonymousPlayerId(now),
      createdAt: timestamp,
      lastSeenAt: timestamp,
      onboarding: {
        completedVersion: null,
      },
    } satisfies LocalPlayerProfile);
  const updatedProfile = update(profile, timestamp);

  return saveStoredPlayerProfile(updatedProfile) ? updatedProfile : null;
}

function createAnonymousPlayerId(now: Date): string {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues === "function") {
    const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));

    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10).join(""),
    ].join("-");
  }

  fallbackIdSequence += 1;
  return `local-${now.getTime().toString(36)}-${fallbackIdSequence.toString(36)}`;
}

function isLocalPlayerProfile(value: unknown): value is LocalPlayerProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const profile = value as Partial<LocalPlayerProfile>;

  if (
    profile.schemaVersion !== 1 ||
    typeof profile.anonymousPlayerId !== "string" ||
    profile.anonymousPlayerId.trim().length === 0 ||
    !isIsoTimestamp(profile.createdAt) ||
    !isIsoTimestamp(profile.lastSeenAt) ||
    !profile.onboarding ||
    typeof profile.onboarding !== "object" ||
    Array.isArray(profile.onboarding)
  ) {
    return false;
  }

  const { completedAt, completedVersion, skippedAt } = profile.onboarding;
  const hasValidCompletion =
    completedVersion === null
      ? completedAt === undefined
      : Number.isInteger(completedVersion) &&
        completedVersion >= 1 &&
        isIsoTimestamp(completedAt);

  return (
    hasValidCompletion &&
    (skippedAt === undefined || isIsoTimestamp(skippedAt))
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parsedTimestamp = new Date(value);
  return (
    Number.isFinite(parsedTimestamp.getTime()) &&
    parsedTimestamp.toISOString() === value
  );
}
