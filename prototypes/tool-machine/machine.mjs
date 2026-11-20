import { tools, stateAt, timing, travel, money, callFor } from "./model.mjs";
import { translateAlong, cameraOf } from "./vendor/iso-kit.mjs";

const $ = (s) => document.querySelector(s);
const stage = $("#stage"),
  drawing = $("#drawing"),
  readout = $("[data-readout]");
const query = $("#query"),
  form = $("#intent-form"),
  pause = $("#pause");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let selected = 0,
  inspected = 0,
  preview = false,
  clock = 0;
let paused = false,
  visible = false,
  hidden = document.hidden,
  hovering = false,
  focused = false;
let frame = 0,
  last = 0,
  format = "mcp",
  lastPhase = "",
  idleAt = 0;
let x = tools[0].x,
  drawer = 0,
  ticket = 0,
  feed = 0,
  copyReset,
  resumeTimer;
let P,
  V,
  parts = [],
  lastOrder = "",
  buttonRefs = [],
  previousText = "";
const follow = (at, target, dt, seconds = 0.22) =>
  still.matches || Math.abs(at - target) < 0.002
    ? target
    : at + (target - at) * (1 - Math.exp(-dt / seconds));
const sample = () =>
  preview
    ? {
        phase: "preview",
        title: `Inspecting ${tools[inspected].name}`,
        detail: `${tools[inspected].tool} · ${money(tools[inspected].estimate)} sample estimate`,
        inspect: inspected,
        targetX: tools[inspected].x,
        drawer: 0,
        ticket: 0,
        feed: 1,
      }
    : stateAt(clock, selected);

function exportText() {
  const call = callFor(
    selected,
    query.value.trim() || "history of public libraries",
  );
  return format === "json"
    ? JSON.stringify(call, null, 2)
    : `${call.name}(${JSON.stringify(call.arguments, null, 2)})`;
}
function writeCall() {
  const text = exportText();
  if (text !== previousText) {
    $("#call").textContent = text;
    previousText = text;
  }
  $("#output-description").textContent =
    `${tools[selected].name} · ${money(tools[selected].estimate)} sample estimate · prepared locally`;
}
function describe(s) {
  $("#status-title").textContent = s.title;
  $("#status-detail").textContent = s.detail;
  if (s.phase !== lastPhase) {
    $("#announcement").textContent = `${s.title}. ${s.detail}`;
    lastPhase = s.phase;
  }
  const step =
    s.phase === "feed"
      ? 0
      : ["preview", "inspect"].includes(s.phase)
        ? 1
        : ["choose", "prepare"].includes(s.phase)
          ? 2
          : 3;
  document
    .querySelectorAll("[data-step]")
    .forEach((node, i) => node.toggleAttribute("data-active", i === step));
  buttonRefs.forEach((button, i) => {
    button.setAttribute("aria-pressed", String(selected === i));
    button.toggleAttribute("data-preview", s.inspect === i);
  });
  stage.dataset.phase = s.phase;
  stage.dataset.selected = tools[selected].id;
  stage.dataset.inspected = tools[s.inspect].id;
  stage.setAttribute("aria-description", `${s.title}. ${s.detail}`);
}
function render(dt = 0) {
  const s = sample();
  x = follow(x, s.targetX, dt, 0.2);
  drawer = follow(drawer, s.drawer, dt, 0.25);
  ticket = follow(ticket, s.ticket, dt, 0.16);
  feed = follow(feed, s.feed, dt, 0.2);
  const shares = {
    head: (x - tools[0].x) / travel.head[0],
    ticket,
    input: feed,
  };
  tools.forEach((_, i) => (shares[`tool-${i}`] = selected === i ? drawer : 0));
  for (const item of parts) {
    const share = shares[item.piece] || 0;
    item.node.setAttribute(
      "transform",
      translateAlong(
        P,
        item.move.map((v) => v * share),
      ),
    );
    item.liveKey = item.key + item.lift * share;
  }
  const sorted = [...parts].sort((a, b) => a.liveKey - b.liveKey);
  const order = sorted.map((item) => item.id).join(",");
  if (order !== lastOrder) {
    const fragment = document.createDocumentFragment();
    sorted.forEach(({ node }) => fragment.append(node));
    drawing.querySelector("[data-machine-parts]").append(fragment);
    lastOrder = order;
  }
  drawing
    .querySelectorAll(".bay-lamp")
    .forEach((node, i) =>
      node.toggleAttribute(
        "data-on",
        i === s.inspect && Math.abs(x - tools[s.inspect].x) < 6,
      ),
    );
  const arrived = Math.abs(x - s.targetX) < 1;
  const text = !arrived
    ? "Inspection head in transit"
    : s.phase === "feed"
      ? "Intent ticket feeding"
      : `${tools[s.inspect].name} · ${money(tools[s.inspect].estimate)} sample estimate`;
  if (readout.textContent !== text) readout.textContent = text;
  describe(s);
  stage.dataset.headX = x.toFixed(2);
  stage.dataset.ticket = ticket.toFixed(3);
  return (
    Math.abs(x - s.targetX) > 0.002 ||
    Math.abs(drawer - s.drawer) > 0.002 ||
    Math.abs(ticket - s.ticket) > 0.002 ||
    Math.abs(feed - s.feed) > 0.002
  );
}
function tick(now) {
  frame = 0;
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (!visible || hidden) return;
  if (paused && !preview) return;
  if (!paused && !preview && !still.matches) {
    clock += dt;
    if (clock > timing.repeat && !hovering && !focused && now > idleAt)
      clock = 0;
  }
  const moving = render(dt);
  if ((!paused && !preview && !still.matches) || moving)
    frame = requestAnimationFrame(tick);
}
function kick() {
  if (!frame && visible && !hidden) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}
function playbackState() {
  pause.textContent = paused ? "Play" : "Pause";
  pause.setAttribute("aria-pressed", String(paused));
}
function run(index = selected) {
  clearTimeout(resumeTimer);
  selected = index;
  inspected = index;
  preview = false;
  paused = false;
  clock = still.matches ? timing.ready + 1 : 0;
  idleAt = performance.now() + 10000;
  writeCall();
  playbackState();
  render();
  kick();
}
function inspect(index) {
  clearTimeout(resumeTimer);
  inspected = Math.max(0, Math.min(tools.length - 1, index));
  preview = true;
  paused = true;
  idleAt = performance.now() + 3600;
  playbackState();
  render();
  kick();
}
function choose(index) {
  selected = index;
  writeCall();
  run(index);
}

for (const [i, tool] of tools.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tool-option";
  button.dataset.tool = tool.id;
  button.setAttribute("aria-pressed", String(i === selected));
  button.setAttribute(
    "aria-label",
    `Choose ${tool.name}, sample estimate ${money(tool.estimate)}`,
  );
  const logo = new Image();
  logo.src = `./assets/${tool.logo}`;
  logo.alt = "";
  const label = document.createElement("span");
  label.className = "tool-name";
  label.textContent = tool.name;
  const meta = document.createElement("span");
  meta.className = "tool-meta";
  meta.textContent = tool.tool;
  label.append(meta);
  const price = document.createElement("span");
  price.className = "tool-price";
  price.textContent = money(tool.estimate);
  button.append(logo, label, price);
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") inspect(i);
  });
  button.addEventListener("focus", () => inspect(i));
  button.addEventListener("click", () => choose(i));
  $("#tool-options").append(button);
  buttonRefs.push(button);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (query.value.trim()) run();
});
query.addEventListener("input", writeCall);
$("#replay").addEventListener("click", () => run());
pause.addEventListener("click", () => {
  clearTimeout(resumeTimer);
  if (preview) {
    preview = false;
    clock = timing.choose;
  }
  paused = !paused;
  if (paused && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  playbackState();
  kick();
});
stage.addEventListener("keydown", (event) => {
  if (
    [
      "ArrowRight",
      "ArrowUp",
      "ArrowLeft",
      "ArrowDown",
      "Home",
      "End",
      "Enter",
      " ",
      "Escape",
    ].includes(event.key)
  )
    event.preventDefault();
  if (["ArrowRight", "ArrowUp"].includes(event.key))
    inspect((preview ? inspected : sample().inspect) + 1);
  if (["ArrowLeft", "ArrowDown"].includes(event.key))
    inspect((preview ? inspected : sample().inspect) - 1);
  if (event.key === "Home") inspect(0);
  if (event.key === "End") inspect(tools.length - 1);
  if (event.key === "Enter") choose(preview ? inspected : selected);
  if (event.key === " ") pause.click();
  if (event.key === "Escape") {
    clearTimeout(resumeTimer);
    preview = false;
    paused = true;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    playbackState();
  }
});

// Hit-test in the same isometric camera as the drawing. Hover previews; tap chooses.
function bayAt(event) {
  const svg = drawing.querySelector("svg");
  if (!svg) return -1;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
    svg.getScreenCTM().inverse(),
  );
  const camera = cameraOf(P);
  // iso-kit: screen x = (x*sin(a) - y*cos(a))*k; y = ((x*cos(a)+y*sin(a))*sin(e)-z*cos(e))*k.
  const sx = (point.x - P.origin[0]) / camera.k;
  const sy =
    ((point.y - P.origin[1]) / camera.k + 65 * camera.cosE) / camera.sinE;
  const wx = sx * camera.sinA + sy * camera.cosA;
  const wy = -sx * camera.cosA + sy * camera.sinA;
  if (wy < -80 || wy > 15) return -1;
  return tools.findIndex((t) => Math.abs(wx - t.x) < 36);
}
stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  const i = bayAt(event);
  if (i >= 0 && (!preview || inspected !== i)) inspect(i);
});
stage.addEventListener("click", (event) => {
  const i = bayAt(event);
  if (i >= 0) choose(i);
});
function resumeTour() {
  clearTimeout(resumeTimer);
  if (!preview || still.matches || hovering || focused) return;
  resumeTimer = setTimeout(() => {
    if (!hovering && !focused && !still.matches && preview) run();
  }, 3600);
}
$(".machine-figure").addEventListener("pointerenter", () => {
  hovering = true;
  clearTimeout(resumeTimer);
});
$(".machine-figure").addEventListener("pointerleave", () => {
  hovering = false;
  idleAt = performance.now() + 3600;
  resumeTour();
});
$(".machine-figure").addEventListener("focusin", () => {
  focused = true;
  clearTimeout(resumeTimer);
});
$(".machine-figure").addEventListener("focusout", (event) => {
  focused = $(".machine-figure").contains(event.relatedTarget);
  resumeTour();
});
document.querySelectorAll("[data-format]").forEach((button) =>
  button.addEventListener("click", () => {
    format = button.dataset.format;
    document
      .querySelectorAll("[data-format]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    writeCall();
  }),
);
$("#copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(exportText());
    $("#copy").textContent = "Copied";
  } catch {
    $("#copy").textContent = "Select ticket";
    const range = document.createRange();
    range.selectNodeContents($("#call"));
    const selection = getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  clearTimeout(copyReset);
  copyReset = setTimeout(() => ($("#copy").textContent = "Copy"), 1800);
});
$("#theme").addEventListener("click", () => {
  const dark = document.body.dataset.theme !== "dark";
  document.body.dataset.theme = dark ? "dark" : "light";
  $("#theme").textContent = dark ? "Light paper" : "Dark paper";
  $("#theme").setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
});
still.addEventListener("change", () => {
  if (still.matches) {
    clock = timing.ready + 1;
    preview = false;
    paused = true;
    playbackState();
    render();
  }
  kick();
});
document.addEventListener("visibilitychange", () => {
  hidden = document.hidden;
  if (hidden && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else kick();
});

try {
  const [svgResponse, projectionResponse] = await Promise.all([
    fetch("./machine.svg"),
    fetch("./projection.json"),
  ]);
  if (!svgResponse.ok || !projectionResponse.ok)
    throw new Error("Machine assets could not be loaded.");
  const [svg, projection] = await Promise.all([
    svgResponse.text(),
    projectionResponse.json(),
  ]);
  P = projection.P;
  V = projection.V;
  drawing.innerHTML = svg;
  parts = [...drawing.querySelectorAll("[data-item]")].map((node, id) => {
    const move = node.dataset.move.split(",").map(Number);
    return {
      node,
      id,
      piece: node.dataset.piece,
      key: Number(node.dataset.key),
      move,
      lift: move.reduce((sum, val, i) => sum + val * V[i], 0),
    };
  });
  if (still.matches) {
    clock = timing.ready + 1;
    paused = true;
  }
  writeCall();
  playbackState();
  render();
  new IntersectionObserver(
    (entries) => {
      visible = entries.at(-1).isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else kick();
    },
    { rootMargin: "80px 0px" },
  ).observe(stage);
} catch (error) {
  drawing.textContent = "The machine could not be assembled.";
  $("#load-error").hidden = false;
  $("#load-error").textContent =
    `${error.message} Serve this folder over HTTP and rebuild with node prototypes/tool-machine/build.mjs.`;
}
