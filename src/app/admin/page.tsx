import Link from "next/link";

import {
  getAdminAuthConfigStatus,
  getAdminSession,
} from "../../../lib/adminAuth";
import {
  signInAdminAction,
  signOutAdminAction,
} from "./actions";

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
    <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-between rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="space-y-3">
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
            Admin
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em]">
            POPPED Admin
          </h1>
          <p className="text-base leading-7 text-[#d8c8b7]">
            Puzzle curation starts here. You&apos;re signed in as{" "}
            <span className="font-bold text-[#fffaf1]">{session.email}</span>.
          </p>
        </div>

        <div className="space-y-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.04] p-5">
          <p className="text-sm font-medium text-[#d8c8b7]">
            Admin edit tools are protected. Puzzle list and editing surfaces
            will live under the protected admin area.
          </p>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#fffaf1] px-5 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5"
            href="/admin/puzzles"
          >
            Open puzzles
          </Link>
        </div>

        <form action={signOutAdminAction}>
          <button
            className="h-12 w-full rounded-full border border-white/15 px-5 text-sm font-black text-[#fffaf1] transition hover:-translate-y-0.5 hover:bg-white/10"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminLoginPage({ error }: { error?: string }) {
  const configStatus = getAdminAuthConfigStatus();
  const configReady =
    configStatus.hasAllowedEmails &&
    configStatus.hasPassword &&
    configStatus.hasSessionSecret;

  return (
    <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-between rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="space-y-3">
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
            Admin
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em]">
            Sign in to POPPED
          </h1>
          <p className="text-base leading-7 text-[#d8c8b7]">
            Admin access is limited to allowlisted editors for the MVP.
          </p>
        </div>

        <form action={signInAdminAction} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa73]">
              Email
            </span>
            <input
              autoComplete="email"
              className="h-13 w-full rounded-2xl border border-white/15 bg-white px-4 text-base font-semibold text-[#211b17] outline-none focus:border-[#e4aa73] focus:ring-4 focus:ring-[#e4aa73]/20"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#e4aa73]">
              Password
            </span>
            <input
              autoComplete="current-password"
              className="h-13 w-full rounded-2xl border border-white/15 bg-white px-4 text-base font-semibold text-[#211b17] outline-none focus:border-[#e4aa73] focus:ring-4 focus:ring-[#e4aa73]/20"
              name="password"
              required
              type="password"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-[#4b241b] px-4 py-3 text-sm font-bold text-[#ffd9ca]">
              {getLoginErrorMessage(error)}
            </p>
          ) : null}

          {!configReady ? (
            <p className="rounded-2xl bg-[#3a3028] px-4 py-3 text-sm font-bold text-[#f3d8bc]">
              Admin auth needs `ADMIN_ALLOWED_EMAILS`, `ADMIN_PASSWORD`, and
              `ADMIN_SESSION_SECRET` in `.env.local`.
            </p>
          ) : null}

          <button
            className="h-13 w-full rounded-full bg-[#fffaf1] px-5 text-sm font-black text-[#211b17] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={!configReady}
            type="submit"
          >
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: string) {
  if (error === "not_configured") {
    return "Admin auth is not configured yet.";
  }

  return "That email or password is not allowed.";
}
