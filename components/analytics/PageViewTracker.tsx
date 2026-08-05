"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

import { trackAnalyticsEvent } from "../../lib/analytics";

type PageViewTrackerProps = {
  hasPuzzle: boolean;
  puzzleNumber?: number | null;
  status: "error" | "loaded" | "missing";
};

export function PageViewTracker({
  hasPuzzle,
  puzzleNumber,
  status,
}: PageViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent("page_viewed", {
      hasPuzzle,
      puzzleNumber: puzzleNumber ?? null,
      route: "/",
      status,
    });
  }, [hasPuzzle, puzzleNumber, status]);

  return null;
}

type AdminIdentityProps = {
  email: string;
};

/**
 * Admin auth currently serializes only an allowlisted email, so it is the
 * available fallback distinct ID until an immutable admin ID is introduced.
 */
export function AdminIdentity({ email }: AdminIdentityProps) {
  useEffect(() => {
    posthog.identify(email, { email, role: "admin" });
  }, [email]);

  return null;
}

type AdminSignOutButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  className: string;
};

export function AdminSignOutButton({
  action,
  className,
}: AdminSignOutButtonProps) {
  return (
    <form action={action}>
      <button
        className={className}
        onClick={() => posthog.reset()}
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
