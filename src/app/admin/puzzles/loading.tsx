export default function AdminPuzzlesLoading() {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]" aria-busy="true" aria-label="Loading puzzle workspace">
      <aside className="hidden bg-admin-sidebar lg:block" />
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-[75rem] animate-pulse gap-6">
          <div className="grid gap-3">
            <div className="h-3 w-20 rounded bg-admin-surface-strong" />
            <div className="h-9 w-64 max-w-full rounded-lg bg-admin-surface-strong" />
            <div className="h-5 w-[34rem] max-w-full rounded bg-admin-surface-strong" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="h-28 rounded-2xl bg-admin-surface shadow-admin-raised" key={index} />
            ))}
          </div>
          <div className="h-[28rem] rounded-2xl bg-admin-surface shadow-admin-raised" />
        </div>
      </main>
    </div>
  );
}
