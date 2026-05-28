export type Category =
  | "Cash"
  | "PayTm"
  | "Zomato"
  | "Swiggy"
  | "Magicpin"
  | "Ownly"
  | "Ajantha"
  | "ODC"
  | "EnoPay"
  | "Shubha";

export const CATEGORIES: Category[] = [
  "Cash",
  "PayTm",
  "Zomato",
  "Swiggy",
  "Magicpin",
  "Ownly",
  "Ajantha",
  "ODC",
  "EnoPay",
  "Shubha",
];

export type SettlementType = "immediate" | "weekly" | "daily" | "credit";

export const SETTLEMENT: Record<Category, SettlementType> = {
  Cash: "immediate",
  PayTm: "immediate",
  Zomato: "weekly",
  Swiggy: "weekly",
  Magicpin: "weekly",
  Ownly: "daily",
  Ajantha: "credit",
  ODC: "credit",
  EnoPay: "credit",
  Shubha: "credit",
};

// Maps a single Petpooja order row to a category. sub_order_type takes
// priority over payment_type. Unknown rows return null so the UI can flag
// new payment types we haven't classified yet.
export function classifyOrder(row: {
  payment_type: string;
  sub_order_type: string;
}): Category | null {
  const sub = (row.sub_order_type || "").trim().toLowerCase();
  const pay = (row.payment_type || "").trim();

  if (sub.includes("zomato")) return "Zomato";
  if (sub.includes("swiggy")) return "Swiggy";
  if (sub.includes("magicpin")) return "Magicpin";
  if (sub.includes("ownly")) return "Ownly";
  if (sub === "ajantha associates") return "Ajantha";
  if (sub === "odc") return "ODC";
  if (sub === "enopay") return "EnoPay";
  if (sub === "shubha") return "Shubha";

  if (pay === "Cash") return "Cash";
  if (
    pay === "CARD" ||
    pay === "CARD [PayTm]" ||
    pay === "Wallet [UPI QR Code]" ||
    pay === "Other [UPI]"
  ) {
    return "PayTm";
  }
  if (pay === "Other [ODC Payment]") return "ODC";
  if (pay === "Due Payment") return "Ajantha";

  return null;
}
