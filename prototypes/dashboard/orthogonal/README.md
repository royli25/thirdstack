# Orthogonal landing reference

An independent local reproduction of [orthogonal.com](https://www.orthogonal.com/), captured on November 18, 2026. The existing Two Hands app and earlier prototypes are preserved.

Run from the repository root:

```sh
npm run demo:dashboard -- --port 5186
```

Open [the landing page](http://127.0.0.1:5186/orthogonal.html). Agentation is available at the bottom-right in development, connected to `http://localhost:4747`.

## Editing

- `../orthogonal.tsx` mounts the page and local account-dialog adapter.
- `content.ts` contains editable landing-page copy.
- `prototype.css` contains local adapter styles and is the place for subsequent design overrides.
- `reference.css` preserves the captured global and component styles, typography, breakpoints, masks, and keyframes.
- `local-adapters.tsx` supplies the frozen public catalog, local assets, native links, Untitled UI icons, Radix controls, and clipboard behavior.
- `vendor/reference-modules.js` preserves the public presentation code, WebGL shaders, particle geometry, spring physics, scroll transforms, card artwork, pixel key, and footer horizon.
- `vendor/code-modules.js` preserves the code-panel presentation. `vendor/highlight-modules.js` loads the captured highlighting grammar on demand.
- `assets/` contains locally served brand assets, provider logos, integration marks, and the original font files. Asset URLs are bundled for production builds.

The original presentation modules are preserved as formatted source behind a small module adapter so the intricate motion follows its actual implementation. They do not load Orthogonal's authentication, analytics, routing, or backend clients. The adaptation uses the project's React installation and Untitled UI interface icons. Original reference branding and colors are intentional for this requested copy.

## Motion and capture

The reference recording is `output/orthogonal-reference/orthogonal-live-122-seconds.webm` (121.84 seconds). It includes more than a continuous minute of the hero, cursor movements, API cards, the scroll-driven key scene, integrations, CTA, and footer. Timestamped screenshots and the rendered reference are stored beside it. Capture and verification artifacts are ignored by git.

Preserved motion includes the 120-second field orbit, 24-second particle cycles, animated API-card fields, pointer lens and dwell behavior, rotating brand mark, pixel key assembly, scroll-pinned key collapse, integration-tab chip and bead movement, code highlighting, CTA pixel artwork, and animated footer horizon. The captured reduced-motion and visibility-pause behavior is retained.

## Local boundaries

This is a landing-page prototype. Catalog content is a frozen public-source snapshot, isolated from production workspace data and provider statistics. Search filters that local catalog. Non-home content links open the original site in a new tab. Sign-in and trial actions open a local explanation dialog and never create an account, run an API call, or spend funds.

## Verification

```sh
npm run check
npx tsc --noEmit -p prototypes/dashboard/tsconfig.json
npx vite build --config prototypes/dashboard/vite.config.ts --outDir /tmp/orthogonal-production
node prototypes/dashboard/orthogonal/verify.mjs
```

The browser verifier covers animated WebGL output, pointer interaction, Agentation, category and empty-result search states, Enter submission to the original site's search page while preserving the prototype, carousel controls, all six integration tabs, clipboard contents, trial/sign-in dialogs and focus restoration, key scroll states, footer return-to-top, local image loading, no text halos, reduced motion, viewport widths from 320px to 1440px, console/page errors, and unexpected external requests. Evidence is written to `output/orthogonal-verification/`.

For a built preview, set `PROTOTYPE_BUILT=1` and `PROTOTYPE_URL` when running the verifier. Agentation must be absent from that build. No live provider checks are performed.
