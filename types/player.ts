export type LocalPlayerProfile = {
  schemaVersion: 1;
  anonymousPlayerId: string;
  createdAt: string;
  lastSeenAt: string;
  onboarding: {
    completedVersion: number | null;
    completedAt?: string;
    skippedAt?: string;
  };
};
