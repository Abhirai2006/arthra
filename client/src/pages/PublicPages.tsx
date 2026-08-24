import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import "../public-pages.css";

type PageKind = "About" | "Contact" | "Waitlist" | "Thank you";

function PublicHeader({ current }: { current?: string }) {
  return <header className="public-shell__header"><nav className="public-shell__nav container" aria-label="Primary navigation"><Link href="/" className="brand-link"><BrandMark /></Link><div className="public-shell__links"><Link href="/about" aria-current={current === "About" ? "page" : undefined}>About</Link><Link href="/#faq">FAQs</Link><Link href="/contact" aria-current={current === "Contact" ? "page" : undefined}>Contact</Link><Link href="/waitlist" aria-current={current === "Waitlist" ? "page" : undefined}>Waitlist</Link><Link href="/demo">Demo</Link></div><Link className="public-shell__workspace" href="/dashboard">Workspace <ArrowRight size={15} /></Link></nav></header>;
}

function Breadcrumbs({ current }: { current: PageKind }) {
  return <nav className="public-breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>;
}

function PublicShell({ current, eyebrow, title, intro, children }: { current: PageKind; eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return <main className="public-shell"><PublicHeader current={current} /><section className="container public-shell__main"><Breadcrumbs current={current} /><div className="public-shell__hero"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></div>{children}</section></main>;
}

export function AboutPage() {
  return <PublicShell current="About" eyebrow="Why Arthra" title="A private money workspace with context." intro="Arthra is made for the everyday details that shape Indian personal finance: INR amounts, April–March planning, GST context, and deliberate sharing."><section className="public-content-grid"><article><h2>Built around the real workflow</h2><p>Arthra helps people record transactions, manage budgets, and understand patterns without turning personal money into a social feed or a trading product.</p><p>Expense Spaces keep household, trip, and shared spending distinct. CA-ready reports make a handoff a considered action, not an afterthought.</p></article><aside className="public-aside"><ShieldCheck size={24} /><h2>Private by design</h2><p>Finance records live behind sign-in and server-side access checks. Public pages do not render private balances, transactions, or reports.</p></aside></section></PublicShell>;
}

export function WaitlistPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const join = trpc.publicEngagement.joinWaitlist.useMutation({ onSuccess: () => navigate("/thank-you?from=waitlist") });
  return <PublicShell current="Waitlist" eyebrow="Early access" title="Stay close to what Arthra builds next." intro="Join the optional product-update list for new workspace capabilities and selected research invitations."><section className="public-form-card"><div className="public-form-card__cta"><Sparkles size={20} /><div><h2>One focused update at a time.</h2><p>Use your email only if you want to hear about meaningful Arthra releases. You can opt out whenever you choose.</p></div></div><form onSubmit={event => { event.preventDefault(); if (consent) join.mutate({ email, consent, source: "waitlist", website }); }}><div className="public-honeypot" aria-hidden="true"><Label htmlFor="waitlist-website">Website</Label><Input id="waitlist-website" tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></div><Label htmlFor="waitlist-email">Email address</Label><Input id="waitlist-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /><label className="public-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /> I agree to receive occasional Arthra product updates at this email.</label>{join.error && <p className="public-form-error" role="alert">{join.error.message}</p>}<Button type="submit" disabled={join.isPending || !consent}>{join.isPending ? "Joining…" : "Join the waitlist"}<ArrowRight size={16} /></Button></form></section></PublicShell>;
}

export function ContactPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", consentToReply: false, website: "" });
  const submit = trpc.publicEngagement.submitContact.useMutation({ onSuccess: () => navigate("/thank-you?from=contact") });
  const update = (key: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  return <PublicShell current="Contact" eyebrow="Contact" title="Start a considered conversation." intro="Use this private contact form for product questions, research conversations, accessibility feedback, or partnership enquiries."><section className="public-contact-layout"><aside className="public-aside"><Mail size={24} /><h2>Before you write</h2><p>Describe what you are trying to do and the context around it. Please do not include passwords, account numbers, card details, or transaction data.</p><p>For product feedback, you can also use the dedicated <Link href="/feedback">feedback form</Link>.</p></aside><section className="public-form-card"><div className="public-form-card__cta"><Mail size={20} /><div><h2>We read every thoughtful note.</h2><p>Your message is private and is not shown as a public review.</p></div></div><form onSubmit={event => { event.preventDefault(); if (form.consentToReply) submit.mutate({ ...form, consentToReply: true }); }}><div className="public-form-grid"><div><Label htmlFor="contact-name">Name</Label><Input id="contact-name" autoComplete="name" required value={form.name} onChange={event => update("name", event.target.value)} /></div><div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" autoComplete="email" required value={form.email} onChange={event => update("email", event.target.value)} /></div></div><Label htmlFor="contact-subject">Subject</Label><Input id="contact-subject" required maxLength={160} value={form.subject} onChange={event => update("subject", event.target.value)} /><Label htmlFor="contact-message">Message</Label><Textarea id="contact-message" required minLength={12} maxLength={2000} value={form.message} onChange={event => update("message", event.target.value)} /><div className="public-honeypot" aria-hidden="true"><Label htmlFor="contact-website">Website</Label><Input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => update("website", event.target.value)} /></div><label className="public-consent"><input type="checkbox" checked={form.consentToReply} onChange={event => update("consentToReply", event.target.checked)} required /> I agree that Arthra may reply to this message at the email above.</label>{submit.error && <p className="public-form-error" role="alert">{submit.error.message}</p>}<Button type="submit" disabled={submit.isPending || !form.consentToReply}>{submit.isPending ? "Sending…" : "Send message"}<ArrowRight size={16} /></Button></form></section></section></PublicShell>;
}

export function ThankYouPage() {
  return <PublicShell current="Thank you" eyebrow="Thank you" title="Received with care." intro="Your submission has been received. We will use it only for the purpose you agreed to."><section className="public-thanks"><CheckCircle2 size={44} /><h2>Thank you for taking the time.</h2><p>While you wait, you can explore Arthra’s safe fictional demo or return to the product overview.</p><div><Link className="public-inline-cta" href="/demo">Try the demo <ArrowRight size={16} /></Link><Link href="/">Back to Arthra</Link></div></section></PublicShell>;
}
