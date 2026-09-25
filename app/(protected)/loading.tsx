export default function ProtectedLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-48 animate-pulse rounded border bg-gray-50" />
      <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
    </main>
  );
}