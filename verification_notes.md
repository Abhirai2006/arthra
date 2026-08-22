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
