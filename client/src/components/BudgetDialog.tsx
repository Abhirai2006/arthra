import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function BudgetDialog({ open, onOpenChange, spaceId, monthKey, categories, initial }: { open: boolean; onOpenChange: (open: boolean) => void; spaceId: number; monthKey: string; categories: { id: number; name: string; kind: string }[]; initial?: { categoryId: number; amountPaise: number; alertAtPercent: number } | null }) {
  const utils = trpc.useUtils(); const [categoryId, setCategoryId] = useState(""); const [amount, setAmount] = useState(""); const [alertAtPercent, setAlertAtPercent] = useState("80");
  const save = trpc.finance.budgets.set.useMutation({ onSuccess: async () => { await Promise.all([utils.finance.budgets.invalidate(), utils.finance.dashboard.invalidate()]); onOpenChange(false); } });
  useEffect(() => { if (!open) return; setCategoryId(initial ? String(initial.categoryId) : ""); setAmount(initial ? String(initial.amountPaise / 100) : ""); setAlertAtPercent(initial ? String(initial.alertAtPercent) : "80"); }, [open, initial]);
  const expenses = categories.filter(category => category.kind === "expense");
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-3xl border-border bg-card"><DialogHeader><DialogTitle>{initial ? "Adjust budget" : "Set a monthly budget"}</DialogTitle><DialogDescription>Choose one category and give it a useful boundary for this month.</DialogDescription></DialogHeader><div className="space-y-5 pt-3"><div><Label>Category</Label><select value={categoryId} onChange={event => setCategoryId(event.target.value)} className="field-select mt-2"><option value="">Choose category</option>{expenses.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="form-grid"><div><Label>Budget amount (₹)</Label><Input inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} placeholder="0" className="mt-2" /></div><div><Label>Alert at (%)</Label><Input inputMode="numeric" value={alertAtPercent} onChange={event => setAlertAtPercent(event.target.value)} className="mt-2" /></div></div><Button type="button" className="w-full rounded-xl py-6" disabled={save.isPending || !categoryId || !amount} onClick={() => save.mutate({ spaceId, monthKey, categoryId: Number(categoryId), amountPaise: Math.round(Number(amount) * 100), alertAtPercent: Number(alertAtPercent) || 80 })}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Save budget</Button></div></DialogContent></Dialog>;
}
