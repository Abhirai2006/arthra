import { trpc } from "@/lib/trpc";
import { ArrowUpRight, CheckCircle2, ExternalLink, Loader2, MessageSquareHeart, ShieldCheck, Star, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const PORTFOLIO_URL = "https://portfolio-abhirai2006.lovable.app";
const initialForm = { displayName: "", email: "", rating: 0, message: "", permissionToContact: false, website: "" };
const emailPattern = /^[^\s@]+@[^\s@]+$/;

function Rating({ rating, label }: { rating: number; label: string }) {
  return <span className="feedback-rating" aria-label={`${rating} out of 5 stars — ${label}`}>{[1, 2, 3, 4, 5].map(value => <Star key={value} size={15} fill={value <= rating ? "currentColor" : "none"} />)}</span>;
}

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const published = trpc.feedback.listPublic.useQuery();
  const moderationAccess = trpc.feedback.moderationAccess.useQuery();
  const canModerate = moderationAccess.data?.canModerate === true;
  const ownerPublished = trpc.feedback.publishedForOwner.useQuery(undefined, { enabled: canModerate });
  const submit = trpc.feedback.submit.useMutation({
    onSuccess: async () => { await utils.feedback.listPublic.invalidate(); setSubmitted(true); setForm(initialForm); setFormError(null); },
    onError: error => {
      if (error.data?.code === "TOO_MANY_REQUESTS") { setFormError("Please wait a little before sending another feedback message."); return; }
      if (error.data?.code === "BAD_REQUEST") { setFormError("Please review the form details and try sending your feedback again."); return; }
      setFormError("We could not send your feedback right now. Please check your connection and try again.");
    },
  });
  const remove = trpc.feedback.remove.useMutation({ onSuccess: async () => { await Promise.all([utils.feedback.listPublic.invalidate(), utils.feedback.publishedForOwner.invalidate()]); } });
  const publishedCountLabel = useMemo(() => published.data?.length ? `${published.data.length} published review${published.data.length === 1 ? "" : "s"}` : "No published reviews yet", [published.data]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems = [form.rating === 0 ? "choose a rating" : null, form.message.trim().length < 12 ? "write at least 12 characters of feedback" : null, form.email.trim() && !emailPattern.test(form.email.trim()) ? "enter a valid email address or leave it blank" : null].filter(Boolean);
    if (problems.length) { setFormError(`Before sending, please ${problems.join(" and ")}.`); return; }
    setSubmitted(false);
    setFormError(null);
    submit.mutate(form);
  }

  function confirmRemoval(id: number) {
    if (window.confirm("Delete this published feedback permanently? This cannot be undone.")) remove.mutate({ id });
  }

  return <main className="feedback-page" data-release="automatic-feedback-publication-v1">
    <header className="feedback-nav"><a className="feedback-brand" href="/" aria-label="Back to Arthra home"><span>₹</span> arthra</a><nav aria-label="Feedback page navigation"><a href="/demo">Try demo</a><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Portfolio <ArrowUpRight size={14} /></a></nav></header>
    <section className="feedback-hero"><div><p className="feedback-kicker">Product feedback</p><h1>Built with people, not placeholders.</h1><p>Tell us where Arthra is useful, where it falls short, and what should change. Valid feedback is published automatically; your email is never shown, and the site owner can remove feedback when needed.</p><div className="feedback-trust"><span><ShieldCheck size={16} /> Clear public posting</span><span><MessageSquareHeart size={16} /> Genuine submissions only</span></div></div><aside className="portfolio-card" aria-label="Developer portfolio"><p className="feedback-kicker">Built by Abhishek Rai A</p><h2>See the work behind Arthra.</h2><p>Explore live projects, engineering case studies, and the portfolio that this product belongs to.</p><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Open portfolio <ExternalLink size={16} /></a></aside></section>
    <section className="feedback-panel" aria-labelledby="feedback-form-title"><div className="feedback-panel__copy"><p className="feedback-kicker">Leave feedback</p><h2 id="feedback-form-title">An honest review is more useful than a perfect one.</h2><p>Your rating, feedback, and display name are published automatically once the form passes validation and spam protections. Your email remains private and is only used if you opt in to contact.</p></div>{submitted ? <div className="feedback-success" role="status"><CheckCircle2 size={28} /><div><h3>Thank you for the honest feedback.</h3><p>Your feedback is now visible publicly. Your email is never shown.</p><button type="button" onClick={() => { setSubmitted(false); setFormError(null); }}>Send another response</button></div></div> : <form className="feedback-form" noValidate onSubmit={onSubmit}><fieldset><legend>How is Arthra feeling so far? <span aria-hidden="true">*</span></legend><div className="rating-buttons">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value} out of 5 stars`} aria-pressed={form.rating === value} onClick={() => { setFormError(null); setForm(current => ({ ...current, rating: value })); }}><Star size={21} fill={value <= form.rating ? "currentColor" : "none"} /></button>)}</div><p className="field-hint">Choose a rating, then tell us why.</p></fieldset><label htmlFor="feedback-message">Your feedback <span aria-hidden="true">*</span><textarea id="feedback-message" value={form.message} onChange={event => { setFormError(null); setForm(current => ({ ...current, message: event.target.value })); }} minLength={12} maxLength={1200} required placeholder="What worked, what was confusing, or what should Arthra do next?" /></label><div className="feedback-form__split"><label htmlFor="feedback-name">Name <span>optional</span><input id="feedback-name" value={form.displayName} onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))} maxLength={80} autoComplete="name" placeholder="How should we address you?" /></label><label htmlFor="feedback-email">Email <span>optional</span><input id="feedback-email" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} maxLength={320} autoComplete="email" placeholder="you@example.com" /></label></div><label className="contact-opt-in"><input type="checkbox" checked={form.permissionToContact} onChange={event => setForm(current => ({ ...current, permissionToContact: event.target.checked }))} disabled={!form.email.trim()} /> You may contact me about this feedback.</label><p className="field-hint">Submitting makes your rating, feedback, and display name public. Do not include account numbers, card details, or private financial information.</p><div className="honeypot" aria-hidden="true"><label htmlFor="feedback-website">Website<input id="feedback-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setForm(current => ({ ...current, website: event.target.value }))} /></label></div>{formError && <p id="feedback-form-error" className="feedback-error" role="alert">{formError}</p>}<button className="feedback-submit" type="submit" disabled={submit.isPending} aria-describedby={formError ? "feedback-form-error" : undefined}>{submit.isPending ? <><Loader2 size={17} className="feedback-spin" /> Sending feedback</> : <>Send feedback <ArrowUpRight size={17} /></>}</button></form>}</section>
    <section className="approved-reviews" aria-labelledby="approved-reviews-title"><div className="approved-reviews__heading"><div><p className="feedback-kicker">Published feedback</p><h2 id="approved-reviews-title">What people have chosen to share.</h2></div><span>{publishedCountLabel}</span></div>{published.isLoading ? <p className="reviews-empty">Loading published feedback…</p> : published.data?.length ? <div className="review-grid">{published.data.map(review => <article key={review.id} className="review-card"><Rating rating={review.rating} label="review rating" /><p>“{review.message}”</p><footer><strong>{review.displayName}</strong><time dateTime={new Date(review.createdAt).toISOString()}>{new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(review.createdAt))}</time></footer></article>)}</div> : <p className="reviews-empty">There is no public feedback yet. Arthra will never create placeholder praise; this section only shows genuine submitted feedback.</p>}</section>
    {canModerate && <section className="moderation-panel" aria-labelledby="moderation-title"><div><p className="feedback-kicker">Owner controls</p><h2 id="moderation-title">Manage published feedback.</h2><p>Feedback is public automatically after validation. Deleting an item removes it permanently from the public website and storage.</p></div>{ownerPublished.isLoading ? <p>Loading published feedback…</p> : ownerPublished.data?.length ? <div className="moderation-list">{ownerPublished.data.map(item => <article key={item.id}><div><Rating rating={item.rating} label="published rating" /><p>{item.message}</p><small>{item.displayName || "Arthra visitor"}</small></div><div className="moderation-actions"><button type="button" className="feedback-delete" disabled={remove.isPending} onClick={() => confirmRemoval(item.id)}><Trash2 size={15} /> Delete</button></div></article>)}</div> : <p className="reviews-empty">There is no published feedback to manage.</p>}</section>}
  </main>;
}
