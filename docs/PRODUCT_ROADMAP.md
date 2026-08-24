# Arthra Product Roadmap

## Candid assessment

Arthra already has a strong foundation for a portfolio product: it has a distinctive India-native point of view, a cohesive visual identity, private finance boundaries, Expense Spaces, budgets, reports, receipt handling, a guided demo, and a genuine feedback path. The current risk is **breadth without a single indispensable habit**. Many features are present, but a new user still needs a clearer reason to return every week and a faster path from raw entries to a useful outcome.

The most valuable next work is not more visual effects or generic AI. It is making Arthra exceptionally good at three recurring jobs: **capturing money activity with low effort, closing a month with confidence, and sharing the right context with the right person.**

## Priority 1 — Make the first ten minutes feel useful

| Improvement | Why it matters | First version | Success signal |
| --- | --- | --- | --- |
| Guided “first month” setup | A blank finance tool feels like work before it feels helpful. | Let users choose personal, household, freelancer, or trip setup; create only relevant categories, one account, and one goal. | More new users create at least three entries and one budget. |
| Recurring-entry assistant | Manual entry becomes tiring when rent, subscriptions, salaries, and EMIs repeat. | Detect a probable repeating pattern, show a non-intrusive prompt, and require a user confirmation before creating a rule. | Share of repeat entries captured through confirmed rules. |
| CSV import with review | Existing users often have months of bank data outside the product. | CSV upload, column mapping, duplicate preview, and confirmation before import. Do not start with direct bank access. | Successful imports with low correction/rollback rates. |
| Clear empty-state outcomes | “No data” should explain what a user gets after the next action. | Each empty dashboard, budget, analytics, and report state should name one action and one visible benefit. | Higher completion rate from empty states. |

> **Do not start with bank-account aggregation.** It creates regulatory, security, support, and reliability obligations before Arthra has proven a repeatable user habit. A reviewable CSV import is the right bridge.

## Priority 2 — Own the monthly close

The highest-potential differentiator is a calm, India-aware **monthly close**, not another generic dashboard. A user should be able to open Arthra at month end and know what needs attention in five minutes.

| Improvement | What it should do | Guardrail |
| --- | --- | --- |
| Month-close checklist | Surface uncategorised entries, missing receipts, budget variance, unusual items, and recurring charges. | It should be descriptive, never give investment, tax, or legal advice. |
| Cash-flow calendar | Show upcoming known recurring expenses, pay dates, and budgets by day or week. | Only use user-created rules and recorded data; never imply a bank balance. |
| Budget planning mode | Carry selected budget amounts forward and explain the change from the prior month. | The user explicitly confirms every change. |
| “Explain this month” summary | Combine deterministic signals into a readable review, with optional AI wording clearly separated. | AI must stay optional, use authorised aggregates only, and never modify entries. |

Success is not “more charts.” Success is a user being able to answer: **What changed? What needs review? What should I organise before the next month?**

## Priority 3 — Make shared money less awkward

Expense Spaces are already a meaningful advantage. The next step is to make collaboration operational rather than only permission-based.

| Improvement | User value | Scope boundary |
| --- | --- | --- |
| Split-and-settle ledger | Let a household, trip, or flatmate group record who paid and who owes what. | Keep it a record and settlement suggestion; do not process payments. |
| Approval / review state | Allow an owner to review a proposed shared transaction before it becomes part of a closed month. | Avoid heavy enterprise workflow design. |
| Shared monthly digest | Give members a concise, permission-scoped recap of a Space. | Respect roles and opt-in delivery preferences. |
| Receipt request | Mark a transaction as needing a receipt or clarification. | It is a lightweight collaboration cue, not a document-management system. |

## Priority 4 — Turn CA reporting into a real handoff advantage

The existing Apr–Mar reporting, GST context, CSV export, and revocable links are credible foundations. They can become a reason for freelancers and small business owners to choose Arthra.

| Improvement | First version |
| --- | --- |
| FY readiness board | A simple status view showing uncategorised business entries, missing GST context, and receipts to review before sharing. |
| Export presets | Saved CSV column arrangements for a CA, a personal yearly review, and an expense-reimbursement workflow. |
| Handoff notes | An owner-authored note attached to a generated report link, with a clear financial-year scope. |
| Audit-friendly activity trail | Show when a report link was created, viewed, and revoked. Do not expose private ledger data outside the scoped link. |

## Priority 5 — Earn trust before adding complexity

Finance software is judged more harshly than ordinary productivity software. The public claim should remain modest until these controls are visible and operational.

| Area | Concrete improvement |
| --- | --- |
| Account control | Provide data export, account deletion, and a clear retention explanation. |
| Security UX | Add session/device visibility, meaningful sign-out, and a security centre that explains protected files and sharing links plainly. |
| Consent | Make receipt-assist and AI-summary data usage clear at the interaction point, not only in policies. |
| Reliability | Add error monitoring, operational alerts, dependency health checks, and a backup/restore procedure. |
| Accessibility | Continue keyboard and mobile testing, but add automated checks for focus order, contrast, and form errors. |

## Priority 6 — Build a feedback-to-product loop

The public feedback page should collect genuine feedback privately. It should **not** become a public testimonial wall until the product has real, consented, moderated submissions.

1. Add an owner-only moderation queue with tags such as bug, onboarding, reporting, mobile, and feature request.
2. Let the owner mark an item as planned, in progress, resolved, or not planned, with a short internal note.
3. Publish only explicitly consented, approved feedback, with an approval audit trail. Never invent a rating, quote, name, or testimonial.
4. Summarise recurring feedback themes on a public changelog instead of leading with social proof.

## Technical readiness for meaningful scale

The current React, Express, tRPC, Drizzle, and managed relational-database structure is a suitable early product foundation. It is not enough by itself to promise million-user readiness. Before scale, prioritise the following work.

| Area | Next action | Why |
| --- | --- | --- |
| Observability | Structured logs, request IDs, error tracking, and latency dashboards. | A production issue must be diagnosable without reproducing a user’s private finance data. |
| Rate limits | Durable, shared rate limits for feedback, sign-in-adjacent endpoints, exports, uploads, and AI actions. | In-memory limits are useful locally but not sufficient across autoscaled instances. |
| Background work | Queue report generation, receipt processing, and email delivery when they grow beyond request-time work. | Keeps user-facing requests predictable. |
| Database | Add query-performance monitoring, pagination discipline, and retention controls. | Prevents slow finance dashboards as records grow. |
| Quality gates | Browser end-to-end tests for public routes, critical finance mutations, sharing/revocation, and mobile breakpoints. | Unit tests alone do not prove real workflows. |
| Delivery | Staging environment, migration rollback playbook, backups, and incident runbook. | Protects user trust during releases. |

## Growth without losing the product

The most credible growth path is narrow and community-led: students and early professionals managing their first independent money, households and flatmates, freelancers who need an Apr–Mar close, and people who want a lightweight CA handoff. Do not market Arthra as a replacement for banking, accounting, tax, or investment advice.

The GitHub portfolio link is useful for recruiters and builders. Keep it present but secondary to the product promise. The public demo, architecture page, changelog, and genuine private feedback loop are stronger proof than a generic “AI finance platform” narrative.

## Recommended sequence

| Time horizon | Focus | Avoid |
| --- | --- | --- |
| Next 30 days | Feedback moderation, first-month setup, empty-state improvements, CSV-import design, monitoring baseline. | Payments, banking aggregation, public testimonials, a large social feed. |
| 30–90 days | Recurring confirmations, monthly-close flow, budget carry-forward, shared split-and-settle prototype. | Expanding AI into autonomous actions. |
| 3–6 months | CA readiness board, export presets, durable queues/rate limits, end-to-end regression suite. | Claiming institutional-grade scale before operational controls exist. |
| After proven retention | Carefully validate bank import partnerships, team / household plans, and a paid professional tier. | Adding integrations simply because competitors have them. |

## The honest product thesis

Arthra becomes compelling when it is the **calmest place to close a month in an Indian financial context**. The winning version is not the feature with the most dashboards. It is the one that makes a user feel: *“My money is organised, my shared context is clear, and I know what needs attention.”*
