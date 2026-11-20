# Two Hands prototypes

Run `npm run demo:dashboard -- --port 5184`, then open:

- [Orthogonal landing reference](http://127.0.0.1:5186/orthogonal.html) — the latest separate landing prototype. Run `npm run demo:dashboard -- --port 5186`; see [its guide](./orthogonal/README.md).
- [Landing · Shake draft](http://127.0.0.1:5184/shake.html) — the Figma landing-page iteration, based on [Figma frame 218:3877](https://www.figma.com/design/WjofMoGOzEmDvoRdERi1O5/Untitled?node-id=218-3877).
- [Dashboard](http://127.0.0.1:5184/) — existing dashboard, catalog, and sign-in demos.
- [Earlier landing page](http://127.0.0.1:5184/landing.html).

The Shake draft uses shadcn controls, Untitled UI icons, local Figma assets, Geist, and Hubot Sans. Edit `shake.tsx` and `shake.css` to iterate. The hero’s right side is intentionally empty, matching the source frame.

Agentation loads in development and connects to the existing MCP server at `http://localhost:4747`. Open the toolbar in the bottom-right corner to annotate the page. It is excluded from production builds.

The landing page is a local interaction prototype. Tabs, FAQ accordions, mobile navigation, and the setup dialog work; account and catalog links lead to the existing demo screens. The setup dialog copies a command and does not register a real account or call providers. Additional tab panels use explicitly labeled sample data.

Source differences follow project instructions: blue actions use `--brand-accent` (#3AA0ED), selected tabs stay neutral, and section eyebrow labels are omitted. Unverified savings, volume, customer-endorsement, and insurance copy is replaced with neutral copy.

Validation: `npm run check`, `npx tsc --noEmit -p prototypes/dashboard/tsconfig.json`, and `npx vite build --config prototypes/dashboard/vite.config.ts --outDir /tmp/two-hands-prototype-build`. Browser checks should cover the feature tabs and keyboard navigation, FAQ expansion, setup command copying, dialog focus restoration, demo routes, Agentation connection, local assets, and layouts from 320px to 1440px.
