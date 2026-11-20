# Two Hands tool machine

Disposable, standalone Anatomy Figure. Open `/prototypes/tool-machine/` on the existing Vite server, or serve this directory with any static HTTP server. Delete this entire directory to remove it. Nothing imports it from the app.

## Concept

A benchtop cartridge selector turns an intent ticket into a tool-call ticket. The gantry inspects a rack of compatible tool cartridges; the agent's chosen cartridge engages and the output printer advances. Two Hands exposes tools and records choices. The external agent owns the decision and the research.

The four demo candidates and estimates are transcribed from the supplied screenshot: Exa $0.007, Tavily $0.008, Brave $0.005, Parallel $0.005. They are illustrative, not current prices or observed provider results. The screenshot mentions seven compatible tools, but only these four are shown and modelled. No network provider calls, sessions, spending, analytics, or application state.

## Parts plan (before geometry)

Base: four elastomer feet, four levelling pads, cast base, upper deck, recessed control plate, engraved nameplate (12).

Rack: four mounting shoes, four cartridge shells, four caps, four front sockets, four pull tabs, eight guide runners (28).

Gantry: two post shoes, two uprights, two caps, rear tie beam, carriage guide, ruler strip, sliding carriage, carriage cap, pickup bracket, contact shoe (13).

Feed and output: feeder pedestal, feeder housing, feeder mouth, input ticket; conveyor bed, two edge guides, seven conveyor slats; output pedestal, printer housing, exit slot, output ticket (19).

Small parts: corner fasteners, lid screws, closed cooling slots, contact combs, ruler ticks, paper rules and status windows. These belong to the assemblies above rather than floating decoration. Approx. 72 principal solids, plus machined details.

## Model and motion

`model.mjs` owns the four fixtures, stage durations and positions. The inspection head steps through all four candidates, settles above the chosen bay, slides the chosen cartridge forward, then advances a printed ticket. Hover or arrow keys inspect a bay. Click a bay or its button to choose it; Enter runs that choice. Replay restarts the same sequence. Pause freezes it. Reduced motion jumps to a complete, interactive still; the idle tour and per-frame work stop offscreen.

## Rebuild

`node prototypes/tool-machine/build.mjs` regenerates `machine.svg` and `projection.json`. Add `--audit` to check the recorded solids. The vendored Anatomy kit retains its MIT license. `index.html`, `machine.css`, and `machine.mjs` run without a bundler.
