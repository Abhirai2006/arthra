import { useFinanceWorkspace } from "@/hooks/useFinanceWorkspace";
import { formatInrFromPaise } from "@shared/finance";
import { deterministicInsightProvider } from "@shared/insights";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, BrainCircuit, Info, Loader2, Repeat2, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
const money = (value: number) => formatInrFromPaise(value, 0);

function SignalCard({ icon: Icon, eyebrow, title, copy, tone = "default" }: { icon: typeof TrendingUp; eyebrow: string; title: string; copy: string; tone?: "default" | "risk" }) {
  return <article className={`signal-card signal-card--${tone}`}><Icon size={17} /><div><p>{eyebrow}</p><h3>{title}</h3><span>{copy}</span></div></article>;
}

export default function AnalyticsPage() {
  const { activeSpace, activeSpaceId, isLoading } = useFinanceWorkspace();
  const [explaining, setExplaining] = useState(false);
  const analytics = trpc.finance.analytics.get.useQuery({ spaceId: activeSpaceId ?? 0 }, { enabled: !!activeSpaceId });
  const aiSummary = trpc.finance.analytics.aiSummary.useMutation();
  const insight = useMemo(() => deterministicInsightProvider({ categories: analytics.data?.categoryBreakdown ?? [], monthlyTrend: analytics.data?.monthlyTrend ?? [] }), [analytics.data]);

  if (isLoading || !activeSpace) return <div className="workspace-page"><div className="skeleton h-9 w-56" /><div className="skeleton mt-7 h-80" /></div>;
  if (analytics.isError) return <div className="workspace-page"><header className="workspace-head"><div><p className="workspace-kicker">Analytics unavailable</p><h1>We could not load this spending view.</h1><p className="workspace-subtitle">Your records have not been changed. Check your connection and try again.</p></div><button className="workspace-add" type="button" onClick={() => analytics.refetch()}>Try again</button></header></div>;

  const trend = analytics.data?.monthlyTrend ?? [];
  const categories = analytics.data?.categoryBreakdown ?? [];
  const unusual = analytics.data?.transactions.filter(item => item.isUnusual) ?? [];
  const signals = analytics.data?.signals;
  const leadingRecurring = signals?.recurringExpenses[0];
  const leadingRisk = signals?.budgetRisks[0];
  const trendPercent = signals?.threeMonthAverageChangePercent ?? signals?.monthChangePercent;

  return <div className="workspace-page">
    <header className="workspace-head"><div><p className="workspace-kicker">Six-month reflection</p><h1>Analytics, with context.</h1><p className="workspace-subtitle">These views are drawn only from <strong>{activeSpace.name}</strong>. Calculated observations and optional AI summaries are never financial advice.</p></div><button className="workspace-add" type="button" aria-expanded={explaining} aria-controls="analytics-observation" onClick={() => setExplaining(value => !value)}><BrainCircuit size={16} /> Explain the pattern</button></header>
    {explaining && <motion.article id="analytics-observation" className="explain-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={18} /><div><p className="workspace-kicker">Calculated observation</p><p>{insight}</p></div></motion.article>}
    <section className="ai-summary-card" aria-label="Optional AI financial insight"><div><p className="workspace-kicker">AI financial insight · optional</p><h2>Ask for a concise summary of your workspace patterns.</h2><p>Only the active Space’s authorised aggregate trend, category, recurring-spend, and budget-risk data is used. The generated text is separate from calculated cards and is not saved as a financial record.</p></div><div><button className="workspace-add" type="button" disabled={!activeSpaceId || aiSummary.isPending} onClick={() => activeSpaceId && aiSummary.mutate({ spaceId: activeSpaceId })}>{aiSummary.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles size={16} />}{aiSummary.data ? "Refresh AI summary" : "Create AI summary"}</button>{aiSummary.error && <p className="ai-summary-error" role="alert">{aiSummary.error.message}</p>}</div>{aiSummary.data && <article><Sparkles size={16} /><div><p className="workspace-kicker">AI-generated summary</p><p>{aiSummary.data.summary}</p></div></article>}</section>
    <section className="signal-grid" aria-label="Calculated financial insights">
      <SignalCard icon={TrendingUp} eyebrow="Spending trend" title={trendPercent === null || trendPercent === undefined ? "More history will sharpen this signal" : `${Math.abs(trendPercent)}% ${trendPercent > 0 ? "above" : trendPercent < 0 ? "below" : "level with"} your comparison period`} copy={trendPercent === null || trendPercent === undefined ? "Arthra needs spending in more than one period before it compares your rhythm." : "Calculated from the transactions in this Expense Space; it is a prompt to review, not a recommendation."} />
      <SignalCard icon={Repeat2} eyebrow="Recurring expenses" title={leadingRecurring ? `${leadingRecurring.merchant} looks ${leadingRecurring.frequency}` : "No confident recurring pattern yet"} copy={leadingRecurring ? `${money(leadingRecurring.monthlyPaise)} estimated monthly cost from repeated records.` : "Arthra waits for repeated timing before describing an expense as recurring."} />
      <SignalCard icon={AlertTriangle} eyebrow="Budget risk" tone="risk" title={leadingRisk ? `${leadingRisk.categoryName} may exceed its monthly boundary` : "No current budget-risk forecast"} copy={leadingRisk ? `At the current pace, the calculated projection is ${money(leadingRisk.projectedPaise)} against a ${money(leadingRisk.amountPaise)} budget.` : "Set a category budget and log a few expenses to receive a transparent pace-based forecast."} />
    </section>
    <section className="analytics-grid" aria-label="Spending analytics">
      <motion.article className="workspace-card chart-card chart-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42 }}><div className="chart-card__head"><div><p className="workspace-kicker">Monthly rhythm</p><h2>Income and spending</h2></div><Info size={16} /></div>{trend.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={trend} margin={{ top: 12, right: 5, bottom: 0, left: -20 }}><defs><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={.38} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="monthKey" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><YAxis tickFormatter={value => `₹${Math.round(value / 100)}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }} /><Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} /><Area type="monotone" dataKey="expensePaise" name="Spending" stroke="var(--chart-2)" strokeWidth={2.5} fill="url(#expenseFill)" /><Area type="monotone" dataKey="incomePaise" name="Income" stroke="var(--chart-1)" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer> : <ChartEmpty />}</motion.article>
      <motion.article className="workspace-card chart-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .07 }}><div className="chart-card__head"><div><p className="workspace-kicker">Where it goes</p><h2>Category mix</h2></div></div>{categories.length ? <ResponsiveContainer width="100%" height={230}><PieChart><Pie data={categories} dataKey="amountPaise" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>{categories.map((entry, index) => <Cell key={entry.name} fill={entry.color ? `var(--chart-${(index % 5) + 1})` : palette[index % palette.length]} />)}</Pie><Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} /></PieChart></ResponsiveContainer> : <ChartEmpty />}</motion.article>
      <motion.article className="workspace-card chart-card chart-card--wide" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .12 }}><div className="chart-card__head"><div><p className="workspace-kicker">Largest categories</p><h2>Spending breakdown</h2></div><BarChart3 size={16} /></div>{categories.length ? <ResponsiveContainer width="100%" height={260}><BarChart data={categories.slice(0, 6)} layout="vertical" margin={{ top: 3, right: 14, bottom: 3, left: 28 }}><XAxis type="number" tickFormatter={value => `₹${Math.round(value / 100)}`} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => money(value)} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)" }} /><Bar dataKey="amountPaise" radius={[0, 6, 6, 0]}>{categories.slice(0, 6).map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]} />)}</Bar></BarChart></ResponsiveContainer> : <ChartEmpty />}</motion.article>
      <motion.article className="workspace-card unusual-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: .18 }}><p className="workspace-kicker">Unusual moments</p><h2>{unusual.length ? `${unusual.length} entr${unusual.length === 1 ? "y" : "ies"} worth a second look` : "No unusual transactions flagged"}</h2><p>{unusual.length ? "These are simply amounts that are materially higher than recent expenses in this space. They are not errors by default." : "Once there is enough history, Arthra will gently flag expense amounts that sit well outside your recent rhythm."}</p></motion.article>
    </section>
  </div>;
}

function ChartEmpty() { return <div className="chart-empty"><BarChart3 size={24} /><p>There is not enough live data to draw this view yet.</p></div>; }
