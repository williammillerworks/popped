import type { ReactNode } from "react";

import { requireAdminSession } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlesLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminSession();

  return children;
}
