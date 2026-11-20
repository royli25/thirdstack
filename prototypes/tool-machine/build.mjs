import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./vendor/iso-kit.mjs";
import * as A from "./vendor/audit.mjs";
import { tools, travel } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 1120,
  HEIGHT = 630;
const base = { x: -225, y: -106, w: 450, d: 234, r: 8 };
const P = k.fitProjection(
  [
    ...k.boxCorners(base, -21, 18),
    ...k.boxCorners({ x: -203, y: -84, w: 406, d: 20, r: 2 }, 18, 124),
  ],
  WIDTH,
  HEIGHT,
  { pad: 45, azimuth: 35, elevation: 28 },
);
const R = A.recorder(P);
const S = k.solidSvg,
  L = k.lineSvg;
const at = (p) => k.iso(p, P);
let count = 0;
function screws(plan, z, inset = 3.5) {
  const points = k.corners(plan, inset);
  return (
    L(points.map(([x, y]) => k.ring(x, y, 1.15, z, P, 12)).join(""), {
      tone: "lo",
    }) +
    k.dotsSvg(
      points.map(([x, y]) => at([x, y, z])),
      { size: 0.42, tone: "hi" },
    )
  );
}
function box(
  name,
  plan,
  z,
  h,
  {
    tone = "mid",
    piece = "frame",
    move = [0, 0, 0],
    inner = "",
    className = "",
    ground = false,
    bevel = 0.7,
    owner,
  } = {},
) {
  count++;
  const shape = R.solid(A.slab(plan, z, h, { name, ground, owner }, 5));
  return R.put({
    name,
    piece,
    move,
    at: [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2],
    shapes: [shape],
    svg: S(k.slabOf(plan, z, h, P, 5, Math.min(bevel, h / 3)), {
      tone,
      crease: "lo",
      className,
      inner,
    }),
  });
}
const B = (name, x, y, w, d, z, h, opts) =>
  box(name, { x, y, w, d, r: Math.min(2.5, w / 5, d / 5) }, z, h, opts);

// Cast base with four independent feet and levelling pads.
for (const [i, [x, y]] of k.corners(base, 27).entries()) {
  B(`stand.foot-${i}`, x - 12, y - 11, 24, 22, -21, 8, {
    tone: "lo",
    ground: true,
  });
  B(`stand.pad-${i}`, x - 10, y - 9, 20, 18, -13, 4, { tone: "mid" });
}
box("stand.base", base, -9, 16, {
  tone: "lo",
  inner: L(k.sideSeam(base, -1, P, 5), { tone: "lo" }),
});
const deck = { x: -218, y: -99, w: 436, d: 218, r: 5 };
box("deck", deck, 7, 5, {
  tone: "mid",
  inner:
    screws(deck, 12, 10) +
    L(k.planOutline(k.insetPlan(deck, 5), 12, P, 5), { tone: "faint" }),
});

// Four fixed docking stations. Removable cartridges slide on exposed runners.
for (const [i, tool] of tools.entries()) {
  const x = tool.x;
  const foot = { x: x - 35, y: -75, w: 70, d: 74, r: 3 };
  box(`${tool.id}.mount`, foot, 12, 7, { inner: screws(foot, 19, 5) });
  for (const dx of [-25, 22])
    B(`${tool.id}.guide-${dx}`, x + dx, -65, 3, 81, 19, 4, { tone: "hi" });
  B(`${tool.id}.back`, x - 31, -73, 62, 7, 19, 49, { tone: "mid" });
  const piece = `tool-${i}`,
    move = travel.cartridge;
  const shell = { x: x - 28, y: -65, w: 56, d: 50, r: 4 };
  box(`${tool.id}.cartridge`, shell, 23, 39, {
    piece,
    move,
    tone: "hi",
    inner:
      L(k.sideSeam(shell, 29, P, 5), { tone: "faint" }) +
      L(
        k.pathOf(
          [
            [x + 28, -58, 34],
            [x + 28, -23, 34],
            [x + 28, -23, 56],
            [x + 28, -58, 56],
          ].map(at),
          true,
        ),
        { tone: "faint" },
      ) +
      k.dotsSvg(
        [
          [x + 28, -55, 53],
          [x + 28, -26, 37],
        ].map(at),
        { size: 0.4, tone: "lo" },
      ),
  });
  const lid = { x: x - 29, y: -66, w: 58, d: 52, r: 4 };
  const vents = Array.from({ length: 5 }, (_, n) =>
    L(
      k.planOutline(
        { x: x + 14 + n * 2.3, y: -57, w: 0.9, d: 25, r: 0.4 },
        65,
        P,
        4,
      ),
      { tone: "faint" },
    ),
  ).join("");
  const sign = `<image href="assets/${tool.logo}" width="14" height="14" x="-7" y="-7" transform="${k.topMatrix([x - 7, -43], 65.05, P, "x")}"/>`;
  box(`${tool.id}.cap`, lid, 62, 3, {
    piece,
    move,
    tone: "hi",
    inner: screws(lid, 65, 5) + vents + sign,
  });
  B(`${tool.id}.socket`, x - 20, -15, 40, 3.5, 33, 19, {
    piece,
    move,
    tone: "lo",
    inner: Array.from({ length: 8 }, (_, n) => {
      const a = at([x - 14 + n * 4, -11.5, 33]),
        b = at([x - 14 + n * 4, -11.5, 52]);
      return `<path class="iso-line" data-tone="faint" d="M${a.join(" ")}L${b.join(" ")}"/>`;
    }).join(""),
  });
  B(`${tool.id}.tab`, x - 9, -11.5, 18, 7, 39, 6, { piece, move, tone: "mid" });
  B(`${tool.id}.lamp`, x - 18, -48, 5, 5, 65, 0.7, {
    piece,
    move,
    className: `bay-lamp bay-${i}`,
    tone: "lo",
    bevel: 0,
  });
}

// A rigid bridge supports a linear scanning head. No floating slabs.
for (const x of [-199, 183]) {
  B(`post-shoe-${x}`, x - 6, -86, 28, 31, 12, 7, {
    inner: screws({ x: x - 6, y: -86, w: 28, d: 31, r: 2 }, 19, 4),
  });
  B(`post-${x}`, x, -80, 16, 19, 19, 88, {
    inner: L(k.planOutline({ x: x + 5, y: -74, w: 6, d: 7, r: 1 }, 107, P), {
      tone: "faint",
    }),
  });
  B(`post-cap-${x}`, x - 2, -82, 20, 23, 107, 4, {
    inner: screws({ x: x - 2, y: -82, w: 20, d: 23, r: 2 }, 111, 4),
  });
}
B("bridge", -183, -79, 366, 17, 97, 10, { tone: "hi" });
B("head-guide", -181, -77, 362, 13, 107, 3, { tone: "hi" });
const rule = { x: -180, y: -63.7, w: 360, d: 1.7, r: 0.3 };
const ticks = k.topTicks(-178, 178, 4, 5, rule.y, 107.6, [0.6, 1.4], P);
box("ruler", rule, 107, 0.6, {
  tone: "lo",
  inner: L(ticks.minor, { tone: "lo" }) + L(ticks.major, { tone: "mid" }),
});
const hx = tools[0].x;
const headOptions = {
  piece: "head",
  move: travel.head,
  tone: "hi",
  className: "scan-head",
};
B("head-bearing", hx - 18, -77, 36, 13, 110, 5, headOptions);
const head = { x: hx - 23, y: -80, w: 46, d: 24, r: 4 };
box("head", head, 115, 13, {
  ...headOptions,
  inner:
    screws(head, 128, 5) +
    `<image href="assets/two-hands-mark.svg" width="12" height="12" x="-6" y="-6" transform="${k.topMatrix([hx, -68], 128.05, P, "x")}"/>`,
});
B("head-arm", hx - 9, -56, 18, 30, 116, 8, headOptions);
B("head-stem", hx - 6, -38, 12, 12, 81, 35, headOptions);
B("head-lens", hx - 10, -42, 20, 20, 76, 5, {
  ...headOptions,
  className: "scan-head scan-lens",
  tone: "hi",
});

// The original intent is represented by a physical ticket and feed bed.
B("feeder-foot", -190, 47, 55, 46, 12, 6, { tone: "mid" });
B("feeder", -194, 51, 63, 38, 18, 22, {
  tone: "hi",
  inner: screws({ x: -194, y: 51, w: 63, d: 38, r: 2 }, 40, 5),
});
B("feeder-mouth", -184, 87, 43, 2, 25, 5, { tone: "lo", owner: "feeder" });

// Machined transport bed with seven transverse, individually seated slats.
B("transport", -123, 48, 244, 49, 12, 6, { tone: "lo" });
for (const y of [48, 93])
  B(`transport-edge-${y}`, -123, y, 244, 4, 18, 4, { tone: "hi" });
for (let n = 0; n < 7; n++)
  B(`slat-${n}`, -118 + n * 34, 52, 30, 41, 18, 2, {
    tone: "mid",
    inner: L(
      k.planOutline({ x: -115 + n * 34, y: 55, w: 24, d: 35, r: 1 }, 20, P),
      { tone: "faint" },
    ),
  });
const input = { x: -105, y: 57, w: 56, d: 31, r: 0.5 };
box("intent-ticket", input, 20, 0.8, {
  tone: "hi",
  piece: "input",
  move: [83, 0, 0],
  inner: [0, 1, 2]
    .map((n) =>
      L(
        k.lineOnTop(
          [-99, 65 + n * 6],
          [-64 + (n === 2 ? -11 : 0), 65 + n * 6],
          20.8,
          P,
        ),
        { tone: "lo", free: true },
      ),
    )
    .join(""),
});

// Printer and receiving tray at the front corner of the machine.
B("output-plinth", 135, 27, 65, 78, 12, 5, { tone: "mid" });
B("output-printer", 138, 29, 59, 37, 17, 19, {
  tone: "hi",
  inner: screws({ x: 138, y: 29, w: 59, d: 37, r: 2 }, 36, 5),
});
B("output-slot", 148, 64, 39, 2, 23, 4, {
  tone: "lo",
  owner: "output-printer",
});
B("output-tray", 142, 66, 51, 38, 17, 6, { tone: "mid" });
const output = { x: 149, y: 66, w: 37, d: 13, r: 0.6 };
box("output-ticket", output, 23, 0.5, {
  tone: "hi",
  piece: "ticket",
  move: travel.ticket,
  inner: [0, 1, 2]
    .map((n) =>
      L(k.lineOnTop([154, 69 + n * 3], [179 - n * 4, 69 + n * 3], 23.5, P), {
        tone: "lo",
        free: true,
      }),
    )
    .join(""),
});

const badge = { x: -10, y: -92, w: 49, d: 14, r: 1.5 };
box("nameplate", badge, 12, 0.7, {
  tone: "mid",
  inner: k.faceTextSvg(k.topMatrix([14.5, -84], 12.7, P, "x"), "Two Hands", {
    size: 4.2,
    tone: "hi",
    anchor: "middle",
  }),
});

// All independent motion combinations on a regular travel sweep, plus delivery.
// These are inspection poses, not an exploded view.
const states = [];
for (let n = 0; n <= 12; n++) {
  for (const drawer of [0, 1])
    states.push({
      label: `head ${n}/12, drawers ${drawer}`,
      shares: {
        head: n / 12,
        ...Object.fromEntries(tools.map((_, i) => [`tool-${i}`, drawer])),
        ticket: drawer,
        input: n / 12,
      },
    });
}
A.settle(R, P, { states });
R.items.sort((a, b) => a.key - b.key);
const body = [
  `<path class="iso-halo" d="${k.haloOf(base, -21, 10, P)}"/>`,
  `<g data-machine-parts>`,
  ...R.items.map(
    (item) =>
      `<g data-item="${item.name}" data-piece="${item.piece}" data-key="${item.key}" data-move="${item.move.join(",")}">${item.svg}</g>`,
  ),
  "</g>",
];
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A precision tool-selection machine. Four provider cartridges sit beneath a moving inspection head. An intent ticket travels in on the left; the agent's chosen cartridge slides forward, and a tool-call ticket advances into the receiving tray.",
  body,
});
writeFileSync(join(HERE, "machine.svg"), svg);
writeFileSync(
  join(HERE, "projection.json"),
  JSON.stringify(
    {
      P,
      view: { width: WIDTH, height: HEIGHT },
      V: A.cameraBasis(P).V,
      principalSolids: count,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Built tool machine: ${count} solids, ${WIDTH} × ${HEIGHT}`);
A.auditOrExit(R, P, { frames: states, apart: false });
