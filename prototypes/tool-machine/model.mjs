// Illustrative fixtures transcribed from the user's reference, never live prices.
export const tools = [
  {
    id: "exa",
    name: "Exa",
    tool: "exa_search",
    estimate: 0.007,
    x: -135,
    logo: "exa.svg",
  },
  {
    id: "tavily",
    name: "Tavily",
    tool: "tavily_search",
    estimate: 0.008,
    x: -45,
    logo: "tavily.svg",
  },
  {
    id: "brave",
    name: "Brave",
    tool: "brave_search",
    estimate: 0.005,
    x: 45,
    logo: "brave-mark.png",
  },
  {
    id: "parallel",
    name: "Parallel",
    tool: "parallel_search",
    estimate: 0.005,
    x: 135,
    logo: "parallel-mark.svg",
  },
];
export const travel = {
  head: [270, 0, 0],
  cartridge: [0, 18, 0],
  ticket: [0, 22, 0],
};
export const timing = {
  feed: 1.25,
  inspect: 4.85,
  choose: 6.35,
  prepare: 7.65,
  ready: 9,
  repeat: 14,
};
export const money = (value) => `$${value.toFixed(3)}`;
export function stateAt(time, selected = 0) {
  const chosen = tools[selected];
  if (time < timing.feed)
    return {
      phase: "feed",
      title: "Intent enters",
      detail: "The agent brings the task to Two Hands.",
      inspect: 0,
      targetX: tools[0].x,
      drawer: 0,
      ticket: 0,
      feed: time / timing.feed,
    };
  if (time < timing.inspect) {
    const inspect = Math.min(3, Math.floor((time - timing.feed) / 0.9));
    return {
      phase: "inspect",
      title: "Compatible tools",
      detail: `Inspecting ${tools[inspect].name} · illustrative estimate ${money(tools[inspect].estimate)}`,
      inspect,
      targetX: tools[inspect].x,
      drawer: 0,
      ticket: 0,
      feed: 1,
    };
  }
  if (time < timing.choose)
    return {
      phase: "choose",
      title: "The agent chooses",
      detail: `${chosen.name} is the agent’s choice in this demo.`,
      inspect: selected,
      targetX: chosen.x,
      drawer: 0,
      ticket: 0,
      feed: 1,
    };
  if (time < timing.prepare)
    return {
      phase: "prepare",
      title: "Tool engaged",
      detail: `Preparing ${chosen.tool} with the original query.`,
      inspect: selected,
      targetX: chosen.x,
      drawer: 1,
      ticket: 0,
      feed: 1,
    };
  const ticket = Math.min(
    1,
    (time - timing.prepare) / (timing.ready - timing.prepare),
  );
  return {
    phase: ticket < 1 ? "print" : "ready",
    title: ticket < 1 ? "Call taking shape" : "Ready for the agent",
    detail: `${chosen.tool} · ${money(chosen.estimate)} sample estimate`,
    inspect: selected,
    targetX: chosen.x,
    drawer: 1,
    ticket,
    feed: 1,
  };
}
export const callFor = (selected, query) => ({
  name: tools[selected].tool,
  arguments: { query },
});
