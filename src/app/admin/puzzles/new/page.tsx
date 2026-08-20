import Link from "next/link";

import { PuzzleForm } from "../../../../../components/admin/PuzzleForm";
import {
  AdminAlert,
  ADMIN_BUTTON_SECONDARY,
  AdminIcon,
  AdminPageHeader,
  AdminPanel,
  AdminShell,
} from "../../../../../components/admin/admin-ui";
import { requireAdminSession } from "../../../../../lib/adminAuth";
import { getActiveAdminEditors } from "../../../../../lib/adminPuzzles";
import { SupabaseConfigError } from "../../../../../lib/supabase/server";
import { signOutAdminAction } from "../../actions";
import { createPuzzleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPuzzlePage() {
  const session = await requireAdminSession();
  const { editorOptions, errorMessage } = await loadEditorOptions();

  return (
    <AdminShell
      active="create"
      email={session.email}
      signOutAction={signOutAdminAction}
    >
      <div className="grid gap-6">
        <AdminPageHeader
          action={
            <Link className={ADMIN_BUTTON_SECONDARY} href="/admin/puzzles">
              <AdminIcon name="arrow-left" size={17} />
              Back to puzzles
            </Link>
          }
          description="Search for the exact track, verify its preview, and save a test-safe draft before scheduling it for players."
          eyebrow="Puzzles"
          title="Create a puzzle"
        />
        {errorMessage ? (
          <AdminPanel className="p-5 sm:p-6">
            <AdminAlert title="Puzzle editor unavailable" variant="error">
              {errorMessage}
            </AdminAlert>
          </AdminPanel>
        ) : (
          <PuzzleForm
            action={createPuzzleAction}
            editorOptions={editorOptions}
            mode="create"
          />
        )}
      </div>
    </AdminShell>
  );
}

async function loadEditorOptions() {
  try {
    return {
      editorOptions: await getActiveAdminEditors(),
      errorMessage: "",
    };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return {
        editorOptions: [],
        errorMessage:
          "Supabase admin config is missing. Add the server-only Supabase environment variables, then reload this page.",
      };
    }

    console.error(error);

    return {
      editorOptions: [],
      errorMessage:
        "Editor options could not be loaded. Check the database connection, then reload this page.",
    };
  }
}
