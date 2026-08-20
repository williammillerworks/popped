"use client";

import { useFormStatus } from "react-dom";

import {
  ADMIN_BUTTON_PRIMARY,
  AdminIcon,
} from "./admin-ui";

export function AdminLoginSubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={disabled || pending}
      className={`${ADMIN_BUTTON_PRIMARY} mt-1 w-full`}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Signing in…" : "Sign in"}
      <AdminIcon name="chevron-right" size={17} />
    </button>
  );
}
