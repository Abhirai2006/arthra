# Verification Notes

## 2026-08-22 — public and protected route shells

The public route at `/` was visually inspected at a desktop viewport. It renders a dark-first marketing page with a navigation bar, clear public-only product messaging, mouse-reactive product illustration, asymmetrical feature cards, scroll-snap feature rail, sticky narrative, theme toggle, and a privacy-focused final CTA. No transaction, balance, user-name, or other financial record was rendered on the page.

The `/dashboard` route was then opened while unauthenticated. The initial capture showed the template loading skeleton during authentication resolution and did not expose finance information. Runtime logs after a fresh server restart showed no active server exception; the earlier missing-export error was resolved by adding the custom-category data operation. The final redirect timing and authenticated workflow will be checked in the full end-to-end validation phase.

## 2026-08-22 — responsive and authenticated preview

The public landing page was inspected at 375×812. The navigation compressed correctly, headline and product preview remained legible, feature cards stacked cleanly, and the final privacy CTA and footer did not overflow.

The protected dashboard route was then opened in an authenticated preview session. It showed the Arthra workspace shell, user identity, and the full navigation surface but did not render any transaction, budget, or analytics values while the protected queries were resolving. This confirms that no public route leaks those values; the resulting authenticated query views will be verified in the final flow test.

## 2026-08-22 — protected bootstrap timing

An authenticated dashboard capture showed the intended workspace shell and a deliberate loading skeleton while protected workspace data was requested. Server diagnostics confirmed the `finance.bootstrap` procedure completed successfully for the authenticated user, returning two Expense Spaces and ten categories. The observed capture occurred before the full database-backed request completed; no exception was present. Temporary diagnostics were then removed.

## 2026-08-22 — automated finance-flow verification

The full Vitest suite passed with 16 tests across eight files. The database-backed integration test created an isolated user, generated a default workspace, persisted a GST transaction dated 1 April 2026, attached receipt metadata, applied an over-budget monthly category budget, read the resulting Apr–Mar ledger row, and verified a CA share link became unavailable after revocation. The isolated user and all cascade-related records were removed after the test.

The production build completed with the PWA manifest and service worker present in the output. The initial public page is code-split from protected workspace and Recharts-heavy analytics routes. Public landing behavior was also checked at a 375×812 viewport; protected navigation and finance reads remain behind authenticated routes.

At 375×812, the protected workspace shell compressed to its mobile header and did not expose any finance values while authentication and protected data were unavailable. The compact header fit cleanly within the viewport, and the skeletons preserved visual hierarchy instead of revealing protected content.

## 2026-08-22 — budget and interaction visual audit

The development-only budget visual harness displayed the production `BudgetRing` component in all three states: healthy (purple, 62%), near budget (amber, 86%, with warning icon and copy), and over budget (coral, 112%, with warning icon and copy). This harness is included only in development and is omitted from the production route table.

`interaction_audit.md` records the button, dialog, list, empty-state, SVG, chart, focus, and reduced-motion behaviors applied across the product. The review confirms that warning color is always paired with textual status and an icon.

## 2026-08-22 — public CA share-link lifecycle

An isolated verification user created a live CA share token against the running application. The local route served correctly at the copied URL shape `/ca/<64-character-token>`. After immediate owner revocation, the same route continued to serve the application shell, allowing the public page’s unavailable state to be rendered rather than leaking report data. The verification user and cascading records were cleaned up after the check.

The browser then rendered the public report before revocation with FY 2026–27, the `Visual report entry` ledger row, its Home Expense Space, CGST + SGST label, and the ₹456.00 expense amount. After owner revocation and a route reload, the same token rendered **“This report link is not available.”** and no ledger content. This verifies the public content and unavailable state end to end.

## 2026-08-22 — SSR and mobile visual refresh

The SSR verification script built a production bundle and confirmed raw HTML bodies for `/`, `/privacy`, `/terms`, and `/dashboard`. The public routes contain their page headings and body copy within `#root`; the protected dashboard presents a semantic noindex workspace shell without financial data before authentication.

The refreshed mobile landing page was reviewed in dark mode and at `?theme=light`. The light surface now uses visible ink text, lavender, blush, mint, and cyan backdrop glows with an explicitly visible theme-control icon. On mobile, the public page includes a fixed quick-navigation bar, while the protected workspace adds a compact bottom dock with larger touch targets. Decorative blob, orbit, card, and chip motion are gated by reduced-motion preferences.

The mobile protected-route audit covered dashboard, transactions, budgets, Expense Spaces, analytics, and reports. The compact header exposes the active route, while the bottom dock maintains 52px tap areas and an explicit active state. Budgets and analytics resolved into readable finance content on the narrow viewport; routes awaiting their protected queries showed intentional no-data skeletons rather than partial or stale finance values. The existing persistence, authorization, sharing, export, receipt, and date integration tests continued to pass after the refresh.

## 2026-08-23 — protected route and semantic audit closure

The desktop audit exposed a React hook-order error in Expense Spaces when its protected workspace changed from the initial skeleton to resolved data. The member query now mounts before the loading return, restoring stable hook order. The repaired Space route rendered the Home card, owner state, invite action, and navigation correctly on both a 375px mobile viewport and a 1280px desktop viewport.

The finance-screen audit confirmed one `h1` per major page and section-level `h2` headings across dashboard, transactions, budgets, spaces, analytics, and reports. Dialog controls now use linked labels or grouped `aria-pressed` controls, category accents include readable names, the transactions search input is labelled, and CA-share icon controls have descriptive names. The automated protected persistence suite re-exercised transaction mutation, receipt metadata, budgets, CA CSV formatting, links, revocation, and Indian financial-year boundaries after the visual refresh.

The expanded database-backed lifecycle verification now creates an isolated invited user, provisions their workspace, creates an editor invite from the owner’s Home space, accepts it, confirms the member list, confirms the invited member’s accessible-space list, and confirms shared category visibility. The full suite has 17 passing tests, including the existing transaction, receipt, budget, analytics, reporting, CA export, and revocation scenarios.

The final individual audit reviewed the dashboard’s active-space selector, action buttons, summary and activity regions; budget controls and ring states; Expense Space action cards and dialogs; analytics disclosure state and chart region; transaction search and editor; and report selectors and share-link controls. The final release verification completed with `pnpm check`, 17 passing tests, and an SSR production build.

## 2026-08-23 — weekly digest schedule

After the published checkpoint, the platform Heartbeat job `arthra-weekly-digest` was registered with task UID `YF9bqtYHWr44u6rWnkYsky`. It posts only to `/api/scheduled/weekly-digest` at 02:30 UTC every Monday, which is 08:00 India Standard Time. No in-process timer or sandbox dependency is used.

## 2026-08-23 — portfolio upgrade and release checks

The public landing page and `/demo` were inspected at **1280×720** and **390×844**. The landing presented the updated India-native product proposition, direct Try Demo action, financial-context section, privacy explanation, product showcase, professional footer, and responsive light-theme treatment. The demo preserved its persistent `DEMO DATA` badge, visible Exit demo control, readable walkthrough sections, and a static read-only structure at both widths. The capture confirmed that the demo uses no authenticated account values; the protected-workspace screenshot tool remains unsuitable for proving data-changing user flows because it lacks a transferable authenticated session cookie.

The production-style SSR process was built and started locally with canonical metadata settings. `scripts/verify-ssr.sh` now checked `/`, `/privacy`, `/terms`, `/demo`, and `/dashboard`; it passed and confirmed the demo’s raw, labelled content plus `noindex, follow` metadata. The protected dashboard remained a semantic noindex shell with no finance payload in raw HTML.

The final release gate completed successfully with `pnpm check`, the full Vitest suite run with a 30-second database-hook allowance, and `pnpm build`. The suite contains **25 passing tests across 13 files**, including recurring-spend and budget-risk calculations, protected-shell hydration regression coverage, isolated-demo SSR coverage, and optional-assist PDF-fallback/insufficient-history boundaries. The optional AI provider was smoke-tested with fictional aggregate data only; the selected Gemini model returned a response. The image receipt-assist and AI-summary handlers remain server-side and neither path persists a generated suggestion automatically.

The public browser check manually selected **Try demo**, loaded `/demo` immediately without sign-in, verified the labelled fictional walkthrough, and selected **Exit demo** to return to `/`. The persistent test browser did not carry an authenticated workspace session, so the newly added protected retry states, in-product AI-summary click, and receipt-suggestion apply action were not browser-clicked in this final pass. Their code paths are type-checked and their non-destructive/fallback boundaries are covered by unit and provider smoke checks; the existing authorization and database integration tests continue to cover underlying protected finance mutations. Runtime logs were reviewed after the final screenshots. The last observed `WalletCards` and transient module-resolution messages predated their fixes; no later matching browser-console or server error was present in the reviewed tail.

## 2026-08-23 — sign-in, navigation, demo, and GitHub portfolio repair

The OAuth state now carries a validated local post-auth destination. A default public sign-in requests `/dashboard`; the callback redirects there after the secure session cookie is created, while valid local invitation paths remain supported. The shared `safePostAuthPath` regression test rejects external and protocol-relative destinations and confirms `/dashboard` plus invitation paths remain valid. Unauthenticated tRPC recovery now preserves the active local path and search query before login.

The public header was checked at a lower `#trust` landing section in an authenticated browser session. It remained visible above the section after being made fixed, and scroll targets retain space beneath it. Desktop and 390px mobile captures showed no observed font overlap in the repaired headings, cards, or demo flow. The mobile header, bottom quick navigation, and the demo’s persistent progress rail fit within the viewport.

The public demo was manually opened and the **Entries** module was selected. The walkthrough moved from `1 / 6` to `2 / 6`, scrolled to the fictional transaction stage, and retained read-only boundaries. Its explanatory controls update in-page read-only feedback only; they do not create finance records. The README now embeds four real repository-hosted screenshots from `docs/screenshots/`, avoiding the previous deployment-only relative storage URL that GitHub could not render.

The GitHub Actions workflow no longer declares a second pnpm version; it now uses the exact `packageManager` value in `package.json`, resolving the recorded action-setup conflict. The final release gate passed with `pnpm check`, **27 passing Vitest tests in 14 files**, `pnpm build`, and production-style SSR verification for public, demo, and protected route shells.

The first published repair checkpoint was opened on the live production domain at the lower privacy target; the fixed header remained visible with its navigation controls. The active authenticated browser then opened the protected dashboard directly from the public **Workspace** control and rendered the existing user’s overview plus first-run guide. A controlled logout-and-Google reauthentication was not forced because it would end the user’s active session; the exact first-sign-in destination remains verified by the safe local-path regression and callback implementation.
