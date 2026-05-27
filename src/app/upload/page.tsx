import { UploadForm } from "./UploadForm";

// Allow the parse + upsert to run up to 60s (Vercel Hobby plan limit).
// Default is 10s, which can be tight when a CSV has ~9k rows.
export const maxDuration = 60;

export default function UploadPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
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
  );
}
