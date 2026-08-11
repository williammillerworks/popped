import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (projectToken && host) {
  try {
    const isAdminRoute = window.location.pathname.startsWith("/admin");

    posthog.init(projectToken, {
      api_host: host,
      autocapture: false,
      capture_exceptions: !isAdminRoute,
      capture_pageleave: false,
      capture_pageview: false,
      debug: process.env.NODE_ENV === "development",
      defaults: "2026-05-30",
      disable_session_recording: isAdminRoute,
      person_profiles: "identified_only",
      respect_dnt: true,
      session_recording: {
        maskAllInputs: true,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("PostHog initialization failed; analytics is disabled.", error);
    }
  }
} else if (process.env.NODE_ENV === "development") {
  console.warn(
    "PostHog analytics is disabled. Configure NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST to enable it.",
  );
}
