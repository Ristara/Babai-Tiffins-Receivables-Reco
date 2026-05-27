import Link from "next/link";
import { UploadForm } from "./UploadForm";

export default function UploadPage() {
  return (
    <main className="flex flex-1 flex-col bg-zinc-50 p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Upload daily CSV
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Drop in the Petpooja{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
              Order_Summary_Report
            </code>{" "}
            file for one day. Re-uploading the same day will replace its totals.
          </p>
        </header>
        <UploadForm />
      </div>
    </main>
  );
}
