// Public homepage presentation modules captured from orthogonal.com on 2026-11-18.
// App authentication, analytics, network clients, and routing are replaced by local adapters.
export const referenceModules = [
  [
    [618248],
    (e) => {
      "use strict";
      var t = e.i(843476),
        a = e.i(154452),
        i = e.i(271645),
        r = e.i(492855),
        n = e.i(853884),
        l = e.i(368356),
        o = e.i(975157),
        s = e.i(124247),
        c = e.i(718687);
      let d = [
        "apollo",
        "serper",
        "icypeas",
        "tomba",
        "leadsforge",
        "fiber",
        "exa",
        "company-enrich",
        "scrapecreators",
        "hunter",
        "abstractapi",
        "predictleads",
        "coresignal",
        "findymail",
        "linkup",
        "sixtyfour",
        "agentphone",
        "influencers-club",
        "contactout",
        "aviato",
        "bytemine",
        "baseten",
        "tavily",
        "perplexity",
        "openrouter",
        "brand-dev",
      ];
      var u = e.i(830582),
        h = e.i(80751),
        f = e.i(768877),
        b = e.i(770180);
      let m = [
        { className: b.default.cornerTl, transform: void 0 },
        {
          className: b.default.cornerTr,
          transform: (e) => `matrix(-1 0 0 1 ${e} 0)`,
        },
        {
          className: b.default.cornerBl,
          transform: (e) => `matrix(1 0 0 -1 0 ${e})`,
        },
        {
          className: b.default.cornerBr,
          transform: (e) => `matrix(-1 0 0 -1 ${e} ${e})`,
        },
      ];
      function p({
        size: e = 10,
        inset: a = 0,
        line: i = !1,
        className: r,
        style: n,
      }) {
        let l = 0.125 * e,
          s = i
            ? `M0.5 ${e}V0.5H${e}`
            : `M0 ${e} L0 ${l} Q0 0 ${l} 0 L${e} 0 A${e} ${e} 0 0 0 0 ${e} Z`;
        return (0, t.jsx)("span", {
          "aria-hidden": !0,
          className: (0, o.f)(b.default.corners, r),
          style: { inset: `${a}px`, ...n },
          children: m.map(({ className: a, transform: r }) =>
            (0, t.jsx)(
              "svg",
              {
                className: (0, o.f)(b.default.corner, a),
                width: e,
                height: e,
                viewBox: `0 0 ${e} ${e}`,
                children: (0, t.jsx)("path", {
                  d: s,
                  transform: r?.(e),
                  ...(i
                    ? {
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: 1,
                        shapeRendering: "crispEdges",
                      }
                    : {}),
                }),
              },
              a,
            ),
          ),
        });
      }
      let g = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·−_";
      function v({
        text: e,
        play: a,
        duration: r = 520,
        delay: n = 0,
        className: l,
      }) {
        let s = (0, i.useRef)(null);
        return (
          (0, i.useEffect)(() => {
            let t = s.current?.firstChild;
            if (!(t instanceof Text)) return;
            let i = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            if (!a || i) {
              t.nodeValue = e;
              return;
            }
            let l = [...e],
              o = l.map(
                (e, t) =>
                  n +
                  (t / l.length) * 0.7 * r +
                  0.3 * (0, h.v)(t, l.length) * r,
              ),
              c = performance.now(),
              d = 0,
              u = (a) => {
                let i = a - c,
                  s = Math.floor(i / 50),
                  f = "";
                (l.forEach((e, t) => {
                  " " === e || i >= (o[t] ?? 0)
                    ? (f += e)
                    : i < n
                      ? (f += " ")
                      : (f +=
                          g[Math.floor((0, h.x)(t, s, 7) * g.length)] ?? "_");
                }),
                  (t.nodeValue = f),
                  i < n + r
                    ? (d = requestAnimationFrame(u))
                    : (t.nodeValue = e));
              };
            return (
              u(c),
              () => {
                (cancelAnimationFrame(d), (t.nodeValue = e));
              }
            );
          }, [e, a, r, n]),
          (0, t.jsxs)("span", {
            className: (0, o.f)(b.default.decode, l),
            children: [
              (0, t.jsx)("span", { className: b.default.srOnly, children: e }),
              (0, t.jsx)("span", { "aria-hidden": !0, ref: s, children: e }),
            ],
          })
        );
      }
      var x = e.i(325164),
        y = e.i(298428);
      let w = [0.16, 1, 0.3, 1],
        M = {
          "--d1-enter": `cubic-bezier(${w.join(", ")})`,
          "--d1-settle": (function (e, t = 40) {
            let a = Array.from({ length: t + 1 }, (a, i) =>
              i === t ? "1" : String(Math.round(1e3 * e(i / t)) / 1e3),
            );
            return `linear(${a.join(", ")})`;
          })(function (e) {
            if (e <= 0) return 0;
            if (e >= 1) return 1;
            let t = 7.4 * e;
            return 1 - Math.exp(-t) * (1 + t);
          }),
        },
        A = (e) => (e >= 1280 ? 24 : e >= 768 ? 20 : 16),
        C = (0, h.a)(...w),
        k = new Map();
      function E(e, { x0: t, y0: a, x1: i, y1: r }, n) {
        let l,
          o = new Map(),
          s = 0;
        for (let c = a; c < r; c += 1)
          for (let a = t; a < i; a += 1) {
            let t = (96 * c + a) * 4;
            if (!n(a, c, t) || ((s += 1), (e[t + 3] ?? 0) < 224)) continue;
            let i = e[t] ?? 0,
              r = e[t + 1] ?? 0,
              d = e[t + 2] ?? 0,
              u = ((i >> 5) << 6) | ((r >> 5) << 3) | (d >> 5),
              h = o.get(u) ?? { n: 0, rgb: [0, 0, 0] };
            ((h.n += 1),
              (h.rgb[0] += i),
              (h.rgb[1] += r),
              (h.rgb[2] += d),
              o.set(u, h),
              (!l || h.n > l.n) && (l = h));
          }
        if (!l) return null;
        let { n: c, rgb: d } = l;
        return { rgb: [d[0] / c, d[1] / c, d[2] / c], share: c / s };
      }
      function N(e, t, [a, i, r]) {
        return Math.hypot(
          (e[t] ?? 0) - a,
          (e[t + 1] ?? 0) - i,
          (e[t + 2] ?? 0) - r,
        );
      }
      async function j(e, t) {
        let a = new Image();
        ((a.decoding = "async"),
          (a.src = (0, y.getImageProps)({
            src: e.image,
            alt: "",
            width: 64,
            height: 64,
          }).props.src),
          await a.decode());
        let i = document.createElement("canvas");
        ((i.width = 96), (i.height = 96));
        let r = i.getContext("2d", { willReadFrequently: !0 });
        if (!r) return null;
        let n = a.naturalWidth || 96,
          l = a.naturalHeight || 96,
          o = Math.min(96 / n, 96 / l),
          s = (96 - n * o) / 2,
          c = (96 - l * o) / 2;
        r.drawImage(a, s, c, n * o, l * o);
        let { data: d } = r.getImageData(0, 0, 96, 96),
          u = {
            x0: Math.ceil(s),
            y0: Math.ceil(c),
            x1: Math.floor(96 - s),
            y1: Math.floor(96 - c),
          },
          f = (function (e, t) {
            let { x0: a, y0: i, x1: r, y1: n } = t,
              l = Math.max(2, Math.round(0.08 * Math.min(r - a, n - i))),
              o = E(
                e,
                t,
                (e, t) =>
                  e - a < l || r - 1 - e < l || t - i < l || n - 1 - t < l,
              );
            if (!o || o.share < 0.3) return null;
            let s = o.rgb,
              c = 0;
            for (let t = i; t < n; t += 1)
              for (let i = a; i < r; i += 1) {
                let a = (96 * t + i) * 4;
                (e[a + 3] ?? 0) >= 224 && 53.004 > N(e, a, s) && (c += 1);
              }
            return c >= 0.35 * (r - a) * (n - i) ? s : null;
          })(d, u),
          b =
            f ??
            (function (e) {
              let t = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e ?? "");
              if (!t?.[1]) return [255, 255, 255];
              let a = parseInt(
                3 === t[1].length ? [...t[1]].map((e) => e + e).join("") : t[1],
                16,
              );
              return [(a >> 16) & 255, (a >> 8) & 255, 255 & a];
            })(e.bgColor),
          m = f && (E(d, u, (e, t, a) => N(d, a, f) >= 110.425)?.rgb ?? null),
          p = m?.map((e, t) => e - (b[t] ?? 0)),
          g = p ? p.reduce((e, t) => e + t * t, 0) : 0,
          v = new Float32Array(9216),
          x = 0;
        for (let e = 0; e < v.length; e += 1) {
          let t = 4 * e,
            a =
              p && g > 0
                ? (0, h.O)(
                    p.reduce(
                      (e, a, i) => e + ((d[t + i] ?? 0) - (b[i] ?? 0)) * a,
                      0,
                    ) / g,
                  )
                : N(d, t, b) / 441.7,
            i = ((d[t + 3] ?? 0) / 255) * a;
          ((v[e] = i), i > x && (x = i));
        }
        if (x < 0.05) return null;
        let w = 96,
          M = 96,
          A = -1,
          C = -1;
        for (let e = 0; e < 96; e += 1)
          for (let t = 0; t < 96; t += 1)
            (v[96 * e + t] ?? 0) > 0.2 * x &&
              ((w = Math.min(w, t)),
              (M = Math.min(M, e)),
              (A = Math.max(A, t + 1)),
              (C = Math.max(C, e + 1)));
        if (A < 0) return null;
        let k = (Math.max(A - w, C - M) * t) / (t > 5 ? t - 2 : t),
          j = (w + A - k) / 2,
          F = (M + C - k) / 2,
          R = k / t,
          S = new Float32Array(t * t),
          P = 0;
        for (let e = 0; e < t; e += 1)
          for (let a = 0; a < t; a += 1) {
            let i = 0;
            for (let t = 0; t < 4; t += 1)
              for (let r = 0; r < 4; r += 1) {
                let n = Math.floor(j + (a + (r + 0.5) / 4) * R),
                  l = Math.floor(F + (e + (t + 0.5) / 4) * R);
                n >= 0 &&
                  l >= 0 &&
                  n < 96 &&
                  l < 96 &&
                  (i += v[96 * l + n] ?? 0);
              }
            ((S[e * t + a] = i / 16), (P = Math.max(P, i / 16)));
          }
        let L = Math.max(P, 0.25);
        return S.map((e) => {
          let t = e / L;
          return t < 0.16 ? 0 : t < 0.42 ? 0.33 : t < 0.68 ? 0.55 : 0.8;
        });
      }
      function F(e, t, a, i, r, n) {
        let l = Math.min(window.devicePixelRatio || 1, 2),
          o = Math.round(i * l);
        e.width !== o && ((e.width = o), (e.height = o));
        let s = e.getContext("2d");
        if (!s) return;
        (s.clearRect(0, 0, o, o), (s.fillStyle = getComputedStyle(e).color));
        let c = o / a,
          d = null === n ? null : n * l,
          u = (a - 1) / 2;
        for (let e = 0; e < a; e += 1)
          for (let i = 0; i < a; i += 1) {
            let n = t[e * a + i] ?? 0;
            if (!n) continue;
            let l = (i + 0.5) * c,
              f = (e + 0.5) * c,
              b = 1,
              m = l;
            if (r < 180) {
              let t =
                null === d
                  ? Math.max(Math.abs(i - u), Math.abs(e - u)) / Math.max(u, 1)
                  : Math.abs(l - d) / o;
              ((b = C((0, h.O)((r - 60 * t) / 120))),
                null !== d && (m = d + (l - d) * b));
            }
            if (b <= 0) continue;
            let p = Math.max(
              1,
              Math.round(n * c * (null === d ? b : 0.4 + 0.6 * b)),
            );
            ((s.globalAlpha = null === d ? 1 : Math.min(1, 1.5 * b)),
              s.fillRect(Math.round(m - p / 2), Math.round(f - p / 2), p, p));
          }
        s.globalAlpha = 1;
      }
      function R({
        logo: e,
        size: a,
        cells: r,
        play: n,
        developed: l = !1,
        from: s,
        className: c,
      }) {
        var d;
        let u = (0, i.useRef)(null),
          f = (0, i.useRef)(null),
          m = (0, i.useRef)(!1),
          [p, g] = (0, i.useState)(!1),
          v = (0, i.useEffectEvent)((e) => {
            if (!s) return null;
            let t = e.getBoundingClientRect();
            return (0, h.O)(s.x - t.left, 0, a);
          });
        return (
          (0, i.useEffect)(() => {
            let t,
              i,
              l = u.current;
            if (!l) return;
            let o = !1,
              s = 0;
            return (
              (m.current = !1),
              ((t = `${e.image}|${e.bgColor ?? ""}|${r}`),
              !(i = k.get(t)) && ((i = j(e, r).catch(() => null)), k.set(t, i)),
              i).then((e) => {
                if (o || ((f.current = e), g(!e), !e)) return;
                let t = window.matchMedia(
                  "(prefers-reduced-motion: reduce)",
                ).matches;
                if (!1 === n)
                  return void l
                    .getContext("2d")
                    ?.clearRect(0, 0, l.width, l.height);
                if (void 0 === n || t) {
                  (F(l, e, r, a, 1 / 0, null), (m.current = !0));
                  return;
                }
                let i = v(l),
                  c = performance.now(),
                  d = (t) => {
                    let n = t - c;
                    (F(l, e, r, a, n, i),
                      n < 180
                        ? (s = requestAnimationFrame(d))
                        : (m.current = !0));
                  };
                s = requestAnimationFrame(d);
              }),
              () => {
                ((o = !0), cancelAnimationFrame(s));
              }
            );
          }, [e.image, e.bgColor, r, a, n]),
          (0, i.useEffect)(() => {
            let e = u.current,
              t = e?.closest("[data-d1-theme]");
            if (!e || !t) return;
            let i = 0,
              n = new MutationObserver(() => {
                (cancelAnimationFrame(i),
                  (i = requestAnimationFrame(() => {
                    let t = f.current;
                    t && m.current && F(e, t, r, a, 1 / 0, null);
                  })));
              });
            return (
              n.observe(t, { attributeFilter: ["data-d1-theme"] }),
              () => {
                (n.disconnect(), cancelAnimationFrame(i));
              }
            );
          }, [r, a]),
          (0, t.jsxs)("span", {
            className: (0, o.f)(b.default.logo, c),
            style: { width: a, height: a },
            "data-developed": l && !p,
            children: [
              (0, t.jsx)("canvas", {
                ref: u,
                "aria-hidden": !0,
                className: b.default.logoLattice,
              }),
              p
                ? (0, t.jsx)("span", {
                    className: b.default.logoInitials,
                    style: { fontSize: Math.max(9, Math.round(0.28 * a)) },
                    children:
                      ((d = e.image),
                      (d.split(/[?#]/)[0]?.split("/").pop() ?? "")
                        .replace(/\.[a-z]+$/i, "")
                        .replace(/[^a-z0-9]/gi, "")
                        .slice(0, 2)
                        .toUpperCase() || "API"),
                  })
                : (0, t.jsx)("span", {
                    className: b.default.logoTile,
                    style: { background: e.bgColor ?? "#ffffff" },
                    children: (0, t.jsx)(x.default, {
                      src: e.image,
                      alt: "",
                      width: a,
                      height: a,
                      draggable: !1,
                      className: e.fill
                        ? b.default.logoImgFill
                        : b.default.logoImgContain,
                    }),
                  }),
            ],
          })
        );
      }
      function S({
        world: e,
        api: a,
        anchor: r,
        color: n,
        open: s,
        onHold: c,
        onClose: d,
        tracking: u = !1,
        follow: m,
      }) {
        let g = (0, i.useRef)(null),
          x = (0, i.useRef)(null),
          y = (0, i.useRef)(null),
          w = (0, i.useRef)(null),
          C = (0, i.useRef)(!1),
          k = (0, i.useRef)(!1),
          E = (0, i.useRef)(!1),
          N = () => {
            let e = k.current || E.current;
            C.current !== e && ((C.current = e), c(e));
          },
          j = (0, i.useRef)(null),
          F = (0, i.useRef)(null),
          P = (e, t) => {
            let a = F.current,
              i = j.current,
              r = y.current;
            if (!a || !i || !r) return;
            let n = e - a.bx,
              l = t - a.by,
              o = Math.hypot(n, l),
              s = Math.min(0.75 * i.p, 0.5 * o);
            (r.setAttribute(
              "points",
              `${a.ax},${a.ay} ${a.bx},${a.by} ${o > 0 ? e - (n / o) * s : e},${o > 0 ? t - (l / o) * s : t}`,
            ),
              w.current?.setAttribute("x", String(a.bx - 1.5)),
              w.current?.setAttribute("y", String(a.by - 1.5)));
          },
          L = (0, i.useRef)(!1),
          _ = (0, i.useRef)(0),
          [T, D] = (0, i.useState)(a ? { api: a, color: n } : null),
          [O, H] = (0, i.useState)(null),
          [$, I] = (0, i.useState)(!0),
          [B, z] = (0, i.useState)(!1),
          [G, q] = (0, i.useState)(!1),
          [V, W] = (0, i.useState)(s);
        (s !== V && (W(s), s ? (I(!B), q(B)) : z(!0)),
          (0, i.useEffect)(() => {
            if (s || !B) return;
            let e = window.setTimeout(() => z(!1), 1200);
            return () => window.clearTimeout(e);
          }, [s, B]),
          (0, i.useEffect)(() => {
            if (!G) return;
            let e = window.setTimeout(() => q(!1), 220);
            return () => window.clearTimeout(e);
          }, [G]));
        let Y = O ?? T;
        (a &&
          (a.index !== Y?.api.index || n !== Y.color) &&
          (s && V && T
            ? (H({ api: a, color: n }), I(!1))
            : (D({ api: a, color: n }), H(null))),
          (0, i.useEffect)(() => {
            if (!O) return;
            let e = window.setTimeout(() => {
              (D(O), H(null));
            }, 80);
            return () => window.clearTimeout(e);
          }, [O]));
        let [X, U] = (0, i.useState)(!1),
          [K, Q] = (0, i.useState)(!1);
        (0, i.useEffect)(() => {
          let e = window.setTimeout(
            () => {
              (Q(s), s || U(!1));
            },
            s ? 80 : 360,
          );
          return () => window.clearTimeout(e);
        }, [s]);
        let J = (0, i.useEffectEvent)(() => {
            ((k.current = !1),
              (E.current = !1),
              C.current && ((C.current = !1), c(!1)));
          }),
          Z = (0, i.useEffectEvent)(() => {
            (J(), d());
          });
        (0, i.useEffect)(() => {
          if (!s) return void J();
          let e = (e) => {
            "Escape" === e.key && Z();
          };
          return (
            window.addEventListener("keydown", e),
            () => window.removeEventListener("keydown", e)
          );
        }, [s]);
        let ee = r?.x,
          et = r?.y;
        ((0, i.useLayoutEffect)(() => {
          s || (L.current = !1);
          let e = g.current,
            t = x.current;
          if (!e || !t || void 0 === ee || void 0 === et) return;
          L.current &&
            !u &&
            ((e.dataset.switching = "true"),
            window.clearTimeout(_.current),
            (_.current = window.setTimeout(() => {
              delete e.dataset.switching;
            }, 240)));
          let a = () => {
            let a = window.innerWidth,
              i = window.innerHeight,
              r = A(a),
              n = t.offsetWidth || 336,
              l = t.offsetHeight || 184,
              o = [...document.querySelectorAll("[data-d1-clear]")]
                .map((e) => e.getBoundingClientRect())
                .filter(
                  (e) =>
                    e.width > 0 &&
                    e.bottom > 0 &&
                    e.top < i &&
                    e.right > 0 &&
                    e.left < a,
                ),
              s = (e, t) =>
                o.some(
                  (a) =>
                    e < a.right + 24 &&
                    e + n > a.left - 24 &&
                    t < a.bottom + 24 &&
                    t + l > a.top - 24,
                ),
              c = (e) => {
                let t = Math.round(ee + 0.75 * (e ? -1 : 1) * r),
                  o = Math.round(
                    (0, h.O)(e ? t - 2 * r - n : t + 2 * r, 16, a - 16 - n),
                  );
                return {
                  left: e,
                  px: o,
                  py: Math.round(
                    (0, h.O)(et - Math.min(72, l / 2), 16, i - 16 - l),
                  ),
                };
              },
              d = c(ee > 0.55 * a),
              u = d;
            if (s(u.px, u.py)) {
              let e = c(!u.left);
              if (s(e.px, e.py)) {
                let t = [d, e]
                  .flatMap((e) =>
                    o.flatMap((t) =>
                      [t.bottom + 24, t.top - 24 - l].map((t) => ({
                        ...e,
                        py: Math.round(t),
                      })),
                    ),
                  )
                  .filter(
                    (e) => e.py >= 16 && e.py <= i - 16 - l && !s(e.px, e.py),
                  )
                  .sort(
                    (e, t) => Math.abs(e.py - d.py) - Math.abs(t.py - d.py),
                  )[0];
                t && (u = t);
              } else u = e;
            }
            if (
              ((j.current = {
                px: u.px,
                py: u.py,
                w: n,
                h: l,
                left: u.left,
                p: r,
              }),
              e.style.setProperty("--px", `${u.px}px`),
              e.style.setProperty("--py", `${u.py}px`),
              (e.dataset.side = u.left ? "left" : "right"),
              m)
            ) {
              let t = u.left ? u.px + n : u.px,
                a = Math.round((0, h.O)(et, u.py + 20, u.py + l - 20)) + 0.5;
              ((F.current = {
                ax: t,
                ay: a,
                bx:
                  Math.round((t + (ee + (u.left ? -1 : 1) * 0.75 * r)) / 2) +
                  0.5,
                by: a,
              }),
                (e.dataset.leader = "angled"),
                P(ee, et));
            } else
              (delete e.dataset.leader,
                ((e, t, a) => {
                  let i = j.current;
                  if (!i) return;
                  let { px: r, py: n, w: l, h: o, left: s, p: c } = i,
                    d = Math.round(t + (s ? -1 : 1) * 0.75 * c),
                    u = s ? r + l : r,
                    f = Math.round(a - 0.5),
                    b = f < n ? "down" : f > n + o - 1 ? "up" : "none",
                    m = (t, a) => e.style.setProperty(t, `${a}px`);
                  (m("--attach-y", (0, h.O)(a - n, 0, o)),
                    m("--lx", Math.min(d, u)),
                    m("--ly", f),
                    m("--lw", Math.abs(u - d)),
                    m("--vx", s ? u - 1 : u),
                    m("--vy", "down" === b ? f : n + o),
                    m("--vh", "down" === b ? n - f : f + 1 - (n + o)),
                    (e.dataset.bend = b));
                })(e, ee, et));
          };
          return (
            a(),
            s && (L.current = !0),
            window.addEventListener("resize", a),
            () => window.removeEventListener("resize", a)
          );
        }, [ee, et, T, s, u, m]),
          (0, i.useLayoutEffect)(() => {
            if (!e || !m || !s || void 0 === ee || void 0 === et) return;
            let t = 0 / 0,
              a = 0 / 0;
            return e.subscribe(() => {
              let e = m.current;
              (t !== e.x || a !== e.y) && ((t = e.x), (a = e.y), P(t, a));
            });
          }, [e, s, m, ee, et]));
        let ea = T?.api,
          ei = s && X,
          er = { "--card-color": Y?.color ?? "transparent" },
          en = (e) => ({ play: s && $, duration: 200, delay: 120 + 20 * e });
        return (0, t.jsxs)("div", {
          ref: g,
          className: b.default.card,
          style: M,
          "data-open": s,
          "data-swap": O ? "out" : void 0,
          "data-warm": G || void 0,
          inert: !s,
          children: [
            (0, t.jsx)("span", { className: b.default.leaderH }),
            (0, t.jsx)("span", { className: b.default.leaderV }),
            (0, t.jsxs)("svg", {
              className: b.default.leaderPath,
              "aria-hidden": !0,
              focusable: "false",
              children: [
                (0, t.jsx)("polyline", { ref: y, pathLength: 1 }),
                (0, t.jsx)("rect", { ref: w, width: 3, height: 3 }),
              ],
            }),
            (0, t.jsxs)("div", {
              ref: x,
              className: b.default.plate,
              style: er,
              "data-hover": ei,
              onPointerEnter: () => {
                (U(!0), (k.current = !0), N());
              },
              onPointerLeave: () => {
                ((k.current = !1), U(E.current), N());
              },
              onFocus: () => {
                ((E.current = !0), U(!0), N());
              },
              onBlur: (e) => {
                e.currentTarget.contains(e.relatedTarget) ||
                  ((E.current = !1), U(k.current), N());
              },
              children: [
                (0, t.jsx)(p, { size: 10, inset: ei ? 0 : -2 }),
                ea
                  ? (0, t.jsx)(l.Link, {
                      href: ea.href,
                      prefetch: !1,
                      className: b.default.plateLink,
                      "aria-label": `${ea.name} — open API page`,
                      children: (0, t.jsxs)("span", {
                        className: b.default.content,
                        children: [
                          (0, t.jsxs)("span", {
                            className: (0, o.f)(
                              b.default.mono,
                              b.default.rowHead,
                              b.default.swap,
                            ),
                            children: [
                              (0, t.jsx)(v, {
                                text: `N\xb0 ${String(ea.index + 1).padStart(2, "0")}`,
                                ...en(0),
                              }),
                              (0, t.jsx)(v, { text: "MOST CALLED", ...en(0) }),
                            ],
                          }),
                          (0, t.jsxs)("span", {
                            className: (0, o.f)(
                              b.default.identity,
                              b.default.swap,
                            ),
                            children: [
                              (0, t.jsx)("span", {
                                className: b.default.logoPlate,
                                children: (0, t.jsx)(R, {
                                  logo: ea.logo,
                                  size: 56,
                                  cells: 14,
                                  play: $ ? K : void 0,
                                  developed: ei,
                                  from: r ?? void 0,
                                }),
                              }),
                              (0, t.jsxs)("span", {
                                className: b.default.ident,
                                children: [
                                  (0, t.jsx)("span", {
                                    className: b.default.name,
                                    children: ea.name,
                                  }),
                                  (0, t.jsx)("span", {
                                    className: b.default.blurb,
                                    children: ea.blurb,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, t.jsx)("span", { className: b.default.rule }),
                          (0, t.jsxs)("span", {
                            className: (0, o.f)(
                              b.default.mono,
                              b.default.rowData,
                            ),
                            children: [
                              (0, t.jsxs)("span", {
                                className: b.default.category,
                                children: [
                                  (0, t.jsx)("span", {
                                    className: b.default.swatch,
                                  }),
                                  (0, t.jsx)(v, {
                                    text: (ea.category ?? "API").toUpperCase(),
                                    className: b.default.swap,
                                    ...en(1),
                                  }),
                                ],
                              }),
                              (0, t.jsx)(v, {
                                text: `${ea.endpoints} ${1 === ea.endpoints ? "ENDPOINT" : "ENDPOINTS"}`,
                                className: b.default.swap,
                                ...en(1),
                              }),
                            ],
                          }),
                          (0, t.jsxs)("span", {
                            className: (0, o.f)(
                              b.default.mono,
                              b.default.rowData,
                              b.default.swap,
                            ),
                            children: [
                              (0, t.jsx)(v, {
                                text: ea.price.toUpperCase(),
                                ...en(2),
                              }),
                              (0, t.jsxs)("span", {
                                className: b.default.open,
                                children: [
                                  (0, t.jsx)(v, { text: "OPEN API", ...en(2) }),
                                  (0, t.jsx)(f.f, {
                                    "aria-hidden": !0,
                                    className: b.default.arrow,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    })
                  : null,
              ],
            }),
          ],
        });
      }
      var P = e.i(375775);
      function L() {
        return (L =
          Object.assign ||
          function (e) {
            for (var t = 1; t < arguments.length; t++) {
              var a = arguments[t];
              for (var i in a)
                Object.prototype.hasOwnProperty.call(a, i) && (e[i] = a[i]);
            }
            return e;
          }).apply(this, arguments);
      }
      function _(e, t) {
        if (e.length !== t.length) throw Error("vectors must be same length");
        return e.map(function (e, a) {
          return e + t[a];
        });
      }
      function T(e) {
        return Math.max.apply(Math, e.map(Math.abs));
      }
      function D(e) {
        return (
          Object.freeze(e),
          Object.values(e).forEach(function (e) {
            null === e || "object" != typeof e || Object.isFrozen(e) || D(e);
          }),
          e
        );
      }
      var O = [1, 18, ("u" > typeof window && window.innerHeight) || 800],
        H = [-1, -1, -1],
        $ = D({ preventWheelAction: !0, reverseSign: [!0, !0, !1] });
      function I() {
        return {
          isStarted: !1,
          isStartPublished: !1,
          isMomentum: !1,
          startTime: 0,
          lastAbsDelta: 1 / 0,
          axisMovement: [0, 0, 0],
          axisVelocity: [0, 0, 0],
          accelerationFactors: [],
          scrollPoints: [],
          scrollPointsToMerge: [],
          willEndTimeout: 400,
        };
      }
      let B = function (e) {
        void 0 === e && (e = {});
        var t,
          a,
          i,
          r,
          n,
          l = (function () {
            var e = {};
            function t(t, a) {
              e[t] = (e[t] || []).filter(function (e) {
                return e !== a;
              });
            }
            return D({
              on: function (a, i) {
                return (
                  (e[a] = (e[a] || []).concat(i)),
                  function () {
                    return t(a, i);
                  }
                );
              },
              off: t,
              dispatch: function (t, a) {
                t in e &&
                  e[t].forEach(function (e) {
                    return e(a);
                  });
              },
            });
          })(),
          o = l.on,
          s = l.off,
          c = l.dispatch,
          d = $,
          u = I(),
          h = !1,
          f = function (e) {
            Array.isArray(e)
              ? e.forEach(function (e) {
                  return g(e);
                })
              : g(e);
          },
          b = function (e) {
            return (void 0 === e && (e = {}),
            Object.values(e).some(function (e) {
              return null == e;
            }))
              ? d
              : (d = D(L({}, $, d, e)));
          },
          m = function (e) {
            var t = L(
              {
                event: r,
                isStart: !1,
                isEnding: !1,
                isMomentumCancel: !1,
                isMomentum: u.isMomentum,
                axisDelta: [0, 0, 0],
                axisVelocity: u.axisVelocity,
                axisMovement: u.axisMovement,
                get axisMovementProjection() {
                  return _(
                    t.axisMovement,
                    t.axisVelocity.map(function (e) {
                      var t;
                      return (void 0 === t && (t = 0.996), (e * t) / (1 - t));
                    }),
                  );
                },
              },
              e,
            );
            (c("wheel", L({}, t, { previous: n })), (n = t));
          },
          p = function (e, t) {
            var a = d.preventWheelAction,
              i = t[0],
              r = t[1],
              n = t[2];
            if ("boolean" == typeof a) return a;
            switch (a) {
              case "x":
                return Math.abs(i) >= e;
              case "y":
                return Math.abs(r) >= e;
              case "z":
                return Math.abs(n) >= e;
              default:
                return !1;
            }
          },
          g = function (e) {
            var t,
              a,
              i,
              n,
              l =
                ((n = (function (e, t) {
                  if (!t) return e;
                  var a =
                    !0 === t
                      ? H
                      : t.map(function (e) {
                          return e ? -1 : 1;
                        });
                  return L({}, e, {
                    axisDelta: e.axisDelta.map(function (e, t) {
                      return e * a[t];
                    }),
                  });
                })(
                  ((t = e.deltaX * O[e.deltaMode]),
                  (a = e.deltaY * O[e.deltaMode]),
                  (i = (e.deltaZ || 0) * O[e.deltaMode]),
                  { timeStamp: e.timeStamp, axisDelta: [t, a, i] }),
                  d.reverseSign,
                )),
                L({}, n, {
                  axisDelta: n.axisDelta.map(function (e) {
                    return Math.min(Math.max(-700, e), 700);
                  }),
                })),
              o = l.axisDelta,
              s = l.timeStamp,
              c = T(o),
              f = "boolean" == typeof e.momentum ? e.momentum : void 0;
            if (
              (e.preventDefault && p(c, o) && e.preventDefault(),
              u.isStarted
                ? u.isMomentum &&
                  (!1 === f ||
                    (void 0 === f && c > Math.max(2, 2 * u.lastAbsDelta))) &&
                  (N(!0), k())
                : k(),
              void 0 === f && 0 === c && Object.is && Object.is(e.deltaX, -0))
            ) {
              h = !0;
              return;
            }
            ((r = e),
              void 0 !== f && ((u.isMomentum = f), (h = !1)),
              (u.axisMovement = _(u.axisMovement, o)),
              (u.lastAbsDelta = c),
              u.scrollPointsToMerge.push({ axisDelta: o, timeStamp: s }),
              v(),
              m({ axisDelta: o, isStart: !u.isStartPublished }),
              (u.isStartPublished = !0),
              E());
          },
          v = function () {
            if (2 === u.scrollPointsToMerge.length) {
              var e;
              (u.scrollPoints.unshift({
                axisDeltaSum: u.scrollPointsToMerge
                  .map(function (e) {
                    return e.axisDelta;
                  })
                  .reduce(_),
                timeStamp:
                  (e = u.scrollPointsToMerge.map(function (e) {
                    return e.timeStamp;
                  })).reduce(function (e, t) {
                    return e + t;
                  }) / e.length,
              }),
                y(),
                (u.scrollPointsToMerge.length = 0),
                (u.scrollPoints.length = 1),
                u.isMomentum || "boolean" == typeof r.momentum || A());
            } else u.isStartPublished || x();
          },
          x = function () {
            var e;
            u.axisVelocity = (e = u.scrollPointsToMerge)[
              e.length - 1
            ].axisDelta.map(function (e) {
              return e / u.willEndTimeout;
            });
          },
          y = function () {
            var e = u.scrollPoints,
              t = e[0],
              a = e[1];
            if (a && t) {
              var i = t.timeStamp - a.timeStamp;
              if (i <= 0) return;
              var r = t.axisDeltaSum.map(function (e) {
                  return e / i;
                }),
                n = r.map(function (e, t) {
                  return e / (u.axisVelocity[t] || 1);
                });
              ((u.axisVelocity = r), u.accelerationFactors.push(n), w(i));
            }
          },
          w = function (e) {
            var t = 10 * Math.ceil(e / 10) * 1.2;
            (u.isMomentum || (t = Math.max(100, 2 * t)),
              (u.willEndTimeout = Math.min(1e3, Math.round(t))));
          },
          M = function (e) {
            return 0 === e || (e <= 0.96 && e >= 0.6);
          },
          A = function () {
            if (u.accelerationFactors.length >= 5) {
              if (h && ((h = !1), T(u.axisVelocity) >= 0.2)) return void C();
              var e = u.accelerationFactors.slice(-5);
              (e.every(function (e) {
                var t = !!e.reduce(function (e, t) {
                    return e && e < 1 && e === t ? 1 : 0;
                  }),
                  a = e.filter(M).length === e.length;
                return t || a;
              }) && C(),
                (u.accelerationFactors = e));
            }
          },
          C = function () {
            u.isMomentum = !0;
          },
          k = function () {
            (((u = I()).isStarted = !0),
              (u.startTime = Date.now()),
              (n = void 0),
              (h = !1));
          },
          E = function () {
            (clearTimeout(t), (t = setTimeout(N, u.willEndTimeout)));
          },
          N = function (e) {
            (void 0 === e && (e = !1),
              u.isStarted &&
                (u.isMomentum && e
                  ? m({ isEnding: !0, isMomentumCancel: !0 })
                  : m({ isEnding: !0 }),
                (u.isMomentum = !1),
                (u.isStarted = !1)));
          },
          j =
            ((a = []),
            D({
              observe: function (e) {
                return (
                  e.addEventListener("wheel", f, { passive: !1 }),
                  a.push(e),
                  function () {
                    return i(e);
                  }
                );
              },
              unobserve: (i = function (e) {
                (e.removeEventListener("wheel", f),
                  (a = a.filter(function (t) {
                    return t !== e;
                  })));
              }),
              disconnect: function () {
                a.forEach(i);
              },
            })),
          F = j.observe,
          R = j.unobserve,
          S = j.disconnect;
        return (
          b(e),
          D({
            on: o,
            off: s,
            observe: F,
            unobserve: R,
            disconnect: S,
            feedWheel: f,
            updateOptions: b,
          })
        );
      };
      var z = {
        active: !0,
        breakpoints: {},
        wheelDraggingClass: "is-wheel-dragging",
        forceWheelAxis: void 0,
        target: void 0,
      };
      function G(e) {
        void 0 === e && (e = {});
        var t,
          a = function () {};
        return {
          name: "wheelGestures",
          options: e,
          init: function (i, r) {
            var n,
              l,
              o,
              s = r.mergeOptions,
              c = r.optionsAtMedia,
              d = s(z, G.globalOptions);
            t = c(s(d, e));
            var u = i.internalEngine(),
              h = null != (n = t.target) ? n : i.containerNode().parentNode,
              f = null != (l = t.forceWheelAxis) ? l : u.options.axis,
              b = B({ preventWheelAction: f, reverseSign: [!0, !0, !1] });
            function m() {
              y =
                ("x" === f ? u.containerRect.width : u.containerRect.height) /
                2;
            }
            var p = b.observe(h),
              g = b.on("wheel", function (e) {
                var i = e.axisDelta,
                  r = i[0],
                  n = i[1],
                  l = "x" === f ? r : n,
                  s = "x" === f ? n : r,
                  c = e.isMomentum && e.previous && !e.previous.isMomentum,
                  d = (e.isEnding && !e.isMomentum) || c;
                (!(Math.abs(l) > Math.abs(s)) ||
                  v ||
                  e.isMomentum ||
                  w ||
                  (function (e) {
                    try {
                      ((o = new MouseEvent("mousedown", e.event)), E(o));
                    } catch (e) {
                      return a();
                    }
                    ((v = !0),
                      (x = 0),
                      document.documentElement.addEventListener(
                        "mousemove",
                        C,
                        !0,
                      ),
                      document.documentElement.addEventListener(
                        "mouseup",
                        C,
                        !0,
                      ),
                      document.documentElement.addEventListener(
                        "mousedown",
                        C,
                        !0,
                      ),
                      t.wheelDraggingClass &&
                        h.classList.add(t.wheelDraggingClass));
                  })(e),
                  w && e.isEnding && (w = !1),
                  v &&
                    !(function (e) {
                      var t = N(e),
                        a = t.isAtBoundary,
                        i = t.primaryAxisDelta;
                      if (a && !e.isMomentum) {
                        if ((x += Math.abs(i)) > y) return ((w = !0), M(e), !0);
                      } else x = 0;
                      return !1;
                    })(e) &&
                    (d ? M(e) : E(k("mousemove", e))));
              }),
              v = !1,
              x = 0,
              y = 0,
              w = !1;
            function M(e) {
              ((v = !1),
                E(k("mouseup", e)),
                A(),
                t.wheelDraggingClass &&
                  h.classList.remove(t.wheelDraggingClass));
            }
            function A() {
              (document.documentElement.removeEventListener("mousemove", C, !0),
                document.documentElement.removeEventListener("mouseup", C, !0),
                document.documentElement.removeEventListener(
                  "mousedown",
                  C,
                  !0,
                ));
            }
            function C(e) {
              v && e.isTrusted && e.stopImmediatePropagation();
            }
            function k(e, t) {
              if (f === u.options.axis) {
                var a,
                  i,
                  r = t.axisMovement;
                ((a = r[0]), (i = r[1]));
              } else {
                var n = t.axisMovement;
                ((i = n[0]), (a = n[1]));
              }
              if (N(t).isAtBoundary) {
                var l = Math.min(x / y, 1),
                  s = x * (a > 0 ? -1 : 1) * (0.25 + 0.5 * l);
                ((a += s), (i += s));
              }
              if (!u.options.skipSnaps && !u.options.dragFree) {
                var c = u.containerRect.width,
                  d = u.containerRect.height;
                ((a = a < 0 ? Math.max(a, -c) : Math.min(a, c)),
                  (i = i < 0 ? Math.max(i, -d) : Math.min(i, d)));
              }
              return new MouseEvent(e, {
                clientX: o.clientX + a,
                clientY: o.clientY + i,
                screenX: o.screenX + a,
                screenY: o.screenY + i,
                movementX: a,
                movementY: i,
                button: 0,
                bubbles: !0,
                cancelable: !0,
                composed: !0,
              });
            }
            function E(e) {
              i.containerNode().dispatchEvent(e);
            }
            function N(e) {
              var t = e.axisDelta,
                a = t[0],
                r = t[1],
                n = i.scrollProgress(),
                l = "x" === f ? a : r;
              return {
                isAtBoundary: (l < 0 && !(n < 1)) || (l > 0 && !(n > 0)),
                primaryAxisDelta: l,
              };
            }
            (m(),
              i.on("resize", m),
              (a = function () {
                (p(), g(), i.off("resize", m), A());
              }));
          },
          destroy: function () {
            return a();
          },
        };
      }
      G.globalOptions = void 0;
      var q = e.i(103697);
      function V(e) {
        return (
          "[object Object]" === Object.prototype.toString.call(e) ||
          Array.isArray(e)
        );
      }
      function W(e, t) {
        let a = Object.keys(e),
          i = Object.keys(t);
        return (
          a.length === i.length &&
          JSON.stringify(Object.keys(e.breakpoints || {})) ===
            JSON.stringify(Object.keys(t.breakpoints || {})) &&
          a.every((a) => {
            let i = e[a],
              r = t[a];
            return "function" == typeof i
              ? `${i}` == `${r}`
              : V(i) && V(r)
                ? W(i, r)
                : i === r;
          })
        );
      }
      function Y(e) {
        return e
          .concat()
          .sort((e, t) => (e.name > t.name ? 1 : -1))
          .map((e) => e.options);
      }
      function X(e) {
        return "number" == typeof e;
      }
      function U(e) {
        return "string" == typeof e;
      }
      function K(e) {
        return "boolean" == typeof e;
      }
      function Q(e) {
        return "[object Object]" === Object.prototype.toString.call(e);
      }
      function J(e) {
        return Math.abs(e);
      }
      function Z(e) {
        return Math.sign(e);
      }
      function ee(e) {
        return er(e).map(Number);
      }
      function et(e) {
        return e[ea(e)];
      }
      function ea(e) {
        return Math.max(0, e.length - 1);
      }
      function ei(e, t = 0) {
        return Array.from(Array(e), (e, a) => t + a);
      }
      function er(e) {
        return Object.keys(e);
      }
      function en(e, t) {
        return void 0 !== t.MouseEvent && e instanceof t.MouseEvent;
      }
      function el() {
        let e = [],
          t = {
            add: function (a, i, r, n = { passive: !0 }) {
              let l;
              return (
                "addEventListener" in a
                  ? (a.addEventListener(i, r, n),
                    (l = () => a.removeEventListener(i, r, n)))
                  : (a.addListener(r), (l = () => a.removeListener(r))),
                e.push(l),
                t
              );
            },
            clear: function () {
              e = e.filter((e) => e());
            },
          };
        return t;
      }
      function eo(e = 0, t = 0) {
        let a = J(e - t);
        function i(a) {
          return a < e || a > t;
        }
        return {
          length: a,
          max: t,
          min: e,
          constrain: function (a) {
            return i(a) ? (a < e ? e : t) : a;
          },
          reachedAny: i,
          reachedMax: function (e) {
            return e > t;
          },
          reachedMin: function (t) {
            return t < e;
          },
          removeOffset: function (e) {
            return a ? e - a * Math.ceil((e - t) / a) : e;
          },
        };
      }
      function es(e) {
        let t = e;
        function a(e) {
          return X(e) ? e : e.get();
        }
        return {
          get: function () {
            return t;
          },
          set: function (e) {
            t = a(e);
          },
          add: function (e) {
            t += a(e);
          },
          subtract: function (e) {
            t -= a(e);
          },
        };
      }
      function ec(e, t) {
        let a =
            "x" === e.scroll
              ? function (e) {
                  return `translate3d(${e}px,0px,0px)`;
                }
              : function (e) {
                  return `translate3d(0px,${e}px,0px)`;
                },
          i = t.style,
          r = null,
          n = !1;
        return {
          clear: function () {
            !n &&
              ((i.transform = ""),
              t.getAttribute("style") || t.removeAttribute("style"));
          },
          to: function (t) {
            if (n) return;
            let l = Math.round(100 * e.direction(t)) / 100;
            l !== r && ((i.transform = a(l)), (r = l));
          },
          toggleActive: function (e) {
            n = !e;
          },
        };
      }
      let ed = {
        align: "center",
        axis: "x",
        container: null,
        slides: null,
        containScroll: "trimSnaps",
        direction: "ltr",
        slidesToScroll: 1,
        inViewThreshold: 0,
        breakpoints: {},
        dragFree: !1,
        dragThreshold: 10,
        loop: !1,
        skipSnaps: !1,
        duration: 25,
        startIndex: 0,
        active: !0,
        watchDrag: !0,
        watchResize: !0,
        watchSlides: !0,
        watchFocus: !0,
      };
      function eu(e, t, a) {
        let i,
          r,
          n,
          l,
          o,
          s,
          c,
          d,
          u = e.ownerDocument,
          h = u.defaultView,
          f = (function (e) {
            function t(e, t) {
              return (function e(t, a) {
                return [t, a].reduce(
                  (t, a) => (
                    er(a).forEach((i) => {
                      let r = t[i],
                        n = a[i],
                        l = Q(r) && Q(n);
                      t[i] = l ? e(r, n) : n;
                    }),
                    t
                  ),
                  {},
                );
              })(e, t || {});
            }
            return {
              mergeOptions: t,
              optionsAtMedia: function (a) {
                let i = a.breakpoints || {},
                  r = er(i)
                    .filter((t) => e.matchMedia(t).matches)
                    .map((e) => i[e])
                    .reduce((e, a) => t(e, a), {});
                return t(a, r);
              },
              optionsMediaQueries: function (t) {
                return t
                  .map((e) => er(e.breakpoints || {}))
                  .reduce((e, t) => e.concat(t), [])
                  .map(e.matchMedia);
              },
            };
          })(h),
          b =
            ((d = []),
            {
              init: function (e, t) {
                return (
                  (d = t.filter(
                    ({ options: e }) => !1 !== f.optionsAtMedia(e).active,
                  )).forEach((t) => t.init(e, f)),
                  t.reduce((e, t) => Object.assign(e, { [t.name]: t }), {})
                );
              },
              destroy: function () {
                d = d.filter((e) => e.destroy());
              },
            }),
          m = el(),
          p =
            ((r = {}),
            (n = {
              init: function (e) {
                i = e;
              },
              emit: function (e) {
                return ((r[e] || []).forEach((t) => t(i, e)), n);
              },
              off: function (e, t) {
                return ((r[e] = (r[e] || []).filter((e) => e !== t)), n);
              },
              on: function (e, t) {
                return ((r[e] = (r[e] || []).concat([t])), n);
              },
              clear: function () {
                r = {};
              },
            })),
          { mergeOptions: g, optionsAtMedia: v, optionsMediaQueries: x } = f,
          { on: y, off: w, emit: M } = p,
          A = !1,
          C = g(ed, eu.globalOptions),
          k = g(C),
          E = [];
        function N(t, a) {
          A ||
            ((k = v((C = g(C, t)))),
            (E = a || E),
            (function () {
              let { container: t, slides: a } = k;
              s = (U(t) ? e.querySelector(t) : t) || e.children[0];
              let i = U(a) ? s.querySelectorAll(a) : a;
              c = [].slice.call(i || s.children);
            })(),
            (l = (function t(a) {
              let i = (function (e, t, a, i, r, n, l) {
                var o, s;
                let c,
                  d,
                  u,
                  h,
                  f,
                  b,
                  m,
                  p,
                  g,
                  v,
                  x,
                  y,
                  w,
                  M,
                  {
                    align: A,
                    axis: C,
                    direction: k,
                    startIndex: E,
                    loop: N,
                    duration: j,
                    dragFree: F,
                    dragThreshold: R,
                    inViewThreshold: S,
                    slidesToScroll: P,
                    skipSnaps: L,
                    containScroll: _,
                    watchResize: T,
                    watchSlides: D,
                    watchDrag: O,
                    watchFocus: H,
                  } = n,
                  $ = {
                    measure: function (e) {
                      let {
                        offsetTop: t,
                        offsetLeft: a,
                        offsetWidth: i,
                        offsetHeight: r,
                      } = e;
                      return {
                        top: t,
                        right: a + i,
                        bottom: t + r,
                        left: a,
                        width: i,
                        height: r,
                      };
                    },
                  },
                  I = $.measure(t),
                  B = a.map($.measure),
                  z =
                    ((d = "rtl" === k),
                    (h = (u = "y" === C) || !d ? 1 : -1),
                    (f = u ? "top" : d ? "right" : "left"),
                    (b = u ? "bottom" : d ? "left" : "right"),
                    {
                      scroll: u ? "y" : "x",
                      cross: u ? "x" : "y",
                      startEdge: f,
                      endEdge: b,
                      measureSize: function (e) {
                        let { height: t, width: a } = e;
                        return u ? t : a;
                      },
                      direction: function (e) {
                        return e * h;
                      },
                    }),
                  G = z.measureSize(I),
                  q = {
                    measure: function (e) {
                      return (e / 100) * G;
                    },
                  },
                  V =
                    ((o = A),
                    (s = G),
                    (c = {
                      start: function () {
                        return 0;
                      },
                      center: function (e) {
                        return (s - e) / 2;
                      },
                      end: function (e) {
                        return s - e;
                      },
                    }),
                    {
                      measure: function (e, t) {
                        return U(o) ? c[o](e) : o(s, e, t);
                      },
                    }),
                  W = !N && !!_,
                  {
                    slideSizes: Y,
                    slideSizesWithGaps: Q,
                    startGap: ed,
                    endGap: eu,
                  } = (function (e, t, a, i, r, n) {
                    let { measureSize: l, startEdge: o, endEdge: s } = e,
                      c = a[0] && r,
                      d = (function () {
                        if (!c) return 0;
                        let e = a[0];
                        return J(t[o] - e[o]);
                      })(),
                      u = c
                        ? parseFloat(
                            n
                              .getComputedStyle(et(i))
                              .getPropertyValue(`margin-${s}`),
                          )
                        : 0,
                      h = a.map(l),
                      f = a
                        .map((e, t, a) => {
                          let i = t === ea(a);
                          return t
                            ? i
                              ? h[t] + u
                              : a[t + 1][o] - e[o]
                            : h[t] + d;
                        })
                        .map(J);
                    return {
                      slideSizes: h,
                      slideSizesWithGaps: f,
                      startGap: d,
                      endGap: u,
                    };
                  })(z, I, B, a, N || !!_, r),
                  eh = (function (e, t, a, i, r, n, l, o) {
                    let { startEdge: s, endEdge: c, direction: d } = e,
                      u = X(a);
                    return {
                      groupSlides: function (e) {
                        return u
                          ? ee(e)
                              .filter((e) => e % a == 0)
                              .map((t) => e.slice(t, t + a))
                          : e.length
                            ? ee(e)
                                .reduce((a, u, h) => {
                                  let f = et(a) || 0,
                                    b = u === ea(e),
                                    m = r[s] - n[f][s],
                                    p = r[s] - n[u][c],
                                    g = i || 0 !== f ? 0 : d(l),
                                    v = J(p - (!i && b ? d(o) : 0) - (m + g));
                                  return (
                                    h && v > t + 2 && a.push(u),
                                    b && a.push(e.length),
                                    a
                                  );
                                }, [])
                                .map((t, a, i) => {
                                  let r = Math.max(i[a - 1] || 0);
                                  return e.slice(r, t);
                                })
                            : [];
                      },
                    };
                  })(z, G, P, N, I, B, ed, eu),
                  { snaps: ef, snapsAligned: eb } = (function (e, t, a, i, r) {
                    let { startEdge: n, endEdge: l } = e,
                      { groupSlides: o } = r,
                      s = o(i)
                        .map((e) => et(e)[l] - e[0][n])
                        .map(J)
                        .map(t.measure),
                      c = i.map((e) => a[n] - e[n]).map((e) => -J(e)),
                      d = o(c)
                        .map((e) => e[0])
                        .map((e, t) => e + s[t]);
                    return { snaps: c, snapsAligned: d };
                  })(z, V, I, B, eh),
                  em = -et(ef) + et(Q),
                  { snapsContained: ep, scrollContainLimit: eg } = (function (
                    e,
                    t,
                    a,
                    i,
                  ) {
                    let r,
                      n,
                      l = eo(-t + e, 0),
                      o = a
                        .map((e, t) => {
                          let { min: i, max: r } = l,
                            n = l.constrain(e),
                            o = t === ea(a);
                          return t
                            ? o ||
                              (function (e, t) {
                                return 1 >= J(e - t);
                              })(i, n)
                              ? i
                              : (function (e, t) {
                                    return 1 >= J(e - t);
                                  })(r, n)
                                ? r
                                : n
                            : r;
                        })
                        .map((e) => parseFloat(e.toFixed(3))),
                      s =
                        ((r = o[0]),
                        (n = et(o)),
                        eo(o.lastIndexOf(r), o.indexOf(n) + 1));
                    return {
                      snapsContained: (function () {
                        if (t <= e + 2) return [l.max];
                        if ("keepSnaps" === i) return o;
                        let { min: a, max: r } = s;
                        return o.slice(a, r);
                      })(),
                      scrollContainLimit: s,
                    };
                  })(G, em, eb, _),
                  ev = W ? ep : eb,
                  { limit: ex } =
                    ((m = ev[0]), { limit: eo(N ? m - em : et(ev), m) }),
                  ey = (function e(t, a, i) {
                    let { constrain: r } = eo(0, t),
                      n = t + 1,
                      l = o(a);
                    function o(e) {
                      return i ? J((n + e) % n) : r(e);
                    }
                    function s() {
                      return e(t, l, i);
                    }
                    let c = {
                      get: function () {
                        return l;
                      },
                      set: function (e) {
                        return ((l = o(e)), c);
                      },
                      add: function (e) {
                        return s().set(l + e);
                      },
                      clone: s,
                    };
                    return c;
                  })(ea(ev), E, N),
                  ew = ey.clone(),
                  eM = ee(a),
                  eA = (function (e, t, a, i) {
                    let r = el(),
                      n = 1e3 / 60,
                      l = null,
                      o = 0,
                      s = 0;
                    function c(e) {
                      if (!s) return;
                      l || ((l = e), a(), a());
                      let r = e - l;
                      for (l = e, o += r; o >= n;) (a(), (o -= n));
                      (i(o / n), s && (s = t.requestAnimationFrame(c)));
                    }
                    function d() {
                      (t.cancelAnimationFrame(s), (l = null), (o = 0), (s = 0));
                    }
                    return {
                      init: function () {
                        r.add(e, "visibilitychange", () => {
                          e.hidden && ((l = null), (o = 0));
                        });
                      },
                      destroy: function () {
                        (d(), r.clear());
                      },
                      start: function () {
                        s || (s = t.requestAnimationFrame(c));
                      },
                      stop: d,
                      update: a,
                      render: i,
                    };
                  })(
                    i,
                    r,
                    () =>
                      (({
                        dragHandler: e,
                        scrollBody: t,
                        scrollBounds: a,
                        options: { loop: i },
                      }) => {
                        (i || a.constrain(e.pointerDown()), t.seek());
                      })(eO),
                    (e) =>
                      ((
                        {
                          scrollBody: e,
                          translate: t,
                          location: a,
                          offsetLocation: i,
                          previousLocation: r,
                          scrollLooper: n,
                          slideLooper: l,
                          dragHandler: o,
                          animation: s,
                          eventHandler: c,
                          scrollBounds: d,
                          options: { loop: u },
                        },
                        h,
                      ) => {
                        let f = e.settled(),
                          b = !d.shouldConstrain(),
                          m = u ? f : f && b,
                          p = m && !o.pointerDown();
                        p && s.stop();
                        let g = a.get() * h + r.get() * (1 - h);
                        (i.set(g),
                          u && (n.loop(e.direction()), l.loop()),
                          t.to(i.get()),
                          p && c.emit("settle"),
                          m || c.emit("scroll"));
                      })(eO, e),
                  ),
                  eC = ev[ey.get()],
                  ek = es(eC),
                  eE = es(eC),
                  eN = es(eC),
                  ej = es(eC),
                  eF = (function (e, t, a, i, r) {
                    let n = 0,
                      l = 0,
                      o = r,
                      s = 0.68,
                      c = e.get(),
                      d = 0;
                    function u(e) {
                      return ((o = e), f);
                    }
                    function h(e) {
                      return ((s = e), f);
                    }
                    let f = {
                      direction: function () {
                        return l;
                      },
                      duration: function () {
                        return o;
                      },
                      velocity: function () {
                        return n;
                      },
                      seek: function () {
                        let t = i.get() - e.get(),
                          r = 0;
                        return (
                          o
                            ? (a.set(e),
                              (n += t / o),
                              (n *= s),
                              (c += n),
                              e.add(n),
                              (r = c - d))
                            : ((n = 0), a.set(i), e.set(i), (r = t)),
                          (l = Z(r)),
                          (d = c),
                          f
                        );
                      },
                      settled: function () {
                        return 0.001 > J(i.get() - t.get());
                      },
                      useBaseFriction: function () {
                        return h(0.68);
                      },
                      useBaseDuration: function () {
                        return u(r);
                      },
                      useFriction: h,
                      useDuration: u,
                    };
                    return f;
                  })(ek, eN, eE, ej, j),
                  eR = (function (e, t, a, i, r) {
                    let { reachedAny: n, removeOffset: l, constrain: o } = i;
                    function s(e) {
                      return e.concat().sort((e, t) => J(e) - J(t))[0];
                    }
                    function c(t, i) {
                      let r = [t, t + a, t - a];
                      if (!e) return t;
                      if (!i) return s(r);
                      let n = r.filter((e) => Z(e) === i);
                      return n.length ? s(n) : et(r) - a;
                    }
                    return {
                      byDistance: function (a, i) {
                        let s = r.get() + a,
                          { index: d, distance: u } = (function (a) {
                            let i = e ? l(a) : o(a),
                              { index: r } = t
                                .map((e, t) => ({
                                  diff: c(e - i, 0),
                                  index: t,
                                }))
                                .sort((e, t) => J(e.diff) - J(t.diff))[0];
                            return { index: r, distance: i };
                          })(s),
                          h = !e && n(s);
                        if (!i || h) return { index: d, distance: a };
                        let f = a + c(t[d] - u, 0);
                        return { index: d, distance: f };
                      },
                      byIndex: function (e, a) {
                        let i = c(t[e] - r.get(), a);
                        return { index: e, distance: i };
                      },
                      shortcut: c,
                    };
                  })(N, ev, em, ex, ej),
                  eS = (function (e, t, a, i, r, n, l) {
                    function o(r) {
                      let o = r.distance,
                        s = r.index !== t.get();
                      (n.add(o),
                        o &&
                          (i.duration()
                            ? e.start()
                            : (e.update(), e.render(1), e.update())),
                        s &&
                          (a.set(t.get()), t.set(r.index), l.emit("select")));
                    }
                    return {
                      distance: function (e, t) {
                        o(r.byDistance(e, t));
                      },
                      index: function (e, a) {
                        let i = t.clone().set(e);
                        o(r.byIndex(i.get(), a));
                      },
                    };
                  })(eA, ey, ew, eF, eR, ej, l),
                  eP = (function (e) {
                    let { max: t, length: a } = e;
                    return {
                      get: function (e) {
                        return a ? -((e - t) / a) : 0;
                      },
                    };
                  })(ex),
                  eL = el(),
                  e_ =
                    ((g = {}),
                    (v = null),
                    (x = null),
                    (y = !1),
                    {
                      init: function () {
                        ((p = new IntersectionObserver(
                          (e) => {
                            y ||
                              (e.forEach((e) => {
                                g[a.indexOf(e.target)] = e;
                              }),
                              (v = null),
                              (x = null),
                              l.emit("slidesInView"));
                          },
                          { root: t.parentElement, threshold: S },
                        )),
                          a.forEach((e) => p.observe(e)));
                      },
                      destroy: function () {
                        (p && p.disconnect(), (y = !0));
                      },
                      get: function (e = !0) {
                        if (e && v) return v;
                        if (!e && x) return x;
                        let t = er(g).reduce((t, a) => {
                          let i = parseInt(a),
                            { isIntersecting: r } = g[i];
                          return (((e && r) || (!e && !r)) && t.push(i), t);
                        }, []);
                        return (e && (v = t), e || (x = t), t);
                      },
                    }),
                  { slideRegistry: eT } = (function (e, t, a, i, r, n) {
                    let l,
                      { groupSlides: o } = r,
                      { min: s, max: c } = i;
                    return {
                      slideRegistry:
                        ((l = o(n)),
                        1 === a.length
                          ? [n]
                          : e && "keepSnaps" !== t
                            ? l.slice(s, c).map((e, t, a) => {
                                let i = t === ea(a);
                                return t
                                  ? i
                                    ? ei(ea(n) - et(a)[0] + 1, et(a)[0])
                                    : e
                                  : ei(et(a[0]) + 1);
                              })
                            : l),
                    };
                  })(W, _, ev, eg, eh, eM),
                  eD = (function (e, t, a, i, r, n, l, o) {
                    let s = { passive: !0, capture: !0 },
                      c = 0;
                    function d(e) {
                      "Tab" === e.code && (c = new Date().getTime());
                    }
                    return {
                      init: function (u) {
                        o &&
                          (n.add(document, "keydown", d, !1),
                          t.forEach((t, d) => {
                            n.add(
                              t,
                              "focus",
                              (t) => {
                                (K(o) || o(u, t)) &&
                                  (function (t) {
                                    if (new Date().getTime() - c > 10) return;
                                    (l.emit("slideFocusStart"),
                                      (e.scrollLeft = 0));
                                    let n = a.findIndex((e) => e.includes(t));
                                    X(n) &&
                                      (r.useDuration(0),
                                      i.index(n, 0),
                                      l.emit("slideFocus"));
                                  })(d);
                              },
                              s,
                            );
                          }));
                      },
                    };
                  })(e, a, eT, eS, eF, eL, l, H),
                  eO = {
                    ownerDocument: i,
                    ownerWindow: r,
                    eventHandler: l,
                    containerRect: I,
                    slideRects: B,
                    animation: eA,
                    axis: z,
                    dragHandler: (function (
                      e,
                      t,
                      a,
                      i,
                      r,
                      n,
                      l,
                      o,
                      s,
                      c,
                      d,
                      u,
                      h,
                      f,
                      b,
                      m,
                      p,
                      g,
                    ) {
                      let { cross: v, direction: x } = e,
                        y = ["INPUT", "SELECT", "TEXTAREA"],
                        w = { passive: !1 },
                        M = el(),
                        A = el(),
                        C = eo(50, 225).constrain(f.measure(20)),
                        k = { mouse: 300, touch: 400 },
                        E = { mouse: 500, touch: 600 },
                        N = b ? 43 : 25,
                        j = !1,
                        F = 0,
                        R = 0,
                        S = !1,
                        P = !1,
                        L = !1,
                        _ = !1;
                      function T(e) {
                        if (!en(e, i) && e.touches.length >= 2) return D(e);
                        let t = n.readPoint(e),
                          a = n.readPoint(e, v),
                          l = J(t - F),
                          s = J(a - R);
                        if (!P && !_ && (!e.cancelable || !(P = l > s)))
                          return D(e);
                        let d = n.pointerMove(e);
                        (l > m && (L = !0),
                          c.useFriction(0.3).useDuration(0.75),
                          o.start(),
                          r.add(x(d)),
                          e.preventDefault());
                      }
                      function D(e) {
                        var t;
                        let a,
                          i,
                          r = d.byDistance(0, !1).index !== u.get(),
                          l =
                            n.pointerUp(e) * (b ? E : k)[_ ? "mouse" : "touch"],
                          o =
                            ((t = x(l)),
                            (a = u.add(-1 * Z(t))),
                            (i = d.byDistance(t, !b).distance),
                            b || J(t) < C
                              ? i
                              : p && r
                                ? 0.5 * i
                                : d.byIndex(a.get(), 0).distance),
                          f = (function (e, t) {
                            var a, i;
                            if (0 === e || 0 === t || J(e) <= J(t)) return 0;
                            let r = ((a = J(e)), (i = J(t)), J(a - i));
                            return J(r / e);
                          })(l, o);
                        ((P = !1),
                          (S = !1),
                          A.clear(),
                          c.useDuration(N - 10 * f).useFriction(0.68 + f / 50),
                          s.distance(o, !b),
                          (_ = !1),
                          h.emit("pointerUp"));
                      }
                      function O(e) {
                        L &&
                          (e.stopPropagation(), e.preventDefault(), (L = !1));
                      }
                      return {
                        init: function (e) {
                          g &&
                            M.add(t, "dragstart", (e) => e.preventDefault(), w)
                              .add(t, "touchmove", () => void 0, w)
                              .add(t, "touchend", () => void 0)
                              .add(t, "touchstart", o)
                              .add(t, "mousedown", o)
                              .add(t, "touchcancel", D)
                              .add(t, "contextmenu", D)
                              .add(t, "click", O, !0);
                          function o(o) {
                            (K(g) || g(e, o)) &&
                              (function (e) {
                                let o,
                                  s = en(e, i);
                                if (
                                  ((_ = s),
                                  (L = b && s && !e.buttons && j),
                                  (j = J(r.get() - l.get()) >= 2),
                                  !s || 0 === e.button) &&
                                  ((o = e.target.nodeName || ""),
                                  !y.includes(o))
                                ) {
                                  let i;
                                  ((S = !0),
                                    n.pointerDown(e),
                                    c.useFriction(0).useDuration(0),
                                    r.set(l),
                                    (i = _ ? a : t),
                                    A.add(i, "touchmove", T, w)
                                      .add(i, "touchend", D)
                                      .add(i, "mousemove", T, w)
                                      .add(i, "mouseup", D),
                                    (F = n.readPoint(e)),
                                    (R = n.readPoint(e, v)),
                                    h.emit("pointerDown"));
                                }
                              })(o);
                          }
                        },
                        destroy: function () {
                          (M.clear(), A.clear());
                        },
                        pointerDown: function () {
                          return S;
                        },
                      };
                    })(
                      z,
                      e,
                      i,
                      r,
                      ej,
                      (function (e, t) {
                        let a, i;
                        function r(e) {
                          return e.timeStamp;
                        }
                        function n(a, i) {
                          let r = i || e.scroll,
                            n = `client${"x" === r ? "X" : "Y"}`;
                          return (en(a, t) ? a : a.touches[0])[n];
                        }
                        return {
                          pointerDown: function (e) {
                            return ((a = e), (i = e), n(e));
                          },
                          pointerMove: function (e) {
                            let t = n(e) - n(i),
                              l = r(e) - r(a) > 170;
                            return ((i = e), l && (a = e), t);
                          },
                          pointerUp: function (e) {
                            if (!a || !i) return 0;
                            let t = n(i) - n(a),
                              l = r(e) - r(a),
                              o = r(e) - r(i) > 170,
                              s = t / l;
                            return l && !o && J(s) > 0.1 ? s : 0;
                          },
                          readPoint: n,
                        };
                      })(z, r),
                      ek,
                      eA,
                      eS,
                      eF,
                      eR,
                      ey,
                      l,
                      q,
                      F,
                      R,
                      L,
                      O,
                    ),
                    eventStore: eL,
                    percentOfView: q,
                    index: ey,
                    indexPrevious: ew,
                    limit: ex,
                    location: ek,
                    offsetLocation: eN,
                    previousLocation: eE,
                    options: n,
                    resizeHandler: (function (e, t, a, i, r, n, l) {
                      let o,
                        s,
                        c = [e].concat(i),
                        d = [],
                        u = !1;
                      function h(e) {
                        return r.measureSize(l.measure(e));
                      }
                      return {
                        init: function (r) {
                          n &&
                            ((s = h(e)),
                            (d = i.map(h)),
                            (o = new ResizeObserver((a) => {
                              (K(n) || n(r, a)) &&
                                (function (a) {
                                  for (let n of a) {
                                    if (u) return;
                                    let a = n.target === e,
                                      l = i.indexOf(n.target),
                                      o = a ? s : d[l];
                                    if (J(h(a ? e : i[l]) - o) >= 0.5) {
                                      (r.reInit(), t.emit("resize"));
                                      break;
                                    }
                                  }
                                })(a);
                            })),
                            a.requestAnimationFrame(() => {
                              c.forEach((e) => o.observe(e));
                            }));
                        },
                        destroy: function () {
                          ((u = !0), o && o.disconnect());
                        },
                      };
                    })(t, l, r, a, z, T, $),
                    scrollBody: eF,
                    scrollBounds: (function (e, t, a, i, r) {
                      let n = r.measure(10),
                        l = r.measure(50),
                        o = eo(0.1, 0.99),
                        s = !1;
                      function c() {
                        return (
                          !s &&
                          !!e.reachedAny(a.get()) &&
                          !!e.reachedAny(t.get())
                        );
                      }
                      return {
                        shouldConstrain: c,
                        constrain: function (r) {
                          if (!c()) return;
                          let s = e.reachedMin(t.get()) ? "min" : "max",
                            d = J(e[s] - t.get()),
                            u = a.get() - t.get(),
                            h = o.constrain(d / l);
                          (a.subtract(u * h),
                            !r &&
                              J(u) < n &&
                              (a.set(e.constrain(a.get())),
                              i.useDuration(25).useBaseFriction()));
                        },
                        toggleActive: function (e) {
                          s = !e;
                        },
                      };
                    })(ex, eN, ej, eF, q),
                    scrollLooper: (function (e, t, a, i) {
                      let { reachedMin: r, reachedMax: n } = eo(
                        t.min + 0.1,
                        t.max + 0.1,
                      );
                      return {
                        loop: function (t) {
                          if (!(1 === t ? n(a.get()) : -1 === t && r(a.get())))
                            return;
                          let l = -1 * t * e;
                          i.forEach((e) => e.add(l));
                        },
                      };
                    })(em, ex, eN, [ek, eN, eE, ej]),
                    scrollProgress: eP,
                    scrollSnapList: ev.map(eP.get),
                    scrollSnaps: ev,
                    scrollTarget: eR,
                    scrollTo: eS,
                    slideLooper: (function (e, t, a, i, r, n, l, o, s) {
                      let c = ee(r),
                        d = ee(r).reverse(),
                        u = b(f(d, l[0]), a, !1).concat(
                          b(f(c, t - l[0] - 1), -a, !0),
                        );
                      function h(e, t) {
                        return e.reduce((e, t) => e - r[t], t);
                      }
                      function f(e, t) {
                        return e.reduce(
                          (e, a) => (h(e, t) > 0 ? e.concat([a]) : e),
                          [],
                        );
                      }
                      function b(r, l, c) {
                        let d = n.map((e, a) => ({
                          start: e - i[a] + 0.5 + l,
                          end: e + t - 0.5 + l,
                        }));
                        return r.map((t) => {
                          let i = c ? 0 : -a,
                            r = c ? a : 0,
                            n = d[t][c ? "end" : "start"];
                          return {
                            index: t,
                            loopPoint: n,
                            slideLocation: es(-1),
                            translate: ec(e, s[t]),
                            target: () => (o.get() > n ? i : r),
                          };
                        });
                      }
                      return {
                        canLoop: function () {
                          return u.every(
                            ({ index: e }) =>
                              0.1 >=
                              h(
                                c.filter((t) => t !== e),
                                t,
                              ),
                          );
                        },
                        clear: function () {
                          u.forEach((e) => e.translate.clear());
                        },
                        loop: function () {
                          u.forEach((e) => {
                            let {
                                target: t,
                                translate: a,
                                slideLocation: i,
                              } = e,
                              r = t();
                            r !== i.get() && (a.to(r), i.set(r));
                          });
                        },
                        loopPoints: u,
                      };
                    })(z, G, em, Y, Q, ef, ev, eN, a),
                    slideFocus: eD,
                    slidesHandler:
                      ((M = !1),
                      {
                        init: function (e) {
                          D &&
                            (w = new MutationObserver((t) => {
                              !M &&
                                (K(D) || D(e, t)) &&
                                (function (t) {
                                  for (let a of t)
                                    if ("childList" === a.type) {
                                      (e.reInit(), l.emit("slidesChanged"));
                                      break;
                                    }
                                })(t);
                            })).observe(t, { childList: !0 });
                        },
                        destroy: function () {
                          (w && w.disconnect(), (M = !0));
                        },
                      }),
                    slidesInView: e_,
                    slideIndexes: eM,
                    slideRegistry: eT,
                    slidesToScroll: eh,
                    target: ej,
                    translate: ec(z, t),
                  };
                return eO;
              })(e, s, c, u, h, a, p);
              return a.loop && !i.slideLooper.canLoop()
                ? t(Object.assign({}, a, { loop: !1 }))
                : i;
            })(k)),
            x([C, ...E.map(({ options: e }) => e)]).forEach((e) =>
              m.add(e, "change", j),
            ),
            k.active &&
              (l.translate.to(l.location.get()),
              l.animation.init(),
              l.slidesInView.init(),
              l.slideFocus.init(P),
              l.eventHandler.init(P),
              l.resizeHandler.init(P),
              l.slidesHandler.init(P),
              l.options.loop && l.slideLooper.loop(),
              s.offsetParent && c.length && l.dragHandler.init(P),
              (o = b.init(P, E))));
        }
        function j(e, t) {
          let a = S();
          (F(), N(g({ startIndex: a }, e), t), p.emit("reInit"));
        }
        function F() {
          (l.dragHandler.destroy(),
            l.eventStore.clear(),
            l.translate.clear(),
            l.slideLooper.clear(),
            l.resizeHandler.destroy(),
            l.slidesHandler.destroy(),
            l.slidesInView.destroy(),
            l.animation.destroy(),
            b.destroy(),
            m.clear());
        }
        function R(e, t, a) {
          k.active &&
            !A &&
            (l.scrollBody
              .useBaseFriction()
              .useDuration(!0 === t ? 0 : k.duration),
            l.scrollTo.index(e, a || 0));
        }
        function S() {
          return l.index.get();
        }
        let P = {
          canScrollNext: function () {
            return l.index.add(1).get() !== S();
          },
          canScrollPrev: function () {
            return l.index.add(-1).get() !== S();
          },
          containerNode: function () {
            return s;
          },
          internalEngine: function () {
            return l;
          },
          destroy: function () {
            A || ((A = !0), m.clear(), F(), p.emit("destroy"), p.clear());
          },
          off: w,
          on: y,
          emit: M,
          plugins: function () {
            return o;
          },
          previousScrollSnap: function () {
            return l.indexPrevious.get();
          },
          reInit: j,
          rootNode: function () {
            return e;
          },
          scrollNext: function (e) {
            R(l.index.add(1).get(), e, -1);
          },
          scrollPrev: function (e) {
            R(l.index.add(-1).get(), e, 1);
          },
          scrollProgress: function () {
            return l.scrollProgress.get(l.offsetLocation.get());
          },
          scrollSnapList: function () {
            return l.scrollSnapList;
          },
          scrollTo: R,
          selectedScrollSnap: S,
          slideNodes: function () {
            return c;
          },
          slidesInView: function () {
            return l.slidesInView.get();
          },
          slidesNotInView: function () {
            return l.slidesInView.get(!1);
          },
        };
        return (N(t, a), setTimeout(() => p.emit("init"), 0), P);
      }
      function eh(e = {}, t = []) {
        let a = (0, i.useRef)(e),
          r = (0, i.useRef)(t),
          [n, l] = (0, i.useState)(),
          [o, s] = (0, i.useState)(),
          c = (0, i.useCallback)(() => {
            n && n.reInit(a.current, r.current);
          }, [n]);
        return (
          (0, i.useEffect)(() => {
            W(a.current, e) || ((a.current = e), c());
          }, [e, c]),
          (0, i.useEffect)(() => {
            !(function (e, t) {
              if (e.length !== t.length) return !1;
              let a = Y(e),
                i = Y(t);
              return a.every((e, t) => W(e, i[t]));
            })(r.current, t) && ((r.current = t), c());
          }, [t, c]),
          (0, i.useEffect)(() => {
            if (
              "u" > typeof window &&
              window.document &&
              window.document.createElement &&
              o
            ) {
              eu.globalOptions = eh.globalOptions;
              let e = eu(o, a.current, r.current);
              return (l(e), () => e.destroy());
            }
            l(void 0);
          }, [o, l]),
          [s, n]
        );
      }
      ((eu.globalOptions = void 0), (eh.globalOptions = void 0));
      var ef = e.i(519455),
        eb = e.i(540079),
        em = e.i(746336);
      let ep = i.createContext(null);
      function eg() {
        let e = i.useContext(ep);
        if (!e) throw Error("useCarousel must be used within a <Carousel />");
        return e;
      }
      function ev({
        orientation: e = "horizontal",
        opts: a,
        setApi: r,
        plugins: n,
        className: l,
        children: s,
        ...c
      }) {
        let [d, u] = eh({ ...a, axis: "horizontal" === e ? "x" : "y" }, n),
          h = i.useCallback(
            (e) =>
              u
                ? (u.on("reInit", e),
                  u.on("select", e),
                  () => {
                    (u.off("reInit", e), u.off("select", e));
                  })
                : () => {},
            [u],
          ),
          f = i.useSyncExternalStore(
            h,
            () => u?.canScrollPrev() ?? !1,
            () => !1,
          ),
          b = i.useSyncExternalStore(
            h,
            () => u?.canScrollNext() ?? !1,
            () => !1,
          ),
          m = i.useCallback(() => {
            u?.scrollPrev(
              window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            );
          }, [u]),
          p = i.useCallback(() => {
            u?.scrollNext(
              window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            );
          }, [u]),
          g = i.useCallback(
            (e) => {
              "ArrowLeft" === e.key
                ? (e.preventDefault(), m())
                : "ArrowRight" === e.key && (e.preventDefault(), p());
            },
            [m, p],
          );
        return (
          i.useEffect(() => {
            u && r && r(u);
          }, [u, r]),
          (0, t.jsx)(ep.Provider, {
            value: {
              carouselRef: d,
              api: u,
              opts: a,
              orientation: e || (a?.axis === "y" ? "vertical" : "horizontal"),
              scrollPrev: m,
              scrollNext: p,
              canScrollPrev: f,
              canScrollNext: b,
            },
            children: (0, t.jsx)("div", {
              onKeyDownCapture: g,
              className: (0, o.f)("relative", l),
              role: "region",
              "aria-roledescription": "carousel",
              "data-slot": "carousel",
              ...c,
              children: s,
            }),
          })
        );
      }
      function ex({ className: e, ...a }) {
        let { carouselRef: i, orientation: r } = eg();
        return (0, t.jsx)("div", {
          ref: i,
          className: "overflow-hidden",
          "data-slot": "carousel-content",
          children: (0, t.jsx)("div", {
            className: (0, o.f)(
              "flex",
              "horizontal" === r ? "-ml-4" : "-mt-4 flex-col",
              e,
            ),
            ...a,
          }),
        });
      }
      function ey({ className: e, ...a }) {
        let { orientation: i } = eg();
        return (0, t.jsx)("div", {
          role: "group",
          "aria-roledescription": "slide",
          "data-slot": "carousel-item",
          className: (0, o.f)(
            "min-w-0 shrink-0 grow-0 basis-full",
            "horizontal" === i ? "pl-4" : "pt-4",
            e,
          ),
          ...a,
        });
      }
      function ew({
        className: e,
        variant: a = "outline",
        size: i = "icon-sm",
        ...r
      }) {
        let { orientation: n, scrollPrev: l, canScrollPrev: s } = eg();
        return (0, t.jsxs)(ef.K, {
          "data-slot": "carousel-previous",
          variant: a,
          size: i,
          className: (0, o.f)(
            "absolute touch-manipulation rounded-full",
            "horizontal" === n
              ? "inset-y-0 -left-12 my-auto"
              : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
            e,
          ),
          disabled: !s,
          onClick: l,
          ...r,
          children: [
            (0, t.jsx)(eb.f, {}),
            (0, t.jsx)("span", {
              className: "sr-only",
              children: "Previous slide",
            }),
          ],
        });
      }
      function eM({
        className: e,
        variant: a = "outline",
        size: i = "icon-sm",
        ...r
      }) {
        let { orientation: n, scrollNext: l, canScrollNext: s } = eg();
        return (0, t.jsxs)(ef.K, {
          "data-slot": "carousel-next",
          variant: a,
          size: i,
          className: (0, o.f)(
            "absolute touch-manipulation rounded-full",
            "horizontal" === n
              ? "inset-y-0 -right-12 my-auto"
              : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
            e,
          ),
          disabled: !s,
          onClick: l,
          ...r,
          children: [
            (0, t.jsx)(em.f, {}),
            (0, t.jsx)("span", {
              className: "sr-only",
              children: "Next slide",
            }),
          ],
        });
      }
      var eA = e.i(736680),
        eC = e.i(450691),
        ek = e.i(47399);
      function eE({ active: e, className: a }) {
        let r = (0, i.useRef)(null),
          n = (0, i.useRef)(0);
        return (
          (0, i.useEffect)(() => {
            let t = r.current,
              a = t?.parentElement,
              i = t?.getContext("2d");
            if (!t || !a || !i) return;
            let l = matchMedia("(prefers-reduced-motion: reduce)"),
              o = 0,
              s = 0,
              c = 0,
              d = 0,
              u = !0,
              f = 0,
              b = () => {
                i.clearRect(0, 0, o, s);
                let t = Math.hypot(o / 2, s / 2) / 10;
                l.matches && (n.current = e ? t + 4 : 0);
                let a = ((o - 10) / 2) % 10,
                  r = ((s - 10) / 2) % 10;
                for (let e = -1; 10 * e < s; e += 1)
                  for (let l = -1; 10 * l < o; l += 1) {
                    let c = a + (l + 0.5) * 10,
                      d = r + (e + 0.5) * 10,
                      u = Math.hypot(c - o / 2, d - s / 2) / 10;
                    if (u + 3 * (0, h.x)(l, e, 9) > n.current) continue;
                    let b = (0, h.O)(1.15 - u / t),
                      m = (0, h.V)(l, e, f);
                    if ((0, h.x)(l, e, 4) > (0, h.O)((m - 0.45) / 0.43) * b)
                      continue;
                    let p = m > 0.88 ? 4 : 3,
                      g = Math.round(c - p / 2),
                      v = Math.round(d - p / 2);
                    ((i.fillStyle = (0, ek.f)(
                      (0, ek.u)(ek.U, (0, h.O)((10 * e) / Math.max(1, s))),
                    )),
                      i.fillRect(g + Math.floor(p / 2), v, 1, p),
                      i.fillRect(g, v + Math.floor(p / 2), p, 1));
                  }
              },
              m = (t) => {
                let a = d ? Math.min(0.1, (t - d) / 1e3) : 0;
                ((d = t), (f += a));
                let i = Math.hypot(o / 2, s / 2) / 10 + 4;
                ((n.current = e
                  ? Math.min(i, n.current + 36 * a)
                  : Math.max(0, n.current - 54 * a)),
                  b(),
                  !l.matches &&
                    u &&
                    !document.hidden &&
                    (e || n.current > 0) &&
                    (c = requestAnimationFrame(m)));
              },
              p = () => {
                (cancelAnimationFrame(c),
                  (d = 0),
                  b(),
                  !l.matches &&
                    u &&
                    !document.hidden &&
                    (e || n.current > 0) &&
                    (c = requestAnimationFrame(m)));
              },
              g = new ResizeObserver(() => {
                ((o = a.clientWidth), (s = a.clientHeight));
                let e = Math.min(devicePixelRatio || 1, 2);
                ((t.width = Math.round(o * e)),
                  (t.height = Math.round(s * e)),
                  i.setTransform(e, 0, 0, e, 0, 0),
                  p());
              }),
              v = new IntersectionObserver(([e]) => {
                ((u = e?.isIntersecting ?? !1), p());
              });
            return (
              g.observe(a),
              v.observe(a),
              l.addEventListener("change", p),
              document.addEventListener("visibilitychange", p),
              () => {
                (cancelAnimationFrame(c),
                  g.disconnect(),
                  v.disconnect(),
                  l.removeEventListener("change", p),
                  document.removeEventListener("visibilitychange", p));
              }
            );
          }, [e]),
          (0, t.jsx)("canvas", { ref: r, className: a, "aria-hidden": "true" })
        );
      }
      var eN = e.i(716317);
      let ej = (e) => String(e).padStart(2, "0");
      function eF({
        publishers: e,
        categories: a,
        copy: r = eN.m.copy,
        categorySlugs: n,
        categoryLabels: o = eN.m.categoryLabels,
      }) {
        let s = (0, i.useMemo)(() => [G()], []),
          [d, u] = (0, i.useState)(null),
          h = e.slice(0, 8),
          b = e.slice(0, 9),
          m = { "--n": b.length },
          g = { "--i": b.length },
          v = (0, eN.P)(a, e),
          x = (e) => (e ? o[e.slug]?.trim() || e.name : "API"),
          y = [...new Set(n ?? (0, eN.p)(v))]
            .slice(0, 4)
            .flatMap((e) => v.filter((t) => t.category.slug === e));
        return (0, t.jsxs)("div", {
          className: `page-column px-4 sm:px-6 ${eA.default.discovery}`,
          children: [
            (0, t.jsxs)(ev, {
              className: eA.default.section,
              "aria-labelledby": "most-called-title",
              tabIndex: 0,
              opts: { align: "start", dragFree: !0 },
              plugins: s,
              children: [
                (0, t.jsxs)("div", {
                  className: eA.default.heading,
                  children: [
                    (0, t.jsx)("h2", {
                      id: "most-called-title",
                      children: "Most called",
                    }),
                    (0, t.jsxs)("div", {
                      className: eA.default.controls,
                      children: [
                        (0, t.jsxs)(l.Link, {
                          href: "/catalog",
                          className: eA.default.viewAll,
                          children: [
                            "View all ",
                            (0, t.jsx)(P.f, {
                              "aria-hidden": "true",
                              className: "size-4",
                            }),
                          ],
                        }),
                        (0, t.jsx)(ew, {
                          className: "static m-0 translate-y-0 rounded-glyph",
                          "aria-label": "Previous Most called",
                        }),
                        (0, t.jsx)(eM, {
                          className: "static m-0 translate-y-0 rounded-glyph",
                          "aria-label": "Next Most called",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, t.jsx)(ex, {
                  className: eA.default.featureRail,
                  onDragStart: (e) => e.preventDefault(),
                  children: h.map((e, i) =>
                    (0, t.jsx)(
                      ey,
                      {
                        className: eA.default.featureSlide,
                        children: (0, t.jsxs)(l.Link, {
                          href: (0, c.f)(e),
                          className: eA.default.featureCard,
                          onPointerEnter: () => u(e.slug),
                          onPointerLeave: () =>
                            u((t) => (t === e.slug ? null : t)),
                          onFocus: () => u(e.slug),
                          onBlur: () => u((t) => (t === e.slug ? null : t)),
                          children: [
                            (0, t.jsxs)("div", {
                              className: eA.default.art,
                              children: [
                                (0, t.jsxs)("span", {
                                  className: eA.default.artOriginal,
                                  "aria-hidden": "true",
                                  children: [
                                    (0, t.jsx)(eE, {
                                      active: d === e.slug,
                                      className: eA.default.artField,
                                    }),
                                    (0, t.jsx)(q.PublisherLogo, {
                                      publisher: e,
                                      size: "spotlight",
                                      well: !0,
                                    }),
                                  ],
                                }),
                                (0, t.jsxs)("span", {
                                  className: eA.default.artMeta,
                                  children: [
                                    (0, t.jsxs)("span", {
                                      children: [ej(i + 1), " / Most called"],
                                    }),
                                    (0, t.jsxs)("span", {
                                      children: [ej(e.endpoints), " endpoints"],
                                    }),
                                  ],
                                }),
                                (0, t.jsx)("span", {
                                  className: eA.default.artLogo,
                                  children: (0, t.jsx)(p, {
                                    size: 14,
                                    inset: d === e.slug ? -16 : -28,
                                    line: !0,
                                    className: eA.default.brackets,
                                  }),
                                }),
                                (0, t.jsxs)("span", {
                                  className: eA.default.artFoot,
                                  children: [
                                    (0, t.jsx)("span", {
                                      className: eA.default.swatch,
                                      "aria-hidden": "true",
                                    }),
                                    x(
                                      a.find(
                                        (t) => t.slug === e.categorySlugs[0],
                                      ),
                                    ),
                                  ],
                                }),
                              ],
                            }),
                            (0, t.jsxs)("div", {
                              className: eA.default.featureBody,
                              children: [
                                (0, t.jsx)("div", {
                                  className: eA.default.featureHead,
                                  "data-solo": "",
                                  children: (0, t.jsxs)("div", {
                                    children: [
                                      (0, t.jsxs)("div", {
                                        className: eA.default.featureTitle,
                                        children: [
                                          (0, t.jsx)("h3", {
                                            children: e.name,
                                          }),
                                          e.verified &&
                                            (0, t.jsx)("span", {
                                              className: eA.default.badge,
                                              children: "Verified",
                                            }),
                                        ],
                                      }),
                                      (0, t.jsx)("p", { children: e.blurb }),
                                    ],
                                  }),
                                }),
                                (0, t.jsxs)("div", {
                                  className: eA.default.featureFoot,
                                  children: [
                                    (0, t.jsx)("span", {
                                      className: eA.default.price,
                                      children: (0, c.D)(e),
                                    }),
                                    (0, t.jsxs)("span", {
                                      className: eA.default.explore,
                                      children: [
                                        "Explore API",
                                        " ",
                                        (0, t.jsx)(f.f, {
                                          className: "size-4",
                                          "aria-hidden": "true",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      },
                      e.id,
                    ),
                  ),
                }),
                0 === h.length &&
                  (0, t.jsxs)("p", {
                    className: "py-12 text-muted-foreground",
                    children: [
                      "The catalog is being updated.",
                      " ",
                      (0, t.jsx)(l.Link, {
                        href: "/catalog",
                        className: "underline underline-offset-4",
                        children: "Browse available APIs",
                      }),
                    ],
                  }),
              ],
            }),
            (0, t.jsxs)("section", {
              className: eA.default.categories,
              "aria-labelledby": "explore-categories-title",
              children: [
                (0, t.jsxs)("div", {
                  className: eA.default.categoryIntro,
                  children: [
                    (0, t.jsx)("span", {
                      className: eA.default.eyebrow,
                      children: r.categoriesEyebrow,
                    }),
                    (0, t.jsx)("h2", {
                      id: "explore-categories-title",
                      children: r.categoriesTitle,
                    }),
                  ],
                }),
                (0, t.jsxs)("div", {
                  className: `${eC.default.explorer} ${eC.default.ruled}`,
                  children: [
                    y.map(({ category: e, items: a }, i) => {
                      var r;
                      return (0, t.jsxs)(
                        "section",
                        {
                          className: eC.default.ruledGroup,
                          "aria-label": x(e),
                          children: [
                            (0, t.jsxs)(l.Link, {
                              href: (0, c.j)(e.slug),
                              className: eC.default.ruledHead,
                              children: [
                                (0, t.jsx)("span", {
                                  className: eC.default.mono,
                                  children: ej(i + 1),
                                }),
                                (0, t.jsx)("h3", { children: x(e) }),
                                (0, t.jsxs)("span", {
                                  className: `${eC.default.mono} ${eC.default.count}`,
                                  children: [a.length, " APIs"],
                                }),
                                (0, t.jsxs)("span", {
                                  className: `${eC.default.mono} ${eC.default.viewAll}`,
                                  children: [
                                    "View all",
                                    " ",
                                    (0, t.jsx)(P.f, {
                                      className: "inline size-4",
                                      "aria-hidden": "true",
                                    }),
                                  ],
                                }),
                                (0, t.jsx)("span", {
                                  className: eC.default.ruledCount,
                                  "aria-hidden": "true",
                                  children: a.length,
                                }),
                              ],
                            }),
                            a.slice(0, 6).map((e) =>
                              (0, t.jsxs)(
                                l.Link,
                                {
                                  href: (0, c.f)(e),
                                  className: eC.default.ruledCell,
                                  children: [
                                    (0, t.jsx)(q.PublisherLogo, {
                                      publisher: e,
                                    }),
                                    (0, t.jsxs)("span", {
                                      className: eC.default.ruledText,
                                      children: [
                                        (0, t.jsx)("span", {
                                          className: eC.default.name,
                                          children: e.name,
                                        }),
                                        (0, t.jsx)("span", {
                                          className: eC.default.ruledBlurb,
                                          children: e.blurb,
                                        }),
                                      ],
                                    }),
                                    (0, t.jsxs)("span", {
                                      className: `${eC.default.mono} ${eC.default.foot}`,
                                      children: [
                                        (0, t.jsx)("span", {
                                          children: (0, c.D)(e),
                                        }),
                                        (0, t.jsx)(P.f, {
                                          className: "size-4",
                                          "aria-hidden": "true",
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                                e.id,
                              ),
                            ),
                            [
                              3 - Math.min((r = Math.min(a.length, 6)), 3),
                              3 - Math.max(0, r - 3),
                            ]
                              .filter((e) => e > 0)
                              .map((e, a) =>
                                (0, t.jsx)(
                                  "span",
                                  {
                                    className: `${eC.default.ruledFill} ${eC.default.plusFill}`,
                                    style: { gridColumn: `span ${e}` },
                                    "aria-hidden": "true",
                                  },
                                  a,
                                ),
                              ),
                          ],
                        },
                        e.slug,
                      );
                    }),
                    (0, t.jsx)("span", {
                      className: `${eC.default.ruledBand} ${eC.default.plusFill}`,
                      "aria-hidden": "true",
                    }),
                    (0, t.jsxs)(l.Link, {
                      href: "/catalog",
                      className: eC.default.allRow,
                      children: [
                        (0, t.jsxs)("span", {
                          className: eC.default.allHead,
                          children: [
                            (0, t.jsx)("span", {
                              className: eC.default.mono,
                              children: "All",
                            }),
                            (0, t.jsxs)("span", {
                              className: eC.default.allTitle,
                              children: [
                                "Explore all ",
                                v.length,
                                " categories",
                              ],
                            }),
                            (0, t.jsxs)("span", {
                              className: `${eC.default.mono} ${eC.default.count}`,
                              children: [e.length, " APIs"],
                            }),
                          ],
                        }),
                        (0, t.jsxs)("span", {
                          className: eC.default.allBody,
                          children: [
                            (0, t.jsxs)("span", {
                              className: eC.default.logoStack,
                              style: m,
                              "aria-hidden": "true",
                              children: [
                                b.map((e, a) => {
                                  let i = { zIndex: b.length - a, "--i": a };
                                  return (0, t.jsx)(
                                    "span",
                                    {
                                      className:
                                        "[&>span]:size-[68px] [&>span]:rounded-panel-lg",
                                      style: i,
                                      children: (0, t.jsx)(q.PublisherLogo, {
                                        publisher: e,
                                        size: "header",
                                      }),
                                    },
                                    e.id,
                                  );
                                }),
                                e.length > b.length &&
                                  (0, t.jsxs)("span", {
                                    className: eC.default.stackMore,
                                    style: g,
                                    children: ["+", e.length - b.length],
                                  }),
                              ],
                            }),
                            (0, t.jsx)("span", {
                              className: eC.default.allNames,
                              children: v.map((e) => x(e.category)).join(" · "),
                            }),
                            (0, t.jsxs)("span", {
                              className: `${eC.default.mono} ${eC.default.allCta}`,
                              children: [
                                "Browse the catalog",
                                " ",
                                (0, t.jsx)(f.f, {
                                  className: "inline size-4",
                                  "aria-hidden": "true",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
      var eR = e.i(35813);
      let eS = [
          [122, 12, 6],
          [144, 12, 6],
          [760, 12, 6],
          [826, 12, 6],
          [914, 12, 5],
          [100, 34, 6],
          [144, 34, 6],
          [166, 34, 6],
          [826, 34, 6],
          [848, 34, 6],
          [144, 56, 6],
          [166, 56, 6],
          [892, 56, 6],
          [1002, 56, 5],
          [34, 78, 6],
          [56, 78, 6],
          [78, 78, 6],
          [1024, 78, 6],
          [12, 100, 6],
          [34, 100, 6],
          [56, 100, 6],
          [100, 100, 6],
          [1002, 100, 6],
          [1068, 100, 5],
          [496, 122, 5],
          [1046, 122, 6],
          [1068, 122, 6],
          [430, 144, 6],
          [474, 144, 6],
          [584, 144, 5],
          [694, 144, 5],
          [1068, 144, 6],
          [56, 166, 6],
          [386, 166, 7],
          [408, 166, 7],
          [452, 166, 7],
          [342, 188, 7],
          [386, 188, 7],
          [430, 188, 7],
          [452, 188, 7],
          [474, 188, 7],
          [562, 188, 10],
          [584, 188, 5],
          [738, 188, 7],
          [1068, 188, 6],
          [12, 210, 5],
          [298, 210, 7],
          [320, 210, 7],
          [364, 210, 7],
          [386, 210, 7],
          [408, 210, 15],
          [430, 210, 7],
          [452, 210, 7],
          [474, 210, 7],
          [584, 210, 6],
          [606, 210, 7],
          [650, 210, 7],
          [694, 210, 7],
          [738, 210, 7],
          [760, 210, 7],
          [826, 210, 12],
          [210, 232, 5],
          [408, 232, 7],
          [430, 232, 7],
          [474, 232, 5],
          [628, 232, 6],
          [650, 232, 7],
          [672, 232, 7],
          [694, 232, 7],
          [716, 232, 7],
          [826, 232, 7],
          [870, 232, 5],
          [210, 254, 6],
          [232, 254, 14],
          [276, 254, 7],
          [298, 254, 7],
          [320, 254, 15],
          [430, 254, 5],
          [672, 254, 6],
          [716, 254, 7],
          [738, 254, 8],
          [760, 254, 8],
          [782, 254, 8],
          [804, 254, 7],
          [826, 254, 7],
          [188, 276, 6],
          [276, 276, 7],
          [738, 276, 8],
          [804, 276, 9],
          [826, 276, 8],
          [848, 276, 7],
          [892, 276, 7],
          [166, 298, 6],
          [232, 298, 7],
          [254, 298, 7],
          [276, 298, 7],
          [826, 298, 9],
          [848, 298, 8],
          [870, 298, 8],
          [892, 298, 7],
          [914, 298, 15],
          [144, 320, 7],
          [210, 320, 7],
          [232, 320, 7],
          [716, 320, 8],
          [804, 320, 10],
          [892, 320, 7],
          [122, 342, 7],
          [144, 342, 7],
          [188, 342, 7],
          [210, 342, 7],
          [760, 342, 10],
          [782, 342, 10],
          [804, 342, 9],
          [826, 342, 9],
          [870, 342, 20],
          [892, 342, 8],
          [914, 342, 7],
          [936, 342, 7],
          [122, 364, 7],
          [628, 364, 6],
          [694, 364, 9],
          [848, 364, 9],
          [892, 364, 9],
          [914, 364, 7],
          [936, 364, 7],
          [958, 364, 7],
          [980, 364, 7],
          [78, 386, 6],
          [100, 386, 7],
          [122, 386, 7],
          [144, 386, 15],
          [188, 386, 6],
          [430, 386, 5],
          [518, 386, 6],
          [562, 386, 6],
          [672, 386, 8],
          [848, 386, 8],
          [936, 386, 7],
          [1002, 386, 6],
          [56, 408, 5],
          [78, 408, 7],
          [100, 408, 7],
          [144, 408, 7],
          [166, 408, 7],
          [408, 408, 6],
          [430, 408, 7],
          [452, 408, 7],
          [474, 408, 7],
          [496, 408, 7],
          [540, 408, 7],
          [584, 408, 7],
          [628, 408, 9],
          [650, 408, 10],
          [694, 408, 11],
          [892, 408, 6],
          [936, 408, 7],
          [980, 408, 7],
          [1046, 408, 5],
          [78, 430, 7],
          [144, 430, 7],
          [408, 430, 7],
          [452, 430, 7],
          [496, 430, 7],
          [518, 430, 7],
          [540, 430, 7],
          [584, 430, 7],
          [606, 430, 8],
          [650, 430, 11],
          [672, 430, 13],
          [694, 430, 13],
          [958, 430, 7],
          [980, 430, 15],
          [1002, 430, 13],
          [1046, 430, 5],
          [56, 452, 7],
          [78, 452, 7],
          [100, 452, 7],
          [122, 452, 15],
          [144, 452, 6],
          [364, 452, 7],
          [452, 452, 7],
          [496, 452, 7],
          [628, 452, 9],
          [650, 452, 10],
          [848, 452, 8],
          [870, 452, 7],
          [958, 452, 7],
          [78, 474, 7],
          [100, 474, 7],
          [386, 474, 7],
          [518, 474, 6],
          [562, 474, 6],
          [584, 474, 7],
          [650, 474, 9],
          [672, 474, 11],
          [694, 474, 13],
          [760, 474, 13],
          [782, 474, 10],
          [980, 474, 15],
          [56, 496, 7],
          [100, 496, 7],
          [122, 496, 6],
          [320, 496, 7],
          [342, 496, 7],
          [364, 496, 7],
          [386, 496, 7],
          [408, 496, 7],
          [628, 496, 6],
          [716, 496, 12],
          [738, 496, 13],
          [760, 496, 13],
          [980, 496, 7],
          [1068, 496, 6],
          [12, 518, 5],
          [56, 518, 7],
          [78, 518, 7],
          [298, 518, 6],
          [320, 518, 7],
          [342, 518, 7],
          [694, 518, 9],
          [782, 518, 11],
          [804, 518, 18],
          [1002, 518, 7],
          [1024, 518, 7],
          [1046, 518, 6],
          [56, 540, 7],
          [100, 540, 7],
          [298, 540, 6],
          [320, 540, 7],
          [694, 540, 7],
          [716, 540, 9],
          [738, 540, 9],
          [760, 540, 9],
          [1002, 540, 7],
          [1046, 540, 7],
          [12, 562, 5],
          [56, 562, 7],
          [78, 562, 7],
          [100, 562, 7],
          [298, 562, 6],
          [716, 562, 6],
          [738, 562, 8],
          [782, 562, 8],
          [826, 562, 6],
          [1068, 562, 7],
          [34, 584, 7],
          [78, 584, 7],
          [100, 584, 7],
          [320, 584, 7],
          [364, 584, 6],
          [496, 584, 7],
          [760, 584, 7],
          [782, 584, 7],
          [804, 584, 7],
          [826, 584, 7],
          [848, 584, 6],
          [1002, 584, 5],
          [1068, 584, 7],
          [34, 606, 15],
          [56, 606, 7],
          [78, 606, 7],
          [100, 606, 6],
          [342, 606, 8],
          [474, 606, 8],
          [782, 606, 7],
          [804, 606, 7],
          [826, 606, 7],
          [1024, 606, 6],
          [1046, 606, 7],
          [56, 628, 7],
          [78, 628, 7],
          [100, 628, 6],
          [254, 628, 5],
          [298, 628, 6],
          [342, 628, 8],
          [386, 628, 8],
          [496, 628, 14],
          [518, 628, 13],
          [760, 628, 6],
          [804, 628, 7],
          [826, 628, 7],
          [848, 628, 7],
          [1068, 628, 7],
          [56, 650, 15],
          [276, 650, 6],
          [320, 650, 8],
          [342, 650, 10],
          [386, 650, 9],
          [518, 650, 14],
          [540, 650, 12],
          [562, 650, 10],
          [804, 650, 7],
          [826, 650, 7],
          [848, 650, 7],
          [1046, 650, 7],
          [100, 672, 6],
          [276, 672, 6],
          [298, 672, 8],
          [320, 672, 9],
          [342, 672, 11],
          [540, 672, 13],
          [804, 672, 7],
          [848, 672, 7],
          [1046, 672, 7],
          [100, 694, 6],
          [298, 694, 8],
          [518, 694, 11],
          [540, 694, 12],
          [562, 694, 11],
          [584, 694, 9],
          [782, 694, 6],
          [804, 694, 7],
          [870, 694, 7],
          [1046, 694, 7],
          [1068, 694, 7],
          [34, 716, 6],
          [78, 716, 15],
          [100, 716, 7],
          [144, 716, 5],
          [298, 716, 7],
          [342, 716, 10],
          [540, 716, 10],
          [562, 716, 11],
          [584, 716, 9],
          [628, 716, 7],
          [804, 716, 7],
          [848, 716, 7],
          [870, 716, 7],
          [100, 738, 7],
          [298, 738, 6],
          [386, 738, 9],
          [518, 738, 9],
          [562, 738, 10],
          [584, 738, 9],
          [606, 738, 7],
          [628, 738, 7],
          [826, 738, 7],
          [870, 738, 7],
          [892, 738, 5],
          [1046, 738, 6],
          [100, 760, 7],
          [144, 760, 6],
          [364, 760, 7],
          [408, 760, 9],
          [452, 760, 10],
          [584, 760, 8],
          [848, 760, 7],
          [870, 760, 7],
          [1068, 760, 5],
          [100, 782, 7],
          [144, 782, 7],
          [386, 782, 7],
          [474, 782, 19],
          [496, 782, 8],
          [562, 782, 8],
          [584, 782, 7],
          [606, 782, 7],
          [628, 782, 7],
          [804, 782, 6],
          [826, 782, 7],
          [848, 782, 7],
          [870, 782, 7],
          [1068, 782, 6],
          [78, 804, 7],
          [100, 804, 7],
          [122, 804, 7],
          [144, 804, 7],
          [364, 804, 12],
          [496, 804, 7],
          [584, 804, 7],
          [606, 804, 7],
          [804, 804, 7],
          [848, 804, 7],
          [870, 804, 7],
          [122, 826, 7],
          [144, 826, 7],
          [430, 826, 6],
          [562, 826, 7],
          [584, 826, 7],
          [606, 826, 7],
          [804, 826, 7],
          [826, 826, 7],
          [1046, 826, 6],
          [100, 848, 7],
          [122, 848, 7],
          [144, 848, 7],
          [166, 848, 7],
          [188, 848, 7],
          [210, 848, 6],
          [628, 848, 6],
          [804, 848, 7],
          [1046, 848, 6],
          [144, 870, 7],
          [166, 870, 7],
          [518, 870, 7],
          [628, 870, 5],
          [804, 870, 7],
          [826, 870, 7],
          [1046, 870, 7],
          [1068, 870, 7],
          [144, 892, 7],
          [210, 892, 7],
          [276, 892, 6],
          [298, 892, 5],
          [496, 892, 7],
          [518, 892, 7],
          [540, 892, 7],
          [562, 892, 7],
          [584, 892, 7],
          [782, 892, 7],
          [826, 892, 7],
          [848, 892, 7],
          [1024, 892, 5],
          [1046, 892, 7],
          [1068, 892, 7],
          [188, 914, 7],
          [210, 914, 7],
          [232, 914, 7],
          [254, 914, 7],
          [298, 914, 7],
          [320, 914, 7],
          [474, 914, 7],
          [496, 914, 7],
          [518, 914, 7],
          [782, 914, 7],
          [804, 914, 7],
          [848, 914, 7],
          [1046, 914, 7],
          [188, 936, 7],
          [210, 936, 7],
          [254, 936, 7],
          [320, 936, 7],
          [430, 936, 7],
          [452, 936, 7],
          [562, 936, 6],
          [584, 936, 5],
          [782, 936, 7],
          [826, 936, 7],
          [1068, 936, 7],
          [210, 958, 6],
          [254, 958, 7],
          [276, 958, 7],
          [298, 958, 7],
          [320, 958, 7],
          [364, 958, 7],
          [386, 958, 7],
          [430, 958, 7],
          [452, 958, 7],
          [474, 958, 7],
          [496, 958, 7],
          [540, 958, 6],
          [760, 958, 7],
          [1024, 958, 7],
          [254, 980, 6],
          [276, 980, 7],
          [320, 980, 7],
          [408, 980, 6],
          [474, 980, 6],
          [738, 980, 7],
          [782, 980, 6],
          [804, 980, 7],
          [1068, 980, 7],
          [320, 1002, 13],
          [430, 1002, 6],
          [716, 1002, 6],
          [738, 1002, 7],
          [716, 1024, 7],
          [1024, 1024, 7],
          [672, 1046, 6],
          [694, 1046, 7],
          [1002, 1046, 7],
          [650, 1068, 14],
          [694, 1068, 7],
        ],
        eP = Math.PI * (3 - Math.sqrt(5)),
        eL = 448.5 / 22,
        e_ = 689.5 / 22,
        eT = `#version 300 es
precision highp float;
precision highp int;
`,
        eD = `
uniform vec2 uViewport;
uniform vec2 uOrigin;
uniform float uPitch;
uniform float uDpr;
uniform vec2 uLensC;
uniform float uLensR;
uniform float uLensA;
uniform float uLensS;
uniform float uWaveT;
uniform float uWaveV;
uniform float uWaveFlip;
uniform float uWaveJitter;
uniform float uWaveFade;
uniform vec2 uWaveO;
uniform float uDarkOld;
uniform float uDarkNew;
uniform float uCorrL;  // inner edge of the left wall, device px
uniform float uCorrR;  // inner edge of the right wall

// Exact box-filter coverage of an axis-aligned square.
float cov1(float d, float h) { return clamp(min(min(1.0, 2.0 * h), h + 0.5 - abs(d)), 0.0, 1.0); }
float covSquare(vec2 o, float h) { return cov1(o.x, h) * cov1(o.y, h); }
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// x: tangential stretch M = r'/r, y: radial stretch f' = dr'/dr.
vec2 lensMF(float u, float A) {
  if (u >= 1.0) return vec2(1.0);
  float w = 1.0 - u * u;
  float sw = sqrt(w);
  return vec2(1.0 + A * w * w * sw, 1.0 + A * w * sw * (1.0 - 6.0 * u * u));
}
// Theme wave: returns the new theme's coverage of this pixel and
// the cell's eased flip e, which the dots use to cross-fade their palette.
float waveCover(vec2 px, out float e) {
  vec2 cell = floor((px - uOrigin) / uPitch);
  vec2 cc = uOrigin + (cell + 0.5) * uPitch;
  float tc = length(cc - uWaveO) / uWaveV + uWaveJitter * hash12(cell);
  float l = clamp((uWaveT - tc) / uWaveFlip, 0.0, 1.0);
  e = 1.0 - (1.0 - l) * (1.0 - l) * (1.0 - l);
  return uWaveFade > 0.5 ? e : covSquare(px - cc, e * (0.5 * uPitch + 0.5));
}
`,
        eO = ek.h.dark,
        eH = ek.h.light,
        e$ = `
uniform float uRimS;
uniform float uTime;
uniform float uHorizonY;
uniform float uHorizonX;
uniform float uHorizonHalf;
uniform float uLineW;
uniform float uLineA;
uniform float uBandA;
uniform float uFogA;
uniform float uBase;   // hero grid: the base pattern's strength (0 off)
uniform vec2 uBaseC;   // its centre (the vortex), device px
uniform float uBaseR;  // its reach, device px

const vec3 DARK_BG = ${(0, ek.y)(eO.bg)};
const vec3 LIGHT_BG = ${(0, ek.y)(eH.bg)};
const vec3 DARK_FG = ${(0, ek.y)(eO.fg)};
const vec3 LIGHT_FG = ${(0, ek.y)(eH.fg)};
const vec3 DARK_DEEP = ${(0, ek.y)(eO.deep)};
const vec3 LIGHT_DEEP = ${(0, ek.y)(eH.deep)};

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// The gate: a band deepening under the horizon, fog around it, the line.
vec3 scene(vec2 px, vec3 bg, float dk) {
  // Fades toward both walls across a third of the corridor each.
  float span = 0.33 * max(uCorrR - uCorrL, uPitch);
  float corridor = smoothstep(uCorrL, uCorrL + span, px.x)
                 * (1.0 - smoothstep(uCorrR - span, uCorrR, px.x));
  float y = px.y - uHorizonY;
  // Light: a faint warm haze on paper (35% of dark's strength), never a shadow.
  float haze = mix(0.35, 1.0, dk);
  if (uBandA > 0.0) {
    // Deepest just under the line, falling off exponentially below it.
    float band = y >= 0.0 ? exp(-y / (2.5 * uPitch)) : exp(y / (0.5 * uPitch));
    bg = mix(bg, mix(LIGHT_DEEP, DARK_DEEP, dk), haze * 0.5 * band * corridor * uBandA);
  }
  if (uFogA > 0.0) {
    // TODO(engine): half-res FBM fog layers; two drifting value-noise layers for now.
    float g = exp(-0.5 * (y / (4.0 * uPitch)) * (y / (4.0 * uPitch)));
    float n = 0.5 * vnoise(px / (6.0 * uPitch) + vec2(uTime * 0.025, 0.0))
            + 0.5 * vnoise(px / (4.0 * uPitch) + vec2(-uTime * 0.025, 3.7));
    bg = mix(bg, mix(LIGHT_DEEP, DARK_FG, dk), haze * uFogA * 0.10 * g * (0.35 + 0.65 * n) * corridor);
  }
  if (uLineA > 0.0) {
    float c = cov1(px.y - (uHorizonY + 0.5 * uLineW), 0.5 * uLineW)
            * cov1(px.x - uHorizonX, uHorizonHalf);
    bg = mix(bg, mix(LIGHT_FG, DARK_FG, dk), c * uLineA * mix(0.14, 0.18, dk));
  }
  return bg;
}

// Thick-glass rim lit from the top-left.
vec3 glass(vec2 px, vec3 base, float dk) {
  if (uRimS <= 0.0) return base;
  vec2 d = px - uLensC;
  float rho = length(d);
  if (rho > uLensR + 40.0 * uDpr) return base;
  float u = rho / uLensR;
  vec2 n = d / max(rho, 1e-3);
  float lit = 0.5 + 0.5 * dot(n, vec2(-0.70710678));
  float din = uLensR - rho;
  float wr = max(1.0, 0.75 * uDpr);
  float rim = clamp(din + 0.5, 0.0, 1.0) - clamp(din - wr + 0.5, 0.0, 1.0);
  float inner = smoothstep(0.78, 0.995, u) * (1.0 - smoothstep(0.995, 1.0, u));
  float fres = u < 1.0 ? pow(u, 8.0) : 0.0;
  float outer = u > 1.0 ? exp(-(rho - uLensR) / (5.0 * uDpr)) : 0.0;
  float addDark = rim * (0.035 + 0.20 * lit * lit) + 0.030 * fres - 0.030 * inner * (1.0 - lit);
  float addLight = -rim * (0.05 + 0.11 * (1.0 - lit)) - 0.018 * fres
                 - 0.025 * inner * (1.0 - lit) - 0.035 * outer * (1.0 - lit);
  return base + uRimS * mix(addLight, addDark, dk);
}

// Hero grid: a dim plus on (nearly) every cell of the half-pitch lattice
// (the footer horizon's grain), uneven in strength, strongest round the
// vortex and falling away from it.
vec3 basePattern(vec2 px, vec3 bg, float dk) {
  if (uBase <= 0.0) return bg;
  float q = floor(uPitch * 0.5);
  vec2 cell = floor((px - uOrigin) / q);
  float s = max(2.0, floor(0.38 * q + 0.5));
  float t = max(1.0, floor(s / 3.0 + 0.5));
  vec2 cc = uOrigin + (cell + 0.5) * q;
  float on = step(0.08, hash12(cell + 3.7));
  float fall = 1.0 - smoothstep(0.3, 1.0, length(cc - uBaseC) / uBaseR);
  float a = uBase * on * (0.25 + 0.75 * hash12(cell + 17.3)) * fall;
  vec2 o = px - cc;
  float cov = max(cov1(o.x, 0.5 * t) * cov1(o.y, 0.5 * s), cov1(o.x, 0.5 * s) * cov1(o.y, 0.5 * t));
  return mix(bg, mix(LIGHT_FG, DARK_FG, dk), a * cov);
}

vec3 bgColor(vec2 px) {
  float e;
  float dk = mix(uDarkOld, uDarkNew, waveCover(px, e));
  vec3 bg = mix(LIGHT_BG, DARK_BG, dk);
  return glass(px, basePattern(px, scene(px, bg, dk), dk), dk);
}
`,
        eI = `${eT}
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`,
        eB = `${eT}${eD}${e$}
out vec4 outColor;
void main() {
  vec2 px = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);
  outColor = vec4(bgColor(px), 1.0);
}
`,
        ez = `${eT}
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aRect;   // x0 y0 x1 y1, device px, y down
layout(location = 2) in vec4 aColor;  // straight rgb, alpha
uniform vec2 uViewport;
flat out vec4 vRect;
flat out vec4 vColor;
void main() {
  vec2 pos = mix(aRect.xy - 1.0, aRect.zw + 1.0, aCorner * 0.5 + 0.5);
  gl_Position = vec4(pos.x / uViewport.x * 2.0 - 1.0, 1.0 - pos.y / uViewport.y * 2.0, 0.0, 1.0);
  vRect = aRect;
  vColor = aColor;
}
`,
        eG = `${eT}
uniform vec2 uViewport;
flat in vec4 vRect;
flat in vec4 vColor;
out vec4 outColor;
void main() {
  vec2 px = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);
  vec2 cov = clamp(min(px + 0.5, vRect.zw) - max(px - 0.5, vRect.xy), 0.0, 1.0);
  float a = cov.x * cov.y * vColor.a;
  if (a <= 0.0) discard;
  outColor = vec4(vColor.rgb * a, a);
}
`,
        eq = `${eT}${eD}
layout(location = 0) in vec2 aCorner;   // strip (-1,-1) (1,-1) (-1,1) (1,1)
layout(location = 1) in vec4 aCell;     // rest cell xy, wall cell zw
layout(location = 2) in vec4 aP;        // side/p, delay, flags, hash
layout(location = 3) in vec4 aQ;        // palette t, cluster, alpha, unused

uniform float uQ;            // scatter progress 0..1
uniform float uQdot;         // its smoothed velocity, 1/s
uniform float uD;            // stagger span D
uniform float uFringe;       // css px, per theme (mixed by dk)
uniform float uTime;
uniform float uTwinkle;      // 1 normally, 0 under reduced motion
uniform float uSceneAlpha;   // reduced-motion cross-fade of the plume/walls
uniform float uWallFade;     // walls give way to the footer horizon
uniform float uPlumeAlpha;   // 0.45 behind the text column on narrow screens
uniform float uDocY;         // device y of the horizon's first row (scrolls)
uniform float uSnapK;        // 0 snapped to pixels .. 1 free (scrolling)
uniform vec3 uChip;          // centre xy, side (device px)
uniform float uChipGlow;     // glow sigma, device px
uniform float uChipA;
uniform vec2 uPivot;         // vortex swirl centre (device px)
uniform float uSnap;         // hero grid: the turning marks snap to the lattice
uniform float uAnchorGain;  // anchors brighten while the chip routes are lit
uniform vec4 uClear[8];      // text clearings, device px (x0, y0, x1, y1)
uniform int uClearN;
uniform float uHi[32];       // highlight level per cluster
uniform vec3 uTrail[48];      // the pointer's recent path: x, y (device px), age 0..1
uniform int uTrailN;
uniform sampler2D uGrad;     // gradient rows, palette.ts ROW

flat out vec2 vC;
flat out vec2 vR0;
flat out vec2 vR1;
flat out vec2 vG;
flat out vec2 vFr;
flat out float vH;
flat out vec4 vCol;
flat out float vDk;
flat out float vGlow;
flat out int vChip;
flat out float vFine;   // hero grid: the half pitch (0: the usual single plus)
flat out float vFineH;  // its small plus's half side
flat out float vSub;    // 2: a 2 \xd7 2 cluster, 1: one small plus

vec3 grad(float row, float t) {
  return textureLod(uGrad, vec2(clamp(t, 0.0, 1.0), (row + 0.5) / ${ek.J.length}.0), 0.0).rgb;
}
vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }
vec3 matte(vec3 c, float chroma, float gain) {
  vec3 lin = toLin(c);
  float luma = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  return toSrgb(mix(vec3(luma), lin, chroma) * gain);
}

void main() {
  int flags = int(aP.z + 0.5);
  bool latent = (flags & 1) != 0;
  bool fade = (flags & 2) != 0;
  bool chip = (flags & 4) != 0;
  bool horizon = (flags & 8) != 0;
  bool anchor = (flags & 16) != 0;
  bool focus = (flags & 64) != 0;
  bool gridOnly = (flags & 128) != 0;

  float lifeAlpha = 1.0;
  float flowT = aQ.x;
  float flowNeutral = aQ.w;
  float side;
  vec2 c;
  float disrupt = 0.0;
  float e = 0.0;
  float vx = 0.0;
  vec2 wallC = vec2(0.0);
  if (chip) {
    side = max(1.0, floor(uChip.z + 0.5));
    // Sub-pixel, like the marks it turns with: a snapped chip steps.
    c = uChip.xy;
  } else {
    side = max(1.0, floor(aP.x * uPitch + 0.5));
    // Top-left on an integer pixel so every square is crisp at rest.
    vec2 inset = vec2(floor((uPitch - side) * 0.5) + side * 0.5);
    if (horizon) {
      vec2 c0 = vec2(uOrigin.x, uDocY) + aCell.xy * uPitch + inset;
      float snapped = floor(c0.y - 0.5 * side + 0.5) + 0.5 * side;
      c = vec2(c0.x, mix(snapped, c0.y, uSnapK));
    } else {
      vec2 c0 = uOrigin + aCell.xy * uPitch + inset;
      // The vortex spins without leaving the brand page's structure (field.ts
      // SPIN_PERIOD, WAVE_PERIOD; mirrored in vortexPose). The whole R5
      // pattern turns about its centre, a turn per 120 s, each mark kept
      // upright; the focus blocks turn with it. Positions stay sub-pixel
      // (coverage is analytic): snapping a moving mark makes it step.
      // Over that, a spawn / dissolve wave sweeps round on a slight spiral,
      // a turn per 24 s: ahead of it marks grow in, behind it they shrink
      // away, then a short gap. The front moves continuously along each
      // branch, so a mark only ever spawns beside its neighbour.
      if (!latent && uTwinkle > 0.5) {
        float spin = uTime * 6.2831853 / 120.0;
        vec2 dp = c0 - uPivot;
        dp = vec2(cos(spin) * dp.x - sin(spin) * dp.y, sin(spin) * dp.x + cos(spin) * dp.y);
        c0 = uPivot + dp;
        // Grid: onto the half-pitch lattice it turned into, so the turn
        // steps from symbol to symbol like type (field.ts spinPoint mirrors
        // it). A big mark (drawn as a 2 \xd7 2 cluster) sits on a lattice
        // corner, a small one (a single plus) in a cell.
        if (uSnap > 0.5) {
          float q = floor(uPitch * 0.5);
          vec2 g = (c0 - uOrigin) / q;
          c0 = uOrigin + (aP.x >= 0.4 ? floor(g + 0.5) : floor(g) + 0.5) * q;
        }
        if (!focus) {
          float turn = atan(dp.y, dp.x) / 6.2831853;
          float rings = length(dp) / uPitch;
          // Time-ordered for this mark: 0–0.08 spawn, hold, 0.80–0.90
          // dissolve, 0.90–1 gone. A hair of per-mark jitter keeps the
          // front from reading as a ruled line.
          float life = fract(uTime / 24.0 - turn + rings * 0.01 + aP.w * 0.02);
          lifeAlpha = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.80, 0.90, life));
          // Grid: the sparser marks only dim as the wave passes, never vanish,
          // so the vortex keeps its shape.
          if (uSnap > 0.5) lifeAlpha = mix(0.6, 1.0, lifeAlpha);
          // Grid: symbols switch on and off rather than shrinking.
          if (uSnap < 0.5) side = max(1.0, side * mix(0.3, 1.0, lifeAlpha));
        }
      }
      vec2 c1 = uOrigin + aCell.zw * uPitch + inset;
      wallC = c1;
      // Scatter along x only, outer dots first.
      float qi = clamp((uQ - aP.y) / (1.0 - uD), 0.0, 1.0);
      e = qi * qi * qi * (qi * (qi * 6.0 - 15.0) + 10.0);
      float de = 30.0 * qi * qi * (1.0 - qi) * (1.0 - qi);
      c = mix(c0, c1, e);
      vx = (c1.x - c0.x) * de / (1.0 - uD) * uQdot;
      // Displacement: the pointer's recent path pushes the marks near it
      // out of its way, radially from each point of it; they ease back as
      // the path fades (world.ts, the trail). On the grid hero the push
      // moves in whole lattice steps.
      if (!horizon && !latent && !focus && uTrailN > 0) {
        vec2 push = vec2(0.0);
        for (int i = 0; i < 48; i++) {
          if (i >= uTrailN) break;
          vec3 t = uTrail[i];
          vec2 dv = c - t.xy;
          float dl = length(dv);
          float x = dl / (3.2 * uPitch);
          float f = x < 1.0 ? (1.0 - x) * (1.0 - x) : 0.0;
          float fade = 1.0 - t.z;
          fade *= fade * (3.0 - 2.0 * fade);
          vec2 dir = dl > 1e-3 ? dv / dl : vec2(1.0, 0.0);
          vec2 p = dir * f * fade;
          push = dot(p, p) > dot(push, push) ? p : push;
        }
        push *= (1.0 - e) * 2.4 * uPitch;
        disrupt = clamp(length(push) / (2.4 * uPitch), 0.0, 1.0);
        if (uSnap > 0.5) {
          float q = floor(uPitch * 0.5);
          push = floor(push / q + 0.5) * q;
        }
        c += push;
      }
    }
  }

  // Lens: magnify the centre, compress the ring, keep squares square-ish.
  vec2 d = c - uLensC;
  float r = length(d);
  float u = r / uLensR;
  vec2 MF = lensMF(u, uLensA);
  vec2 n = r > 1e-4 ? d / r : vec2(1.0, 0.0);
  float iso = sqrt(MF.x * MF.y);
  vec2 cm;
  float ra;
  float tb;
  if (chip || focus) {
    cm = c;
    ra = 1.0;
    tb = 1.0;
  } else {
    cm = uLensC + d * MF.x;
    ra = mix(iso, MF.y, 0.5);
    tb = mix(iso, MF.x, 0.5);
    // Ink clamp: each square stays inside its own mapped cell, >= 1 css px gap.
    float t1 = ra / MF.y;
    float t2 = tb / MF.x;
    float Tinf = 0.5 * (t1 + t2) + abs(t1 - t2) * 0.70710678;
    float E = min(1.0, (1.0 - uDpr / (uPitch * MF.y)) / (max(aP.x, 0.01) * Tinf));
    ra *= E;
    tb *= E;
  }
  float ia = 1.0 / ra;
  float ib = 1.0 / tb;
  float nxy = n.x * n.y;
  vec2 r0 = vec2(ia * n.x * n.x + ib * n.y * n.y, (ia - ib) * nxy);
  vec2 r1 = vec2((ia - ib) * nxy, ia * n.y * n.y + ib * n.x * n.x);
  // Beads on wires: stretch along x with speed, the leading edge exact.
  float ext = min(abs(vx) * 0.005, 1.5 * side);
  float k = 1.0 + ext / max(side, 0.001);
  r0.x /= k;
  r1.x /= k;
  cm.x -= sign(vx) * ext * 0.5;

  float a = aQ.z * inversesqrt(k) * mix(lifeAlpha, 1.0, e);
  // A little noise in the vortex marks' strength: each its own, steady
  // (62–100%), drifting slowly a touch (\xb112%; none under reduced motion);
  // full again as they part into the walls.
  if (!chip && !focus && !horizon && !latent) {
    float grain = 0.62 + 0.38 * fract(aP.w * 7.31 + 0.13);
    grain *= 1.0 - 0.12 * uTwinkle * (0.5 + 0.5 * sin(uTime * (0.35 + 0.5 * aP.w) + aP.w * 40.0));
    a *= mix(grain, 1.0, e);
  }
  if (!chip && !horizon && !latent) a *= uSceneAlpha * uWallFade * (focus ? 1.0 : mix(uPlumeAlpha, 1.0, e));
  a *= 1.0 - 0.25 * disrupt; // pushed marks dim a touch
  if (latent) a = 0.0; // Cursor only warps existing symbols.
  if (gridOnly && uSnap < 0.5) a = 0.0; // The filled gaps: the grid hero's only.
  if (fade) a *= 1.0 - e;
  if (focus && uTwinkle < 0.5) a = 0.0;
  if (focus && uTwinkle > 0.5) a *= 1.0 - e;
  if (chip) a *= uChipA;
  else {
    // Text clearings: the field steps back at least one cell from words.
    for (int i = 0; i < 8; i++) {
      if (i >= uClearN) break;
      vec4 b = uClear[i];
      float outside = max(max(b.x - cm.x, cm.x - b.z), max(b.y - cm.y, cm.y - b.w));
      // Soft: thinning from inside the padding to a pitch outside it.
      a *= smoothstep(-0.5 * uPitch, uPitch, outside);
    }
    // Nothing covers the chip: dots displaced into its clearing fade.
    if (uChipA > 0.0) {
      vec2 dc = abs(cm - uChip.xy);
      float cheb = max(dc.x, dc.y);
      float h = 0.5 * uChip.z;
      a *= smoothstep(h + 0.1 * uPitch, h + 0.6 * uPitch, cheb);
    }
  }

  // Colour: one field seen through the square, matte, earning chroma under the lens.
  float waveE;
  waveCover(c, waveE);
  float dk = mix(uDarkOld, uDarkNew, waveE);
  float lensW = 0.0; // No cursor-driven colour gradient.
  vec3 col = vec3(1.0);
  if (!chip) {
    float xt = c.x / uViewport.x;
    vec3 dCol;
    vec3 lCol;
    if (horizon) {
      dCol = grad(${ek.i.darkPlume}.0, aQ.x);
      lCol = grad(${ek.i.lightAccent}.0, xt);
    } else if (latent) {
      dCol = grad(${ek.i.darkPlume}.0, c.y / uViewport.y);
      lCol = grad(${ek.i.lightAccent}.0, xt);
    } else {
      // Each wall its own spectrum: 0 at its screen edge, 1 at its inner edge.
      bool left = wallC.x < 0.5 * uViewport.x;
      float wt = left
        ? wallC.x / max(uCorrL, 1.0)
        : (uViewport.x - wallC.x) / max(uViewport.x - uCorrR, 1.0);
      vec3 dWall = left ? grad(${ek.i.darkWallLeft}.0, wt) : grad(${ek.i.darkWallRight}.0, wt);
      vec3 lWall = left ? grad(${ek.i.lightWallLeft}.0, wt) : grad(${ek.i.lightWallRight}.0, wt);
      dCol = mix(grad(${ek.i.darkPlume}.0, flowT), dWall, e);
      lCol = mix(mix(grad(${ek.i.lightPlume}.0, aQ.x), grad(${ek.i.lightAccent}.0, xt), lensW), lWall, e);
    }
    int cl = aQ.y < 0.0 ? -1 : int(aQ.y + 0.5);
    float hi = cl >= 0 && cl < 32 ? uHi[cl] : 0.0;
    // R5 draws the spectrum at full chroma; keep only a hint of matte.
    float chroma = mix(mix(0.96, 1.0, lensW), 1.0, hi);
    float period = 4.0 + 5.0 * aP.w;
    float twinkle = 1.0 + 0.04 * uTwinkle * sin(6.2831853 * (uTime / period + aP.w * 7.0));
    float gain = twinkle * (1.0 + 0.12 * hi) * (anchor ? 1.0 + uAnchorGain : 1.0);
    // R5: neutral outer spiral, radial spectrum around the two focus blocks.
    dCol = mix(dCol, vec3(0.969, 0.965, 0.945), flowNeutral * (1.0 - e));
    lCol = mix(dCol * 0.78, vec3(0.24, 0.22, 0.20), flowNeutral * (1.0 - e));
    col = mix(matte(lCol, chroma, gain), matte(dCol, chroma, gain), dk);
  }

  // uFringe is the dark amount (0.40 css px); light uses 0.25 (x 0.625).
  float fl = chip ? 0.0 : mix(0.625, 1.0, dk) * uFringe * uDpr * clamp((1.0 - MF.y) / 0.5, 0.0, 1.0) * uLensS;
  // Hero grid: the mark at the footer horizon's grain — small pluses on
  // the half-pitch lattice, a 2 \xd7 2 cluster for a big mark, one for a small
  // one; the quad grows to hold the cluster.
  vFine = 0.0;
  vFineH = 0.0;
  vSub = 0.0;
  if (uSnap > 0.5 && !chip && !horizon && !latent && !focus) {
    float q = floor(uPitch * 0.5);
    vFine = q;
    vSub = aP.x >= 0.4 ? 2.0 : 1.0;
    vFineH = 0.5 * max(2.0, floor(0.46 * q + 0.5));
    side = vSub > 1.5 ? 2.0 * q : q;
  }
  float h = side * 0.5;
  float J00 = (ra * n.x * n.x + tb * n.y * n.y) * k;
  float J01 = (ra - tb) * nxy * k;
  float J10 = (ra - tb) * nxy;
  float J11 = ra * n.y * n.y + tb * n.x * n.x;
  vec2 bound = vec2(abs(J00) + abs(J01), abs(J10) + abs(J11)) * h + 1.5 + fl;
  if (chip || focus) bound += vec2(3.0 * uChipGlow * dk);
  vec2 pos = cm + aCorner * bound;
  gl_Position = a < 1.0 / 255.0
    ? vec4(2.0, 2.0, 2.0, 1.0)
    : vec4(pos.x / uViewport.x * 2.0 - 1.0, 1.0 - pos.y / uViewport.y * 2.0, 0.0, 1.0);
  vC = cm;
  vR0 = r0;
  vR1 = r1;
  vG = vec2(length(r0), length(r1));
  vH = h;
  vFr = n * fl;
  vCol = vec4(col, a);
  vDk = dk;
  vGlow = uChipGlow / max(ra, 1e-3);
  vChip = chip ? 1 : (focus ? 2 : 0);
}
`,
        eV = `${eT}${eD}${e$}
flat in vec2 vC;
flat in vec2 vR0;
flat in vec2 vR1;
flat in vec2 vG;
flat in vec2 vFr;
flat in float vH;
flat in vec4 vCol;
flat in float vDk;
flat in float vGlow;
flat in int vChip;
flat in float vFine;
flat in float vFineH;
flat in float vSub;
uniform float uChipBoost;  // glow pulse as a packet arrives
out vec4 outColor;

const vec3 CHIP_TOP = ${(0, ek.y)(ek.a[0]?.[1] ?? "#1FCBFF")};
const vec3 CHIP_BOTTOM = ${(0, ek.y)(ek.a[1]?.[1] ?? "#FFE21C")};

float plusCov(vec2 l, float h) {
  float stroke = max(h * 0.30, 0.48 * uDpr);
  float horizontal = cov1(l.x / vG.x, h / vG.x) * cov1(l.y / vG.y, stroke / vG.y);
  float vertical = cov1(l.x / vG.x, stroke / vG.x) * cov1(l.y / vG.y, h / vG.y);
  return max(horizontal, vertical);
}
float shapeCov(vec2 o) {
  vec2 l = vec2(dot(vR0, o), dot(vR1, o));
  float box = cov1(l.x / vG.x, vH / vG.x) * cov1(l.y / vG.y, vH / vG.y);
  if (vChip > 0) return box;
  if (vFine > 0.0) {
    if (vSub < 1.5) return plusCov(l, vFineH);
    float d = 0.5 * vFine;
    return max(
      max(plusCov(l - vec2(-d, -d), vFineH), plusCov(l - vec2(d, -d), vFineH)),
      max(plusCov(l - vec2(-d, d), vFineH), plusCov(l - vec2(d, d), vFineH)));
  }
  return plusCov(l, vH);
}
// erf (Abramowitz–Stegun 7.1.26 style), for the gaussian-blurred chip copy.
float erf1(float x) {
  float s = sign(x);
  float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return s * y;
}
float blurBox(float d, float h, float sigma) {
  float k = 1.0 / (sigma * 1.41421356);
  return 0.5 * (erf1((d + h) * k) - erf1((d - h) * k));
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);
  vec2 o = px - vC;
  if (vChip > 0) {
    // The chip: a sharp square over its blurred copy (dark), or the
    // cyan-to-yellow tile with no glow (light).
    vec2 l = vec2(dot(vR0, o), dot(vR1, o));
    float cov = shapeCov(o);
    float glow = vDk * 0.9 * (1.0 + uChipBoost) * blurBox(l.x, vH, vGlow) * blurBox(l.y, vH, vGlow);
    float t = clamp((l.y + vH) / (2.0 * vH), 0.0, 1.0);
    vec3 col = mix(vec3(0.24, 0.22, 0.20), vec3(0.969, 0.965, 0.945), vDk);
    float a = (cov + (1.0 - cov) * glow) * vCol.a;
    if (a <= 0.0) discard;
    outColor = vec4(col * a, a);
    return;
  }
  // Per-channel coverage, composited against the known background.
  vec3 cov = vec3(shapeCov(o - vFr), shapeCov(o), shapeCov(o + vFr)) * vCol.a;
  float a = max(cov.r, max(cov.g, cov.b));
  if (a <= 0.0) discard;
  vec3 B = bgColor(px);
  outColor = vec4(cov * vCol.rgb + (a - cov) * B, a);
}
`;
      class eW {
        viewport = new Float32Array(2);
        origin = new Float32Array(2);
        pitch = 24;
        dpr = 1;
        lensC = new Float32Array(2);
        lensR = 1;
        lensA = 0;
        lensS = 0;
        rimS = 0;
        waveT = 1e4;
        waveV = 1;
        waveFlip = 0.16;
        waveJitter = 0.08;
        waveFade = 0;
        waveO = new Float32Array(2);
        darkOld = 1;
        darkNew = 1;
        time = 0;
        horizonY = 0;
        horizonX = 0;
        horizonHalf = 0;
        lineW = 1;
        lineA = 0;
        bandA = 0;
        fogA = 0;
        corrL = 0;
        corrR = 0;
        q = 0;
        qdot = 0;
        d = 0.5;
        fringe = 0.4;
        twinkle = 1;
        sceneAlpha = 1;
        wallFade = 1;
        plumeAlpha = 1;
        docY = 0;
        snapK = 0;
        chip = new Float32Array(3);
        chipGlow = 0;
        chipA = 1;
        pivot = new Float32Array(2);
        trail = new Float32Array(144);
        trailN = 0;
        snap = 0;
        base = 0;
        baseC = new Float32Array(2);
        baseR = 1;
        clear = new Float32Array(32);
        clearN = 0;
        hi = new Float32Array(32);
        bgMode = 0;
        overlay = new Float32Array(4096);
        routeN = 0;
        packetN = 0;
        anchorGain = 0;
        chipBoost = 0;
        scissor = new Int32Array(4);
        clearColor = new Float32Array(3);
      }
      function eY(e, t, a) {
        let i = e.createShader(t);
        if (!i) throw Error("d1: createShader failed");
        if (
          (e.shaderSource(i, a),
          e.compileShader(i),
          !e.getShaderParameter(i, e.COMPILE_STATUS) && !e.isContextLost())
        ) {
          let t = e.getShaderInfoLog(i) ?? "";
          throw (
            e.deleteShader(i),
            Error(`d1: shader compile failed
${t}`)
          );
        }
        return i;
      }
      function eX(e, t, a) {
        let i = e.createProgram(),
          r = eY(e, e.VERTEX_SHADER, t),
          n = eY(e, e.FRAGMENT_SHADER, a);
        if (
          (e.attachShader(i, r),
          e.attachShader(i, n),
          e.linkProgram(i),
          e.deleteShader(r),
          e.deleteShader(n),
          !e.getProgramParameter(i, e.LINK_STATUS) && !e.isContextLost())
        ) {
          let t = e.getProgramInfoLog(i) ?? "";
          throw (
            e.deleteProgram(i),
            Error(`d1: program link failed
${t}`)
          );
        }
        return i;
      }
      class eU {
        gl;
        dots;
        bg;
        dotVao;
        bgVao;
        quad;
        instances;
        gradient;
        dotLoc;
        bgLoc;
        count;
        rects;
        rectVao;
        overlay;
        rectViewport;
        constructor(e) {
          ((this.gl = e),
            (this.dotLoc = new Map()),
            (this.bgLoc = new Map()),
            (this.count = 0),
            (this.dots = eX(e, eq, eV)),
            (this.bg = eX(e, eI, eB)),
            (this.dotVao = e.createVertexArray()),
            e.bindVertexArray(this.dotVao),
            (this.quad = e.createBuffer()),
            e.bindBuffer(e.ARRAY_BUFFER, this.quad),
            e.bufferData(
              e.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
              e.STATIC_DRAW,
            ),
            e.enableVertexAttribArray(0),
            e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0),
            (this.instances = e.createBuffer()),
            e.bindBuffer(e.ARRAY_BUFFER, this.instances));
          for (let t = 0; t < 3; t += 1)
            (e.enableVertexAttribArray(1 + t),
              e.vertexAttribPointer(1 + t, 4, e.FLOAT, !1, 48, 16 * t),
              e.vertexAttribDivisor(1 + t, 1));
          for (let t of (e.bindVertexArray(null),
          (this.bgVao = e.createVertexArray()),
          (this.gradient = e.createTexture()),
          e.bindTexture(e.TEXTURE_2D, this.gradient),
          e.texImage2D(
            e.TEXTURE_2D,
            0,
            e.RGBA8,
            ek.Y,
            ek.J.length,
            0,
            e.RGBA,
            e.UNSIGNED_BYTE,
            (0, ek.s)(),
          ),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE),
          e.disable(e.DEPTH_TEST),
          e.disable(e.CULL_FACE),
          (this.rects = eX(e, ez, eG)),
          (this.rectViewport = e.getUniformLocation(this.rects, "uViewport")),
          (this.rectVao = e.createVertexArray()),
          e.bindVertexArray(this.rectVao),
          e.bindBuffer(e.ARRAY_BUFFER, this.quad),
          e.enableVertexAttribArray(0),
          e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0),
          (this.overlay = e.createBuffer()),
          e.bindBuffer(e.ARRAY_BUFFER, this.overlay),
          e.bufferData(e.ARRAY_BUFFER, 16384, e.DYNAMIC_DRAW),
          [1, 2]))
            (e.enableVertexAttribArray(t), e.vertexAttribDivisor(t, 1));
          e.bindVertexArray(null);
        }
        upload(e, t) {
          let a = this.gl;
          (a.bindBuffer(a.ARRAY_BUFFER, this.instances),
            a.bufferData(a.ARRAY_BUFFER, e, a.STATIC_DRAW),
            (this.count = t));
        }
        render(e) {
          let t = this.gl,
            a = e.viewport[0] ?? 1,
            i = e.viewport[1] ?? 1;
          (t.viewport(0, 0, a, i),
            t.disable(t.SCISSOR_TEST),
            t.clearColor(
              e.clearColor[0] ?? 0,
              e.clearColor[1] ?? 0,
              e.clearColor[2] ?? 0,
              1,
            ),
            t.clear(t.COLOR_BUFFER_BIT),
            0 !== e.bgMode &&
              (t.disable(t.BLEND),
              1 === e.bgMode &&
                (t.enable(t.SCISSOR_TEST),
                t.scissor(
                  e.scissor[0] ?? 0,
                  e.scissor[1] ?? 0,
                  e.scissor[2] ?? 0,
                  e.scissor[3] ?? 0,
                )),
              t.useProgram(this.bg),
              this.common(this.bg, this.bgLoc, e),
              t.bindVertexArray(this.bgVao),
              t.drawArrays(t.TRIANGLES, 0, 3),
              t.disable(t.SCISSOR_TEST)),
            t.enable(t.BLEND),
            t.blendFunc(t.ONE, t.ONE_MINUS_SRC_ALPHA));
          let r = Math.min(512, e.routeN + e.packetN);
          if (
            (r > 0 &&
              (t.bindBuffer(t.ARRAY_BUFFER, this.overlay),
              t.bufferSubData(t.ARRAY_BUFFER, 0, e.overlay, 0, 8 * r)),
            e.routeN > 0 && this.drawRects(e, 0, e.routeN),
            0 === this.count)
          )
            return;
          t.useProgram(this.dots);
          let n = this.dotLoc;
          this.common(this.dots, n, e);
          let l = (e) => this.location(this.dots, n, e);
          (t.uniform1f(l("uQ"), e.q),
            t.uniform1f(l("uQdot"), e.qdot),
            t.uniform1f(l("uD"), e.d),
            t.uniform1f(l("uFringe"), e.fringe),
            t.uniform1f(l("uTwinkle"), e.twinkle),
            t.uniform1f(l("uSceneAlpha"), e.sceneAlpha),
            t.uniform1f(l("uWallFade"), e.wallFade),
            t.uniform1f(l("uPlumeAlpha"), e.plumeAlpha),
            t.uniform1f(l("uDocY"), e.docY),
            t.uniform1f(l("uSnapK"), e.snapK),
            t.uniform3fv(l("uChip"), e.chip),
            t.uniform1f(l("uChipGlow"), e.chipGlow),
            t.uniform1f(l("uChipA"), e.chipA),
            t.uniform2fv(l("uPivot"), e.pivot),
            t.uniform1f(l("uSnap"), e.snap),
            t.uniform4fv(l("uClear"), e.clear),
            t.uniform1i(l("uClearN"), e.clearN),
            t.uniform1fv(l("uHi"), e.hi),
            t.uniform3fv(l("uTrail"), e.trail),
            t.uniform1i(l("uTrailN"), e.trailN),
            t.uniform1f(l("uAnchorGain"), e.anchorGain),
            t.uniform1f(l("uChipBoost"), e.chipBoost),
            t.activeTexture(t.TEXTURE0),
            t.bindTexture(t.TEXTURE_2D, this.gradient),
            t.uniform1i(l("uGrad"), 0),
            t.bindVertexArray(this.dotVao),
            t.drawArraysInstanced(t.TRIANGLE_STRIP, 0, 4, this.count),
            t.bindVertexArray(null),
            e.packetN > 0 &&
              this.drawRects(e, e.routeN, Math.min(e.packetN, 512 - e.routeN)));
        }
        drawRects(e, t, a) {
          if (a <= 0) return;
          let i = this.gl;
          (i.useProgram(this.rects),
            i.uniform2fv(this.rectViewport, e.viewport),
            i.bindVertexArray(this.rectVao),
            i.bindBuffer(i.ARRAY_BUFFER, this.overlay),
            i.vertexAttribPointer(1, 4, i.FLOAT, !1, 32, 32 * t),
            i.vertexAttribPointer(2, 4, i.FLOAT, !1, 32, 32 * t + 16),
            i.drawArraysInstanced(i.TRIANGLE_STRIP, 0, 4, a),
            i.bindVertexArray(null));
        }
        dispose() {
          let e = this.gl;
          (e.deleteProgram(this.dots),
            e.deleteProgram(this.bg),
            e.deleteVertexArray(this.dotVao),
            e.deleteVertexArray(this.bgVao),
            e.deleteBuffer(this.quad),
            e.deleteBuffer(this.instances),
            e.deleteTexture(this.gradient),
            e.deleteProgram(this.rects),
            e.deleteVertexArray(this.rectVao),
            e.deleteBuffer(this.overlay));
        }
        location(e, t, a) {
          let i = t.get(a);
          return (
            void 0 === i &&
              ((i = this.gl.getUniformLocation(e, a)), t.set(a, i)),
            i
          );
        }
        common(e, t, a) {
          let i = this.gl,
            r = (a) => this.location(e, t, a);
          (i.uniform2fv(r("uViewport"), a.viewport),
            i.uniform2fv(r("uOrigin"), a.origin),
            i.uniform1f(r("uPitch"), a.pitch),
            i.uniform1f(r("uDpr"), a.dpr),
            i.uniform2fv(r("uLensC"), a.lensC),
            i.uniform1f(r("uLensR"), a.lensR),
            i.uniform1f(r("uLensA"), a.lensA),
            i.uniform1f(r("uLensS"), a.lensS),
            i.uniform1f(r("uRimS"), a.rimS),
            i.uniform1f(r("uWaveT"), a.waveT),
            i.uniform1f(r("uWaveV"), a.waveV),
            i.uniform1f(r("uWaveFlip"), a.waveFlip),
            i.uniform1f(r("uWaveJitter"), a.waveJitter),
            i.uniform1f(r("uWaveFade"), a.waveFade),
            i.uniform2fv(r("uWaveO"), a.waveO),
            i.uniform1f(r("uDarkOld"), a.darkOld),
            i.uniform1f(r("uDarkNew"), a.darkNew),
            i.uniform1f(r("uTime"), a.time),
            i.uniform1f(r("uHorizonY"), a.horizonY),
            i.uniform1f(r("uHorizonX"), a.horizonX),
            i.uniform1f(r("uHorizonHalf"), a.horizonHalf),
            i.uniform1f(r("uLineW"), a.lineW),
            i.uniform1f(r("uLineA"), a.lineA),
            i.uniform1f(r("uBandA"), a.bandA),
            i.uniform1f(r("uFogA"), a.fogA),
            i.uniform1f(r("uCorrL"), a.corrL),
            i.uniform1f(r("uCorrR"), a.corrR),
            i.uniform1f(r("uBase"), a.base),
            i.uniform2fv(r("uBaseC"), a.baseC),
            i.uniform1f(r("uBaseR"), a.baseR));
        }
      }
      class eK {
        canvas;
        opts;
        gl;
        renderer = null;
        field = null;
        u = new eW();
        listeners = [];
        layout = {
          sceneLength: 0,
          bar: null,
          caret: null,
          footer: null,
          card: null,
          clearings: [],
        };
        theme;
        raf = 0;
        last = -1;
        time = 0;
        frames = 0;
        disposed = !1;
        needsBuild = !0;
        cssW = 1;
        cssH = 1;
        k = 1;
        pitchCss = 24;
        P = 24;
        history = new Float64Array(96);
        trail = new Float64Array(144);
        trailHead = 0;
        trailN = 0;
        trailLive = !1;
        historyN = 0;
        historyHead = 0;
        px = 0;
        py = 0;
        hasPointer = !1;
        overField = !1;
        touch = !1;
        lensX = (0, h.y)();
        lensY = (0, h.y)();
        lensTx = 0;
        lensTy = 0;
        strength = (0, h.y)();
        scene = (0, h.y)();
        lensR = 1;
        lensA = 0;
        dwell = 0;
        qd = 0;
        settle = 0;
        focus = -1;
        anchorX = 0;
        anchorY = 0;
        pinned = !1;
        hold = !1;
        leave = 0;
        switchSettle = 0;
        safe = 0;
        apexX = 0;
        apexY = 0;
        warmUntil = -1;
        warmDwell = !1;
        lensMode = 0;
        retX = (0, h.y)();
        retY = (0, h.y)();
        retH = (0, h.y)();
        retLive = !1;
        chipOpen = !1;
        chipOver = !1;
        chipLive = !1;
        chipHoverS = (0, h.y)();
        routeT = 0;
        routeMoved = !1;
        routeCount = 0;
        routePts = new Float64Array(384);
        routeNPts = new Int32Array(48);
        routeLen = new Float64Array(48);
        routeDrawn = new Float64Array(48);
        segs = new Float64Array(576);
        packetRoute = new Int32Array(24);
        packetS = new Float64Array(24);
        packetN = 0;
        spawnClock = 0;
        pulseLevel = 0;
        pulseAmp = 0.15;
        rectN = 0;
        signalPivot = { x: 0, y: 0 };
        signalRoute = new Int16Array(2400);
        downId = -1;
        downX = 0;
        downY = 0;
        downChip = !1;
        gate = 1;
        dirty = !0;
        targetW = 0;
        targetH = 0;
        lastScroll = 0;
        snapK = 0;
        locked = !1;
        hiTarget = new Float32Array(32);
        wave = null;
        tmp = { x: 0, y: 0 };
        dwellFrame = {
          x: 0,
          y: 0,
          half: 0,
          progress: 0,
          opacity: 0,
          cluster: -1,
        };
        state = {
          time: 0,
          scene: 0,
          hero: 1,
          bar: { t: 0, scale: 0.08, dy: 0, blur: 0, opacity: 0, locked: !1 },
          chip: { x: 0, y: 0, side: 0 },
          secondaryFocus: { x: 0, y: 0 },
          chipDocked: !1,
          chipHover: 0,
          dwell: null,
        };
        constructor(e) {
          ((this.opts = e), (this.canvas = e.canvas), (this.theme = e.theme));
          let t = +("dark" === e.theme);
          ((this.u.darkOld = t),
            (this.u.darkNew = t),
            (this.gl = this.canvas.getContext("webgl2", {
              alpha: !1,
              antialias: !1,
              depth: !1,
              stencil: !1,
              premultipliedAlpha: !0,
            })));
        }
      }
      function eQ(e, t, a, i, r, n = 0) {
        let l = 12 * a,
          o = e.data,
          s = Math.max(1, Math.round((o[l + 4] ?? 0) * t)),
          c = Math.floor((t - s) / 2) + s / 2;
        return (
          (r.x = e.originX + (o[l + 2 * !!i] ?? 0) * t + c),
          (r.y = e.originY + (o[l + (i ? 3 : 1)] ?? 0) * t + c),
          i || e5(e, a, n, r),
          s
        );
      }
      function eJ(e, t) {
        let a = e.vortexRadius / 28;
        return (
          (t.x = e.chipX + (156.5 / 22) * a),
          (t.y = e.chipY - (140.5 / 22) * a),
          t
        );
      }
      let eZ = { x: 0, y: 0 },
        e1 = { x: 0, y: 0 };
      function e2(e, t, a) {
        eJ(e, eZ);
        let i = (2 * t * Math.PI) / 120,
          r = a.x - eZ.x,
          n = a.y - eZ.y;
        ((a.x = eZ.x + Math.cos(i) * r - Math.sin(i) * n),
          (a.y = eZ.y + Math.sin(i) * r + Math.cos(i) * n));
        let l = Math.floor(e.vortexRadius / 28 / 2);
        ((a.x = e.originX + (Math.floor((a.x - e.originX) / l) + 0.5) * l),
          (a.y = e.originY + (Math.floor((a.y - e.originY) / l) + 0.5) * l));
      }
      function e5(e, t, a, i) {
        let r = 12 * t,
          n = e.data[r + 6] ?? 0;
        if (0 === a || 13 & n) return 1;
        let l = e.vortexRadius / 28,
          o = Math.max(1, Math.round((e.data[r + 4] ?? 0) * l)),
          s = i ?? e1;
        if (!i) {
          let t = Math.floor((l - o) / 2) + o / 2;
          ((s.x = e.originX + (e.data[r] ?? 0) * l + t),
            (s.y = e.originY + (e.data[r + 1] ?? 0) * l + t));
        }
        if ((e2(e, a, s), 64 & n)) return 1;
        let c = e.data[r + 7] ?? 0;
        eJ(e, eZ);
        let d =
          (((a / 24 -
            Math.atan2(s.y - eZ.y, s.x - eZ.x) / (2 * Math.PI) +
            0.01 *
              (Math.hypot(s.x - eZ.x, s.y - eZ.y) / (e.vortexRadius / 28)) +
            0.02 * c) %
            1) +
            1) %
          1;
        return (0, h.j)(0, 0.08, d) * (1 - (0, h.j)(0.8, 0.9, d));
      }
      function e0(e, t, a, i) {
        let r = e.vortexRadius / 28;
        ((i.x = e.chipX + ((313 * a) / 22) * r),
          (i.y = e.chipY - ((281 * a) / 22) * r),
          e2(e, t, i));
      }
      let e4 = (0, h.a)(0.65, 0, 0.35, 1),
        e3 = (e, t, a) => {
          let i = 43758.5453 * Math.sin(127.1 * e + 311.7 * t + 74.7 * a);
          return i - Math.floor(i);
        },
        e6 = (0, h.a)(0.4, 0, 0.2, 1),
        e8 = (e) => e * e * e * (e * (6 * e - 15) + 10);
      function e7(e, t, a, i, r) {
        let n = (a - t) / r,
          l = e.x - t + (2 * n) / i,
          o = e.v - n,
          s = o + i * l,
          c = Math.exp(-i * r);
        ((e.x = a + (l + s * r) * c - (2 * n) / i),
          (e.v = (o - i * s * r) * c + n));
      }
      let e9 = (e, t) => e[t] ?? 0,
        te = (e, t, a) => e + (t - e) * a;
      class tt extends eK {
        onPointerMove = (e) => {
          ((this.px = e.clientX),
            (this.py = e.clientY),
            (this.hasPointer = !0),
            (this.touch = "touch" === e.pointerType),
            (this.overField = e.target === this.canvas),
            this.touch || (this.pinned = !1));
          let t = 3 * this.historyHead;
          if (
            ((this.history[t] = e.timeStamp / 1e3),
            (this.history[t + 1] = e.clientX),
            (this.history[t + 2] = e.clientY),
            (this.historyHead = (this.historyHead + 1) % 32),
            (this.historyN = Math.min(32, this.historyN + 1)),
            this.overField && !this.touch)
          ) {
            let t = ((this.trailHead - 1 + 48) % 48) * 3;
            if (
              0 === this.trailN ||
              Math.hypot(
                e.clientX - (this.trail[t + 1] ?? 0),
                e.clientY - (this.trail[t + 2] ?? 0),
              ) >= 12
            ) {
              let t = 3 * this.trailHead;
              ((this.trail[t] = this.time),
                (this.trail[t + 1] = e.clientX),
                (this.trail[t + 2] = e.clientY),
                (this.trailHead = (this.trailHead + 1) % 48),
                (this.trailN = Math.min(48, this.trailN + 1)));
            }
          }
        };
        onPointerLeave = () => {
          ((this.overField = !1), (this.hasPointer = !1));
        };
        onPointerDown = (e) => {
          ((this.downId = e.pointerId),
            (this.downX = e.clientX),
            (this.downY = e.clientY),
            (this.downChip =
              this.chipLive && this.chipHit(e.clientX, e.clientY)));
        };
        onPointerCancel = () => {
          this.downId = -1;
        };
        onPointerUp = (e) => {
          if (e.pointerId !== this.downId) return;
          this.downId = -1;
          let t = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
          if (this.downChip) {
            t <= 6 &&
              this.chipLive &&
              this.chipHit(e.clientX, e.clientY) &&
              this.emitChip("click");
            return;
          }
          if (("touch" !== e.pointerType && !this.opts.reducedMotion) || t > 8)
            return;
          let a =
            this.gate >= 0.5 && this.wallsSettled()
              ? this.nearestClustered(
                  e.clientX * this.k,
                  e.clientY * this.k,
                  this.P,
                  this.u.q > 0.5,
                )
              : -1;
          a >= 0
            ? ((this.focus = a), this.open(!0))
            : 2 === this.dwell && this.blur();
        };
        wallsSettled() {
          let e = this.u.q;
          return e < 0.01 || (e > 0.99 && this.u.wallFade > 0.99);
        }
        chipHit(e, t) {
          if (this.u.chipA < 0.15) return !1;
          let a = this.state.chip,
            i = a.side / 2 + 6;
          return Math.abs(e - a.x) <= i && Math.abs(t - a.y) <= i;
        }
        syncCursor() {
          this.canvas.style.cursor = this.chipOver ? "pointer" : "";
        }
        emitChip(e) {
          let t = this.state.chip;
          this.opts.onChip?.({ type: e, x: t.x, y: t.y, side: t.side });
        }
        pointerSpeed(e) {
          if (this.historyN < 2) return 0;
          let t = ((this.historyHead - 1 + 32) % 32) * 3,
            a = this.history[t + 1] ?? 0,
            i = this.history[t + 2] ?? 0,
            r = e - 0.15,
            n = a,
            l = i;
          for (let e = 1; e <= this.historyN; e += 1) {
            let t = ((this.historyHead - e + 32) % 32) * 3;
            if (
              ((n = this.history[t + 1] ?? a),
              (l = this.history[t + 2] ?? i),
              (this.history[t] ?? 0) <= r)
            )
              break;
          }
          return Math.hypot(a - n, i - l) / 0.15;
        }
        nearestClustered(e, t, a, i) {
          let r = this.field;
          if (!r) return -1;
          if (!i) {
            let i = -1,
              n = a,
              l = this.opts.reducedMotion ? 0 : this.time;
            for (let a = r.sceneStart; a < r.sceneEnd; a += 1) {
              if ((r.data[12 * a + 9] ?? -1) < 0 || 0.3 > e5(r, a, l)) continue;
              eQ(r, this.P, a, !1, this.tmp, l);
              let o = Math.hypot(this.tmp.x - e, this.tmp.y - t);
              o <= n && ((i = a), (n = o));
            }
            return i;
          }
          let n = r.wallGrid,
            l = Math.floor((e - r.originX) / this.P),
            o = Math.floor((t - r.originY) / this.P),
            s = -1,
            c = a;
          for (let a = -1; a <= 1; a += 1)
            for (let d = -1; d <= 1; d += 1) {
              let u = l + d,
                h = o + a;
              if (u < 0 || h < 0 || u >= r.cols || h >= r.rows) continue;
              let f = n[h * r.cols + u] ?? -1;
              if (f < 0 || (r.data[12 * f + 9] ?? -1) < 0) continue;
              eQ(r, this.P, f, i, this.tmp);
              let b = Math.hypot(this.tmp.x - e, this.tmp.y - t);
              b <= c && ((c = b), (s = f));
            }
          return s;
        }
      }
      class ta extends tt {
        inSafeTriangle() {
          let e = this.layout.card;
          if (!e) return !1;
          let t = e.x - 8,
            a = e.y - 8,
            i = e.x + e.width + 8,
            r = e.y + e.height + 8,
            n = this.apexX,
            l = this.apexY,
            o = this.px,
            s = this.py;
          if (o >= t && o <= i && s >= a && s <= r) return !0;
          if (n >= t && n <= i && l >= a && l <= r) return !1;
          let c = Math.atan2((a + r) / 2 - l, (t + i) / 2 - n),
            d = 1 / 0,
            u = -1 / 0,
            h = 0,
            f = 0,
            b = 0,
            m = 0;
          for (let e = 0; e < 4; e += 1) {
            let o = 1 & e ? i : t,
              s = 2 & e ? r : a,
              p = Math.atan2(s - l, o - n) - c;
            (p > Math.PI && (p -= 2 * Math.PI),
              p < -Math.PI && (p += 2 * Math.PI),
              p < d && ((d = p), (h = o), (f = s)),
              p > u && ((u = p), (b = o), (m = s)));
          }
          let p = (o - h) * (l - f) - (n - h) * (s - f),
            g = (o - b) * (f - m) - (h - b) * (s - m),
            v = (o - n) * (m - l) - (b - n) * (s - l);
          return !((p < 0 || g < 0 || v < 0) && (p > 0 || g > 0 || v > 0));
        }
        pickInLens(e, t) {
          let a = this.lensX.x,
            i = this.lensY.x,
            r = this.px * this.k - a,
            n = this.py * this.k - i,
            l = Math.hypot(r, n),
            o =
              l > 1e-6
                ? (function (e, t, a) {
                    let i = e / (1 + a);
                    for (let r = 0; r < 5; r += 1) {
                      let r = i / t;
                      if (r >= 1) return e;
                      let n = 1 - r * r,
                        l = Math.sqrt(n);
                      i = Math.min(
                        1.5 * t,
                        Math.max(
                          0,
                          i -
                            (i * (1 + a * n * n * l) - e) /
                              (1 + a * n * l * (1 - 6 * r * r)),
                        ),
                      );
                    }
                    return i;
                  })(l, this.lensR, this.lensA)
                : 0,
            s = l > 1e-6 ? o / l : 0;
          return this.nearestClustered(a + r * s, i + n * s, e, t);
        }
        focusScreen(e) {
          let t = this.field;
          if (!t || this.focus < 0) return 0;
          let a = eQ(
              t,
              this.P,
              this.focus,
              e,
              this.tmp,
              this.opts.reducedMotion ? 0 : this.time,
            ),
            i = this.tmp.x - this.lensX.x,
            r = this.tmp.y - this.lensY.x,
            n = ((e, t) => {
              if (e >= 1) return 1;
              let a = 1 - e * e;
              return 1 + t * a * a * Math.sqrt(a);
            })(Math.hypot(i, r) / this.lensR, this.lensA);
          return (
            (this.tmp.x = this.lensX.x + i * n),
            (this.tmp.y = this.lensY.x + r * n),
            a * n
          );
        }
        open(e, t = !1) {
          this.field &&
            !(this.focus < 0) &&
            ((this.dwell = 2),
            (this.qd = 1),
            (this.pinned = e),
            (this.leave = 0),
            (this.safe = 0),
            (this.switchSettle = 0),
            (this.apexX = this.px),
            (this.apexY = this.py),
            this.announce(t));
        }
        announce(e) {
          let t = this.field;
          if (!t || this.focus < 0) return;
          let a = this.u.q > 0.5;
          eQ(
            t,
            this.P,
            this.focus,
            a,
            this.tmp,
            this.opts.reducedMotion ? 0 : this.time,
          );
          let i = null;
          if (a) {
            let e = this.canvas.width,
              a = this.tmp.x < e / 2,
              r = a
                ? t.originX + t.wallCols * this.P
                : e - (t.originX + (t.cols - t.wallCols) * this.P),
              n = a ? this.tmp.x : e - this.tmp.x;
            i = { left: a, t: (0, h.O)(n / Math.max(1, r)) };
          }
          let r = 12 * this.focus,
            n = t.data[r + 9] ?? -1,
            l = this.tmp.x / this.k,
            o = this.tmp.y / this.k;
          this.opts.onFocus({
            cluster: n,
            x: l,
            y: o,
            color: (0, ek.j)(
              this.theme,
              t.data[r + 8] ?? 0.5,
              (0, h.O)(l / this.cssW),
              i,
            ),
            switched: e,
          });
        }
        blur() {
          ((this.dwell = 4),
            (this.warmUntil = this.time + 1.2),
            (this.pinned = !1),
            this.opts.onBlur());
        }
        updateDwell(e, t, a) {
          let i = this.u.q,
            r =
              !0 === this.opts.hoverReveal &&
              this.opts.showcaseCount > 0 &&
              !this.opts.reducedMotion &&
              !this.touch &&
              !this.chipOver &&
              a > 0.5 &&
              this.wallsSettled();
          switch (this.dwell) {
            case 0: {
              if (!r || !this.overField || !this.hasPointer) {
                this.settle = 0;
                break;
              }
              this.settle = t < 15 ? this.settle + e : 0;
              let a = this.time < this.warmUntil;
              if (this.settle >= (a ? 0.06 : 0.08)) {
                let e = this.pickInLens(0.8 * this.P, i > 0.5);
                e >= 0 &&
                  ((this.settle = 0),
                  (this.focus = e),
                  (this.dwell = 1),
                  (this.warmDwell = a),
                  (this.qd = 0),
                  (this.anchorX = this.px),
                  (this.anchorY = this.py));
              }
              break;
            }
            case 1: {
              let a = Math.hypot(
                this.px - this.anchorX,
                this.py - this.anchorY,
              );
              if (!r || !this.overField || a > 14 || t > 120) {
                this.dwell = 3;
                break;
              }
              ((this.qd = Math.min(
                1,
                this.qd + e / (this.warmDwell ? 0.22 : 0.9),
              )),
                this.qd >= 1 && this.open(!1, this.warmDwell));
              break;
            }
            case 2: {
              if (a < 0.5) {
                this.blur();
                break;
              }
              if (this.hold || this.pinned) {
                ((this.leave = 0), (this.safe = 0), (this.switchSettle = 0));
                break;
              }
              let r =
                this.overField && this.hasPointer
                  ? this.pickInLens(0.6 * this.P, i > 0.5)
                  : -1;
              if (r >= 0) {
                ((this.leave = 0),
                  (this.safe = 0),
                  r === this.focus &&
                    ((this.apexX = this.px), (this.apexY = this.py)),
                  (this.switchSettle =
                    r !== this.focus && t < 40 ? this.switchSettle + e : 0),
                  this.switchSettle >= 0.14 &&
                    ((this.switchSettle = 0),
                    (this.focus = r),
                    (this.apexX = this.px),
                    (this.apexY = this.py),
                    this.announce(!0)));
                break;
              }
              if (((this.switchSettle = 0), t >= 40 && this.inSafeTriangle())) {
                ((this.safe += e),
                  (this.leave = 0),
                  this.safe >= 0.45 && this.blur());
                break;
              }
              ((this.leave += e), this.leave >= 0.1 && this.blur());
              break;
            }
            case 3:
              ((this.qd -= e / 0.2),
                this.qd <= 0 &&
                  ((this.qd = 0), (this.focus = -1), (this.dwell = 0)));
              break;
            case 4:
              ((this.qd = Math.max(0, this.qd - e / 0.2)),
                this.qd <= 0 && ((this.focus = -1), (this.dwell = 0)));
          }
        }
      }
      class ti extends ta {
        updateChip(e, t, a, i) {
          let r = this.u;
          this.chipLive =
            void 0 !== this.opts.onChip && !i && a < 0.02 && !this.locked;
          let n =
            this.chipLive &&
            this.hasPointer &&
            this.overField &&
            !this.touch &&
            this.chipHit(this.px, this.py);
          n !== this.chipOver &&
            ((this.chipOver = n),
            this.syncCursor(),
            this.emitChip(n ? "enter" : "leave"));
          let l = +!!n;
          ((0, h.R)(this.chipHoverS, l, 18, t),
            0.001 > Math.abs(this.chipHoverS.x - l) &&
              0.001 > Math.abs(this.chipHoverS.v) &&
              ((this.chipHoverS.x = l), (this.chipHoverS.v = 0)));
          let o = a < 0.02,
            s = Math.min(e.routes.length, 48),
            c = 0.24 + 0.025 * Math.max(0, s - 1),
            d = this.routeT;
          (i
            ? (this.routeT = o ? c : 0)
            : o
              ? (this.routeT = Math.min(c, this.routeT + t))
              : (this.routeT = Math.max(0, this.routeT - (0.24 * t) / 0.14)),
            (this.routeMoved = this.routeT !== d));
          let u = Math.max(
            (0, h.O)(this.chipHoverS.x),
            this.chipOpen && o ? 1 : 0,
          );
          if (
            ((r.anchorGain = 0.15 * u),
            (this.pulseLevel = Math.max(0, this.pulseLevel - t / 0.22)),
            (r.chipBoost = this.pulseAmp * this.pulseLevel * this.pulseLevel),
            (r.routeN = 0),
            (r.packetN = 0),
            (this.rectN = 0),
            this.routeT <= 0)
          ) {
            ((this.packetN = 0), (this.routeCount = 0));
            return;
          }
          this.layRoutes(e, s);
          let f = 1 - (0, h.j)(0, 0.02, a),
            b = n || (this.chipOpen && o);
          (this.movePackets(
            t,
            o && !i,
            n ? 0.09 : b ? 0.18 : 0.7,
            b ? 24 : 4,
            te(0.7, 1, u),
            te(0.04, 0.15, u),
          ),
            this.writeOverlay(te(0.25, 1, u) * f, 0.9 * te(0.4, 1, u) * f));
        }
        layRoutes(e, t) {
          let a = this.P,
            i = this.k,
            r = this.state.chip,
            n = r.x * i,
            l = r.y * i,
            o = (r.side * i) / 2,
            s = e.originX + Math.round((n - e.originX) / a) * a,
            c = this.routePts;
          for (let i = 0; i < t; i += 1) {
            let t = e.routes[i] ?? -1,
              r = 8 * i;
            if (t < 0) {
              ((this.routeNPts[i] = 0),
                (this.routeLen[i] = 0),
                (this.routeDrawn[i] = 0));
              continue;
            }
            let d = eQ(
                e,
                a,
                t,
                !1,
                this.tmp,
                this.opts.reducedMotion ? 0 : this.time,
              ),
              u = this.tmp.x,
              f = this.tmp.y,
              b = l > f,
              m = e.data[12 * t + 1] ?? 0,
              p = e.originY + (m + +!!b) * a,
              g = Math.floor(u);
            ((c[r] = g),
              (c[r + 1] = b ? f + d / 2 : f - d / 2),
              (c[r + 2] = g),
              (c[r + 3] = p));
            let v = 3;
            (Math.abs(p - l) < o
              ? ((c[r + 4] = u < n ? n - o : n + o), (c[r + 5] = p))
              : ((c[r + 4] = s),
                (c[r + 5] = p),
                (c[r + 6] = s),
                (c[r + 7] = b ? l - o : l + o),
                (v = 4)),
              (this.routeNPts[i] = v));
            let x = 0;
            for (let e = 1; e < v; e += 1)
              x +=
                Math.abs(e9(c, r + 2 * e) - e9(c, r + 2 * e - 2)) +
                Math.abs(e9(c, r + 2 * e + 1) - e9(c, r + 2 * e - 1));
            this.routeLen[i] = x;
            let y = e6((0, h.O)((this.routeT - 0.025 * i) / 0.24));
            this.routeDrawn[i] = y * x;
          }
          this.routeCount = t;
        }
        routePoint(e, t) {
          let a = this.routePts,
            i = 8 * e,
            r = this.routeNPts[e] ?? 0,
            n = t;
          ((this.tmp.x = e9(a, i)), (this.tmp.y = e9(a, i + 1)));
          for (let e = 1; e < r; e += 1) {
            let t = e9(a, i + 2 * e - 2),
              r = e9(a, i + 2 * e - 1),
              l = e9(a, i + 2 * e),
              o = e9(a, i + 2 * e + 1),
              s = Math.abs(l - t) + Math.abs(o - r),
              c = s > 0 ? Math.min(1, n / s) : 1;
            if (
              ((this.tmp.x = t + (l - t) * c),
              (this.tmp.y = r + (o - r) * c),
              n <= s)
            )
              return;
            n -= s;
          }
        }
        movePackets(e, t, a, i, r, n) {
          let l = 14 * r * this.P * e;
          for (let e = 0; e < this.packetN;) {
            let t = this.packetRoute[e] ?? 0,
              a = (this.packetS[e] ?? 0) + l,
              i = a >= (this.routeLen[t] ?? 0);
            if (i || a > (this.routeDrawn[t] ?? 0)) {
              (i && ((this.pulseLevel = 1), (this.pulseAmp = n)),
                (this.packetN -= 1),
                (this.packetRoute[e] = this.packetRoute[this.packetN] ?? 0),
                (this.packetS[e] = this.packetS[this.packetN] ?? 0));
              continue;
            }
            ((this.packetS[e] = a), (e += 1));
          }
          if (!t || 0 === this.routeCount) {
            this.spawnClock = 0;
            return;
          }
          for (this.spawnClock += e; this.spawnClock >= a;)
            if (((this.spawnClock -= a), !(this.packetN >= i)))
              for (let e = 0; e < 4; e += 1) {
                let e = Math.floor(Math.random() * this.routeCount),
                  t = this.routeLen[e] ?? 0;
                if (t > 0 && (this.routeDrawn[e] ?? 0) >= t) {
                  ((this.packetRoute[this.packetN] = e),
                    (this.packetS[this.packetN] = 0),
                    (this.packetN += 1));
                  break;
                }
              }
        }
      }
      let tr = (0, ek.Z)(ek.h.light.fg),
        tn = (0, ek.Z)(ek.h.dark.fg);
      class tl extends ti {
        writeOverlay(e, t) {
          let a = this.u,
            i = this.segs,
            r = this.routePts,
            n = 0;
          for (let e = 0; e < this.routeCount; e += 1) {
            let t = 8 * e,
              a = this.routeNPts[e] ?? 0,
              l = this.routeDrawn[e] ?? 0;
            for (let e = 1; e < a && l > 0; e += 1) {
              let a = e9(r, t + 2 * e - 2),
                o = e9(r, t + 2 * e - 1),
                s = e9(r, t + 2 * e),
                c = e9(r, t + 2 * e + 1),
                d = Math.abs(s - a) + Math.abs(c - o),
                u = d > 0 ? Math.min(1, l / d) : 1;
              l -= d;
              let h = a + (s - a) * u,
                f = o + (c - o) * u,
                b = a === s,
                m = 4 * n;
              ((i[m] = +!!b),
                (i[m + 1] = b ? a : o),
                (i[m + 2] = b ? Math.min(o, f) : Math.min(a, h)),
                (i[m + 3] = b ? Math.max(o, f) : Math.max(a, h)),
                (n += 1));
            }
          }
          for (let e = 1; e < n; e += 1) {
            let t = e9(i, 4 * e),
              a = e9(i, 4 * e + 1),
              r = e9(i, 4 * e + 2),
              n = e9(i, 4 * e + 3),
              l = e - 1;
            for (; l >= 0;) {
              let e = e9(i, 4 * l),
                n = e9(i, 4 * l + 1),
                o = e9(i, 4 * l + 2);
              if (e < t || (e === t && (n < a || (n === a && o <= r)))) break;
              (i.copyWithin((l + 1) * 4, 4 * l, 4 * l + 4), (l -= 1));
            }
            ((i[(l + 1) * 4] = t),
              (i[(l + 1) * 4 + 1] = a),
              (i[(l + 1) * 4 + 2] = r),
              (i[(l + 1) * 4 + 3] = n));
          }
          let l = ("dark" === this.theme ? 0.22 : 0.18) * e;
          for (let e = 0; e < n;) {
            let t = 1 === e9(i, 4 * e),
              a = e9(i, 4 * e + 1),
              r = e9(i, 4 * e + 2),
              o = e9(i, 4 * e + 3),
              s = e + 1;
            for (
              ;
              s < n &&
              e9(i, 4 * s) === e9(i, 4 * e) &&
              0.5 > Math.abs(e9(i, 4 * s + 1) - a) &&
              e9(i, 4 * s + 2) <= o + 0.5;
            )
              ((o = Math.max(o, e9(i, 4 * s + 3))), (s += 1));
            (t
              ? this.putRect(a, r, a + 1, o + 1, l)
              : this.putRect(r, a, o + 1, a + 1, l),
              (e = s));
          }
          a.routeN = this.rectN;
          let o = (0.28 * this.P) / 2;
          for (let e = 0; e < this.packetN; e += 1) {
            this.routePoint(this.packetRoute[e] ?? 0, this.packetS[e] ?? 0);
            let a = this.tmp.x + 0.5,
              i = this.tmp.y + 0.5;
            this.putRect(a - o, i - o, a + o, i + o, t);
          }
          ((a.packetN = this.rectN - a.routeN),
            (a.routeN = 0),
            (a.packetN = 0),
            (this.rectN = 0));
        }
        putRect(e, t, a, i, r) {
          if (this.rectN >= 512) return;
          let n = this.u.overlay,
            l = "dark" === this.theme ? tn : tr,
            o = 8 * this.rectN;
          ((n[o] = e),
            (n[o + 1] = t),
            (n[o + 2] = a),
            (n[o + 3] = i),
            (n[o + 4] = l[0]),
            (n[o + 5] = l[1]),
            (n[o + 6] = l[2]),
            (n[o + 7] = r),
            (this.rectN += 1));
        }
        writeSignals(e, t) {
          let a = 1 - (0, h.j)(0, 0.1, t);
          if (a <= 0) return;
          let i = this.u,
            r = Math.floor(this.P / 2),
            n = this.canvas.width,
            l = this.canvas.height,
            o = Math.ceil(-e.originX / r),
            s = Math.floor((n - e.originX) / r) - 1,
            c = Math.ceil(-e.originY / r),
            d = Math.floor((l - e.originY) / r) - 1;
          if (s <= o || d <= c) return;
          let u = this.signalPivot;
          eJ(e, u);
          let f = Math.floor((u.x - e.originX) / r),
            b = Math.floor((u.y - e.originY) / r),
            m = e.vortexRadius / r,
            p = this.signalRoute,
            g = p.length / 2,
            v = Math.max(2, Math.round(0.46 * r)),
            x = Math.max(1, Math.round(v / 3)),
            y = r / 2,
            w = (e, t) => {
              for (let a = 0; a < i.clearN; a += 1) {
                let r = 4 * a,
                  n = i.clear;
                if (
                  e >= (n[r] ?? 0) &&
                  e <= (n[r + 2] ?? 0) &&
                  t >= (n[r + 1] ?? 0) &&
                  t <= (n[r + 3] ?? 0)
                )
                  return !0;
              }
              return !1;
            };
          for (let t = 0; t < 24; t += 1) {
            let i = 8 + 6 * e3(t, 1, 31),
              n = this.time / i + e3(t, 2, 31),
              l = Math.floor(n),
              u = n - l,
              M = o + Math.floor(e3(t, l, 32) * (s - o + 1)),
              A = c + Math.floor(e3(t, l, 33) * (d - c + 1));
            if (Math.hypot(M - f, A - b) < 0.8 * m) continue;
            let C = 0;
            for (
              p[0] = M, p[1] = A;
              C < g - 1 && Math.hypot(M - f, A - b) > 0.55 * m;
            ) {
              let e = f - M,
                a = b - A;
              (0 === a ||
              (0 !== e &&
                e3(t, 977 * l + C, 41) <
                  Math.abs(e) / (Math.abs(e) + Math.abs(a)))
                ? (M += Math.sign(e))
                : (A += Math.sign(a)),
                (p[2 * (C += 1)] = M),
                (p[2 * C + 1] = A));
            }
            if (C < 2) continue;
            let k = Math.min(C, Math.floor(C * (0, h.O)(u / 0.9) ** 1.5)),
              E = (0, h.j)(0, 0.06, u) * (1 - (0, h.j)(0.9, 1, u));
            for (let t = 0; t < 4 && k - t >= 0; t += 1) {
              let i = (0 === t ? 0.9 : 0.42 / t) * E * a;
              if (i <= 0.01) continue;
              let n = e.originX + (p[2 * (k - t)] ?? 0) * r + y,
                l = e.originY + (p[2 * (k - t) + 1] ?? 0) * r + y;
              if (w(n, l)) continue;
              let o = v / 2,
                s = x / 2;
              (this.putRect(n - o, l - s, n + o, l + s, i),
                this.putRect(n - s, l - o, n + s, l - s, i),
                this.putRect(n - s, l + s, n + s, l + o, i));
            }
          }
          ((i.routeN = 0), (i.packetN = this.rectN));
        }
      }
      let to = (0, ek.Z)(ek.h.dark.bg),
        ts = (0, ek.Z)(ek.h.light.bg);
      class tc extends tl {
        frame = (e) => {
          if (this.disposed) return;
          this.raf = requestAnimationFrame(this.frame);
          let t = e / 1e3,
            a = t - this.last,
            i = this.last < 0 || a > 0.5 || a <= 0;
          (i && (a = 1 / 60),
            (this.last = t),
            (this.time += a),
            (this.frames += 1),
            this.targetW > 0 &&
              (this.targetW !== this.canvas.width ||
                this.targetH !== this.canvas.height) &&
              ((this.canvas.width = this.targetW),
              (this.canvas.height = this.targetH),
              (this.needsBuild = !0)),
            this.needsBuild && this.build());
          let r = this.field;
          if (!r) return void this.emit();
          let n = this.u,
            l = this.opts.reducedMotion,
            o = this.k,
            s = this.P,
            c = this.pitchCss,
            d = this.cssW,
            u = this.cssH,
            f = window.scrollY;
          f !== this.lastScroll &&
            this.hasPointer &&
            (this.overField =
              document.elementFromPoint(this.px, this.py) === this.canvas);
          let b =
            this.layout.sceneLength > 0
              ? this.layout.sceneLength
              : 2 * window.innerHeight;
          i
            ? ((this.scene.x = 0), (this.scene.v = 0))
            : (0, h.R)(this.scene, 0, 14, a);
          let m = (0, h.O)(this.scene.x);
          if (l) {
            let e = m >= 0.35;
            ((n.q = +!!e),
              (n.qdot = 0),
              (n.sceneAlpha = e
                ? (0, h.U)(m, 0.3, 0.62)
                : 1 - (0, h.U)(m, 0.08, 0.4)));
          } else
            ((n.q = (0, h.U)(m, 0.08, 0.62)),
              (n.qdot = m > 0.08 && m < 0.62 ? this.scene.v / 0.54 : 0),
              (n.sceneAlpha = 1));
          let p = this.pointerSpeed(t),
            g = Math.max(1 - (0, h.j)(0.02, 0.08, m), (0, h.j)(0.97, 1, m));
          ((this.gate = g), this.updateDwell(a, p, g));
          let v = this.state.chip,
            x =
              this.chipOver ||
              (this.chipOpen &&
                Math.hypot(this.px - v.x, this.py - v.y) <
                  this.lensR / o + v.side),
            y = 0;
          (2 === this.dwell
            ? (y = g)
            : this.overField &&
              this.hasPointer &&
              !this.touch &&
              !x &&
              (y = (1 - 0.5 * (0, h.j)(600, 2400, p)) * g),
            i
              ? ((this.strength.x = y), (this.strength.v = 0))
              : (0, h.R)(this.strength, y, y > this.strength.x ? 22 : 15, a));
          let w = (0, h.O)(this.strength.x),
            M = this.px * o,
            A = this.py * o,
            C = 0;
          if (2 === this.dwell)
            this.hold
              ? ((C = 2), (M = this.lensTx), (A = this.lensTy))
              : this.pinned && this.focus >= 0
                ? ((C = 3),
                  eQ(r, s, this.focus, n.q > 0.5, this.tmp),
                  (M = this.tmp.x),
                  (A = this.tmp.y))
                : (C = 1);
          else if (this.focus >= 0 && (1 === this.dwell || 3 === this.dwell)) {
            eQ(r, s, this.focus, n.q > 0.5, this.tmp);
            let e = (0, h.j)(0, 0.35, this.qd);
            ((M += e * (this.tmp.x - M)), (A += e * (this.tmp.y - A)));
          }
          (C !== this.lensMode &&
            ((this.lensMode = C), (this.lensTx = M), (this.lensTy = A)),
            i || (w < 0.02 && 2 !== this.dwell)
              ? ((this.lensX.x = M),
                (this.lensX.v = 0),
                (this.lensY.x = A),
                (this.lensY.v = 0))
              : (e7(this.lensX, this.lensTx, M, 14, a),
                e7(this.lensY, this.lensTy, A, 14, a)),
            (this.lensTx = M),
            (this.lensTy = A));
          let k = e8(this.qd);
          ((this.lensR = (5.5 + (6.1 - 5.5) * k) * s), (this.lensA = 0));
          let E = (0, h.U)(m, 0.4, 0.92),
            N = l ? 1 : 0.08 ** (1 - e8(E)),
            j = this.state.bar;
          ((j.t = E),
            (j.scale = N),
            (j.dy = 0),
            (j.blur = l ? 0 : 6 * ((1 - N) / 0.92) ** 1.5),
            (j.opacity = l
              ? e8(E)
              : Math.exp(-0.28 * (1 / N - 1)) * (0, h.j)(0, 0.04, E)),
            !this.locked && m >= 0.92
              ? (this.locked = !0)
              : this.locked && m < 0.9 && (this.locked = !1),
            (j.locked = this.locked));
          let F = this.layout.bar,
            R = this.layout.caret,
            S = F ? F.x + F.width / 2 : d / 2,
            P = u / 2,
            L =
              F && R
                ? R.x + R.width / 2 - S
                : -Math.min(720, d - 32) / 2 + 24 + 8,
            _ = F && R ? R.y + R.height / 2 - (F.y + F.height / 2) : 0,
            T = e4((0, h.U)(m, 0.04, 0.22)),
            D = e8((0, h.U)(m, 0.28, 0.48));
          e0(r, l ? 2 : this.time, 0, this.tmp);
          let O = l ? r.chipX / o : this.tmp.x / o,
            H = l ? r.chipY / o : this.tmp.y / o;
          (e0(r, this.time, 1, this.tmp),
            (this.state.secondaryFocus.x = this.tmp.x / o),
            (this.state.secondaryFocus.y = this.tmp.y / o));
          let $ = O + (S + 0.08 * L - O) * T,
            I = H + (P + 0.08 * _ - H) * T;
          m >= 0.4 && (($ = S + L * N), (I = P + _ * N + j.dy));
          let B = c * (1.65 + (1 - 1.65) * T),
            z = B + (0.5 * c - B) * D;
          m >= 0.4 && (z = Math.max(z, 16 * N));
          let G = this.state;
          ((G.chip.x = $),
            (G.chip.y = I),
            (G.chip.side = z),
            this.updateChip(r, a, m, l),
            l || this.writeSignals(r, m));
          let q = !1;
          for (let e = 0; e < 32; e += 1) {
            let t = n.hi[e] ?? 0,
              i = this.hiTarget[e] ?? 0,
              r = a / 0.24;
            ((n.hi[e] = t < i ? Math.min(i, t + r) : Math.max(i, t - r)),
              t !== i && (q = !0));
          }
          this.wave &&
            ((n.waveT = t - this.wave.start),
            n.waveT >= (l ? 0.2 : 0.82) && this.finishWave());
          let V = this.canvas.width,
            W = this.canvas.height;
          ((n.viewport[0] = V),
            (n.viewport[1] = W),
            (n.origin[0] = r.originX),
            (n.origin[1] = r.originY),
            (n.pitch = s),
            (n.dpr = o),
            (n.time = this.time),
            (n.lensC[0] = this.lensX.x),
            (n.lensC[1] = this.lensY.x),
            (n.lensR = this.lensR),
            (n.lensA = this.lensA));
          let Y = 0;
          if (!l)
            for (let e = 1; e <= this.trailN; e += 1) {
              let t = ((this.trailHead - e + 48) % 48) * 3,
                a = (this.time - (this.trail[t] ?? 0)) / 0.9;
              a >= 1 ||
                ((n.trail[3 * Y] = (this.trail[t + 1] ?? 0) * o),
                (n.trail[3 * Y + 1] = (this.trail[t + 2] ?? 0) * o),
                (n.trail[3 * Y + 2] = a),
                (Y += 1));
            }
          ((n.trailN = Y),
            (this.trailLive = Y > 0),
            (n.lensS = w),
            (n.rimS = 0),
            (n.d = 0.5),
            (n.fringe = 0),
            (n.twinkle = +!l),
            (n.plumeAlpha = d / o >= 768 && d < 1024 ? 0.45 : 1));
          let X = this.layout.footer;
          ((n.wallFade = X ? 1 - (0, h.j)(X.top - u, X.top - 0.3 * u, f) : 1),
            (n.docY = r.horizonTop - f * o));
          let U = Math.abs(f - this.lastScroll) / a;
          ((this.lastScroll = f),
            (this.snapK = (0, h.n)(this.snapK, (0, h.j)(0, 30, U), 0.08, a)),
            (n.snapK = 0),
            (n.chip[0] = $ * o),
            (n.chip[1] = I * o),
            (n.chip[2] = z * o),
            (n.chipGlow = c * (0.6 + -0.35 * D) * o * (1 + n.chipBoost)),
            (n.chipA = this.locked ? 0 : n.wallFade),
            eJ(r, this.tmp),
            (n.pivot[0] = this.tmp.x),
            (n.pivot[1] = this.tmp.y),
            (n.snap = +!l),
            (n.base = 0.14 * (1 - (0, h.j)(0, 0.12, m))),
            (n.baseC[0] = this.tmp.x),
            (n.baseC[1] = this.tmp.y),
            (n.baseR = 1.45 * r.vortexRadius));
          let K = 1 - (0, h.U)(f, b, b + 0.3 * u),
            Q = e6((0, h.U)(m, 0.22, 0.36));
          ((n.corrL = r.originX + r.wallCols * s),
            (n.corrR = r.originX + (r.cols - r.wallCols) * s),
            (n.horizonY = Math.floor(W / 2)),
            (n.horizonX = S * o),
            (n.horizonHalf = Q * Math.max(S * o - n.corrL, n.corrR - S * o, 0)),
            (n.lineW = Math.max(1, Math.round(o))),
            (n.lineA = Q > 0 ? K : 0),
            (n.bandA = (0, h.j)(0.28, 0.48, m) * (1 - (0, h.j)(0.8, 1, m))),
            (n.fogA = l
              ? 0
              : (0, h.j)(0.28, 0.48, m) * (1 - (0, h.j)(0.8, 1, m))));
          let J = 0;
          for (let e of this.layout.clearings) {
            if (J >= 8) break;
            let t = e.fixed ? e.y : e.y - f;
            if (t > u + c || t + e.height < -c || e.width <= 0) continue;
            let a = 4 * J;
            ((n.clear[a] = (e.x - c) * o),
              (n.clear[a + 1] = (t - c) * o),
              (n.clear[a + 2] = (e.x + e.width + c) * o),
              (n.clear[a + 3] = (t + e.height + c) * o),
              (J += 1));
          }
          n.clearN = J;
          let [Z, ee, et] = n.darkOld > 0.5 ? to : ts;
          if (
            ((n.clearColor[0] = Z),
            (n.clearColor[1] = ee),
            (n.clearColor[2] = et),
            this.wave ||
              n.lineA > 0 ||
              n.bandA > 0.001 ||
              n.fogA > 0.001 ||
              n.base > 0)
          )
            n.bgMode = 2;
          else if (n.rimS > 0.002) {
            n.bgMode = 1;
            let e = this.lensR + 40 * o,
              t = Math.max(0, Math.floor(this.lensX.x - e)),
              a = Math.max(0, Math.floor(W - (this.lensY.x + e)));
            ((n.scissor[0] = t),
              (n.scissor[1] = a),
              (n.scissor[2] = Math.max(
                0,
                Math.min(V, Math.ceil(this.lensX.x + e)) - t,
              )),
              (n.scissor[3] = Math.max(
                0,
                Math.min(W, Math.ceil(W - (this.lensY.x - e))) - a,
              )));
          } else n.bgMode = 0;
          if (
            ((!(
              w < 0.001 &&
              !this.wave &&
              0 === this.dwell &&
              1e-4 > Math.abs(this.scene.v) &&
              1e-4 > Math.abs(0 - m) &&
              0 === U &&
              !q &&
              !this.routeMoved &&
              0 === this.packetN &&
              0 === this.pulseLevel &&
              1e-4 > Math.abs(this.chipHoverS.v) &&
              !this.trailLive
            ) ||
              this.dirty ||
              (!l && this.frames % 2 == 0) ||
              i) &&
              (this.renderer?.render(n), (this.dirty = !1)),
            (G.time = this.time),
            (G.scene = (0, h.O)(f / b)),
            (G.hero = 1 - (0, h.U)(m, 0, 0.12)),
            (G.chipDocked = this.locked),
            (G.chipHover = (0, h.O)(this.chipHoverS.x)),
            this.focus >= 0 && this.qd > 0 && 0 !== this.dwell)
          ) {
            let e = this.focusScreen(n.q > 0.5),
              t = this.dwellFrame,
              l = ((1.6 + (0.9 - 1.6) * k) * e) / o,
              s = this.tmp.x / o,
              c = this.tmp.y / o;
            if (!this.retLive || i)
              ((this.retLive = !0),
                (this.retX.x = s),
                (this.retY.x = c),
                (this.retH.x = l),
                (this.retX.v = 0),
                (this.retY.v = 0),
                (this.retH.v = 0));
            else {
              let e = this.warmDwell || this.time < this.warmUntil ? 30 : 15;
              ((0, h.R)(this.retX, s, e, a),
                (0, h.R)(this.retY, c, e, a),
                (0, h.R)(this.retH, l, e, a));
            }
            ((t.x = this.retX.x),
              (t.y = this.retY.x),
              (t.half = this.retH.x),
              (t.progress = k),
              (t.opacity = (0, h.j)(0, 0.12, this.qd)),
              (t.cluster = r.data[12 * this.focus + 9] ?? -1),
              (G.dwell = t));
          } else ((G.dwell = null), (this.retLive = !1));
          this.emit();
        };
      }
      let td = (e) =>
        e >= 768
          ? Math.min(27.5, Math.max(15, (22 * Math.min(e, 1488) * 1.15) / 1920))
          : 10;
      class tu extends tc {
        ro;
        constructor(e) {
          (super(e),
            this.initGl(),
            (this.ro = new ResizeObserver(this.onResize)));
          try {
            this.ro.observe(this.canvas, { box: "device-pixel-content-box" });
          } catch {
            this.ro.observe(this.canvas);
          }
          (this.canvas.addEventListener("webglcontextlost", this.onContextLost),
            this.canvas.addEventListener(
              "webglcontextrestored",
              this.onContextRestored,
            ),
            this.canvas.addEventListener("pointerdown", this.onPointerDown),
            this.canvas.addEventListener("pointerup", this.onPointerUp),
            this.canvas.addEventListener("pointercancel", this.onPointerCancel),
            window.addEventListener("pointermove", this.onPointerMove, {
              passive: !0,
            }),
            document.documentElement.addEventListener(
              "pointerleave",
              this.onPointerLeave,
            ),
            document.addEventListener("visibilitychange", this.onVisibility),
            document.hidden || (this.raf = requestAnimationFrame(this.frame)));
        }
        subscribe(e) {
          return (
            (this.listeners = [...this.listeners, e]),
            e(this.state),
            () => {
              this.listeners = this.listeners.filter((t) => t !== e);
            }
          );
        }
        setLayout(e) {
          let t = this.layout.footer,
            a = e.footer;
          ((this.layout = e),
            (this.dirty = !0),
            (null === t) != (null === a) ||
            (t && a && Math.abs(t.height - a.height) > 0.5)
              ? (this.needsBuild = !0)
              : t &&
                a &&
                this.field &&
                Math.abs(t.top - a.top) > 0.5 &&
                (this.field.horizonTop = Math.round(
                  (a.top + 0.55 * a.height) * this.k,
                )));
        }
        setTheme(e, t) {
          if ((this.finishWave(), e === this.theme)) return Promise.resolve();
          let a = this.u;
          ((this.dirty = !0),
            (a.darkOld = +("dark" === this.theme)),
            (a.darkNew = +("dark" === e)),
            (this.theme = e));
          let i = t.x * this.k,
            r = t.y * this.k,
            n = this.canvas.width,
            l = this.canvas.height,
            o = Math.max(
              Math.hypot(i, r),
              Math.hypot(n - i, r),
              Math.hypot(i, l - r),
              Math.hypot(n - i, l - r),
            );
          return (
            (a.waveO[0] = i),
            (a.waveO[1] = r),
            (a.waveT = 0),
            this.opts.reducedMotion
              ? ((a.waveFade = 1),
                (a.waveV = 1e9),
                (a.waveFlip = 0.2),
                (a.waveJitter = 0))
              : ((a.waveFade = 0),
                (a.waveFlip = 0.16),
                (a.waveJitter = 0.08),
                (a.waveV = Math.max(1, o) / (0.82 - 0.16 - 0.08))),
            new Promise((e) => {
              this.wave = { start: performance.now() / 1e3, resolve: e };
            })
          );
        }
        holdFocus(e) {
          this.hold = e;
        }
        focusCluster(e) {
          let t = this.field?.anchors[e] ?? -1;
          t < 0 || ((this.focus = t), this.open(!0));
        }
        highlight(e) {
          for (let t of (this.hiTarget.fill(0), e))
            t >= 0 && t < 32 && (this.hiTarget[t] = 1);
          this.dirty = !0;
        }
        setChipOpen(e) {
          ((this.chipOpen = e), (this.dirty = !0));
        }
        release() {
          2 === this.dwell && this.blur();
        }
        pulse() {}
        dispose() {
          this.disposed ||
            ((this.disposed = !0),
            cancelAnimationFrame(this.raf),
            this.ro.disconnect(),
            this.canvas.removeEventListener(
              "webglcontextlost",
              this.onContextLost,
            ),
            this.canvas.removeEventListener(
              "webglcontextrestored",
              this.onContextRestored,
            ),
            this.canvas.removeEventListener("pointerdown", this.onPointerDown),
            this.canvas.removeEventListener("pointerup", this.onPointerUp),
            this.canvas.removeEventListener(
              "pointercancel",
              this.onPointerCancel,
            ),
            window.removeEventListener("pointermove", this.onPointerMove),
            document.documentElement.removeEventListener(
              "pointerleave",
              this.onPointerLeave,
            ),
            document.removeEventListener("visibilitychange", this.onVisibility),
            this.finishWave(),
            (this.listeners = []),
            this.renderer?.dispose(),
            (this.renderer = null),
            this.gl?.getExtension("WEBGL_lose_context")?.loseContext());
        }
        initGl() {
          if (!(!this.gl || this.gl.isContextLost()))
            try {
              ((this.renderer = new eU(this.gl)),
                this.field &&
                  this.renderer.upload(this.field.data, this.field.count));
            } catch (e) {
              (console.error(e), (this.renderer = null));
            }
        }
        onContextLost = (e) => {
          (e.preventDefault(), (this.renderer = null));
        };
        onContextRestored = () => {
          (this.initGl(), (this.needsBuild = !0));
        };
        onResize = (e) => {
          let t = e[0];
          if (!t) return;
          let a = window.devicePixelRatio || 1,
            i = t.devicePixelContentBoxSize?.[0],
            r = Math.min(1, 2 / a),
            n = i
              ? Math.round(i.inlineSize * r)
              : Math.round(t.contentRect.width * Math.min(a, 2)),
            l = i
              ? Math.round(i.blockSize * r)
              : Math.round(t.contentRect.height * Math.min(a, 2));
          ((this.targetW = n), (this.targetH = l), (this.needsBuild = !0));
        };
        surfaceVisible = !0;
        setVisible(e) {
          ((this.surfaceVisible = e), this.onVisibility());
        }
        onVisibility = () => {
          (cancelAnimationFrame(this.raf),
            (this.raf = 0),
            document.hidden ||
              !this.surfaceVisible ||
              this.disposed ||
              ((this.last = -1),
              (this.raf = requestAnimationFrame(this.frame))));
        };
        build() {
          let e = this.canvas.width,
            t = this.canvas.height,
            a = this.canvas.clientWidth;
          if (0 === this.targetW || e < 2 || t < 2 || a < 1) return;
          ((this.needsBuild = !1),
            (this.dirty = !0),
            (this.cssW = a),
            (this.cssH = this.canvas.clientHeight || t),
            (this.k = e / a),
            (this.pitchCss = td(a)),
            (this.P = Math.max(4, Math.round(this.pitchCss * this.k))));
          let i = this.layout.footer,
            r = i
              ? {
                  top: Math.round((i.top + 0.55 * i.height) * this.k),
                  rows: Math.max(
                    0,
                    Math.floor((0.45 * i.height * this.k) / this.P),
                  ),
                }
              : null;
          ((this.field = (function (e) {
            let { width: t, height: a, pitch: i } = e,
              r = Math.max(1, Math.ceil(t / i)),
              n = t - r * i,
              l = Math.max(1, Math.ceil(a / i)),
              o = (e.width / e.pitch) * e.pitchCss,
              s = o >= 768,
              c = (o - Math.min(o - 48, 1440)) / 2,
              d = 1 - 1 / 1.15,
              u = s
                ? Math.round(
                    c / e.pitchCss + (864 / 1.15 - 605 * d) / 22 - n / i,
                  ) + -2
                : r - 49 + 2,
              f = s
                ? Math.round((-549 * d) / 22) + 2
                : Math.round(
                    (84 + (Math.max(l * e.pitchCss, 780) - 530) / 2) /
                      e.pitchCss -
                      549 / 22,
                  ),
              b = (e, t) => e >= 0 && e < r && t >= 0 && t < l,
              m = u + eL,
              p = f + e_,
              g = u + 761.5 / 22,
              v = f + 408.5 / 22,
              x = (e, t) =>
                (1.5 > Math.abs(e + 0.5 - m) && 1.5 > Math.abs(t + 0.5 - p)) ||
                (1.2 > Math.abs(e + 0.5 - g) && 1.2 > Math.abs(t + 0.5 - v)),
              {
                occ: y,
                plume: w,
                fills: M,
              } = (function (e) {
                let {
                    cols: t,
                    rows: a,
                    mapCol0: i,
                    mapRow0: r,
                    secondX: n,
                    secondY: l,
                    inGrid: o,
                    nearChip: s,
                  } = e,
                  c = new Uint8Array(t * a),
                  d = [],
                  u = new Map();
                for (let [e, a, n] of eS) {
                  let l = Math.round((e - 12) / 22),
                    f = Math.round((a - 12) / 22),
                    b = i + l,
                    m = r + f;
                  if (s(b, m)) continue;
                  o(b, m) && (c[m * t + b] = 1);
                  let p = Math.hypot(e - 753, a - 415),
                    g =
                      p < 139
                        ? p / 139
                        : Math.hypot(e - 448.5, a - 713.5) / 256.5;
                  (d.push({
                    i: b,
                    j: m,
                    wi: b,
                    wj: m,
                    size: n / 22,
                    delay: 0,
                    flags: 0,
                    t: (0, h.O)(g),
                    neutral: (0, h.j)(0.98, 1.02, g),
                    cluster: -1,
                    alpha: 1,
                  }),
                    u.set(`${l},${f}`, {
                      size: n / 22,
                      t: (0, h.O)(g),
                      neutral: (0, h.j)(0.98, 1.02, g),
                    }));
                }
                let f = [];
                for (let e = 0; e < 49; e += 1)
                  for (let t = 0; t < 49; t += 1) {
                    if (u.has(`${t},${e}`)) continue;
                    let a = i + t,
                      n = r + e;
                    if (s(a, n)) continue;
                    let l = 0,
                      o = 0,
                      c = 0,
                      d = 0;
                    for (let a = -1; a <= 1; a += 1)
                      for (let i = -1; i <= 1; i += 1) {
                        let r = u.get(`${t + i},${e + a}`);
                        r &&
                          (0 !== i || 0 !== a) &&
                          ((l += 1),
                          (o += r.size),
                          (c += r.t),
                          (d += r.neutral));
                      }
                    l < 4 ||
                      f.push({
                        i: a,
                        j: n,
                        wi: a,
                        wj: n,
                        size: (0.85 * o) / l,
                        delay: 0,
                        flags: 130,
                        t: c / l,
                        neutral: d / l,
                        cluster: -1,
                        alpha: 1,
                      });
                  }
                let b = Math.round(n - 0.5),
                  m = Math.round(l - 0.5);
                return (
                  b >= 0 &&
                    b < t &&
                    m >= 0 &&
                    m < a &&
                    ((c[m * t + b] = 1),
                    d.push({
                      i: b,
                      j: m,
                      wi: b,
                      wj: m,
                      size: 31 / 22,
                      delay: 0,
                      flags: 64,
                      t: 0.5,
                      neutral: 1,
                      cluster: -1,
                      alpha: 1,
                    })),
                  { occ: c, plume: d, fills: f }
                );
              })({
                cols: r,
                rows: l,
                mapCol0: u,
                mapRow0: f,
                secondX: g,
                secondY: v,
                inGrid: b,
                nearChip: x,
              }),
              A = (e) => Math.hypot(e.i + 0.5 - m, e.j + 0.5 - p);
            !(function ({
              spec: e,
              plume: t,
              cols: a,
              rows: i,
              chipCellX: r,
              chipCellY: n,
              fromChip: l,
            }) {
              let o = [];
              for (let a = 0; a < e.showcaseCount; a += 1) {
                let e = 2.2 + 1.35 * Math.sqrt(a),
                  i = r + e * Math.cos(a * eP),
                  l = n + e * Math.sin(a * eP),
                  s = null,
                  c = 1 / 0;
                for (let e of t) {
                  if (
                    80 & e.flags ||
                    !o.every(
                      (t) =>
                        Math.max(Math.abs(t.i - e.i), Math.abs(t.j - e.j)) >= 2,
                    )
                  )
                    continue;
                  let t = (e.i + 0.5 - i) ** 2 + (e.j + 0.5 - l) ** 2;
                  t < c && ((c = t), (s = e));
                }
                if (!s) break;
                ((s.flags |= 16), o.push(s));
              }
              let s = Math.min(e.showcaseCount, 32);
              if (
                (o.forEach((e, t) => {
                  e.cluster = t < s ? t : -1;
                }),
                s > 0)
              ) {
                let e = new Int16Array(a * i).fill(-1);
                for (let t of o) e[t.j * a + t.i] = t.cluster;
                let r = 1;
                for (let e of t) r = Math.max(r, l(e));
                let n = t
                    .filter((e) => e.cluster < 0)
                    .sort((e, t) => l(e) - l(t) || e.j - t.j || e.i - t.i),
                  c = new Uint8Array(s);
                for (let t of n) {
                  c.fill(0);
                  for (let r = -2; r <= 2; r += 1)
                    for (let n = -2; n <= 2; n += 1) {
                      let l = t.i + n,
                        o = t.j + r;
                      if (l < 0 || o < 0 || l >= a || o >= i) continue;
                      let s = e[o * a + l] ?? -1;
                      if (s < 0) continue;
                      let d = 1 >= Math.max(Math.abs(n), Math.abs(r)) ? 2 : 1;
                      c[s] = Math.max(c[s] ?? 0, d);
                    }
                  let n = 0.05 + 0.35 * (1 - l(t) / r),
                    o = 0,
                    d = 3,
                    u = -1;
                  for (let e = 0; e < s; e += 1) {
                    let a = c[e] ?? 0;
                    if (a > d) continue;
                    let i = (0, h.x)(t.i, t.j, 131 + e) ** (1 + n * e);
                    (a < d || i > u) && ((o = e), (d = a), (u = i));
                  }
                  ((t.cluster = o), (e[t.j * a + t.i] = o));
                }
              }
            })({
              spec: e,
              plume: w,
              cols: r,
              rows: l,
              chipCellX: m,
              chipCellY: p,
              fromChip: A,
            });
            let C = (function (e, t, a, i) {
                let r = Math.max(
                    3,
                    Math.min(Math.round(216 / e.pitchCss), Math.floor(0.3 * a)),
                  ),
                  n = 1,
                  l = 1;
                for (let e of t) {
                  let t = e.i + 0.5 - i;
                  t < 0 ? (n = Math.max(n, -t)) : (l = Math.max(l, t));
                }
                let o = new Map();
                for (let e of t) {
                  let t = o.get(e.j) ?? [];
                  (t.push(e), o.set(e.j, t));
                }
                let s = (e, t, i) => {
                  let n = [];
                  for (let t = 0; t < Math.min(r, a); t += 1) {
                    let l =
                        0.95 *
                        (1 - t / r) ** 0.8 *
                        (0.55 +
                          0.9 * (0, h.Q)(0.45 * t, 0.45 * e, i ? 17 : 19)),
                      o =
                        (0, h.x)(t, e, i ? 23 : 29) ** (1 / Math.max(l, 0.001));
                    n.push({ col: i ? t : a - 1 - t, key: o });
                  }
                  return n
                    .sort((e, t) => t.key - e.key)
                    .slice(0, t)
                    .map((e) => e.col)
                    .sort((e, t) => e - t);
                };
                for (let [e, t] of o) {
                  let o =
                    0.6 * (0, h.v)(e, 3) + 0.4 * (0, h.Q)(0.15 * e, 0.5, 5);
                  for (let [c, d] of [
                    [t.filter((e) => e.i + 0.5 < i), !0],
                    [t.filter((e) => e.i + 0.5 >= i), !1],
                  ]) {
                    let t = Math.min(c.length, r, a),
                      u = s(e, t, d),
                      f = d ? c.slice(0, t) : c.slice(c.length - t),
                      b = d ? c.slice(t) : c.slice(0, c.length - t);
                    for (let e of (f.forEach((e, t) => {
                      e.wi = u[t] ?? e.i;
                    }),
                    b))
                      e.flags |= 2;
                    for (let e of c) {
                      let t = d ? n : l,
                        a = 1 - Math.abs(e.i + 0.5 - i) / t;
                      e.delay = 0.5 * (0, h.O)(0.7 * a + 0.3 * o);
                    }
                  }
                }
                return r;
              })(e, w, r, m),
              { horizon: k, socket: E } = (function (e, t) {
                let a = [],
                  i = e.horizon?.rows ?? 0,
                  r = (e) =>
                    Math.min(
                      i,
                      Math.round(
                        4 +
                          10 *
                            (0, h.O)(
                              ((0, h.m)(0.08 * e, 1.7, 3, 41) - 0.25) / 0.5,
                            ),
                      ) +
                        (0.35 > (0, h.v)(e, 43)
                          ? 1
                          : 0.2 > (0, h.v)(e, 47)
                            ? -1
                            : 0),
                    ),
                  n = null,
                  l = -10,
                  o = 0,
                  s = 0,
                  c = -1,
                  d = 0,
                  u = -1;
                if (i >= 5 && t >= 7) {
                  let e = Math.min(t - 3, Math.max(2, Math.round(0.6 * t))),
                    a = i;
                  for (let t = e - 1; t <= e + 1; t += 1)
                    a = Math.min(a, i - r(t));
                  let f = 4 + Math.floor(3 * (0, h.v)(e, 97)),
                    b = Math.floor(a - 2.06 - 1.5),
                    m = Math.max(
                      a - Math.max(0, Math.min(f, b)),
                      Math.ceil(3.56),
                    ),
                    p = m - 1 - 1.03;
                  ((n = { x: e + 0.5, y: p, side: 2.06 }),
                    (l = e),
                    (o = m),
                    (s = Math.floor(e + 0.5 - 1.03 - 1)),
                    (c = Math.ceil(e + 0.5 + 1.03 + 1) - 1),
                    (d = Math.floor(p - 1.03 - 1)),
                    (u = m - 1));
                }
                let f = (e, t, a) => ({
                  i: e,
                  j: t,
                  wi: e,
                  wj: t,
                  size: a,
                  delay: 0,
                  flags: 8,
                  t: 0.1 + 0.6 * (0, h.O)((t - (i - 14)) / 13),
                  cluster: -1,
                  alpha: 1,
                });
                for (let e = 0; e < t && i > 0; e += 1) {
                  let t = r(e);
                  for (let r = 0; r < t; r += 1) {
                    let n = i - 1 - r;
                    if (e >= s && e <= c && n >= d && n <= u) continue;
                    let l = t > 1 ? r / (t - 1) : 1;
                    if ((0, h.x)(e, n, 51) >= 0.55 + (0.12 - 0.55) * l)
                      continue;
                    let o = (0, h.x)(e, n, 61),
                      b =
                        (l > 0.7 && o < 0.18) || o < 0.025
                          ? 0.79
                          : o < 0.3
                            ? 0.48
                            : 0.29;
                    a.push(f(e, n, b));
                  }
                }
                for (let e = l - 1; e <= l + 1 && n; e += 1)
                  for (let t = o; t < i - r(e); t += 1) {
                    if (e !== l && (0, h.x)(e, t, 53) > 0.8) continue;
                    let i = (0, h.x)(e, t, 61),
                      r = i < 0.18 ? 0.79 : i < 0.45 ? 0.48 : 0.29;
                    a.push(f(e, t, r));
                  }
                return { horizon: a, socket: n };
              })(e, r),
              N = new Map(),
              j = new Map();
            for (let e of w) {
              if (16 & e.flags || Math.abs(e.j + 0.5 - p) < 0.25 * l) continue;
              let t = N.get(e.i);
              e.j + 0.5 < p && (!t || e.j < t.j) && N.set(e.i, e);
              let a = j.get(e.i);
              e.j + 0.5 > p && (!a || e.j > a.j) && j.set(e.i, e);
            }
            let F = (e, t, a) => {
                let i = [...e.entries()].sort((e, t) => e[0] - t[0]),
                  r = [];
                for (let e = 0; e < t && i.length > 0; e += 1) {
                  let n = Math.floor(((e + a) / t) * i.length),
                    l = i[Math.min(i.length - 1, n)]?.[1];
                  l && !r.includes(l) && r.push(l);
                }
                return r;
              },
              R = [...F(N, 6, 0.25), ...F(j, 6, 0.75)].sort(
                (e, t) => A(e) - A(t),
              ),
              S = [];
            for (let e = 0; e < l; e += 1)
              for (let t = 0; t < r; t += 1)
                y[e * r + t] ||
                  x(t, e) ||
                  S.push({
                    i: t,
                    j: e,
                    wi: t,
                    wj: e,
                    size: 0.17,
                    delay: 0,
                    flags: 1,
                    t: (e + 0.5) / l,
                    cluster: -1,
                    alpha: 1,
                  });
            let P = S.length + k.length + w.length + M.length + 1,
              L = new Float32Array(12 * P),
              _ = 0,
              T = (e) => {
                let t = 12 * _;
                ((L[t] = e.i),
                  (L[t + 1] = e.j),
                  (L[t + 2] = e.wi),
                  (L[t + 3] = e.wj),
                  (L[t + 4] = e.size),
                  (L[t + 5] = e.delay),
                  (L[t + 6] = e.flags),
                  (L[t + 7] = (0, h.x)(
                    e.i,
                    e.j + (8 & e.flags ? 9973 : 0),
                    71,
                  )),
                  (L[t + 8] = e.t),
                  (L[t + 9] = e.cluster),
                  (L[t + 10] = e.alpha),
                  (L[t + 11] = e.neutral ?? 0),
                  (_ += 1));
              };
            (S.forEach(T), k.forEach(T));
            let D = _,
              O = new Int32Array(r * l).fill(-1),
              H = new Int32Array(r * l).fill(-1),
              $ = new Int32Array(e.showcaseCount).fill(-1),
              I = new Float64Array(e.showcaseCount).fill(1 / 0);
            for (let e of w) {
              if (
                (b(e.i, e.j) && (O[e.j * r + e.i] = _),
                !(2 & e.flags) && b(e.wi, e.wj) && (H[e.wj * r + e.wi] = _),
                e.cluster >= 0 && e.cluster < $.length)
              ) {
                let t = 16 & e.flags ? -1 : A(e);
                t < (I[e.cluster] ?? 1 / 0) &&
                  ((I[e.cluster] = t), ($[e.cluster] = _));
              }
              T(e);
            }
            let B = _;
            M.forEach(T);
            let z = new Int32Array($.length + R.length);
            return (
              z.set($),
              R.forEach((e, t) => {
                z[$.length + t] = b(e.i, e.j) ? (O[e.j * r + e.i] ?? -1) : -1;
              }),
              T({
                i: 0,
                j: 0,
                wi: 0,
                wj: 0,
                size: 2.06,
                delay: 0,
                flags: 4,
                t: 0.5,
                cluster: -1,
                alpha: 1,
              }),
              {
                data: L,
                count: P,
                cols: r,
                rows: l,
                originX: n,
                originY: 0,
                vortexRadius: 28 * i,
                chipX: n + m * i,
                chipY: 0 + p * i,
                wallCols: C,
                sceneStart: D,
                sceneEnd: B,
                anchors: $,
                restGrid: O,
                wallGrid: H,
                horizonTop: e.horizon?.top ?? 0,
                socket: E,
                routes: z,
              }
            );
          })({
            width: e,
            height: t,
            pitch: this.P,
            pitchCss: this.pitchCss,
            showcaseCount: this.opts.showcaseCount,
            horizon: r,
          })),
            this.renderer?.upload(this.field.data, this.field.count),
            2 === this.dwell
              ? this.blur()
              : ((this.dwell = 0), (this.qd = 0), (this.focus = -1)));
        }
        finishWave() {
          let e = this.wave;
          e &&
            ((this.wave = null),
            (this.u.darkOld = this.u.darkNew),
            (this.u.waveT = 1e4),
            e.resolve());
        }
        emit() {
          let e = this.listeners;
          for (let t = 0; t < e.length; t += 1) e[t]?.(this.state);
        }
      }
      function th(e) {
        let { showcaseCount: a, reducedMotion: r } = e,
          n = void 0 !== e.onChip,
          l = (0, i.useRef)(null),
          o = (0, i.useEffectEvent)(() => e.theme),
          s = (0, i.useEffectEvent)((t) => e.onReady(t)),
          c = (0, i.useEffectEvent)((t) => e.onFocus(t)),
          d = (0, i.useEffectEvent)(() => e.onBlur()),
          u = (0, i.useEffectEvent)((t) => e.onChip?.(t));
        return (
          (0, i.useEffect)(() => {
            let e = l.current;
            if (!e) return;
            let t = document.createElement("canvas");
            ((t.style.display = "block"),
              (t.style.width = "100%"),
              (t.style.height = "100%"),
              e.appendChild(t));
            let i = new tu({
              canvas: t,
              theme: o(),
              showcaseCount: a,
              reducedMotion: r,
              onFocus: (e) => c(e),
              onBlur: () => d(),
              onChip: n ? (e) => u(e) : void 0,
            });
            return (
              s(i),
              () => {
                (s(null), i.dispose(), t.remove());
              }
            );
          }, [a, r, n]),
          (0, t.jsx)("div", {
            ref: l,
            "aria-hidden": !0,
            style: {
              position: "fixed",
              inset: 0,
              zIndex: 0,
              pointerEvents: "auto",
            },
          })
        );
      }
      function tf({
        world: e,
        apiCount: a,
        endpointCount: r,
        showcase: n,
        onListBlur: s,
        copy: c = eN.m.copy,
      }) {
        let d = (0, i.useRef)(null);
        return (
          (0, i.useEffect)(() => {
            if (!e) return;
            let t = -1;
            return e.subscribe((e) => {
              let a = d.current;
              if (!a) return;
              let i = Math.round(1e3 * e.hero) / 1e3;
              i !== t &&
                ((t = i),
                (a.style.opacity = String(i)),
                (a.style.visibility = i <= 0.001 ? "hidden" : ""),
                a.toggleAttribute("data-faded", e.hero < 0.01));
            });
          }, [e]),
          (0, t.jsxs)("section", {
            className: u.default.hero,
            "aria-labelledby": "d1-headline",
            children: [
              (0, t.jsx)("div", {
                className: (0, o.f)(
                  "page-column px-4 sm:px-6 lg:px-10",
                  u.default.heroFrame,
                ),
                children: (0, t.jsx)("div", {
                  ref: d,
                  className: u.default.heroInner,
                  children: (0, t.jsxs)("div", {
                    className: u.default.heroCopy,
                    children: [
                      (0, t.jsx)("h1", {
                        id: "d1-headline",
                        className: u.default.headline,
                        "data-wave": !0,
                        "data-d1-clear": "doc",
                        children: c.heroTitle.split("\n").map((e, a) =>
                          (0, t.jsx)(
                            "span",
                            {
                              className: u.default.headlineLine,
                              children: e,
                            },
                            a,
                          ),
                        ),
                      }),
                      (0, t.jsx)("p", {
                        className: u.default.heroBody,
                        "data-wave": !0,
                        "data-d1-clear": "doc",
                        children: c.heroBody,
                      }),
                      (0, t.jsxs)("div", {
                        className: u.default.heroActions,
                        "data-d1-clear": "doc",
                        children: [
                          (0, t.jsxs)(l.Link, {
                            href: "/catalog",
                            className: (0, o.f)(
                              (0, ef.i)({ size: "lg" }),
                              u.default.heroPrimary,
                            ),
                            children: [
                              c.heroPrimaryLabel,
                              " ",
                              (0, t.jsx)(P.f, { "aria-hidden": "true" }),
                            ],
                          }),
                          (0, t.jsxs)(l.Link, {
                            href: c.heroSecondaryHref,
                            className: (0, o.f)(
                              (0, ef.i)({ variant: "outline", size: "lg" }),
                              u.default.heroSecondary,
                            ),
                            children: [
                              c.heroSecondaryLabel,
                              " ",
                              (0, t.jsx)(f.f, { "aria-hidden": "true" }),
                            ],
                          }),
                        ],
                      }),
                      (0, t.jsxs)("p", {
                        className: (0, o.f)(u.default.mono, u.default.caption),
                        "data-wave": !0,
                        "data-d1-clear": "doc",
                        children: [
                          a.toLocaleString("en-US"),
                          " APIs · ",
                          r.toLocaleString("en-US"),
                          " endpoints — Live API discovery",
                        ],
                      }),
                    ],
                  }),
                }),
              }),
              (0, t.jsx)("nav", {
                className: u.default.srOnly,
                "aria-label": "Explore the field",
                onBlur: (e) => {
                  let t = e.relatedTarget;
                  (t instanceof Node && e.currentTarget.contains(t)) || s();
                },
                children: (0, t.jsx)("ul", {
                  children: n.map((a) =>
                    (0, t.jsx)(
                      "li",
                      {
                        children: (0, t.jsxs)(l.Link, {
                          href: a.href,
                          prefetch: !1,
                          onFocus: () => e?.focusCluster(a.index),
                          children: [a.name, ", ", a.price],
                        }),
                      },
                      a.slug,
                    ),
                  ),
                }),
              }),
            ],
          })
        );
      }
      var tb = e.i(853355);
      let tm = {
        "Claude Code": "shellscript",
        Cursor: "jsonc",
        "Claude & ChatGPT": "shellscript",
        SDK: "javascript",
        CLI: "shellscript",
      };
      var tp = e.i(454817);
      let tg = {
        viewBox: "232 54 395 656",
        focus: { x: 302.45, y: 222.45, size: 18.9 },
        marks: [
          [359, 62.4, 4.82, "#644c47", -64, -218, 0.418],
          [287.8, 74.3, 4.82, "#a85e55", -148, -153, 0.423],
          [299.7, 74.3, 7.35, "#e25147", 8, -226, 0.024],
          [323.4, 74.3, 6.09, "#a65f58", -240, -180, 0.411],
          [335.3, 74.3, 4.82, "#6d4843", -46, -191, 0.358],
          [347.1, 74.3, 4.82, "#6b4944", 39, -125, 0.099],
          [359, 74.3, 6.09, "#a0645f", 22, -94, 0.398],
          [370.8, 74.3, 7.35, "#c67a74", -85, -157, 0.275],
          [382.7, 74.3, 6.09, "#996c67", -51, -120, 0.369],
          [276, 86.1, 6.09, "#d25848", -54, -256, 0.289],
          [287.8, 86.1, 7.35, "#e33f2c", -59, -116, 0.164],
          [299.7, 86.1, 4.82, "#744841", -53, -197, 0.021],
          [382.7, 86.1, 4.82, "#694a44", -18, -117, 0.355],
          [394.6, 86.1, 7.35, "#e38178", 11, -111, 0.165],
          [406.4, 86.1, 4.82, "#634c47", 51, -260, 0.042],
          [264.1, 98, 4.82, "#774a40", -81, -99, 0.223],
          [276, 98, 6.09, "#d65a41", -92, -265, 0.302],
          [394.6, 98, 4.82, "#6c4943", -87, -202, 0.312],
          [406.4, 98, 7.35, "#c7746d", 44, -150, 0.39],
          [418.3, 98, 4.82, "#644b46", -95, -179, 0.342],
          [264.1, 109.8, 7.35, "#d7643e", -15, -291, 0.208],
          [406.4, 109.8, 4.82, "#6e4842", 26, -152, 0.402],
          [418.3, 109.8, 7.35, "#c9716a", 139, -261, 0.098],
          [252.3, 121.7, 6.09, "#b46e4c", -178, -218, 0.36],
          [264.1, 121.7, 6.09, "#b5704c", -73, -97, 0.358],
          [418.3, 121.7, 6.09, "#a75e57", 129, -249, 0.27],
          [252.3, 133.6, 7.35, "#e4701e", -154, -80, 0.38],
          [240.4, 145.4, 4.82, "#b57f50", -42, -250, 0.171],
          [418.3, 145.4, 4.82, "#754940", 96, -185, 0.043],
          [430.1, 145.4, 6.09, "#ab5b53", -94, -208, 0.221],
          [240.4, 157.3, 4.82, "#b58755", -110, -36, 0.148],
          [252.3, 157.3, 6.09, "#da9951", -104, -46, 0.269],
          [418.3, 157.3, 4.82, "#774a40", 11, -253, 0.156],
          [430.1, 157.3, 7.35, "#e23e2b", 63, -157, 0.109],
          [240.4, 169.1, 4.82, "#b58d5d", -200, -168, 0.375],
          [252.3, 169.1, 7.35, "#e69b46", -25, -223, 0.176],
          [252.3, 181, 7.35, "#e69e5b", -245, -65, 0.34],
          [264.1, 181, 4.82, "#b69171", -32, -111, 0.003],
          [394.6, 181, 4.82, "#b5784e", 50, -116, 0.304],
          [406.4, 181, 6.09, "#d97440", -103, -152, 0.186],
          [430.1, 181, 6.09, "#d75c3f", 11, -192, 0.383],
          [252.3, 192.8, 6.09, "#d9a385", -41, -194, 0.399],
          [264.1, 192.8, 6.09, "#d8a38d", -119, -232, 0.441],
          [370.8, 192.8, 4.82, "#b58b5a", -60, -277, 0.383],
          [382.7, 192.8, 6.09, "#d9944c", -83, -136, 0.386],
          [394.6, 192.8, 7.35, "#e47a22", 73, -290, 0.057],
          [406.4, 192.8, 7.35, "#e36b1d", -155, -247, 0.366],
          [418.3, 192.8, 7.35, "#e3581a", -43, -87, 0.026],
          [442, 192.8, 6.09, "#d55941", -94, -250, 0.14],
          [276, 204.7, 4.82, "#766461", -69, -108, 0.018],
          [347.1, 204.7, 4.82, "#b59074", -189, -197, 0.211],
          [359, 204.7, 6.09, "#d9a36e", 2, -295, 0.057],
          [370.8, 204.7, 7.35, "#e59945", -218, -170, 0.138],
          [382.7, 204.7, 7.35, "#e59133", -143, -178, 0.393],
          [394.6, 204.7, 7.35, "#e48428", 7, -172, 0.376],
          [406.4, 204.7, 7.35, "#e57521", 14, -115, 0.337],
          [418.3, 204.7, 7.35, "#e3611b", -46, -168, 0.386],
          [430.1, 204.7, 7.35, "#e34d19", 131, -205, 0.046],
          [453.8, 204.7, 4.82, "#b05b4d", 36, -118, 0.007],
          [264.1, 216.6, 4.82, "#736363", -222, -65, 0.424],
          [335.3, 216.6, 6.09, "#d5a399", -87, -139, 0.084],
          [347.1, 216.6, 6.09, "#d8a48a", -45, -112, 0.411],
          [359, 216.6, 4.82, "#b69172", -12, -134, 0.281],
          [382.7, 216.6, 4.82, "#b68d5d", -111, -226, 0.26],
          [394.6, 216.6, 6.09, "#da954e", -90, -97, 0.447],
          [406.4, 216.6, 7.35, "#e47d24", 92, -229, 0.371],
          [418.3, 216.6, 7.35, "#e46a1e", -84, -204, 0.189],
          [430.1, 216.6, 7.35, "#e3551a", -110, -236, 0.328],
          [453.8, 216.6, 6.09, "#d55743", -38, -213, 0.004],
          [311.6, 228.4, 4.82, "#e4e2e0", -113, -71, 0.312],
          [323.4, 228.4, 7.35, "#cc97aa", -21, -206, 0.092],
          [335.3, 228.4, 7.35, "#d99b9d", -106, -103, 0.121],
          [382.7, 228.4, 6.09, "#daa05e", -146, -186, 0.161],
          [394.6, 228.4, 7.35, "#e69133", -40, -133, 0.272],
          [418.3, 228.4, 7.35, "#e4711e", 5, -279, 0.079],
          [430.1, 228.4, 7.35, "#e35a1a", -118, -277, 0.133],
          [442, 228.4, 7.35, "#e3471a", -66, -161, 0.244],
          [453.8, 228.4, 7.35, "#e13d20", -89, -189, 0.161],
          [276, 240.3, 6.09, "#898096", -81, -58, 0.054],
          [299.7, 240.3, 6.09, "#91899e", -124, -121, 0.112],
          [311.6, 240.3, 7.35, "#a58bb3", -125, -172, 0.043],
          [335.3, 240.3, 7.35, "#cf97a6", 1, -244, 0.251],
          [347.1, 240.3, 6.09, "#d3a29d", -28, -87, 0.07],
          [370.8, 240.3, 7.35, "#e69f68", -40, -136, 0.37],
          [382.7, 240.3, 6.09, "#daa367", 18, -228, 0.085],
          [406.4, 240.3, 7.35, "#e4892a", 22, -155, 0.229],
          [418.3, 240.3, 7.35, "#e57621", 51, -172, 0.41],
          [430.1, 240.3, 7.35, "#e35f1b", -19, -233, 0.021],
          [442, 240.3, 7.35, "#e34a19", 121, -184, 0.34],
          [453.8, 240.3, 7.35, "#e23d1e", 21, -135, 0.198],
          [465.7, 240.3, 6.09, "#d35949", 73, -130, 0.156],
          [264.1, 252.1, 6.09, "#978baf", -78, -93, 0.062],
          [276, 252.1, 4.82, "#5c5a65", -41, -101, 0.414],
          [287.8, 252.1, 6.09, "#767a94", -162, -93, 0.343],
          [299.7, 252.1, 7.35, "#8384ad", -69, -59, 0.278],
          [323.4, 252.1, 7.35, "#ab88af", -191, -144, 0.442],
          [335.3, 252.1, 7.35, "#c894aa", -81, -45, 0.347],
          [347.1, 252.1, 6.09, "#d1a2a2", -137, -181, 0.161],
          [359, 252.1, 4.82, "#b49183", -76, -117, 0.294],
          [394.6, 252.1, 4.82, "#b58c5c", 51, -170, 0.156],
          [406.4, 252.1, 7.35, "#e48a2c", -20, -100, 0.358],
          [418.3, 252.1, 7.35, "#e37820", -58, -124, 0.057],
          [430.1, 252.1, 7.35, "#e3611b", -156, -261, 0.172],
          [453.8, 252.1, 7.35, "#e33f1d", -53, -248, 0.088],
          [465.7, 252.1, 7.35, "#e23e2b", 25, -277, 0.225],
          [477.6, 252.1, 4.82, "#a85d55", 54, -280, 0.132],
          [252.3, 264, 4.82, "#948497", -60, -120, 0.345],
          [264.1, 264, 7.35, "#8079ad", -86, -69, 0.328],
          [276, 264, 4.82, "#585965", -240, -143, 0.012],
          [287.8, 264, 6.09, "#707793", -196, -166, 0.08],
          [311.6, 264, 7.35, "#857aae", -175, -130, 0.037],
          [323.4, 264, 7.35, "#a586b0", -60, -98, 0.431],
          [335.3, 264, 7.35, "#c392ab", -92, -54, 0.368],
          [347.1, 264, 6.09, "#d0a0a2", -59, -163, 0.202],
          [394.6, 264, 6.09, "#da9f5a", -69, -84, 0.04],
          [406.4, 264, 7.35, "#e48c2d", -127, -158, 0.445],
          [418.3, 264, 7.35, "#e57922", -66, -98, 0.271],
          [442, 264, 7.35, "#d7683e", -106, -214, 0.029],
          [453.8, 264, 7.35, "#e33f1c", -101, -262, 0.021],
          [465.7, 264, 7.35, "#e33e2b", 209, -175, 0.143],
          [477.6, 264, 6.09, "#ce6056", -16, -201, 0.126],
          [252.3, 275.8, 6.09, "#ac94b0", -80, -124, 0.183],
          [264.1, 275.8, 7.35, "#887caf", -74, -152, 0.324],
          [276, 275.8, 6.09, "#797a94", -117, -152, 0.356],
          [287.8, 275.8, 4.82, "#585864", -163, -225, 0.218],
          [299.7, 275.8, 7.35, "#6f72ab", -106, -229, 0.145],
          [311.6, 275.8, 7.35, "#8a7daf", -229, -43, 0.369],
          [323.4, 275.8, 7.35, "#aa89b1", -104, -40, 0.023],
          [335.3, 275.8, 7.35, "#c794ab", -94, -198, 0.386],
          [347.1, 275.8, 7.35, "#da9b9c", -153, -267, 0.039],
          [359, 275.8, 7.35, "#e39f88", -112, -173, 0.233],
          [370.8, 275.8, 6.09, "#daa580", -17, -131, 0.278],
          [382.7, 275.8, 7.35, "#e69d4f", -77, -144, 0.167],
          [394.6, 275.8, 7.35, "#e5963c", -137, -175, 0.219],
          [406.4, 275.8, 7.35, "#e38a2b", -191, -186, 0.002],
          [430.1, 275.8, 7.35, "#d87740", 29, -139, 0.417],
          [442, 275.8, 7.35, "#d8673e", -46, -288, 0.093],
          [453.8, 275.8, 7.35, "#d65b40", 154, -216, 0.24],
          [465.7, 275.8, 7.35, "#e23e2b", 112, -236, 0.095],
          [489.4, 275.8, 6.09, "#ca6e66", 46, -277, 0.427],
          [252.3, 287.7, 7.35, "#b88daf", -270, -74, 0.002],
          [264.1, 287.7, 7.35, "#9c84b0", -204, -103, 0.241],
          [276, 287.7, 7.35, "#887caf", -195, -209, 0.07],
          [299.7, 287.7, 6.09, "#9089af", -120, -43, 0.124],
          [311.6, 287.7, 7.35, "#9f84b0", -232, -31, 0.239],
          [323.4, 287.7, 7.35, "#b58eb0", -104, -115, 0.226],
          [335.3, 287.7, 7.35, "#ce96a7", -86, -44, 0.257],
          [347.1, 287.7, 7.35, "#dd9c96", -63, -214, 0.328],
          [359, 287.7, 7.35, "#e49f82", -25, -149, 0.026],
          [394.6, 287.7, 7.35, "#e59438", -33, -253, 0.061],
          [406.4, 287.7, 7.35, "#e38829", -38, -91, 0.33],
          [418.3, 287.7, 7.35, "#e57721", -65, -191, 0.402],
          [442, 287.7, 7.35, "#d6653e", -105, -216, 0.448],
          [453.8, 287.7, 7.35, "#d55a40", 24, -112, 0.39],
          [477.6, 287.7, 6.09, "#a85d55", 120, -80, 0.298],
          [489.4, 287.7, 6.09, "#c96f68", 79, -70, 0.078],
          [501.3, 287.7, 4.82, "#986d68", 77, -132, 0.262],
          [252.3, 299.6, 7.35, "#c894aa", -163, -64, 0.317],
          [276, 299.6, 7.35, "#a988b0", -131, -47, 0.06],
          [287.8, 299.6, 6.09, "#938396", -128, -23, 0.1],
          [299.7, 299.6, 4.82, "#958497", -201, -98, 0.309],
          [311.6, 299.6, 7.35, "#b58caf", -212, -72, 0.377],
          [323.4, 299.6, 7.35, "#c894aa", -82, -63, 0.062],
          [347.1, 299.6, 7.35, "#e09d8e", -83, -217, 0.392],
          [359, 299.6, 7.35, "#e49e78", -210, -93, 0.45],
          [370.8, 299.6, 7.35, "#e69f5e", -52, -177, 0.125],
          [382.7, 299.6, 7.35, "#e69b48", -67, -253, 0.342],
          [394.6, 299.6, 7.35, "#e69133", -138, -176, 0.398],
          [406.4, 299.6, 7.35, "#e58427", -93, -197, 0.075],
          [430.1, 299.6, 7.35, "#e45c1b", 111, -205, 0.442],
          [442, 299.6, 7.35, "#d7623f", 18, -256, 0.271],
          [453.8, 299.6, 7.35, "#d55940", 92, -82, 0.093],
          [465.7, 299.6, 6.09, "#ad5a4f", 83, -62, 0.308],
          [477.6, 299.6, 6.09, "#a75e56", 105, -124, 0.093],
          [501.3, 299.6, 6.09, "#c38680", 134, -67, 0.085],
          [252.3, 311.4, 7.35, "#d69aa3", -131, -147, 0.222],
          [264.1, 311.4, 7.35, "#cc96aa", -225, -184, 0.252],
          [276, 311.4, 7.35, "#c593ac", -123, -140, 0.037],
          [323.4, 311.4, 7.35, "#d69aa1", -90, -180, 0.022],
          [335.3, 311.4, 7.35, "#de9d96", -115, -33, 0.042],
          [347.1, 311.4, 7.35, "#e29e82", -59, -93, 0.039],
          [359, 311.4, 7.35, "#e59e6c", -75, -104, 0.288],
          [370.8, 311.4, 7.35, "#e69e54", -213, -96, 0.161],
          [382.7, 311.4, 7.35, "#e6983e", -99, -41, 0.36],
          [394.6, 311.4, 7.35, "#e68e2f", -13, -200, 0.101],
          [406.4, 311.4, 7.35, "#e48024", -41, -173, 0.347],
          [418.3, 311.4, 7.35, "#e26b1c", -131, -269, 0.154],
          [442, 311.4, 7.35, "#e3451a", -8, -248, 0.006],
          [465.7, 311.4, 6.09, "#ac5b52", 8, -223, 0.194],
          [477.6, 311.4, 6.09, "#a55f58", 250, -129, 0.382],
          [501.3, 311.4, 6.09, "#c28b84", 251, -59, 0.383],
          [252.3, 323.3, 6.09, "#d5a397", -87, -78, 0.064],
          [264.1, 323.3, 7.35, "#db9b99", -113, -15, 0.435],
          [276, 323.3, 7.35, "#d79a9f", -110, -57, 0.006],
          [287.8, 323.3, 7.35, "#d699a2", -68, -89, 0.348],
          [299.7, 323.3, 6.09, "#cfa0a4", -91, 9, 0.172],
          [311.6, 323.3, 4.82, "#b08f8c", -147, 18, 0.435],
          [323.4, 323.3, 7.35, "#e09d8f", -138, -118, 0.153],
          [335.3, 323.3, 7.35, "#e39f84", -109, -38, 0.102],
          [347.1, 323.3, 7.35, "#d9a480", -144, -19, 0.093],
          [359, 323.3, 7.35, "#d9a371", -170, -48, 0.379],
          [370.8, 323.3, 7.35, "#daa161", -123, -168, 0.17],
          [382.7, 323.3, 7.35, "#da9b54", -159, -130, 0.304],
          [394.6, 323.3, 7.35, "#e48728", 1, -105, 0.094],
          [406.4, 323.3, 7.35, "#e37720", -159, -194, 0.356],
          [418.3, 323.3, 7.35, "#e3631c", -11, -126, 0.359],
          [430.1, 323.3, 7.35, "#e34f1a", 135, -278, 0.189],
          [442, 323.3, 6.09, "#d65c3f", -17, -91, 0.049],
          [453.8, 323.3, 6.09, "#b05b4e", 100, -242, 0.221],
          [477.6, 323.3, 6.09, "#cb6a63", 72, -229, 0.058],
          [489.4, 323.3, 6.09, "#c67c77", 258, -115, 0.046],
          [501.3, 323.3, 4.82, "#604d48", 112, -161, 0.04],
          [264.1, 335.1, 7.35, "#e39f86", -226, -71, 0.102],
          [276, 335.1, 7.35, "#e19e8b", -88, -106, 0.373],
          [287.8, 335.1, 7.35, "#e19e8e", -217, -190, 0.086],
          [299.7, 335.1, 7.35, "#e29f8c", -185, 13, 0.35],
          [311.6, 335.1, 4.82, "#b49080", -82, -101, 0.026],
          [323.4, 335.1, 6.09, "#d9a488", -119, -41, 0.063],
          [335.3, 335.1, 7.35, "#e59f6c", -209, -128, 0.254],
          [347.1, 335.1, 7.35, "#daa371", -143, -109, 0.223],
          [359, 335.1, 7.35, "#daa264", -222, -35, 0.344],
          [370.8, 335.1, 7.35, "#d99d58", -107, -250, 0.236],
          [394.6, 335.1, 7.35, "#d98b48", -132, -65, 0.296],
          [406.4, 335.1, 7.35, "#e46d1e", -53, -109, 0.296],
          [418.3, 335.1, 7.35, "#e35a1a", -81, -172, 0.3],
          [430.1, 335.1, 6.09, "#d7623d", -36, -128, 0.267],
          [442, 335.1, 6.09, "#d55a41", 151, -164, 0.375],
          [453.8, 335.1, 6.09, "#d35847", 31, -148, 0.173],
          [465.7, 335.1, 6.09, "#ce6257", 204, -95, 0.259],
          [477.6, 335.1, 6.09, "#c9716a", 269, -109, 0.374],
          [489.4, 335.1, 4.82, "#654b47", 107, -162, 0.393],
          [264.1, 347, 7.35, "#d9a37c", -92, -54, 0.327],
          [276, 347, 7.35, "#e69f6e", -251, -2, 0.205],
          [287.8, 347, 7.35, "#e49f74", -210, -210, 0.238],
          [299.7, 347, 7.35, "#e6a070", -232, 41, 0.366],
          [311.6, 347, 6.09, "#d9a37c", -83, -41, 0.05],
          [335.3, 347, 6.09, "#daa36b", -243, 28, 0.257],
          [347.1, 347, 7.35, "#d9a062", -205, -82, 0.332],
          [359, 347, 7.35, "#d99d58", -104, -110, 0.215],
          [370.8, 347, 7.35, "#da974f", -135, -212, 0.368],
          [382.7, 347, 7.35, "#d98d48", -196, -77, 0.079],
          [406.4, 347, 7.35, "#d87540", -68, -256, 0.075],
          [418.3, 347, 6.09, "#d7693e", 28, -135, 0.207],
          [430.1, 347, 6.09, "#d75d3f", -127, -231, 0.304],
          [442, 347, 6.09, "#d45744", 42, -122, 0.017],
          [453.8, 347, 6.09, "#d05b4f", 11, -269, 0.124],
          [465.7, 347, 6.09, "#cc665e", 97, -157, 0.179],
          [264.1, 358.9, 4.82, "#79644e", -305, -26, 0.116],
          [276, 358.9, 7.35, "#e59d56", -228, -121, 0.16],
          [287.8, 358.9, 7.35, "#e69e58", -268, 42, 0.035],
          [299.7, 358.9, 7.35, "#e59c54", -293, -56, 0.349],
          [323.4, 358.9, 4.82, "#b68f62", -135, -123, 0.114],
          [335.3, 358.9, 4.82, "#b58d5e", -236, -47, 0.376],
          [347.1, 358.9, 7.35, "#da9b55", -83, -48, 0.147],
          [359, 358.9, 7.35, "#d9954e", -168, -163, 0.283],
          [370.8, 358.9, 7.35, "#d98e48", -150, -119, 0.369],
          [394.6, 358.9, 7.35, "#d87741", -77, -141, 0.01],
          [418.3, 358.9, 6.09, "#d7603f", -70, -115, 0.063],
          [430.1, 358.9, 6.09, "#d55841", -80, -121, 0.387],
          [453.8, 358.9, 6.09, "#cf5f55", 53, -135, 0.028],
          [465.7, 358.9, 6.09, "#ca6c65", 51, -108, 0.063],
          [276, 370.7, 6.09, "#d99e5b", -290, -6, 0.109],
          [287.8, 370.7, 7.35, "#e6983e", -292, 85, 0.028],
          [299.7, 370.7, 7.35, "#e6983e", -197, -29, 0.444],
          [311.6, 370.7, 7.35, "#e6973b", -253, -83, 0.449],
          [323.4, 370.7, 7.35, "#e59335", -222, -116, 0.147],
          [347.1, 370.7, 6.09, "#b48553", -267, -134, 0.013],
          [359, 370.7, 7.35, "#d98b47", -196, -120, 0.237],
          [370.8, 370.7, 7.35, "#d98244", -178, 12, 0.35],
          [382.7, 370.7, 7.35, "#d87741", -133, 12, 0.131],
          [394.6, 370.7, 6.09, "#b36a4c", -154, -8, 0.173],
          [406.4, 370.7, 6.09, "#b3634b", -149, -172, 0.237],
          [418.3, 370.7, 6.09, "#b25e4c", -170, -206, 0.33],
          [430.1, 370.7, 6.09, "#d45745", -67, -173, 0.13],
          [442, 370.7, 6.09, "#d15c50", 149, -41, 0.443],
          [453.8, 370.7, 6.09, "#cd675e", 257, -159, 0.343],
          [465.7, 370.7, 6.09, "#c8766f", 250, -132, 0.042],
          [477.6, 370.7, 6.09, "#976e69", 188, -86, 0.4],
          [287.8, 382.6, 4.82, "#b58756", -160, -26, 0.015],
          [299.7, 382.6, 7.35, "#e58c2d", -220, 86, 0.173],
          [323.4, 382.6, 7.35, "#e48528", -99, 60, 0.331],
          [347.1, 382.6, 4.82, "#785b42", -124, 56, 0.343],
          [370.8, 382.6, 7.35, "#d87540", -152, -44, 0.029],
          [382.7, 382.6, 7.35, "#d86b3e", -130, 83, 0.168],
          [406.4, 382.6, 4.82, "#784b40", -227, 134, 0.181],
          [418.3, 382.6, 6.09, "#b05b4e", -170, 36, 0.307],
          [430.1, 382.6, 6.09, "#ab5b51", -200, -189, 0.103],
          [442, 382.6, 6.09, "#cd645b", 149, -67, 0.397],
          [453.8, 382.6, 6.09, "#c97169", 228, -105, 0.241],
          [465.7, 382.6, 6.09, "#c5827b", 200, 37, 0.356],
          [477.6, 382.6, 6.09, "#92736e", 177, -37, 0.243],
          [489.4, 382.6, 6.09, "#8e7975", 176, -75, 0.25],
          [501.3, 382.6, 4.82, "#58504c", 146, -89, 0.446],
          [276, 394.4, 4.82, "#b57e50", -93, -39, 0.179],
          [287.8, 394.4, 6.09, "#d98947", -114, 65, 0.018],
          [299.7, 394.4, 7.35, "#e57b23", -175, 74, 0.101],
          [311.6, 394.4, 7.35, "#e47821", -208, 102, 0.1],
          [335.3, 394.4, 7.35, "#d97f43", -103, 74, 0.336],
          [370.8, 394.4, 4.82, "#795040", -141, 99, 0.442],
          [418.3, 394.4, 6.09, "#ac5b51", -223, 168, 0.233],
          [430.1, 394.4, 6.09, "#a75e56", 29, 269, 0.308],
          [442, 394.4, 6.09, "#ca6e67", 190, 159, 0.244],
          [465.7, 394.4, 6.09, "#c18e89", 97, 77, 0.246],
          [477.6, 394.4, 6.09, "#8f7872", 181, 163, 0.152],
          [489.4, 394.4, 6.09, "#8b7c77", 186, 60, 0.247],
          [501.3, 394.4, 4.82, "#57514d", 120, 21, 0.079],
          [513.1, 394.4, 4.82, "#56514d", 182, 124, 0.308],
          [276, 406.3, 4.82, "#b5744d", -224, -93, 0.098],
          [287.8, 406.3, 7.35, "#e3671c", -91, 60, 0.443],
          [299.7, 406.3, 7.35, "#e3661c", -214, 11, 0.406],
          [311.6, 406.3, 7.35, "#e2621a", -100, 70, 0.02],
          [323.4, 406.3, 7.35, "#e35e1a", -248, 154, 0.001],
          [335.3, 406.3, 7.35, "#d86f3f", -288, 71, 0.266],
          [347.1, 406.3, 7.35, "#d7693e", -174, 106, 0.206],
          [370.8, 406.3, 6.09, "#b3604a", -228, -27, 0.073],
          [382.7, 406.3, 4.82, "#764a3f", -272, -11, 0.179],
          [430.1, 406.3, 6.09, "#a3625b", -60, 179, 0.338],
          [442, 406.3, 6.09, "#c67b74", 141, 262, 0.379],
          [465.7, 406.3, 6.09, "#bd9a93", 217, 102, 0.14],
          [501.3, 406.3, 6.09, "#87817d", 91, 21, 0.135],
          [513.1, 406.3, 6.09, "#86827e", 76, 56, 0.437],
          [276, 418.1, 4.82, "#b3684c", -165, -58, 0.117],
          [299.7, 418.1, 7.35, "#e35019", -122, 37, 0.316],
          [311.6, 418.1, 7.35, "#e34e19", -137, 22, 0.431],
          [323.4, 418.1, 7.35, "#d7653e", -293, -46, 0.214],
          [347.1, 418.1, 7.35, "#d75d3e", -221, 26, 0.198],
          [359, 418.1, 7.35, "#d65940", -92, 80, 0.427],
          [370.8, 418.1, 7.35, "#d45844", -118, 133, 0.174],
          [382.7, 418.1, 6.09, "#ae5b50", -114, 8, 0.293],
          [430.1, 418.1, 4.82, "#664b45", -39, 286, 0.374],
          [442, 418.1, 6.09, "#c28a83", 74, 95, 0.438],
          [453.8, 418.1, 4.82, "#927570", 163, 233, 0.272],
          [477.6, 418.1, 6.09, "#8a7e79", 207, 20, 0.036],
          [489.4, 418.1, 4.82, "#57514d", 87, 40, 0.186],
          [501.3, 418.1, 6.09, "#86827e", 252, 159, 0.346],
          [525, 418.1, 4.82, "#55514d", 301, -38, 0.252],
          [299.7, 430, 6.09, "#d65d3f", -197, 190, 0.122],
          [311.6, 430, 7.35, "#e33e1d", -129, 111, 0.037],
          [323.4, 430, 7.35, "#d55a40", -132, 75, 0.317],
          [335.3, 430, 7.35, "#d55842", -113, 141, 0.386],
          [359, 430, 7.35, "#d35847", -97, 99, 0.14],
          [370.8, 430, 7.35, "#d05b4d", -242, 94, 0.393],
          [382.7, 430, 6.09, "#a85c54", -198, 207, 0.12],
          [442, 430, 6.09, "#be9791", -80, 232, 0.294],
          [453.8, 430, 6.09, "#bba29d", 213, 142, 0.032],
          [465.7, 430, 6.09, "#baaaa4", 70, 152, 0.223],
          [477.6, 430, 6.09, "#87807d", 139, 267, 0.197],
          [489.4, 430, 6.09, "#86827e", 35, 108, 0.145],
          [501.3, 430, 6.09, "#85827e", 244, 100, 0.305],
          [513.1, 430, 6.09, "#85827e", 238, 164, 0.4],
          [525, 430, 6.09, "#85827e", 301, -13, 0.057],
          [536.9, 430, 4.82, "#55514d", 258, 54, 0.331],
          [299.7, 441.9, 7.35, "#e23e28", -214, 181, 0.164],
          [311.6, 441.9, 6.09, "#d35746", -298, 8, 0.379],
          [323.4, 441.9, 7.35, "#d35849", -144, 59, 0.14],
          [335.3, 441.9, 7.35, "#d25a4d", -207, 85, 0.139],
          [347.1, 441.9, 7.35, "#d15c4f", -74, 195, 0.431],
          [370.8, 441.9, 7.35, "#cc675d", -175, 91, 0.38],
          [382.7, 441.9, 6.09, "#a3625b", -43, 155, 0.369],
          [442, 441.9, 4.82, "#5b4f4a", 23, 155, 0.055],
          [465.7, 441.9, 4.82, "#88817c", 213, 193, 0.256],
          [489.4, 441.9, 6.09, "#85837f", 283, 119, 0.318],
          [501.3, 441.9, 4.82, "#55514d", 85, 211, 0.423],
          [513.1, 441.9, 6.09, "#85827e", 120, 32, 0.341],
          [525, 441.9, 4.82, "#55514d", 189, 155, 0.121],
          [311.6, 453.7, 6.09, "#cf5f54", -72, 96, 0.29],
          [323.4, 453.7, 7.35, "#e35449", -220, 100, 0.109],
          [335.3, 453.7, 7.35, "#cd655d", -148, 125, 0.318],
          [347.1, 453.7, 7.35, "#cc6961", -169, 84, 0.366],
          [359, 453.7, 7.35, "#c97068", -97, 155, 0.377],
          [370.8, 453.7, 6.09, "#9e6660", -115, 88, 0.151],
          [453.8, 453.7, 6.09, "#b7afab", 90, 136, 0.204],
          [465.7, 453.7, 6.09, "#b7b3ad", 49, 252, 0.314],
          [477.6, 453.7, 6.09, "#85827e", 21, 228, 0.313],
          [489.4, 453.7, 6.09, "#85827e", 61, 71, 0.192],
          [513.1, 453.7, 6.09, "#85827e", 155, 127, 0.267],
          [525, 453.7, 4.82, "#55514d", 156, 248, 0.044],
          [536.9, 453.7, 4.82, "#55514d", 221, 102, 0.132],
          [548.7, 453.7, 4.82, "#55514d", 98, 184, 0.405],
          [287.8, 465.6, 4.82, "#6c4944", -190, 7, 0.265],
          [299.7, 465.6, 7.35, "#e46b62", -151, 130, 0.221],
          [311.6, 465.6, 6.09, "#ca6e66", -210, 73, 0.329],
          [335.3, 465.6, 7.35, "#c87771", -114, 150, 0.14],
          [347.1, 465.6, 7.35, "#c57c76", -254, 154, 0.023],
          [359, 465.6, 7.35, "#c4837c", -108, 101, 0.005],
          [370.8, 465.6, 7.35, "#c18a84", -47, 128, 0.183],
          [382.7, 465.6, 4.82, "#604d48", -48, 145, 0.214],
          [453.8, 465.6, 4.82, "#85827e", 113, 155, 0.275],
          [465.7, 465.6, 6.09, "#b6b4af", 216, 204, 0.367],
          [477.6, 465.6, 4.82, "#55514d", 1, 147, 0.188],
          [489.4, 465.6, 6.09, "#85827e", 135, 189, 0.26],
          [513.1, 465.6, 4.82, "#55514d", 125, 195, 0.352],
          [525, 465.6, 6.09, "#85827e", 168, 117, 0.014],
          [536.9, 465.6, 6.09, "#85827e", 214, 175, 0.261],
          [548.7, 465.6, 4.82, "#55514d", 180, 45, 0.209],
          [287.8, 477.4, 4.82, "#654a46", -175, 25, 0.179],
          [299.7, 477.4, 7.35, "#c4817b", -76, 67, 0.032],
          [311.6, 477.4, 6.09, "#996c67", -100, 88, 0.365],
          [323.4, 477.4, 7.35, "#e4948d", -154, 77, 0.247],
          [335.3, 477.4, 7.35, "#c18a84", -46, 139, 0.22],
          [359, 477.4, 7.35, "#be948e", -67, 126, 0.163],
          [370.8, 477.4, 6.09, "#907671", -37, 205, 0.386],
          [382.7, 477.4, 4.82, "#5b4f4a", -29, 105, 0.001],
          [465.7, 477.4, 6.09, "#85827e", 64, 173, 0.329],
          [477.6, 477.4, 6.09, "#85827e", 54, 139, 0.351],
          [489.4, 477.4, 4.82, "#55514d", 91, 119, 0.263],
          [513.1, 477.4, 6.09, "#85827e", 147, 108, 0.063],
          [536.9, 477.4, 6.09, "#b6b4af", 136, 75, 0.346],
          [287.8, 489.3, 4.82, "#5f4d49", -224, 34, 0.16],
          [299.7, 489.3, 7.35, "#be9590", -183, 232, 0.154],
          [311.6, 489.3, 6.09, "#92746f", -131, 235, 0.09],
          [335.3, 489.3, 7.35, "#e6bbb5", -165, 107, 0.046],
          [347.1, 489.3, 7.35, "#e6c1bb", -148, 233, 0.01],
          [465.7, 489.3, 4.82, "#55514d", -1, 203, 0.047],
          [477.6, 489.3, 6.09, "#85827e", 230, 153, 0.4],
          [513.1, 489.3, 6.09, "#b6b4af", 167, 202, 0.141],
          [525, 489.3, 4.82, "#85827e", 150, 145, 0.215],
          [536.9, 489.3, 6.09, "#b6b4af", 70, 90, 0.184],
          [548.7, 489.3, 6.09, "#b6b4af", 66, 146, 0.2],
          [560.6, 489.3, 4.82, "#85827e", 172, 38, 0.367],
          [287.8, 501.1, 4.82, "#5b504b", -71, 56, 0.198],
          [299.7, 501.1, 7.35, "#bba49f", -79, 85, 0.131],
          [311.6, 501.1, 6.09, "#8c7c76", -111, 169, 0.015],
          [347.1, 501.1, 7.35, "#e6d5cf", -149, 107, 0.19],
          [359, 501.1, 7.35, "#e7d8d3", -145, 74, 0.384],
          [370.8, 501.1, 4.82, "#57514d", -41, 153, 0.329],
          [477.6, 501.1, 6.09, "#85827e", 137, 105, 0.346],
          [513.1, 501.1, 6.09, "#b6b4af", 18, 219, 0.181],
          [536.9, 501.1, 6.09, "#b6b4af", 137, 252, 0.37],
          [548.7, 501.1, 4.82, "#85827e", 111, 170, 0.142],
          [287.8, 513, 4.82, "#57514d", -180, 234, 0.298],
          [299.7, 513, 7.35, "#b8ada9", -88, 152, 0.373],
          [311.6, 513, 6.09, "#b8aea9", -175, 70, 0.162],
          [323.4, 513, 7.35, "#e6ddd6", -218, 160, 0.058],
          [359, 513, 7.35, "#b7b2ad", -55, 91, 0.124],
          [489.4, 513, 6.09, "#85827e", 20, 185, 0.165],
          [501.3, 513, 6.09, "#85827e", 83, 155, 0.094],
          [513.1, 513, 6.09, "#b6b4af", 37, 189, 0.04],
          [525, 513, 6.09, "#b6b4af", 136, 139, 0.414],
          [536.9, 513, 4.82, "#85827e", 109, 193, 0.379],
          [548.7, 513, 4.82, "#85827e", 124, 252, 0.132],
          [560.6, 513, 6.09, "#b6b4af", 207, 180, 0.097],
          [572.4, 513, 6.09, "#b6b4af", 162, 94, 0.282],
          [584.3, 513, 4.82, "#85827e", 54, 89, 0.097],
          [299.7, 524.9, 7.35, "#e7e4de", -222, 92, 0.275],
          [311.6, 524.9, 6.09, "#b7b2ad", -51, 135, 0.259],
          [335.3, 524.9, 7.35, "#e7e4de", -226, 148, 0.127],
          [347.1, 524.9, 7.35, "#b6b4af", -149, 174, 0.357],
          [370.8, 524.9, 4.82, "#55514d", 10, 166, 0.266],
          [489.4, 524.9, 4.82, "#55514d", 31, 183, 0.392],
          [501.3, 524.9, 6.09, "#b6b4af", 13, 154, 0.272],
          [513.1, 524.9, 4.82, "#85827e", -7, 258, 0.37],
          [525, 524.9, 6.09, "#b6b4af", 86, 216, 0.111],
          [536.9, 524.9, 6.09, "#b6b4af", 124, 260, 0.415],
          [548.7, 524.9, 4.82, "#85827e", 41, 250, 0.401],
          [560.6, 524.9, 6.09, "#b6b4af", 78, 99, 0.36],
          [572.4, 524.9, 6.09, "#b6b4af", 127, 154, 0.278],
          [584.3, 524.9, 4.82, "#55514d", 197, 99, 0.234],
          [287.8, 536.7, 6.09, "#b6b4af", -123, 140, 0.32],
          [299.7, 536.7, 6.09, "#b6b4af", -92, 293, 0.047],
          [311.6, 536.7, 6.09, "#b6b4af", -73, 88, 0.167],
          [323.4, 536.7, 7.35, "#e7e5df", -185, 85, 0.173],
          [335.3, 536.7, 7.35, "#e7e5df", -120, 83, 0.425],
          [359, 536.7, 7.35, "#b6b4af", -43, 296, 0.381],
          [370.8, 536.7, 6.09, "#85827e", -114, 200, 0.234],
          [525, 536.7, 6.09, "#b6b4af", 117, 92, 0.098],
          [536.9, 536.7, 6.09, "#b6b4af", 4, 136, 0.388],
          [548.7, 536.7, 6.09, "#b6b4af", 64, 273, 0.446],
          [560.6, 536.7, 6.09, "#b6b4af", 173, 215, 0.293],
          [572.4, 536.7, 6.09, "#b6b4af", 80, 211, 0.035],
          [584.3, 536.7, 6.09, "#85827e", 255, 173, 0.072],
          [596.1, 536.7, 4.82, "#55514d", 169, 75, 0.076],
          [287.8, 548.6, 6.09, "#b6b4af", -168, 105, 0.058],
          [299.7, 548.6, 6.09, "#b6b4af", -153, 148, 0.253],
          [311.6, 548.6, 6.09, "#b6b4af", -141, 55, 0.053],
          [335.3, 548.6, 7.35, "#e7e5df", -115, 112, 0.329],
          [347.1, 548.6, 7.35, "#b6b4af", 24, 183, 0.053],
          [359, 548.6, 7.35, "#b6b4af", -35, 212, 0.242],
          [370.8, 548.6, 4.82, "#55514d", 12, 305, 0.135],
          [525, 548.6, 4.82, "#85827e", 189, 199, 0.432],
          [536.9, 548.6, 6.09, "#b6b4af", 106, 214, 0.202],
          [548.7, 548.6, 6.09, "#b6b4af", 64, 278, 0.182],
          [560.6, 548.6, 4.82, "#85827e", 178, 196, 0.219],
          [572.4, 548.6, 6.09, "#b6b4af", 216, 124, 0.222],
          [287.8, 560.4, 6.09, "#b6b4af", -195, 209, 0.294],
          [311.6, 560.4, 6.09, "#b6b4af", -27, 106, 0.046],
          [323.4, 560.4, 7.35, "#e7e5df", -197, 120, 0.335],
          [335.3, 560.4, 7.35, "#e7e5df", -71, 276, 0.168],
          [347.1, 560.4, 6.09, "#85827e", 8, 96, 0.305],
          [513.1, 560.4, 6.09, "#b6b4af", -10, 155, 0.174],
          [548.7, 560.4, 6.09, "#b6b4af", 157, 225, 0.359],
          [560.6, 560.4, 6.09, "#b6b4af", 50, 103, 0.128],
          [572.4, 560.4, 6.09, "#b6b4af", 20, 126, 0.038],
          [584.3, 560.4, 4.82, "#55514d", 244, 96, 0.035],
          [596.1, 560.4, 4.82, "#85827e", 112, 64, 0.068],
          [608, 560.4, 4.82, "#85827e", 77, 62, 0.388],
          [287.8, 572.3, 7.35, "#e7e5df", -177, 172, 0.369],
          [299.7, 572.3, 6.09, "#b6b4af", -137, 223, 0.122],
          [311.6, 572.3, 6.09, "#b6b4af", -110, 70, 0.277],
          [323.4, 572.3, 7.35, "#e7e5df", -109, 287, 0.086],
          [335.3, 572.3, 7.35, "#e7e5df", 19, 183, 0.356],
          [347.1, 572.3, 7.35, "#b6b4af", -71, 250, 0.34],
          [359, 572.3, 6.09, "#85827e", 9, 142, 0.069],
          [513.1, 572.3, 4.82, "#85827e", 87, 139, 0.366],
          [525, 572.3, 6.09, "#b6b4af", 43, 118, 0.38],
          [536.9, 572.3, 4.82, "#85827e", 74, 222, 0.048],
          [548.7, 572.3, 6.09, "#b6b4af", -5, 173, 0.109],
          [560.6, 572.3, 6.09, "#b6b4af", 105, 211, 0.411],
          [584.3, 572.3, 6.09, "#b6b4af", 105, 36, 0.412],
          [608, 572.3, 4.82, "#85827e", 38, 166, 0.096],
          [287.8, 584.2, 7.35, "#e7e5df", -90, 273, 0.062],
          [299.7, 584.2, 6.09, "#b6b4af", -160, 198, 0.22],
          [323.4, 584.2, 7.35, "#e7e5df", -115, 248, 0.184],
          [335.3, 584.2, 7.35, "#e7e5df", -71, 73, 0.086],
          [347.1, 584.2, 7.35, "#b6b4af", -35, 112, 0.344],
          [359, 584.2, 6.09, "#85827e", 10, 127, 0.286],
          [370.8, 584.2, 4.82, "#55514d", -88, 254, 0.048],
          [525, 584.2, 6.09, "#b6b4af", -2, 265, 0.424],
          [536.9, 584.2, 6.09, "#b6b4af", 261, 144, 0.035],
          [548.7, 584.2, 4.82, "#85827e", 10, 120, 0.139],
          [560.6, 584.2, 6.09, "#b6b4af", 173, 188, 0.064],
          [572.4, 584.2, 6.09, "#b6b4af", 39, 179, 0.38],
          [584.3, 584.2, 6.09, "#b6b4af", 279, 127, 0.076],
          [596.1, 584.2, 6.09, "#b6b4af", 81, 239, 0.08],
          [608, 584.2, 4.82, "#85827e", 46, 108, 0.381],
          [287.8, 596, 7.35, "#e7e5df", -69, 68, 0.125],
          [299.7, 596, 6.09, "#b6b4af", -80, 183, 0.192],
          [311.6, 596, 6.09, "#b6b4af", -29, 258, 0.184],
          [323.4, 596, 7.35, "#e7e5df", -148, 246, 0.227],
          [335.3, 596, 7.35, "#e7e5df", -70, 94, 0.006],
          [347.1, 596, 4.82, "#55514d", -136, 114, 0.235],
          [536.9, 596, 6.09, "#b6b4af", 36, 270, 0.225],
          [560.6, 596, 6.09, "#b6b4af", 16, 92, 0.148],
          [572.4, 596, 6.09, "#b6b4af", 88, 211, 0.294],
          [584.3, 596, 6.09, "#b6b4af", 278, 102, 0.035],
          [596.1, 596, 6.09, "#b6b4af", 162, 52, 0.242],
          [608, 596, 6.09, "#b6b4af", 166, 51, 0.084],
          [619.9, 596, 4.82, "#55514d", 81, 65, 0.297],
          [276, 607.9, 4.82, "#85827e", -13, 90, 0.096],
          [287.8, 607.9, 7.35, "#e7e5df", -195, 163, 0.214],
          [299.7, 607.9, 6.09, "#b6b4af", 7, 148, 0.404],
          [311.6, 607.9, 7.35, "#e7e5df", -176, 164, 0.293],
          [323.4, 607.9, 7.35, "#e7e5df", 16, 110, 0.176],
          [335.3, 607.9, 7.35, "#e7e5df", -160, 194, 0.119],
          [347.1, 607.9, 7.35, "#b6b4af", -148, 121, 0.045],
          [359, 607.9, 4.82, "#55514d", -100, 149, 0.447],
          [536.9, 607.9, 6.09, "#b6b4af", 131, 77, 0.109],
          [548.7, 607.9, 6.09, "#b6b4af", 13, 259, 0.006],
          [560.6, 607.9, 4.82, "#55514d", 142, 166, 0.027],
          [572.4, 607.9, 6.09, "#85827e", 104, 242, 0.401],
          [584.3, 607.9, 6.09, "#b6b4af", 187, 206, 0.121],
          [596.1, 607.9, 6.09, "#b6b4af", 115, 285, 0.213],
          [608, 607.9, 6.09, "#85827e", 93, 132, 0.403],
          [287.8, 619.7, 7.35, "#e7e5df", -92, 142, 0.221],
          [299.7, 619.7, 6.09, "#b6b4af", -62, 188, 0.274],
          [311.6, 619.7, 7.35, "#e7e5df", -90, 278, 0.215],
          [323.4, 619.7, 7.35, "#e7e5df", -157, 152, 0.025],
          [335.3, 619.7, 7.35, "#b6b4af", -86, 76, 0.316],
          [347.1, 619.7, 7.35, "#b6b4af", -210, 220, 0.138],
          [359, 619.7, 7.35, "#b6b4af", 32, 145, 0.096],
          [370.8, 619.7, 4.82, "#55514d", -127, 218, 0.037],
          [548.7, 619.7, 6.09, "#85827e", 112, 286, 0.334],
          [560.6, 619.7, 6.09, "#85827e", 186, 235, 0.323],
          [572.4, 619.7, 6.09, "#85827e", 93, 98, 0.184],
          [584.3, 619.7, 6.09, "#85827e", 189, 100, 0.438],
          [608, 619.7, 6.09, "#85827e", 12, 203, 0.282],
          [276, 631.6, 4.82, "#85827e", -58, 134, 0.003],
          [287.8, 631.6, 7.35, "#e7e5df", -63, 88, 0.367],
          [299.7, 631.6, 6.09, "#b6b4af", -162, 104, 0.301],
          [311.6, 631.6, 7.35, "#e7e5df", -43, 109, 0.045],
          [323.4, 631.6, 7.35, "#e7e5df", -3, 227, 0.398],
          [335.3, 631.6, 7.35, "#b6b4af", -137, 148, 0.26],
          [347.1, 631.6, 7.35, "#b6b4af", -85, 72, 0.21],
          [359, 631.6, 4.82, "#55514d", 35, 240, 0.328],
          [548.7, 631.6, 4.82, "#55514d", 74, 68, 0.017],
          [560.6, 631.6, 6.09, "#85827e", 109, 72, 0.163],
          [572.4, 631.6, 6.09, "#85827e", 0, 205, 0.186],
          [584.3, 631.6, 6.09, "#85827e", 105, 121, 0.069],
          [596.1, 631.6, 6.09, "#85827e", 30, 301, 0.395],
          [608, 631.6, 4.82, "#55514d", 232, 195, 0.155],
          [276, 643.4, 4.82, "#85827e", -12, 188, 0.444],
          [287.8, 643.4, 7.35, "#e7e5df", -128, 143, 0.324],
          [323.4, 643.4, 7.35, "#e7e5df", -20, 93, 0.261],
          [335.3, 643.4, 7.35, "#b6b4af", -62, 66, 0.197],
          [347.1, 643.4, 7.35, "#b6b4af", -95, 106, 0.262],
          [359, 643.4, 6.09, "#85827e", -61, 277, 0.45],
          [560.6, 643.4, 6.09, "#85827e", 81, 98, 0.244],
          [572.4, 643.4, 6.09, "#85827e", 161, 256, 0.145],
          [584.3, 643.4, 6.09, "#85827e", 61, 248, 0.28],
          [596.1, 643.4, 4.82, "#55514d", 32, 93, 0.401],
          [276, 655.3, 4.82, "#85827e", 12, 154, 0.323],
          [287.8, 655.3, 7.35, "#e7e5df", -163, 174, 0.094],
          [299.7, 655.3, 6.09, "#b6b4af", 6, 118, 0.147],
          [311.6, 655.3, 7.35, "#e7e5df", -35, 291, 0.154],
          [323.4, 655.3, 7.35, "#e7e5df", -185, 143, 0.212],
          [347.1, 655.3, 7.35, "#b6b4af", 43, 235, 0.162],
          [359, 655.3, 6.09, "#85827e", -12, 111, 0.207],
          [560.6, 655.3, 4.82, "#55514d", -10, 177, 0.39],
          [276, 667.2, 6.09, "#b6b4af", 26, 270, 0.404],
          [323.4, 667.2, 7.35, "#b6b4af", 3, 217, 0.367],
          [335.3, 667.2, 7.35, "#e7e5df", -37, 212, 0.257],
          [347.1, 667.2, 4.82, "#55514d", -83, 194, 0.177],
          [276, 679, 6.09, "#b6b4af", -249, 145, 0.338],
          [287.8, 679, 6.09, "#85827e", -86, 86, 0.38],
          [299.7, 679, 6.09, "#85827e", -95, 133, 0.245],
          [311.6, 679, 7.35, "#b6b4af", 29, 246, 0.069],
          [323.4, 679, 7.35, "#b6b4af", -7, 129, 0.202],
          [347.1, 679, 4.82, "#85827e", -152, 129, 0.032],
          [276, 690.9, 6.09, "#85827e", -135, 87, 0.228],
          [287.8, 690.9, 7.35, "#b6b4af", -70, 72, 0.265],
          [299.7, 690.9, 7.35, "#b6b4af", -61, 211, 0.342],
          [311.6, 690.9, 7.35, "#b6b4af", 1, 300, 0.135],
          [323.4, 690.9, 7.35, "#b6b4af", -36, 245, 0.169],
          [335.3, 690.9, 6.09, "#85827e", -70, 271, 0.238],
          [276, 702.7, 4.82, "#55514d", -101, 184, 0.077],
          [287.8, 702.7, 6.09, "#85827e", -114, 102, 0.213],
          [311.6, 702.7, 7.35, "#b6b4af", -134, 231, 0.277],
          [323.4, 702.7, 6.09, "#85827e", 29, 120, 0.053],
          [335.3, 702.7, 4.82, "#55514d", 24, 96, 0.015],
        ],
      };
      function tv(e = window.innerWidth) {
        let t = Math.min(window.devicePixelRatio || 1, 2),
          a = Math.floor(0.5 * Math.max(4, Math.round(td(e) * t))),
          i = Math.max(2, Math.round(0.46 * a)),
          r = Math.max(2, Math.round(0.38 * a));
        return {
          q: a / t,
          mark: i / t,
          markStroke: Math.max(0.3 * i, 0.96 * t) / t,
          base: r / t,
          baseStroke: Math.max(1, Math.round(r / 3)) / t,
        };
      }
      let tx = (e, t, a = 0) => {
        let i = 43758.5453 * Math.sin(127.1 * e + 311.7 * t + 74.7 * a);
        return i - Math.floor(i);
      };
      function ty(e, t, a, i, r, n) {
        let l = (e) => Math.round(e * r) / r,
          o = Math.max(2 / r, l(i)),
          s = Math.max(1 / r, l(n)),
          c = l(t - o / 2),
          d = l(a - o / 2),
          u = l((o - s) / 2);
        (e.beginPath(),
          e.rect(c + u, d, s, o),
          e.rect(c, d + u, o, s),
          e.fill());
      }
      function tw(e, t, a) {
        let i = Math.min(window.devicePixelRatio || 1, 2);
        ((e.style.width = `${t}px`),
          (e.style.height = `${a}px`),
          (e.width = Math.round(t * i)),
          (e.height = Math.round(a * i)));
        let r = t > 0 && a > 0 ? e.getContext("2d") : null;
        return (r?.setTransform(i, 0, 0, i, 0, 0), r);
      }
      let tM = [0.66],
        tA = (e) => (0, ek.f)((0, ek.u)(ek.U, (0, h.O)(e)));
      function tC() {
        let e = (0, i.useRef)(null);
        return (
          (0, i.useEffect)(() => {
            let t = e.current,
              a = t?.parentElement,
              i = a?.parentElement,
              r = i?.querySelector("[data-keys-stage]");
            if (!t || !a || !i || !r) return;
            let n = window.matchMedia("(prefers-reduced-motion: reduce)"),
              l =
                getComputedStyle(i).getPropertyValue("--d1-fg").trim() ||
                ek.h.dark.fg,
              o = null,
              s = 0,
              c = 0,
              d = tv(),
              u = 2 * d.q,
              f = 0,
              b = 0,
              m = [],
              p = [],
              g = [],
              v = new Float32Array(0),
              x = () => {
                v = new Float32Array(f * b).fill(1);
                let e = t.getBoundingClientRect(),
                  a = document.createRange();
                for (let t of (a.selectNodeContents(r), a.getClientRects())) {
                  if (t.width < 1 || t.height < 1) continue;
                  let a = Math.floor((t.left - e.left) / u) - 3,
                    i = Math.ceil((t.right - e.left) / u) + 3,
                    r = Math.floor((t.top - e.top) / u) - 3,
                    n = Math.ceil((t.bottom - e.top) / u) + 3;
                  for (let e = Math.max(0, r); e < Math.min(b, n); e += 1)
                    for (let t = Math.max(0, a); t < Math.min(f, i); t += 1) {
                      let l = Math.min(t - a, i - 1 - t, e - r, n - 1 - e),
                        o = e * f + t;
                      v[o] = Math.min(v[o] ?? 1, l >= 2 ? 0 : 0.5 - 0.25 * l);
                    }
                }
              },
              y = (e) => {
                let t = o;
                if (!t) return;
                let a = Math.min(window.devicePixelRatio || 1, 2);
                t.clearRect(0, 0, s, c);
                let {
                    q: i,
                    mark: r,
                    markStroke: n,
                    base: x,
                    baseStroke: y,
                  } = d,
                  w = (e, a) => {
                    ((t.fillStyle = e), (t.globalAlpha = a));
                  },
                  M = (e, l, o, s) =>
                    ty(
                      t,
                      (2 * e + o + 0.5) * i,
                      (2 * l + s + 0.5) * i,
                      r,
                      a,
                      n,
                    ),
                  A = (e, t) =>
                    M(
                      e,
                      t,
                      0.5 > tx(e, t, 40) ? 0 : 1,
                      0.5 > tx(e, t, 41) ? 0 : 1,
                    ),
                  C = g.length + 28,
                  k = (9 * e) % C,
                  E = new Map();
                for (let e = 0; e < 6; e += 1) {
                  let t = Math.floor(k) - e,
                    a = g[t];
                  a && t >= 0 && E.set(a[1] * f + a[0], e);
                }
                let N = p.map((e) => {
                  let t = g.findIndex(([t, a]) => t === e.x && a === e.y),
                    a = (k - t) / 9;
                  return t >= 0 && a >= 0 && a < 2.4 ? 1 - a / 2.4 : 0;
                });
                for (let r = 0; r < b; r += 1)
                  for (let n = 0; n < f; n += 1) {
                    let o = r * f + n,
                      s = v[o] ?? 1;
                    if (s <= 0) continue;
                    let c = m[o];
                    if (!c) continue;
                    let d = (0, h.O)(n / 10),
                      u = 9 + 3.5 * Math.sin(7 * c.u + 1.3),
                      b = Math.exp(-((c.e / u) ** 2)),
                      N =
                        Math.exp(-((c.e / (1.7 * u)) ** 2)) *
                        (0.45 +
                          0.55 * tx(Math.floor(n / 4), Math.floor(r / 4), 50));
                    if (N > 0.04)
                      for (let o = 0; o < 2; o += 1)
                        for (let c = 0; c < 2; c += 1) {
                          let u = 2 * n + c,
                            h = 2 * r + o;
                          if (tx(u, h, 51) > N * N * 1.4) continue;
                          let f =
                            0.5 +
                            0.5 *
                              Math.sin(
                                e * (0.4 + 0.7 * tx(u, h, 53)) +
                                  6.283 * tx(u, h, 54),
                              );
                          (w(
                            l,
                            (0.05 + 0.13 * tx(u, h, 52)) *
                              Math.sqrt(N) *
                              (0.6 + 0.4 * f) *
                              s *
                              d,
                          ),
                            ty(t, (u + 0.5) * i, (h + 0.5) * i, x, a, y));
                        }
                    let j = E.get(o);
                    if (void 0 !== j) {
                      (0 === j
                        ? w(tA((k % C) / g.length), 0.95)
                        : w(l, (0.7 / j) * s),
                        A(n, r));
                      continue;
                    }
                    let F = 1 / 0,
                      R = !1;
                    for (let t = 0; t < p.length; t += 1) {
                      let a = p[t];
                      if (!a) continue;
                      let i = n - a.x,
                        l = r - a.y,
                        o =
                          0.65 * Math.max(Math.abs(i), Math.abs(l)) +
                          0.35 * Math.hypot(i, l);
                      if (((F = Math.min(F, o)), o < 1.6)) {
                        R = !0;
                        break;
                      }
                      let c = 5.5 + 0.8 * Math.sin(0.35 * e + 2.1 * t);
                      if (o < c) {
                        let a = 0.95 * (1 - o / c) ** 0.5;
                        w(
                          tA(
                            (o / c) * 0.9 +
                              0.12 * Math.sin(Math.atan2(l, i) + 0.12 * e + t) +
                              0.12 * tx(n, r, 12),
                          ),
                          0.92 * s * d,
                        );
                        for (let e = 0; e < 2; e += 1)
                          for (let t = 0; t < 2; t += 1)
                            tx(2 * n + t, 2 * r + e, 11) < a * s &&
                              M(n, r, t, e);
                        R = !0;
                        break;
                      }
                      if (o < c + 3 && tx(n, r, 13) < 0.1 * s) {
                        (w(tA(0.7 + 0.3 * tx(n, r, 14)), 0.85 * s * d),
                          A(n, r),
                          (R = !0));
                        break;
                      }
                    }
                    if (R) continue;
                    let S = Math.floor(0.3 * e),
                      P = tx(
                        Math.floor((n - S) / 3),
                        Math.floor((r + S) / 3),
                        21,
                      ),
                      L = 0;
                    if (
                      (P > 0.3 && tx(n, r, 22) < 0.6 * b
                        ? (L =
                            0.12 > tx(n, r, 27)
                              ? 0.45 + 0.3 * tx(n, r, 2)
                              : 0.1 + 0.22 * tx(n, r, 2))
                        : c.e < 26 &&
                          tx(n, r, 23) < 0.04 * (1 - c.e / 26) &&
                          (L = 0.06 + 0.08 * tx(n, r, 24)),
                      L <= 0)
                    )
                      continue;
                    let _ =
                      0.5 +
                      0.5 *
                        Math.sin(
                          e * (0.5 + 0.9 * tx(n, r, 6)) +
                            tx(n, r, 3) * Math.PI * 2,
                        );
                    ((L *= (0.45 + 0.55 * _ * _) * s * d),
                      F < 11 && 0.18 > tx(n, r, 25)
                        ? w(
                            tA(0.62 + 0.38 * tx(n, r, 26)),
                            Math.min(0.9, 1.6 * L),
                          )
                        : w(l, L),
                      A(n, r));
                  }
                t.globalAlpha = 1;
                for (let a = 0; a < p.length; a += 1) {
                  let i = p[a];
                  if (!i || (v[i.y * f + i.x] ?? 1) <= 0) continue;
                  let r = 2.3 * u,
                    n = (i.x + 0.5) * u - r / 2,
                    o = (i.y + 0.5) * u - r / 2,
                    s = N[a] ?? 0,
                    c = 0.55 + 0.15 * Math.sin(0.8 * e + a) + 0.3 * s;
                  (t.save(),
                    (t.shadowColor = `rgb(255 255 255 / ${c})`),
                    (t.shadowBlur = u * (1.1 + 0.9 * s)),
                    (t.fillStyle = l),
                    t.beginPath(),
                    t.roundRect(n, o, r, r, 0.22 * u),
                    t.fill(),
                    t.restore());
                }
              },
              w = 0,
              M = !1,
              A = 0,
              C = 0,
              k = 0,
              E = 0,
              N = () => M && !document.hidden && s > 0 && c > 0,
              j = (e) => {
                ((w = 0),
                  N() &&
                    !n.matches &&
                    (C && (A += Math.min((e - C) / 1e3, 0.1)),
                    (C = e),
                    A - E > 0.4 && (x(), (E = A)),
                    e - k > 32 && (y(A), (k = e)),
                    (w = requestAnimationFrame(j))));
              },
              F = () => {
                (cancelAnimationFrame(w),
                  (w = 0),
                  (C = 0),
                  N() &&
                    (x(),
                    y(n.matches ? 0 : A),
                    n.matches || (w = requestAnimationFrame(j))));
              },
              R = () => {
                ((() => {
                  if (
                    ((s = a.clientWidth),
                    (c = a.clientHeight),
                    (o = tw(t, s, c)),
                    (u = 2 * (d = tv()).q),
                    (f = o ? Math.ceil(s / u) : 0),
                    (b = o ? Math.ceil(c / u) : 0),
                    (m = []),
                    (p = []),
                    (g = []),
                    !o)
                  )
                    return;
                  let e = 0 * f,
                    i = 0.34 * b,
                    r = 1.02 * f,
                    n = 0.03 * b,
                    l = Math.hypot(r - e, n - i),
                    h = (r - e) / l,
                    v = (n - i) / l;
                  for (let t = 0; t < b; t += 1)
                    for (let a = 0; a < f; a += 1) {
                      let r = a + 0.5 - e,
                        n = t + 0.5 - i;
                      m.push({
                        e: Math.abs(r * v - n * h),
                        u: (r * h + n * v) / l,
                      });
                    }
                  p = tM.map((t) => ({
                    x: Math.round(e + (r - e) * t),
                    y: Math.round(i + (n - i) * t),
                  }));
                  let y = [
                    { x: 0, y: Math.round(i) },
                    ...p,
                    { x: f - 1, y: Math.max(0, Math.round(n)) },
                  ];
                  for (let e = 0; e + 1 < y.length; e += 1) {
                    let t = y[e],
                      a = y[e + 1];
                    if (!t || !a) continue;
                    let { x: i, y: r } = t;
                    for (; (i !== a.x || r !== a.y) && g.length < 600;) {
                      g.push([i, r]);
                      let t = a.x - i,
                        n = a.y - r;
                      0 === n ||
                      (0 !== t &&
                        tx(e, g.length, 41) <
                          Math.abs(t) / (Math.abs(t) + Math.abs(n)))
                        ? (i += Math.sign(t))
                        : (r += Math.sign(n));
                    }
                  }
                  x();
                })(),
                  F());
              },
              S = new ResizeObserver(R);
            S.observe(a);
            let P = new IntersectionObserver(([e]) => {
              ((M = e?.isIntersecting ?? !1), F());
            });
            return (
              P.observe(a),
              document.addEventListener("visibilitychange", F),
              n.addEventListener("change", F),
              R(),
              () => {
                (cancelAnimationFrame(w),
                  P.disconnect(),
                  S.disconnect(),
                  document.removeEventListener("visibilitychange", F),
                  n.removeEventListener("change", F));
              }
            );
          }, []),
          (0, t.jsx)("div", {
            className: tp.default.ambient,
            "aria-hidden": !0,
            children: (0, t.jsx)("canvas", { ref: e }),
          })
        );
      }
      let tk = "+ ORTHOGONAL_API_KEY=orth_live_••••",
        tE = (e) => e * e * e * (e * (6 * e - 15) + 10);
      var tN = e.i(309177);
      function tj({ art: e, tone: a = "dark", className: r }) {
        let n = (0, i.useRef)(null);
        (0, i.useEffect)(() => {
          let e = n.current;
          if (!e) return;
          let t = window.matchMedia("(prefers-reduced-motion: reduce)"),
            a = 0,
            i = -1,
            r = !1,
            l = () => {
              if (((a = 0), !r || document.hidden)) return;
              if (t.matches) {
                (e.style.setProperty("--p", "1"), (i = -1));
                return;
              }
              let n = e.getBoundingClientRect(),
                l = window.innerHeight,
                o = 0.32 * l - n.height / 2,
                s = Math.min(1, Math.max(0, (l - n.top) / (l - o)));
              0.001 > Math.abs(s - i) ||
                ((i = s), e.style.setProperty("--p", s.toFixed(4)));
            },
            o = () => {
              a || !r || document.hidden || (a = requestAnimationFrame(l));
            },
            s = new IntersectionObserver(([e]) => {
              (r = e?.isIntersecting ?? !1)
                ? o()
                : (cancelAnimationFrame(a), (a = 0));
            });
          return (
            s.observe(e),
            window.addEventListener("scroll", o, { passive: !0 }),
            window.addEventListener("resize", o),
            document.addEventListener("visibilitychange", o),
            t.addEventListener("change", o),
            () => {
              (window.removeEventListener("scroll", o),
                window.removeEventListener("resize", o),
                document.removeEventListener("visibilitychange", o),
                t.removeEventListener("change", o),
                s.disconnect(),
                cancelAnimationFrame(a));
            }
          );
        }, []);
        let { focus: l } = e;
        return (0, t.jsxs)("svg", {
          ref: n,
          className: (0, o.f)(tN.default.art, r),
          viewBox: e.viewBox,
          "aria-hidden": !0,
          focusable: "false",
          children: [
            e.marks.map(([e, i, r, n, l, o, s]) => {
              var c, d, u;
              let h, f;
              return (0, t.jsx)(
                "path",
                {
                  className: tN.default.mark,
                  d:
                    ((c = e),
                    (d = i),
                    (h = (u = r) / 2),
                    (f = u / 6),
                    `M${+(c - f).toFixed(2)} ${+(d - h).toFixed(2)}H${+(c + f).toFixed(2)}V${+(d - f).toFixed(2)}H${+(c + h).toFixed(2)}V${+(d + f).toFixed(2)}H${+(c + f).toFixed(2)}V${+(d + h).toFixed(2)}H${+(c - f).toFixed(2)}V${+(d + f).toFixed(2)}H${+(c - h).toFixed(2)}V${+(d - f).toFixed(2)}H${+(c - f).toFixed(2)}Z`),
                  fill:
                    "light" === a
                      ? (function (e) {
                          let [t, a, i] = (0, ek.Z)(e),
                            r = Math.max(t, a, i),
                            n = (e, t, a) =>
                              e.map((e, i) =>
                                Math.round((e + ((t[i] ?? e) - e) * a) * 255),
                              ),
                            l =
                              r - Math.min(t, a, i) < 0.18
                                ? n(
                                    (0, ek.Z)("#24201d"),
                                    (0, ek.Z)("#bdb6ac"),
                                    1 - r,
                                  )
                                : n(
                                    [t, a, i],
                                    [0.82 * t, 0.82 * a, 0.82 * i],
                                    1,
                                  );
                          return `#${l.map((e) => e.toString(16).padStart(2, "0")).join("")}`;
                        })(n)
                      : n,
                  style: { "--dx": l, "--dy": o, "--d": s },
                },
                `${e},${i}`,
              );
            }),
            (0, t.jsx)("rect", {
              className: (0, o.f)(
                tN.default.focus,
                "light" === a && tN.default.focusLight,
              ),
              x: l.x - l.size / 2,
              y: l.y - l.size / 2,
              width: l.size,
              height: l.size,
            }),
          ],
        });
      }
      let tF = [0, 1, 2];
      function tR(e, t, a) {
        let i = getComputedStyle(e).getPropertyValue(t).trim();
        return /^#[0-9a-f]{6}$/i.test(i) ? (0, ek.Z)(i) : a;
      }
      let tS = (e, t, a) => [
          e[0] + (t[0] - e[0]) * a,
          e[1] + (t[1] - e[1]) * a,
          e[2] + (t[2] - e[2]) * a,
        ],
        tP = ([e, t, a], i = 1) =>
          `rgb(${Math.round(255 * e)} ${Math.round(255 * t)} ${Math.round(255 * a)} / ${i})`;
      function tL({ publishers: e, showcaseSlugs: a, copy: r = eN.m.copy }) {
        let n = new Set(a.slice(0, 8)),
          s = e.filter((e) => !n.has(e.slug)).slice(0, 7),
          c = s.map((e) => {
            let t;
            return (
              (t = e.name),
              `${t
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/^_|_$/g, "")}_API_KEY`
            );
          }),
          d = Math.max(0, ...c.map((e) => e.length)),
          u = e.length - s.length,
          b = [
            ...c.map((e) => `- ${e.padEnd(d)}=••••••`),
            ...(u > 0 ? [`  … ${u} more`] : []),
          ],
          m = (0, i.useRef)(null),
          g = (0, i.useRef)(null),
          x = (0, i.useRef)(null),
          y = (0, i.useRef)(null),
          w = (0, i.useRef)(null),
          M = (0, i.useRef)(null),
          A = (0, i.useRef)([]),
          C = (0, i.useRef)([]),
          k = (0, i.useRef)([]),
          [E, N] = (0, i.useState)({ target: !1, facts: 0, struck: !1 }),
          j = b.join("\n");
        return (
          (0, i.useEffect)(() => {
            let e = m.current,
              t = g.current,
              a = x.current,
              i = y.current,
              r = w.current,
              n = M.current,
              l = a?.getContext("2d");
            if (!e || !t || !a || !i || !r || !n || !l) return;
            let o = A.current
                .slice(0, j.split("\n").length)
                .filter((e) => null !== e),
              s = e.closest("[data-d1-theme]") ?? e,
              c = window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              d = null,
              u = [],
              f = "",
              b = !0,
              p = { target: !1, facts: 0, struck: !1 },
              v = () => {
                b = "light" !== s.getAttribute("data-d1-theme");
                let t = tR(e, "--d1-fg-dim", [0.66, 0.66, 0.66]),
                  a = tR(e, "--d1-fg", [1, 1, 1]),
                  i = b ? [1, 1, 1] : a;
                ((f = tP(a, 0.18)),
                  (u = o.map((e, a) => {
                    let r = (a + 0.5) / o.length,
                      n = (0, ek.u)(b ? ek.g : ek.x, r);
                    return Array.from({ length: 17 }, (e, a) =>
                      tP(a <= 8 ? tS(t, n, a / 8) : tS(n, i, (a - 8) / 8)),
                    );
                  })));
              },
              E = () => {
                let t = e.getBoundingClientRect(),
                  a = t.height - window.innerHeight;
                return a > 0 ? (0, h.O)(-t.top / a) : 0;
              },
              F = (e) => {
                o.forEach((t, a) => {
                  t.style.opacity = c
                    ? ""
                    : String(1 - (0, h.O)((e - (0.1 + 0.04 * a)) / 0.04));
                });
                let t = c && e > 0.4,
                  i = 0,
                  s = Math.min(window.devicePixelRatio || 1, 2),
                  m = d;
                if (m) {
                  let e = Math.round(m.width * s),
                    t = Math.round(m.height * s);
                  (a.width !== e || a.height !== t) &&
                    ((a.width = e), (a.height = t));
                }
                (l.clearRect(0, 0, a.width, a.height),
                  m &&
                    !c &&
                    e > 0.1 &&
                    (i = (function (e, t, a, i, r, n) {
                      let l = 0,
                        o = 1 / 0;
                      for (let e = 0; e < t.count; e += 1) {
                        let i = t.line[e] ?? 0,
                          r = tE(
                            (0, h.O)(
                              (a - 0.1 - 0.04 * i - (t.delay[e] ?? 0)) / 0.26,
                            ),
                          ),
                          n = Math.abs(t.dx[e] ?? 0);
                        r > 0 &&
                          r < 1 &&
                          r * (t.len[e] ?? 0) >= n &&
                          (o = Math.min(
                            o,
                            (t.hy[e] ?? 0) + r * (t.len[e] ?? 0) - n,
                          ));
                      }
                      o < t.y &&
                        ((e.fillStyle = n),
                        e.fillRect(
                          Math.round(t.x * i),
                          Math.round(o * i),
                          1,
                          Math.round((t.y - o) * i),
                        ));
                      let s = "";
                      for (let o = 0; o < t.count; o += 1) {
                        let c,
                          d = t.line[o] ?? 0,
                          u = 0.1 + 0.04 * d;
                        if (a < u) continue;
                        let f = tE(
                          (0, h.O)((a - u - (t.delay[o] ?? 0)) / 0.26),
                        );
                        if (f >= 1) {
                          l += 1;
                          continue;
                        }
                        let b = t.dx[o] ?? 0,
                          m = t.dy[o] ?? 0,
                          p = Math.abs(b),
                          g = f * (t.len[o] ?? 0),
                          v = t.hx[o] ?? 0,
                          x = t.hy[o] ?? 0;
                        g < p
                          ? ((v += Math.sign(b) * g),
                            (c = Math.round((g / p) * 8)))
                          : ((v = t.x),
                            (x += Math.sign(m) * (g - p)),
                            (c =
                              8 +
                              Math.round(
                                ((g - p) / Math.max(1, Math.abs(m))) * 8,
                              )));
                        let y = Math.max(
                            1,
                            Math.round(
                              (f > 0.85
                                ? t.size * (1 - (0.5 * (f - 0.85)) / 0.15)
                                : t.size) * i,
                            ),
                          ),
                          w = r[d]?.[c] ?? n;
                        (w !== s && ((e.fillStyle = w), (s = w)),
                          e.fillRect(
                            Math.round(v * i - y / 2),
                            Math.round(x * i - y / 2),
                            y,
                            y,
                          ));
                      }
                      return l;
                    })(l, m, e, s, u, f)));
                let g = c ? +!!t : m?.count ? i / m.count : 0,
                  v = (0, h.O)((e - 0.7) / 0.06);
                ((r.style.opacity = String(g)),
                  (r.style.transform = `scale(${1 + 0.12 * Math.sin(Math.PI * v)})`),
                  (r.style.boxShadow =
                    b && g > 0
                      ? `0 0 ${0.5 * (m?.chip ?? 16) * g}px ${0.125 * (m?.chip ?? 16) * g}px rgb(255 255 255 / ${0.55 * g})`
                      : ""));
                let x = c ? +!!t : (0, h.O)((e - 0.72) / 0.1);
                n.style.clipPath = `inset(0 ${(1 - x) * 100}% 0 0)`;
                let y = 0;
                tF.forEach((a) => {
                  let i = 0.82 + 0.04 * a,
                    r = c ? t : e >= i;
                  r && (y += 1);
                  let n = C.current[a],
                    l = k.current[a];
                  (n && (n.style.opacity = r ? "1" : "0"),
                    l &&
                      (l.style.opacity = String(
                        c ? +!!r : (0, h.O)((e - i) / 0.06),
                      )));
                });
                let w = { target: c ? t : e >= 0.72, facts: y, struck: t };
                (w.target !== p.target ||
                  w.facts !== p.facts ||
                  w.struck !== p.struck) &&
                  ((p = w), N(w));
              },
              R = E(),
              S = 0,
              P = -1,
              L = !0,
              _ = !1,
              T = 0,
              D = 0,
              O = (e) => {
                if (((T = 0), !_)) return;
                let t = Math.min(0.064, (e - D) / 1e3);
                D = e;
                let a = E(),
                  i = R - a,
                  r = Math.exp(-14 * t),
                  n = S + 14 * i;
                ((R = a + (i + n * t) * r),
                  (S = (S - 14 * n * t) * r),
                  1e-5 > Math.abs(R - a) &&
                    1e-4 > Math.abs(S) &&
                    ((R = a), (S = 0)),
                  (L || R !== P) && (F(R), (P = R), (L = !1)),
                  (T = requestAnimationFrame(O)));
              },
              H = () => {
                !T &&
                  _ &&
                  ((D = performance.now()), (T = requestAnimationFrame(O)));
              },
              $ = 0,
              I = async () => {
                let e = ($ += 1),
                  a = o[0];
                if (a) {
                  let e = getComputedStyle(a);
                  await document.fonts
                    .load(`${e.fontSize} ${e.fontFamily}`)
                    .catch(() => void 0);
                }
                e === $ &&
                  ((d = (function (e, t, a, i, r) {
                    let n = t[0],
                      l = document
                        .createElement("canvas")
                        .getContext("2d", { willReadFrequently: !0 });
                    if (!n || !l) return null;
                    let o = getComputedStyle(n),
                      s = `${o.fontWeight} ${o.fontSize} ${o.fontFamily}`,
                      c =
                        "normal" === o.letterSpacing ? "0px" : o.letterSpacing,
                      d = e.getBoundingClientRect(),
                      u = () => {
                        ((l.font = s),
                          (l.letterSpacing = c),
                          (l.textBaseline = "alphabetic"));
                      };
                    u();
                    let h = (Number.parseFloat(o.fontSize) || 15) / 5,
                      f = l.measureText("0".repeat(10)).width / 10,
                      b = n.getBoundingClientRect().left - d.left,
                      m = (n.textContent ?? "").indexOf("="),
                      p = a.getBoundingClientRect(),
                      g = p.width || 16,
                      v = getComputedStyle(i);
                    l.font = `${v.fontWeight} ${v.fontSize} ${v.fontFamily}`;
                    let x = l.measureText(tk).width,
                      y = i.offsetLeft - a.offsetLeft - g;
                    u();
                    let w = b + f * (m + 0.5),
                      M =
                        m > 0 && w + g / 2 + y + x <= d.width
                          ? w
                          : Math.max(g / 2, b + 0.5 * f);
                    r(M - g / 2);
                    let A = p.top - d.top + p.height / 2,
                      C = [];
                    t.forEach((e, t) => {
                      let a = e.textContent ?? "",
                        i = e.getBoundingClientRect(),
                        r = l.measureText(a),
                        n = Math.ceil(r.width) + 2,
                        o = Math.ceil(i.height);
                      ((l.canvas.width = 2 * n),
                        (l.canvas.height = 2 * o),
                        u(),
                        l.setTransform(2, 0, 0, 2, 0, 0));
                      let s = r.fontBoundingBoxAscent,
                        c = r.fontBoundingBoxDescent;
                      l.fillText(a, 0, (o - (s + c)) / 2 + s);
                      let { data: f } = l.getImageData(0, 0, 2 * n, 2 * o);
                      for (let e = 0; e < Math.floor(o / h); e += 1)
                        for (let a = 0; a < Math.floor(n / h); a += 1) {
                          let r = (a + 0.5) * h,
                            l = (e + 0.5) * h;
                          (f[
                            (Math.floor(2 * l) * n * 2 + Math.floor(2 * r)) *
                              4 +
                              3
                          ] ?? 0) > 89.25 &&
                            C.push([i.left - d.left + r, i.top - d.top + l, t]);
                        }
                    });
                    let k = C.length,
                      E = {
                        hx: new Float32Array(k),
                        hy: new Float32Array(k),
                        dx: new Float32Array(k),
                        dy: new Float32Array(k),
                        len: new Float32Array(k),
                        delay: new Float32Array(k),
                        line: new Uint8Array(k),
                        count: k,
                        x: M,
                        y: A,
                        width: d.width,
                        height: d.height,
                        size: 0.66 * h,
                        chip: g,
                      },
                      N = new Float32Array(t.length);
                    for (let [e, , t] of C)
                      N[t] = Math.max(N[t] ?? 0, Math.abs(M - e));
                    return (
                      C.forEach(([e, t, a], i) => {
                        ((E.hx[i] = e),
                          (E.hy[i] = t),
                          (E.dx[i] = M - e),
                          (E.dy[i] = A - t),
                          (E.len[i] = Math.abs(M - e) + Math.abs(A - t)),
                          (E.delay[i] =
                            0.06 * (Math.abs(M - e) / Math.max(1, N[a] ?? 1))),
                          (E.line[i] = a));
                      }),
                      E
                    );
                  })(t, o, i, n, (e) =>
                    t.style.setProperty("--chip-x", `${e}px`),
                  )),
                  (L = !0),
                  F(R),
                  H());
              };
            (v(), I());
            let B = new IntersectionObserver(([e]) => {
              (_ = e?.isIntersecting ?? !1) && H();
            });
            B.observe(e);
            let z = new ResizeObserver(() => void I());
            z.observe(t);
            let G = new MutationObserver(() => {
              (v(), (L = !0), H());
            });
            return (
              G.observe(s, { attributeFilter: ["data-d1-theme"] }),
              () => {
                (($ += 1),
                  (_ = !1),
                  cancelAnimationFrame(T),
                  B.disconnect(),
                  z.disconnect(),
                  G.disconnect());
              }
            );
          }, [j]),
          (0, t.jsx)("section", {
            ref: m,
            className: (0, o.f)(
              tp.default.section,
              "page-column px-4 sm:px-10",
            ),
            "data-d1-clear": !0,
            "aria-labelledby": "keys-collapse-title",
            children: (0, t.jsxs)("div", {
              className: tp.default.frame,
              children: [
                (0, t.jsx)(tC, {}),
                (0, t.jsxs)("div", {
                  className: tp.default.text,
                  children: [
                    (0, t.jsx)(tj, { art: tg, className: tp.default.keyArt }),
                    (0, t.jsx)("h2", {
                      id: "keys-collapse-title",
                      className: tp.default.headline,
                      children: r.keysTitle.replaceAll(
                        "{count}",
                        String(e.length),
                      ),
                    }),
                    (0, t.jsx)("p", {
                      className: tp.default.body,
                      children: r.keysBody,
                    }),
                    (0, t.jsxs)(l.Link, {
                      href: "/account/keys",
                      className: (0, o.f)(
                        (0, ef.i)({ variant: "ghost" }),
                        tp.default.mono,
                        tp.default.cta,
                      ),
                      children: [
                        (0, t.jsx)(p, {
                          size: 6,
                          inset: -1,
                          className: tp.default.ctaCorners,
                        }),
                        (0, t.jsx)(tb.f, {
                          when: "signed-in",
                          children: r.keysSignedInLabel,
                        }),
                        (0, t.jsx)(tb.f, {
                          when: "signed-out",
                          children: r.keysSignedOutLabel,
                        }),
                        (0, t.jsx)(f.f, {
                          "aria-hidden": "true",
                          className: "size-[1em]",
                        }),
                      ],
                    }),
                    (0, t.jsx)("ul", {
                      className: tp.default.facts,
                      children: [
                        [r.keysFact1Title, r.keysFact1Body],
                        [r.keysFact2Title, r.keysFact2Body],
                        [r.keysFact3Title, r.keysFact3Body],
                      ].map(([e = "", a], i) =>
                        (0, t.jsxs)(
                          "li",
                          {
                            className: tp.default.fact,
                            children: [
                              (0, t.jsx)("span", {
                                ref: (e) => {
                                  C.current[i] = e;
                                },
                                className: (0, o.f)(
                                  tp.default.mono,
                                  tp.default.factLabel,
                                ),
                                children: (0, t.jsx)(v, {
                                  text: e.toUpperCase(),
                                  play: E.facts > i,
                                }),
                              }),
                              (0, t.jsx)("span", {
                                ref: (e) => {
                                  k.current[i] = e;
                                },
                                className: tp.default.factText,
                                children: a,
                              }),
                            ],
                          },
                          i,
                        ),
                      ),
                    }),
                  ],
                }),
                (0, t.jsxs)("div", {
                  ref: g,
                  className: (0, o.f)(
                    tp.default.stage,
                    E.struck && tp.default.struck,
                  ),
                  "aria-label": `${e.length} provider keys become one Orthogonal key`,
                  role: "img",
                  "data-keys-stage": !0,
                  children: [
                    b.map((e, a) =>
                      (0, t.jsx)(
                        "span",
                        {
                          ref: (e) => {
                            A.current[a] = e;
                          },
                          className: tp.default.line,
                          children: e,
                        },
                        e,
                      ),
                    ),
                    (0, t.jsx)("span", { className: tp.default.gap }),
                    (0, t.jsxs)("span", {
                      className: tp.default.targetRow,
                      children: [
                        (0, t.jsx)("span", {
                          ref: y,
                          className: tp.default.slot,
                        }),
                        (0, t.jsx)("span", {
                          ref: w,
                          className: tp.default.chip,
                        }),
                        (0, t.jsx)("span", {
                          ref: M,
                          className: tp.default.target,
                          "data-keys-target": !0,
                          children: (0, t.jsx)(v, {
                            text: tk,
                            play: E.target,
                            duration: 480,
                          }),
                        }),
                      ],
                    }),
                    (0, t.jsx)("canvas", {
                      ref: x,
                      className: tp.default.canvas,
                      "aria-hidden": !0,
                    }),
                  ],
                }),
              ],
            }),
          })
        );
      }
      var t_ = e.i(297819),
        tT = e.i(758925),
        tD = e.i(884302);
      let tO = Array.from({ length: 9 }, (e, t) =>
        Array.from({ length: 20 }, (e, a) => {
          let i = Math.hypot(a - 4, t - 4);
          return (i <= 4.4 && i >= 1.9) ||
            (a >= 8 && t >= 3 && t <= 5) ||
            (t >= 6 && t <= 7 && ((a >= 12 && a <= 13) || (a >= 16 && a <= 18)))
            ? "#"
            : ".";
        }).join(""),
      );
      function tH({ map: e, scale: a, right: i, top: r, className: n }) {
        let l = (e[0]?.length ?? 0) * a,
          o = e.length * a;
        return (0, t.jsx)("svg", {
          viewBox: `0 0 ${l} ${o}`,
          className: n,
          style: {
            position: "absolute",
            height: "auto",
            pointerEvents: "none",
            width: `calc(${l} * var(--cell))`,
            right: `calc(${i} * var(--cell))`,
            top: `calc(${r} * var(--cell))`,
          },
          "aria-hidden": !0,
          focusable: "false",
          children: (function (e) {
            let t = e.flatMap((e, t) =>
                [...e].flatMap((e, a) => ("#" === e ? [{ i: a, j: t }] : [])),
              ),
              a = e.length,
              i = t.length
                ? t.reduce((e, t) => e + t.i, 0) / t.length + 1
                : a / 2,
              r = t.length ? t.reduce((e, t) => e + t.j, 0) / t.length : a / 2,
              n = 1;
            for (let e of t) n = Math.max(n, Math.hypot(e.i - i, e.j - r));
            return t.map((e) => ({
              ...e,
              color: (0, ek.f)(
                (0, ek.u)(ek.U, Math.hypot(e.i - i, e.j - r) / n),
              ),
            }));
          })(e).flatMap(({ i: e, j: i, color: r }) =>
            Array.from({ length: a * a }, (n, l) =>
              (0, t.jsx)(
                "rect",
                {
                  x: e * a + (l % a) + 0.22,
                  y: i * a + Math.floor(l / a) + 0.22,
                  width: 0.56,
                  height: 0.56,
                  fill: r,
                },
                `${e},${i},${l}`,
              ),
            ),
          ),
        });
      }
      function t$({ apiCount: e, endpointCount: a, copy: i = eN.m.copy }) {
        let { isSignedIn: r } = (0, t_.f)();
        return (0, t.jsx)("section", {
          className: tD.default.section,
          "aria-labelledby": "landing-get-started",
          "data-d1-clear": "doc",
          children: (0, t.jsx)("div", {
            className: "page-column px-4 sm:px-10",
            children: (0, t.jsxs)("div", {
              className: tD.default.panel,
              children: [
                (0, t.jsx)(tH, {
                  map: tO,
                  scale: 2,
                  right: 4,
                  top: 5,
                  className: tD.default.art,
                }),
                (0, t.jsxs)("div", {
                  className: tD.default.copy,
                  children: [
                    (0, t.jsxs)("p", {
                      className: tD.default.eyebrow,
                      children: [
                        e,
                        " APIs · ",
                        a.toLocaleString("en-US"),
                        " ",
                        "endpoints",
                      ],
                    }),
                    (0, t.jsx)("h2", {
                      id: "landing-get-started",
                      children: i.ctaTitle,
                    }),
                    (0, t.jsx)("p", { children: i.ctaBody }),
                    (0, t.jsxs)("div", {
                      className: tD.default.actions,
                      children: [
                        (0, t.jsxs)(l.Link, {
                          href: "/account/keys",
                          className: (0, o.f)(
                            (0, ef.i)({ size: "lg" }),
                            tD.default.primary,
                          ),
                          children: [
                            (0, t.jsx)(tT.f, { "aria-hidden": "true" }),
                            r ? i.ctaSignedInLabel : i.ctaSignedOutLabel,
                          ],
                        }),
                        (0, t.jsxs)(l.Link, {
                          href: "/docs",
                          className: (0, o.f)(
                            (0, ef.i)({ variant: "ghost", size: "lg" }),
                            tD.default.secondary,
                          ),
                          children: [
                            i.ctaSecondaryLabel,
                            (0, t.jsx)(f.f, { "aria-hidden": "true" }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        });
      }
      var tI = e.i(266027),
        tB = e.i(159888),
        tz = e.i(21357),
        tG = e.i(383035),
        tq = e.i(769809),
        tV = e.i(633078),
        tW = e.i(671468),
        tY = e.i(306361);
      function tX() {
        let e = (0, i.useRef)(null),
          { theme: a } = (0, eR.useD1Theme)();
        return (
          (0, i.useEffect)(() => {
            let t = e.current,
              a = t?.parentElement,
              i = a?.parentElement,
              r = document.querySelector("[data-keys-target]"),
              n = r?.closest("section"),
              l = n?.firstElementChild;
            if (!t || !a || !i || !r || !n || !(l instanceof HTMLElement))
              return;
            let o = window.matchMedia("(prefers-reduced-motion: reduce)"),
              s = getComputedStyle(i).getPropertyValue("--d1-fg").trim(),
              c = null,
              d = 0,
              u = 0,
              f = tv(),
              b = f.q,
              m = 0,
              p = 0,
              g = { leftFoot: 1, x0: 0.45 },
              v = i.querySelector("[data-plug-stage]"),
              x = (e) => {
                let t = c;
                if (!t) return;
                let a = Math.min(window.devicePixelRatio || 1, 2);
                t.clearRect(0, 0, d, u);
                for (let i = 0; i < p; i += 1)
                  for (let r = 0; r < m; r += 1) {
                    let n = (function (e, t, a) {
                      let i = t / a.leftFoot,
                        r =
                          0.15 *
                          (0.55 + 0.45 * Math.sin(Math.PI * (0, h.O)(i))),
                        n = i <= 1 ? (0, h.O)(1.25 - e / r) : 0,
                        l = (1.06 - a.x0) / 2,
                        o = (e - a.x0 - l) / l;
                      return (
                        Math.max(n, (0, h.O)((1.35 - Math.abs(o)) / 0.55)) *
                        ((0, h.O)(t / 0.1) * (0, h.O)((1 - t) / 0.22))
                      );
                    })((r + 0.5) / m, (i + 0.5) / p, g);
                    if (
                      n <= 0 ||
                      ((n *=
                        0.35 +
                        0.9 *
                          (function (e, t) {
                            let a = Math.floor(e),
                              i = Math.floor(t),
                              r = e - a,
                              n = t - i,
                              l = r * r * (3 - 2 * r),
                              o = n * n * (3 - 2 * n),
                              s = tx(a, i, 31),
                              c = tx(a + 1, i, 31),
                              d = tx(a, i + 1, 31);
                            return (
                              s +
                              (c - s) * l +
                              (d - s) * o +
                              (s - c - d + tx(a + 1, i + 1, 31)) * l * o
                            );
                          })(r / 18 + 0.03 * e, i / 14 - 0.015 * e)),
                      tx(r, i, 32) > n * n)
                    )
                      continue;
                    let l =
                      (0.05 + 0.17 * tx(r, i, 33)) * Math.sqrt((0, h.O)(n));
                    l *=
                      0.55 +
                      0.45 *
                        (0.5 +
                          0.5 *
                            Math.sin(
                              e * (0.4 + 0.7 * tx(r, i, 6)) +
                                tx(r, i, 3) * Math.PI * 2,
                            ));
                    let o = 0.004 > tx(r, i, 35);
                    ((t.globalAlpha = o ? Math.min(0.6, 3 * l) : l),
                      (t.fillStyle = o
                        ? (0, ek.f)((0, ek.u)(ek.U, tx(r, i, 36)))
                        : s),
                      ty(
                        t,
                        (r + 0.5) * b,
                        (i + 0.5) * b,
                        f.base,
                        a,
                        f.baseStroke,
                      ));
                  }
                t.globalAlpha = 1;
              },
              y = 0,
              w = !1,
              M = 0,
              A = 0,
              C = 0,
              k = () => w && !document.hidden && d > 0 && u > 0,
              E = (e) => {
                ((y = 0),
                  k() &&
                    !o.matches &&
                    (A && (M += Math.min((e - A) / 1e3, 0.1)),
                    (A = e),
                    e - C > 32 && (x(M), (C = e)),
                    (y = requestAnimationFrame(E))));
              },
              N = () => {
                (cancelAnimationFrame(y),
                  (y = 0),
                  (A = 0),
                  k() &&
                    (x(o.matches ? 0 : M),
                    o.matches || (y = requestAnimationFrame(E))));
              },
              j = () => {
                ((() => {
                  let e =
                      r.getBoundingClientRect().bottom -
                      l.getBoundingClientRect().top,
                    o =
                      n.getBoundingClientRect().bottom +
                      scrollY -
                      l.offsetHeight +
                      e +
                      72 -
                      (i.getBoundingClientRect().top + scrollY),
                    s = v?.getBoundingClientRect(),
                    x = i.getBoundingClientRect().top,
                    y = s ? s.bottom - x : 0;
                  if (
                    ((a.style.top = `${Math.round(o)}px`),
                    (a.style.height = `${Math.max(0, Math.round(y + 240 - o))}px`),
                    (d = a.clientWidth),
                    (u = a.clientHeight),
                    (c = tw(t, d, u)),
                    (b = (f = tv()).q),
                    (m = Math.ceil(d / b)),
                    (p = Math.ceil(u / b)),
                    u > 0 && d > 0)
                  ) {
                    let e = a.getBoundingClientRect();
                    g = {
                      leftFoot: (0, h.O)((x - 16 - e.top) / u) || 1,
                      x0: s ? (0, h.O)((s.left - 48 - e.left) / d) : 0.45,
                    };
                  }
                })(),
                  N());
              },
              F = new ResizeObserver(j);
            (F.observe(i), F.observe(l));
            let R = new IntersectionObserver(([e]) => {
              ((w = e?.isIntersecting ?? !1), N());
            });
            return (
              R.observe(a),
              document.addEventListener("visibilitychange", N),
              o.addEventListener("change", N),
              window.addEventListener("resize", j),
              j(),
              () => {
                (cancelAnimationFrame(y),
                  R.disconnect(),
                  F.disconnect(),
                  document.removeEventListener("visibilitychange", N),
                  o.removeEventListener("change", N),
                  window.removeEventListener("resize", j));
              }
            );
          }, [a]),
          (0, t.jsx)("div", {
            className: tY.default.gapArt,
            "aria-hidden": !0,
            children: (0, t.jsx)("canvas", { ref: e }),
          })
        );
      }
      let tU = {
          viewBox: "149 210 504 345",
          focus: { x: 176.99, y: 315.99, size: 23.97 },
          marks: [
            [256.5, 218.4, 4.05, "#a75c55", -161, -160, 0.418],
            [266.4, 218.4, 4.05, "#ac5850", -182, -111, 0.423],
            [286.4, 218.4, 4.05, "#b2594b", -39, -223, 0.024],
            [296.3, 218.4, 4.05, "#b35d4a", -275, -119, 0.411],
            [306.3, 218.4, 4.05, "#b4634a", -87, -176, 0.358],
            [326.2, 218.4, 4.05, "#b5714c", 18, -129, 0.099],
            [336.2, 218.4, 4.05, "#b5784d", 8, -96, 0.398],
            [346.2, 218.4, 4.05, "#b57e4e", -104, -144, 0.275],
            [376.1, 218.4, 4.05, "#b68d57", -51, -120, 0.369],
            [386, 218.4, 4.05, "#b6905e", 48, -257, 0.289],
            [396, 218.4, 4.05, "#b69165", -7, -130, 0.164],
            [406, 218.4, 4.05, "#b6916d", 37, -200, 0.021],
            [416, 218.4, 4.05, "#b69176", 12, -118, 0.355],
            [425.9, 218.4, 4.05, "#b6917e", 40, -104, 0.165],
            [445.9, 218.4, 4.05, "#b4908d", 136, -227, 0.042],
            [455.8, 218.4, 4.05, "#b29093", 21, -127, 0.223],
            [465.8, 218.4, 4.05, "#ac8d97", 143, -241, 0.302],
            [475.8, 218.4, 4.05, "#a48a9a", 32, -218, 0.312],
            [505.7, 218.4, 4.05, "#827d96", 126, -93, 0.39],
            [525.6, 218.4, 4.05, "#707793", 41, -199, 0.342],
            [535.6, 218.4, 4.05, "#6b7592", 270, -111, 0.208],
            [545.5, 218.4, 4.05, "#6b7592", 128, -86, 0.402],
            [555.5, 218.4, 4.05, "#717793", 284, -83, 0.098],
            [565.5, 218.4, 4.05, "#797a95", 181, -215, 0.36],
            [575.5, 218.4, 4.05, "#857e97", 81, -90, 0.358],
            [585.4, 218.4, 4.05, "#908298", 274, -57, 0.27],
            [595.4, 218.4, 4.05, "#9b879a", 67, -160, 0.38],
            [605.4, 218.4, 4.05, "#a58b99", 250, -42, 0.171],
            [625.3, 218.4, 4.05, "#b29093", 207, -22, 0.043],
            [236.5, 228.4, 4.05, "#9e6560", -216, -74, 0.221],
            [246.5, 228.4, 6.18, "#e3615a", -113, -27, 0.148],
            [256.5, 228.4, 6.18, "#e24d45", -108, -37, 0.269],
            [266.4, 228.4, 6.18, "#e23e32", -147, -206, 0.156],
            [276.4, 228.4, 6.18, "#e23324", -49, -162, 0.109],
            [286.4, 228.4, 6.18, "#e2321a", -185, -185, 0.375],
            [306.3, 228.4, 6.18, "#d85e3d", 7, -224, 0.176],
            [316.3, 228.4, 6.18, "#d8683e", -224, -117, 0.34],
            [326.2, 228.4, 6.18, "#d97240", -5, -116, 0.003],
            [336.2, 228.4, 6.18, "#d87d41", 23, -125, 0.304],
            [346.2, 228.4, 6.18, "#e5781f", -134, -126, 0.186],
            [356.1, 228.4, 6.18, "#e48422", -43, -188, 0.383],
            [366.1, 228.4, 6.18, "#e58e27", 63, -188, 0.399],
            [376.1, 228.4, 6.18, "#e5962f", 22, -260, 0.441],
            [386, 228.4, 6.18, "#e59b3c", -2, -283, 0.383],
            [396, 228.4, 6.18, "#e59e49", -52, -150, 0.386],
            [406, 228.4, 6.18, "#e6a058", 134, -267, 0.057],
            [416, 228.4, 6.18, "#e6a069", -97, -275, 0.366],
            [425.9, 228.4, 6.18, "#e6a07b", -23, -95, 0.026],
            [435.9, 228.4, 6.18, "#e6a089", -53, -262, 0.14],
            [455.8, 228.4, 6.18, "#df9da7", 60, -113, 0.018],
            [465.8, 228.4, 6.18, "#d59ab0", 19, -272, 0.211],
            [475.8, 228.4, 6.18, "#c893b3", 219, -197, 0.057],
            [485.7, 228.4, 6.18, "#b68db6", -24, -276, 0.138],
            [495.7, 228.4, 6.18, "#a185b3", 30, -226, 0.393],
            [505.7, 228.4, 6.18, "#8e7eb1", 127, -116, 0.376],
            [525.6, 228.4, 6.18, "#6d72ac", 93, -69, 0.337],
            [535.6, 228.4, 6.18, "#656faa", 86, -151, 0.386],
            [545.5, 228.4, 6.18, "#6770ab", 236, -60, 0.046],
            [555.5, 228.4, 6.18, "#7174ad", 100, -72, 0.007],
            [565.5, 228.4, 6.18, "#7f79af", 72, -220, 0.424],
            [575.5, 228.4, 6.18, "#9380b1", 118, -114, 0.084],
            [585.4, 228.4, 6.18, "#a788b4", 99, -69, 0.411],
            [595.4, 228.4, 6.18, "#ba90b6", 126, -47, 0.281],
            [605.4, 228.4, 6.18, "#cd96b3", 171, -185, 0.26],
            [615.3, 228.4, 4.05, "#af8f96", 53, -121, 0.447],
            [645.2, 228.4, 4.05, "#b69184", 246, -10, 0.371],
            [216.6, 238.4, 4.05, "#95716c", -208, -75, 0.189],
            [226.5, 238.4, 5.12, "#c4837c", -252, -66, 0.328],
            [236.5, 238.4, 6.18, "#e47970", -199, -84, 0.004],
            [246.5, 238.4, 6.18, "#e3655d", -123, -52, 0.312],
            [256.5, 238.4, 6.18, "#e35047", -58, -199, 0.092],
            [266.4, 238.4, 6.18, "#e24034", -124, -80, 0.121],
            [276.4, 238.4, 6.18, "#e23525", -209, -112, 0.161],
            [286.4, 238.4, 6.18, "#e2301b", -93, -103, 0.272],
            [296.3, 238.4, 6.18, "#d7553c", -141, -241, 0.079],
            [316.3, 238.4, 6.18, "#d8673e", -242, -179, 0.133],
            [326.2, 238.4, 6.18, "#d87140", -141, -102, 0.244],
            [336.2, 238.4, 6.18, "#e4691d", -177, -111, 0.161],
            [356.1, 238.4, 6.18, "#e58222", -41, -91, 0.054],
            [366.1, 238.4, 6.18, "#e58c26", -50, -166, 0.112],
            [376.1, 238.4, 6.18, "#e5952d", -22, -211, 0.043],
            [386, 238.4, 6.18, "#e59a38", 115, -216, 0.251],
            [396, 238.4, 6.18, "#e59e46", 16, -90, 0.07],
            [406, 238.4, 6.18, "#e6a053", 20, -140, 0.37],
            [416, 238.4, 6.18, "#e6a066", 110, -201, 0.085],
            [425.9, 238.4, 6.18, "#e6a076", 72, -139, 0.229],
            [435.9, 238.4, 6.18, "#e59f85", 103, -147, 0.41],
            [455.8, 238.4, 6.18, "#e09da2", 65, -225, 0.021],
            [465.8, 238.4, 6.18, "#db9bab", 175, -134, 0.34],
            [475.8, 238.4, 6.18, "#d097b2", 61, -122, 0.198],
            [485.7, 238.4, 6.18, "#c291b5", 107, -105, 0.156],
            [495.7, 238.4, 6.18, "#b28bb5", 86, -86, 0.062],
            [505.7, 238.4, 6.18, "#a085b4", 97, -49, 0.414],
            [515.6, 238.4, 6.18, "#907fb1", 81, -168, 0.343],
            [525.6, 238.4, 6.18, "#847baf", 53, -73, 0.278],
            [535.6, 238.4, 6.18, "#7f78ae", 116, -209, 0.442],
            [555.5, 238.4, 6.18, "#897cb0", 35, -86, 0.347],
            [575.5, 238.4, 6.18, "#a587b5", 162, -159, 0.161],
            [585.4, 238.4, 6.18, "#b58db5", 103, -94, 0.294],
            [625.3, 238.4, 4.05, "#b4918f", 177, -2, 0.156],
            [635.3, 238.4, 4.05, "#b59188", 86, -55, 0.358],
            [645.2, 238.4, 4.05, "#b5917f", 87, -106, 0.057],
            [216.6, 248.3, 6.18, "#e4a8a1", -303, -28, 0.172],
            [246.5, 248.3, 6.18, "#e36860", -240, -82, 0.088],
            [256.5, 248.3, 6.18, "#e3534a", -234, -150, 0.225],
            [266.4, 248.3, 6.18, "#e34136", -231, -167, 0.132],
            [276.4, 248.3, 6.18, "#e23528", -30, -131, 0.345],
            [286.4, 248.3, 6.18, "#e1311e", -66, -88, 0.328],
            [296.3, 248.3, 6.18, "#d6543d", -197, -199, 0.012],
            [306.3, 248.3, 6.18, "#d75b3c", -146, -211, 0.08],
            [326.2, 248.3, 6.18, "#d96f40", -132, -173, 0.037],
            [336.2, 248.3, 6.18, "#e4641c", -31, -111, 0.431],
            [346.2, 248.3, 6.18, "#e4721d", -73, -78, 0.368],
            [356.1, 248.3, 6.18, "#e57f21", -10, -173, 0.202],
            [376.1, 248.3, 6.18, "#e6932c", -59, -91, 0.04],
            [386, 248.3, 6.18, "#e69a34", -113, -168, 0.445],
            [396, 248.3, 6.18, "#e69d41", -59, -102, 0.271],
            [406, 248.3, 6.18, "#e59e50", -119, -207, 0.029],
            [425.9, 248.3, 6.18, "#e59f6f", -105, -261, 0.021],
            [435.9, 248.3, 6.18, "#e59f7f", 202, -183, 0.143],
            [445.9, 248.3, 6.18, "#e5a08d", -27, -200, 0.126],
            [455.8, 248.3, 6.18, "#e29e9b", 110, -99, 0.183],
            [475.8, 248.3, 6.18, "#d79aad", 147, -84, 0.324],
            [495.7, 248.3, 6.18, "#c091b5", 153, -116, 0.356],
            [505.7, 248.3, 6.18, "#b38db5", 228, -160, 0.218],
            [515.6, 248.3, 6.18, "#a889b5", 231, -101, 0.145],
            [525.6, 248.3, 6.18, "#9f85b4", 47, -228, 0.369],
            [535.6, 248.3, 6.18, "#9a83b3", 40, -104, 0.023],
            [545.5, 248.3, 6.18, "#9b84b3", 196, -98, 0.386],
            [555.5, 248.3, 6.18, "#a186b4", 258, -168, 0.039],
            [565.5, 248.3, 6.18, "#ab89b4", 161, -128, 0.233],
            [585.4, 248.3, 4.05, "#a58b99", 128, -33, 0.278],
            [605.4, 248.3, 4.05, "#b08f95", 129, -100, 0.167],
            [615.3, 248.3, 4.05, "#b39091", 138, -174, 0.219],
            [625.3, 248.3, 4.05, "#b5918a", 116, -241, 0.002],
            [635.3, 248.3, 4.05, "#b69183", 135, -44, 0.417],
            [645.2, 248.3, 4.05, "#b6917c", 209, -204, 0.093],
            [186.7, 258.3, 5.12, "#b8aea9", -159, -212, 0.24],
            [196.6, 258.3, 6.18, "#e6cfc9", -205, -162, 0.095],
            [206.6, 258.3, 6.18, "#e5bfb8", -274, -64, 0.427],
            [246.5, 258.3, 6.18, "#e36b64", -251, -123, 0.002],
            [256.5, 258.3, 6.18, "#e3574e", -181, -140, 0.241],
            [266.4, 258.3, 6.18, "#e3453a", -150, -242, 0.07],
            [276.4, 258.3, 6.18, "#e3372a", -111, -61, 0.124],
            [286.4, 258.3, 6.18, "#e2311f", -225, -66, 0.239],
            [306.3, 258.3, 6.18, "#d8593d", -80, -133, 0.226],
            [316.3, 258.3, 6.18, "#d6623d", -76, -59, 0.257],
            [326.2, 258.3, 6.18, "#d86c3f", -24, -222, 0.328],
            [336.2, 258.3, 6.18, "#e3621b", 0, -151, 0.026],
            [356.1, 258.3, 6.18, "#e37b1f", -30, -254, 0.061],
            [366.1, 258.3, 6.18, "#e48723", -41, -90, 0.33],
            [386, 258.3, 6.18, "#e69731", -64, -192, 0.402],
            [396, 258.3, 6.18, "#e59c3c", -139, -196, 0.448],
            [406, 258.3, 6.18, "#e59e4b", 1, -114, 0.39],
            [416, 258.3, 6.18, "#e59f58", 85, -116, 0.298],
            [425.9, 258.3, 6.18, "#e59f68", 49, -94, 0.078],
            [435.9, 258.3, 6.18, "#e6a077", 24, -151, 0.262],
            [445.9, 258.3, 6.18, "#e59f86", 49, -168, 0.317],
            [455.8, 258.3, 6.18, "#e49f93", 37, -134, 0.06],
            [465.8, 258.3, 6.18, "#e29f9f", 16, -129, 0.1],
            [475.8, 258.3, 6.18, "#dd9ca7", 92, -204, 0.309],
            [485.7, 258.3, 6.18, "#d69ab0", 69, -213, 0.377],
            [495.7, 258.3, 6.18, "#cf97b2", 62, -83, 0.062],
            [505.7, 258.3, 6.18, "#c593b4", 209, -102, 0.392],
            [515.6, 258.3, 6.18, "#bc90b5", 68, -219, 0.45],
            [525.6, 258.3, 6.18, "#b68db5", 167, -80, 0.125],
            [545.5, 258.3, 6.18, "#b48db6", 235, -115, 0.342],
            [555.5, 258.3, 5.12, "#b897b4", 132, -181, 0.398],
            [595.4, 258.3, 4.05, "#af8f96", 162, -146, 0.075],
            [605.4, 258.3, 4.05, "#b29092", 233, -12, 0.442],
            [615.3, 258.3, 4.05, "#b5918c", 212, -144, 0.271],
            [625.3, 258.3, 4.05, "#b59187", 123, 7, 0.093],
            [635.3, 258.3, 4.05, "#b69180", 104, 4, 0.308],
            [176.7, 268.3, 4.05, "#86817e", -129, -99, 0.093],
            [186.7, 268.3, 5.12, "#b7afa9", -94, -116, 0.085],
            [196.6, 268.3, 5.12, "#b9a9a3", -110, -162, 0.222],
            [206.6, 268.3, 5.12, "#bc9f9b", -199, -211, 0.252],
            [216.6, 268.3, 5.12, "#be9590", -104, -154, 0.037],
            [226.5, 268.3, 5.12, "#c28982", -91, -179, 0.022],
            [236.5, 268.3, 5.12, "#c57d77", -116, -29, 0.042],
            [246.5, 268.3, 5.12, "#c8726a", -65, -88, 0.039],
            [256.5, 268.3, 5.12, "#cb665e", -86, -94, 0.288],
            [266.4, 268.3, 5.12, "#cf5b52", -226, -59, 0.161],
            [276.4, 268.3, 5.12, "#d3544a", -106, -17, 0.36],
            [296.3, 268.3, 5.12, "#d6513e", -67, -189, 0.101],
            [306.3, 268.3, 5.12, "#d6573c", -100, -146, 0.347],
            [316.3, 268.3, 5.12, "#b4634a", -239, -180, 0.154],
            [326.2, 268.3, 5.12, "#d7693d", -173, -177, 0.006],
            [346.2, 268.3, 5.12, "#d97c42", -171, -143, 0.194],
            [356.1, 268.3, 5.12, "#d98643", 38, -279, 0.382],
            [366.1, 268.3, 5.12, "#d98e46", 67, -249, 0.383],
            [376.1, 268.3, 5.12, "#d99649", 23, -115, 0.064],
            [386, 268.3, 5.12, "#da9d4f", -38, -108, 0.435],
            [396, 268.3, 5.12, "#d9a055", 8, -123, 0.006],
            [406, 268.3, 5.12, "#daa35f", 60, -94, 0.348],
            [416, 268.3, 5.12, "#daa468", -35, -84, 0.172],
            [425.9, 268.3, 5.12, "#daa474", -54, -138, 0.435],
            [435.9, 268.3, 5.12, "#d9a47f", 86, -160, 0.153],
            [455.8, 268.3, 5.12, "#daa592", 25, -112, 0.102],
            [465.8, 268.3, 5.12, "#d9a49a", 4, -145, 0.093],
            [475.8, 268.3, 5.12, "#d7a4a3", 28, -174, 0.379],
            [485.7, 268.3, 5.12, "#d4a2a9", 148, -147, 0.17],
            [505.7, 268.3, 5.12, "#cca0b0", 103, -178, 0.304],
            [515.6, 268.3, 5.12, "#ca9eb2", 102, -25, 0.094],
            [525.6, 268.3, 5.12, "#c59db3", 124, -218, 0.356],
            [535.6, 268.3, 5.12, "#c49cb3", 105, -71, 0.359],
            [545.5, 268.3, 4.05, "#a78b98", 302, -67, 0.189],
            [575.5, 268.3, 4.05, "#ad8e97", 53, -77, 0.049],
            [585.4, 268.3, 4.05, "#b08f95", 224, -136, 0.221],
            [595.4, 268.3, 4.05, "#b39091", 149, -188, 0.058],
            [605.4, 268.3, 4.05, "#b4918c", 280, -41, 0.046],
            [615.3, 268.3, 4.05, "#b59188", 142, -135, 0.04],
            [625.3, 268.3, 4.05, "#b69180", 214, -102, 0.102],
            [635.3, 268.3, 4.05, "#b6917b", 137, 17, 0.373],
            [645.2, 268.3, 4.05, "#b59174", 288, -12, 0.086],
            [156.8, 278.3, 4.05, "#85827e", -185, 2, 0.35],
            [166.7, 278.3, 4.05, "#85827e", -78, -104, 0.026],
            [186.7, 278.3, 4.05, "#87807c", -117, -45, 0.063],
            [196.6, 278.3, 4.05, "#897d7a", -208, -130, 0.254],
            [206.6, 278.3, 4.05, "#8c7a76", -146, -105, 0.223],
            [216.6, 278.3, 4.05, "#907670", -224, -19, 0.344],
            [226.5, 278.3, 4.05, "#95706c", -140, -233, 0.236],
            [246.5, 278.3, 4.05, "#9f655f", -146, -18, 0.296],
            [256.5, 278.3, 4.05, "#a4605a", -97, -72, 0.296],
            [276.4, 278.3, 4.05, "#ac5850", -166, -91, 0.3],
            [286.4, 278.3, 4.05, "#af564d", -119, -60, 0.267],
            [296.3, 278.3, 4.05, "#b2584b", -63, -214, 0.375],
            [306.3, 278.3, 4.05, "#b35b4a", -127, -82, 0.173],
            [316.3, 278.3, 4.05, "#b3604a", -43, -221, 0.259],
            [336.2, 278.3, 4.05, "#b46d4b", -45, -287, 0.374],
            [346.2, 278.3, 4.05, "#b5744d", -138, -136, 0.393],
            [356.1, 278.3, 4.05, "#b57a4e", -9, -106, 0.327],
            [366.1, 278.3, 4.05, "#b5814f", -129, -215, 0.205],
            [376.1, 278.3, 4.05, "#b58651", 89, -283, 0.238],
            [386, 278.3, 4.05, "#b68953", -130, -196, 0.366],
            [406, 278.3, 4.05, "#b68f5c", 20, -90, 0.05],
            [416, 278.3, 4.05, "#b69162", -80, -231, 0.257],
            [425.9, 278.3, 4.05, "#b6916a", 46, -216, 0.332],
            [445.9, 278.3, 4.05, "#b59076", 104, -111, 0.215],
            [455.8, 278.3, 4.05, "#b6917c", 203, -147, 0.368],
            [465.8, 278.3, 4.05, "#b59182", 59, -202, 0.079],
            [475.8, 278.3, 4.05, "#b59188", 215, -155, 0.075],
            [485.7, 278.3, 4.05, "#b4908c", 129, -49, 0.207],
            [495.7, 278.3, 4.05, "#b29090", 60, -256, 0.304],
            [505.7, 278.3, 4.05, "#b29093", 92, -91, 0.017],
            [515.6, 278.3, 4.05, "#b08f94", 75, -259, 0.124],
            [525.6, 278.3, 4.05, "#ae8e95", 110, -148, 0.179],
            [535.6, 278.3, 4.05, "#ae8e97", 231, -202, 0.116],
            [545.5, 278.3, 4.05, "#ae8e96", 247, -75, 0.16],
            [565.5, 278.3, 4.05, "#b19094", 171, -211, 0.035],
            [575.5, 278.3, 4.05, "#b29093", 257, -151, 0.349],
            [585.4, 278.3, 4.05, "#b39090", 182, 1, 0.114],
            [595.4, 278.3, 4.05, "#b5918b", 206, -124, 0.376],
            [605.4, 278.3, 4.05, "#b59188", 93, -21, 0.147],
            [615.3, 278.3, 4.05, "#b69182", 234, -2, 0.283],
            [625.3, 278.3, 4.05, "#b6917b", 190, -28, 0.369],
            [635.3, 278.3, 4.05, "#b59075", 160, 10, 0.01],
            [645.2, 278.3, 4.05, "#b69170", 118, -63, 0.063],
            [156.8, 288.2, 5.12, "#b6b4af", -142, 31, 0.387],
            [166.7, 288.2, 5.12, "#b6b4af", -145, 4, 0.028],
            [176.7, 288.2, 5.12, "#b6b4af", -118, 17, 0.063],
            [196.6, 288.2, 5.12, "#b9aba5", -270, -107, 0.109],
            [206.6, 288.2, 5.12, "#baa5a0", -303, -26, 0.028],
            [226.5, 288.2, 5.12, "#c18f8a", -169, -105, 0.444],
            [236.5, 288.2, 5.12, "#c3857d", -197, -180, 0.449],
            [246.5, 288.2, 5.12, "#c77972", -151, -199, 0.147],
            [256.5, 288.2, 5.12, "#cb6c66", -185, -235, 0.013],
            [266.4, 288.2, 5.12, "#cd615a", -124, -193, 0.237],
            [276.4, 288.2, 5.12, "#d0594f", -165, -67, 0.35],
            [286.4, 288.2, 5.12, "#d25246", -125, -47, 0.131],
            [296.3, 288.2, 5.12, "#d54f40", -138, -69, 0.173],
            [306.3, 288.2, 5.12, "#d6523d", -87, -210, 0.237],
            [316.3, 288.2, 5.12, "#d7593c", -158, -215, 0.33],
            [326.2, 288.2, 5.12, "#d7613d", -160, -94, 0.13],
            [336.2, 288.2, 5.12, "#d96b3f", -13, -154, 0.443],
            [346.2, 288.2, 5.12, "#d87440", -174, -247, 0.343],
            [356.1, 288.2, 5.12, "#d97e42", -161, -232, 0.042],
            [366.1, 288.2, 5.12, "#d98743", -106, -177, 0.4],
            [376.1, 288.2, 5.12, "#d88f45", -16, -161, 0.015],
            [386, 288.2, 5.12, "#d99649", -119, -204, 0.173],
            [396, 288.2, 5.12, "#d99c4d", -65, -95, 0.331],
            [406, 288.2, 5.12, "#d9a053", -49, -127, 0.343],
            [416, 288.2, 5.12, "#daa35c", 67, -143, 0.029],
            [435.9, 288.2, 5.12, "#d9a46e", -33, -150, 0.168],
            [445.9, 288.2, 5.12, "#d9a477", -24, -262, 0.181],
            [455.8, 288.2, 5.12, "#daa47f", 54, -165, 0.307],
            [465.8, 288.2, 5.12, "#daa589", 32, -274, 0.103],
            [485.7, 288.2, 5.12, "#d9a497", 50, -156, 0.397],
            [495.7, 288.2, 5.12, "#d8a39d", 87, -235, 0.241],
            [505.7, 288.2, 5.12, "#d8a4a1", 173, -107, 0.356],
            [535.6, 288.2, 5.12, "#d5a3a7", 123, -132, 0.243],
            [545.5, 288.2, 4.05, "#b39091", 106, -159, 0.25],
            [565.5, 288.2, 4.05, "#b4918e", 82, -150, 0.446],
            [575.5, 288.2, 4.05, "#b5918c", 101, -2, 0.179],
            [595.4, 288.2, 4.05, "#b59186", 83, -102, 0.018],
            [605.4, 288.2, 4.05, "#b69180", 139, -129, 0.101],
            [615.3, 288.2, 4.05, "#b6917c", 166, -161, 0.1],
            [625.3, 288.2, 4.05, "#b59175", 79, -99, 0.336],
            [635.3, 288.2, 4.05, "#b69170", 120, -124, 0.442],
            [645.2, 288.2, 4.05, "#b59068", 272, -64, 0.233],
            [156.8, 298.2, 5.12, "#b8b5b1", -264, -61, 0.308],
            [196.6, 298.2, 5.12, "#b8aea9", -237, -74, 0.244],
            [206.6, 298.2, 5.12, "#baa7a1", -89, -86, 0.246],
            [216.6, 298.2, 5.12, "#bc9e99", -148, -193, 0.152],
            [226.5, 298.2, 5.12, "#bf938e", -165, -105, 0.247],
            [236.5, 298.2, 5.12, "#c28781", -108, -57, 0.079],
            [246.5, 298.2, 5.12, "#c57d77", -126, -180, 0.308],
            [256.5, 298.2, 5.12, "#c8716a", -115, -213, 0.098],
            [276.4, 298.2, 5.12, "#cf5b53", -107, -20, 0.443],
            [286.4, 298.2, 5.12, "#d2544a", -155, -149, 0.406],
            [296.3, 298.2, 5.12, "#d45042", -118, -32, 0.02],
            [306.3, 298.2, 5.12, "#d6513e", -270, -112, 0.001],
            [316.3, 298.2, 5.12, "#d6573c", -209, -210, 0.266],
            [326.2, 298.2, 5.12, "#d85e3d", -171, -111, 0.206],
            [336.2, 298.2, 5.12, "#d8663e", -35, -227, 0.073],
            [346.2, 298.2, 5.12, "#d97040", -19, -272, 0.179],
            [356.1, 298.2, 5.12, "#d97941", -31, -187, 0.338],
            [366.1, 298.2, 5.12, "#d98243", -121, -271, 0.379],
            [376.1, 298.2, 5.12, "#d98b44", -101, -217, 0.14],
            [406, 298.2, 5.12, "#da9e4f", -3, -94, 0.135],
            [416, 298.2, 5.12, "#daa155", 48, -81, 0.437],
            [425.9, 298.2, 5.12, "#d9a35d", 131, -116, 0.117],
            [445.9, 298.2, 5.12, "#daa56e", 56, -114, 0.316],
            [455.8, 298.2, 5.12, "#daa477", 91, -105, 0.431],
            [475.8, 298.2, 5.12, "#daa586", 277, -107, 0.214],
            [485.7, 298.2, 5.12, "#d9a48c", 195, -107, 0.198],
            [495.7, 298.2, 5.12, "#d9a491", 68, -101, 0.427],
            [505.7, 298.2, 5.12, "#d9a497", 99, -148, 0.174],
            [515.6, 298.2, 5.12, "#d9a499", 114, -7, 0.293],
            [525.6, 298.2, 5.12, "#d9a59b", 258, -129, 0.374],
            [535.6, 298.2, 5.12, "#d9a49c", 75, -94, 0.438],
            [545.5, 298.2, 4.05, "#b5918a", 242, -149, 0.272],
            [565.5, 298.2, 4.05, "#b59188", 108, -178, 0.036],
            [575.5, 298.2, 4.05, "#b59185", 81, -51, 0.186],
            [585.4, 298.2, 4.05, "#b59182", 281, -97, 0.346],
            [595.4, 298.2, 4.05, "#b5917e", 189, -237, 0.252],
            [605.4, 298.2, 4.05, "#b5917a", 188, -199, 0.122],
            [615.3, 298.2, 4.05, "#b69175", 129, -110, 0.037],
            [625.3, 298.2, 4.05, "#b5916e", 136, -67, 0.317],
            [635.3, 298.2, 4.05, "#b6916a", 129, -127, 0.386],
            [156.8, 308.2, 4.05, "#8b8885", -138, -12, 0.14],
            [166.7, 308.2, 4.05, "#e7e5df", -212, -149, 0.393],
            [176.7, 308.2, 5.12, "#e7e5df", -274, -84, 0.12],
            [186.7, 308.2, 4.05, "#e7e4df", -150, -194, 0.294],
            [206.6, 308.2, 5.12, "#b9aaa4", -253, 39, 0.032],
            [216.6, 308.2, 5.12, "#bca19c", -138, -94, 0.223],
            [226.5, 308.2, 5.12, "#be9792", -229, -196, 0.197],
            [236.5, 308.2, 5.12, "#c18c85", -60, -96, 0.145],
            [246.5, 308.2, 5.12, "#c5817a", -256, -66, 0.305],
            [256.5, 308.2, 5.12, "#c8756e", -244, -154, 0.4],
            [266.4, 308.2, 5.12, "#cb6962", -302, 0, 0.057],
            [286.4, 308.2, 5.12, "#d1564d", -246, -95, 0.331],
            [306.3, 308.2, 5.12, "#d6503f", -259, -108, 0.164],
            [316.3, 308.2, 5.12, "#d6543c", -119, -273, 0.379],
            [326.2, 308.2, 5.12, "#d75a3c", -96, -122, 0.14],
            [336.2, 308.2, 5.12, "#d7623d", -116, -192, 0.139],
            [346.2, 308.2, 5.12, "#d86a3f", -196, -71, 0.431],
            [366.1, 308.2, 5.12, "#d87c41", -26, -195, 0.38],
            [376.1, 308.2, 5.12, "#d98543", -107, -120, 0.369],
            [386, 308.2, 5.12, "#d98d45", -23, -155, 0.055],
            [396, 308.2, 5.12, "#d99447", -101, -269, 0.256],
            [406, 308.2, 5.12, "#da9a4c", -97, -291, 0.318],
            [416, 308.2, 5.12, "#da9e4f", 145, -175, 0.423],
            [435.9, 308.2, 5.12, "#d9a35e", 9, -124, 0.341],
            [445.9, 308.2, 5.12, "#d9a364", 152, -192, 0.121],
            [455.8, 308.2, 5.12, "#daa56d", 29, -116, 0.29],
            [465.8, 308.2, 5.12, "#daa575", 186, -155, 0.109],
            [475.8, 308.2, 5.12, "#d9a47b", 129, -145, 0.318],
            [495.7, 308.2, 5.12, "#d9a486", 172, -77, 0.366],
            [505.7, 308.2, 5.12, "#d9a48b", 121, -137, 0.377],
            [515.6, 308.2, 5.12, "#daa58e", 136, -51, 0.151],
            [535.6, 308.2, 5.12, "#d9a490", 117, -114, 0.204],
            [545.5, 308.2, 4.05, "#b69182", 252, -53, 0.314],
            [565.5, 308.2, 4.05, "#b59180", 228, 16, 0.313],
            [575.5, 308.2, 4.05, "#b6917d", 85, -38, 0.192],
            [585.4, 308.2, 4.05, "#b6917b", 183, -80, 0.267],
            [595.4, 308.2, 4.05, "#b69175", 293, -1, 0.044],
            [615.3, 308.2, 4.05, "#b6916d", 215, -115, 0.132],
            [625.3, 308.2, 4.05, "#b69169", 204, 45, 0.405],
            [166.7, 318.2, 5.12, "#e7e5df", -138, -132, 0.265],
            [176.7, 318.2, 6.18, "#e7e5df", -198, -28, 0.221],
            [186.7, 318.2, 5.12, "#e7e4de", -187, -120, 0.329],
            [206.6, 318.2, 5.12, "#b9aca6", -187, -22, 0.14],
            [216.6, 318.2, 5.12, "#bba49e", -249, -163, 0.023],
            [226.5, 318.2, 5.12, "#bd9b96", -132, -67, 0.005],
            [236.5, 318.2, 5.12, "#c0918a", -136, -15, 0.183],
            [246.5, 318.2, 5.12, "#c28680", -150, -30, 0.214],
            [256.5, 318.2, 5.12, "#c67973", -192, -14, 0.275],
            [266.4, 318.2, 5.12, "#c96e67", -297, -12, 0.367],
            [276.4, 318.2, 5.12, "#cd635b", -81, -123, 0.188],
            [286.4, 318.2, 5.12, "#d05951", -202, -114, 0.26],
            [296.3, 318.2, 5.12, "#d25349", -167, -161, 0.352],
            [306.3, 318.2, 5.12, "#d54f41", -180, -97, 0.014],
            [346.2, 318.2, 5.12, "#d8663e", -173, -215, 0.261],
            [356.1, 318.2, 5.12, "#d86e3f", -154, -105, 0.209],
            [366.1, 318.2, 5.12, "#d87641", -8, -177, 0.179],
            [376.1, 318.2, 5.12, "#d97f42", -45, -91, 0.032],
            [386, 318.2, 5.12, "#d98643", -36, -129, 0.365],
            [396, 318.2, 5.12, "#d98e45", 31, -169, 0.247],
            [406, 318.2, 5.12, "#d99447", -56, -135, 0.22],
            [416, 318.2, 5.12, "#d99a4b", 10, -143, 0.163],
            [425.9, 318.2, 5.12, "#d99e50", -3, -208, 0.386],
            [445.9, 318.2, 5.12, "#daa35c", 43, -100, 0.001],
            [465.8, 318.2, 5.12, "#daa56a", 131, -130, 0.329],
            [475.8, 318.2, 5.12, "#d9a470", 122, -87, 0.351],
            [495.7, 318.2, 5.12, "#daa57b", 115, -96, 0.263],
            [505.7, 318.2, 5.12, "#daa57e", 131, -128, 0.063],
            [515.6, 318.2, 5.12, "#daa480", 115, -105, 0.346],
            [525.6, 318.2, 5.12, "#daa583", 227, 3, 0.16],
            [535.6, 318.2, 5.12, "#daa483", 233, -183, 0.154],
            [565.5, 318.2, 4.05, "#b59177", 205, -175, 0.09],
            [575.5, 318.2, 4.05, "#b69174", 196, -17, 0.046],
            [585.4, 318.2, 4.05, "#b59172", 251, -116, 0.01],
            [595.4, 318.2, 4.05, "#b5916f", 203, 1, 0.047],
            [605.4, 318.2, 4.05, "#b6916b", 177, -212, 0.4],
            [156.8, 328.1, 4.05, "#8a8682", -257, -50, 0.141],
            [166.7, 328.1, 4.05, "#e7e5df", -206, -32, 0.215],
            [176.7, 328.1, 5.12, "#e7e5df", -106, -41, 0.184],
            [186.7, 328.1, 4.05, "#e7e4df", -127, -99, 0.2],
            [206.6, 328.1, 5.12, "#b8ada8", -173, 34, 0.367],
            [216.6, 328.1, 5.12, "#baa7a2", -86, -28, 0.198],
            [226.5, 328.1, 5.12, "#bb9f99", -113, -26, 0.131],
            [276.4, 328.1, 5.12, "#ca6861", -197, -42, 0.015],
            [286.4, 328.1, 5.12, "#ce5f56", -130, -130, 0.19],
            [296.3, 328.1, 5.12, "#d1564c", -82, -140, 0.384],
            [306.3, 328.1, 5.12, "#d35145", -150, -51, 0.329],
            [316.3, 328.1, 5.12, "#d5503f", -172, -6, 0.346],
            [326.2, 328.1, 5.12, "#d6523d", -87, -201, 0.181],
            [336.2, 328.1, 5.12, "#d7593c", -169, -231, 0.37],
            [346.2, 328.1, 5.12, "#d8613d", -111, -170, 0.142],
            [356.1, 328.1, 5.12, "#d9683f", -223, -193, 0.298],
            [366.1, 328.1, 5.12, "#d97240", -129, -119, 0.373],
            [376.1, 328.1, 5.12, "#d87940", 5, -188, 0.162],
            [386, 328.1, 5.12, "#d98142", -4, -270, 0.058],
            [396, 328.1, 5.12, "#d98844", -5, -106, 0.124],
            [406, 328.1, 5.12, "#d98f46", 74, -171, 0.165],
            [416, 328.1, 5.12, "#d99447", 47, -170, 0.094],
            [425.9, 328.1, 5.12, "#d99a4b", 138, -134, 0.04],
            [435.9, 328.1, 5.12, "#da9d4f", 79, -178, 0.414],
            [445.9, 328.1, 5.12, "#d9a053", 168, -145, 0.379],
            [455.8, 328.1, 5.12, "#daa35b", 245, -136, 0.132],
            [475.8, 328.1, 5.12, "#daa465", 209, -177, 0.097],
            [485.7, 328.1, 5.12, "#daa469", 132, -134, 0.282],
            [495.7, 328.1, 5.12, "#daa56e", 102, -21, 0.097],
            [505.7, 328.1, 5.12, "#d9a471", 240, -11, 0.275],
            [515.6, 328.1, 5.12, "#d9a473", 103, -102, 0.259],
            [525.6, 328.1, 5.12, "#d9a476", 270, -3, 0.127],
            [535.6, 328.1, 5.12, "#daa477", 225, -47, 0.357],
            [545.5, 328.1, 4.05, "#b59170", 114, -122, 0.266],
            [565.5, 328.1, 4.05, "#b6916f", 185, -18, 0.392],
            [575.5, 328.1, 4.05, "#b6916b", 154, 11, 0.272],
            [585.4, 328.1, 4.05, "#b6916a", 249, 68, 0.37],
            [645.2, 328.1, 4.05, "#b58b55", 232, -3, 0.111],
            [156.8, 338.1, 5.12, "#b6b4af", -267, -108, 0.415],
            [166.7, 338.1, 4.05, "#888580", -190, -168, 0.401],
            [186.7, 338.1, 4.05, "#888581", -121, -35, 0.36],
            [196.6, 338.1, 5.12, "#b7b2ae", -190, -62, 0.278],
            [206.6, 338.1, 5.12, "#b8b0aa", -220, 12, 0.234],
            [216.6, 338.1, 5.12, "#baa9a4", -182, -39, 0.32],
            [226.5, 338.1, 5.12, "#bba29e", -304, 45, 0.047],
            [246.5, 338.1, 5.12, "#c0908a", -108, -37, 0.167],
            [256.5, 338.1, 5.12, "#996c68", -137, -151, 0.173],
            [266.4, 338.1, 5.12, "#9c6863", -108, -98, 0.425],
            [276.4, 338.1, 5.12, "#a1635d", -299, -17, 0.381],
            [296.3, 338.1, 5.12, "#d05951", -196, -121, 0.234],
            [306.3, 338.1, 5.12, "#d2544a", -149, -14, 0.098],
            [316.3, 338.1, 5.12, "#d45042", -66, -119, 0.388],
            [326.2, 338.1, 5.12, "#d6513e", -160, -231, 0.446],
            [336.2, 338.1, 5.12, "#d6543d", -223, -163, 0.293],
            [346.2, 338.1, 5.12, "#d75b3d", -109, -197, 0.035],
            [356.1, 338.1, 5.12, "#d8633e", -255, -174, 0.072],
            [366.1, 338.1, 5.12, "#d86a3e", -155, -101, 0.076],
            [376.1, 338.1, 5.12, "#b56f4c", -40, -194, 0.058],
            [386, 338.1, 5.12, "#b5744d", -39, -209, 0.253],
            [406, 338.1, 5.12, "#d98844", 96, -117, 0.053],
            [416, 338.1, 5.12, "#d98f45", 91, -133, 0.329],
            [425.9, 338.1, 5.12, "#d99447", -16, -184, 0.053],
            [435.9, 338.1, 5.12, "#da9a4b", 88, -196, 0.242],
            [445.9, 338.1, 5.12, "#d99c4d", 120, -281, 0.135],
            [455.8, 338.1, 5.12, "#d99e51", 165, -219, 0.432],
            [465.8, 338.1, 5.12, "#daa156", 210, -113, 0.202],
            [475.8, 338.1, 5.12, "#daa35b", 282, -42, 0.182],
            [485.7, 338.1, 5.12, "#daa35e", 224, -141, 0.219],
            [495.7, 338.1, 5.12, "#daa462", 177, -176, 0.222],
            [505.7, 338.1, 5.12, "#daa465", 270, -92, 0.294],
            [515.6, 338.1, 5.12, "#daa467", 82, -71, 0.046],
            [525.6, 338.1, 5.12, "#d9a368", 229, 31, 0.335],
            [565.5, 338.1, 4.05, "#b59066", 249, -137, 0.168],
            [625.3, 338.1, 4.05, "#796346", 72, -63, 0.305],
            [635.3, 338.1, 4.05, "#796245", 148, 47, 0.174],
            [156.8, 348.1, 5.12, "#b6b4af", -272, -33, 0.359],
            [166.7, 348.1, 5.12, "#b6b4af", -108, -37, 0.128],
            [186.7, 348.1, 5.12, "#b6b4af", -100, -80, 0.038],
            [196.6, 348.1, 5.12, "#b6b3ae", -249, 81, 0.035],
            [206.6, 348.1, 5.12, "#b7b1ac", -128, 16, 0.068],
            [216.6, 348.1, 5.12, "#b8ada8", -99, -7, 0.388],
            [226.5, 348.1, 5.12, "#baa6a1", -231, -86, 0.369],
            [236.5, 348.1, 5.12, "#bd9d97", -258, -41, 0.122],
            [246.5, 348.1, 5.12, "#be958f", -103, -81, 0.277],
            [256.5, 348.1, 5.12, "#976f6a", -306, -27, 0.086],
            [266.4, 348.1, 5.12, "#9a6b66", -175, 57, 0.356],
            [286.4, 348.1, 5.12, "#a3605a", -257, -41, 0.34],
            [296.3, 348.1, 5.12, "#cd6057", -142, 14, 0.069],
            [306.3, 348.1, 5.12, "#d1574e", -161, -33, 0.366],
            [316.3, 348.1, 5.12, "#d35146", -111, -61, 0.38],
            [326.2, 348.1, 5.12, "#d45041", -189, -137, 0.048],
            [336.2, 348.1, 5.12, "#d6513d", -82, -153, 0.109],
            [346.2, 348.1, 5.12, "#d7563c", -179, -153, 0.411],
            [356.1, 348.1, 5.12, "#d75d3d", -111, -11, 0.412],
            [366.1, 348.1, 5.12, "#d7633d", -43, -165, 0.096],
            [376.1, 348.1, 5.12, "#b46b4b", -228, -175, 0.062],
            [386, 348.1, 5.12, "#b5704c", -75, -243, 0.22],
            [396, 348.1, 5.12, "#b5754d", -53, -268, 0.184],
            [416, 348.1, 5.12, "#d98843", 68, -75, 0.086],
            [425.9, 348.1, 5.12, "#d98d45", 59, -101, 0.344],
            [435.9, 348.1, 5.12, "#d99346", 45, -119, 0.286],
            [445.9, 348.1, 5.12, "#da9749", 220, -154, 0.048],
            [455.8, 348.1, 5.12, "#da9a4c", 263, -32, 0.424],
            [465.8, 348.1, 5.12, "#d99d4f", 142, -262, 0.035],
            [475.8, 348.1, 5.12, "#d99f52", 121, 1, 0.139],
            [485.7, 348.1, 5.12, "#daa155", 216, -136, 0.064],
            [495.7, 348.1, 5.12, "#daa258", 183, 9, 0.38],
            [505.7, 348.1, 5.12, "#d9a25a", 211, -223, 0.076],
            [515.6, 348.1, 5.12, "#d9a35b", 252, 17, 0.08],
            [525.6, 348.1, 5.12, "#daa35d", 117, 6, 0.381],
            [535.6, 348.1, 5.12, "#d9a35e", 96, -5, 0.125],
            [545.5, 348.1, 4.05, "#b69060", 187, -73, 0.192],
            [605.4, 348.1, 4.05, "#b58d57", 219, -139, 0.184],
            [615.3, 348.1, 4.05, "#796345", 286, -24, 0.227],
            [625.3, 348.1, 4.05, "#796244", 117, 8, 0.006],
            [645.2, 348.1, 4.05, "#785f43", 166, 63, 0.235],
            [156.8, 358.1, 4.05, "#7f7c78", -248, -114, 0.225],
            [166.7, 358.1, 4.05, "#85827e", -83, -44, 0.148],
            [186.7, 358.1, 4.05, "#85827e", -218, -69, 0.294],
            [206.6, 358.1, 4.05, "#86827d", -264, 133, 0.035],
            [216.6, 358.1, 4.05, "#87807c", -152, 76, 0.242],
            [226.5, 358.1, 4.05, "#8a7e79", -158, 74, 0.084],
            [236.5, 358.1, 4.05, "#8d7b76", -104, 2, 0.297],
            [246.5, 358.1, 4.05, "#8f7772", -87, 27, 0.096],
            [256.5, 358.1, 4.05, "#95726d", -225, -117, 0.214],
            [266.4, 358.1, 4.05, "#986c68", -138, 56, 0.404],
            [276.4, 358.1, 4.05, "#9d6862", -207, -122, 0.293],
            [286.4, 358.1, 4.05, "#a0645e", -103, 40, 0.176],
            [296.3, 358.1, 4.05, "#a55f59", -218, -126, 0.119],
            [306.3, 358.1, 4.05, "#a95a54", -135, -136, 0.045],
            [316.3, 358.1, 4.05, "#ad584f", -151, -97, 0.447],
            [326.2, 358.1, 4.05, "#ae564d", -146, 41, 0.109],
            [346.2, 358.1, 4.05, "#b25949", -169, -197, 0.006],
            [356.1, 358.1, 4.05, "#b35c4a", -207, -69, 0.027],
            [366.1, 358.1, 4.05, "#aa5d48", -187, -185, 0.401],
            [376.1, 358.1, 4.05, "#ab6247", -222, -168, 0.121],
            [386, 358.1, 4.05, "#ac6749", -88, -294, 0.213],
            [406, 358.1, 4.05, "#ac6f4a", 40, -156, 0.403],
            [425.9, 358.1, 4.05, "#ac774b", 123, -115, 0.221],
            [435.9, 358.1, 4.05, "#ac7a4c", 137, -142, 0.274],
            [455.8, 358.1, 4.05, "#ac7f4d", 245, -159, 0.215],
            [465.8, 358.1, 4.05, "#ac804e", 218, 3, 0.025],
            [485.7, 358.1, 4.05, "#b68b55", 113, 21, 0.316],
            [495.7, 358.1, 4.05, "#b58c56", 300, 51, 0.138],
            [505.7, 358.1, 4.05, "#b58d57", 110, -100, 0.096],
            [515.6, 358.1, 4.05, "#b58d58", 252, 17, 0.037],
            [525.6, 358.1, 4.05, "#b58e59", 305, -33, 0.334],
            [585.4, 358.1, 4.05, "#b68d57", 286, -89, 0.323],
            [595.4, 358.1, 4.05, "#b68c55", 127, -46, 0.184],
            [605.4, 358.1, 4.05, "#b68a53", 173, -126, 0.438],
            [615.3, 358.1, 4.05, "#796043", 181, 92, 0.282],
            [625.3, 358.1, 4.05, "#795f43", 141, -37, 0.003],
            [635.3, 358.1, 4.05, "#785e42", 108, 0, 0.367],
            [645.2, 358.1, 4.05, "#b57f4f", 176, 78, 0.301],
            [565.5, 368, 4.05, "#b68a54", 115, -18, 0.045],
            [575.5, 368, 4.05, "#b68953", 202, -104, 0.398],
            [585.4, 368, 4.05, "#b58752", 193, 59, 0.26],
            [595.4, 368, 4.05, "#b58751", 100, 50, 0.21],
            [625.3, 368, 4.05, "#b5814f", 214, -114, 0.328],
            [635.3, 368, 4.05, "#b57d4e", 90, -43, 0.017],
            [645.2, 368, 4.05, "#b5794d", 110, -70, 0.163],
            [166.7, 378, 6.18, "#e7e5df", -176, -106, 0.186],
            [186.7, 378, 5.12, "#b6b4af", -159, 22, 0.069],
            [196.6, 378, 5.12, "#b6b4af", -263, -149, 0.395],
            [206.6, 378, 5.12, "#b6b4af", -295, 68, 0.155],
            [216.6, 378, 5.12, "#b6b3ae", -170, 81, 0.444],
            [226.5, 378, 5.12, "#b8b0ab", -185, -50, 0.324],
            [236.5, 378, 5.12, "#b9aaa4", -94, 14, 0.261],
            [246.5, 378, 5.12, "#8b7b77", -83, -38, 0.197],
            [256.5, 378, 5.12, "#8f7873", -128, -63, 0.262],
            [276.4, 378, 5.12, "#976e69", -283, 3, 0.45],
            [286.4, 378, 5.12, "#c47d77", -125, 23, 0.244],
            [296.3, 378, 5.12, "#c9746d", -303, 4, 0.145],
            [306.3, 378, 5.12, "#cb6962", -241, -86, 0.28],
            [316.3, 378, 5.12, "#ce605a", -94, -28, 0.401],
            [326.2, 378, 5.12, "#d05950", -133, 77, 0.323],
            [346.2, 378, 5.12, "#d35042", -223, -85, 0.094],
            [366.1, 378, 5.12, "#b2594a", -110, 41, 0.147],
            [386, 378, 5.12, "#b3614b", -293, -9, 0.154],
            [396, 378, 5.12, "#b4654a", -56, -227, 0.212],
            [416, 378, 5.12, "#b56d4c", 167, -172, 0.162],
            [425.9, 378, 5.12, "#b4714c", 105, -38, 0.207],
            [435.9, 378, 5.12, "#d97a41", 166, 62, 0.39],
            [445.9, 378, 5.12, "#d87f41", 207, -176, 0.404],
            [455.8, 378, 5.12, "#d98343", 194, -97, 0.367],
            [465.8, 378, 5.12, "#d88542", 210, -48, 0.257],
            [475.8, 378, 5.12, "#d98a44", 211, 12, 0.177],
            [485.7, 378, 5.12, "#b4814f", 252, 140, 0.338],
            [495.7, 378, 5.12, "#b58350", 117, 35, 0.38],
            [505.7, 378, 5.12, "#b58450", 161, 26, 0.245],
            [515.6, 378, 5.12, "#b58550", 212, -128, 0.069],
            [525.6, 378, 5.12, "#d99347", 122, -42, 0.202],
            [535.6, 378, 5.12, "#d99447", 169, 105, 0.032],
            [545.5, 378, 4.05, "#b58651", 140, 77, 0.228],
            [565.5, 378, 4.05, "#b58651", 96, 31, 0.265],
            [585.4, 378, 4.05, "#b58350", 217, -32, 0.342],
            [605.4, 378, 4.05, "#b57f4f", 277, -115, 0.135],
            [615.3, 378, 4.05, "#b57c4e", 242, -52, 0.169],
            [625.3, 378, 4.05, "#b57b4e", 279, -19, 0.238],
            [635.3, 378, 4.05, "#b5774e", 210, 7, 0.077],
            [645.2, 378, 4.05, "#b4744c", 141, 60, 0.213],
            [156.8, 388, 5.12, "#b6b4af", -264, -40, 0.277],
            [166.7, 388, 5.12, "#b6b4af", -103, 68, 0.053],
            [176.7, 388, 4.05, "#85827e", -84, 53, 0.015],
            [186.7, 388, 5.12, "#b6b4af", -191, 22, 0.139],
            [196.6, 388, 5.12, "#b6b4af", -158, 87, 0.439],
            [206.6, 388, 5.12, "#b6b4ae", -287, -73, 0.097],
            [216.6, 388, 5.12, "#b6b3ae", -99, -58, 0.439],
            [226.5, 388, 5.12, "#b7b1ac", -117, -41, 0.239],
            [236.5, 388, 5.12, "#887f7b", -138, 56, 0.125],
            [256.5, 388, 5.12, "#8d7a75", -170, 43, 0.121],
            [266.4, 388, 5.12, "#907671", -80, -44, 0.089],
            [276.4, 388, 5.12, "#94716d", -182, 119, 0.339],
            [286.4, 388, 5.12, "#c3857f", -249, -45, 0.239],
            [306.3, 388, 5.12, "#c9716a", -262, 113, 0.397],
            [316.3, 388, 5.12, "#cb6860", -229, -98, 0.272],
            [326.2, 388, 5.12, "#cd5f57", -188, 26, 0.185],
            [336.2, 388, 5.12, "#d0584e", -237, 5, 0.42],
            [356.1, 388, 5.12, "#d44f42", -190, 29, 0.26],
            [376.1, 388, 5.12, "#b2594a", -227, 94, 0.427],
            [386, 388, 5.12, "#b35d4a", -112, -29, 0.156],
            [396, 388, 5.12, "#b4604a", -148, 39, 0.256],
            [406, 388, 5.12, "#b4634a", 114, 76, 0.206],
            [416, 388, 5.12, "#b4684b", 269, 83, 0.174],
            [425.9, 388, 5.12, "#b46b4b", 81, 74, 0.394],
            [435.9, 388, 5.12, "#b56e4c", 185, -56, 0.361],
            [445.9, 388, 5.12, "#d87640", 250, 41, 0.358],
            [465.8, 388, 5.12, "#d87c41", 143, -31, 0.055],
            [475.8, 388, 5.12, "#d87f41", 230, -82, 0.225],
            [485.7, 388, 5.12, "#b57b4e", 216, 155, 0.327],
            [495.7, 388, 5.12, "#b57d4e", 236, 23, 0.336],
            [505.7, 388, 5.12, "#b57e4e", 276, 134, 0.039],
            [515.6, 388, 5.12, "#b57f4e", 159, 100, 0.25],
            [525.6, 388, 5.12, "#b47f4e", 128, -6, 0.076],
            [535.6, 388, 5.12, "#b47f4e", 248, 45, 0.305],
            [565.5, 388, 4.05, "#b57f4f", 159, 37, 0.355],
            [575.5, 388, 4.05, "#b57e4e", 125, -73, 0.22],
            [595.4, 388, 4.05, "#b57b4e", 287, -48, 0.029],
            [605.4, 388, 4.05, "#b5794e", 108, -19, 0.392],
            [615.3, 388, 4.05, "#b4764d", 98, 17, 0.355],
            [625.3, 388, 4.05, "#b5744d", 248, -137, 0.236],
            [635.3, 388, 4.05, "#b5714c", 239, -47, 0.111],
            [645.2, 388, 4.05, "#ac6949", 230, 96, 0.251],
            [156.8, 398, 4.05, "#7f7c78", -123, 66, 0.201],
            [176.7, 398, 4.05, "#85827e", -84, -39, 0.421],
            [196.6, 398, 4.05, "#85827e", -230, 57, 0.427],
            [206.6, 398, 5.12, "#b6b4af", -138, -41, 0.234],
            [216.6, 398, 5.12, "#b6b4af", -186, 65, 0.391],
            [226.5, 398, 5.12, "#b7b3ae", -272, 1, 0.083],
            [236.5, 398, 5.12, "#b8b0ab", -211, -47, 0.257],
            [246.5, 398, 5.12, "#887e7b", -170, -11, 0.346],
            [256.5, 398, 5.12, "#8a7d78", -99, 61, 0.114],
            [266.4, 398, 5.12, "#8e7974", -99, 74, 0.274],
            [276.4, 398, 5.12, "#bf9690", -269, 69, 0.221],
            [286.4, 398, 5.12, "#c18d87", -250, 83, 0.002],
            [296.3, 398, 5.12, "#c4847d", -182, -60, 0.002],
            [306.3, 398, 5.12, "#c67973", -176, 28, 0.212],
            [316.3, 398, 5.12, "#c97069", -270, 116, 0.445],
            [326.2, 398, 5.12, "#cc675f", -186, 0, 0.383],
            [336.2, 398, 5.12, "#ce5e56", -261, -23, 0.152],
            [346.2, 398, 5.12, "#d0584f", -293, 42, 0.234],
            [356.1, 398, 5.12, "#d15449", -107, 71, 0.252],
            [366.1, 398, 5.12, "#af564d", -134, 17, 0.058],
            [386, 398, 5.12, "#b2594a", -101, 133, 0.119],
            [396, 398, 5.12, "#b35b49", -145, 167, 0.166],
            [406, 398, 5.12, "#b35e4a", -15, 157, 0.085],
            [416, 398, 5.12, "#b4624b", 148, 161, 0.263],
            [425.9, 398, 5.12, "#b3654a", 187, 46, 0.069],
            [435.9, 398, 5.12, "#b4684b", 182, 42, 0.161],
            [445.9, 398, 5.12, "#d86c3f", 104, 83, 0.155],
            [465.8, 398, 5.12, "#d87340", 279, 86, 0.399],
            [495.7, 398, 5.12, "#b4764d", 221, 70, 0.115],
            [505.7, 398, 5.12, "#b5774d", 99, -5, 0.328],
            [525.6, 398, 5.12, "#b4784d", 152, -17, 0.359],
            [545.5, 398, 4.05, "#b5794e", 124, -29, 0.371],
            [565.5, 398, 4.05, "#b5794d", 123, 62, 0.411],
            [585.4, 398, 4.05, "#b5764d", 269, -48, 0.094],
            [595.4, 398, 4.05, "#b4754c", 116, -43, 0.22],
            [605.4, 398, 4.05, "#b4734c", 146, 86, 0.428],
            [615.3, 398, 4.05, "#b4704c", 104, 40, 0.147],
            [625.3, 398, 4.05, "#b46e4c", 161, -18, 0.186],
            [166.7, 407.9, 5.12, "#b6b4af", -290, 35, 0.025],
            [186.7, 407.9, 5.12, "#b6b4af", -123, -8, 0.075],
            [206.6, 407.9, 5.12, "#b6b4af", -160, 86, 0.037],
            [216.6, 407.9, 5.12, "#b6b4af", -130, -62, 0.274],
            [226.5, 407.9, 5.12, "#b6b3ae", -202, 15, 0.351],
            [236.5, 407.9, 5.12, "#b7b2ad", -115, 55, 0.442],
            [246.5, 407.9, 5.12, "#b8b0aa", -126, 62, 0.381],
            [256.5, 407.9, 5.12, "#b8aba6", -254, 123, 0.338],
            [266.4, 407.9, 5.12, "#baa59f", -292, -87, 0.01],
            [276.4, 407.9, 5.12, "#bc9d97", -105, 5, 0.184],
            [286.4, 407.9, 5.12, "#bf958f", -239, -11, 0.415],
            [296.3, 407.9, 5.12, "#c28c85", -125, -12, 0.402],
            [306.3, 407.9, 5.12, "#c3827b", -167, -53, 0.185],
            [326.2, 407.9, 5.12, "#c97069", -123, 140, 0.343],
            [336.2, 407.9, 5.12, "#cc665e", -109, 27, 0.242],
            [346.2, 407.9, 5.12, "#cd5f56", -175, -5, 0.131],
            [366.1, 407.9, 5.12, "#d2534a", -85, 35, 0.171],
            [376.1, 407.9, 5.12, "#b0574d", -24, 95, 0.37],
            [386, 407.9, 5.12, "#b1574b", -92, 52, 0.051],
            [396, 407.9, 5.12, "#b2584b", -86, 158, 0.395],
            [406, 407.9, 5.12, "#b25a4a", -7, 259, 0.358],
            [416, 407.9, 5.12, "#b35d4a", 251, 177, 0.052],
            [425.9, 407.9, 5.12, "#b3604a", 145, 113, 0.388],
            [435.9, 407.9, 5.12, "#b4634a", 215, 174, 0.4],
            [445.9, 407.9, 5.12, "#d8643e", 105, 92, 0.348],
            [455.8, 407.9, 5.12, "#d8673e", 252, 112, 0.117],
            [475.8, 407.9, 5.12, "#d86c3f", 175, 139, 0.195],
            [485.7, 407.9, 5.12, "#b56e4c", 225, 85, 0.374],
            [495.7, 407.9, 5.12, "#b46f4b", 206, -29, 0.425],
            [515.6, 407.9, 5.12, "#b4714c", 218, 138, 0.302],
            [525.6, 407.9, 5.12, "#b4724c", 292, -103, 0.225],
            [535.6, 407.9, 5.12, "#b5734d", 110, -23, 0.038],
            [545.5, 407.9, 4.05, "#b4724c", 127, -3, 0.328],
            [565.5, 407.9, 4.05, "#b4724c", 103, -48, 0.02],
            [575.5, 407.9, 4.05, "#b4714c", 105, 6, 0.22],
            [595.4, 407.9, 4.05, "#b56f4c", 217, -89, 0.35],
            [166.7, 417.9, 5.12, "#b6b4af", -150, -45, 0.189],
            [176.7, 417.9, 6.18, "#e7e5df", -136, -50, 0.186],
            [186.7, 417.9, 5.12, "#b6b4af", -151, 104, 0.381],
            [206.6, 417.9, 5.12, "#b6b4af", -284, -110, 0.365],
            [216.6, 417.9, 5.12, "#b6b4af", -128, -53, 0.055],
            [226.5, 417.9, 5.12, "#b6b4af", -176, 72, 0.314],
            [236.5, 417.9, 5.12, "#b6b3ae", -123, 34, 0.237],
            [246.5, 417.9, 5.12, "#b7b2ad", -230, -17, 0.044],
            [266.4, 417.9, 5.12, "#b9a9a4", -82, 69, 0.374],
            [296.3, 417.9, 5.12, "#c0938e", -301, 13, 0.026],
            [306.3, 417.9, 5.12, "#c28a84", -92, 84, 0.279],
            [316.3, 417.9, 5.12, "#c5827b", -297, -61, 0.185],
            [326.2, 417.9, 5.12, "#c77872", -290, -9, 0.099],
            [336.2, 417.9, 5.12, "#c97069", -220, 157, 0.206],
            [346.2, 417.9, 5.12, "#cb6860", -302, 48, 0.134],
            [356.1, 417.9, 5.12, "#ce6059", -264, 31, 0.203],
            [376.1, 417.9, 5.12, "#ac5850", -47, 245, 0.408],
            [386, 417.9, 5.12, "#af574d", -144, 272, 0.108],
            [396, 417.9, 5.12, "#b0574c", 85, 266, 0.221],
            [406, 417.9, 5.12, "#b2574a", -18, 204, 0.43],
            [416, 417.9, 5.12, "#b2594a", 31, 94, 0.124],
            [435.9, 417.9, 5.12, "#b35d4a", 254, 57, 0.286],
            [445.9, 417.9, 5.12, "#d75b3c", 212, 125, 0.441],
            [455.8, 417.9, 5.12, "#d85f3d", 123, 273, 0.004],
            [465.8, 417.9, 5.12, "#d7613d", 71, 126, 0.056],
            [475.8, 417.9, 5.12, "#d7633d", 228, -7, 0.229],
            [485.7, 417.9, 5.12, "#b4684b", 107, 13, 0.361],
            [495.7, 417.9, 5.12, "#b5694b", 160, 217, 0.397],
            [505.7, 417.9, 5.12, "#b46a4b", 220, -46, 0.315],
            [515.6, 417.9, 5.12, "#d76b3e", 287, -32, 0.34],
            [525.6, 417.9, 5.12, "#d96d40", 225, 130, 0.078],
            [535.6, 417.9, 5.12, "#d86d3f", 206, 204, 0.001],
            [545.5, 417.9, 4.05, "#b46b4b", 260, 106, 0.41],
            [575.5, 417.9, 4.05, "#b46a4a", 78, 63, 0.063],
            [585.4, 417.9, 4.05, "#b5694b", 117, 80, 0.148],
            [595.4, 417.9, 4.05, "#b4684b", 130, 0, 0.429],
            [645.2, 417.9, 4.05, "#aa5848", 220, -25, 0.348],
            [156.8, 427.9, 4.05, "#7f7c78", -134, 82, 0.238],
            [196.6, 427.9, 4.05, "#85827e", -127, -16, 0.428],
            [206.6, 427.9, 5.12, "#b6b4af", -168, 57, 0.257],
            [216.6, 427.9, 5.12, "#b6b4af", -252, 165, 0.173],
            [226.5, 427.9, 5.12, "#b6b4af", -77, 59, 0.341],
            [246.5, 427.9, 5.12, "#b6b3ae", -192, 210, 0.056],
            [276.4, 427.9, 5.12, "#baa9a3", -92, 14, 0.233],
            [286.4, 427.9, 5.12, "#bba39e", -179, 68, 0.425],
            [296.3, 427.9, 5.12, "#bd9c96", -102, 12, 0.284],
            [306.3, 427.9, 5.12, "#bf938d", -89, 108, 0.438],
            [316.3, 427.9, 5.12, "#c28b85", -97, 179, 0.424],
            [326.2, 427.9, 5.12, "#c4837c", -147, 203, 0.308],
            [336.2, 427.9, 5.12, "#c67972", -260, 15, 0.347],
            [346.2, 427.9, 5.12, "#c8716a", -158, 63, 0.185],
            [356.1, 427.9, 5.12, "#cb6961", -143, 58, 0.036],
            [366.1, 427.9, 5.12, "#cd625a", -183, 117, 0.303],
            [386, 427.9, 5.12, "#ab5851", -144, 238, 0.135],
            [396, 427.9, 5.12, "#ad574e", -13, 211, 0.301],
            [406, 427.9, 5.12, "#af564d", -8, 266, 0.408],
            [416, 427.9, 5.12, "#b0574c", 92, 244, 0.384],
            [425.9, 427.9, 5.12, "#b1574a", 99, 241, 0.279],
            [445.9, 427.9, 5.12, "#d6543c", 113, 214, 0.242],
            [465.8, 427.9, 5.12, "#d7583c", 217, 85, 0.089],
            [485.7, 427.9, 5.12, "#b3614a", 149, 88, 0.378],
            [495.7, 427.9, 5.12, "#b36249", 202, 100, 0.327],
            [505.7, 427.9, 5.12, "#b4634a", 104, 146, 0.213],
            [515.6, 427.9, 5.12, "#d7613d", 239, 113, 0.279],
            [525.6, 427.9, 5.12, "#d7613d", 177, -37, 0.119],
            [535.6, 427.9, 5.12, "#d8633e", 241, 64, 0.378],
            [565.5, 427.9, 4.05, "#b4644b", 260, 63, 0.003],
            [575.5, 427.9, 4.05, "#b4644b", 309, 6, 0.307],
            [635.3, 427.9, 4.05, "#b35a4a", 168, -34, 0.328],
            [645.2, 427.9, 4.05, "#a95648", 127, -55, 0.13],
            [156.8, 437.9, 5.12, "#b6b4af", -120, 105, 0.057],
            [166.7, 437.9, 5.12, "#b6b4af", -137, 29, 0.316],
            [176.7, 437.9, 4.05, "#85827e", -204, 177, 0.293],
            [186.7, 437.9, 5.12, "#b6b4af", -194, -67, 0.419],
            [196.6, 437.9, 5.12, "#b6b4af", -106, 39, 0.247],
            [206.6, 437.9, 5.12, "#b6b4af", -239, -63, 0.045],
            [216.6, 437.9, 5.12, "#b6b4af", -300, -7, 0.254],
            [226.5, 437.9, 5.12, "#b6b4af", -119, 88, 0.253],
            [236.5, 437.9, 5.12, "#b6b4af", -98, -25, 0.022],
            [246.5, 437.9, 5.12, "#b6b5b0", -209, 140, 0.299],
            [256.5, 437.9, 5.12, "#b7b3ae", -97, 18, 0.295],
            [266.4, 437.9, 5.12, "#b7b0ac", -116, 112, 0.021],
            [276.4, 437.9, 5.12, "#b8ada9", -84, 134, 0.126],
            [286.4, 437.9, 5.12, "#baa9a3", -114, 144, 0.278],
            [296.3, 437.9, 5.12, "#bca39e", -92, 17, 0.269],
            [306.3, 437.9, 5.12, "#bd9c96", -279, 59, 0.08],
            [316.3, 437.9, 5.12, "#bf938e", -205, 189, 0.341],
            [336.2, 437.9, 5.12, "#c3837c", -79, 96, 0.287],
            [346.2, 437.9, 5.12, "#c67a73", -241, 55, 0.435],
            [356.1, 437.9, 5.12, "#c9736c", -83, 219, 0.219],
            [366.1, 437.9, 5.12, "#a2615b", -9, 228, 0.407],
            [376.1, 437.9, 5.12, "#a55f59", -19, 154, 0.058],
            [386, 437.9, 5.12, "#a85b54", -106, 144, 0.353],
            [396, 437.9, 5.12, "#ab5952", 0, 243, 0.212],
            [406, 437.9, 5.12, "#ad584f", 56, 86, 0.165],
            [416, 437.9, 5.12, "#ae574e", 98, 139, 0.189],
            [425.9, 437.9, 5.12, "#b0564d", 174, 176, 0.007],
            [435.9, 437.9, 5.12, "#b1574b", 111, 188, 0.006],
            [445.9, 437.9, 5.12, "#d5503e", 33, 139, 0.444],
            [455.8, 437.9, 5.12, "#d6513e", 131, 261, 0.316],
            [465.8, 437.9, 5.12, "#d6523d", 76, 92, 0.002],
            [475.8, 437.9, 5.12, "#d6543d", 242, 30, 0.424],
            [485.7, 437.9, 5.12, "#b35b4a", 286, 65, 0.06],
            [505.7, 437.9, 5.12, "#b45d4a", 199, 137, 0.374],
            [515.6, 437.9, 5.12, "#d6593c", 205, -21, 0.104],
            [525.6, 437.9, 5.12, "#d7593d", 299, -52, 0.439],
            [535.6, 437.9, 5.12, "#d7593c", 83, 75, 0.129],
            [545.5, 437.9, 4.05, "#b35e4a", 242, 91, 0.16],
            [605.4, 437.9, 4.05, "#b25a4a", 130, 150, 0.38],
            [615.3, 437.9, 4.05, "#b2594a", 120, 112, 0.246],
            [625.3, 437.9, 4.05, "#b2584a", 274, 83, 0.033],
            [635.3, 437.9, 4.05, "#b1584a", 280, 66, 0.173],
            [645.2, 437.9, 4.05, "#b0564c", 192, 18, 0.384],
            [156.8, 447.8, 5.12, "#85827e", -256, -29, 0.105],
            [166.7, 447.8, 5.12, "#b6b4af", -86, 41, 0.069],
            [176.7, 447.8, 5.12, "#b6b4af", -130, -8, 0.058],
            [196.6, 447.8, 5.12, "#b6b4af", -272, 70, 0.428],
            [206.6, 447.8, 5.12, "#b6b4af", -135, 166, 0.349],
            [216.6, 447.8, 5.12, "#b6b4af", -101, -22, 0.289],
            [226.5, 447.8, 5.12, "#b6b4af", -245, -35, 0.122],
            [236.5, 447.8, 5.12, "#b6b4af", -176, 173, 0.144],
            [256.5, 447.8, 5.12, "#b6b5b0", -119, 122, 0.414],
            [266.4, 447.8, 5.12, "#b6b3ae", -69, 99, 0.445],
            [276.4, 447.8, 5.12, "#b7b0ab", -267, 141, 0.21],
            [286.4, 447.8, 5.12, "#b8ada8", -92, 170, 0.424],
            [316.3, 447.8, 5.12, "#bc9c96", -163, 262, 0.258],
            [326.2, 447.8, 5.12, "#be958e", -31, 91, 0.214],
            [336.2, 447.8, 5.12, "#c18d87", -214, 208, 0.291],
            [356.1, 447.8, 5.12, "#c67d75", -16, 122, 0.093],
            [366.1, 447.8, 5.12, "#9d6660", -79, 69, 0.448],
            [376.1, 447.8, 5.12, "#a1645e", -114, 187, 0.346],
            [386, 447.8, 5.12, "#a45f5a", -98, 171, 0.416],
            [396, 447.8, 5.12, "#a75c56", 29, 267, 0.398],
            [406, 447.8, 5.12, "#a85a55", 59, 101, 0.016],
            [416, 447.8, 5.12, "#aa5952", 17, 96, 0.084],
            [425.9, 447.8, 5.12, "#ac5850", 90, 72, 0.114],
            [435.9, 447.8, 5.12, "#ae574f", 26, 93, 0.331],
            [455.8, 447.8, 5.12, "#d55042", 172, 116, 0.277],
            [465.8, 447.8, 5.12, "#d54f40", 69, 208, 0.278],
            [475.8, 447.8, 5.12, "#d5503f", 128, 121, 0.083],
            [485.7, 447.8, 5.12, "#b2584b", 59, 73, 0.147],
            [505.7, 447.8, 5.12, "#d6523d", 117, 182, 0.433],
            [515.6, 447.8, 5.12, "#d6523d", 177, -4, 0.107],
            [525.6, 447.8, 5.12, "#d6523d", 190, 154, 0.146],
            [535.6, 447.8, 5.12, "#d6523d", 182, -11, 0.376],
            [545.5, 447.8, 4.05, "#b2594a", 166, -10, 0.148],
            [595.4, 447.8, 4.05, "#b2584a", 258, -54, 0.212],
            [605.4, 447.8, 4.05, "#b1574b", 275, -36, 0.168],
            [625.3, 447.8, 4.05, "#b0564c", 224, 202, 0.404],
            [635.3, 447.8, 4.05, "#af574d", 167, 91, 0.08],
            [645.2, 447.8, 4.05, "#ae574f", 139, 66, 0.388],
            [575.5, 457.8, 4.05, "#b0564d", 200, 218, 0.372],
            [585.4, 457.8, 4.05, "#b0574c", 201, -5, 0.354],
            [595.4, 457.8, 4.05, "#af564d", 165, 162, 0.028],
            [605.4, 457.8, 4.05, "#af564e", 196, 221, 0.346],
            [615.3, 457.8, 4.05, "#ae574e", 173, 19, 0.321],
            [625.3, 457.8, 4.05, "#ad584f", 122, 46, 0.215],
            [635.3, 457.8, 4.05, "#ab5951", 252, -41, 0.314],
            [645.2, 457.8, 4.05, "#aa5a53", 210, 167, 0.026],
            [156.8, 467.8, 4.05, "#524e4a", -106, 50, 0.45],
            [166.7, 467.8, 4.05, "#85827e", -228, 49, 0.181],
            [176.7, 467.8, 4.05, "#85827e", -252, 53, 0.423],
            [186.7, 467.8, 4.05, "#85827e", -203, 190, 0.106],
            [206.6, 467.8, 4.05, "#85827e", -116, 81, 0.209],
            [216.6, 467.8, 4.05, "#85827e", -217, 83, 0.411],
            [226.5, 467.8, 4.05, "#85827e", -207, 153, 0.311],
            [236.5, 467.8, 4.05, "#85827e", -171, -16, 0.291],
            [246.5, 467.8, 4.05, "#85827e", -123, 182, 0.098],
            [256.5, 467.8, 4.05, "#85827e", -81, 145, 0.356],
            [286.4, 467.8, 4.05, "#86827e", -95, 4, 0.408],
            [306.3, 467.8, 4.05, "#887f7b", -230, 114, 0.322],
            [316.3, 467.8, 4.05, "#8a7e79", -151, 55, 0.083],
            [326.2, 467.8, 4.05, "#8c7a76", -105, 117, 0.139],
            [336.2, 467.8, 4.05, "#8e7773", -32, 233, 0.118],
            [356.1, 467.8, 4.05, "#94716d", -119, 134, 0.167],
            [366.1, 467.8, 4.05, "#966e69", 4, 117, 0.071],
            [386, 467.8, 4.05, "#9c6864", 32, 282, 0.302],
            [396, 467.8, 4.05, "#9e6661", 97, 172, 0.069],
            [416, 467.8, 4.05, "#9a5c58", 160, 221, 0.029],
            [425.9, 467.8, 4.05, "#9c5b55", 57, 243, 0.143],
            [465.8, 467.8, 4.05, "#a15750", 174, 82, 0.392],
            [475.8, 467.8, 4.05, "#a3554e", 72, 67, 0.019],
            [505.7, 467.8, 4.05, "#ad584f", 153, 82, 0.041],
            [515.6, 467.8, 4.05, "#ad574f", 76, 62, 0.126],
            [525.6, 467.8, 4.05, "#ad574e", 253, 140, 0.113],
            [535.6, 467.8, 4.05, "#ad574e", 174, 219, 0.17],
            [565.5, 467.8, 4.05, "#ae574e", 64, 110, 0.048],
            [575.5, 467.8, 4.05, "#ac584f", 233, 124, 0.033],
            [585.4, 467.8, 4.05, "#ac584f", 226, 203, 0.148],
            [595.4, 467.8, 4.05, "#ac5851", 213, 53, 0.264],
            [605.4, 467.8, 4.05, "#ab5951", 110, 20, 0.007],
            [615.3, 467.8, 4.05, "#aa5a53", 256, -2, 0.282],
            [625.3, 467.8, 4.05, "#a95a54", 238, 89, 0.306],
            [635.3, 467.8, 4.05, "#a75c56", 175, -25, 0.378],
            [645.2, 467.8, 4.05, "#a55d57", 80, 43, 0.3],
            [156.8, 477.8, 5.12, "#85827e", -248, 28, 0.285],
            [166.7, 477.8, 5.12, "#85827e", -102, 94, 0.409],
            [176.7, 477.8, 5.12, "#85827e", -225, 134, 0.273],
            [186.7, 477.8, 5.12, "#b6b4af", -173, -18, 0.004],
            [196.6, 477.8, 5.12, "#b6b4af", -302, 31, 0.416],
            [206.6, 477.8, 5.12, "#b6b4af", -206, 75, 0.02],
            [216.6, 477.8, 5.12, "#b6b4af", -270, 92, 0.103],
            [226.5, 477.8, 5.12, "#b6b4af", -132, 56, 0.289],
            [236.5, 477.8, 5.12, "#b6b4af", -266, 23, 0.297],
            [246.5, 477.8, 5.12, "#b6b4af", -181, 237, 0.387],
            [256.5, 477.8, 5.12, "#b6b4af", -190, 140, 0.441],
            [266.4, 477.8, 5.12, "#b6b4af", -288, 103, 0.425],
            [276.4, 477.8, 5.12, "#b6b5b0", -156, 83, 0.005],
            [286.4, 477.8, 5.12, "#b6b4af", -127, 129, 0.425],
            [296.3, 477.8, 5.12, "#b6b4af", -128, 216, 0.162],
            [306.3, 477.8, 5.12, "#87817d", -90, 138, 0.071],
            [316.3, 477.8, 5.12, "#87807b", -78, 90, 0.057],
            [326.2, 477.8, 5.12, "#897e7a", -89, 266, 0.254],
            [336.2, 477.8, 5.12, "#baa7a1", -90, 220, 0.274],
            [366.1, 477.8, 5.12, "#bf958f", -82, 269, 0.068],
            [376.1, 477.8, 5.12, "#c09089", 10, 92, 0.252],
            [386, 477.8, 5.12, "#c28681", -141, 227, 0.277],
            [396, 477.8, 5.12, "#c5817b", -38, 92, 0.299],
            [406, 477.8, 5.12, "#c67b74", -81, 172, 0.345],
            [416, 477.8, 5.12, "#c7766f", 19, 298, 0.203],
            [425.9, 477.8, 5.12, "#c8726c", 55, 97, 0.088],
            [435.9, 477.8, 5.12, "#c96e67", 148, 146, 0.029],
            [445.9, 477.8, 5.12, "#a3615b", 91, 250, 0.401],
            [455.8, 477.8, 5.12, "#a55f59", 175, 242, 0.059],
            [465.8, 477.8, 5.12, "#a55e58", 133, 157, 0.284],
            [475.8, 477.8, 5.12, "#a65c56", 32, 270, 0.227],
            [505.7, 477.8, 5.12, "#d05b53", 106, 277, 0.329],
            [525.6, 477.8, 5.12, "#d05951", 202, 43, 0.43],
            [535.6, 477.8, 5.12, "#cf5950", 96, 158, 0.427],
            [545.5, 477.8, 4.05, "#aa5952", 133, 53, 0.027],
            [565.5, 477.8, 4.05, "#a95a53", 126, 43, 0.411],
            [575.5, 477.8, 4.05, "#a85a53", 146, 244, 0.238],
            [605.4, 477.8, 4.05, "#a75c57", 293, -15, 0.069],
            [615.3, 477.8, 4.05, "#a65e58", 99, 93, 0.131],
            [625.3, 477.8, 4.05, "#a46059", 66, 99, 0.158],
            [635.3, 477.8, 4.05, "#a2615b", 208, 81, 0.28],
            [645.2, 477.8, 4.05, "#a2625d", 143, 91, 0.366],
            [156.8, 487.7, 5.12, "#85827e", -102, -11, 0.326],
            [166.7, 487.7, 4.05, "#85827e", -143, 93, 0.032],
            [196.6, 487.7, 5.12, "#b6b4af", -58, 75, 0.208],
            [206.6, 487.7, 5.12, "#b6b4af", -122, 3, 0.34],
            [216.6, 487.7, 5.12, "#b6b4af", -155, 206, 0.192],
            [236.5, 487.7, 5.12, "#b6b4af", -118, 149, 0.163],
            [246.5, 487.7, 5.12, "#b6b4af", -145, 100, 0.078],
            [256.5, 487.7, 5.12, "#b6b4af", -299, 65, 0.424],
            [266.4, 487.7, 5.12, "#b6b4af", -221, 17, 0.313],
            [286.4, 487.7, 5.12, "#b6b4af", -89, 21, 0.001],
            [296.3, 487.7, 5.12, "#b6b4af", -210, 83, 0.245],
            [306.3, 487.7, 5.12, "#86827e", -102, 79, 0.358],
            [316.3, 487.7, 5.12, "#87817d", -246, 128, 0.021],
            [326.2, 487.7, 5.12, "#b8afaa", -200, 195, 0.177],
            [336.2, 487.7, 5.12, "#b8ada8", -56, 104, 0.206],
            [346.2, 487.7, 5.12, "#b9a9a3", -186, 142, 0.245],
            [376.1, 487.7, 5.12, "#907672", -88, 296, 0.013],
            [396, 487.7, 5.12, "#95706b", -14, 93, 0.388],
            [406, 487.7, 5.12, "#976e69", 62, 93, 0.257],
            [416, 487.7, 5.12, "#996b66", -82, 224, 0.164],
            [435.9, 487.7, 5.12, "#9b6863", 8, 104, 0.262],
            [455.8, 487.7, 5.12, "#9f655f", 63, 198, 0.219],
            [465.8, 487.7, 5.12, "#a1635c", 8, 142, 0.069],
            [475.8, 487.7, 5.12, "#a2615c", 78, 189, 0.17],
            [485.7, 487.7, 5.12, "#cb6962", 41, 100, 0.41],
            [495.7, 487.7, 5.12, "#cc6761", 129, 199, 0.062],
            [505.7, 487.7, 5.12, "#cc665f", 210, 131, 0.061],
            [515.6, 487.7, 5.12, "#cc655d", 106, 201, 0.358],
            [525.6, 487.7, 5.12, "#cc645d", 221, 116, 0.061],
            [535.6, 487.7, 5.12, "#cd655d", 170, 248, 0.309],
            [545.5, 487.7, 4.05, "#a65e58", 87, 33, 0.351],
            [565.5, 487.7, 4.05, "#a45f58", 113, 244, 0.346],
            [575.5, 487.7, 4.05, "#a45f59", 229, 80, 0.083],
            [585.4, 487.7, 4.05, "#a3605a", 53, 80, 0.225],
            [605.4, 487.7, 4.05, "#a2625c", 124, 226, 0.247],
            [615.3, 487.7, 4.05, "#a0635e", 152, 219, 0.326],
            [625.3, 487.7, 4.05, "#a0645e", 121, 131, 0.298],
            [635.3, 487.7, 4.05, "#9e6660", 148, -8, 0.309],
            [156.8, 497.7, 4.05, "#85827e", -190, 203, 0.014],
            [176.7, 497.7, 5.12, "#b6b4af", -223, 204, 0.104],
            [186.7, 497.7, 4.05, "#85827e", -253, 166, 0.314],
            [206.6, 497.7, 5.12, "#b6b4af", -156, 196, 0.333],
            [216.6, 497.7, 5.12, "#b6b4af", -125, 116, 0.032],
            [226.5, 497.7, 5.12, "#b6b4af", -89, 55, 0.327],
            [236.5, 497.7, 5.12, "#b6b4af", -111, 185, 0.438],
            [246.5, 497.7, 5.12, "#b6b4af", -203, 203, 0.237],
            [256.5, 497.7, 5.12, "#b6b4af", -106, 46, 0.181],
            [286.4, 497.7, 5.12, "#b6b4af", -123, 172, 0.273],
            [296.3, 497.7, 5.12, "#b6b4af", -211, 152, 0.206],
            [306.3, 497.7, 5.12, "#b6b5b0", -51, 90, 0.34],
            [326.2, 497.7, 5.12, "#b7b2ad", -102, 257, 0.205],
            [336.2, 497.7, 5.12, "#b8b0ab", -77, 170, 0.228],
            [356.1, 497.7, 5.12, "#b9aaa5", -56, 136, 0.243],
            [366.1, 497.7, 5.12, "#8b7c77", -23, 221, 0.172],
            [386, 497.7, 5.12, "#8f7873", -17, 190, 0.067],
            [396, 497.7, 5.12, "#917571", -15, 99, 0.363],
            [406, 497.7, 5.12, "#92736f", -12, 121, 0.265],
            [416, 497.7, 5.12, "#95716b", -35, 161, 0.273],
            [425.9, 497.7, 5.12, "#966f6a", 74, 213, 0.363],
            [435.9, 497.7, 5.12, "#976e69", 51, 78, 0.296],
            [445.9, 497.7, 5.12, "#9a6b66", 160, 212, 0.055],
            [455.8, 497.7, 5.12, "#9a6a65", -27, 248, 0.173],
            [475.8, 497.7, 5.12, "#c67872", 185, 195, 0.247],
            [485.7, 497.7, 5.12, "#c7766f", 130, 114, 0.042],
            [495.7, 497.7, 5.12, "#c8746d", 179, 201, 0.056],
            [505.7, 497.7, 5.12, "#c9726a", 135, 181, 0.283],
            [515.6, 497.7, 5.12, "#c8716a", 75, 222, 0.339],
            [525.6, 497.7, 5.12, "#c87069", 142, 190, 0.441],
            [535.6, 497.7, 5.12, "#c97068", 226, 31, 0.091],
            [545.5, 497.7, 4.05, "#a0635e", 266, 40, 0.235],
            [565.5, 497.7, 4.05, "#a0645e", 271, 88, 0.215],
            [575.5, 497.7, 4.05, "#a0645e", 135, 71, 0.416],
            [585.4, 497.7, 4.05, "#9e6560", 266, 29, 0.265],
            [595.4, 497.7, 4.05, "#9e6761", 236, 55, 0.275],
            [605.4, 497.7, 4.05, "#9d6763", 198, 78, 0.415],
            [615.3, 497.7, 4.05, "#9c6864", 196, 105, 0.16],
            [625.3, 497.7, 4.05, "#9b6a65", 124, -2, 0.102],
            [166.7, 507.7, 5.12, "#b6b4af", -189, 87, 0.27],
            [176.7, 507.7, 6.18, "#b6b4af", -123, 61, 0.136],
            [216.6, 507.7, 5.12, "#b6b4af", -202, 50, 0.17],
            [236.5, 507.7, 5.12, "#b6b4af", -85, 57, 0.182],
            [246.5, 507.7, 5.12, "#b6b4af", -185, 30, 0.015],
            [256.5, 507.7, 5.12, "#b6b4af", -112, 32, 0.336],
            [276.4, 507.7, 5.12, "#b6b4af", -119, 203, 0.088],
            [286.4, 507.7, 5.12, "#b6b4af", -109, 217, 0.307],
            [296.3, 507.7, 5.12, "#b6b4af", -89, 277, 0.118],
            [316.3, 507.7, 5.12, "#b6b5b0", -88, 252, 0.033],
            [326.2, 507.7, 5.12, "#b6b3af", 8, 288, 0.05],
            [336.2, 507.7, 5.12, "#b6b3ae", -44, 114, 0.05],
            [346.2, 507.7, 5.12, "#b7b2ad", -25, 190, 0.171],
            [356.1, 507.7, 5.12, "#b8afaa", -83, 185, 0.25],
            [376.1, 507.7, 5.12, "#8a7d7a", -41, 200, 0.203],
            [386, 507.7, 5.12, "#8b7b76", -104, 156, 0.428],
            [396, 507.7, 5.12, "#8d7975", -151, 239, 0.031],
            [406, 507.7, 5.12, "#8e7873", 28, 159, 0.019],
            [416, 507.7, 5.12, "#907671", 188, 236, 0.41],
            [435.9, 507.7, 5.12, "#93736e", 71, 76, 0.177],
            [445.9, 507.7, 5.12, "#94716c", 8, 90, 0.22],
            [455.8, 507.7, 5.12, "#96706b", 5, 90, 0.007],
            [465.8, 507.7, 5.12, "#976e69", 185, 132, 0.078],
            [475.8, 507.7, 5.12, "#c3857e", 155, 140, 0.004],
            [485.7, 507.7, 5.12, "#c4837b", 9, 112, 0.295],
            [515.6, 507.7, 5.12, "#c57d78", 194, 202, 0.222],
            [525.6, 507.7, 5.12, "#c67c75", 95, 237, 0.353],
            [535.6, 507.7, 5.12, "#c67c77", 97, 16, 0.414],
            [545.5, 507.7, 4.05, "#9b6963", 102, 101, 0.446],
            [565.5, 507.7, 4.05, "#9b6a65", 113, 85, 0.379],
            [575.5, 507.7, 4.05, "#9a6b65", 305, 11, 0.291],
            [595.4, 507.7, 4.05, "#996c67", 124, 39, 0.412],
            [605.4, 507.7, 4.05, "#986d68", 72, 114, 0.419],
            [156.8, 517.7, 4.05, "#85827e", -137, 47, 0.394],
            [166.7, 517.7, 4.05, "#85827e", -97, 89, 0.281],
            [176.7, 517.7, 5.12, "#b6b4af", -105, 152, 0.002],
            [186.7, 517.7, 4.05, "#85827e", -211, 188, 0.36],
            [206.6, 517.7, 5.12, "#b6b4af", -92, 58, 0.387],
            [226.5, 517.7, 5.12, "#b6b4af", -233, 100, 0.04],
            [246.5, 517.7, 5.12, "#b6b4af", -210, 163, 0.06],
            [256.5, 517.7, 5.12, "#b6b4af", -50, 124, 0.158],
            [266.4, 517.7, 5.12, "#b6b4af", -280, 82, 0.116],
            [276.4, 517.7, 5.12, "#b6b4af", -46, 148, 0.196],
            [286.4, 517.7, 5.12, "#b6b4af", -33, 245, 0.03],
            [296.3, 517.7, 5.12, "#b6b4af", -42, 304, 0.295],
            [306.3, 517.7, 5.12, "#b6b4af", -101, 40, 0.158],
            [316.3, 517.7, 5.12, "#b6b4af", -197, 115, 0.402],
            [326.2, 517.7, 5.12, "#b6b4af", -96, 125, 0.289],
            [336.2, 517.7, 5.12, "#b6b5b0", -30, 156, 0.115],
            [356.1, 517.7, 5.12, "#b6b3ae", -85, 149, 0.037],
            [366.1, 517.7, 5.12, "#87817d", -57, 147, 0.055],
            [376.1, 517.7, 5.12, "#88807a", -125, 147, 0.41],
            [386, 517.7, 5.12, "#887e7b", -35, 140, 0.339],
            [396, 517.7, 5.12, "#8a7e79", 76, 151, 0.328],
            [406, 517.7, 5.12, "#8b7c77", 46, 106, 0.209],
            [416, 517.7, 5.12, "#8c7a76", -20, 174, 0.394],
            [425.9, 517.7, 5.12, "#8d7975", 42, 100, 0.119],
            [435.9, 517.7, 5.12, "#8f7873", -1, 130, 0.118],
            [445.9, 517.7, 5.12, "#907771", 11, 199, 0.374],
            [455.8, 517.7, 5.12, "#917570", 78, 178, 0.37],
            [485.7, 517.7, 5.12, "#c08f8a", 157, 100, 0.183],
            [515.6, 517.7, 5.12, "#c28983", 132, 39, 0.235],
            [525.6, 517.7, 5.12, "#c18a84", 55, 190, 0.262],
            [535.6, 517.7, 5.12, "#c18983", 198, 198, 0.214],
            [545.5, 517.7, 4.05, "#966f6a", 217, 145, 0.329],
            [575.5, 517.7, 4.05, "#95706c", 188, 95, 0.246],
            [585.4, 517.7, 4.05, "#95716b", 275, 85, 0.393],
            [196.6, 527.6, 5.12, "#b6b4af", -211, 187, 0.212],
            [206.6, 527.6, 5.12, "#b6b4af", -141, 58, 0.359],
            [226.5, 527.6, 5.12, "#b6b4af", -113, 72, 0.3],
            [236.5, 527.6, 5.12, "#b6b4af", -225, 82, 0.16],
            [256.5, 527.6, 5.12, "#b6b4af", -99, 70, 0.383],
            [276.4, 527.6, 5.12, "#b6b4af", -113, 37, 0.124],
            [286.4, 527.6, 5.12, "#b6b4af", -17, 187, 0.107],
            [296.3, 527.6, 5.12, "#b6b4af", -192, 179, 0.084],
            [306.3, 527.6, 5.12, "#b6b4af", -139, 95, 0.28],
            [316.3, 527.6, 5.12, "#b6b4af", -149, 156, 0.351],
            [336.2, 527.6, 5.12, "#b6b4af", -155, 210, 0.049],
            [346.2, 527.6, 5.12, "#b6b4af", -5, 290, 0.326],
            [356.1, 527.6, 5.12, "#b6b4af", 37, 237, 0.245],
            [366.1, 527.6, 5.12, "#86827e", -111, 135, 0.159],
            [376.1, 527.6, 5.12, "#86817e", 59, 144, 0.088],
            [386, 527.6, 5.12, "#87817d", -72, 295, 0.175],
            [396, 527.6, 5.12, "#88807b", -36, 184, 0.305],
            [406, 527.6, 5.12, "#877f7b", -16, 226, 0.332],
            [425.9, 527.6, 5.12, "#8a7d79", 70, 202, 0.333],
            [435.9, 527.6, 5.12, "#8a7c77", -2, 127, 0.24],
            [475.8, 527.6, 5.12, "#8f7872", 153, 148, 0.189],
            [485.7, 527.6, 5.12, "#be9b95", 93, 215, 0.411],
            [505.7, 527.6, 5.12, "#be9791", 23, 142, 0.076],
            [535.6, 527.6, 5.12, "#bf958f", 76, 295, 0.162],
            [545.5, 527.6, 4.05, "#927470", 222, 155, 0.001],
            [565.5, 527.6, 4.05, "#917570", 74, 62, 0.232],
            [156.8, 537.6, 5.12, "#b6b4af", -57, 93, 0.274],
            [166.7, 537.6, 5.12, "#b6b4af", -140, 139, 0.069],
            [186.7, 537.6, 5.12, "#b6b4af", -101, 32, 0.303],
            [196.6, 537.6, 5.12, "#b6b4af", -128, 177, 0.047],
            [216.6, 537.6, 5.12, "#b6b4af", -237, 190, 0.197],
            [226.5, 537.6, 5.12, "#b6b4af", -283, 54, 0.188],
            [236.5, 537.6, 5.12, "#b6b4af", -119, 224, 0.041],
            [246.5, 537.6, 5.12, "#b6b4af", -65, 252, 0.186],
            [266.4, 537.6, 5.12, "#b6b4af", -98, 82, 0.219],
            [276.4, 537.6, 5.12, "#b6b4af", -69, 70, 0.307],
            [286.4, 537.6, 5.12, "#b6b4af", -120, 142, 0.279],
            [296.3, 537.6, 5.12, "#b6b4af", -26, 163, 0.02],
            [306.3, 537.6, 5.12, "#b6b4af", -31, 98, 0.338],
            [316.3, 537.6, 5.12, "#b6b4af", 7, 141, 0.017],
            [326.2, 537.6, 5.12, "#b6b4af", -109, 158, 0.238],
            [336.2, 537.6, 5.12, "#b6b4af", -1, 216, 0.105],
            [346.2, 537.6, 5.12, "#b6b4af", -85, 257, 0.317],
            [356.1, 537.6, 5.12, "#b6b4af", -38, 86, 0.314],
            [366.1, 537.6, 5.12, "#85827e", 19, 200, 0.152],
            [376.1, 537.6, 5.12, "#86827e", -156, 243, 0.295],
            [386, 537.6, 5.12, "#86827e", -169, 249, 0.271],
            [396, 537.6, 5.12, "#85817d", -74, 152, 0.061],
            [406, 537.6, 5.12, "#86817d", -88, 251, 0.348],
            [425.9, 537.6, 5.12, "#88807b", -91, 202, 0.179],
            [445.9, 537.6, 5.12, "#8a7e79", 26, 243, 0.155],
            [455.8, 537.6, 5.12, "#8a7d79", 84, 156, 0.259],
            [475.8, 537.6, 5.12, "#8b7c76", 105, 192, 0.043],
            [485.7, 537.6, 5.12, "#baa49f", 2, 239, 0.252],
            [495.7, 537.6, 5.12, "#baa49d", 179, 83, 0.362],
            [505.7, 537.6, 5.12, "#bba29d", 38, 302, 0.415],
            [515.6, 537.6, 5.12, "#bba19c", 29, 236, 0.336],
            [525.6, 537.6, 5.12, "#bba09b", 98, 171, 0.056],
            [535.6, 537.6, 5.12, "#bca09b", 44, 126, 0.316],
            [545.5, 537.6, 4.05, "#8e7975", 35, 179, 0.169],
            [156.8, 547.6, 4.05, "#85827e", -103, 119, 0.268],
            [176.7, 547.6, 4.05, "#85827e", -71, 165, 0.018],
            [186.7, 547.6, 4.05, "#85827e", -250, 133, 0.169],
            [196.6, 547.6, 4.05, "#85827e", -54, 136, 0.144],
            [206.6, 547.6, 4.05, "#85827e", -187, 186, 0.105],
            [226.5, 547.6, 4.05, "#85827e", -175, 165, 0.303],
            [236.5, 547.6, 4.05, "#85827e", -222, 209, 0.043],
            [246.5, 547.6, 4.05, "#85827e", -288, 89, 0.123],
            [256.5, 547.6, 4.05, "#85827e", -196, 60, 0.022],
            [266.4, 547.6, 4.05, "#85827e", -170, 60, 0.028],
            [286.4, 547.6, 4.05, "#85827e", -118, 145, 0.332],
            [306.3, 547.6, 4.05, "#85827e", -78, 265, 0.416],
            [316.3, 547.6, 4.05, "#85827e", -107, 124, 0.049],
            [326.2, 547.6, 4.05, "#85827e", 12, 101, 0.288],
            [346.2, 547.6, 4.05, "#85827e", 27, 127, 0.434],
            [356.1, 547.6, 4.05, "#85827e", -98, 218, 0.261],
            [366.1, 547.6, 4.05, "#85827e", 57, 155, 0.013],
            [376.1, 547.6, 4.05, "#55514d", -29, 114, 0.159],
            [386, 547.6, 4.05, "#55514d", 31, 250, 0.107],
            [416, 547.6, 4.05, "#86827d", 106, 216, 0.25],
            [435.9, 547.6, 4.05, "#86807c", 176, 180, 0.16],
            [445.9, 547.6, 4.05, "#87807c", 173, 216, 0.148],
            [455.8, 547.6, 4.05, "#88807b", 73, 97, 0.133],
            [465.8, 547.6, 4.05, "#88807b", 23, 304, 0.136],
            [475.8, 547.6, 4.05, "#887e7a", 25, 118, 0.077],
            [485.7, 547.6, 4.05, "#897e7a", 235, 190, 0.249],
            [495.7, 547.6, 4.05, "#8a7e79", 132, 99, 0.433],
            [515.6, 547.6, 4.05, "#8a7d79", 62, 217, 0.155],
            [525.6, 547.6, 4.05, "#8a7d79", 20, 202, 0.413],
            [535.6, 547.6, 4.05, "#8a7d7a", 273, 132, 0.08],
            [545.5, 547.6, 4.05, "#8a7d7a", 47, 230, 0.159],
          ],
        },
        tK = "(prefers-reduced-motion: reduce)",
        tQ = "Try a call",
        tJ = {
          "Claude Code": new URL(
            "../assets/brand/integrations/claude.svg?no-inline",
            import.meta.url,
          ).href,
          Cursor: new URL(
            "../assets/brand/integrations/cursor.svg?no-inline",
            import.meta.url,
          ).href,
          "Claude & ChatGPT": new URL(
            "../assets/brand/integrations/openai.svg?no-inline",
            import.meta.url,
          ).href,
        };
      function tZ(e) {
        let t = window.matchMedia(tK);
        return (
          t.addEventListener("change", e),
          () => t.removeEventListener("change", e)
        );
      }
      function t1({ copy: e = eN.m.copy }) {
        let a = (0, tW.useSiteUrls)(),
          n = (0, tW.useAgentConnect)(),
          { data: o } = (0, tI.f)(
            r.r.catalog.publisher.queryOptions({ input: { slug: c.r.api } }),
          ),
          s = o?.endpoints.find(({ path: e }) => e === c.r.path),
          d = o && s ? (0, tV.u)(o, s, a).quote : void 0,
          { data: u, isPending: b } = (0, tI.f)(
            r.r.catalog.publisher.queryOptions({ input: { slug: c.P.api } }),
          ),
          m =
            u?.endpoints.find(({ path: e }) => e === c.P.path) ??
            u?.endpoints[0],
          g = m
            ? {
                ...m,
                queryParams: m.queryParams.map((e) =>
                  "domain" === e.name ? { ...e, example: "orthogonal.com" } : e,
                ),
              }
            : null,
          v = ((e) => {
            let { api: t, path: a } = c.r,
              i = "Find the work email for Patrick Collison at stripe.com";
            return {
              "Claude Code": [
                "# Connect once",
                e.command,
                "# Sign in once, then ask:",
                `#   "${i}"`,
                "#   It searches the catalog, picks an API and pays per call.",
              ],
              Cursor: [
                "// Settings → MCP → Add Server",
                `{ "${e.name}": { "url": "${e.url}" } }`,
                "// Sign in once, then ask in a new chat:",
                `//   "${i}"`,
                "//   It searches the catalog, picks an API and pays per call.",
              ],
              "Claude & ChatGPT": [
                "# Claude: Settings → Connectors → Add custom connector",
                "# ChatGPT: Settings → Apps → Create, in Developer mode",
                e.url,
                "# Sign in once, then ask:",
                `#   "${i}"`,
              ],
              SDK: [
                'import Orthogonal from "@orth/sdk";  // npm install @orth/sdk',
                "const orthogonal = new Orthogonal({ apiKey: process.env.ORTHOGONAL_API_KEY });",
                `const result = await orthogonal.run({ api: "${t}", path: "${a}",`,
                '  query: { domain: "stripe.com", first_name: "Patrick", last_name: "Collison" },',
                "});",
              ],
              CLI: [
                "npm install -g @orth/cli",
                "orth login  # once, in your browser",
                'orth search "find a work email"',
                `orth run ${t} ${a} -q domain=stripe.com \\`,
                "  -q first_name=Patrick -q last_name=Collison",
              ],
            };
          })(n),
          x = [...Object.keys(v), tQ],
          [y, w] = (0, i.useState)(() => x[0] ?? ""),
          [M, C] = (0, i.useState)(y),
          [k, E] = (0, i.useState)(!1),
          N = (0, i.useRef)(0),
          j = (0, i.useSyncExternalStore)(
            tZ,
            () => window.matchMedia(tK).matches,
            () => !1,
          ),
          F = (0, i.useId)(),
          R = (e) => `${F}-tab-${x.indexOf(e)}`,
          S = `${F}-panel`,
          P = `${F}-title`,
          L = (0, i.useRef)(null),
          _ = (0, i.useRef)(null),
          T = (0, i.useRef)(null),
          D = (0, i.useRef)([]),
          O = (0, i.useRef)(new Map()),
          H = (0, i.useRef)((0, h.y)(0 / 0)),
          $ = (0, i.useRef)(0),
          I = (0, i.useRef)(0),
          B = (e) => {
            let t = O.current.get(e);
            return t ? t.offsetLeft + t.offsetWidth / 2 - 5 : 0;
          },
          z = () => {
            let e = T.current;
            e &&
              (e.style.transform = `translate3d(${H.current.x.toFixed(2)}px, 0, 0)`);
          },
          G = () => {
            let e = _.current,
              t = A(window.innerWidth);
            return {
              pitch: t,
              phase:
                (((document.documentElement.clientWidth -
                  t / 2 -
                  (e?.getBoundingClientRect().left ?? 0)) %
                  t) +
                  t) %
                t,
            };
          },
          q = () => {
            let e = _.current;
            if (!e) return;
            let { pitch: t, phase: a } = G();
            (e.style.setProperty("--pitch", `${t}px`),
              e.style.setProperty("--phase", `${a}px`));
          },
          V = (e) => {
            let t = D.current[I.current % 4];
            if (((I.current += 1), t)) {
              for (let a of ((t.style.transform = `translate3d(${(e - 5).toFixed(2)}px, 0, 0)`),
              t.getAnimations()))
                a.cancel();
              t.animate([{ opacity: 0.55 }, { opacity: 0 }], {
                duration: 280,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "forwards",
              });
            }
          };
        (0, i.useLayoutEffect)(() => {
          let e = H.current,
            t = B(y);
          if ((cancelAnimationFrame($.current), Number.isNaN(e.x) || j)) {
            ((e.x = t), (e.v = 0), z());
            return;
          }
          let { pitch: a, phase: i } = G(),
            r = e.x + 5,
            n = performance.now() - 1e3 / 60,
            l = (o) => {
              let s = Math.min(Math.max((o - n) / 1e3, 0), 1 / 30);
              ((n = Math.max(n, o)), (0, h.R)(e, t, 16, s));
              let c = 0.05 > Math.abs(e.x - t) && 0.5 > Math.abs(e.v);
              (c && ((e.x = t), (e.v = 0)), z());
              let d = e.x + 5;
              if (d > r) {
                let e = Math.floor((r - i) / a) + 1;
                for (let t = e; i + t * a <= d; t += 1) V(i + t * a);
              } else if (d < r) {
                let e = Math.ceil((r - i) / a) - 1;
                for (let t = e; i + t * a >= d; t -= 1) V(i + t * a);
              }
              ((r = d), c || ($.current = requestAnimationFrame(l)));
            };
          return (l(performance.now()), () => cancelAnimationFrame($.current));
        }, [y, j]);
        let W = (0, i.useEffectEvent)(() => {
          (cancelAnimationFrame($.current),
            (H.current.x = B(y)),
            (H.current.v = 0),
            z(),
            q());
        });
        ((0, i.useEffect)(() => {
          let e = _.current,
            t = L.current;
          if (!e || !t) return;
          W();
          let a = new ResizeObserver(() => W());
          a.observe(e);
          let i = () => q(),
            r = () => W();
          return (
            t.addEventListener("scroll", i, { passive: !0 }),
            window.addEventListener("resize", r),
            document.fonts.ready.then(() => W()),
            () => {
              (a.disconnect(),
                t.removeEventListener("scroll", i),
                window.removeEventListener("resize", r));
            }
          );
        }, []),
          (0, i.useEffect)(() => () => window.clearTimeout(N.current), []));
        let Y = (e) => {
          if (e !== y) {
            if ((w(e), window.clearTimeout(N.current), j)) {
              (C(e), E(!1));
              return;
            }
            (E(!0),
              (N.current = window.setTimeout(() => {
                (C(e), E(!1));
              }, 80)));
          }
        };
        return (0, t.jsxs)("section", {
          id: "landing-connect",
          className: `${tY.default.plug} page-column px-4 sm:px-10`,
          "aria-labelledby": P,
          children: [
            (0, t.jsx)(tX, {}),
            (0, t.jsxs)("div", {
              className: tY.default.grid,
              children: [
                (0, t.jsxs)("div", {
                  className: tY.default.head,
                  "data-d1-clear": "doc",
                  children: [
                    (0, t.jsx)(tj, { art: tU, className: tY.default.plugArt }),
                    (0, t.jsx)("h2", {
                      id: P,
                      className: tY.default.title,
                      children: e.plugTitle,
                    }),
                    (0, t.jsx)("p", {
                      className: tY.default.lede,
                      children: e.plugBody,
                    }),
                    (0, t.jsxs)(l.Link, {
                      href: "/docs/mcp/setup",
                      prefetch: !1,
                      className: tY.default.docs,
                      children: [
                        e.plugLabel,
                        (0, t.jsx)(f.f, {
                          className: tY.default.arrow,
                          size: 14,
                          "aria-hidden": !0,
                        }),
                      ],
                    }),
                  ],
                }),
                (0, t.jsxs)("div", {
                  className: tY.default.stage,
                  "data-d1-clear": "doc",
                  "data-plug-stage": !0,
                  children: [
                    (0, t.jsx)("div", {
                      ref: L,
                      className: tY.default.scroller,
                      children: (0, t.jsxs)("div", {
                        ref: _,
                        className: tY.default.rail,
                        role: "tablist",
                        "aria-label": "Where you build",
                        onKeyDown: (e) => {
                          let t = x.length,
                            a = x.indexOf(y),
                            i =
                              "ArrowRight" === e.key
                                ? (a + 1) % t
                                : "ArrowLeft" === e.key
                                  ? (a - 1 + t) % t
                                  : "Home" === e.key
                                    ? 0
                                    : "End" === e.key
                                      ? t - 1
                                      : -1,
                            r = x[i];
                          i < 0 ||
                            void 0 === r ||
                            (e.preventDefault(),
                            Y(r),
                            O.current.get(r)?.focus());
                        },
                        children: [
                          (0, t.jsx)("span", {
                            className: tY.default.wire,
                            "aria-hidden": !0,
                          }),
                          x.map((e) =>
                            (0, t.jsxs)(
                              ef.K,
                              {
                                ref: (t) => {
                                  t ? O.current.set(e, t) : O.current.delete(e);
                                },
                                type: "button",
                                variant: "ghost",
                                role: "tab",
                                id: R(e),
                                "aria-selected": e === y,
                                "aria-controls": S,
                                tabIndex: e === y ? 0 : -1,
                                className: `h-auto rounded-none font-normal active:not-aria-[haspopup]:translate-y-0 ${tY.default.tab}`,
                                onClick: () => Y(e),
                                children: [
                                  (0, t.jsx)(p, {
                                    size: 6,
                                    inset: 0,
                                    line: !0,
                                    className: tY.default.tabBrackets,
                                  }),
                                  tJ[e]
                                    ? (0, t.jsx)("span", {
                                        className: tY.default.tabIcon,
                                        style: { maskImage: `url(${tJ[e]})` },
                                        "aria-hidden": !0,
                                      })
                                    : "SDK" === e
                                      ? (0, t.jsx)(tB.f, {
                                          className: tY.default.tabIcon,
                                          "aria-hidden": !0,
                                        })
                                      : "CLI" === e
                                        ? (0, t.jsx)(tG.f, {
                                            className: tY.default.tabIcon,
                                            "aria-hidden": !0,
                                          })
                                        : (0, t.jsx)(tz.f, {
                                            className: tY.default.tabIcon,
                                            "aria-hidden": !0,
                                          }),
                                  e,
                                ],
                              },
                              e,
                            ),
                          ),
                          Array.from({ length: 4 }, (e, a) =>
                            (0, t.jsx)(
                              "span",
                              {
                                ref: (e) => {
                                  D.current[a] = e;
                                },
                                className: tY.default.bead,
                                "aria-hidden": !0,
                              },
                              a,
                            ),
                          ),
                          (0, t.jsx)("span", {
                            ref: T,
                            className: tY.default.chip,
                            "aria-hidden": !0,
                          }),
                        ],
                      }),
                    }),
                    (0, t.jsxs)("div", {
                      role: "tabpanel",
                      id: S,
                      "aria-labelledby": R(y),
                      className: tY.default.frame,
                      children: [
                        (0, t.jsx)(p, { size: 10, inset: -4 }),
                        (0, t.jsx)("div", {
                          className: tY.default.swap,
                          "data-leaving": k ? "" : void 0,
                          children: (0, t.jsx)(
                            "div",
                            {
                              className: tY.default.enter,
                              children:
                                M === tQ
                                  ? u && g
                                    ? (0, t.jsx)(tV.X, {
                                        publisher: u,
                                        endpoint: g,
                                      })
                                    : (0, t.jsx)("p", {
                                        role: "status",
                                        className:
                                          "px-3 py-4 text-sm text-(--d1-fg-dim)",
                                        children: b
                                          ? "Loading example call…"
                                          : "The example call is unavailable. Explore the catalog to try an API.",
                                      })
                                  : (0, t.jsx)(tq.v, {
                                      lines: v[M] ?? [],
                                      tabs: [M],
                                      language: tm[M],
                                      dense: !0,
                                      quote: d,
                                    }),
                            },
                            M,
                          ),
                        }),
                      ],
                    }),
                    (0, t.jsx)("p", {
                      className: tY.default.payer,
                      children: n.payer,
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
      let t2 = "(prefers-reduced-motion: reduce)";
      function t5(e) {
        let t = window.matchMedia(t2);
        return (
          t.addEventListener("change", e),
          () => t.removeEventListener("change", e)
        );
      }
      e.s(
        [
          "D1Landing",
          0,
          function ({
            signedIn: e,
            copy: f = eN.m.copy,
            categorySlugs: b,
            categoryLabels: m = eN.m.categoryLabels,
          }) {
            let p = (0, n.useAssistantShortcut)(),
              { data: g } = (0, a.f)(r.r.catalog.publishers.queryOptions()),
              { data: v } = (0, a.f)(r.r.catalog.categories.queryOptions()),
              x = (function (e, t) {
                let a = new Set(d),
                  i = [];
                for (let r of e) {
                  if (!a.has(r.slug)) continue;
                  let e = (0, s.f)(r);
                  e &&
                    i.push({
                      slug: r.slug,
                      name: r.name,
                      blurb: r.blurb,
                      endpoints: r.endpoints,
                      price: (0, c.D)(r),
                      category: (0, c.c)(r, t)?.name ?? null,
                      logo: e,
                      href: (0, c.f)(r),
                      index: i.length,
                    });
                }
                return i;
              })(
                g,
                v.map((e) => ({ ...e, name: m[e.slug]?.trim() || e.name })),
              ),
              y = g.reduce((e, t) => e + t.endpoints, 0),
              { theme: w } = (0, eR.useD1Theme)(),
              M = (0, i.useSyncExternalStore)(
                t5,
                () => window.matchMedia(t2).matches,
                () => !1,
              ),
              [A, C] = (0, i.useState)(null),
              [k, E] = (0, i.useState)(null),
              [N, j] = (0, i.useState)(null),
              F = (0, i.useRef)({ x: 0, y: 0 }),
              R = (0, i.useRef)(!1),
              P = (0, i.useRef)(null),
              L = (0, i.useRef)(""),
              _ = (0, i.useRef)(null),
              T = (0, i.useRef)(null),
              D = (0, i.useRef)(null),
              O = (0, i.useRef)(null),
              H = () => E((e) => (e?.open ? { ...e, open: !1 } : e)),
              $ = () => {
                ((R.current = !1),
                  A?.holdFocus(!1),
                  A?.release(),
                  H(),
                  N && (P.current = N.key),
                  j((e) => (e ? { ...e, open: !1 } : e)));
              },
              I = k?.open ? k : N,
              B = I?.open ?? !1,
              z = (0, i.useEffectEvent)((e) => {
                if (0 === x.length || (R.current && e.scene < 0.02)) return;
                let t = M ? 2 : 0.75 * e.time,
                  a = t % 16 < 8 ? 0 : 1,
                  i = (t + 8 * a) % 16,
                  r = M ? 1 : (0, h.j)(0, 0.8, i) * (1 - (0, h.j)(5.5, 6.3, i)),
                  n = Math.floor(t / 16),
                  l = `${n}-${a}`,
                  o = window.innerWidth,
                  s = 0 === a ? e.chip : e.secondaryFocus;
                ((F.current.x = s.x), (F.current.y = s.y));
                let c = { x: Math.round(s.x), y: Math.round(s.y) },
                  d =
                    e.scene < 0.02 &&
                    i < 5.5 &&
                    r > 0.15 &&
                    P.current !== l &&
                    c.x > 0 &&
                    c.x < o &&
                    c.y > 84 &&
                    c.y < window.innerHeight,
                  u = `${l}:${d}`;
                if (L.current === u) return;
                L.current = u;
                let f = x[(2 * n + a) % x.length];
                d && f
                  ? j({
                      key: l,
                      api: f,
                      anchor: c,
                      color: "dark" === w ? "#f7f6f1" : "#3d3833",
                      open: !0,
                    })
                  : j((e) => (e?.open ? { ...e, open: !1 } : e));
              });
            (0, i.useEffect)(
              () => ((L.current = ""), A?.subscribe((e) => z(e))),
              [A, M, w],
            );
            let G = (0, i.useEffectEvent)(() => {
              if (!A) return;
              let e = window.scrollY,
                t = [],
                a = (a, i) => {
                  a.width <= 0 ||
                    a.height <= 0 ||
                    t.push(
                      i
                        ? {
                            x: a.left,
                            y: a.top,
                            width: a.width,
                            height: a.height,
                            fixed: i,
                          }
                        : {
                            x: a.left,
                            y: a.top + e,
                            width: a.width,
                            height: a.height,
                          },
                    );
                };
              for (let e of document.querySelectorAll("[data-d1-clear]")) {
                if (e.closest("[data-faded]")) continue;
                let t = "fixed" === e.dataset.d1Clear,
                  i = e.getBoundingClientRect();
                if (!t) {
                  let t = document.createRange();
                  t.selectNodeContents(e);
                  let a = t.getBoundingClientRect();
                  a.width > 0 && a.height > 0 && (i = a);
                }
                let r = t ? e.closest("header") : null;
                if (r) {
                  if (r.matches("[data-hidden]:not(:focus-within)")) continue;
                  let e = new DOMMatrixReadOnly(getComputedStyle(r).transform)
                    .m42;
                  e && (i = new DOMRect(i.x, i.y - e, i.width, i.height));
                }
                a(i, t);
              }
              let i = B ? O.current?.querySelector("a") : null,
                r = i?.getBoundingClientRect(),
                n =
                  r && r.width > 0 && r.height > 0
                    ? { x: r.left, y: r.top, width: r.width, height: r.height }
                    : null;
              r && a(r, !0);
              let l = D.current?.getBoundingClientRect();
              A.setLayout({
                sceneLength: 0.95 * window.innerHeight,
                bar: null,
                caret: null,
                footer: l ? { top: l.top + e, height: l.height } : null,
                card: n,
                clearings: t,
              });
            });
            ((0, i.useEffect)(() => {
              if (!A) return;
              let e = requestAnimationFrame(() => G());
              return () => cancelAnimationFrame(e);
            }, [A, f, b, m]),
              (0, i.useEffect)(() => {
                if (!A) return;
                let e = 0,
                  t = !0,
                  a = () => {
                    (cancelAnimationFrame(e),
                      (e = requestAnimationFrame(() => G())));
                  };
                (a(), window.addEventListener("resize", a));
                let i = new ResizeObserver(a);
                (_.current && i.observe(_.current),
                  D.current && i.observe(D.current));
                let r = 0,
                  n = new MutationObserver(() => {
                    (a(),
                      window.clearTimeout(r),
                      (r = window.setTimeout(a, 280)));
                  });
                return (
                  _.current &&
                    n.observe(_.current, {
                      subtree: !0,
                      attributeFilter: ["data-faded"],
                    }),
                  T.current &&
                    n.observe(T.current, {
                      subtree: !0,
                      attributeFilter: ["data-hidden", "data-shown"],
                    }),
                  document.fonts.ready.then(() => {
                    t && a();
                  }),
                  () => {
                    ((t = !1),
                      cancelAnimationFrame(e),
                      window.clearTimeout(r),
                      window.removeEventListener("resize", a),
                      i.disconnect(),
                      n.disconnect());
                  }
                );
              }, [A]));
            let q = I?.api.slug,
              V = I?.anchor.x,
              W = I?.anchor.y;
            return (
              (0, i.useEffect)(() => {
                if (!A) return;
                let e = requestAnimationFrame(() => G()),
                  t = B ? window.setTimeout(() => G(), 400) : 0;
                return () => {
                  (cancelAnimationFrame(e), window.clearTimeout(t));
                };
              }, [A, B, q, V, W]),
              (0, i.useEffect)(() => {
                let e = _.current?.firstElementChild;
                if (!A || !e) return;
                let t = new IntersectionObserver(
                  ([e]) => A.setVisible(e?.isIntersecting ?? !1),
                  { rootMargin: "100px" },
                );
                return (t.observe(e), () => t.disconnect());
              }, [A]),
              (0, i.useLayoutEffect)(() => {
                let e = _.current?.closest("[data-d1-theme]");
                if (!e) return;
                let t = () =>
                  e.style.setProperty("--d1-vh", `${window.innerHeight}px`);
                return (
                  t(),
                  window.addEventListener("resize", t),
                  () => {
                    (window.removeEventListener("resize", t),
                      e.style.removeProperty("--d1-vh"));
                  }
                );
              }, []),
              (0, t.jsxs)(t.Fragment, {
                children: [
                  p && (0, t.jsx)(l.NavigationBar, {}),
                  (0, t.jsx)(th, {
                    theme: w,
                    showcaseCount: x.length,
                    reducedMotion: M,
                    onReady: C,
                    onFocus: (e) => {
                      let t = x[e.cluster];
                      t &&
                        E({
                          api: t,
                          anchor: { x: e.x, y: e.y },
                          color: e.color,
                          open: !0,
                        });
                    },
                    onBlur: H,
                  }),
                  (0, t.jsx)("div", {
                    ref: T,
                    className: u.default.marketplaceHeader,
                    children: (0, t.jsx)(n.MarketplaceHeader, {
                      query: "",
                      category: "",
                      alignWithHero: !0,
                      signedOut: void 0 === e ? void 0 : !e,
                      tone: w,
                    }),
                  }),
                  (0, t.jsxs)("main", {
                    ref: _,
                    className: u.default.main,
                    children: [
                      (0, t.jsx)(tf, {
                        copy: f,
                        world: A,
                        apiCount: g.length,
                        endpointCount: y,
                        showcase: x,
                        onListBlur: $,
                      }),
                      (0, t.jsxs)("div", {
                        className: u.default.lightContent,
                        children: [
                          (0, t.jsx)(eF, {
                            publishers: g,
                            categories: v,
                            copy: f,
                            categorySlugs: b,
                            categoryLabels: m,
                          }),
                          (0, t.jsxs)("div", {
                            className: (0, o.f)("dark", u.default.darkContent),
                            "data-d1-theme": "dark",
                            children: [
                              (0, t.jsx)(tL, {
                                copy: f,
                                publishers: g,
                                showcaseSlugs: x.map((e) => e.slug),
                              }),
                              (0, t.jsx)(t1, { copy: f }),
                              (0, t.jsx)(t$, {
                                copy: f,
                                apiCount: g.length,
                                endpointCount: y,
                              }),
                              (0, t.jsx)("div", {
                                ref: D,
                                className: u.default.marketplaceFooter,
                                children: (0, t.jsx)(n.MarketplaceFooter, {
                                  tagline: f.footerTagline,
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, t.jsx)("div", {
                    ref: O,
                    className: u.default.cardSlot,
                    children: (0, t.jsx)(S, {
                      world: A,
                      api: I?.api ?? null,
                      anchor: I?.anchor ?? null,
                      color: I?.color ?? "transparent",
                      open: B,
                      tracking: !k?.open,
                      follow: I && I === N ? F : void 0,
                      onHold: (e) => {
                        ((R.current = e && I === N), A?.holdFocus(e));
                      },
                      onClose: $,
                    }),
                  }),
                ],
              })
            );
          },
        ],
        618248,
      );
    },
  ],
  [
    [830582],
    (e) => {
      e.v({
        caption: "sjA_6G_caption",
        cardSlot: "sjA_6G_cardSlot",
        darkContent: "sjA_6G_darkContent",
        headline: "sjA_6G_headline",
        headlineLine: "sjA_6G_headlineLine",
        hero: "sjA_6G_hero",
        heroActions: "sjA_6G_heroActions",
        heroBody: "sjA_6G_heroBody",
        heroCopy: "sjA_6G_heroCopy",
        heroFrame: "sjA_6G_heroFrame",
        heroInner: "sjA_6G_heroInner",
        heroPrimary: "sjA_6G_heroPrimary",
        heroSecondary: "sjA_6G_heroSecondary",
        lightContent: "sjA_6G_lightContent",
        main: "sjA_6G_main",
        marketplaceFooter: "sjA_6G_marketplaceFooter",
        marketplaceHeader: "sjA_6G_marketplaceHeader",
        mono: "sjA_6G_mono",
        root: "sjA_6G_root",
        srOnly: "sjA_6G_srOnly",
      });
    },
  ],
  [
    [770180],
    (e) => {
      e.v({
        arrow: "AvMD9G_arrow",
        blurb: "AvMD9G_blurb",
        card: "AvMD9G_card",
        category: "AvMD9G_category",
        content: "AvMD9G_content",
        corner: "AvMD9G_corner",
        cornerBl: "AvMD9G_cornerBl",
        cornerBr: "AvMD9G_cornerBr",
        cornerTl: "AvMD9G_cornerTl",
        cornerTr: "AvMD9G_cornerTr",
        corners: "AvMD9G_corners",
        decode: "AvMD9G_decode",
        ident: "AvMD9G_ident",
        identity: "AvMD9G_identity",
        leaderH: "AvMD9G_leaderH",
        leaderPath: "AvMD9G_leaderPath",
        leaderV: "AvMD9G_leaderV",
        logo: "AvMD9G_logo",
        logoImgContain: "AvMD9G_logoImgContain",
        logoImgFill: "AvMD9G_logoImgFill",
        logoInitials: "AvMD9G_logoInitials",
        logoLattice: "AvMD9G_logoLattice",
        logoPlate: "AvMD9G_logoPlate",
        logoTile: "AvMD9G_logoTile",
        mono: "AvMD9G_mono",
        name: "AvMD9G_name",
        open: "AvMD9G_open",
        plate: "AvMD9G_plate",
        plateLink: "AvMD9G_plateLink",
        reticle: "AvMD9G_reticle",
        rowData: "AvMD9G_rowData",
        rowHead: "AvMD9G_rowHead",
        rule: "AvMD9G_rule",
        srOnly: "AvMD9G_srOnly",
        swap: "AvMD9G_swap",
        swatch: "AvMD9G_swatch",
        warmIn: "AvMD9G_warmIn",
      });
    },
  ],
  [
    [736680],
    (e) => {
      e.v({
        art: "EFMmia_art",
        artField: "EFMmia_artField",
        artFoot: "EFMmia_artFoot",
        artGlyph: "EFMmia_artGlyph",
        artLogo: "EFMmia_artLogo",
        artMeta: "EFMmia_artMeta",
        artOriginal: "EFMmia_artOriginal",
        badge: "EFMmia_badge",
        brackets: "EFMmia_brackets",
        categories: "EFMmia_categories",
        categoryIntro: "EFMmia_categoryIntro",
        controls: "EFMmia_controls",
        discovery: "EFMmia_discovery",
        explore: "EFMmia_explore",
        eyebrow: "EFMmia_eyebrow",
        featureBody: "EFMmia_featureBody",
        featureCard: "EFMmia_featureCard",
        featureFoot: "EFMmia_featureFoot",
        featureHead: "EFMmia_featureHead",
        featureRail: "EFMmia_featureRail",
        featureSlide: "EFMmia_featureSlide",
        featureTitle: "EFMmia_featureTitle",
        heading: "EFMmia_heading",
        initials: "EFMmia_initials",
        "is-wheel-dragging": "EFMmia_is-wheel-dragging",
        logoInitials: "EFMmia_logoInitials",
        logoTile: "EFMmia_logoTile",
        logoWell: "EFMmia_logoWell",
        price: "EFMmia_price",
        priceAmount: "EFMmia_priceAmount",
        priceQuiet: "EFMmia_priceQuiet",
        section: "EFMmia_section",
        swatch: "EFMmia_swatch",
        titleBlock: "EFMmia_titleBlock",
        viewAll: "EFMmia_viewAll",
      });
    },
  ],
  [
    [450691],
    (e) => {
      e.v({
        allBody: "wH8QCa_allBody",
        allCta: "wH8QCa_allCta",
        allHead: "wH8QCa_allHead",
        allNames: "wH8QCa_allNames",
        allRow: "wH8QCa_allRow",
        allTitle: "wH8QCa_allTitle",
        count: "wH8QCa_count",
        explorer: "wH8QCa_explorer",
        foot: "wH8QCa_foot",
        logoStack: "wH8QCa_logoStack",
        mono: "wH8QCa_mono",
        name: "wH8QCa_name",
        plusFill: "wH8QCa_plusFill",
        priceAmount: "wH8QCa_priceAmount",
        priceQuiet: "wH8QCa_priceQuiet",
        ruled: "wH8QCa_ruled",
        ruledBand: "wH8QCa_ruledBand",
        ruledBlurb: "wH8QCa_ruledBlurb",
        ruledCell: "wH8QCa_ruledCell",
        ruledCount: "wH8QCa_ruledCount",
        ruledFill: "wH8QCa_ruledFill",
        ruledGroup: "wH8QCa_ruledGroup",
        ruledHead: "wH8QCa_ruledHead",
        ruledText: "wH8QCa_ruledText",
        stackMore: "wH8QCa_stackMore",
        viewAll: "wH8QCa_viewAll",
      });
    },
  ],
  [
    [454817],
    (e) => {
      e.v({
        ambient: "cxWueG_ambient",
        body: "cxWueG_body",
        canvas: "cxWueG_canvas",
        chip: "cxWueG_chip",
        cta: "cxWueG_cta",
        ctaCorners: "cxWueG_ctaCorners",
        fact: "cxWueG_fact",
        factLabel: "cxWueG_factLabel",
        factText: "cxWueG_factText",
        facts: "cxWueG_facts",
        frame: "cxWueG_frame",
        gap: "cxWueG_gap",
        headline: "cxWueG_headline",
        keyArt: "cxWueG_keyArt",
        line: "cxWueG_line",
        mono: "cxWueG_mono",
        section: "cxWueG_section",
        slot: "cxWueG_slot",
        stage: "cxWueG_stage",
        struck: "cxWueG_struck",
        target: "cxWueG_target",
        targetRow: "cxWueG_targetRow",
        text: "cxWueG_text",
      });
    },
  ],
  [
    [309177],
    (e) => {
      e.v({
        art: "_62vHjq_art",
        focus: "_62vHjq_focus",
        focusLight: "_62vHjq_focusLight",
        mark: "_62vHjq_mark",
      });
    },
  ],
  [
    [884302],
    (e) => {
      e.v({
        actions: "VrW8Ea_actions",
        art: "VrW8Ea_art",
        copy: "VrW8Ea_copy",
        eyebrow: "VrW8Ea_eyebrow",
        panel: "VrW8Ea_panel",
        primary: "VrW8Ea_primary",
        secondary: "VrW8Ea_secondary",
        section: "VrW8Ea_section",
      });
    },
  ],
  [
    [306361],
    (e) => {
      e.v({
        arrow: "_0NggKa_arrow",
        bead: "_0NggKa_bead",
        chip: "_0NggKa_chip",
        docs: "_0NggKa_docs",
        enter: "_0NggKa_enter",
        frame: "_0NggKa_frame",
        gapArt: "_0NggKa_gapArt",
        grid: "_0NggKa_grid",
        head: "_0NggKa_head",
        lede: "_0NggKa_lede",
        payer: "_0NggKa_payer",
        plug: "_0NggKa_plug",
        plugArt: "_0NggKa_plugArt",
        rail: "_0NggKa_rail",
        scroller: "_0NggKa_scroller",
        stage: "_0NggKa_stage",
        swap: "_0NggKa_swap",
        tab: "_0NggKa_tab",
        tabBrackets: "_0NggKa_tabBrackets",
        tabIcon: "_0NggKa_tabIcon",
        title: "_0NggKa_title",
        wire: "_0NggKa_wire",
      });
    },
  ],
  [
    [438061, 80751],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(271645);
      let n = (e, t = 0, r = 1) => (e < t ? t : e > r ? r : e),
        i = (e, t, r) => e + (t - e) * r;
      function a(e, t, r) {
        return (
          0.5 +
          0.5 *
            Math.sin(
              0.22 * e +
                1.8 * Math.sin(0.42 * t + 0.05 * e + 0.1 * r) +
                0.35 * t -
                0.3 * r,
            )
        );
      }
      let o = (e, t, r) => (t === r ? (e < t ? 0 : 1) : n((e - t) / (r - t)));
      function s(e, t, r = 0) {
        let n = Math.imul(0 | e, 0x27d4eb2d) ^ Math.imul(0 | t, 0x165667b1) ^ r;
        return (
          (n = Math.imul(
            (n = Math.imul(n ^ (n >>> 15), 0x85ebca6b)) ^ (n >>> 13),
            0xc2b2ae35,
          )),
          ((n ^= n >>> 16) >>> 0) / 0x100000000
        );
      }
      function l(e, t, r = 0) {
        let n = Math.floor(e),
          a = Math.floor(t),
          o = e - n,
          c = t - a,
          d = o * o * (3 - 2 * o),
          f = s(n, a, r),
          u = s(n + 1, a, r),
          g = s(n, a + 1, r),
          m = s(n + 1, a + 1, r);
        return i(i(f, u, d), i(g, m, d), c * c * (3 - 2 * c));
      }
      e.s(
        [
          "n",
          0,
          (e, t, r, n) => (r <= 0 ? t : t + (e - t) * Math.exp(-n / r)),
          "O",
          0,
          n,
          "a",
          0,
          function (e, t, r, n) {
            let i = 3 * e,
              a = 3 * (r - e) - i,
              o = 1 - i - a,
              s = 3 * t,
              l = 3 * (n - t) - s,
              c = 1 - s - l,
              d = (e) => ((o * e + a) * e + i) * e,
              f = (e) => (3 * o * e + 2 * a) * e + i;
            return (e) => {
              let t;
              if (e <= 0) return 0;
              if (e >= 1) return 1;
              let r = e;
              for (let t = 0; t < 6; t += 1) {
                let t = d(r) - e,
                  n = f(r);
                if (1e-6 > Math.abs(t) || 1e-6 > Math.abs(n)) break;
                r -= t / n;
              }
              let n = 0,
                i = 1;
              for (let t = 0; t < 20 && Math.abs(d(r) - e) > 1e-6; t += 1)
                (d(r) < e ? (n = r) : (i = r), (r = (n + i) / 2));
              return ((c * (t = r) + l) * t + s) * t;
            };
          },
          "m",
          0,
          function (e, t, r = 4, n = 0) {
            let i = 0,
              a = 0.5,
              o = 0,
              s = 1;
            for (let c = 0; c < r; c += 1)
              ((i += a * l(e * s, t * s, n + 101 * c)),
                (o += a),
                (a *= 0.5),
                (s *= 2));
            return i / o;
          },
          "v",
          0,
          (e, t = 0) => s(e, 0x9e3779b9, t),
          "x",
          0,
          s,
          "Q",
          0,
          l,
          "U",
          0,
          o,
          "V",
          0,
          a,
          "j",
          0,
          (e, t, r) => {
            let n = o(r, e, t);
            return n * n * (3 - 2 * n);
          },
          "y",
          0,
          (e = 0) => ({ x: e, v: 0 }),
          "R",
          0,
          function (e, t, r, n) {
            let i = e.x - t,
              a = e.v + r * i,
              o = Math.exp(-r * n);
            ((e.x = t + (i + a * n) * o), (e.v = (e.v - r * a * n) * o));
          },
        ],
        80751,
      );
      var c = e.i(47399),
        d = e.i(298428);
      let f = [247, 246, 241],
        u = [36, 32, 29],
        g = (e, t) => [t(e[0], 0), t(e[1], 1), t(e[2], 2)],
        m = (e, t, r) => g(e, (e, n) => Math.round(e + (t[n] - e) * r)),
        p = (e) => {
          let t = (0.2126 * e[0] + 0.7152 * e[1] + 0.0722 * e[2]) / 255;
          return t >= 0.32
            ? e
            : g(e, (e) => Math.min(255, (0.42 / Math.max(0.02, t)) * e));
        };
      async function h(e) {
        let t = new Image(),
          r = new Promise((e, r) => {
            ((t.onload = () => e()),
              (t.onerror = () => r(Error("logo"))),
              setTimeout(() => r(Error("timeout")), 4e3));
          });
        ((t.src = (0, d.getImageProps)({
          src: e.image,
          alt: "",
          width: 64,
          height: 64,
        }).props.src),
          await r);
        let n = document.createElement("canvas");
        ((n.width = 32), (n.height = 32));
        let i = n.getContext("2d", { willReadFrequently: !0 });
        if (!i) return null;
        i.drawImage(t, 0, 0, 32, 32);
        let { data: a } = i.getImageData(0, 0, 32, 32),
          o = e.bgColor
            ? ((e) => {
                let t = /^#?([0-9a-f]{6})$/i.exec(e);
                if (!t?.[1]) return null;
                let r = Number.parseInt(t[1], 16);
                return [(r >> 16) & 255, (r >> 8) & 255, 255 & r];
              })(e.bgColor)
            : null,
          s = Array.from({ length: 24 }, () => ({ n: 0, sum: [0, 0, 0] }));
        for (let e = 0; e < a.length; e += 4) {
          let t =
              (a[e + 3] ?? 0) < 128
                ? (o ?? f)
                : [a[e] ?? 0, a[e + 1] ?? 0, a[e + 2] ?? 0],
            r = (function (e) {
              let t = Math.max(...e) / 255,
                r = Math.min(...e) / 255,
                n = (t + r) / 2,
                i = t - r,
                a = 0 === i ? 0 : i / (1 - Math.abs(2 * n - 1));
              if (n < 0.14 || a < 0.22 || (n > 0.92 && a < 0.5)) return null;
              let [o, s, l] = g(e, (e) => e / 255);
              return (
                ((((t === o
                  ? (s - l) / i
                  : t === s
                    ? (l - o) / i + 2
                    : (o - s) / i + 4) /
                  6) %
                  1) +
                  1) %
                1
              );
            })(t);
          if (null === r) continue;
          let n = s[Math.floor(24 * r) % 24];
          if (n) {
            n.n += 1;
            for (let e = 0; e < 3; e += 1) n.sum[e] = (n.sum[e] ?? 0) + t[e];
          }
        }
        let l = (e) =>
            (s[(e + 24 - 1) % 24]?.n ?? 0) +
            (s[e]?.n ?? 0) +
            (s[(e + 1) % 24]?.n ?? 0),
          c = s.map((e, t) => t).sort((e, t) => l(t) - l(e)),
          h = c[0] ?? 0;
        if (30.72 > s.reduce((e, t) => e + t.n, 0)) return null;
        let x = (e) => {
            let t = [0, 0, 0],
              r = 0;
            for (let n of [e + 24 - 1, e, e + 1]) {
              let e = s[n % 24];
              if (e) {
                r += e.n;
                for (let r = 0; r < 3; r += 1)
                  t[r] = (t[r] ?? 0) + (e.sum[r] ?? 0);
              }
            }
            return g(t, (e) => Math.round(e / Math.max(1, r)));
          },
          b = p(x(h)),
          v = c.find((e) => {
            let t;
            return (
              Math.min((t = Math.abs(e - h) % 24), 24 - t) >= 3 &&
              (s[e]?.n ?? 0) > 0 &&
              l(e) >= 0.12 * l(h)
            );
          });
        return void 0 === v ? [m(b, u, 0.35), m(b, f, 0.3)] : [b, p(x(v))];
      }
      let x = new Map(),
        b = (e, t, r = 0) => {
          let n = 43758.5453 * Math.sin(127.1 * e + 311.7 * t + 74.7 * r);
          return n - Math.floor(n);
        };
      e.s(
        [
          "BrandField",
          0,
          function ({ logo: e }) {
            let i = (0, r.useRef)(null),
              o = (function (e) {
                let t = e?.image,
                  n = e?.bgColor,
                  [i, a] = (0, r.useState)();
                return ((0, r.useEffect)(() => {
                  if (!t) return;
                  let e = !0,
                    r = x.get(t);
                  return (
                    r ||
                      ((r = h({ image: t, bgColor: n }).catch(() => null)),
                      x.set(t, r)),
                    r.then((r) => {
                      e && a({ image: t, colours: r });
                    }),
                    () => {
                      e = !1;
                    }
                  );
                }, [t, n]),
                t)
                  ? i?.image === t
                    ? i.colours
                    : void 0
                  : null;
              })(e);
            return (
              (0, r.useEffect)(() => {
                let e = i.current;
                if (!e || void 0 === o) return;
                let t = e.getContext("2d");
                if (!t) return;
                let r = window.matchMedia("(prefers-reduced-motion: reduce)"),
                  s = Array.from({ length: 18 }, (e, t) => {
                    let r = t / 17;
                    return o
                      ? (([e, t], r) => {
                          let n = m(e, t, Math.min(1, Math.max(0, r)));
                          return `rgb(${n[0]} ${n[1]} ${n[2]})`;
                        })(o, r)
                      : (0, c.f)((0, c.u)(c.U, r));
                  }),
                  l = 0,
                  d = 0,
                  f = 1,
                  u = !1,
                  g = 0,
                  p = 0,
                  h = 0,
                  x = (e, r, n) => {
                    let i = (e) => Math.round(e * f) / f,
                      a = Math.max(2 / f, i(n)),
                      o = Math.max(1 / f, i(a / 3)),
                      s = i(e - a / 2),
                      l = i(r - a / 2),
                      c = i((a - o) / 2);
                    (t.beginPath(),
                      t.rect(s + c, l, o, a),
                      t.rect(s, l + c, a, o),
                      t.fill());
                  },
                  v = (e) => {
                    t.clearRect(0, 0, l, d);
                    let r = Math.ceil(l / 16),
                      i = d - 288;
                    for (let o = 0; o < 18; o += 1)
                      for (let l = 0; l < r; l += 1) {
                        let r = n((l - 2) / 22);
                        if (r <= 0) continue;
                        let d = l + 0.5,
                          f = o + 0.5,
                          u = a(d, f, e),
                          g = 0.44,
                          m = 0.92;
                        if (u > 0.88 && b(l, o, 4) < 0.92 * r)
                          t.fillStyle = s[o] ?? c.h.dark.fg;
                        else {
                          let i = n((u - 0.45) / 0.43) * r;
                          if (b(l, o) >= 0.82 * i * i) continue;
                          let a = b(l, o, 1);
                          g = a > 0.9 ? 0.46 : a > 0.55 ? 0.36 : 0.28;
                          let s = 0.7 - 0.4 * i,
                            d =
                              0.5 +
                              0.5 *
                                Math.sin(
                                  e * (0.5 + 0.9 * b(l, o, 6)) +
                                    b(l, o, 3) * Math.PI * 2,
                                );
                          ((m = (0.14 + 0.42 * i) * (1 - s + s * d * d)),
                            (t.fillStyle = c.h.dark.fg));
                        }
                        ((t.globalAlpha = m), x(16 * d, i + 16 * f, 16 * g));
                      }
                    t.globalAlpha = 1;
                  },
                  y = () => u && !document.hidden && l > 0 && d > 0,
                  j = (e) => {
                    ((g = 0),
                      y() &&
                        !r.matches &&
                        (p && (h += Math.min((e - p) / 1e3, 0.1)),
                        (p = e),
                        v(h),
                        (g = requestAnimationFrame(j))));
                  },
                  C = () => {
                    (cancelAnimationFrame(g),
                      (g = 0),
                      (p = 0),
                      y() &&
                        (v(r.matches ? 0 : h),
                        r.matches || (g = requestAnimationFrame(j))));
                  },
                  w = () => {
                    ((l = e.clientWidth),
                      (d = e.clientHeight),
                      (f = Math.min(window.devicePixelRatio || 1, 2)),
                      (e.width = Math.round(l * f)),
                      (e.height = Math.round(d * f)),
                      t.setTransform(f, 0, 0, f, 0, 0),
                      C());
                  },
                  k = new ResizeObserver(w);
                k.observe(e);
                let N = new IntersectionObserver(([e]) => {
                  ((u = e?.isIntersecting ?? !1), C());
                });
                return (
                  N.observe(e),
                  document.addEventListener("visibilitychange", C),
                  r.addEventListener("change", C),
                  window.addEventListener("resize", w),
                  w(),
                  () => {
                    (cancelAnimationFrame(g),
                      k.disconnect(),
                      N.disconnect(),
                      document.removeEventListener("visibilitychange", C),
                      r.removeEventListener("change", C),
                      window.removeEventListener("resize", w));
                  }
                );
              }, [o]),
              (0, t.jsx)("canvas", {
                ref: i,
                "aria-hidden": !0,
                className: "block h-full w-full",
              })
            );
          },
        ],
        438061,
      );
    },
  ],
  [
    [47399],
    (e) => {
      "use strict";
      let t = [
          [0, "#0853A3"],
          [0.4567, "#F2ABCB"],
          [0.75, "#F2AB2F"],
          [1, "#EE251B"],
        ],
        r = "#EDA9CA",
        n = [
          [0, "#215DA8"],
          [0.5, "#9E8FD0"],
          [1, r],
        ],
        i = [
          [0, "#E8241A"],
          [0.5, "#F2AB3B"],
          [1, r],
        ],
        a = [
          [0, "#215DA8"],
          [0.5, "#8F7FC4"],
          [1, "#E28FB7"],
        ],
        o = [
          [0, "#E8241A"],
          [0.5, "#F2AB3B"],
          [1, "#E28FB7"],
        ],
        s = [
          ...n.map(([e, t]) => [e / 2, t]),
          ...i
            .slice(0, -1)
            .map(([e, t]) => [1 - e / 2, t])
            .reverse(),
        ],
        l = [
          [0, "#215DA8"],
          [0.45, "#E28FB7"],
          [0.72, "#F2AB3B"],
          [1, "#E8241A"],
        ];
      function c(e) {
        let t = Number.parseInt(e.slice(1), 16);
        return [
          ((t >> 16) & 255) / 255,
          ((t >> 8) & 255) / 255,
          (255 & t) / 255,
        ];
      }
      function d(e, t) {
        let r = e[0],
          n = e[e.length - 1];
        if (!r || !n) return [0, 0, 0];
        if (t <= r[0]) return c(r[1]);
        for (let r = 1; r < e.length; r += 1) {
          let n = e[r - 1],
            i = e[r];
          if (t <= i[0]) {
            let e = i[0] === n[0] ? 0 : (t - n[0]) / (i[0] - n[0]),
              r = c(n[1]),
              a = c(i[1]);
            return [
              r[0] + (a[0] - r[0]) * e,
              r[1] + (a[1] - r[1]) * e,
              r[2] + (a[2] - r[2]) * e,
            ];
          }
        }
        return c(n[1]);
      }
      function f(e) {
        let t = (e) => Math.round(255 * Math.min(1, Math.max(0, e)));
        return `rgb(${t(e[0])} ${t(e[1])} ${t(e[2])})`;
      }
      let u = [
        t,
        [
          [0, "#DCD7CD"],
          [1, "#3B3632"],
        ],
        l,
        n,
        i,
        a,
        o,
      ];
      e.s([
        "a",
        0,
        [
          [0, "#F2AB3B"],
          [1, "#F2AB3B"],
        ],
        "U",
        0,
        t,
        "g",
        0,
        s,
        "J",
        0,
        u,
        "Y",
        0,
        256,
        "x",
        0,
        l,
        "i",
        0,
        {
          darkPlume: 0,
          lightPlume: 1,
          lightAccent: 2,
          darkWallLeft: 3,
          darkWallRight: 4,
          lightWallLeft: 5,
          lightWallRight: 6,
        },
        "h",
        0,
        {
          dark: { bg: "#24201D", fg: "#F7F6F1", deep: "#1B1816" },
          light: { bg: "#F4F1EA", fg: "#24201D", deep: "#E2DDD2" },
        },
        "f",
        0,
        f,
        "j",
        0,
        function (e, r, s, c) {
          let u = "dark" === e;
          return c
            ? f(d(u ? (c.left ? n : i) : c.left ? a : o, c.t))
            : f(u ? d(t, r) : d(l, s));
        },
        "y",
        0,
        function (e) {
          let [t, r, n] = c(e);
          return `vec3(${t.toFixed(4)}, ${r.toFixed(4)}, ${n.toFixed(4)})`;
        },
        "s",
        0,
        function () {
          let e = new Uint8Array(256 * u.length * 4);
          return (
            u.forEach((t, r) => {
              for (let n = 0; n < 256; n += 1) {
                let i = d(t, n / 255),
                  a = (256 * r + n) * 4;
                ((e[a] = Math.round(255 * i[0])),
                  (e[a + 1] = Math.round(255 * i[1])),
                  (e[a + 2] = Math.round(255 * i[2])),
                  (e[a + 3] = 255));
              }
            }),
            e
          );
        },
        "Z",
        0,
        c,
        "u",
        0,
        d,
      ]);
    },
  ],
  [
    [718687],
    (e) => {
      "use strict";
      let t = [
          "square",
          "circle",
          "ring",
          "diamond",
          "target",
          "pill",
          "triangle",
          "letter",
        ],
        i = [
          "#0b5fff",
          "#4264fb",
          "#f22f46",
          "#111111",
          "#fc6600",
          "#0f9d8a",
          "#0fa36b",
          "#3640f5",
          "#635bff",
          "#0abf53",
          "#48dad0",
          "#2e6fe8",
          "#ff5722",
          "#1f7bf6",
        ],
        n = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        });
      function r(e) {
        return e > 0 && e < 1e-6 ? "<$0.000001" : n.format(e);
      }
      let a = [
        { value: "called", label: "Most called" },
        { value: "added", label: "Recently added" },
        { value: "price", label: "Price, low to high" },
        { value: "name", label: "Name, A–Z" },
      ];
      function l(e) {
        return e.priceFromUsd ?? (e.pricingDynamic ? 1 / 0 : 0);
      }
      let o = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      function d(e) {
        return `${e} ${1 === e ? "endpoint" : "endpoints"}`;
      }
      e.s([
        "P",
        0,
        { api: "brand-dev", path: "/v1/brand/screenshot" },
        "r",
        0,
        { api: "hunter", path: "/v2/email-finder" },
        "K",
        0,
        function (e) {
          let [t, i, n] = e.split("-").map(Number);
          return `Added ${o[(i ?? 1) - 1]} ${n}, ${t}`;
        },
        "Q",
        0,
        function (e, t, i = 1) {
          let n = new URLSearchParams();
          ("called" !== t && n.set("sort", t),
            i > 1 && n.set("page", String(i)));
          let r = n.toString();
          return r ? `${e}?${r}` : e;
        },
        "m",
        0,
        function (e, t, i) {
          let n = [...e];
          ("added" === t &&
            n.sort((e, t) => (t.addedOn ?? "").localeCompare(e.addedOn ?? "")),
            "price" === t && n.sort((e, t) => l(e) - l(t)),
            "name" === t &&
              n.sort((e, t) =>
                e.name.localeCompare(t.name, "en-US", { sensitivity: "base" }),
              ));
          let r = Math.max(1, Math.ceil(n.length / 8)),
            a = Number(i),
            o = Math.min(Number.isInteger(a) && a >= 1 ? a : 1, r),
            d = (o - 1) * 8,
            s = n.slice(d, d + 8);
          return {
            shown: s,
            page: o,
            pages: r,
            total: n.length,
            from: s.length ? d + 1 : 0,
            to: d + s.length,
          };
        },
        "F",
        0,
        function (e) {
          return a.find((t) => t.value === e)?.value ?? "called";
        },
        "w",
        0,
        a,
        "j",
        0,
        function (e) {
          return e ? `/catalog/${encodeURIComponent(e)}` : "/catalog";
        },
        "C",
        0,
        function (e, t) {
          return `/api/${encodeURIComponent(e)}/${encodeURIComponent(t)}`;
        },
        "Y",
        0,
        function (e) {
          return e.name ?? `${e.method} ${e.path}`;
        },
        "i",
        0,
        d,
        "x",
        0,
        r,
        "k",
        0,
        function (e) {
          return !e.isPayable || 0 === e.priceUsd;
        },
        "l",
        0,
        function (e) {
          let n = 0;
          for (let t of e) n = (31 * n + t.charCodeAt(0)) >>> 0;
          return {
            mark: t[n % t.length] ?? "letter",
            color: i[n % i.length] ?? "#18181a",
          };
        },
        "D",
        0,
        function (e) {
          let t =
            null !== e.priceFromUsd
              ? e.endpoints > 1
                ? `cheapest from ${r(e.priceFromUsd)} per call`
                : `${r(e.priceFromUsd)} per call`
              : e.pricingDynamic
                ? "priced per call"
                : "free to call";
          return `${d(e.endpoints)} \xb7 ${t}`;
        },
        "c",
        0,
        function (e, t) {
          return t.find((t) => e.categorySlugs.includes(t.slug));
        },
        "f",
        0,
        function ({ slug: e }) {
          return `/publisher/${encodeURIComponent(e)}`;
        },
      ]);
    },
  ],
  [
    [35813],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(271645),
        n = e.i(975157),
        i = e.i(830582);
      let a = (0, r.createContext)(null),
        s = { theme: "dark" };
      e.s([
        "D1Root",
        0,
        function ({ fontClassName: e = "", children: r }) {
          return (0, t.jsx)(a, {
            value: s,
            children: (0, t.jsx)("div", {
              id: "top",
              "data-d1-root": !0,
              "data-d1-theme": s.theme,
              className: (0, n.f)(i.default.root, e),
              children: r,
            }),
          });
        },
        "useD1Theme",
        0,
        function () {
          let e = (0, r.use)(a);
          if (!e) throw Error("useD1Theme must be used inside D1Root");
          return e;
        },
      ]);
    },
  ],
  [
    [86275, 716317, 487710],
    (e) => {
      "use strict";
      var t = e.i(843476);
      let r = {
          heroTitle: "Every API surfaced\nthrough the noise.",
          heroBody:
            "Every API has its own signup, keys and billing. Orthogonal puts them behind one key, so your agent asks for what it needs, finds a matching endpoint and sees the price before it calls.",
          heroPrimaryLabel: "Explore APIs",
          heroSecondaryLabel: "How billing works",
          heroSecondaryHref: "/docs/concepts/pricing",
          categoriesEyebrow: "Find your next building block",
          categoriesTitle: "Explore by category",
          keysTitle: "{count} keys, or one.",
          keysBody:
            "Every API in the catalog runs on your Orthogonal key. No signing up with each provider, no keys to store or rotate.",
          keysSignedOutLabel: "Get your key",
          keysSignedInLabel: "Your keys",
          keysFact1Title: "Provider keys stay with us",
          keysFact1Body: "You never see or handle them.",
          keysFact2Title: "One bill, with receipts",
          keysFact2Body: "Every call, whatever the API.",
          keysFact3Title: "A daily limit on every key",
          keysFact3Body: "Cap what a key can spend a day.",
          plugTitle: "Plug it into what you already use",
          plugBody:
            "Every API in the catalog, one key and one bill, whichever you pick.",
          plugLabel: "Connect an agent",
          ctaTitle: "Your agent is\none key away.",
          ctaBody:
            "One key gives your agent every API in the catalog. Pay per call from one balance, or connect your agent's wallet.",
          ctaSignedOutLabel: "Get your API key",
          ctaSignedInLabel: "Open your keys",
          ctaSecondaryLabel: "Read the docs",
          footerTagline: "Every API surfaced through the noise.",
        },
        a = {
          copy: {
            ...r,
            heroTitle: "Get your agent\nthe data it needs.",
            heroBody:
              "Access data and services through one connection. Pay for the calls you make, without a separate subscription to each provider.",
            heroSecondaryLabel: "Connect an agent",
            heroSecondaryHref: "/docs/mcp/setup",
            categoriesEyebrow: "Data for the task at hand",
            categoriesTitle: "Find the data you need",
            keysTitle: "Several providers.\nOne connection.",
            keysBody:
              "One Orthogonal key and balance cover your calls across the catalog. Use the sources your task needs without setting up each provider separately.",
            keysFact1Title: "Specialist data, one key",
            keysFact1Body: "Access providers across the catalog.",
            keysFact2Title: "Pay per call",
            keysFact2Body: "Use a source when you need it.",
            keysFact3Title: "Set your budget",
            keysFact3Body: "Choose a daily spend limit for each key.",
            plugBody:
              "Connect through MCP, the API, or your terminal. Each gives you access to the same catalog.",
            ctaTitle: "Connect your agent.",
            ctaBody: "Find an API, check its price, and make your first call.",
            footerTagline: "Data and APIs for your agents.",
          },
          categoryOrder: [
            "company-search",
            "people-search",
            "ai-search",
            "web-search",
          ],
          categoryLabels: {
            "company-search": "Company Data",
            "people-search": "People Data",
            "brand-data": "Brand Data",
            "web-search": "Web Data",
            financial: "Financial Data",
            dataset: "Datasets",
          },
          catalogTitle: "Data for your agents.",
        };
      function n(e) {
        return a.categoryLabels[e.slug] ?? e.name;
      }
      e.s(
        [
          "t",
          0,
          a,
          "O",
          0,
          {
            copy: r,
            categoryOrder: [
              "ai-search",
              "company-search",
              "email-finder",
              "scrape",
            ],
            categoryLabels: {},
            catalogTitle: "Every API, one key",
          },
          "m",
          0,
          a,
          "P",
          0,
          function (e, t) {
            return e
              .map((e) => ({
                category: e,
                items: t.filter((t) => t.categorySlugs.includes(e.slug)),
              }))
              .filter((e) => e.items.length > 0);
          },
          "p",
          0,
          function (e, t = a.categoryOrder) {
            let r = (e) => {
              let r = t.indexOf(e);
              return r < 0 ? t.length : r;
            };
            return [...e]
              .sort(
                (e, t) =>
                  r(e.category.slug) - r(t.category.slug) ||
                  t.items.length - e.items.length,
              )
              .slice(0, 4)
              .map(({ category: e }) => e.slug);
          },
          "e",
          0,
          n,
        ],
        716317,
      );
      var s = e.i(103697),
        i = e.i(519455),
        o = e.i(257428),
        l = e.i(110204),
        c = e.i(808562),
        d = e.i(718687),
        u = e.i(262539);
      function m(e, t = "") {
        let r = t ? `&category=${encodeURIComponent(t)}` : "";
        return `/search?q=${encodeURIComponent(e)}${r}`;
      }
      e.s(["f", 0, m], 487710);
      var f = e.i(492855),
        h = e.i(738629),
        x = e.i(975157),
        g = e.i(478610),
        p = e.i(619273),
        b = e.i(266027),
        v = e.i(912598),
        y = e.i(263676),
        j = e.i(368356),
        w = e.i(669430),
        k = e.i(271645),
        N = e.i(549665),
        L = e.i(647328),
        A = e.i(107308),
        P = e.i(716327);
      function C({ endpoint: e }) {
        let r = (0, u.x)(e),
          a = (0, u.$)(r);
        return (0, t.jsxs)(t.Fragment, {
          children: [
            r.figure
              ? (0, t.jsx)(N.PriceLead, {
                  usd: r.figure.usd,
                  lead: r.figure.prefix.trim() || null,
                  per: r.figure.per,
                })
              : (0, t.jsx)(N.PriceWords, { children: r.headline }),
            a && (0, t.jsx)("p", { className: N.priceCaption, children: a }),
          ],
        });
      }
      function S({ slug: e, endpoint: r }) {
        return (0, t.jsxs)("li", {
          className:
            "flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 py-1.5 text-sm sm:flex-nowrap",
          children: [
            (0, t.jsx)("span", {
              className:
                "w-12 shrink-0 font-mono text-2xs text-muted-foreground",
              children: r.method,
            }),
            (0, t.jsx)(j.Link, {
              href: (0, d.C)(e, r.id),
              className:
                "min-w-0 truncate underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
              children: (0, d.Y)(r),
            }),
            (0, t.jsx)(g.f, {
              endpoint: r,
              className:
                "max-sm:w-full max-sm:items-start max-sm:pl-14 max-sm:text-left sm:ml-auto sm:pl-3",
            }),
          ],
        });
      }
      function M({ slug: e, endpoints: r }) {
        let a = 4 === r.length ? r.length : 3,
          n = r.slice(0, a),
          s = r.slice(a);
        return (0, t.jsxs)(A.Collapsible, {
          className: "w-full max-w-[62ch]",
          children: [
            (0, t.jsxs)("p", {
              className:
                "mb-1 font-mono text-2xs tracking-[0.06em] text-muted-foreground uppercase",
              children: [
                r.length,
                " more ",
                1 === r.length ? "match" : "matches",
                " ",
                "in this API",
              ],
            }),
            (0, t.jsx)("ul", {
              className: "divide-y divide-border border-y border-border",
              children: n.map((r) =>
                (0, t.jsx)(S, { slug: e, endpoint: r }, r.id),
              ),
            }),
            s.length > 0 &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsx)(A.CollapsibleContent, {
                    hiddenUntilFound: !0,
                    children: (0, t.jsx)("ul", {
                      className:
                        "divide-y divide-border border-b border-border",
                      children: s.map((r) =>
                        (0, t.jsx)(S, { slug: e, endpoint: r }, r.id),
                      ),
                    }),
                  }),
                  (0, t.jsxs)(A.CollapsibleTrigger, {
                    className:
                      "group/collapsible mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground",
                    children: [
                      (0, t.jsx)(P.f, {
                        className:
                          "size-3.5 transition-transform group-data-[panel-open]/collapsible:rotate-180",
                        "aria-hidden": "true",
                      }),
                      (0, t.jsxs)("span", {
                        className: "group-data-[panel-open]/collapsible:hidden",
                        children: ["Show ", s.length, " more"],
                      }),
                      (0, t.jsx)("span", {
                        className:
                          "hidden group-data-[panel-open]/collapsible:inline",
                        children: "Show fewer",
                      }),
                    ],
                  }),
                ],
              }),
          ],
        });
      }
      function T({ result: e }) {
        let [r, ...a] = e.endpoints;
        if (!r) return null;
        let n = (0, d.C)(e.slug, r.id),
          o = r.description ?? e.description,
          l = r.quality?.successRate30d === null ? void 0 : r.quality;
        return (0, t.jsxs)("article", {
          className: (0, x.f)(N.listingRow, "first:pt-0"),
          children: [
            (0, t.jsx)(j.Link, {
              href: (0, d.f)(e),
              "aria-label": e.name,
              className:
                "self-start rounded-panel-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
              children: (0, t.jsx)(s.PublisherLogo, {
                publisher: e,
                size: "row",
                well: !0,
              }),
            }),
            (0, t.jsxs)("div", {
              className: "flex min-w-0 flex-col items-start gap-2.5",
              children: [
                (0, t.jsx)("h2", {
                  className: N.listingTitle,
                  children: (0, t.jsx)(j.Link, {
                    href: n,
                    className:
                      "decoration-1 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                    children: (0, d.Y)(r),
                  }),
                }),
                (0, t.jsxs)("p", {
                  className: "-mt-1 text-[13px] text-muted-foreground",
                  children: [
                    "by",
                    " ",
                    (0, t.jsx)(j.Link, {
                      href: (0, d.f)(e),
                      className:
                        "text-foreground underline-offset-4 hover:underline",
                      children: e.name,
                    }),
                  ],
                }),
                o &&
                  (0, t.jsx)("p", { className: N.listingBlurb, children: o }),
                (0, t.jsx)(N.ListingLabels, {
                  verified: e.verified,
                  reliable: e.reliable,
                }),
                (0, t.jsxs)("p", {
                  className:
                    "flex max-w-full min-w-0 items-baseline gap-2 text-sm",
                  children: [
                    (0, t.jsx)("span", {
                      className:
                        "w-12 shrink-0 font-mono text-2xs text-muted-foreground",
                      children: r.method,
                    }),
                    (0, t.jsx)("span", {
                      className: "truncate font-mono text-xs",
                      children: r.path,
                    }),
                  ],
                }),
                a.length > 0 && (0, t.jsx)(M, { slug: e.slug, endpoints: a }),
              ],
            }),
            (0, t.jsxs)("div", {
              className:
                "col-start-2 flex min-w-0 flex-col gap-2 sm:col-start-auto",
              children: [
                (0, t.jsx)(C, { endpoint: r }),
                l &&
                  (0, t.jsx)("p", {
                    className: "mb-2 text-xs text-muted-foreground",
                    children: (0, t.jsx)(L.f, { quality: l }),
                  }),
                (0, t.jsx)(j.Link, {
                  href: n,
                  className: (0, x.f)(
                    (0, i.i)({ size: "2xl" }),
                    "w-full font-mono text-[13px] font-normal tracking-[0.01em]",
                  ),
                  children: "View endpoint",
                }),
                (0, t.jsxs)(j.Link, {
                  href: (0, d.f)(e),
                  className: N.listingAction,
                  children: ["All endpoints", (0, t.jsx)(N.ActionArrow, {})],
                }),
              ],
            }),
          ],
        });
      }
      let z = [
        { label: "Under $0.01", test: (e) => e < 0.01 },
        { label: "$0.01 – $0.10", test: (e) => e >= 0.01 && e <= 0.1 },
        { label: "Over $0.10", test: (e) => e > 0.1 },
      ];
      function I(e, t) {
        let r = (function (e) {
            let [t] = e.endpoints;
            return t?.isPayable ? t.priceUsd : 0;
          })(e),
          a = z.find((e) => e.label === t);
        return null !== r && !!a?.test(r);
      }
      function O(e, t) {
        return f.r.catalog.search.queryOptions({
          input: { q: e.trim(), category: t },
          staleTime: 3e5,
        });
      }
      function E({ children: e }) {
        return (0, t.jsx)("div", {
          role: "status",
          className:
            "min-h-[40vh] border-b border-border px-4 py-10 text-sm leading-6 text-muted-foreground sm:px-6 lg:px-10",
          children: e,
        });
      }
      function F({ query: e, scope: r }) {
        return (0, t.jsxs)(t.Fragment, {
          children: [
            (0, t.jsxs)("div", {
              className:
                "border-b border-border px-4 py-5 font-mono text-xs text-muted-foreground sm:px-6 lg:px-10",
              children: ["No results for “", e, "”", r],
            }),
            (0, t.jsx)("div", {
              className: "px-4 py-10 sm:px-6 lg:px-10",
              children: (0, t.jsxs)("div", {
                className: "rounded-lg border border-border bg-card p-6 sm:p-8",
                children: [
                  (0, t.jsx)("h2", {
                    className: "text-2xl font-normal tracking-[-0.02em]",
                    children: "Nothing in the catalog does this yet",
                  }),
                  (0, t.jsx)("p", {
                    className: "mt-3 text-sm leading-6 text-muted-foreground",
                    children:
                      "We matched on intent as well as keywords, so this is not a spelling problem.",
                  }),
                  (0, t.jsx)(j.Link, {
                    href: "/catalog",
                    className: (0, x.f)(
                      (0, i.i)({ variant: "outline" }),
                      "mt-4",
                    ),
                    children: "Browse the catalog",
                  }),
                ],
              }),
            }),
          ],
        });
      }
      function $({ label: e, count: r, checked: a, onToggle: n }) {
        return (0, t.jsxs)(l.Label, {
          className:
            "mb-1 w-full gap-2.5 rounded-glyph px-3 py-2.5 text-sm leading-normal font-normal transition-colors duration-(--motion-fast) hover:bg-muted focus-within:bg-muted motion-reduce:transition-none",
          children: [
            (0, t.jsx)(o.f, {
              checked: a,
              onCheckedChange: n,
              "aria-label": e,
            }),
            e,
            " ",
            (0, t.jsx)("span", {
              className:
                "ml-auto font-mono text-xs text-muted-foreground tabular-nums",
              children: r,
            }),
          ],
        });
      }
      function B({ label: e, onClear: r }) {
        return (0, t.jsxs)(i.K, {
          type: "button",
          variant: "outline",
          size: "sm",
          "aria-label": `Remove ${e}`,
          onClick: r,
          className:
            "h-auto rounded-md border-border bg-card px-3 py-1.5 font-mono text-2xs font-normal hover:bg-muted",
          children: [
            e,
            (0, t.jsx)(y.X, {
              className: "size-3 text-muted-foreground",
              "aria-hidden": "true",
            }),
          ],
        });
      }
      e.s(
        [
          "CatalogSearch",
          0,
          function ({ query: e, category: r }) {
            let a = (0, v.d)(),
              s = { q: e.trim(), category: r },
              o = (0, b.f)({
                ...f.r.catalog.searchResults.queryOptions({ input: s }),
                enabled: !!s.q,
                staleTime: 1 / 0,
                gcTime: 1 / 0,
                refetchOnWindowFocus: !1,
                placeholderData: () => a.getQueryData(O(e, r).queryKey),
              }),
              { data: l = [] } = (0, b.f)(
                f.r.catalog.categories.queryOptions(),
              ),
              [d, u] = (0, k.useState)(null),
              [m, g] = (0, k.useState)(null),
              p = o.isPlaceholderData ? void 0 : o.data;
            if (
              ((0, k.useEffect)(() => {
                p &&
                  w.f.capture("api_search_performed", {
                    query: e.trim(),
                    search_type: "semantic",
                    result_count: p.results.length,
                    surface: "public_discover",
                  });
              }, [p, e]),
              !e.trim())
            )
              return (0, t.jsx)(E, {
                children: "Type what you need into the search box above.",
              });
            if ((0, h.w)(o.error, o.data))
              return (0, t.jsxs)(E, {
                children: [
                  "Search is not answering right now.",
                  " ",
                  (0, t.jsx)(i.K, {
                    type: "button",
                    variant: "link",
                    className: "h-auto p-0 text-sm text-foreground",
                    onClick: () => void o.refetch(),
                    children: "Try again",
                  }),
                ],
              });
            if (void 0 === o.data)
              return (0, t.jsxs)(E, {
                children: ["Searching the catalog for “", e, "”…"],
              });
            let y = new Map(l.map((e) => [e.slug, n(e)])),
              j = r ? ` in ${y.get(r) ?? r}` : "",
              { results: L, named: A } = o.data,
              P =
                A &&
                (0, t.jsxs)("div", {
                  className: "mb-8",
                  children: [
                    (0, t.jsx)("p", {
                      className: "brand-caption mb-1 text-muted-foreground",
                      children: "API",
                    }),
                    (0, t.jsx)("ul", {
                      "aria-label": "API named",
                      children: (0, t.jsx)(N.CatalogRow, {
                        publisher: A,
                        categoryNames: l
                          .filter((e) => A.categorySlugs.includes(e.slug))
                          .slice(0, 3)
                          .map((e) => y.get(e.slug) ?? e.name),
                      }),
                    }),
                  ],
                });
            if (0 === L.length)
              return P
                ? (0, t.jsx)("div", {
                    className: "px-4 py-8 sm:px-6 lg:px-10 lg:py-12",
                    children: P,
                  })
                : (0, t.jsx)(F, { query: e, scope: j });
            let C = new Map();
            for (let e of L.flatMap((e) => e.categorySlugs))
              C.set(e, (C.get(e) ?? 0) + 1);
            let S = [...C].sort((e, t) => t[1] - e[1]),
              M = L.filter(
                (e) => (!d || e.categorySlugs.includes(d)) && (!m || I(e, m)),
              ),
              _ = !!(d ?? m),
              D = M.reduce((e, t) => e + t.endpoints.length, 0);
            return (0, t.jsxs)(t.Fragment, {
              children: [
                (0, t.jsxs)("div", {
                  role: "status",
                  className:
                    "flex min-h-16 items-center border-b border-border px-4 py-4 font-mono text-2xs leading-5 tracking-wide text-muted-foreground uppercase sm:px-6 lg:px-10",
                  children: [
                    _ ? `${M.length} of ${L.length}` : L.length,
                    " ",
                    1 === L.length ? "API" : "APIs",
                    " · ",
                    D,
                    " matching",
                    " ",
                    1 === D ? "endpoint" : "endpoints",
                    j,
                  ],
                }),
                (0, t.jsxs)("div", {
                  className:
                    "relative flex flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:px-10 lg:py-12",
                  children: [
                    (0, t.jsxs)("aside", {
                      "aria-label": "Search filters",
                      className:
                        "grid min-w-0 shrink-0 gap-6 border-b border-border pb-6 text-sm sm:grid-cols-2 lg:block lg:w-56 lg:space-y-8 lg:border-r lg:border-b-0 lg:pr-8 lg:pb-0",
                      children: [
                        S.length > 0 &&
                          (0, t.jsxs)(c.z, {
                            orientation: "vertical",
                            "aria-label": "Category",
                            value: d,
                            onValueChange: u,
                            onRelease: () => u(null),
                            children: [
                              (0, t.jsx)("strong", {
                                className:
                                  "brand-caption mb-3 block font-normal text-muted-foreground",
                                children: "Category",
                              }),
                              S.map(([e, r]) =>
                                (0, t.jsxs)(
                                  c.H,
                                  {
                                    value: e,
                                    variant: "ghost",
                                    size: "sm",
                                    className: (e) =>
                                      (0, x.f)(
                                        "mb-1 h-auto w-full justify-between gap-4 px-3 py-2.5 text-left text-sm font-normal whitespace-normal",
                                        e.pressed
                                          ? "bg-card text-foreground ring-1 ring-border ring-inset"
                                          : "text-muted-foreground",
                                      ),
                                    children: [
                                      y.get(e) ?? e,
                                      " ",
                                      (0, t.jsx)("span", {
                                        className:
                                          "shrink-0 font-mono text-xs tabular-nums",
                                        children: r,
                                      }),
                                    ],
                                  },
                                  e,
                                ),
                              ),
                            ],
                          }),
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("strong", {
                              className:
                                "brand-caption mb-3 block font-normal text-muted-foreground",
                              children: "Price per call",
                            }),
                            z.map(({ label: e }) =>
                              (0, t.jsx)(
                                $,
                                {
                                  label: e,
                                  count: L.filter((t) => I(t, e)).length,
                                  checked: m === e,
                                  onToggle: () => g(m === e ? null : e),
                                },
                                e,
                              ),
                            ),
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsxs)("section", {
                      "aria-label": "Matching APIs",
                      className: "relative min-w-0 flex-1",
                      children: [
                        P,
                        P &&
                          (0, t.jsx)("p", {
                            className:
                              "brand-caption mb-1 text-muted-foreground",
                            children: "Matching endpoints",
                          }),
                        _ &&
                          (0, t.jsxs)("div", {
                            className:
                              "mb-6 flex flex-wrap items-center gap-2 text-xs",
                            children: [
                              (0, t.jsx)("span", {
                                className: "mr-1 text-muted-foreground",
                                children: "Narrowed by",
                              }),
                              d &&
                                (0, t.jsx)(B, {
                                  label: y.get(d) ?? d,
                                  onClear: () => u(null),
                                }),
                              m &&
                                (0, t.jsx)(B, {
                                  label: m,
                                  onClear: () => g(null),
                                }),
                              (0, t.jsx)(i.K, {
                                type: "button",
                                variant: "link",
                                size: "sm",
                                className:
                                  "ml-1 h-auto p-0 text-xs text-foreground",
                                onClick: () => {
                                  (u(null), g(null));
                                },
                                children: "Clear all",
                              }),
                              (0, t.jsxs)("span", {
                                className: "ml-auto text-muted-foreground",
                                children: [L.length, " without filters"],
                              }),
                            ],
                          }),
                        0 === M.length
                          ? (0, t.jsx)("p", {
                              className: "py-8 text-sm text-muted-foreground",
                              children: "No results match these filters.",
                            })
                          : M.map((e) => (0, t.jsx)(T, { result: e }, e.id)),
                      ],
                    }),
                  ],
                }),
              ],
            });
          },
          "SearchSuggestions",
          0,
          function ({ query: e, category: r }) {
            let {
                data: a,
                isPending: n,
                error: i,
              } = (0, b.f)({ ...O(e, r), placeholderData: p.y }),
              o = (a?.results ?? [])
                .flatMap((e) =>
                  e.endpoints.map((t) => ({ result: e, endpoint: t })),
                )
                .sort((e, t) => t.endpoint.score - e.endpoint.score)
                .slice(0, 3),
              l = n
                ? "Searching…"
                : (0, h.w)(i, a)
                  ? "Search is not answering right now."
                  : 0 === o.length
                    ? "Nothing in the catalog matches this yet."
                    : null;
            return (0, t.jsxs)("div", {
              className:
                "animate-in fade-in-0 slide-in-from-top-1 absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl duration-(--motion-ui) ease-(--ease-enter) motion-reduce:animate-none",
              children: [
                a?.named &&
                  (0, t.jsxs)(t.Fragment, {
                    children: [
                      (0, t.jsx)("p", {
                        className:
                          "border-b border-border px-4 py-3 font-mono text-2xs tracking-wide text-muted-foreground uppercase",
                        children: "API",
                      }),
                      (0, t.jsxs)(j.Link, {
                        href: (0, d.f)(a.named),
                        className:
                          "grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-(--motion-fast) ease-(--ease-ui) hover:bg-muted focus-visible:bg-muted focus-visible:outline-none motion-reduce:transition-none",
                        children: [
                          (0, t.jsx)(s.PublisherLogo, { publisher: a.named }),
                          (0, t.jsxs)("span", {
                            className: "min-w-0",
                            children: [
                              (0, t.jsx)("span", {
                                className: "block truncate text-sm font-medium",
                                children: a.named.name,
                              }),
                              (0, t.jsxs)("span", {
                                className:
                                  "mt-1 block truncate text-xs text-muted-foreground",
                                children: [
                                  (0, d.i)(a.named.endpoints),
                                  " · ",
                                  a.named.blurb,
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                (0, t.jsx)("p", {
                  className:
                    "border-b border-border px-4 py-3 font-mono text-2xs tracking-wide text-muted-foreground uppercase",
                  children: "Endpoints",
                }),
                l
                  ? (0, t.jsx)("p", {
                      role: "status",
                      className:
                        "border-b border-border px-4 py-4 text-sm text-muted-foreground",
                      children: l,
                    })
                  : o.map(({ result: a, endpoint: n }) =>
                      (0, t.jsxs)(
                        j.Link,
                        {
                          href: (0, d.C)(a.slug, n.id),
                          onClick: () => {
                            (w.f.capture("api_search_suggestion_selected", {
                              query: e.trim(),
                              surface: "masthead_suggestions",
                            }),
                              f.r.catalog.searchPicked
                                .call({ q: e.trim(), category: r, apiId: a.id })
                                .catch(() => void 0));
                          },
                          className:
                            "grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-(--motion-fast) ease-(--ease-ui) hover:bg-muted focus-visible:bg-muted focus-visible:outline-none motion-reduce:transition-none sm:grid-cols-[40px_minmax(0,1fr)_auto]",
                          children: [
                            (0, t.jsx)(s.PublisherLogo, { publisher: a }),
                            (0, t.jsxs)("span", {
                              className: "min-w-0",
                              children: [
                                (0, t.jsxs)("span", {
                                  className:
                                    "block truncate text-sm font-medium",
                                  children: [a.name, " — ", (0, d.Y)(n)],
                                }),
                                (0, t.jsx)("span", {
                                  className:
                                    "mt-1 block truncate text-xs text-muted-foreground",
                                  children:
                                    n.description ?? `${n.method} ${n.path}`,
                                }),
                              ],
                            }),
                            (0, t.jsx)(g.f, {
                              endpoint: n,
                              className:
                                "col-start-2 items-start text-left sm:col-start-auto sm:items-end sm:text-right",
                            }),
                          ],
                        },
                        n.id,
                      ),
                    ),
                (0, t.jsxs)("div", {
                  className:
                    "flex items-center justify-between gap-4 bg-muted px-4 py-3 text-xs text-muted-foreground",
                  children: [
                    (0, t.jsxs)(j.Link, {
                      href: m(e, r),
                      className: "flex items-center gap-2",
                      children: [
                        (0, t.jsx)("kbd", {
                          className:
                            "rounded-sm border border-border bg-popover px-1.5 py-0.5 font-mono text-2xs text-popover-foreground",
                          children: "Enter",
                        }),
                        a
                          ? `See all ${a.results.length} results`
                          : "See all results",
                      ],
                    }),
                    (0, t.jsx)("span", {
                      className: "hidden text-right text-2xs lg:block",
                      children: "Same ranking over MCP",
                    }),
                  ],
                }),
              ],
            });
          },
        ],
        86275,
      );
    },
  ],
  [
    [103697, 655667, 124247],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(335335),
        n = e.i(438061),
        i = e.i(297819),
        a = e.i(768877),
        o = e.i(84449),
        s = e.i(758925),
        l = e.i(578171),
        c = e.i(980799),
        d = e.i(368356),
        f = e.i(519455),
        u = e.i(337822),
        g = e.i(230975),
        m = e.i(975157);
      function p() {
        return (0, t.jsx)("span", {
          className:
            "border border-border px-[7px] py-px font-mono text-2xs tracking-[0.06em] text-foreground uppercase",
          children: "Listed by Orthogonal",
        });
      }
      let h = [
        [l.f, "Choose which endpoints agents can call"],
        [c.f, "Set the price of each call"],
        [s.f, "Run it on your own API key, and replace it anytime"],
        [o.f, "Get paid out for the calls it serves"],
      ];
      function x({ slug: e, site: r }) {
        let { isSignedIn: n } = (0, i.f)(),
          o = (0, g.u)("/account/listings", { publisher: e }),
          s = n ? o : (0, g.D)(o);
        return (0, t.jsxs)(u.V, {
          children: [
            (0, t.jsx)(u.J, {
              render: (0, t.jsx)(f.K, {
                size: "sm",
                className: "font-sans sm:ml-2",
                children: "Become the publisher",
              }),
            }),
            (0, t.jsxs)(u.T, {
              align: "start",
              sideOffset: 8,
              className:
                "w-[min(400px,calc(100vw-32px))] gap-0 rounded-menu p-5",
              children: [
                (0, t.jsx)(u.q, {
                  className: "text-base font-medium tracking-[-0.01em]",
                  children: "This listing has no publisher yet",
                }),
                (0, t.jsxs)(u.E, {
                  className: "mt-2 text-sm leading-[1.45]",
                  children: [
                    "Orthogonal runs it for now. Providers manage their own APIs here, and the team behind ",
                    r ?? "this API",
                    " can take this one over.",
                  ],
                }),
                (0, t.jsx)("p", {
                  className:
                    "mt-5 font-mono text-2xs tracking-[0.06em] text-muted-foreground uppercase",
                  children: "As its publisher you",
                }),
                (0, t.jsx)("ul", {
                  className: "mt-2 border-t border-border",
                  children: h.map(([e, r]) =>
                    (0, t.jsxs)(
                      "li",
                      {
                        className:
                          "flex items-start gap-3 border-b border-border py-2.5 text-sm leading-5",
                        children: [
                          (0, t.jsx)(e, {
                            "aria-hidden": "true",
                            className:
                              "mt-0.5 size-4 shrink-0 text-muted-foreground",
                          }),
                          r,
                        ],
                      },
                      r,
                    ),
                  ),
                }),
                (0, t.jsx)("p", {
                  className:
                    "mt-4 text-sm leading-[1.45] text-muted-foreground",
                  children:
                    "Create an account, confirm the listing details and add your key. Our team reviews it, then it’s yours to manage.",
                }),
                (0, t.jsxs)(d.Link, {
                  href: s,
                  className: (0, m.f)((0, f.i)({ size: "lg" }), "mt-5 w-full"),
                  children: [
                    "Become the publisher",
                    (0, t.jsx)(a.f, {
                      "aria-hidden": "true",
                      "data-icon": "inline-end",
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
      function b({ mark: e, color: r, name: n, size: i }) {
        return (0, t.jsxs)("svg", {
          width: i,
          height: i,
          viewBox: "0 0 18 18",
          "aria-hidden": "true",
          children: [
            "square" === e &&
              (0, t.jsx)("rect", {
                x: "2",
                y: "2",
                width: "14",
                height: "14",
                rx: "3",
                fill: r,
              }),
            "circle" === e &&
              (0, t.jsx)("circle", { cx: "9", cy: "9", r: "7", fill: r }),
            "ring" === e &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsx)("circle", {
                    cx: "9",
                    cy: "9",
                    r: "6.5",
                    fill: "none",
                    stroke: r,
                    strokeWidth: "2.4",
                  }),
                  (0, t.jsx)("circle", { cx: "9", cy: "9", r: "2", fill: r }),
                ],
              }),
            "diamond" === e &&
              (0, t.jsx)("polygon", {
                points: "9,1.5 16.5,9 9,16.5 1.5,9",
                fill: r,
              }),
            "target" === e &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsx)("circle", { cx: "9", cy: "9", r: "7", fill: r }),
                  (0, t.jsx)("circle", {
                    cx: "9",
                    cy: "9",
                    r: "2.5",
                    fill: "#fff",
                  }),
                ],
              }),
            "pill" === e &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsx)("rect", {
                    x: "2",
                    y: "2",
                    width: "14",
                    height: "14",
                    rx: "7",
                    fill: r,
                  }),
                  (0, t.jsx)("rect", {
                    x: "6",
                    y: "6",
                    width: "6",
                    height: "6",
                    rx: "1",
                    fill: "#fff",
                  }),
                ],
              }),
            "triangle" === e &&
              (0, t.jsx)("polygon", {
                points: "3,15.5 9,2.5 15,15.5",
                fill: r,
              }),
            "letter" === e &&
              (0, t.jsxs)(t.Fragment, {
                children: [
                  (0, t.jsx)("rect", {
                    x: "2.5",
                    y: "2.5",
                    width: "13",
                    height: "13",
                    rx: "2",
                    fill: r,
                  }),
                  (0, t.jsx)("text", {
                    x: "9",
                    y: "13",
                    textAnchor: "middle",
                    fontSize: "9",
                    fontWeight: "700",
                    fill: "#fff",
                    fontFamily: "var(--font-mono)",
                    children: n[0],
                  }),
                ],
              }),
          ],
        });
      }
      function v({ publisher: e }) {
        let r = e.endpoints.length;
        return (0, t.jsxs)("div", {
          className:
            "flex flex-col gap-4 rounded-panel-lg bg-card p-6 ring-1 ring-border ring-inset",
          children: [
            (0, t.jsx)("p", {
              className: "text-[17px] leading-[1.45] tracking-[-0.01em]",
              children:
                1 === r
                  ? `Call this ${e.name} endpoint with one Orthogonal key. Its price is in its row.`
                  : `Call all ${r} ${e.name} endpoints with one Orthogonal key. Each one's price is in its row.`,
            }),
            (0, t.jsxs)(d.Link, {
              href: "/account/keys",
              className: (0, m.f)(
                (0, f.i)({ variant: "outline", size: "2xl" }),
                "font-mono text-xs tracking-[0.06em] uppercase",
              ),
              children: [
                (0, t.jsx)(s.f, { "aria-hidden": !0 }),
                "Get your key",
              ],
            }),
          ],
        });
      }
      var y = e.i(769809);
      function j(e) {
        let t = e.type.toLowerCase(),
          r = t.startsWith("integer") || t.startsWith("number"),
          n = r
            ? (function (e) {
                let t = e?.match(/\b(\d+)\s*[-–]\s*(\d+)\b/);
                if (!t) return;
                let [r, n] = [Number(t[1]), Number(t[2])];
                return r < n ? { min: r, max: n } : void 0;
              })(e.description)
            : void 0,
          i = [
            e.example,
            e.defaultValue,
            e.enum?.[0],
            (function (e) {
              if (e)
                for (let t of k) {
                  let r = e.match(t),
                    n = r
                      ?.slice(1)
                      .find((e) => void 0 !== e)
                      ?.split(
                        /\.\s|\s(?:from|or|and|not|in|to|for|with|of)\s/,
                      )[0]
                      ?.replace(/^[\x60'"]+|[\x60'".:]+$/g, "")
                      .trim();
                  if (n && !/^[[{]/.test(n)) return n;
                }
            })(e.description),
            n?.min,
          ].find(
            (e) =>
              null != e &&
              "" !== e &&
              !(r && !Number.isFinite(Number(e))) &&
              !(n && Number(e) === n.max),
          );
        if ("null" === t) return null;
        if ("array" === t || t.endsWith("[]")) {
          if (Array.isArray(i)) return i;
          let t = N(e.children);
          return t ? [t] : [];
        }
        if (!0 === e.isArray)
          return Array.isArray(i) ? i : [j({ ...e, isArray: !1 })];
        if (t.startsWith("object"))
          return i && "object" == typeof i && !Array.isArray(i)
            ? i
            : (N(e.children) ?? {});
        if (r) {
          let e = "number" == typeof i ? i : Number(i);
          return void 0 !== i && Number.isFinite(e) ? e : 1;
        }
        return "boolean" === t
          ? "boolean" != typeof i || i
          : "string" == typeof i || "number" == typeof i
            ? String(i)
            : `{${e.name}}`;
      }
      let C = String.raw`(?:\x60([^\x60\n]{1,200})\x60|'([^'\n]{1,200})'|"([^"\n]{1,200})"|([^\s,;()|]+(?: [^\s,;()|]+){0,3}))`,
        w = String.raw`\x60?(?:[a-z0-9][\w.:+\-/]*|[A-Z0-9][A-Z0-9_]+)\x60?`,
        k = [
          RegExp(
            String.raw`(?:\be\.g\.|\bfor example\b|\bexamples?\**\s*:)\**\s*[,:]?\s*(?:[-*]\s+)?${C}`,
            "i",
          ),
          RegExp(
            String.raw`\b(?:one of|allowed|options|(?:accepted|valid|possible) values)\s*:\s*${C}`,
            "i",
          ),
          new RegExp(
            String.raw`:\s+(${w})(?:,\s*${w})*,?\s+or\s+${w}(?![\w-])`,
          ),
        ];
      function N(e) {
        if (!e?.length) return;
        let t = e.filter((e) => e.required);
        return Object.fromEntries(
          (t.length > 0 ? t : e).map((e) => [e.name, j(e)]),
        );
      }
      function M(e, t = new Set(), r) {
        let n = (e, r) =>
            Object.fromEntries(
              e
                .filter((e) => e.required || t.has(e.name))
                .map((e) => [
                  e.name,
                  r && Object.hasOwn(r, e.name) ? r[e.name] : j(e),
                ]),
            ),
          i = n(e.queryParams, r?.query),
          a = n(e.bodyParams, S(r?.body));
        return {
          ...(Object.keys(i).length > 0 && { query: i }),
          ...(["POST", "PUT", "PATCH", "DELETE"].includes(e.method) &&
            Object.keys(a).length > 0 && {
              body: "array" === e.bodyType ? [a] : a,
            }),
        };
      }
      function S(e) {
        let t = Array.isArray(e) ? e[0] : e;
        return O(t) ? t : void 0;
      }
      let $ = /\{[^}]+\}/;
      function O(e) {
        return "object" == typeof e && null !== e && !Array.isArray(e);
      }
      function E(e) {
        return JSON.stringify({ success: !0, data: e }, null, 2).split("\n");
      }
      function P(e) {
        return "object" == typeof e && null !== e;
      }
      function z(e, t) {
        return Array.isArray(e) ? e[Number(t)] : e[t];
      }
      function A(e, t, r) {
        Array.isArray(e) ? (e[Number(t)] = r) : (e[t] = r);
      }
      function T({ endpoint: e }) {
        let { query: r, body: n } = M(e),
          i = {
            api: e.callSlug,
            path: e.path,
            ...("GET" !== e.method && { method: e.method }),
            ...(r && { query: r }),
            ...(n && { body: n }),
          },
          a = `const result = await orth.run(${JSON.stringify(i, null, 2)});`,
          o = (e) =>
            /^[\w@%+=:,./-]+$/.test(e) ? e : `'${e.replaceAll("'", "'\\''")}'`,
          s = [
            `orth run ${o(e.callSlug)} ${o(e.path)}`,
            ...("GET" !== e.method ? [`-X ${o(e.method)}`] : []),
            ...Object.entries(r ?? {}).map(
              ([e, t]) =>
                `-q ${o(`${e}=${encodeURIComponent("string" == typeof t ? t : JSON.stringify(t))}`)}`,
            ),
            ...(n ? [`-d ${o(JSON.stringify(n))}`] : []),
          ].join(" \\\n  ");
        return (0, t.jsxs)("div", {
          className: "min-w-0",
          children: [
            (0, t.jsx)("h2", {
              className:
                "mb-3 text-xl leading-6 font-normal tracking-[-0.02em]",
              children: "Quickstart",
            }),
            (0, t.jsxs)("p", {
              className:
                "mb-4 font-mono text-xs leading-5 break-all text-muted-foreground",
              children: [
                e.memberName && `${e.memberName} \xb7 `,
                e.method,
                " ",
                e.path,
              ],
            }),
            (0, t.jsx)(y.v, {
              lines: { SDK: a.split("\n"), CLI: s.split("\n") },
            }),
          ],
        });
      }
      e.s(
        [
          "N",
          0,
          $,
          "z",
          0,
          M,
          "p",
          0,
          function (e) {
            return 0 === e.length
              ? null
              : E(
                  (function (e) {
                    let t = {};
                    for (let r of e) {
                      let e = r.name.split("."),
                        n = t;
                      for (let [t, i] of e.entries()) {
                        let a = "0" === i;
                        if (Array.isArray(n) !== a) break;
                        if (t === e.length - 1) {
                          P(z(n, i)) || A(n, i, j({ ...r, name: i }));
                          break;
                        }
                        let o = e[t + 1] ?? "",
                          s = z(n, i);
                        if (P(s)) n = s;
                        else {
                          let e = "0" === o ? [] : {};
                          (A(n, i, e), (n = e));
                        }
                      }
                    }
                    return t;
                  })(e),
                );
          },
          "U",
          0,
          j,
          "O",
          0,
          function (e) {
            let t,
              r = e.indexOf("-d '"),
              n = e.lastIndexOf("'");
            if (r < 0 || n <= r + 4) return null;
            try {
              t = JSON.parse(e.slice(r + 4, n).replaceAll("'\\''", "'"));
            } catch {
              return null;
            }
            if (!O(t)) return null;
            let { api: i, path: a, query: o, body: s } = t;
            return "string" != typeof i || "string" != typeof a
              ? null
              : {
                  api: i,
                  path: a,
                  ...(O(o) && {
                    query: Object.fromEntries(
                      Object.entries(o).map(([e, t]) => [
                        e,
                        "string" == typeof t ? t : JSON.stringify(t),
                      ]),
                    ),
                  }),
                  ...((O(s) || Array.isArray(s)) && { body: s }),
                };
          },
          "b",
          0,
          function e(t) {
            if ("string" == typeof t)
              return /^\{[^}]+\}$/.test(t.trim()) ? t.trim() : void 0;
            for (let r of Array.isArray(t) ? t : O(t) ? Object.values(t) : []) {
              let t = e(r);
              if (t) return t;
            }
          },
          "c",
          0,
          function (e, t, r, n, i) {
            let a = {
                api: e,
                path: i?.path ?? t.path,
                method: t.method,
                ...M(t, n, i),
              },
              o = $.test(t.path),
              s = JSON.stringify(a, null, 2)
                .replaceAll("'", "'\\''")
                .split("\n");
            return [
              { text: `curl -X POST ${r.api}/run \\`, editable: !1 },
              {
                text: "  -H 'Authorization: Bearer orth_live_••••' \\",
                editable: !1,
              },
              {
                text: "  -H 'Content-Type: application/json' \\",
                editable: !1,
              },
              ...s.map((e, t) => ({
                text:
                  0 === t
                    ? `  -d '${e}`
                    : `  ${e}${t === s.length - 1 ? "'" : ""}`,
                editable: /^ {4}/.test(e) || (o && /^ {2}"path"/.test(e)),
              })),
            ];
          },
          "G",
          0,
          E,
          "F",
          0,
          function (e, t) {
            if (!t) return [];
            let r = (e, t) => {
              let r = S(t);
              return e
                .filter((e) => !e.required && r && Object.hasOwn(r, e.name))
                .map((e) => e.name);
            };
            return [
              ...new Set([
                ...r(e.queryParams, t.query),
                ...r(e.bodyParams, t.body),
              ]),
            ];
          },
        ],
        655667,
      );
      var F = e.i(718687),
        R = e.i(478610),
        I = e.i(984452);
      let L = {
          olostep: {
            image: new URL("../assets/logos/olostep.jpg?no-inline", import.meta.url).href,
            bgColor: "#635bff",
          },
          precip: {
            image: new URL("../assets/logos/precip.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          scrapegraph: {
            image: new URL("../assets/logos/scrapegraph.svg?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          scrapecreators: {
            image: new URL(
              "../assets/logos/scrapecreators.png?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#000000",
          },
          riveter: {
            image: new URL("../assets/logos/riveter.jpeg?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          andi: {
            image: new URL("../assets/logos/andi.jpg?no-inline", import.meta.url).href,
            bgColor: "#06090f",
          },
          linkup: {
            image: new URL(
              "../assets/logos/linkup_platform_logo.jpeg?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#000000",
          },
          fiber: {
            image: new URL("../assets/logos/fiber.png?no-inline", import.meta.url).href,
            bgColor: "#efefef",
          },
          sixtyfour: {
            image: new URL("../assets/logos/sixtyfour.png?no-inline", import.meta.url)
              .href,
            bgColor: "#000000",
          },
          "brand.dev": {
            image: new URL(
              "../assets/logos/brand_dev_logo.webp?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
          },
          didit: {
            image: new URL(
              "../assets/logos/didit_logo_alone.jpg?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
          },
          dome: {
            image: new URL("../assets/logos/dome.jpg?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          valyu: {
            image: new URL("../assets/logos/valyu.jpg?no-inline", import.meta.url).href,
            bgColor: "#febb53",
          },
          hunter: {
            image: new URL("../assets/logos/hunter.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          searchapi: {
            image: new URL("../assets/logos/searchapi.jpg?no-inline", import.meta.url)
              .href,
            bgColor: "#5046e5",
          },
          nyne: {
            image: new URL("../assets/logos/nyne.png?no-inline", import.meta.url).href,
            bgColor: "#274236",
          },
          tomba: {
            image: new URL("../assets/logos/tomba.png?no-inline", import.meta.url).href,
            bgColor: "#011671",
            fill: !0,
          },
          mixedbread: {
            image: new URL("../assets/logos/mixedbread.jpg?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          apollo: {
            image: new URL("../assets/logos/apollo.png?no-inline", import.meta.url).href,
            bgColor: "#fdd03e",
          },
          "fantastic-jobs": {
            image: new URL(
              "../assets/logos/fantastic-jobs.jpg?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
            fill: !0,
          },
          jina: {
            image: new URL("../assets/logos/jina.png?no-inline", import.meta.url).href,
            bgColor: "#000000",
          },
          parallel: {
            image: new URL("../assets/logos/parallel.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          exa: {
            image: new URL("../assets/logos/exa.png?no-inline", import.meta.url).href,
            bgColor: "#1e40eb",
          },
          tavus: {
            image: new URL("../assets/logos/tavus.jpg?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          "logo.dev": {
            image: new URL("../assets/logos/logo-dev.svg?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          tavily: {
            image: new URL("../assets/logos/tavily.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          perplexity: {
            image: new URL("../assets/logos/perplexity.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          textbelt: {
            image: new URL("../assets/logos/textbelt.png?no-inline", import.meta.url)
              .href,
            bgColor: "#6435c9",
          },
          notte: {
            image: new URL("../assets/logos/notte-api.png?no-inline", import.meta.url)
              .href,
            bgColor: "#000000",
          },
          baseten: {
            image: new URL("../assets/logos/baseten.png?no-inline", import.meta.url).href,
            bgColor: "#17d766",
          },
          coresignal: {
            image: new URL("../assets/logos/coresignal.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          openmart: {
            image: new URL("../assets/logos/openmart.png?no-inline", import.meta.url)
              .href,
            bgColor: "#7ac5fe",
          },
          aviato: {
            image: new URL("../assets/logos/aviato.png?no-inline", import.meta.url).href,
            bgColor: "#000000",
          },
          predictleads: {
            image: new URL("../assets/logos/predictleads.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          rocketreach: {
            image: new URL("../assets/logos/rocketreach.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          bytemine: {
            image: new URL("../assets/logos/bytemine.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          peopledatalabs: {
            image: new URL(
              "../assets/logos/peopledatalabs.png?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
          },
          "ocean-io": {
            image: new URL("../assets/logos/ocean-io.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          contactout: {
            image: new URL("../assets/logos/contactout.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          tako: {
            image: new URL("../assets/logos/tako.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          crustdata: {
            image: new URL("../assets/logos/crustdata.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          agentmail: {
            image: new URL("../assets/logos/agentmail.png?no-inline", import.meta.url)
              .href,
            bgColor: "#18181b",
          },
          "influencers-club": {
            image: new URL(
              "../assets/logos/influencers-club.png?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
          },
          fundable: {
            image: new URL("../assets/logos/fundable.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          serper: {
            image: new URL("../assets/logos/serper.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          "serper-scrape": {
            image: new URL("../assets/logos/serper.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          captaindata: {
            image: new URL("../assets/logos/captaindata.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          edges: {
            image: new URL("../assets/logos/edges.png?no-inline", import.meta.url).href,
            bgColor: "#0f0f13",
          },
          agentphone: {
            image: new URL("../assets/logos/agentphone.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          "context.dev": {
            image: new URL("../assets/logos/contextdev.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          seltz: {
            image: new URL("../assets/logos/seltz.png?no-inline", import.meta.url).href,
            bgColor: "#0a1628",
          },
          voygr: {
            image: new URL("../assets/logos/voygr.png?no-inline", import.meta.url).href,
            bgColor: "#6ff5ff",
          },
          openfunnel: {
            image: new URL("../assets/logos/openfunnel.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          happenstance: {
            image: new URL("../assets/logos/happenstance.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          "company-enrich": {
            image: new URL("../assets/logos/companyenrich.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          "you-com": {
            image: new URL("../assets/logos/you-com.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          icypeas: {
            image: new URL("../assets/logos/icypeas.png?no-inline", import.meta.url).href,
            bgColor: "#0f0f16",
          },
          mpp: {
            image: new URL("../assets/logos/tempo.png?no-inline", import.meta.url).href,
            bgColor: "#000000",
          },
          findymail: {
            image: new URL("../assets/logos/findymail.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          "join-massive": {
            image: new URL("../assets/logos/massive.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          signalbase: {
            image: new URL("../assets/logos/signalbase.png?no-inline", import.meta.url)
              .href,
            bgColor: "#fff7ed",
          },
          abstractapi: {
            image: new URL("../assets/logos/abstractapi.png?no-inline", import.meta.url)
              .href,
            bgColor: "#0f0f16",
          },
          leadsforge: {
            image: new URL("../assets/logos/leadsforge.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          smolmachines: {
            image: new URL("../assets/logos/smolmachines.svg?no-inline", import.meta.url)
              .href,
            bgColor: "#555555",
          },
          allmodels: {
            image: new URL("../assets/logos/allmodels.png?no-inline", import.meta.url)
              .href,
            bgColor: "#18181a",
          },
          openrouter: {
            image: new URL("../assets/logos/openrouter.svg?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          fullenrich: {
            image: new URL("../assets/logos/fullenrich.png?no-inline", import.meta.url)
              .href,
            bgColor: "#ffffff",
          },
          "financial-datasets": {
            image: new URL(
              "../assets/logos/financial-datasets.png?no-inline",
              import.meta.url,
            ).href,
            bgColor: "#ffffff",
          },
          "extruct-ai": {
            image: new URL("../assets/logos/extruct.png?no-inline", import.meta.url).href,
            bgColor: "#ffffff",
          },
          "akta-pro": {
            image: new URL("../assets/logos/akta.png?no-inline", import.meta.url).href,
            bgColor: "#0e0f0f",
          },
          tinyfish: {
            image: new URL("../assets/logos/tinyfish-icon.svg?no-inline", import.meta.url)
              .href,
            bgColor: "#fffaf4",
          },
          zai: {
            image:
              "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://z.ai&size=128",
            bgColor: "#ffffff",
          },
          openai: {
            image:
              "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://openai.com&size=128",
            bgColor: "#ffffff",
          },
          elevenlabs: {
            image:
              "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://elevenlabs.io&size=128",
            bgColor: "#ffffff",
          },
          "nano-banana": {
            image:
              "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ai.google.dev&size=128",
            bgColor: "#ffffff",
          },
          "nano-banana-2": {
            image:
              "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ai.google.dev&size=128",
            bgColor: "#ffffff",
          },
        },
        D = (e) => e.toLowerCase().replace(/[\s\-_.]/g, "");
      function U(e) {
        let t = D(e.name),
          r = D(e.slug),
          n = Object.entries(L).find(([e]) => {
            let n = D(e);
            return n && (t.includes(n) || r.includes(n));
          })?.[1],
          i = I.z.url({ protocol: /^https$/ }).safeParse(e.imageUrl);
        return i.success
          ? n?.bgColor
            ? { image: i.data, bgColor: n.bgColor }
            : { image: i.data }
          : (n ?? null);
      }
      e.s(["f", 0, U], 124247);
      var B = e.i(375775),
        _ = e.i(867927),
        q = e.i(325164),
        G = e.i(271645);
      let V = {
          card: { box: "size-10 rounded-lg", logo: "size-[26px]", mark: 18 },
          related: { box: "size-9 rounded-lg", logo: "size-[23px]", mark: 16 },
          header: {
            box: "size-14 rounded-lg sm:size-16",
            logo: "size-10",
            mark: 30,
          },
          row: { box: "size-[72px] rounded-xl", logo: "size-[46px]", mark: 30 },
          shelf: { box: "h-24 w-full rounded-md", logo: "size-12", mark: 28 },
          feature: {
            box: "h-[132px] w-full rounded-md",
            logo: "size-16",
            mark: 36,
          },
          spotlight: {
            box: "size-36 rounded-lg",
            logo: "size-[104px]",
            mark: 72,
          },
          call: { box: "size-7 rounded-md", logo: "size-5", mark: 14 },
        },
        W = {
          related: { box: "size-9 rounded-lg", logo: "size-[26px]", mark: 16 },
          header: { box: "size-12 rounded-lg", logo: "size-[34px]", mark: 26 },
          row: { box: "size-16 rounded-lg", logo: "size-[46px]", mark: 30 },
          spotlight: {
            box: "size-32 rounded-lg",
            logo: "size-[92px]",
            mark: 64,
          },
        };
      function Y({ publisher: e, size: r = "card", well: n = !1 }) {
        let i = U(e),
          a = n ? W[r] : void 0,
          { box: o, logo: s, mark: l } = a ?? V[r],
          c = (0, t.jsx)("span", {
            className: (0, m.f)(
              "flex shrink-0 items-center justify-center overflow-hidden border border-border",
              o,
            ),
            style: { background: i?.bgColor ?? "#ffffff" },
            children: i
              ? (0, t.jsx)(q.default, {
                  src: i.image,
                  alt: "",
                  width: 100,
                  height: 100,
                  className: i.fill
                    ? "size-full object-cover"
                    : (0, m.f)("object-contain", s),
                })
              : (0, t.jsx)(b, { ...(0, F.l)(e.slug), name: e.name, size: l }),
          });
        return a
          ? (0, t.jsx)("span", {
              className:
                "grid shrink-0 place-items-center rounded-panel-lg bg-[var(--logo-well,var(--surface))] p-2 ring-1 ring-border ring-inset",
              children: c,
            })
          : c;
      }
      let H =
        "grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12";
      function K({ publisher: e, endpoint: i, category: a }) {
        let o = i ? (0, F.Y)(i) : e.name;
        return (0, t.jsxs)(r.f, {
          field: (0, t.jsx)(n.BrandField, { logo: U(e) }),
          children: [
            (0, t.jsxs)("div", {
              className: "md:w-[58%]",
              children: [
                (0, t.jsxs)("nav", {
                  "aria-label": "Breadcrumb",
                  className:
                    "mb-7 flex min-w-0 flex-wrap items-center gap-2.5 font-mono text-xs tracking-[0.06em] text-muted-foreground uppercase",
                  children: [
                    (0, t.jsx)(d.Link, {
                      href: "/catalog",
                      className:
                        "underline-offset-4 hover:text-foreground hover:underline",
                      children: "Catalog",
                    }),
                    (0, t.jsx)(_.f, { className: "size-3", "aria-hidden": !0 }),
                    !i && a
                      ? (0, t.jsxs)(t.Fragment, {
                          children: [
                            (0, t.jsx)(d.Link, {
                              href: (0, F.j)(a.slug),
                              className:
                                "underline-offset-4 hover:text-foreground hover:underline",
                              children: a.name,
                            }),
                            (0, t.jsx)(_.f, {
                              className: "size-3",
                              "aria-hidden": !0,
                            }),
                          ],
                        })
                      : null,
                    i
                      ? (0, t.jsxs)(t.Fragment, {
                          children: [
                            (0, t.jsx)(d.Link, {
                              href: (0, F.f)(e),
                              className:
                                "underline-offset-4 hover:text-foreground hover:underline",
                              children: e.name,
                            }),
                            (0, t.jsx)(_.f, {
                              className: "size-3",
                              "aria-hidden": !0,
                            }),
                          ],
                        })
                      : null,
                    (0, t.jsx)("span", {
                      "aria-current": "page",
                      className: "text-foreground",
                      children: o,
                    }),
                  ],
                }),
                (0, t.jsxs)("div", {
                  className: "flex items-start gap-4 sm:gap-5",
                  children: [
                    (0, t.jsx)(Y, { publisher: e, size: "header", well: !0 }),
                    (0, t.jsxs)("div", {
                      className: "min-w-0 flex-1",
                      children: [
                        (0, t.jsx)("h1", {
                          className:
                            "text-brand-title font-normal tracking-[-0.035em] break-words",
                          children: o,
                        }),
                        i &&
                          (0, t.jsxs)("p", {
                            className:
                              "mt-4 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2",
                            children: [
                              (0, t.jsx)("span", {
                                className:
                                  "rounded-glyph bg-foreground px-2 py-1 font-mono text-xs leading-4 tracking-[0.08em] text-background uppercase",
                                children: i.method,
                              }),
                              (0, t.jsx)("code", {
                                className:
                                  "min-w-0 font-mono text-lg leading-6 tracking-[-0.01em] break-all text-foreground sm:text-xl",
                                children: i.path,
                              }),
                            ],
                          }),
                        (0, t.jsxs)("div", {
                          className:
                            "mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs leading-4 tracking-[0.06em] text-muted-foreground",
                          children: [
                            e.verified
                              ? (0, t.jsx)("span", {
                                  className:
                                    "bg-foreground px-[7px] py-0.5 text-2xs text-background uppercase",
                                  children: "Verified",
                                })
                              : e.listedByOrthogonal
                                ? (0, t.jsx)(p, {})
                                : null,
                            e.reliable &&
                              (0, t.jsx)("span", {
                                className:
                                  "border border-border px-[7px] py-px text-2xs text-foreground uppercase",
                                children: "Reliable",
                              }),
                            i
                              ? (0, t.jsx)(t.Fragment, {
                                  children: (0, t.jsxs)("span", {
                                    children: [
                                      "Published by",
                                      " ",
                                      (0, t.jsx)(d.Link, {
                                        href: (0, F.f)(e),
                                        className:
                                          "text-foreground hover:underline",
                                        children: e.name,
                                      }),
                                    ],
                                  }),
                                })
                              : (0, t.jsx)("span", {
                                  className: "uppercase",
                                  children: (0, F.i)(e.endpoints.length),
                                }),
                            i?.docsUrl
                              ? (0, t.jsxs)("a", {
                                  href: i.docsUrl,
                                  target: "_blank",
                                  rel: "noreferrer",
                                  className:
                                    "inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline",
                                  children: [
                                    "Publisher docs ",
                                    (0, t.jsx)(B.f, {
                                      className: "size-3",
                                      "aria-hidden": !0,
                                    }),
                                  ],
                                })
                              : i
                                ? null
                                : (0, t.jsxs)("a", {
                                    href: `/discover/${encodeURIComponent(e.slug)}/skill.md`,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className:
                                      "inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline",
                                    children: [
                                      "skill.md (for agents)",
                                      " ",
                                      (0, t.jsx)(B.f, {
                                        className: "size-3",
                                        "aria-hidden": !0,
                                      }),
                                    ],
                                  }),
                            !i &&
                              !e.verified &&
                              e.listedByOrthogonal &&
                              (0, t.jsx)(x, {
                                slug: e.slug,
                                site: e.publisherSite ?? null,
                              }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            !i &&
              e.description &&
              (0, t.jsx)("div", {
                className: (0, m.f)("mt-5", H),
                children: (0, t.jsx)("p", {
                  className: "text-[17px] leading-[1.45] text-muted-foreground",
                  children: e.description,
                }),
              }),
          ],
        });
      }
      e.s(
        [
          "ApiMasthead",
          0,
          K,
          "PublisherLogo",
          0,
          Y,
          "Storefront",
          0,
          function ({ publisher: e, category: r, neighbours: n }) {
            let [i, o] = (0, G.useState)(null),
              s =
                e.endpoints.find((e) => e.id === i) ??
                e.endpoints.find((e) => "GET" === e.method) ??
                e.endpoints[0];
            return (0, t.jsxs)(t.Fragment, {
              children: [
                (0, t.jsx)(K, { publisher: e, category: r }),
                (0, t.jsxs)("section", {
                  className: "page-column px-4 py-8 sm:px-6 lg:px-10 lg:py-12",
                  children: [
                    (0, t.jsx)("h2", {
                      className:
                        "text-xl leading-6 font-normal tracking-[-0.02em]",
                      children: (0, F.i)(e.endpoints.length),
                    }),
                    0 === e.endpoints.length
                      ? (0, t.jsx)("p", {
                          className: "mt-4 text-sm text-muted-foreground",
                          children: "No endpoints listed yet.",
                        })
                      : (0, t.jsxs)("div", {
                          className: (0, m.f)("mt-5 items-start", H),
                          children: [
                            (0, t.jsxs)("div", {
                              className:
                                "min-w-0 overflow-hidden rounded-lg border border-border",
                              children: [
                                (0, t.jsxs)("div", {
                                  className:
                                    "flex items-center gap-4 bg-muted px-4 py-3 font-mono text-2xs tracking-[0.04em] text-muted-foreground uppercase sm:px-5",
                                  children: [
                                    (0, t.jsx)("span", {
                                      className: "flex-1",
                                      children: "Endpoint",
                                    }),
                                    (0, t.jsx)("span", {
                                      className:
                                        "hidden shrink-0 text-right sm:block",
                                      children: "Price",
                                    }),
                                  ],
                                }),
                                e.endpoints.map((r) =>
                                  (0, t.jsxs)(
                                    "div",
                                    {
                                      onMouseEnter: () => o(r.id),
                                      className: (0, m.f)(
                                        "flex flex-col gap-2 border-t border-border px-4 py-4 transition-colors duration-(--motion-fast) ease-(--ease-ui) sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                                        s?.id === r.id && "bg-muted",
                                      ),
                                      children: [
                                        (0, t.jsxs)("div", {
                                          className:
                                            "flex min-w-0 flex-1 flex-col gap-0.5",
                                          children: [
                                            (0, t.jsxs)(d.Link, {
                                              href: (0, F.C)(e.slug, r.id),
                                              onFocus: () => o(r.id),
                                              className:
                                                "text-sm leading-5 font-medium break-words underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                                              children: [
                                                r.memberName &&
                                                  (0, t.jsxs)("span", {
                                                    className:
                                                      "text-muted-foreground",
                                                    children: [
                                                      r.memberName,
                                                      ":",
                                                      " ",
                                                    ],
                                                  }),
                                                r.name ??
                                                  (0, t.jsxs)("span", {
                                                    className:
                                                      "font-mono text-[13px] font-normal break-all",
                                                    children: [
                                                      r.method,
                                                      " ",
                                                      r.path,
                                                    ],
                                                  }),
                                              ],
                                            }),
                                            r.name
                                              ? (0, t.jsxs)("span", {
                                                  className:
                                                    "font-mono text-[11px] leading-5 break-all text-muted-foreground",
                                                  children: [
                                                    r.method,
                                                    " ",
                                                    r.path,
                                                  ],
                                                })
                                              : r.description &&
                                                (0, t.jsx)("span", {
                                                  className:
                                                    "line-clamp-2 text-[13px] leading-5 text-muted-foreground",
                                                  children: r.description,
                                                }),
                                          ],
                                        }),
                                        (0, t.jsx)(R.f, {
                                          endpoint: r,
                                          className:
                                            "items-start text-left leading-5 tabular-nums sm:items-end sm:text-right",
                                        }),
                                      ],
                                    },
                                    r.id,
                                  ),
                                ),
                              ],
                            }),
                            (0, t.jsxs)("aside", {
                              className:
                                "flex min-w-0 flex-col gap-8 lg:sticky lg:top-24",
                              children: [
                                (0, t.jsx)(v, { publisher: e }),
                                s && (0, t.jsx)(T, { endpoint: s }),
                              ],
                            }),
                          ],
                        }),
                  ],
                }),
                r &&
                  n.length > 0 &&
                  (0, t.jsx)("section", {
                    className: "page-column px-4 sm:px-6 lg:px-10",
                    "aria-label": `More in ${r.name}`,
                    children: (0, t.jsxs)("div", {
                      className: "border-t border-border py-14",
                      children: [
                        (0, t.jsxs)("h2", {
                          className:
                            "mb-6 text-[32px] leading-[1.1] font-normal tracking-[-0.025em]",
                          children: ["More in ", r.name],
                        }),
                        (0, t.jsx)("ul", {
                          className:
                            "grid border-t border-l border-border lg:grid-cols-3",
                          children: n.map((e) =>
                            (0, t.jsx)(
                              "li",
                              {
                                children: (0, t.jsxs)(d.Link, {
                                  href: (0, F.f)(e),
                                  className:
                                    "flex h-full items-center gap-4 border-r border-b border-border p-[18px] transition-colors duration-(--motion-fast) ease-(--ease-ui) hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                                  children: [
                                    (0, t.jsx)(Y, {
                                      publisher: e,
                                      size: "related",
                                      well: !0,
                                    }),
                                    (0, t.jsxs)("span", {
                                      className: "flex min-w-0 flex-col gap-1",
                                      children: [
                                        (0, t.jsx)("span", {
                                          className: "text-base",
                                          children: e.name,
                                        }),
                                        (0, t.jsx)("span", {
                                          className:
                                            "text-xs text-muted-foreground",
                                          children: (0, F.D)(e),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              },
                              e.slug,
                            ),
                          ),
                        }),
                        (0, t.jsxs)(d.Link, {
                          href: (0, F.j)(r.slug),
                          className:
                            "mt-6 inline-flex items-center gap-2 font-mono text-xs leading-4 tracking-[0.06em] uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                          children: [
                            "See all ",
                            r.name,
                            " APIs",
                            (0, t.jsx)(a.f, {
                              className: "size-4",
                              "aria-hidden": !0,
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
              ],
            });
          },
        ],
        103697,
      );
    },
  ],
  [
    [181739, 518747, 78996],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(297819),
        a = e.i(87947),
        n = e.i(354245),
        s = e.i(13228),
        i = e.i(86575),
        o = e.i(266027),
        l = e.i(912598),
        c = e.i(375775),
        d = e.i(84449),
        u = e.i(716327),
        m = e.i(867927),
        f = e.i(758925),
        h = e.i(294105),
        x = e.i(367784),
        g = e.i(96315),
        p = e.i(468590),
        b = e.i(250832),
        v = e.i(75183),
        y = e.i(399363),
        j = e.i(368356),
        w = e.i(669430),
        k = e.i(271645),
        N = e.i(487486),
        L = e.i(519455),
        A = e.i(337822),
        P = e.i(212474),
        C = e.i(493903),
        S = e.i(492855),
        M = e.i(131173),
        T = e.i(487389),
        z = e.i(541507),
        I = e.i(410645),
        O = e.i(975157),
        E = e.i(230975),
        F = e.i(417199);
      let $ = (0, O.f)(
        (0, L.i)({ variant: "ghost", size: "xl" }),
        "w-full justify-start gap-2.5 px-3 font-normal text-foreground/80 hover:text-foreground [&>svg]:mx-1.5",
      );
      function B({ onOpen: e }) {
        let { userInvitations: r } = (0, s.f)({
            userInvitations: { status: "pending" },
          }),
          a = r.count;
        return a
          ? (0, t.jsxs)(j.Link, {
              href: "/account/invite",
              className: $,
              onClick: e,
              children: [
                (0, t.jsx)(g.f, {
                  className: "size-4 text-muted-foreground",
                  "aria-hidden": "true",
                }),
                "Invitations",
                (0, t.jsx)(N.f, {
                  className: "ml-auto",
                  "aria-label": `${a} pending`,
                  children: a,
                }),
              ],
            })
          : null;
      }
      e.s(
        [
          "f",
          0,
          function () {
            let e = (0, F.v)(),
              { isLoaded: s, user: g } = (0, i.f)(),
              { orgId: N, orgRole: _ } = (0, r.f)(),
              { organization: D } = (0, n.f)(),
              R = (0, a.f)(),
              K = (function () {
                let { signOut: e } = (0, a.f)(),
                  t = (0, l.d)();
                return () => {
                  if ((0, I.T)()) {
                    let r;
                    ((0, P.T)(),
                      w.f.reset(),
                      t.clear(),
                      (r = window.__internal_onBeforeSetActive) &&
                        (window.__internal_onBeforeSetActive = (e) =>
                          r(e ?? "sign-out")),
                      (() => e({ redirectUrl: "/" }))().finally(() => {
                        r && (window.__internal_onBeforeSetActive = r);
                      }));
                  }
                };
              })(),
              q = (0, S.d)(),
              U = (0, y.p)(),
              W = (0, z.J)(),
              H = (0, M.E)(),
              Y = (0, M.K)(),
              V = !!N && !D,
              G = (0, o.f)({
                ...q.credits.balance.queryOptions(),
                enabled: !!g && !V && !H,
              }),
              [Q, Z] = (0, k.useState)(!1),
              J = !N || "org:admin" === _,
              X = [
                ["Dashboard", "/account/overview", h.f],
                ["Orth Agent", "/assistant", p.f],
                [(0, z.Q)(W.data), "/account/listings", v.f],
              ];
            ((0, z.G)(W.data) &&
              J &&
              X.push(["Earnings and payouts", "/account/payouts", d.f]),
              N &&
                Y.data?.personalAccount === !0 &&
                X.push([
                  "Personal API keys",
                  "/account/keys?context=personal",
                  f.f,
                ]));
            let ee = g?.primaryEmailAddress?.emailAddress,
              et = g?.fullName || g?.firstName || ee || "Your profile",
              er = N ? D?.name : H ? void 0 : M.o,
              ea = D?.membersCount,
              en = D?.hasImage ? D.imageUrl : null,
              es = G.isError
                ? "Unavailable"
                : G.data
                  ? (0, C.k)(G.data.balanceCents)
                  : "Loading…";
            return (0, t.jsxs)(A.V, {
              open: Q,
              onOpenChange: (e) => {
                (Z(e), !e || V || H || G.refetch());
              },
              children: [
                (0, t.jsxs)(A.J, {
                  "aria-label": `Account menu: ${er ?? "Loading team"}`,
                  disabled: !s || !g || V || !!H,
                  "data-dashboard-tour": "account-menu",
                  className: (0, O.f)(
                    (0, L.i)({ variant: "outline", size: "2xl" }),
                    "shrink-0 gap-2.5 rounded-control border-[color-mix(in_srgb,var(--foreground)_34%,transparent)] bg-transparent pr-3 pl-2 text-left font-normal text-foreground hover:border-foreground hover:bg-foreground/10 aria-expanded:border-foreground aria-expanded:bg-foreground/10 aria-expanded:text-foreground",
                  ),
                  children: [
                    (0, t.jsx)(y.n, {
                      name: er ?? et,
                      imageUrl: en,
                      className: "flex size-[26px] rounded-[6px]",
                    }),
                    (0, t.jsxs)("span", {
                      className: "min-w-0",
                      children: [
                        (0, t.jsx)("span", {
                          className:
                            "block max-w-24 truncate text-[13px] leading-4 font-normal sm:max-w-40",
                          children: er ?? "Loading…",
                        }),
                        (0, t.jsx)("span", {
                          className:
                            "block font-mono text-[11px] leading-[14px] text-muted-foreground",
                          children: G.isSuccess ? `${es} credits` : es,
                        }),
                      ],
                    }),
                    (0, t.jsx)(u.f, {
                      "aria-hidden": "true",
                      strokeWidth: 2.8,
                      className:
                        "size-3 text-[#a8a8a8] transition-transform duration-(--motion-fast) group-aria-expanded/button:rotate-180",
                    }),
                  ],
                }),
                (0, t.jsxs)(A.T, {
                  align: "end",
                  className:
                    "max-h-(--available-height) w-[min(304px,calc(100vw-24px))] gap-0 overflow-y-auto p-1.5",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "flex items-center gap-3 px-3 pt-3 pb-4",
                      children: [
                        (0, t.jsx)(y.n, {
                          name: er ?? et,
                          imageUrl: en,
                          className: "size-10 rounded-lg text-base",
                        }),
                        (0, t.jsxs)("div", {
                          className: "min-w-0",
                          children: [
                            (0, t.jsx)(A.q, {
                              className: "truncate text-sm font-semibold",
                              children: er ?? "Your team",
                            }),
                            N &&
                              (0, t.jsxs)(j.Link, {
                                href: "/account/team",
                                onClick: () => Z(!1),
                                className:
                                  "mt-0.5 block text-xs text-muted-foreground hover:text-foreground",
                                children: [
                                  _ && (J ? "Admin · " : "Member · "),
                                  null == ea
                                    ? "Manage members"
                                    : `${ea} ${1 === ea ? "member" : "members"}`,
                                ],
                              }),
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsxs)(j.Link, {
                      href: "/account/balance",
                      onClick: () => Z(!1),
                      "aria-label": `${er ?? "Team"} balance`,
                      className:
                        "mx-1.5 mb-2 block rounded-lg bg-muted px-3.5 py-3 transition-colors hover:bg-accent",
                      children: [
                        (0, t.jsxs)("span", {
                          className:
                            "flex items-center justify-between text-xs text-muted-foreground",
                          children: [
                            "Available balance",
                            (0, t.jsx)(c.f, {
                              className: "size-3.5",
                              "aria-hidden": "true",
                            }),
                          ],
                        }),
                        (0, t.jsx)("span", {
                          className:
                            "mt-1 block font-mono text-xl font-semibold tracking-tight",
                          "aria-live": "polite",
                          children: es,
                        }),
                      ],
                    }),
                    U.canManage
                      ? (0, t.jsx)(j.Link, {
                          href: (0, E.L)("/account/add-funds", e),
                          onClick: () => Z(!1),
                          className: (0, O.f)(
                            (0, L.i)(),
                            "mx-1.5 mb-2 w-[calc(100%-0.75rem)] bg-primary font-medium text-primary-foreground hover:bg-primary/90",
                          ),
                          children: "Add funds",
                        })
                      : (0, t.jsx)("p", {
                          className: "mx-3 mb-2 text-xs text-muted-foreground",
                          children: "A team admin manages this shared balance.",
                        }),
                    (0, t.jsx)("nav", {
                      "aria-label": "Account shortcuts",
                      children: X.map(([e, r, a]) =>
                        (0, t.jsxs)(
                          j.Link,
                          {
                            href: r,
                            className: $,
                            onClick: () => Z(!1),
                            children: [
                              (0, t.jsx)(a, {
                                className: "size-4 text-muted-foreground",
                                "aria-hidden": "true",
                              }),
                              e,
                            ],
                          },
                          r,
                        ),
                      ),
                    }),
                    (0, t.jsx)(B, { onOpen: () => Z(!1) }),
                    (0, t.jsxs)(j.Link, {
                      href: "/account/organization",
                      className: $,
                      onClick: () => Z(!1),
                      children: [
                        (0, t.jsx)(b.f, {
                          className: "size-4 text-muted-foreground",
                          "aria-hidden": "true",
                        }),
                        "Account settings",
                      ],
                    }),
                    (0, t.jsxs)("div", {
                      className: "mt-1.5 border-t border-border pt-1.5",
                      children: [
                        (0, t.jsxs)(L.K, {
                          type: "button",
                          variant: "ghost",
                          "aria-label": "Profile and security",
                          className:
                            "h-auto w-full justify-start gap-2.5 px-3 py-2.5 text-left",
                          onClick: () => {
                            (0, I.T)() && (Z(!1), R.openUserProfile());
                          },
                          children: [
                            (0, t.jsx)("span", {
                              "aria-hidden": "true",
                              className:
                                "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
                              children: et.slice(0, 1).toUpperCase(),
                            }),
                            (0, t.jsxs)("span", {
                              className: "min-w-0 flex-1",
                              children: [
                                (0, t.jsx)("span", {
                                  className:
                                    "block truncate text-xs font-medium",
                                  children: et,
                                }),
                                ee &&
                                  (0, t.jsx)("span", {
                                    className:
                                      "block truncate text-[11px] font-normal text-muted-foreground",
                                    children: ee,
                                  }),
                              ],
                            }),
                            (0, t.jsx)(m.f, {
                              className: "size-3.5 text-muted-foreground",
                              "aria-hidden": "true",
                            }),
                          ],
                        }),
                        (0, t.jsxs)(L.K, {
                          type: "button",
                          variant: "ghost",
                          className: $,
                          onClick: K,
                          children: [
                            (0, t.jsx)(x.f, {
                              className: "size-4 text-muted-foreground",
                              "aria-hidden": "true",
                            }),
                            "Sign out",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (0, t.jsx)(T.f, {}),
              ],
            });
          },
        ],
        181739,
      );
      var _ = e.i(80751),
        D = e.i(47399),
        R = e.i(604354);
      let K = (0, D.Z)(D.h.dark.fg),
        q = (e) => {
          let t = (0, _.O)(e);
          return t * t * (3 - 2 * t);
        },
        U = (e, t, r = 0) => {
          let a = 43758.5453 * Math.sin(127.1 * e + 311.7 * t + 74.7 * r);
          return a - Math.floor(a);
        },
        W = (e, t, r) => {
          var a, n;
          let s, i, o, l;
          return (
            (s = Math.hypot(
              (a = ((t + 0.5 - e.ox) / e.S) * 26) - 13,
              (n = ((r + 0.5 - e.oy) / e.S) * 26) - 13,
            )),
            (l =
              Math.hypot(
                Math.max((i = Math.abs(a - 13) - 7), 0),
                Math.max((o = Math.abs(n - 13) - 7), 0),
              ) +
              Math.min(Math.max(i, o), 0) -
              6) > 0
              ? { kind: "off", d: s, out: l }
              : {
                  kind:
                    s <= 8 && ((a >= 13 && n <= 13) || (a <= 13 && n >= 13))
                      ? "cut"
                      : "body",
                  d: s,
                  out: l,
                }
          );
        },
        H = { on: !1, t: null },
        Y = new Map(),
        V = new Int16Array(800);
      function G(e, t, r, a) {
        let n = a / 3;
        (e.beginPath(),
          e.rect(t - n / 2, r - a / 2, n, a),
          e.rect(t - a / 2, r - n / 2, a, n),
          e.fill());
      }
      e.s(
        [
          "f",
          0,
          function () {
            let e = (0, k.useRef)(null);
            return (
              (0, k.useEffect)(() => {
                let t = e.current;
                if (!t) return;
                let r = window.matchMedia("(prefers-reduced-motion: reduce)"),
                  a = performance.now(),
                  n = 0,
                  s = !1,
                  i = () =>
                    (function (e, t) {
                      let r = e.clientWidth,
                        a = e.clientHeight;
                      if (r < 160 || a < 80 || r > 8192 || a > 4096) return;
                      let n = Math.min(window.devicePixelRatio || 1, 2),
                        s = Math.round(r * n),
                        i = Math.round(a * n);
                      (e.width !== s || e.height !== i) &&
                        ((e.width = s), (e.height = i));
                      let o = e.getContext("2d");
                      if (!o) return;
                      (o.setTransform(n, 0, 0, n, 0, 0),
                        o.clearRect(0, 0, r, a));
                      let l = Math.min(14, Math.max(10, r / 120)),
                        c = Math.floor(r / l),
                        d = Math.floor(a / l),
                        u = (r - c * l) / 2,
                        m = (a - d * l) / 2,
                        { box: f, mark: h } = (function (e, t) {
                          let r = `${e}x${t}`,
                            a = Y.get(r);
                          if (!a) {
                            let n, s;
                            ((n = Math.round(Math.min(0.64 * t, 0.42 * e))),
                              (a = {
                                box: (s = {
                                  ox: Math.round((e - n) / 2),
                                  oy: Math.round(0.56 * t - n / 2),
                                  S: n,
                                }),
                                mark: (e, r) => {
                                  let a = W(s, e, r);
                                  if (a.d <= 8)
                                    return {
                                      on: 0.9 > U(e, r),
                                      t: a.d / 8,
                                      size: 0.44,
                                      spin: !0,
                                    };
                                  if ("off" !== a.kind) return H;
                                  let n = (0, _.O)(1 - a.out / 14),
                                    i = (0, _.O)(1 - a.out / 3.5);
                                  return U(e, r) <
                                    Math.max(0.82 * n * n, 0.95 * i)
                                    ? {
                                        on: !0,
                                        t: null,
                                        size: i > 0.4 ? 0.42 : void 0,
                                        alpha: 0.16 + 0.34 * n * n + 0.5 * i,
                                        fade: n < 0.6,
                                        shimmer: 0.7 - 0.45 * i,
                                      }
                                    : U(e, r, 12) > 0.92
                                      ? H
                                      : {
                                          on: !0,
                                          t: null,
                                          size: 0.3,
                                          alpha:
                                            (0.05 + 0.13 * U(e, r, 11)) *
                                            q(r / t / 0.7),
                                        };
                                },
                              }),
                              Y.set(r, a));
                          }
                          return a;
                        })(c, d),
                        x = f.ox + f.S / 2,
                        g = f.oy + f.S / 2,
                        p = (t / 14) * Math.PI * 2,
                        b = Math.cos(-p),
                        v = Math.sin(-p);
                      for (let e = 0; e < d; e += 1)
                        for (let r = 0; r < c; r += 1) {
                          let a = h(r, e);
                          if (!a.on) continue;
                          if (a.spin) {
                            let t = r + 0.5 - x,
                              a = e + 0.5 - g;
                            if ((t * b - a * v) * (t * v + a * b) > 0) continue;
                          }
                          let n = U(r, e, 1),
                            s =
                              l *
                              (a.size ??
                                (n > 0.9 ? 0.46 : n > 0.55 ? 0.36 : 0.28));
                          if (null === a.t) {
                            let n = a.alpha ?? 0.22 + 0.5 * U(r, e, 2);
                            if (
                              (a.fade && (n *= q(e / d / 0.5)),
                              void 0 !== a.shimmer)
                            ) {
                              let s =
                                0.5 +
                                0.5 *
                                  Math.sin(
                                    t * (0.5 + 0.9 * U(r, e, 6)) +
                                      U(r, e, 3) * Math.PI * 2,
                                  );
                              n *= 1 - a.shimmer + a.shimmer * s * s;
                            }
                            if (n <= 0.01) continue;
                            ((o.fillStyle = (0, D.f)(K)), (o.globalAlpha = n));
                          } else
                            ((o.fillStyle = (0, D.f)((0, D.u)(D.U, a.t))),
                              (o.globalAlpha = 0.92));
                          G(o, u + (r + 0.5) * l, m + (e + 0.5) * l, s);
                        }
                      let y = Math.floor(x),
                        j = Math.floor(g),
                        w = Math.round(c * d * 0.0055);
                      for (let e = 0; e < w; e += 1) {
                        let r = t / (9 + 7 * U(e, 1, 31)) + U(e, 2, 31),
                          a = Math.floor(r),
                          n = r - a,
                          s = Math.floor(U(e, a, 32) * c),
                          i = Math.floor(U(e, a, 33) * d);
                        if (W(f, s, i).out < 5) continue;
                        let h = 0;
                        for (
                          V[0] = s, V[1] = i;
                          h < 399 && W(f, s, i).out > 1.5;
                        ) {
                          let t = y - s,
                            r = j - i;
                          if (0 === t && 0 === r) break;
                          (0 === r ||
                          (0 !== t &&
                            U(e, 977 * a + h, 41) <
                              Math.abs(t) / (Math.abs(t) + Math.abs(r)))
                            ? (s += Math.sign(t))
                            : (i += Math.sign(r)),
                            (V[2 * (h += 1)] = s),
                            (V[2 * h + 1] = i));
                        }
                        if (h < 2) continue;
                        let x =
                            h -
                            Math.min(
                              h,
                              Math.floor(
                                h * (1 - (1 - (0, _.O)(n / 0.9)) ** 1.5),
                              ),
                            ),
                          g = q(n / 0.06) * q((1 - n) / 0.1);
                        for (let e = 0; e < 4 && x + e <= h; e += 1) {
                          let t = V[2 * (x + e)] ?? 0,
                            r = V[2 * (x + e) + 1] ?? 0,
                            a =
                              (0 === e ? 0.95 : 0.45 / e) * g * q(r / d / 0.6);
                          a <= 0.01 ||
                            ((o.fillStyle = (0, D.f)(K)),
                            (o.globalAlpha = a),
                            G(
                              o,
                              u + (t + 0.5) * l,
                              m + (r + 0.5) * l,
                              l * (0 === e ? 0.44 : 0.34),
                            ));
                        }
                      }
                    })(t, r.matches ? 0 : (performance.now() - a) / 1e3),
                  o = () => {
                    (i(), (n = requestAnimationFrame(o)));
                  },
                  l = () => {
                    (cancelAnimationFrame(n),
                      (n = 0),
                      s &&
                        !document.hidden &&
                        (i(), r.matches || (n = requestAnimationFrame(o))));
                  },
                  c = new ResizeObserver(l);
                c.observe(t);
                let d = new IntersectionObserver(([e]) => {
                  ((s = e?.isIntersecting ?? !1), l());
                });
                return (
                  d.observe(t),
                  document.addEventListener("visibilitychange", l),
                  r.addEventListener("change", l),
                  () => {
                    (c.disconnect(),
                      d.disconnect(),
                      cancelAnimationFrame(n),
                      document.removeEventListener("visibilitychange", l),
                      r.removeEventListener("change", l));
                  }
                );
              }, []),
              (0, t.jsx)("div", {
                className: R.default.horizon,
                "aria-hidden": !0,
                children: (0, t.jsx)("div", {
                  className: R.default.hv,
                  children: (0, t.jsx)("div", {
                    className: R.default.plane,
                    children: (0, t.jsx)("canvas", {
                      ref: e,
                      className: R.default.fill,
                    }),
                  }),
                }),
              })
            );
          },
        ],
        518747,
      );
      var Q = e.i(618566);
      e.s(
        [
          "f",
          0,
          function ({ signUp: e = !1, onClick: r, ...a }) {
            let n = (0, Q.useRouter)(),
              s = (0, F.v)(),
              i = e ? E.D : E.E,
              o = i(s);
            return (0, t.jsx)(j.Link, {
              ...a,
              href: o,
              onClick: (e) => {
                if (
                  (r?.(e),
                  e.defaultPrevented ||
                    0 !== e.button ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey)
                )
                  return;
                let t = i((0, F.t)());
                t !== o && (e.preventDefault(), n.push(t));
              },
            });
          },
        ],
        78996,
      );
    },
  ],
  [
    [853884],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(716327),
        a = e.i(566595),
        n = e.i(297819),
        s = e.i(618566),
        i = e.i(271645),
        o = e.i(181739),
        l = e.i(518747),
        c = e.i(716317),
        d = e.i(368356),
        u = e.i(78996),
        m = e.i(86275),
        f = e.i(519455),
        h = e.i(755146),
        x = e.i(793479),
        g = e.i(529332),
        p = e.i(410645),
        b = e.i(975157);
      function v({ tone: e, className: r }) {
        let a = (0, i.useRef)(null),
          n = `marketplace-mark-${(0, i.useId)().replace(/[^a-zA-Z0-9-]/g, "")}`,
          [s, o] = (0, i.useState)(0);
        return (
          (0, i.useEffect)(() => {
            let e = a.current;
            if (!e) return;
            let t = new IntersectionObserver(([e]) => {
              e?.isIntersecting && (o((e) => e + 360), t.disconnect());
            });
            return (t.observe(e), () => t.disconnect());
          }, []),
          (0, t.jsxs)("span", {
            ref: a,
            className: (0, b.f)(
              "inline-flex shrink-0 items-center gap-[10px]",
              "cream" === e ? "text-[#f7f6f1]" : "text-[#24201d]",
              r,
            ),
            onPointerEnter: () => o((e) => e + 180),
            onClick: () => o((e) => e + 180),
            children: [
              (0, t.jsxs)("svg", {
                viewBox: "0 0 26 26",
                "aria-hidden": "true",
                focusable: "false",
                className: "size-[26px] shrink-0 fill-current",
                children: [
                  (0, t.jsxs)("mask", {
                    id: n,
                    maskUnits: "userSpaceOnUse",
                    x: "0",
                    y: "0",
                    width: "26",
                    height: "26",
                    children: [
                      (0, t.jsx)("rect", {
                        width: "26",
                        height: "26",
                        rx: "6",
                        fill: "#fff",
                      }),
                      (0, t.jsx)("path", {
                        d: "M13 5A8 8 0 0 1 21 13H13ZM13 21A8 8 0 0 1 5 13H13Z",
                        fill: "#000",
                        className:
                          "origin-center transition-transform duration-900 ease-[cubic-bezier(0.65,0,0.35,1)] [transform-box:fill-box] motion-reduce:transition-none",
                        style: { transform: `rotate(${s}deg)` },
                      }),
                    ],
                  }),
                  (0, t.jsx)("rect", {
                    width: "26",
                    height: "26",
                    rx: "6",
                    mask: `url(#${n})`,
                  }),
                ],
              }),
              (0, t.jsx)("svg", {
                viewBox: "120 0 448 90",
                "aria-hidden": "true",
                focusable: "false",
                className: "h-5 w-[100px] shrink-0 max-[479px]:hidden",
                children: (0, t.jsx)("image", {
                  href: new URL(
                    `../assets/brand/lockup-${e}.svg?no-inline`,
                    import.meta.url,
                  ).href,
                  width: "568",
                  height: "90",
                }),
              }),
            ],
          })
        );
      }
      function y({ tone: e, clearForField: r = !1 }) {
        return (0, t.jsx)(d.Link, {
          href: "/",
          "aria-label": "Orthogonal",
          "data-d1-clear": r ? "doc" : void 0,
          className:
            "shrink-0 rounded-sm py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
          children: (0, t.jsx)(v, { tone: "dark" === e ? "cream" : "ink" }),
        });
      }
      var j = e.i(78193);
      let w = [
          [
            "Buy",
            ["Browse the catalog", "/catalog"],
            ["Pricing", "/docs/concepts/pricing"],
            ["Paying with a wallet", "/docs/payments"],
          ],
          [
            "Sell",
            ["List an API", "/sell"],
            ["Earnings and payouts", "/account/payouts"],
            ["Get verified", "/account/verification"],
          ],
          ["Build", ["Documentation", "/docs"], ["CLI", "/docs/cli"]],
          [
            "Company",
            ["Blog", "/blog"],
            ["Careers", "/careers"],
            ["Contact", `mailto:${j.z.founders}`],
            ["Book a call", j.Z.booking],
          ],
          [
            "Legal",
            ["Security", "/security"],
            ["Terms", "/terms"],
            ["Provider Terms", "/provider-terms"],
            ["Privacy", "/privacy"],
            ["Acceptable Use", "/aup"],
          ],
        ],
        k = [
          ["X", "https://x.com/orthogonal_sh"],
          ["LinkedIn", "https://www.linkedin.com/company/orthogonalsh"],
        ];
      var N = e.i(266027),
        L = e.i(487710),
        A = e.i(492855);
      function P() {
        let e = (0, s.useRouter)(),
          [t, r] = (0, i.useTransition)();
        return (
          (0, i.useEffect)(() => {
            function t(t) {
              (t.metaKey || t.ctrlKey) &&
                "k" === t.key.toLowerCase() &&
                (t.preventDefault(),
                (0, p.T)() && r(() => e.push("/assistant")));
            }
            return (
              window.addEventListener("keydown", t),
              () => window.removeEventListener("keydown", t)
            );
          }, [e]),
          t
        );
      }
      function C() {
        return (0, t.jsx)(u.f, {
          className: (0, b.f)(
            (0, f.i)({ variant: "outline", size: "2xl" }),
            "ml-auto rounded-control border-[color-mix(in_srgb,var(--foreground)_34%,transparent)] px-[18px] font-mono text-[13px] leading-4 tracking-[0.1em] sm:ml-0 hover:border-foreground hover:bg-foreground/10",
          ),
          children: "Sign in",
        });
      }
      function S({
        query: e,
        category: l,
        alignWithHero: u = !1,
        dashboard: p = !1,
        signedOut: v,
        divider: j = !1,
        tone: w = "dark",
        actions: k,
      }) {
        let { isLoaded: P, isSignedIn: M } = (0, n.f)(),
          T = v ?? (P ? !1 === M : void 0),
          z = (0, g.b)(M),
          {
            apiCount: I,
            listed: O,
            scoped: E,
            setPicked: F,
            searching: $,
            search: B,
            setSearch: _,
            searchInput: D,
            setSearchOpen: R,
            typed: K,
            suggestionsOpen: q,
            submitSearch: U,
          } = (function (e, t) {
            let { data: r = [] } = (0, N.f)(
                A.r.catalog.categories.queryOptions(),
              ),
              a = (0, s.useRouter)(),
              { data: n = [] } = (0, N.f)(
                A.r.catalog.publishers.queryOptions(),
              ),
              o = n.length,
              l = r
                .map((e) => ({
                  ...e,
                  name: (0, c.e)(e),
                  apis: n.filter((t) => t.categorySlugs.includes(e.slug))
                    .length,
                }))
                .filter((e) => e.apis > 0)
                .sort((e, t) => e.name.localeCompare(t.name)),
              [d, u] = (0, i.useState)();
            d && d.on !== t && u(void 0);
            let m = d?.on === t ? d.slug : t,
              f = l.find((e) => e.slug === m),
              [h, x] = (0, i.useTransition)(),
              [g, p] = (0, i.useState)(e),
              b = (0, i.useRef)(null);
            (0, i.useEffect)(() => {
              let e = (e) => {
                if (
                  "/" !== e.key ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.altKey ||
                  e.defaultPrevented
                )
                  return;
                let t = e.target;
                (t instanceof Element &&
                  t.closest(
                    'input, textarea, select, [contenteditable="true"], [role="textbox"]',
                  )) ||
                  (e.preventDefault(), b.current?.focus());
              };
              return (
                window.addEventListener("keydown", e),
                () => window.removeEventListener("keydown", e)
              );
            }, []);
            let [v, y] = (0, i.useState)(!1),
              [j, w] = (0, i.useState)(e.trim());
            (0, i.useEffect)(() => {
              let e = window.setTimeout(() => w(g.trim()), 250);
              return () => window.clearTimeout(e);
            }, [g]);
            let k = v && j.length > 2;
            return {
              apiCount: o,
              listed: l,
              scoped: f,
              setPicked: u,
              searching: h,
              search: g,
              setSearch: p,
              searchInput: b,
              setSearchOpen: y,
              typed: j,
              suggestionsOpen: k,
              submitSearch: function (e) {
                e.preventDefault();
                let t = g.trim();
                t && (y(!1), x(() => a.push((0, L.f)(t, f?.slug))));
              },
            };
          })(e, l);
        return (0, t.jsxs)("header", {
          className: (0, b.f)(
            "relative z-40 text-foreground shadow-none",
            p && "lg:sticky lg:top-0",
            u ? "bg-transparent" : "bg-background",
            j
              ? "border-b border-border"
              : u
                ? "border-b-0"
                : "border-b-0 after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:bg-background after:content-['']",
            "dark" === w && "dark",
          ),
          children: [
            $ && (0, t.jsx)(d.NavigationBar, {}),
            (0, t.jsx)("div", {
              className: (0, b.f)(
                "text-foreground",
                u ? "bg-transparent" : "bg-background",
              ),
              children: (0, t.jsxs)("div", {
                className:
                  "page-column flex h-[84px] flex-nowrap items-center justify-between gap-6 px-4 max-[479px]:gap-2 sm:px-6 lg:px-10",
                children: [
                  (0, t.jsx)(y, { tone: w, clearForField: u }),
                  (0, t.jsxs)("form", {
                    onSubmit: U,
                    className:
                      "relative hidden h-11 min-w-0 items-center focus-within:outline focus-within:outline-1 focus-within:outline-foreground/40 md:mr-auto md:ml-4 md:flex md:w-[560px] md:flex-[0_1_560px] md:basis-[560px]",
                    style: {
                      background:
                        "color-mix(in srgb, var(--foreground) 9%, var(--background))",
                    },
                    role: "search",
                    "data-dashboard-tour": "discover-nav",
                    "data-d1-clear": u ? "doc" : void 0,
                    children: [
                      (0, t.jsxs)(h.G, {
                        children: [
                          (0, t.jsxs)(h.X, {
                            "aria-label": `Search in: ${E?.name ?? "All categories"}`,
                            className: (0, b.f)(
                              (0, f.i)({ variant: "ghost", size: "sm" }),
                              "relative hidden h-full shrink-0 gap-0 rounded-none border-0 bg-transparent pr-9 pl-4 font-mono text-xs tracking-[0.05em] text-muted-foreground uppercase hover:bg-muted hover:text-foreground data-popup-open:bg-muted lg:inline-flex",
                            ),
                            children: [
                              E?.name ?? "All categories",
                              (0, t.jsx)(r.f, {
                                "aria-hidden": "true",
                                strokeWidth: 2.8,
                                className:
                                  "absolute right-4 size-3 text-[#a8a8a8]",
                              }),
                            ],
                          }),
                          (0, t.jsx)(h.L, {
                            className: "w-56",
                            children: (0, t.jsxs)(h.O, {
                              value: E?.slug ?? "",
                              onValueChange: (e) => F({ on: l, slug: e }),
                              children: [
                                (0, t.jsx)(h.T, {
                                  value: "",
                                  closeOnClick: !0,
                                  children: "All categories",
                                }),
                                O.map((e) =>
                                  (0, t.jsx)(
                                    h.T,
                                    {
                                      value: e.slug,
                                      closeOnClick: !0,
                                      children: e.name,
                                    },
                                    e.slug,
                                  ),
                                ),
                              ],
                            }),
                          }),
                        ],
                      }),
                      (0, t.jsx)("span", {
                        "aria-hidden": "true",
                        className: "h-5 w-px shrink-0 bg-border",
                      }),
                      (0, t.jsx)(x.f, {
                        ref: D,
                        type: "search",
                        "aria-label": "Search APIs",
                        value: B,
                        onFocus: () => R(!0),
                        onBlur: () => window.setTimeout(() => R(!1), 120),
                        onChange: (e) => {
                          (_(e.target.value), R(!0));
                        },
                        placeholder: I ? `Search ${I} APIs` : "Search APIs",
                        className: (0, b.f)(
                          "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-base text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 dark:bg-transparent",
                          q && "ring-2 ring-inset ring-ring",
                        ),
                      }),
                      (0, t.jsx)(f.K, {
                        type: "submit",
                        variant: "default",
                        size: "icon",
                        "aria-label": "Search",
                        className:
                          "h-full w-11 shrink-0 rounded-none border-0 bg-white text-[#2d2723] hover:bg-brand-amber",
                        children: (0, t.jsx)(a.f, {
                          "aria-hidden": "true",
                          className: "size-[18px]",
                        }),
                      }),
                      q &&
                        (0, t.jsx)(m.SearchSuggestions, {
                          query: K,
                          category: E?.slug ?? "",
                        }),
                    ],
                  }),
                  (0, t.jsxs)("nav", {
                    "aria-label": "Main",
                    "data-d1-clear": u ? "doc" : void 0,
                    className:
                      "ml-auto flex shrink-0 items-center gap-7 font-mono text-[13px] tracking-[0.1em] uppercase max-md:gap-5 max-[479px]:gap-2.5 lg:ml-0",
                    children: [
                      (0, t.jsx)(d.Link, {
                        href: "/catalog",
                        className:
                          "relative py-2 text-foreground/[0.84] transition-colors duration-(--motion-fast) after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--motion-fast) hover:text-foreground hover:after:scale-x-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring focus-visible:after:scale-x-100",
                        children: "Catalog",
                      }),
                      (0, t.jsx)(d.Link, {
                        href: "/docs",
                        className:
                          "relative py-2 text-foreground/[0.84] transition-colors duration-(--motion-fast) after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--motion-fast) hover:text-foreground hover:after:scale-x-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring focus-visible:after:scale-x-100 max-md:hidden lg:max-xl:hidden",
                        children: "Docs",
                      }),
                      p
                        ? (0, t.jsxs)(t.Fragment, {
                            children: [
                              (0, t.jsx)(d.Link, {
                                href: z,
                                className:
                                  "relative py-2 text-foreground/[0.84] transition-colors duration-(--motion-fast) after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--motion-fast) hover:text-foreground hover:after:scale-x-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring focus-visible:after:scale-x-100 max-md:hidden lg:max-xl:hidden",
                                children: "List",
                              }),
                              (0, t.jsx)(o.f, {}),
                            ],
                          })
                        : (0, t.jsxs)(t.Fragment, {
                            children: [
                              (0, t.jsx)(d.Link, {
                                href: z,
                                className:
                                  "relative py-2 text-foreground/[0.84] transition-colors duration-(--motion-fast) after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--motion-fast) hover:text-foreground hover:after:scale-x-100 focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring focus-visible:after:scale-x-100 max-md:hidden lg:max-xl:hidden",
                                children: "List",
                              }),
                              !1 === T
                                ? (0, t.jsx)(o.f, {})
                                : !0 === T
                                  ? (0, t.jsx)(C, {})
                                  : (0, t.jsx)("span", {
                                      "aria-hidden": "true",
                                      className: "h-11 w-20 shrink-0",
                                    }),
                            ],
                          }),
                      k,
                    ],
                  }),
                ],
              }),
            }),
          ],
        });
      }
      function M({ tagline: e = c.m.copy.footerTagline }) {
        let { isSignedIn: r } = (0, n.f)(),
          a = (0, g.b)(r),
          s =
            "font-mono text-xs leading-[1.2] tracking-[0.08em] text-muted-foreground uppercase transition-colors duration-(--motion-fast) hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4";
        return (0, t.jsxs)("footer", {
          className:
            "dark relative mt-auto border-t border-border bg-background text-foreground",
          children: [
            (0, t.jsxs)("div", {
              className:
                "page-column px-4 pt-[clamp(48px,5vw,96px)] sm:px-6 lg:px-10",
              children: [
                (0, t.jsxs)("div", {
                  className:
                    "grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))] lg:gap-8",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "col-span-2 lg:col-span-1",
                      children: [
                        (0, t.jsx)(d.Link, {
                          href: "/",
                          "aria-label": "Orthogonal",
                          className:
                            "inline-flex rounded-glyph focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                          children: (0, t.jsx)(v, { tone: "cream" }),
                        }),
                        (0, t.jsx)("p", {
                          className:
                            "mt-3 max-w-[22em] text-[15px] leading-[1.4] text-muted-foreground",
                          children: e,
                        }),
                      ],
                    }),
                    w.map(([e, ...r]) =>
                      (0, t.jsxs)(
                        "div",
                        {
                          children: [
                            (0, t.jsx)("h2", {
                              className:
                                "mb-[18px] font-mono text-xs leading-4 tracking-[0.08em] uppercase",
                              children: e,
                            }),
                            (0, t.jsx)("ul", {
                              className: "flex flex-col items-start gap-3",
                              children: r.map(([e, r]) =>
                                (0, t.jsx)(
                                  "li",
                                  {
                                    children:
                                      r.startsWith("mailto:") ||
                                      r.startsWith("https:")
                                        ? (0, t.jsx)("a", {
                                            href: r,
                                            ...(r.startsWith("https:") && {
                                              target: "_blank",
                                              rel: "noreferrer",
                                            }),
                                            className: s,
                                            children: e,
                                          })
                                        : (0, t.jsx)(d.Link, {
                                            href: "/sell" === r ? a : r,
                                            className: s,
                                            children: e,
                                          }),
                                  },
                                  e,
                                ),
                              ),
                            }),
                          ],
                        },
                        e,
                      ),
                    ),
                  ],
                }),
                (0, t.jsxs)("div", {
                  className:
                    "mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono text-xs leading-4 tracking-[0.08em] text-muted-foreground uppercase",
                  children: [
                    (0, t.jsx)("span", {
                      suppressHydrationWarning: !0,
                      children: `\xa9 ${new Date().getFullYear()} Orthogonal \xb7 orthogonal.com`,
                    }),
                    (0, t.jsxs)("div", {
                      className: "flex gap-6",
                      children: [
                        (0, t.jsx)(f.K, {
                          type: "button",
                          variant: "ghost",
                          className: (0, b.f)(
                            s,
                            "h-auto rounded-none p-0 font-normal hover:bg-transparent active:not-aria-[haspopup]:translate-y-0",
                          ),
                          onClick: () =>
                            window.scrollTo({
                              top: 0,
                              behavior: window.matchMedia(
                                "(prefers-reduced-motion: reduce)",
                              ).matches
                                ? "instant"
                                : "smooth",
                            }),
                          children: "Back to top",
                        }),
                        k.map(([e, r]) =>
                          (0, t.jsx)(
                            "a",
                            {
                              href: r,
                              target: "_blank",
                              rel: "noreferrer",
                              className: s,
                              children: e,
                            },
                            e,
                          ),
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, t.jsx)(l.f, {}),
          ],
        });
      }
      e.s(
        [
          "MarketplaceFooter",
          0,
          M,
          "MarketplaceFrame",
          0,
          function ({ query: e = "", category: r = "", children: a }) {
            let n = P();
            return (0, t.jsxs)("main", {
              id: "top",
              className:
                "flex min-h-screen flex-col bg-background text-foreground",
              children: [
                n && (0, t.jsx)(d.NavigationBar, {}),
                (0, t.jsx)(S, { query: e, category: r }),
                a,
                (0, t.jsx)(M, {}),
              ],
            });
          },
          "MarketplaceHeader",
          0,
          S,
          "useAssistantShortcut",
          0,
          P,
        ],
        853884,
      );
    },
  ],
  [
    [519455, 225913],
    (t) => {
      "use strict";
      var e = t.i(843476),
        r = t.i(527930),
        n = t.i(207670);
      let i = (t) => ("boolean" == typeof t ? `${t}` : 0 === t ? "0" : t),
        o = n.f,
        s = (t, e) => (r) => {
          var n;
          if ((null == e ? void 0 : e.variants) == null)
            return o(
              t,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: s, defaultVariants: a } = e,
            l = Object.keys(s).map((t) => {
              let e = null == r ? void 0 : r[t],
                n = null == a ? void 0 : a[t];
              if (null === e) return null;
              let o = i(e) || i(n);
              return s[t][o];
            }),
            u =
              r &&
              Object.entries(r).reduce((t, e) => {
                let [r, n] = e;
                return (void 0 === n || (t[r] = n), t);
              }, {});
          return o(
            t,
            l,
            null == e || null == (n = e.compoundVariants)
              ? void 0
              : n.reduce((t, e) => {
                  let { class: r, className: n, ...i } = e;
                  return Object.entries(i).every((t) => {
                    let [e, r] = t;
                    return Array.isArray(r)
                      ? r.includes({ ...a, ...u }[e])
                      : { ...a, ...u }[e] === r;
                  })
                    ? [...t, r, n]
                    : t;
                }, []),
            null == r ? void 0 : r.class,
            null == r ? void 0 : r.className,
          );
        };
      t.s(["f", 0, s], 225913);
      var a = t.i(975157);
      let l = s(
        "group/button inline-flex shrink-0 items-center justify-center rounded-control admin:rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow,translate,scale,opacity] duration-(--motion-fast) ease-(--ease-ui) motion-reduce:transition-none outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px motion-reduce:active:translate-y-0 disabled:pointer-events-none admin:font-semibold admin:focus-visible:ring-ring/25 admin:active:not-aria-[haspopup]:translate-y-0 admin:active:not-aria-[haspopup]:scale-[0.96] admin:motion-reduce:active:scale-100 disabled:opacity-50 not-admin:disabled:border-transparent not-admin:disabled:bg-(--controls-disabled) not-admin:disabled:text-(--elements-disabled) not-admin:disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        {
          variants: {
            variant: {
              default:
                "bg-primary text-primary-foreground hover:bg-(--ink-700) admin:hover:bg-primary/80",
              outline:
                "border-border bg-[var(--button-outline,var(--background))] hover:border-(--border-interactive-hovered) hover:bg-[var(--button-outline-hover,var(--muted))] hover:text-foreground admin:hover:border-border aria-expanded:bg-[var(--button-outline-hover,var(--muted))] aria-expanded:text-foreground",
              secondary:
                "bg-secondary text-secondary-foreground hover:bg-(--controls-tertiary-hovered) admin:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
              ghost:
                "hover:bg-[var(--button-ghost-hover,var(--muted))] hover:text-foreground aria-expanded:bg-[var(--button-ghost-hover,var(--muted))] aria-expanded:text-foreground",
              quiet:
                "text-muted-foreground hover:bg-[var(--button-ghost-hover,var(--muted))] hover:text-foreground aria-expanded:bg-[var(--button-ghost-hover,var(--muted))] aria-expanded:text-foreground",
              "ghost-destructive":
                "text-muted-foreground hover:bg-[var(--button-ghost-hover,var(--muted))] hover:text-destructive focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
              destructive:
                "bg-destructive/10 text-destructive not-admin:text-foreground hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
              link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
              default:
                "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
              xs: "h-6 gap-1 rounded-control admin:rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
              sm: "h-7 gap-1 rounded-control admin:rounded-md px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
              lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
              xl: "h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
              "2xl":
                "h-11 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
              icon: "size-8",
              "icon-xs":
                "size-6 rounded-control admin:rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
              "icon-sm":
                "size-7 rounded-control admin:rounded-md in-data-[slot=button-group]:rounded-lg",
              "icon-lg": "size-9",
            },
          },
          defaultVariants: { variant: "default", size: "default" },
        },
      );
      t.s(
        [
          "K",
          0,
          function ({
            className: t,
            variant: n = "default",
            size: i = "default",
            ...o
          }) {
            return (0, e.jsx)(r.Button, {
              "data-slot": "button",
              className: (0, a.f)(l({ variant: n, size: i, className: t })),
              ...o,
            });
          },
          "i",
          0,
          l,
        ],
        519455,
      );
    },
  ],
  [
    [540079],
    (e) => {
      "use strict";
      var t = e.i(686190);
      e.s(["f", () => t.f]);
    },
  ],
  [
    [867927, 746336],
    (e) => {
      "use strict";
      var t = e.i(986253);
      e.s(["f", () => t.f]);
    },
  ],
  [
    [686190],
    (e) => {
      "use strict";
      var t = e.i(456420);
      let r = {
        name: "chevron-left",
        size: 24,
        node: [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]],
      };
      r.node;
      let n = (0, t.f)(r);
      e.s(["f", 0, n]);
    },
  ],
  [
    [986253],
    (e) => {
      "use strict";
      var t = e.i(456420);
      let n = {
        name: "chevron-right",
        size: 24,
        node: [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]],
      };
      n.node;
      let r = (0, t.f)(n);
      e.s(["f", 0, r]);
    },
  ],
  [
    [335335],
    (e) => {
      "use strict";
      var t = e.i(843476),
        r = e.i(271645);
      let n = (e, t) => {
          let r = 43758.5453 * Math.sin(127.1 * e + 311.7 * t);
          return r - Math.floor(r);
        },
        i = [0.07, 0.12, 0.18],
        a = (() => {
          let e = [];
          for (let t = 0; t < 32; t += 1) {
            let r = -1,
              i = -1;
            for (let a = 0; a <= 192; a += 1) {
              let o = Math.min(1, Math.max(0, (a - 24) / 92)),
                s =
                  a < 192 &&
                  n(a + 3, t + 11) < 0.04 + 0.96 * o * o * (3 - 2 * o),
                l = n(a + 17, t + 5),
                c = l < 0.45 ? 0 : l < 0.85 ? 1 : 2;
              (r >= 0 &&
                (!s || c !== i) &&
                (e.push({ i: r, j: t, n: a - r, tone: i }), (r = -1)),
                s && r < 0 && ((r = a), (i = c)));
            }
          }
          return e;
        })();
      function o() {
        let e = `banner-grid${(0, r.useId)().replace(/[^a-zA-Z0-9_-]/g, "")}`;
        return (0, t.jsxs)("svg", {
          viewBox: "0 0 192 32",
          className:
            "pointer-events-none absolute bottom-[calc(-1*var(--pb))] left-[calc(100%-128*var(--cell))] h-auto w-[calc(192*var(--cell))]",
          "aria-hidden": !0,
          focusable: "false",
          children: [
            (0, t.jsx)("defs", {
              children: i.map((r, n) =>
                (0, t.jsx)(
                  "pattern",
                  {
                    id: `${e}-${n}`,
                    width: 1,
                    height: 1,
                    patternUnits: "userSpaceOnUse",
                    children: (0, t.jsx)("path", {
                      d: "M0.35 0.45h0.3v0.1h-0.3zM0.45 0.35h0.1v0.3h-0.1z",
                      className: "fill-foreground",
                      fillOpacity: r,
                    }),
                  },
                  r,
                ),
              ),
            }),
            a.map(({ i: r, j: n, n: i, tone: a }) =>
              (0, t.jsx)(
                "rect",
                { x: r, y: n, width: i, height: 1, fill: `url(#${e}-${a})` },
                `${r},${n}`,
              ),
            ),
          ],
        });
      }
      e.s([
        "f",
        0,
        function ({ children: e, art: r, field: n }) {
          return (0, t.jsx)("section", {
            className:
              "dark relative isolate overflow-hidden border-b border-border bg-background text-foreground [--cell:16px] [--logo-well:var(--d1-fg)]",
            children: (0, t.jsx)("div", {
              className:
                "page-column px-4 pt-10 pb-(--pb) [--pb:40px] sm:px-6 lg:px-10 lg:pt-12 lg:[--pb:48px]",
              children: (0, t.jsxs)("div", {
                className: "relative",
                children: [
                  (0, t.jsx)(o, {}),
                  n &&
                    (0, t.jsx)("div", {
                      className:
                        "pointer-events-none absolute bottom-[calc(-1*var(--pb))] left-[calc(100%-46*var(--cell))] hidden h-[calc(18*var(--cell))] w-[calc(46*var(--cell)+50vw)] md:block",
                      children: n,
                    }),
                  r &&
                    (0, t.jsx)("div", {
                      className:
                        "pointer-events-none absolute right-0 bottom-0 hidden md:block",
                      children: r,
                    }),
                  (0, t.jsx)("div", {
                    className: "relative z-10 min-w-0",
                    children: e,
                  }),
                ],
              }),
            }),
          });
        },
      ]);
    },
  ],
];
