import { PostHog } from "posthog-node";

function getPostHogClient() {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    if (process.env.NODE_ENV === "development") {
      const missingVariable = !projectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
        : "NEXT_PUBLIC_POSTHOG_HOST";

      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      );
    }

    return null;
  }

  return new PostHog(projectToken, {
    enableExceptionAutocapture: true,
    flushAt: 1,
    flushInterval: 0,
    host,
  });
}

export async function captureAdminEvent({
  distinctId,
  event,
  properties,
}: {
  distinctId: string;
  event: "admin_signed_in" | "puzzle_created" | "puzzle_updated";
  properties: Record<string, boolean | number | string | null>;
}) {
  const posthog = getPostHogClient();

  if (!posthog) {
    return;
  }

  posthog.capture({ distinctId, event, properties });
  await posthog.shutdown();
}
