import { BrandMark } from "@/components/BrandMark";
import { formatInrFromPaise } from "@shared/finance";
import { trpc } from "@/lib/trpc";
import { FileText, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function CaPublicPage() {
  const [location] = useLocation(); const token = location.split("/").filter(Boolean).at(-1) ?? ""; const report = trpc.finance.reports.publicCaReport.useQuery({ token }, { enabled: token.length >= 32 });
  const rows = report.data?.rows ?? [];
  return <main className="ca-public-page"><header><BrandMark /><span><ShieldCheck size={14} /> Read-only report</span></header><section className="ca-public-card">{report.isLoading ? <p>Opening report…</p> : !report.data ? <><FileText size={28} /><h1>This report link is not available.</h1><p>It may have expired or been revoked by the account owner.</p></> : <><p className="workspace-kicker">Arthra · FY {report.data.financialYear}</p><h1>CA-ready transaction ledger</h1><p className="ca-public-lede">This is a view-only record supplied by the account owner. It expires on {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(report.data.expiresAt)}.</p><div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>Date</th><th>Description</th><th>Space</th><th>Category</th><th>GST</th><th>Amount</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(row.occurredAt)}</td><td>{row.description}</td><td>{row.spaceName}</td><td>{row.categoryName ?? "—"}</td><td>{row.isGstApplicable ? row.gstKind?.replace("_", " + ").toUpperCase() : "—"}</td><td className={row.kind === "income" ? "amount-positive" : "amount-negative"}>{row.kind === "income" ? "+" : "−"}{formatInrFromPaise(row.amountPaise, 2)}</td></tr>)}</tbody></table></div><p className="ca-disclaimer">This ledger is an administrative record, not tax or legal advice. Confirm any return, classification, or deduction with a qualified professional.</p></>}</section></main>;
}
