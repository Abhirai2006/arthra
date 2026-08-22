export type CaLedgerRow = {
  occurredAt: Date | string;
  spaceName: string;
  description: string;
  kind: "income" | "expense";
  categoryName: string | null;
  amountPaise: number;
  isGstApplicable: boolean;
  gstKind: string | null;
  gstRateBasisPoints: number | null;
  note: string | null;
};

function csvCell(value: unknown) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

export function createCaLedgerCsv(rows: CaLedgerRow[], financialYear: string) {
  const header = ["Date", "Financial Year", "Space", "Description", "Type", "Category", "Amount INR", "GST applicable", "GST type", "GST rate %", "Note"];
  const lines = rows.map(row => [
    new Date(row.occurredAt).toISOString().slice(0, 10), financialYear, row.spaceName, row.description, row.kind,
    row.categoryName ?? "", (row.amountPaise / 100).toFixed(2), row.isGstApplicable ? "Yes" : "No", row.gstKind ?? "",
    row.gstRateBasisPoints ? (row.gstRateBasisPoints / 100).toFixed(2) : "", row.note ?? "",
  ].map(csvCell).join(","));
  return [header.join(","), ...lines].join("\n");
}
