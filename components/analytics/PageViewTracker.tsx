"use client";

import { useEffect } from "react";

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
