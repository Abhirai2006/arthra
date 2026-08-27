# Arthra Visual Reference Research

**Purpose:** Select motion and visual-interaction patterns that improve a finance product’s clarity and tactility without creating distraction, performance cost, motion discomfort, or misleading trust signals.

## Reference findings

| Reference | Useful pattern | Arthra decision |
| --- | --- | --- |
| [Motion](https://motion.dev/docs) | React-level transitions, scroll animation, layout transitions, and 3D transforms. | Arthra already ships with Framer Motion. Reuse it for component-level interactions rather than introduce a second animation runtime. |
| [Anime.js](https://animejs.com/documentation/) | Lightweight DOM/SVG/CSS transform animation, timelines, and draggable interactions. | Do not add it alongside Motion. Its most relevant lesson is precise timing and transform-only interaction, which the existing stack can implement. |
| [Motion Primitives](https://motion-primitives.com/docs) | Customisable, open-source animated interface components built on Motion and Tailwind. | Borrow the principle of small, composable, purposeful motion rather than copy a large visual kit into the application. |
| [Shaders](https://shaders.com/docs/guide) | WebGPU canvas effects for backgrounds, lighting, and cursor-reactive decoration, with an empty-canvas fallback on unsupported devices. | Do not introduce a WebGPU dependency for Arthra’s core public pages. A finance application benefits more from a lightweight CSS/SVG ambient layer and a dependable static fallback. |
| [Kokonut UI](https://kokonutui.com/) | React, Tailwind, shadcn, and Motion components plus a machine-readable registry and `llms.txt`. | Arthra already uses compatible React/Tailwind/shadcn/Motion foundations. Its useful precedent is a small discovery surface for agents, not dependency-heavy copied components. |
| [Watermelon UI](https://ui.watermelon.sh/) | Copy-paste React components, animated micro-interactions, tokens, and dashboard patterns. | Reuse the existing accessible component primitives and refine their visual hierarchy; do not add a second design-system package. |
| [Originkit](https://www.originkit.dev/) | A wide set of visual effects including particles, cursors, refractive gems, and morphing backgrounds. | Use only its low-intensity ambient-light and particle principles. Avoid character cursors, refraction, vortexes, and motion-heavy backgrounds around finance tasks. |
| [Particles by Casberry](https://particles.casberry.in/) | High-volume interactive WebGL particle simulations with 3D controls. | Do not import a 20,000-particle or WebGL simulation. Create a tiny CSS/SVG decorative constellation that never consumes task interaction and turns off for reduced motion. |
| [Lightswind UI](https://lightswind.com/) | Animated React components and interface blocks with a UI-kit approach. | Maintain a bespoke Arthra system with a smaller palette and fewer visual effects, while retaining the idea of clear motion hierarchy. |
| [Backlight](https://backlight.dev/) | Design-system collaboration, token documentation, and visual review workflow; its hosted product is shutting down. | Treat design tokens and visual regression checks as the reusable lesson. Do not depend on the retired service. |
| [Sketchbook](https://github.com/MengTo/sketchbook) | Device-aware pointer parallax, layered depth, and reduced-motion/touch fallbacks in a self-contained implementation. | Reuse only gentle, optional pointer parallax on decorative landing layers. A page-turn or draggable magnifier would be unrelated to finance work. |

## Interim direction

The selected direction is a **calm, tactile ledger** aesthetic: low-density particle constellation orbits behind the hero, subtle pointer depth only on large pointer devices, consistent highlight and scrollbar colours, and no animated finance values. All nonessential motion must be removed for `prefers-reduced-motion`, and the visual layer must remain decorative, `aria-hidden`, and non-interactive so the semantic public page and crawler-visible content stay unaffected.

## Explicit exclusions

Arthra will not add a second animation library, a WebGL/WebGPU runtime, high-count particle simulation, aggressive cursor tracking, liquid-glass forms, scrolling text effects, or continuous movement around dashboard balances. These would create an unjustified performance, focus, or trust cost for a personal-finance product. The work will instead use the installed Motion/CSS foundation, semantic server-rendered content, and a minimal decorative layer with a stable non-animated fallback.

## Implemented selection

The release adds a small SVG constellation to the public hero. It remains decorative and unavailable to assistive technology, accepts no pointer events, shifts gently only on large pointer-capable devices, and becomes static for people who prefer reduced motion. No financial amount, chart, or workflow state is animated. The release also adds a high-contrast teal selection treatment, narrow rounded scrollbars with clear track/thumb differentiation, `rel="describedby"` discovery of `/llms.txt`, and richer public `SoftwareApplication` JSON-LD. These measures use Arthra’s existing React, Motion, CSS, and server-rendered HTML path, not copied code or a new graphics library.

The custom selection foreground/background pair is covered by an automated WCAG normal-text contrast threshold check of at least 4.5:1. The same contract verifies that the constellation is hidden from assistive technology, does not capture pointer input, and has a reduced-motion fallback. Desktop and mobile visual checks were completed after implementation.

## References

[1] [Motion documentation](https://motion.dev/docs)

[2] [Anime.js documentation](https://animejs.com/documentation/)

[3] [Motion Primitives documentation](https://motion-primitives.com/docs)

[4] [Shaders guide](https://shaders.com/docs/guide)

[5] [Kokonut UI](https://kokonutui.com/)

[6] [Watermelon UI](https://ui.watermelon.sh/)

[7] [Originkit](https://www.originkit.dev/)

[8] [Particles by Casberry](https://particles.casberry.in/)

[9] [Lightswind UI](https://lightswind.com/)

[10] [Backlight](https://backlight.dev/)

[11] [MengTo Sketchbook](https://github.com/MengTo/sketchbook)
