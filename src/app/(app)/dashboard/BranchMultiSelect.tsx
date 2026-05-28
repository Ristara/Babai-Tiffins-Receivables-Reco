"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function BranchMultiSelect({
  selected,
  options,
}: {
  selected: string[];
  options: string[];
}) {
  const BRANCHES = options;
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const toggle = (b: string) => {
    const set = new Set(selected);
    if (set.has(b)) set.delete(b);
    else set.add(b);
    const next = [...set];

    const sp = new URLSearchParams(searchParams.toString());
    // Empty or all-selected → no filter param (means "All branches").
    if (next.length === 0 || next.length === BRANCHES.length) {
      sp.delete("branches");
    } else {
      sp.set("branches", next.join(","));
    }
    router.push(`/dashboard?${sp.toString()}`);
  };

  const allSelected = selected.length === 0 || selected.length === BRANCHES.length;
  const label = allSelected ? "All branches" : selected.join(", ");

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <span>{label}</span>
        <span aria-hidden className="text-zinc-400">
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-10 w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
          {BRANCHES.map((b) => {
            const checked = allSelected || selected.includes(b);
            return (
              <label
                key={b}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(b)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>{b}</span>
              </label>
            );
          })}
          <p className="px-3 py-1 text-[11px] text-zinc-400">
            Untick all = all branches
          </p>
        </div>
      )}
    </div>
  );
}
