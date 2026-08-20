import Link from "next/link";

import {
  getAdminAuthConfigStatus,
  getAdminSession,
} from "../../../lib/adminAuth";
import {
  AdminAlert,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  AdminIcon,
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  AdminPageHeader,
  AdminPanel,
  AdminShell,
} from "../../../components/admin/admin-ui";
import { AdminLoginSubmitButton } from "../../../components/admin/admin-submit-button";
import { signInAdminAction, signOutAdminAction } from "./actions";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAdminSession();
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;

  if (!session) {
    return <AdminLoginPage error={error} />;
  }

  return (
    <AdminShell
      active="overview"
      email={session.email}
      signOutAction={signOutAdminAction}
    >
      <div className="grid gap-6">
        <AdminPageHeader
          action={
            <Link className={ADMIN_BUTTON_PRIMARY} href="/admin/puzzles/new">
              <AdminIcon name="plus" size={17} />
              Create puzzle
            </Link>
          }
          description={
            <>
              Curate the daily catalog, review schedule coverage, and prepare
              each audio clue before it reaches players.
            </>
          }
          eyebrow="Workspace"
          title="Good to see you"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <AdminPanel className="group p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-admin-accent-soft text-admin-accent">
                <AdminIcon name="calendar" size={19} />
              </span>
              <AdminIcon name="chevron-right" size={18} />
            </div>
            <h2 className="mt-8 text-xl font-semibold tracking-[-0.02em]">
              Puzzle schedule
            </h2>
            <p className="mt-2 max-w-[48ch] text-pretty text-sm leading-6 text-admin-muted">
              Review publish states, test entries, numbering, and any missing
              public dates in one structured list.
            </p>
            <Link
              className={`${ADMIN_BUTTON_SECONDARY} mt-5`}
              href="/admin/puzzles"
            >
              Open puzzle schedule
            </Link>
          </AdminPanel>

          <AdminPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-admin-success-soft text-admin-success">
                <AdminIcon name="music" size={19} />
              </span>
              <span className="rounded-md bg-admin-surface-subtle px-2 py-1 text-xs font-medium text-admin-muted">
                Editorial flow
              </span>
            </div>
            <h2 className="mt-8 text-xl font-semibold tracking-[-0.02em]">
              New audio puzzle
            </h2>
            <p className="mt-2 max-w-[48ch] text-pretty text-sm leading-6 text-admin-muted">
              Search the catalog, verify the exact track, tune the timestamp,
              and save a test-safe draft.
            </p>
            <Link
              className={`${ADMIN_BUTTON_SECONDARY} mt-5`}
              href="/admin/puzzles/new"
            >
              Start a new puzzle
            </Link>
          </AdminPanel>
        </div>

        <AdminAlert title={`Signed in as ${session.email}`} variant="info">
          Admin pages and server actions remain protected by the existing
          allowlist session.
        </AdminAlert>
      </div>
    </AdminShell>
  );
}

function AdminLoginPage({ error }: { error?: string }) {
  const configStatus = getAdminAuthConfigStatus();
  const configReady =
    configStatus.hasAllowedEmails &&
    configStatus.hasPassword &&
    configStatus.hasSessionSecret;

  return (
    <main
      className="grid min-h-dvh lg:grid-cols-[minmax(18rem,0.9fr)_minmax(28rem,1.1fr)]"
      id="admin-main"
    >
      <section className="relative hidden overflow-hidden bg-admin-sidebar p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,oklch(0.58_0.19_285_/_0.24),transparent_34rem),radial-gradient(circle_at_90%_88%,oklch(0.65_0.12_220_/_0.12),transparent_28rem)]" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-admin-accent text-sm font-bold">
            P
          </span>
          <div>
            <p className="text-sm font-semibold">POPPED</p>
            <p className="text-xs text-admin-sidebar-muted">Admin workspace</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-admin-sidebar-muted">
            <AdminIcon name="sparkles" size={21} />
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.045em] xl:text-5xl">
            Build tomorrow&apos;s music moment.
          </h1>
          <p className="mt-4 max-w-[48ch] text-pretty text-base leading-7 text-admin-sidebar-muted">
            A focused editorial workspace for scheduling, track verification,
            and precise audio clue preparation.
          </p>
        </div>
        <p className="relative text-xs text-admin-sidebar-muted">
          Access is limited to allowlisted editors.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-admin-accent text-sm font-bold text-white">
              P
            </span>
            <div>
              <p className="text-sm font-semibold">POPPED</p>
              <p className="text-xs text-admin-muted">Admin workspace</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-accent">
            Secure access
          </p>
          <h1 className="mt-2 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.035em] text-admin-text">
            Sign in to your workspace
          </h1>
          <p className="mt-3 text-pretty text-sm leading-6 text-admin-muted">
            Use the email address on the editor allowlist and the shared admin
            password.
          </p>

          <form action={signInAdminAction} className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <label className={ADMIN_LABEL_CLASS} htmlFor="admin-email">
                Email address
              </label>
              <input
                autoComplete="email"
                className={ADMIN_INPUT_CLASS}
                id="admin-email"
                name="email"
                required
                type="email"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <label className={ADMIN_LABEL_CLASS} htmlFor="admin-password">
                  Password
                </label>
                <span className="text-xs text-admin-subtle">Case-sensitive</span>
              </div>
              <input
                autoComplete="current-password"
                className={ADMIN_INPUT_CLASS}
                id="admin-password"
                name="password"
                required
                type="password"
              />
            </div>

            {error ? (
              <AdminAlert title={getLoginErrorMessage(error)} variant="error">
                Check the allowlisted email and password, then try again.
              </AdminAlert>
            ) : null}

            {!configReady ? (
              <AdminAlert title="Admin authentication is not configured" variant="warning">
                Add `ADMIN_ALLOWED_EMAILS`, `ADMIN_PASSWORD`, and
                `ADMIN_SESSION_SECRET` to `.env.local`.
              </AdminAlert>
            ) : null}

            <AdminLoginSubmitButton disabled={!configReady} />
          </form>
        </div>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: string) {
  if (error === "not_configured") {
    return "Admin authentication is not configured";
  }

  return "That email or password is not allowed";
}
