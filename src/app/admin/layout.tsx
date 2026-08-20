import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-root min-h-dvh bg-admin-canvas text-admin-text">
      <a
        className="fixed start-4 top-4 z-50 -translate-y-24 rounded-lg bg-admin-sidebar px-4 py-3 text-sm font-semibold text-white shadow-admin-floating transition-transform duration-150 ease-out focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-admin-focus"
        href="#admin-main"
      >
        Skip to content
      </a>
      {children}
    </div>
  );
}
