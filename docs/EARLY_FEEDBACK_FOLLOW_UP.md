# Arthra Early Feedback Follow-Up

**Status:** Planning input from one substantive `r/sideprojects` comment on 24 August 2026. This is not user research, product validation, or a public testimonial.

## What the feedback actually indicates

The commenter found the April-to-March reporting and shared Expense Spaces immediately understandable. Their practical concerns were whether a small independent finance product explains privacy clearly enough, and whether receipt attachment is discoverable when recording a transaction.

The right response is not a bigger feature list. Arthra should first make its existing boundaries easier to understand and prove. It must not claim device-only storage, because it uses hosted application infrastructure for account and finance-record storage.

## Completed response on 26 August 2026

The public landing page now has a plain-language pre-sign-in trust panel that accurately says Arthra is hosted, distinguishes the public product page from authenticated finance routes, and provides direct Privacy-policy and Contact paths. The transaction dialog now presents receipt attachment as a visible optional “Keep the proof with the record” step with mobile-friendly image/PDF guidance. The existing upload, protected retrieval, and review-first receipt suggestion behavior were retained.

The same release also restores the intended matte black, green, and blue public palette and adds only restrained visual depth: layered product-preview planes, gentle hover tilt on pointer-capable bento cards, and a subtle 3D trust orb. Those effects are gated behind `prefers-reduced-motion` and do not require any generated imagery or a heavy 3D runtime.

## Recommended order

| Priority | Improvement | Why it matters now | Definition of done |
| --- | --- | --- | --- |
| P0 | Repair external launch blockers | A real first-time sign-in and a real custom 404 take priority over any growth feature. | OAuth onboarding succeeds independently and an unknown live HTML route returns the application’s `404` with `noindex`. |
| P0 | Add a concise “How Arthra handles your data” trust panel before sign-in | **Completed on 26 August 2026.** Visitors now have an accurate plain-language explanation before deciding to create an account. | The landing page links to privacy information and states, in plain language, that Arthra is hosted and that authenticated finance routes are protected. No invented certifications or absolute-security claims. |
| P0 | Make privacy controls discoverable inside the product | A legal page alone is not enough for a finance tracker. | Signed-in users can find the Privacy page, data-export path, contact route, and account-deletion/request process from a clearly labelled settings or trust area. The deletion workflow should be implemented only after legal/operational requirements are defined. |
| P1 | Surface the existing receipt attachment flow at transaction creation and detail | **Completed on 26 August 2026.** The capability already existed; the release makes it a distinct optional step with clear image/PDF guidance. | Transaction create and edit views have an obvious optional “Add receipt” action and mobile-friendly helper text; existing accessible preview and protected retrieval remain in place. |
| P1 | Add a simple shared-space balance view | The commenter’s roommate example is a strong concrete use case. Recording shared spending is more useful when people can see net balances. | A shared Expense Space can show each member’s contributed amount, net amount owed/owing, calculation basis, and a record-only settlement mark. It must not move money or make payment claims. |
| P2 | Offer privacy-preserving receipt extraction only after clear consent | A later convenience improvement can reduce manual entry, but it introduces privacy and accuracy risk. | Users explicitly choose whether to run extraction, can review every suggested field before saving, and can continue without the feature. No receipt data is reused for training or external analysis without disclosed consent. |
| P2 | Build a small, structured feedback loop | One public comment is a clue, not a roadmap. | Invite a small controlled-beta cohort to answer the same five onboarding/trust questions, record themes privately, and publish nothing as a review without explicit display consent and moderation. |

## What not to do next

Do not add bank-account aggregation, automatic tax filing, investment recommendations, payment transfers, referral mechanics, public review widgets, or “bank-grade” claims to react to one comment. Each would expand data, regulatory, support, or trust obligations before Arthra’s core onboarding and privacy evidence are complete.

## Community follow-up

Reply once to the commenter with the factual response prepared in the Reddit playbook. Do not add follow-up promotional comments, ask for votes, or add links unless the commenter asks a direct question that needs one. If further commenters repeat the same concern, treat the pattern as a stronger research signal and schedule a focused product change rather than repeating promises in the thread.
