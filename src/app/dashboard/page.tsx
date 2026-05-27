import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Past daily summaries will show up here. Coming next.
          </p>
        </header>
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">
          Upload a CSV first from the{" "}
          <Link href="/upload" className="underline">
            Upload page
          </Link>{" "}
          — the historical view will be built next.
        </div>
      </div>
    </main>
  );
}
