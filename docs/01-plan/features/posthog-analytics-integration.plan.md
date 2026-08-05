# posthog-analytics-integration - Plan Document

> Version: 1.0.0 | Date: 2026-08-05 | Status: Approved
> Level: Dynamic

---

## 1. Overview

### 1.1 Purpose

Connect POPPED's existing typed gameplay events to PostHog without making analytics a dependency of gameplay or admin operations.

### 1.2 Background

The application already emits thirteen privacy-conscious gameplay events through `trackAnalyticsEvent`, but the production fallback endpoint does not persist them. PostHog Code opened PR #3 with browser and server SDKs, admin identity, error tracking, replay, and starter insights. The generated integration needs to be narrowed and hardened before merge.

## 2. Goals

### 2.1 Primary Goals

- [x] Route the existing gameplay events to PostHog through one browser adapter.
- [x] Keep public gameplay anonymous and avoid raw guesses, answers, credentials, or admin identity properties.
- [x] Disable noisy automatic interaction and pageview capture in favor of the existing event schema.
- [x] Keep public session replay privacy-safe and exclude admin routes.
- [x] Ensure missing configuration or PostHog failures never block the application.
- [x] Verify lint, tests, production build, Preview deployment, and real event ingestion before merge.

### 2.2 Non-Goals

- Syncing Supabase tables into the PostHog data warehouse.
- Tracking authenticated admin identity or admin CRUD events.
- Adding feature flags, surveys, experiments, or server-side product analytics.
- Adding a reverse proxy or source-map upload in this initial integration.

## 3. Scope

### 3.1 In Scope

- `posthog-js` browser SDK initialization through Next.js `instrumentation-client.ts`.
- Existing gameplay event forwarding from `lib/analytics.ts`.
- Explicit PostHog capture, privacy, and failure-isolation settings.
- Environment variable documentation for US Cloud.
- Removal of generated admin identity and server-side analytics additions.
- Preview and ingestion verification.

### 3.2 Out of Scope

- Supabase warehouse credentials, table sync, or CDC.
- New player accounts or cross-device identity.
- Production analytics consent UI; this requires a separate legal/product decision.

## 4. Success Criteria

- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] Preview deployment reaches `READY` with PostHog environment variables available.
- [ ] A Preview gameplay flow sends `page_viewed`, `game_started`, and at least one gameplay event.
- [ ] The events appear in the PostHog US Cloud project.
- [ ] No admin identity or server-side PostHog dependency remains.
- [ ] PR #3 is ready for review and merged only after verification.

## 5. Schedule

| Phase | Target Date | Status |
|-------|------------|--------|
| Plan | 2026-08-05 | Completed |
| Design | 2026-08-05 | In Progress |
| Implementation | 2026-08-05 | Pending |
| Review | 2026-08-05 | Pending |

## 6. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Duplicate/noisy events exhaust useful signal | Medium | High | Disable autocapture, automatic pageviews, and pageleave capture. |
| Replay captures admin or input data | High | Medium | Mask all inputs and disable replay when the initial path is `/admin`. |
| Analytics outage affects product behavior | High | Low | Guard missing config and catch SDK initialization/capture failures. |
| Environment variables are absent in Preview | High | Medium | Inspect the rebuilt Preview and confirm capture requests. |
| Dashboard remains empty despite a successful build | Medium | Medium | Exercise a real browser flow and confirm the events in PostHog Activity. |

## 7. References

- GitHub PR #3: `williammillerworks/popped#3`
- PostHog Next.js SDK documentation
- PostHog JavaScript configuration and session replay privacy documentation
- Next.js 16 `instrumentation-client.ts` documentation in `node_modules/next/dist/docs/`
