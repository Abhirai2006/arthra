# Arthra Launch-Readiness Assessment

**Assessment date:** 24 August 2026  
**Scope:** Public-web launch, real-user onboarding, Google discovery, security operations, and commercial handoff.  
**Current recommendation:** **Controlled beta only — not a broad public launch yet.**

## Executive assessment

Arthra is a strong, working product prototype with a deployed SSR public site, protected finance workspace, consent-gated public forms, automated regression coverage, and a coherent security baseline. It is not yet appropriate to describe as “fully launch-ready for anyone” because several production responsibilities are unproven or incomplete: independent end-to-end sign-in with a fresh external user, Search Console verification and index status, operational support/monitoring, formal privacy and legal disclosures, an account-data deletion process, and remaining high-severity dependency maintenance.

| Area | Evidence | Current status | Launch implication |
| --- | --- | --- | --- |
| Public routes | Live root, About, privacy, and terms return HTTP 200; raw SSR has one title/description, canonical URLs, and content. | **Ready for controlled-beta public pages** | Public marketing pages can be used in a controlled beta. |
| 404 behavior | Local production returns the SSR 404 with `noindex`, and a static `404.html` fallback was added. On 24 August, live `/does-not-exist` and even `/404.html` still returned the platform’s “Site under maintenance” HTTP 503 before reaching either fallback. | **Verified hosting/gateway blocker** | Do not claim general route reliability or broad public-launch readiness until the hosting-level fallback/route forwarding is corrected and rechecked live. |
| Login | OAuth callback validates a nonce/state cookie, upserts the user, creates a secure session, and redirects to the requested safe path. The owner session logged out safely to the public landing page on 24 August 2026, but a production sign-in attempt then redirected to a Manus maintenance page rather than an identity flow. | **Source-tested; external identity service temporarily unavailable** | A real first-time user needs a separate live sign-in test after the Manus OAuth portal is available again. Do not invite beta users while sign-in reaches the maintenance page. |
| Finance authorization | Protected procedures and ownership/membership tests pass; protected responses are `no-store`. | **Good application boundary** | Safe to retain for beta, subject to operations and dependency maintenance. |
| Dependency risk | Production audit reports **0 critical, 7 high, 30 moderate, and 7 low** advisories after NanoID 5.1.16 remediation. The spreadsheet importer’s `xlsx` dependency remains a known no-fix concern. | **Not clear for broad handling of sensitive financial data** | Maintain a remediation plan and restrict import exposure until parser replacement is assessed. |
| Google readiness | Robots, sitemap, canonical URLs, SSR titles/descriptions, Open Graph metadata, favicon, and structured data are present. The Search Console URL-prefix property is HTML-tag verified; `/sitemap.xml` was submitted successfully and discovered four pages; the root live test reports that the URL is available to Google and can be indexed. | **Technical discovery setup complete; indexing still pending** | Google Index currently reports the root as “Discovered — currently not indexed.” The day’s manual indexing-request quota was exceeded, so the request must be retried later. A sitemap is a hint, not an indexing guarantee.[1] [2] |
| Legal/privacy | Current pages state high-level processing and data sharing boundaries. They do not yet identify the controller/operator, effective date, retention schedule, data deletion workflow, processors, or a complete incident/contact process. | **Material pre-launch gap** | Obtain jurisdiction-specific legal review before broad public collection of financial data. |
| Support & operations | Contact and Waitlist submissions now attempt a content-free owner alert and are available only in owner-gated `/operations`, where their status can be recorded and records can be deleted. An operating runbook and a tested cron-authenticated daily public-route health monitor are now in source. The project-level schedule is active daily at 09:00 UTC; notification delivery and a backup/restore drill still require evidence. | **Improved; not complete for broad launch** | Observe the monitor, complete backup/restore evidence, and define a support response practice before customer acquisition. |

## Google discovery status

The technical SEO foundation is now in place: full server-rendered public content, unique titles/descriptions, canonical URLs, a root sitemap, crawler directives, structured-data markup, social metadata, and a favicon. The owner’s Search Console URL-prefix property for `https://arthrafin-7qakibfj.manus.space/` has been verified through the deployed HTML tag, and `/sitemap.xml` was submitted successfully with four discovered pages. Search Console’s live test reports that the root URL is available to Google and can be indexed. The Google Index report still reads **“Discovered — currently not indexed,”** and the owner account’s daily manual indexing-request quota was exceeded. Google’s own documentation states that sitemap submission is only a hint and does not guarantee crawling or indexing; actual visibility must be checked with Search Console and the URL Inspection tool.[1] [2]

**Completed Google actions:** property verification, sitemap submission, and a successful root live test. **Remaining Google actions:** retry the root indexing request after the daily quota resets, inspect `/about` live, and monitor Page Indexing, HTTPS, Security Issues, and Core Web Vitals reports over time. Do not promise organic visibility before Google indexes and reports on the relevant pages.

## Authentication and user-readiness conclusion

The implementation includes CSRF-resistant OAuth state handling, HTTPS cookie settings, a safe post-auth redirect, and tests for logout/authorization. The owner session logged out safely to the public landing page on 24 August 2026. When sign-in was then initiated, the configured Manus OAuth destination presented a maintenance page rather than authentication, so the re-login and fresh-user steps could not be completed. This is a current external identity-provider availability blocker rather than evidence of a successful production login. After the portal returns, complete a real external first-time sign-in, account-creation, onboarding, workspace-redirect, logout, and return-login check.

## User-support and data-governance gaps

The Contact and Waitlist forms require consent, validate bounded input, resist basic automated submissions, and do not expose a public read endpoint. The configured owner can now review their private records in `/operations`, record handling status, and permanently delete a record; each new submission attempts a content-free owner notification. The owner must still define the support channel, response target, privacy-request verification process, and retention rule. The product does not yet prove that an external notification was delivered or that the operating practice is staffed.

The existing privacy page describes categories of financial data and sharing controls, but it should be expanded before broad launch to state the controller/operator name and contact method, effective date, processing purposes, retention/deletion rules, service providers/subprocessors, cross-border handling where applicable, user-access/deletion process, cookie/analytics choice, incident contact, and a grievance/escalation route. This is not legal advice; an India-qualified privacy lawyer should review the final public text and operating practices.

The current request limiter is deliberately an in-memory process-local safeguard. It is useful against basic bursts but does not provide durable multi-instance rate limiting and resets on restart. Move abusive-public-form limits to a shared/edge store before paid acquisition or a public campaign. The active daily 09:00 UTC health monitor checks the home-page sign-in entry, sitemap, and unknown-route contract without handling finance or public-form content, and emits an owner alert only for a new or changed failure. Its first scheduled run and notification delivery must now be observed. Add a verified alert-delivery record, tested backups/restores, a staffed support inbox, and a privacy-request tracker before broad launch.

## Beta gate

Move from controlled beta to broad launch only when all items below have evidence attached:

1. After the Manus OAuth portal is available, a real independent user completes sign-in, onboarding, logout, and return login on the production domain.
2. Search Console ownership is verified, the sitemap is submitted, root indexing is requested after quota availability, and root/About are live-inspected as indexable.
3. The production host is configured to forward unknown HTML routes or serve Arthra’s custom 404; `/does-not-exist` must return an Arthra 404/noindex response, not a gateway 503/maintenance page.
4. A reviewed privacy notice, terms, data-deletion process, and support contact owner are published.
5. The owner demonstrates that notifications are received or performs a documented inbox review cadence, then responds to and deletes Contact/Waitlist records through the operational workflow.
6. High-severity dependency findings have owners, dates, and a spreadsheet-import parser replacement/containment decision.
7. The daily monitor scheduler is active, notifications have been received or the failure path has been exercised, and backup/restore plus incident-response exercises are completed.

## Operations materials

The code-backed support workflow, scheduled health-monitor design, and owner handoff checklist are documented in [`LAUNCH_OPERATIONS_RUNBOOK.md`](./LAUNCH_OPERATIONS_RUNBOOK.md). The official India privacy-law source consulted for the documentation boundary is recorded in [`LAUNCH_RESEARCH_NOTES.md`](./LAUNCH_RESEARCH_NOTES.md). These documents do not constitute legal advice or claim legal compliance.

## Commercial-readiness conclusion

Arthra can be presented as a **well-documented private beta / source asset** today. It should not be sold or marketed as an enterprise-ready, regulated, “unhackable,” or broadly consumer-ready fintech product until the blockers above are addressed and verified. Any buyer should receive source code, dependency/SBOM review, deployment instructions, the data-access model, a statement that the app is not a bank or adviser, and confirmation that no production user data is included in the sale package.

## Commercial positioning and valuation framework

The available evidence supports an **asset-sale framing**, not a conventional SaaS valuation: no verified ARR, profit, active users, retention, customer contracts, or operating history was supplied. Standard SaaS methods rely on profit, ARR, or EBITDA. Smaller sub-$1 million ARR deals commonly use SDE; growth businesses are commonly valued against ARR; and larger steady businesses use EBITDA.[3] Public SaaS ARR multiples are not a usable shortcut for Arthra because multiplying zero or unverified revenue produces no defensible enterprise value, and private-company multiples are generally lower than public references.[4]

| Sale framing | What a buyer receives | My practical guidance | What would change the price materially |
| --- | --- | --- | --- |
| **Source asset today** | Repository, current design system, docs, deployment handoff, domain if transferable, and no user data. | **List at ₹4–7 lakh as a negotiable starting ask; expect diligence-driven offers that may be below it.** This is a seller-side negotiation anchor, not an audited valuation. | Confirmed IP ownership, a custom domain, independent user auth, clean dependency remediation, operating runbook, support workflow, and a completed beta cohort. |
| **Private beta with evidence** | The asset above plus verified user cohort, feedback, onboarding completion, uptime history, and legal/operations package. | Do not set a fixed range without measured activation, retention, support load, and buyer type. | 30/90-day retention, active users, growth, support responsiveness, and reduced founder/platform dependency. |
| **Revenue business** | A functioning company with transferable contracts, billing, customer metrics, and financial records. | Use a buyer diligence model based on TTM SDE/profit or ARR, not a code-cost estimate. | ARR, gross margin, SDE, churn, growth, concentration, compliance, and clean ownership/contract transferability. |

The recommended ₹4–7 lakh listing range assumes a **clean asset transfer with no production personal data**, an informed buyer who can operate TypeScript/React/Express/TiDB infrastructure, and an explicit disclosure that login currently depends on the configured Manus OAuth flow. Do not tell buyers that the product is regulated, fully public-launch-ready, or free of known dependency/operational risks. A strategic buyer who already has compliant identity, support, and distribution may value the product more highly; a buyer who must rebuild those foundations will value it lower.

## References

[3]: https://www.saas.group/blog/how-to-value-my-saas-business/ "SaaS.group — How to value my SaaS business"
[4]: https://www.saas-capital.com/blog-posts/saas-valuation-multiples-understanding-the-new-normal/ "SaaS Capital — SaaS Valuation Multiples: Understanding the New Normal"

## References

[1]: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap "Google Search Central — Build and submit a sitemap"
[2]: https://support.google.com/webmasters/answer/9012289?hl=en "Google Search Console Help — URL Inspection tool"
