import { trpc } from "@/lib/trpc";
import { ArrowUpRight, CheckCircle2, ExternalLink, Loader2, MessageSquareHeart, ShieldCheck, Star } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const PORTFOLIO_URL = "https://portfolio-abhirai2006.lovable.app";
const initialForm = { displayName: "", email: "", rating: 0, message: "", permissionToContact: false, permissionToPublish: false, website: "" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Rating({ rating, label }: { rating: number; label: string }) {
  return <span className="feedback-rating" aria-label={`${rating} out of 5 stars — ${label}`}>{[1, 2, 3, 4, 5].map(value => <Star key={value} size={15} fill={value <= rating ? "currentColor" : "none"} />)}</span>;
}

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmissionAllowedPublication, setLastSubmissionAllowedPublication] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const approved = trpc.feedback.listApproved.useQuery();
  const moderationAccess = trpc.feedback.moderationAccess.useQuery();
  const canModerate = moderationAccess.data?.canModerate === true;
  const moderationQueue = trpc.feedback.moderationQueue.useQuery(undefined, { enabled: canModerate });
  const submit = trpc.feedback.submit.useMutation({
    onSuccess: () => { setSubmitted(true); setForm(initialForm); setFormError(null); },
    onError: error => {
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        setFormError("Please wait a little before sending another feedback message.");
        return;
      }
      if (error.data?.code === "BAD_REQUEST") {
        setFormError("Please review the form details and try sending your feedback again.");
        return;
      }
      setFormError("We could not send your feedback right now. Please check your connection and try again.");
    },
  });
  const moderate = trpc.feedback.moderate.useMutation({
    onSuccess: async () => { await Promise.all([utils.feedback.listApproved.invalidate(), utils.feedback.moderationQueue.invalidate()]); },
  });
  const approvedCountLabel = useMemo(() => approved.data?.length ? `${approved.data.length} published review${approved.data.length === 1 ? "" : "s"}` : "No published reviews yet", [approved.data]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems = [form.rating === 0 ? "choose a rating" : null, form.message.trim().length < 12 ? "write at least 12 characters of feedback" : null, form.email.trim() && !emailPattern.test(form.email.trim()) ? "enter a valid email address or leave it blank" : null].filter(Boolean);
    if (problems.length) {
      setFormError(`Before sending, please ${problems.join(" and ")}.`);
      return;
    }
    setSubmitted(false);
    setFormError(null);
    setLastSubmissionAllowedPublication(form.permissionToPublish);
    submit.mutate(form);
  }

  return <main className="feedback-page" data-release="consent-approval-v1">
    <header className="feedback-nav">
      <a className="feedback-brand" href="/" aria-label="Back to Arthra home"><span>₹</span> arthra</a>
      <nav aria-label="Feedback page navigation"><a href="/demo">Try demo</a><a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Portfolio <ArrowUpRight size={14} /></a></nav>
    </header>

    <section className="feedback-hero">
      <div>
        <p className="feedback-kicker">Product feedback</p>
        <h1>Built with people, not placeholders.</h1>
        <p>Tell us where Arthra is useful, where it falls short, and what should change. Public reviews are real submissions only: the reviewer must consent and the site owner must approve each one.</p>
        <div className="feedback-trust"><span><ShieldCheck size={16} /> Consent before publication</span><span><MessageSquareHeart size={16} /> Human review, never automated</span></div>
      </div>
      <aside className="portfolio-card" aria-label="Developer portfolio">
        <p className="feedback-kicker">Built by Abhishek Rai A</p><h2>See the work behind Arthra.</h2><p>Explore live projects, engineering case studies, and the portfolio that this product belongs to.</p>
        <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Open portfolio <ExternalLink size={16} /></a>
      </aside>
    </section>

    <section className="feedback-panel" aria-labelledby="feedback-form-title">
      <div className="feedback-panel__copy"><p className="feedback-kicker">Leave feedback</p><h2 id="feedback-form-title">An honest review is more useful than a perfect one.</h2><p>Your message starts as a private submission. You decide whether it can ever be considered for public display; approval is always manual.</p></div>
      {submitted ? <div className="feedback-success" role="status"><CheckCircle2 size={28} /><div><h3>Thank you for the honest feedback.</h3><p>{lastSubmissionAllowedPublication ? "Your review was received. It remains private unless it is manually approved." : "Your feedback was received as a private submission."}</p><button type="button" onClick={() => { setSubmitted(false); setFormError(null); }}>Send another response</button></div></div> : <form className="feedback-form" noValidate onSubmit={onSubmit}>
        <fieldset><legend>How is Arthra feeling so far? <span aria-hidden="true">*</span></legend><div className="rating-buttons">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" aria-label={`${value} out of 5 stars`} aria-pressed={form.rating === value} onClick={() => { setFormError(null); setForm(current => ({ ...current, rating: value })); }}><Star size={21} fill={value <= form.rating ? "currentColor" : "none"} /></button>)}</div><p className="field-hint">Choose a rating, then tell us why.</p></fieldset>
        <label htmlFor="feedback-message">Your feedback <span aria-hidden="true">*</span><textarea id="feedback-message" value={form.message} onChange={event => { setFormError(null); setForm(current => ({ ...current, message: event.target.value })); }} minLength={12} maxLength={1200} required placeholder="What worked, what was confusing, or what should Arthra do next?" /></label>
        <div className="feedback-form__split"><label htmlFor="feedback-name">Name <span>optional</span><input id="feedback-name" value={form.displayName} onChange={event => setForm(current => ({ ...current, displayName: event.target.value }))} maxLength={80} autoComplete="name" placeholder="How should we address you?" /></label><label htmlFor="feedback-email">Email <span>optional</span><input id="feedback-email" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} maxLength={320} autoComplete="email" placeholder="you@example.com" /></label></div>
        <label className="contact-opt-in"><input type="checkbox" checked={form.permissionToContact} onChange={event => setForm(current => ({ ...current, permissionToContact: event.target.checked }))} disabled={!form.email.trim()} /> You may contact me about this feedback.</label>
        <label className="publish-opt-in"><input type="checkbox" checked={form.permissionToPublish} onChange={event => setForm(current => ({ ...current, permissionToPublish: event.target.checked }))} /> I permit this feedback, rating, and provided display name to be considered for public display after manual approval.</label>
        <div className="honeypot" aria-hidden="true"><label htmlFor="feedback-website">Website<input id="feedback-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => setForm(current => ({ ...current, website: event.target.value }))} /></label></div>
        {formError && <p id="feedback-form-error" className="feedback-error" role="alert">{formError}</p>}
        <button className="feedback-submit" type="submit" disabled={submit.isPending} aria-describedby={formError ? "feedback-form-error" : undefined}>{submit.isPending ? <><Loader2 size={17} className="feedback-spin" /> Sending feedback</> : <>Send feedback <ArrowUpRight size={17} /></>}</button>
      </form>}
    </section>

    <section className="approved-reviews" aria-labelledby="approved-reviews-title">
      <div className="approved-reviews__heading"><div><p className="feedback-kicker">Published feedback</p><h2 id="approved-reviews-title">What people have chosen to share.</h2></div><span>{approvedCountLabel}</span></div>
      {approved.isLoading ? <p className="reviews-empty">Loading approved feedback…</p> : approved.data?.length ? <div className="review-grid">{approved.data.map(review => <article key={review.id} className="review-card"><Rating rating={review.rating} label="review rating" /><p>“{review.message}”</p><footer><strong>{review.displayName}</strong><time dateTime={new Date(review.createdAt).toISOString()}>{new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(review.createdAt))}</time></footer></article>)}</div> : <p className="reviews-empty">There are no public reviews yet. Arthra will never create placeholder praise; only a genuine submitted review with consent and manual approval appears here.</p>}
    </section>

    {canModerate && <section className="moderation-panel" aria-labelledby="moderation-title"><div><p className="feedback-kicker">Owner moderation</p><h2 id="moderation-title">Review consent before publication.</h2><p>Approving publishes only feedback whose author gave permission. Archived feedback remains private.</p></div>{moderationQueue.isLoading ? <p>Loading pending feedback…</p> : moderationQueue.data?.length ? <div className="moderation-list">{moderationQueue.data.map(item => <article key={item.id}><div><Rating rating={item.rating} label="submission rating" /><p>{item.message}</p><small>{item.displayName || "Anonymous visitor"}{item.permissionToPublish ? " · publication permitted" : " · private only"}</small></div><div className="moderation-actions"><button type="button" disabled={!item.permissionToPublish || moderate.isPending} onClick={() => moderate.mutate({ id: item.id, status: "approved" })}>Approve</button><button type="button" disabled={moderate.isPending} onClick={() => moderate.mutate({ id: item.id, status: "archived" })}>Archive</button></div></article>)}</div> : <p className="reviews-empty">There is no pending feedback to moderate.</p>}</section>}
  </main>;
}
