# Interaction Audit

Arthra uses motion to acknowledge actions without delaying financial work. The interaction system is intentionally restrained: high-frequency controls provide immediate feedback, while data views and dialogs use short transform-and-opacity transitions.

| Surface | Implemented behavior | Accessibility handling |
| --- | --- | --- |
| Primary and workspace buttons | Hover elevation or contrast change; press scale to `0.97` over 160 ms. | Native focus-visible ring remains visible; disabled controls do not animate as actions. |
| Landing CTA and product preview | Pointer-responsive parallax, floating chips, staggered entrance motion, and scroll composition. | Decorative continuous motion is gated by `prefers-reduced-motion`. |
| Dialog and form workflows | Radix dialogs, sheet controls, focused labels, pending indicators, and skeletons for data waits. | Semantic buttons, labels, and focus management are provided by the underlying accessible components. |
| Transaction and reporting lists | Short hover/press feedback, quiet row actions, loading skeletons, and explicit empty-state prompts. | Text and status messaging remain visible without relying on motion. |
| Budget health | SVG stroke-dashoffset progression and explicit amber/red warning copy for near/over states. | Color is paired with visible text and the warning icon. |
| Charts and analytics | Staggered entrance, responsive charts, and an on-demand explanation panel. | Tooltips supplement rather than replace visible chart labels. |

The global motion baseline is limited to `transform`, `opacity`, and SVG stroke offset where possible. It includes a reduced-motion safeguard for non-essential animation.
