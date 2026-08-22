import { useEffect, useState } from "react";

export function BudgetRing({ className, percent, label }: { className: string; percent: number; label: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => { setProgress(0); const frame = requestAnimationFrame(() => requestAnimationFrame(() => setProgress(Math.min(percent, 100)))); return () => cancelAnimationFrame(frame); }, [percent]);
  const heroRing = className.includes("budget-ring") && !className.includes("budget-card__ring");
  const size = heroRing ? 120 : 70; const radius = heroRing ? 48 : 28; const circumference = 2 * Math.PI * radius;
  return <div className={className} aria-label={`${label} budget usage`}><svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle className="budget-ring__track" cx={size / 2} cy={size / 2} r={radius} /><circle className="budget-ring__progress" cx={size / 2} cy={size / 2} r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} /></svg><span>{label}</span></div>;
}
