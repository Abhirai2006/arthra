import { onboardingStorageKey } from "@shared/onboarding";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, BadgeIndianRupee, BarChart3, CheckCircle2, ReceiptText, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";

type OnboardingGuideProps = {
  userId: number | string;
  restartRequest: number;
  onNavigate: (path: string) => void;
};

const steps = [
  {
    icon: ReceiptText,
    eyebrow: "Start with one real moment",
    title: "Add your first transaction",
    description: "Record an expense or income with its category, date, GST details, and an optional receipt. Arthra stores amounts as paise for accurate INR totals.",
    destination: "/transactions",
    action: "Open transactions",
  },
  {
    icon: BadgeIndianRupee,
    eyebrow: "Give the month a shape",
    title: "Set a budget you can use",
    description: "Choose a monthly category limit, then use the live budget rings to notice a healthy, near-limit, or over-budget pattern at a glance.",
    destination: "/budgets",
    action: "Open budgets",
  },
  {
    icon: UsersRound,
    eyebrow: "Share with intention",
    title: "Create an Expense Space",
    description: "Keep a trip, family pool, or shared household separate. Invite only the people you choose and give them an owner, editor, or viewer role.",
    destination: "/spaces",
    action: "Open Expense Spaces",
  },
  {
    icon: BarChart3,
    eyebrow: "Close the loop",
    title: "Review your rhythm",
    description: "Explore spending patterns, then prepare an Indian financial-year ledger or a revocable read-only CA link whenever you need one.",
    destination: "/reports",
    action: "Open reports",
  },
];

export function OnboardingGuide({ userId, restartRequest, onNavigate }: OnboardingGuideProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const key = onboardingStorageKey(userId);
  const step = steps[stepIndex];
  const StepIcon = step.icon;
  const isLastStep = stepIndex === steps.length - 1;

  const markComplete = () => {
    try { window.localStorage.setItem(key, "complete"); } catch {}
    setOpen(false);
  };

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(key)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [key]);

  useEffect(() => {
    if (restartRequest < 1) return;
    setStepIndex(0);
    setOpen(true);
  }, [restartRequest]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) markComplete(); else setOpen(true); }}>
      <DialogContent className="overflow-hidden border-border/80 p-0 sm:max-w-xl">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_86%_12%,rgba(138,109,255,.32),transparent_36%),linear-gradient(135deg,#2d1c56,#19152d)] px-6 pb-7 pt-8 text-primary-foreground sm:px-8">
          <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-white/20" aria-hidden="true" />
          <div className="absolute right-8 top-10 h-20 w-20 rounded-full border border-white/10" aria-hidden="true" />
          <p className="relative m-0 text-[10px] font-bold uppercase tracking-[.16em] text-violet-200">Your Arthra quick start</p>
          <DialogTitle className="relative mt-3 max-w-md text-3xl font-extrabold tracking-[-.06em] text-white sm:text-4xl">Money with context, one step at a time.</DialogTitle>
          <p className="relative mt-3 max-w-md text-sm leading-6 text-violet-100">Take a short tour now, or skip it and restart it any time from your account menu.</p>
        </div>
        <div className="px-6 py-6 sm:px-8">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[.14em] text-primary">{step.eyebrow}</p>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Step {stepIndex + 1} of {steps.length}</span>
            </div>
            <div className="mt-4 flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><StepIcon className="size-5" /></div>
              <div>
                <DialogTitle className="text-2xl tracking-[-.05em]">{step.title}</DialogTitle>
                <DialogDescription className="mt-2 max-w-md text-sm leading-6">{step.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-6 flex gap-1.5" role="progressbar" aria-label="Quick-start progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1}>
            {steps.map((tourStep, index) => <span className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-muted"}`} key={tourStep.title} />)}
          </div>
          <Button variant="ghost" className="mt-5 h-auto px-0 text-xs text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { markComplete(); onNavigate(step.destination); }}>{step.action}<ArrowRight className="ml-1 size-3.5" /></Button>
        </div>
        <DialogFooter className="border-t border-border/70 bg-muted/30 px-6 py-4 sm:px-8">
          <button type="button" className="mr-auto text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground" onClick={markComplete}>Skip for now</button>
          {stepIndex > 0 && <Button type="button" variant="outline" onClick={() => setStepIndex(index => index - 1)}><ArrowLeft className="mr-1.5 size-4" />Back</Button>}
          <Button type="button" onClick={() => isLastStep ? markComplete() : setStepIndex(index => index + 1)}>{isLastStep ? <><CheckCircle2 className="mr-1.5 size-4" />Finish tour</> : <>Next<ArrowRight className="ml-1.5 size-4" /></>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
