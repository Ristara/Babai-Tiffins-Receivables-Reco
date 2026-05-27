import Link from "next/link";

interface Props {
  from: string;
  to: string;
  preset: "7" | "30" | "90" | "all" | "custom";
}

const presetLabels: Record<Props["preset"], string> = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  all: "All time",
  custom: "Custom",
};

export function RangeControls({ from, to, preset }: Props) {
  const presets: Array<Props["preset"]> = ["7", "30", "90", "all"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = p === preset;
          return (
            <Link
              key={p}
              href={`/upload?range=${p}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {presetLabels[p]}
            </Link>
          );
        })}
      </div>
      <form
        method="GET"
        action="/upload"
        className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3"
      >
        <label className="flex flex-col text-xs text-zinc-600">
          <span className="mb-1 font-medium">From</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col text-xs text-zinc-600">
          <span className="mb-1 font-medium">To</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </label>
        <input type="hidden" name="range" value="custom" />
        <button
          type="submit"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
