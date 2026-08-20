import Link from "next/link";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

type AdminNavItem = "overview" | "puzzles" | "create";
type AdminAlertVariant = "error" | "info" | "success" | "warning";
type AdminIconName =
  | "alert"
  | "arrow-left"
  | "calendar"
  | "check"
  | "chevron-right"
  | "grid"
  | "info"
  | "logout"
  | "music"
  | "plus"
  | "search"
  | "sparkles"
  | "warning";

export const ADMIN_BUTTON_PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-admin-accent px-4 text-sm font-semibold text-white shadow-[0_1px_2px_oklch(0.22_0.012_265_/_0.16)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-admin-accent-hover hover:shadow-admin-raised active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:bg-admin-surface-strong disabled:text-admin-subtle disabled:shadow-none disabled:active:scale-100";
export const ADMIN_BUTTON_SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-admin-border-strong bg-admin-surface px-4 text-sm font-semibold text-admin-text shadow-[0_1px_2px_oklch(0.22_0.012_265_/_0.04)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-admin-border-strong hover:bg-admin-surface-subtle active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus disabled:cursor-not-allowed disabled:bg-admin-surface-subtle disabled:text-admin-subtle disabled:shadow-none disabled:active:scale-100";
export const ADMIN_BUTTON_GHOST =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium text-admin-muted transition-[background-color,color,transform] duration-150 ease-out hover:bg-admin-surface-subtle hover:text-admin-text active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus";
export const ADMIN_INPUT_CLASS =
  "min-h-11 w-full rounded-lg border border-admin-border-strong bg-admin-surface px-3.5 text-base font-medium text-admin-text shadow-[0_1px_2px_oklch(0.22_0.012_265_/_0.025)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-admin-subtle hover:border-admin-border-strong focus-visible:border-admin-accent focus-visible:shadow-[0_0_0_3px_oklch(0.65_0.18_285_/_0.14)] aria-[invalid=true]:border-admin-destructive aria-[invalid=true]:shadow-[0_0_0_3px_oklch(0.55_0.205_27_/_0.1)] disabled:cursor-not-allowed disabled:bg-admin-surface-subtle disabled:text-admin-subtle md:text-sm";
export const ADMIN_LABEL_CLASS =
  "block text-sm font-medium leading-5 text-admin-text";
export const ADMIN_HELP_CLASS =
  "block text-[0.8125rem] leading-5 text-admin-muted text-pretty";

type AdminShellProps = {
  active: AdminNavItem;
  children: ReactNode;
  email: string;
  signOutAction: () => Promise<void>;
};

export function AdminShell({
  active,
  children,
  email,
  signOutAction,
}: AdminShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="border-b border-white/8 bg-admin-sidebar text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r lg:border-white/8">
        <div className="flex min-h-16 items-center justify-between px-4 lg:min-h-0 lg:px-5 lg:py-5">
          <Link
            className="inline-flex min-h-11 items-center gap-3 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus"
            href="/admin"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-admin-accent text-sm font-bold shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.12)]">
              P
            </span>
            <span>
              <span className="block text-sm font-semibold leading-5">POPPED</span>
              <span className="block text-xs leading-4 text-admin-sidebar-muted">
                Admin workspace
              </span>
            </span>
          </Link>
          <span className="rounded-md border border-white/10 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-admin-sidebar-muted lg:hidden">
            Admin
          </span>
        </div>

        <nav aria-label="Admin navigation" className="overflow-x-auto px-4 pb-3 lg:px-3 lg:pb-0">
          <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
            <AdminNavLink
              active={active === "overview"}
              href="/admin"
              icon="grid"
            >
              Overview
            </AdminNavLink>
            <AdminNavLink
              active={active === "puzzles"}
              href="/admin/puzzles"
              icon="calendar"
            >
              Puzzles
            </AdminNavLink>
            <AdminNavLink
              active={active === "create"}
              href="/admin/puzzles/new"
              icon="plus"
            >
              New puzzle
            </AdminNavLink>
          </ul>
        </nav>

        <div className="hidden lg:mt-auto lg:block lg:p-3">
          <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
            <p className="truncate text-sm font-medium text-white" title={email}>
              {email}
            </p>
            <p className="mt-0.5 text-xs text-admin-sidebar-muted">
              Authenticated editor
            </p>
            <form action={signOutAction} className="mt-3">
              <button
                className="inline-flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-admin-sidebar-muted transition-[background-color,color,transform] duration-150 hover:bg-white/[0.07] hover:text-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus"
                type="submit"
              >
                <AdminIcon name="logout" size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main id="admin-main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-[75rem]">{children}</div>
      </main>
    </div>
  );
}

function AdminNavLink({
  active,
  children,
  href,
  icon,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  icon: AdminIconName;
}) {
  return (
    <li>
      <Link
        aria-current={active ? "page" : undefined}
        className={`inline-flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-[background-color,color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus ${
          active
            ? "bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.06)]"
            : "text-admin-sidebar-muted hover:bg-white/[0.06] hover:text-white"
        }`}
        href={href}
      >
        <AdminIcon name={icon} size={17} />
        {children}
      </Link>
    </li>
  );
}

export function AdminPageHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-admin-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-balance text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-[1.12] tracking-[-0.035em] text-admin-text">
          {title}
        </h1>
        <div className="mt-2 max-w-[65ch] text-pretty text-sm leading-6 text-admin-muted sm:text-base">
          {description}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

type AdminPanelProps = ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
};

export const AdminPanel = forwardRef<HTMLElement, AdminPanelProps>(
  function AdminPanel({ children, className = "", ...props }, ref) {
    return (
      <section
        className={`rounded-2xl bg-admin-surface shadow-admin-raised ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </section>
    );
  },
);

const ALERT_STYLES: Record<AdminAlertVariant, string> = {
  error: "border-admin-destructive/20 bg-admin-destructive-soft text-admin-destructive",
  info: "border-admin-accent/18 bg-admin-accent-soft text-admin-text",
  success: "border-admin-success/20 bg-admin-success-soft text-admin-success",
  warning: "border-admin-warning/20 bg-admin-warning-soft text-admin-warning",
};

const ALERT_ICONS: Record<AdminAlertVariant, AdminIconName> = {
  error: "alert",
  info: "info",
  success: "check",
  warning: "warning",
};

export function AdminAlert({
  children,
  className = "",
  title,
  variant = "info",
}: {
  children?: ReactNode;
  className?: string;
  title: string;
  variant?: AdminAlertVariant;
}) {
  return (
    <div
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${ALERT_STYLES[variant]} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <AdminIcon name={ALERT_ICONS[variant]} size={17} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-5">{title}</p>
        {children ? (
          <div className="mt-0.5 text-pretty leading-5 text-current/80">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminIcon({
  name,
  size = 18,
}: {
  name: AdminIconName;
  size?: number;
}) {
  const commonProps = {
    "aria-hidden": true,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.75,
    viewBox: "0 0 24 24",
    width: size,
  };

  switch (name) {
    case "alert":
      return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5" /><path d="M12 16.5h.01" /></svg>;
    case "arrow-left":
      return <svg {...commonProps}><path d="m15 18-6-6 6-6" /></svg>;
    case "calendar":
      return <svg {...commonProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>;
    case "check":
      return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.25 2.25L15.5 9.5" /></svg>;
    case "chevron-right":
      return <svg {...commonProps}><path d="m9 18 6-6-6-6" /></svg>;
    case "grid":
      return <svg {...commonProps}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
    case "info":
      return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
    case "logout":
      return <svg {...commonProps}><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg>;
    case "music":
      return <svg {...commonProps}><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>;
    case "plus":
      return <svg {...commonProps}><path d="M12 5v14M5 12h14" /></svg>;
    case "search":
      return <svg {...commonProps}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "sparkles":
      return <svg {...commonProps}><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z" /><path d="m6 13 .9 2.1L9 16l-2.1.9L6 19l-.9-2.1L3 16l2.1-.9L6 13Z" /></svg>;
    case "warning":
      return <svg {...commonProps}><path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 16.5h.01" /></svg>;
  }
}
