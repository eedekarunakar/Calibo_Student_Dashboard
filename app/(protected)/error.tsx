"use client";

export default function ProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-sm text-gray-600">We could not load this dashboard view.</p>
      <button type="button" onClick={reset} className="mt-6 rounded bg-black px-4 py-2 text-sm text-white">
        Try again
      </button>
      {process.env.NODE_ENV === "development" && <p className="mt-4 text-left text-xs text-red-600">{error.message}</p>}
    </main>
  );
}