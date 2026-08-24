import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatInrFromPaise } from "@shared/finance";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import "../transaction-import.css";

type MappingKey = "date" | "description" | "amount" | "debit" | "credit" | "kind" | "note";
type Mapping = Record<MappingKey, string>;
type RawRow = Record<string, unknown>;
type ImportDraft = { sourceIndex: number; occurredAt: Date; kind: "expense" | "income"; amountPaise: number; description: string; note: string | null; issues: string[] };

const emptyMapping: Mapping = { date: "", description: "", amount: "", debit: "", credit: "", kind: "", note: "" };
const supportedFileTypes = ".csv,.xlsx,.xls";

const normaliseHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const findColumn = (headers: string[], hints: string[]) => headers.find(header => hints.some(hint => normaliseHeader(header).includes(hint))) ?? "";
const toText = (value: unknown) => String(value ?? "").trim();

function suggestMapping(headers: string[]): Mapping {
  const debit = findColumn(headers, ["debit", "withdrawal", "paidout"]);
  const credit = findColumn(headers, ["credit", "deposit", "paidin"]);
  return {
    date: findColumn(headers, ["transactiondate", "valuedate", "date", "posteddate"]),
    description: findColumn(headers, ["description", "narration", "merchant", "particular", "detail"]),
    amount: debit || credit ? "" : findColumn(headers, ["amount", "transactionamount", "value"]),
    debit,
    credit,
    kind: findColumn(headers, ["type", "transactiontype", "drcr", "debitcredit"]),
    note: findColumn(headers, ["note", "remark", "reference", "memo"]),
  };
}

function parseDate(value: unknown) {
  const text = toText(value);
  if (!text) return null;
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  const indian = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12));
  if (indian) {
    const year = indian[3].length === 2 ? 2000 + Number(indian[3]) : Number(indian[3]);
    return new Date(Date.UTC(year, Number(indian[2]) - 1, Number(indian[1]), 12));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12));
}

function parseMoney(value: unknown) {
  const raw = toText(value).replace(/[₹$£€\s,]/g, "");
  if (!raw) return null;
  const negative = raw.startsWith("-") || /^\(.+\)$/.test(raw);
  const numeric = Number(raw.replace(/[()]/g, "").replace(/^-/, ""));
  if (!Number.isFinite(numeric)) return null;
  return (negative ? -1 : 1) * Math.round(numeric * 100);
}

function importKind(value: unknown) {
  const text = normaliseHeader(toText(value));
  if (["expense", "debit", "dr", "withdrawal", "paid"].some(item => text.includes(item))) return "expense" as const;
  if (["income", "credit", "cr", "deposit", "received"].some(item => text.includes(item))) return "income" as const;
  return null;
}

function buildDrafts(rows: RawRow[], mapping: Mapping, positiveMeans: "income" | "expense") {
  return rows.map((row, sourceIndex): ImportDraft => {
    const issues: string[] = [];
    const occurredAt = parseDate(row[mapping.date]);
    const description = toText(row[mapping.description]).slice(0, 180);
    let amountPaise: number | null = null;
    let kind: "expense" | "income" | null = importKind(row[mapping.kind]);
    const debit = mapping.debit ? parseMoney(row[mapping.debit]) : null;
    const credit = mapping.credit ? parseMoney(row[mapping.credit]) : null;
    if (debit && Math.abs(debit) > 0) { amountPaise = Math.abs(debit); kind = "expense"; }
    else if (credit && Math.abs(credit) > 0) { amountPaise = Math.abs(credit); kind = "income"; }
    else {
      const amount = parseMoney(row[mapping.amount]);
      if (amount !== null) { amountPaise = Math.abs(amount); kind ||= amount < 0 ? (positiveMeans === "income" ? "expense" : "income") : positiveMeans; }
    }
    if (!occurredAt || Number.isNaN(occurredAt.getTime())) issues.push("Choose a valid date column");
    if (!description) issues.push("Choose a description column");
    if (!amountPaise || amountPaise <= 0 || amountPaise > 100_000_000_000) issues.push("Choose a valid amount column");
    if (!kind) issues.push("Map a type column or set the positive amount interpretation");
    return { sourceIndex, occurredAt: occurredAt ?? new Date(), kind: kind ?? "expense", amountPaise: amountPaise ?? 0, description, note: mapping.note ? toText(row[mapping.note]).slice(0, 4_000) || null : null, issues };
  });
}

export function TransactionImportDialog({ open, onOpenChange, spaceId }: { open: boolean; onOpenChange: (value: boolean) => void; spaceId: number }) {
  const utils = trpc.useUtils();
  const accounts = trpc.finance.spaces.accounts.useQuery({ spaceId }, { enabled: open && !!spaceId });
  const categories = trpc.finance.categories.forSpace.useQuery({ spaceId }, { enabled: open && !!spaceId });
  const preview = trpc.finance.transactions.importPreview.useMutation();
  const commit = trpc.finance.transactions.importCommit.useMutation();
  const [fileName, setFileName] = useState(""); const [rawRows, setRawRows] = useState<RawRow[]>([]); const [headers, setHeaders] = useState<string[]>([]); const [mapping, setMapping] = useState<Mapping>(emptyMapping); const [positiveMeans, setPositiveMeans] = useState<"income" | "expense">("income"); const [selected, setSelected] = useState<Set<number>>(new Set()); const [defaultAccountId, setDefaultAccountId] = useState(""); const [expenseCategoryId, setExpenseCategoryId] = useState(""); const [incomeCategoryId, setIncomeCategoryId] = useState(""); const [parsing, setParsing] = useState(false); const [parseError, setParseError] = useState(""); const [result, setResult] = useState<{ importedCount: number; skippedDuplicates: number } | null>(null);
  const drafts = useMemo(() => buildDrafts(rawRows, mapping, positiveMeans), [rawRows, mapping, positiveMeans]);
  const previewByRow = new Map((preview.data ?? []).map(item => [item.sourceIndex, item.duplicate]));
  const validDrafts = drafts.filter(row => !row.issues.length);
  const selectedDrafts = validDrafts.filter(row => selected.has(row.sourceIndex));
  const duplicateCount = validDrafts.filter(row => previewByRow.get(row.sourceIndex)).length;
  const expenseCategories = (categories.data ?? []).filter(category => category.kind === "expense"); const incomeCategories = (categories.data ?? []).filter(category => category.kind === "income");

  useEffect(() => { if (rawRows.length) preview.reset(); }, [mapping, positiveMeans]);

  function reset() { setFileName(""); setRawRows([]); setHeaders([]); setMapping(emptyMapping); setSelected(new Set()); setParseError(""); setResult(null); preview.reset(); commit.reset(); }
  function close(value: boolean) { if (!value) reset(); onOpenChange(value); }
  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setParseError("Use a CSV or Excel file smaller than 5 MB."); return; }
    setParsing(true); setParseError(""); setResult(null); preview.reset(); commit.reset();
    try {
      const XLSX = await import("xlsx"); const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error("The file has no readable worksheet.");
      const nextRows = XLSX.utils.sheet_to_json<RawRow>(firstSheet, { defval: "", raw: false }).slice(0, 300);
      const nextHeaders = Object.keys(nextRows[0] ?? {});
      if (!nextRows.length || !nextHeaders.length) throw new Error("No data rows were found. Make sure the first row contains column names.");
      setFileName(file.name); setRawRows(nextRows); setHeaders(nextHeaders); setMapping(suggestMapping(nextHeaders)); setSelected(new Set(nextRows.map((_, index) => index)));
    } catch (error) { setParseError(error instanceof Error ? error.message : "We could not read that file."); }
    finally { setParsing(false); event.target.value = ""; }
  }
  async function checkDuplicates() { if (!validDrafts.length) return; await preview.mutateAsync({ spaceId, rows: validDrafts }); }
  async function confirmImport() {
    const rows = selectedDrafts.filter(row => !previewByRow.get(row.sourceIndex)).map(row => ({ ...row, accountId: defaultAccountId ? Number(defaultAccountId) : null, categoryId: row.kind === "expense" ? (expenseCategoryId ? Number(expenseCategoryId) : null) : (incomeCategoryId ? Number(incomeCategoryId) : null) }));
    if (!rows.length) return;
    const imported = await commit.mutateAsync({ spaceId, confirm: true, rows }); setResult(imported); await Promise.all([utils.finance.transactions.invalidate(), utils.finance.dashboard.invalidate(), utils.finance.analytics.invalidate(), utils.finance.budgets.invalidate()]);
  }
  const selectedNonDuplicateCount = selectedDrafts.filter(row => !previewByRow.get(row.sourceIndex)).length;
  return <Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border bg-card p-5 sm:max-w-5xl"><DialogHeader><DialogTitle>Import transaction history</DialogTitle><DialogDescription>Read CSV or Excel history, map columns, review each row, and confirm before Arthra adds anything. Existing entries are checked again at confirmation.</DialogDescription></DialogHeader>{result ? <div className="import-success" role="status"><CheckCircle2 size={28} /><div><h3>{result.importedCount} transaction{result.importedCount === 1 ? "" : "s"} imported.</h3><p>{result.skippedDuplicates ? `${result.skippedDuplicates} likely duplicate${result.skippedDuplicates === 1 ? " was" : "s were"} skipped safely.` : "No duplicate entries were added."}</p><Button type="button" onClick={() => close(false)}>Back to transactions</Button></div></div> : <div className="import-flow"><section className="import-upload"><div><FileSpreadsheet size={22} /><strong>{fileName || "Choose a CSV or Excel file"}</strong><span>Supports `.csv`, `.xlsx`, and `.xls` files up to 5 MB. The first worksheet is used.</span></div><label className="workspace-add"><Upload size={16} /> {parsing ? "Reading file…" : fileName ? "Choose another file" : "Select file"}<input type="file" accept={supportedFileTypes} onChange={onFile} disabled={parsing} /></label></section>{parseError && <p className="import-error" role="alert">{parseError}</p>}{rawRows.length ? <><section className="import-summary"><span><strong>{rawRows.length}</strong> rows read</span><span><strong>{validDrafts.length}</strong> ready</span><span><strong>{drafts.length - validDrafts.length}</strong> need attention</span>{preview.data && <span><strong>{duplicateCount}</strong> likely duplicates</span>}</section><section className="import-mapping"><div><h3>Map your columns</h3><p>Arthra never guesses a transaction without showing you the mapping first.</p></div><div className="import-mapping__grid"><MappingSelect label="Date" value={mapping.date} onChange={value => setMapping(current => ({ ...current, date: value }))} headers={headers} required /><MappingSelect label="Description" value={mapping.description} onChange={value => setMapping(current => ({ ...current, description: value }))} headers={headers} required /><MappingSelect label="Signed amount" value={mapping.amount} onChange={value => setMapping(current => ({ ...current, amount: value, debit: value ? "" : current.debit, credit: value ? "" : current.credit }))} headers={headers} /><MappingSelect label="Debit / expense" value={mapping.debit} onChange={value => setMapping(current => ({ ...current, debit: value, amount: value ? "" : current.amount }))} headers={headers} /><MappingSelect label="Credit / income" value={mapping.credit} onChange={value => setMapping(current => ({ ...current, credit: value, amount: value ? "" : current.amount }))} headers={headers} /><MappingSelect label="Transaction type" value={mapping.kind} onChange={value => setMapping(current => ({ ...current, kind: value }))} headers={headers} /><MappingSelect label="Note" value={mapping.note} onChange={value => setMapping(current => ({ ...current, note: value }))} headers={headers} /><label>Positive amounts mean<select value={positiveMeans} onChange={event => setPositiveMeans(event.target.value as "income" | "expense")}><option value="income">Income / credit</option><option value="expense">Expense / debit</option></select></label></div></section><section className="import-defaults"><div><h3>Optional defaults</h3><p>Use these only when the same account or category applies to imported entries.</p></div><div className="import-mapping__grid"><label>Account<select value={defaultAccountId} onChange={event => setDefaultAccountId(event.target.value)}><option value="">No account</option>{accounts.data?.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Expense category<select value={expenseCategoryId} onChange={event => setExpenseCategoryId(event.target.value)}><option value="">Uncategorised</option>{expenseCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Income category<select value={incomeCategoryId} onChange={event => setIncomeCategoryId(event.target.value)}><option value="">Uncategorised</option>{incomeCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div></section><section className="import-review" aria-labelledby="import-review-title"><div className="import-review__head"><div><h3 id="import-review-title">Review before import</h3><p>Select only the entries you want to add. Rows marked duplicate stay out of the confirmation count.</p></div><button type="button" className="quiet-action" onClick={() => setSelected(new Set(validDrafts.filter(row => !previewByRow.get(row.sourceIndex)).map(row => row.sourceIndex)))}>Select non-duplicates</button></div><div className="import-table" role="region" aria-label="Import preview"><table><thead><tr><th><span className="sr-only">Include</span></th><th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead><tbody>{drafts.slice(0, 100).map(row => { const duplicate = previewByRow.get(row.sourceIndex); return <tr key={row.sourceIndex} className={row.issues.length ? "is-invalid" : duplicate ? "is-duplicate" : ""}><td><input aria-label={`Include row ${row.sourceIndex + 2}`} type="checkbox" disabled={Boolean(row.issues.length) || Boolean(duplicate)} checked={selected.has(row.sourceIndex) && !duplicate} onChange={event => setSelected(current => { const next = new Set(current); event.target.checked ? next.add(row.sourceIndex) : next.delete(row.sourceIndex); return next; })} /></td><td>{row.issues[0]?.includes("date") ? "—" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(row.occurredAt)}</td><td>{row.description || "—"}</td><td>{row.kind}</td><td>{row.amountPaise ? formatInrFromPaise(row.amountPaise) : "—"}</td><td>{row.issues.length ? <span className="import-status is-problem"><AlertTriangle size={13} /> {row.issues[0]}</span> : duplicate ? <span className="import-status is-duplicate"><ShieldCheck size={13} /> Likely duplicate</span> : <span className="import-status is-ready"><CheckCircle2 size={13} /> Ready</span>}</td></tr>; })}</tbody></table>{drafts.length > 100 && <p className="import-table__note">Showing the first 100 rows. All {drafts.length} rows are checked before confirmation.</p>}</div></section><div className="import-actions"><div>{preview.error && <p className="import-error" role="alert">{preview.error.message}</p>}{commit.error && <p className="import-error" role="alert">{commit.error.message}</p>}<p><ShieldCheck size={15} /> Import adds only the rows you explicitly confirm. It does not edit or delete existing records.</p></div>{preview.data ? <Button type="button" disabled={commit.isPending || !selectedNonDuplicateCount} onClick={confirmImport}>{commit.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Confirm {selectedNonDuplicateCount} import{selectedNonDuplicateCount === 1 ? "" : "s"}</Button> : <Button type="button" disabled={preview.isPending || !validDrafts.length} onClick={checkDuplicates}>{preview.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}Check duplicates</Button>}</div></> : null}</div>}</DialogContent></Dialog>;
}

function MappingSelect({ label, value, onChange, headers, required = false }: { label: string; value: string; onChange: (value: string) => void; headers: string[]; required?: boolean }) {
  return <label>{label}{required ? " *" : ""}<select value={value} onChange={event => onChange(event.target.value)}><option value="">Not mapped</option>{headers.map(header => <option value={header} key={header}>{header}</option>)}</select></label>;
}
