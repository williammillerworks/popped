import type { ReactNode } from "react";

import { AdminIdentity } from "../../../../components/analytics/PageViewTracker";
import { requireAdminSession } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <>
      <AdminIdentity email={session.email} />
      {children}
    </>
  );
}
