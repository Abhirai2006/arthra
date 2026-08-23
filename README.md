# Arthra — Money with context

Arthra is a full-stack Indian personal-finance workspace designed around private records, contextual shared spending, and practical CA handoff. The product starts with a public animated landing page and moves into an authenticated workspace only after Manus OAuth completes.

## Current public experience

![Arthra public landing page](/manus-storage/arthra-landing_f961fbc4.png)

## Product surface

| Area | What is included |
| --- | --- |
| Privacy and access | Manus OAuth, protected finance procedures, server-side membership checks, public-only landing page, and expiring/revocable CA report links. |
| Money workflows | Income and expense records, INR display conventions, GST flags, notes, categories, accounts, receipt attachments, monthly budgets, and budget warning states. |
| Shared work | Expense Spaces with owner, editor, and viewer access; time-limited invite links; shared categories; and shared transaction views. |
| Insight and handoff | Interactive six-month charts, deterministic contextual insights, unusual-spend flags, Apr–Mar financial years, GST-aware CA CSV, and read-only CA reports. |
| Reliability | S3-backed receipts, PWA manifest, service-worker navigation fallback, test coverage, CI, and a scheduled weekly-digest handler. |

## Architecture

The client is React 19 with TypeScript, Tailwind, Framer Motion, and Recharts. The backend is Express plus typed tRPC procedures, Drizzle, and MySQL/TiDB. Each finance procedure verifies a user’s membership before reading or mutating a space; receipt bytes are stored through the preconfigured object-storage helper rather than in the relational database.

The app uses Express-driven SSR with a matching React hydration entry. Public routes receive semantic, content-bearing HTML and hydrated public query data; finance routes deliberately return a semantic `noindex` workspace shell, never another user’s data. This preserves search, accessibility, and HTML-fetcher readability without weakening financial-data boundaries.

The application is stateless at runtime and relies on indexed records for its finance queries. That is the correct foundation for autoscaling, but production capacity should still be monitored against actual traffic, query latency, attachment usage, and email volume before claiming a particular sustained-user target.

## Local commands

```bash
pnpm dev
pnpm check
pnpm test
pnpm drizzle-kit generate
pnpm build
BASE=http://127.0.0.1:4101 bash scripts/verify-ssr.sh
```

## Environment and digest setup

The app’s OAuth, database, storage, and platform settings are managed by the deployment environment. The weekly digest requires a verified transactional email sender and a Resend API key, both configured through the project’s secure settings. The implementation uses a cron-only `/api/scheduled/weekly-digest` handler and must be registered only after the site is published. It intentionally does not use in-process timers.

The production schedule is registered as **`arthra-weekly-digest`** (task UID `YF9bqtYHWr44u6rWnkYsky`) for **Monday 08:00 IST** (`0 30 2 * * 1` in the platform’s six-field UTC cron). It invokes the published handler only, so it remains independent of sandbox sessions and retries safely through the handler’s idempotency safeguards.

SSR deployments also require `CANONICAL_ORIGIN` (the production HTTPS domain) and `SITE_NAME` (`Arthra`) in the secure project settings. These values are used to generate canonical and social metadata safely at request time.

## Data safety notes

All persisted timestamps are UTC at the API and database boundary. The UI formats dates in the viewer’s locale. Currency calculations are stored in paise and displayed using `en-IN` formatting. The financial-year range is Apr 1 through Mar 31. Arthra does not make tax, legal, accounting, or investment decisions for users.

## Repository handoff

The `/home/ubuntu/webdev-static-assets/` folder holds the source PWA icon; the application references the platform-managed asset URL. Review `verification_notes.md` for the latest visual checks and `todo.md` for the implementation checklist.

## GitHub synchronization

The repository is published at `https://github.com/Abhirai2006/arthra` as a private source mirror. The managed deployment remote remains `origin`; the GitHub mirror is the `github` remote. After a future feature checkpoint, commit the reviewed code and push `main` with `git push github main` so the GitHub repository remains aligned with the live project.

## Product roadmap

The next high-value additions are account aggregation through consent-based providers, recurring-bill detection, household settlement suggestions, a dedicated receipt inbox with OCR review, scenario planning for tax and large purchases, a financial “year in review,” and user-controlled notifications for budget or unusual-spend events. Each should preserve the existing privacy model: opt-in data access, scoped sharing, and never exposing finance records in public HTML.
