import Papa from "papaparse";
import { CATEGORIES, classifyOrder, type Category } from "./categories";

// Shape of one row in the Petpooja Order_Summary_Report CSV.
// Only listing the fields we actually read.
interface PetpoojaRow {
  restaurant_name: string;
  date: string; // "2026-05-24 06:47:59"
  payment_type: string;
  sub_order_type: string;
  status: string; // "Success" | "Cancelled" | ...
  total: string; // numeric, as text
}

export interface CategoryTotal {
  amount: number;
  order_count: number;
}

export interface BranchSummary {
  branch: string; // "HSR" | "SJP" | "JPN" | ... whatever the file contains
  total_amount: number;
  total_orders: number;
  by_category: Record<Category, CategoryTotal>;
}

export interface DaySummary {
  sale_date: string; // "YYYY-MM-DD"
  branches: BranchSummary[];
}

export interface ParseResult {
  rows_total: number;
  rows_success: number;
  rows_cancelled: number;
  rows_unclassified: number;
  days: DaySummary[];
}

// "Babai Tiffins, HSR" -> "HSR"
function extractBranch(restaurant_name: string): string {
  const m = restaurant_name.match(/,\s*([A-Za-z]+)\s*$/);
  return m ? m[1].toUpperCase() : restaurant_name.trim();
}

// "2026-05-24 06:47:59" -> "2026-05-24"
function extractDate(timestamp: string): string {
  return (timestamp || "").slice(0, 10);
}

function emptyCategoryRecord(): Record<Category, CategoryTotal> {
  const out = {} as Record<Category, CategoryTotal>;
  for (const c of CATEGORIES) out[c] = { amount: 0, order_count: 0 };
  return out;
}

export function parsePetpoojaCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<PetpoojaRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  let rows_success = 0;
  let rows_cancelled = 0;
  let rows_unclassified = 0;

  // sale_date -> branch -> category -> totals
  const tree = new Map<string, Map<string, Record<Category, CategoryTotal>>>();

  for (const row of parsed.data) {
    if (!row || !row.status) continue;

    if (row.status !== "Success") {
      rows_cancelled++;
      continue;
    }

    const category = classifyOrder({
      payment_type: row.payment_type,
      sub_order_type: row.sub_order_type,
    });
    if (!category) {
      rows_unclassified++;
      continue;
    }

    rows_success++;
    const sale_date = extractDate(row.date);
    const branch = extractBranch(row.restaurant_name);
    const amount = Number.parseFloat(row.total || "0") || 0;

    if (!tree.has(sale_date)) tree.set(sale_date, new Map());
    const branchMap = tree.get(sale_date)!;
    if (!branchMap.has(branch)) branchMap.set(branch, emptyCategoryRecord());
    const catRec = branchMap.get(branch)!;
    catRec[category].amount += amount;
    catRec[category].order_count += 1;
  }

  const days: DaySummary[] = [];
  for (const [sale_date, branchMap] of tree) {
    const branches: BranchSummary[] = [];
    for (const [branch, catRec] of branchMap) {
      let total_amount = 0;
      let total_orders = 0;
      for (const c of CATEGORIES) {
        total_amount += catRec[c].amount;
        total_orders += catRec[c].order_count;
      }
      branches.push({
        branch,
        total_amount: Math.round(total_amount * 100) / 100,
        total_orders,
        by_category: catRec,
      });
    }
    branches.sort((a, b) => a.branch.localeCompare(b.branch));
    days.push({ sale_date, branches });
  }
  days.sort((a, b) => a.sale_date.localeCompare(b.sale_date));

  return {
    rows_total: parsed.data.length,
    rows_success,
    rows_cancelled,
    rows_unclassified,
    days,
  };
}
