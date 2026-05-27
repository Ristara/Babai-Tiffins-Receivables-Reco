import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-2xl space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Receivables</h1>
          <p className="text-zinc-600">
            Daily sales reconciliation — Babai Tiffins
          </p>
        </header>

        <nav className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/upload"
            className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm"
          >
            <div className="text-lg font-medium">Upload</div>
            <div className="mt-1 text-sm text-zinc-500">
              Add today&apos;s Petpooja CSV
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="block rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm"
          >
            <div className="text-lg font-medium">Dashboard</div>
            <div className="mt-1 text-sm text-zinc-500">
              Past daily summaries
            </div>
          </Link>
        </nav>
      </div>
    </main>
  );
}
