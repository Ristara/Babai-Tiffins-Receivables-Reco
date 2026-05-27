interface UploadEntry {
  id: string;
  filename: string;
  uploaded_at: string;
  rows_success: number;
  rows_total: number;
  rows_cancelled: number;
  rows_unclassified: number;
}

interface Props {
  sale_date: string;
  uploads: UploadEntry[];
}

const istLong = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const istShort = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const weekdayOf = (sale_date: string) =>
  new Date(sale_date + "T00:00:00+05:30").toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  });

// Server-rendered row. Uses HTML <details> for the ⋯ popover so no JS is needed.
export function HistoryRow({ sale_date, uploads }: Props) {
  const count = uploads.length;
  const latest = uploads[0];
  return (
    <tr className="border-b border-zinc-100 last:border-b-0">
      <td className="px-4 py-3 align-top">
        <div className="font-medium text-zinc-900">{sale_date}</div>
        <div className="text-xs text-zinc-500">{weekdayOf(sale_date)}</div>
      </td>
      <td className="px-4 py-3 align-top">
        {count === 0 ? (
          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
            Not uploaded
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
            ✓ Uploaded {count} {count === 1 ? "time" : "times"}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-sm text-zinc-700">
        {latest ? (
          <>
            <div
              className="max-w-[28ch] truncate font-mono text-xs"
              title={latest.filename}
            >
              {latest.filename}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">
              {istLong(latest.uploaded_at)}
            </div>
          </>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {count > 0 && (
          <details className="relative inline-block">
            <summary className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 [&::-webkit-details-marker]:hidden">
              ⋯
            </summary>
            <div className="absolute right-0 top-9 z-10 w-80 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-lg">
              <div className="border-b border-zinc-100 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Upload history — {sale_date}
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                {uploads.map((u, idx) => (
                  <li key={u.id} className="rounded-md p-2 hover:bg-zinc-50">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-900">
                        {idx === 0 ? "Latest" : `#${uploads.length - idx}`}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {istShort(u.uploaded_at)}
                      </span>
                    </div>
                    <div
                      className="mt-1 truncate font-mono text-xs text-zinc-700"
                      title={u.filename}
                    >
                      {u.filename}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {u.rows_success} success
                      {u.rows_cancelled > 0
                        ? ` · ${u.rows_cancelled} cancelled`
                        : ""}
                      {u.rows_unclassified > 0
                        ? ` · ${u.rows_unclassified} unclassified`
                        : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}
      </td>
    </tr>
  );
}

export type { UploadEntry };
