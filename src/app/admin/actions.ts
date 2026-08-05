"use server";

import { redirect } from "next/navigation";

import { signInAdmin, signOutAdmin } from "../../../lib/adminAuth";
import { captureAdminEvent } from "../../../lib/posthog-server";

export async function signInAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await signInAdmin(email, password);

  if (!result.ok) {
    redirect(`/admin?error=${result.reason}`);
  }

  await captureAdminEvent({
    distinctId: result.email,
    event: "admin_signed_in",
    properties: { role: "admin" },
  });

  redirect("/admin/puzzles");
}

export async function signOutAdminAction() {
  await signOutAdmin();
  redirect("/admin");
}
