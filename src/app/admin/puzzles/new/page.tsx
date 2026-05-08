import { PuzzleForm } from "../../../../../components/admin/PuzzleForm";
import { requireAdminSession } from "../../../../../lib/adminAuth";
import { createPuzzleAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPuzzlePage() {
  await requireAdminSession();

  return (
    <main className="min-h-dvh bg-[#181411] px-5 py-8 text-[#fffaf1]">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#211b17] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="space-y-3">
          <p className="font-mono text-sm uppercase tracking-[0.35em] text-[#e4aa73]">
            Admin
          </p>
          <h1 className="text-4xl font-black tracking-[-0.05em]">
            Create Puzzle
          </h1>
          <p className="max-w-xl text-base leading-7 text-[#d8c8b7]">
            Search music, choose the right preview, add accepted English and
            Korean aliases, then save the puzzle draft.
          </p>
        </div>

        <PuzzleForm action={createPuzzleAction} mode="create" />
      </section>
    </main>
  );
}
