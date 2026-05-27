import type { Category } from "@/lib/categories";

export type DailyStatus = "parsed" | "validated" | "posted";

export interface Upload {
  id: string;
  filename: string;
  file_date: string;
  uploaded_at: string;
  row_count: number;
  success_count: number;
  cancelled_count: number;
  total_amount: number;
}

export interface DailySummary {
  id: string;
  upload_id: string;
  business_date: string;
  branch: string;
  status: DailyStatus;
  order_count: number;
  total_amount: number;
  validated_at: string | null;
  posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SummaryLine {
  id: string;
  summary_id: string;
  category: Category;
  order_count: number;
  total_amount: number;
  zoho_invoice_id: string | null;
  posted_at: string | null;
}
