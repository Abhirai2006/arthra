import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Check, Loader2, Paperclip, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type Category = { id: number; name: string; kind: "expense" | "income"; color: string; icon: string };
type TransactionValue = { id: number; accountId: number | null; categoryId: number | null; kind: "expense" | "income"; amountPaise: number; description: string; note: string | null; occurredAt: Date; isGstApplicable: boolean; gstKind: "cgst_sgst" | "igst" | null; gstRateBasisPoints: number | null; recurringRule: string | null };

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}

export function TransactionDialog({ open, onOpenChange, spaceId, categories, transaction }: { open: boolean; onOpenChange: (open: boolean) => void; spaceId: number; categories: Category[]; transaction?: TransactionValue | null }) {
  const utils = trpc.useUtils();
  const accounts = trpc.finance.spaces.accounts.useQuery({ spaceId }, { enabled: open && !!spaceId });
  const sharedCategories = trpc.finance.categories.forSpace.useQuery({ spaceId }, { enabled: open && !!spaceId });
  const detail = trpc.finance.transactions.get.useQuery({ transactionId: transaction?.id ?? 0 }, { enabled: open && !!transaction?.id });
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [hasGst, setHasGst] = useState(false);
  const [gstKind, setGstKind] = useState<"cgst_sgst" | "igst">("cgst_sgst");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const createCategory = trpc.finance.categories.create.useMutation({ onSuccess: () => { utils.finance.bootstrap.invalidate(); utils.finance.categories.forSpace.invalidate({ spaceId }); setNewCategory(""); setAddingCategory(false); } });
  const create = trpc.finance.transactions.create.useMutation();
  const update = trpc.finance.transactions.update.useMutation();
  const attachReceipt = trpc.finance.transactions.attachReceipt.useMutation();

  useEffect(() => {
    if (!open) return;
    setKind(transaction?.kind ?? "expense"); setAmount(transaction ? String(transaction.amountPaise / 100) : ""); setDescription(transaction?.description ?? ""); setCategoryId(transaction?.categoryId ? String(transaction.categoryId) : ""); setAccountId(transaction?.accountId ? String(transaction.accountId) : ""); setDate((transaction?.occurredAt ?? new Date()).toISOString().slice(0, 10)); setNote(transaction?.note ?? ""); setHasGst(transaction?.isGstApplicable ?? false); setGstKind(transaction?.gstKind ?? "cgst_sgst"); setReceipt(null);
  }, [open, transaction]);

  const invalidate = async () => { await Promise.all([utils.finance.dashboard.invalidate(), utils.finance.transactions.invalidate(), utils.finance.analytics.invalidate(), utils.finance.budgets.invalidate()]); };
  const saving = create.isPending || update.isPending || attachReceipt.isPending;
  const categoryOptions = (sharedCategories.data ?? categories).filter(category => category.kind === kind);

  async function save() {
    const amountPaise = Math.round(Number(amount) * 100);
    if (!description.trim() || !Number.isFinite(amountPaise) || amountPaise <= 0) return;
    const values = { accountId: accountId ? Number(accountId) : null, categoryId: categoryId ? Number(categoryId) : null, kind, amountPaise, description: description.trim(), note: note.trim() || null, occurredAt: new Date(`${date}T12:00:00.000Z`), isGstApplicable: hasGst, gstKind: hasGst ? gstKind : null, gstRateBasisPoints: hasGst ? 1800 : null, recurringRule: null };
    const saved = transaction ? await update.mutateAsync({ transactionId: transaction.id, ...values }) : await create.mutateAsync({ spaceId, ...values });
    if (receipt) await attachReceipt.mutateAsync({ transactionId: saved.id, fileName: receipt.name, dataUrl: await fileToDataUrl(receipt) });
    await invalidate(); onOpenChange(false);
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card p-6 sm:max-w-xl"><DialogHeader><DialogTitle>{transaction ? "Refine transaction" : "Add a transaction"}</DialogTitle><DialogDescription>Keep the record light now. You can revisit it when more context arrives.</DialogDescription></DialogHeader><div className="space-y-5 pt-3"><div className="segmented-control"><button type="button" className={kind === "expense" ? "is-active" : ""} onClick={() => setKind("expense")}>Expense</button><button type="button" className={kind === "income" ? "is-active" : ""} onClick={() => setKind("income")}>Income</button></div><div className="form-grid"><div><Label htmlFor="amount">Amount (₹)</Label><Input id="amount" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0" className="mt-2 text-lg font-semibold" /></div><div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={date} onChange={event => setDate(event.target.value)} className="mt-2" /></div></div><div><Label htmlFor="description">What was it?</Label><Input id="description" value={description} onChange={event => setDescription(event.target.value)} placeholder={kind === "expense" ? "e.g. Dinner with friends" : "e.g. Salary credit"} className="mt-2" /></div><div className="form-grid"><div><Label htmlFor="category">Category</Label><select id="category" value={categoryId} onChange={event => setCategoryId(event.target.value)} className="field-select mt-2"><option value="">Uncategorised</option>{categoryOptions.map(category => <option value={category.id} key={category.id}>{category.name}</option>)}</select></div><div><Label htmlFor="account">Account</Label><select id="account" value={accountId} onChange={event => setAccountId(event.target.value)} className="field-select mt-2"><option value="">No account</option>{accounts.data?.map(account => <option value={account.id} key={account.id}>{account.name}</option>)}</select></div></div><div className="new-category-row"><button type="button" className="quiet-action" onClick={() => setAddingCategory(value => !value)}><Plus size={14} /> Custom category</button>{addingCategory && <div className="new-category-inline"><Input value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="Category name" /><Button type="button" size="sm" disabled={!newCategory.trim() || createCategory.isPending} onClick={() => createCategory.mutate({ name: newCategory.trim(), kind, color: kind === "expense" ? "violet" : "emerald", icon: "circle", spaceId })}>{createCategory.isPending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}</Button></div>}</div><div><Label htmlFor="note">Note <span className="text-muted-foreground">optional</span></Label><Textarea id="note" value={note} onChange={event => setNote(event.target.value)} placeholder="A little more context, if it helps." className="mt-2 min-h-20" /></div><label className="gst-toggle"><input type="checkbox" checked={hasGst} onChange={event => setHasGst(event.target.checked)} /><span><strong>GST-aware record</strong><small>Include this in CA-ready business reporting.</small></span></label>{hasGst && <div className="gst-choices"><button type="button" className={gstKind === "cgst_sgst" ? "is-active" : ""} onClick={() => setGstKind("cgst_sgst")}>CGST + SGST</button><button type="button" className={gstKind === "igst" ? "is-active" : ""} onClick={() => setGstKind("igst")}>IGST</button></div>}<label className="receipt-picker"><Paperclip size={16} /><span>{receipt ? receipt.name : "Attach a receipt"}</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setReceipt(event.target.files?.[0] ?? null)} /></label>{detail.data?.receipts.length ? <div className="receipt-gallery">{detail.data.receipts.map(item => <a href={item.storageUrl} target="_blank" rel="noreferrer" className="receipt-thumb" key={item.id}>{item.mimeType.startsWith("image/") ? <img src={item.storageUrl} alt={item.originalName} /> : <object data={item.storageUrl} type="application/pdf" aria-label={item.originalName}><Paperclip size={17} /><span>{item.originalName}</span></object>}</a>)}</div> : null}<Button type="button" onClick={save} disabled={saving || !description.trim() || !amount} className="w-full rounded-xl py-6">{saving && <Loader2 className="mr-2 size-4 animate-spin" />}{transaction ? "Save changes" : "Save transaction"}</Button></div></DialogContent></Dialog>;
}
