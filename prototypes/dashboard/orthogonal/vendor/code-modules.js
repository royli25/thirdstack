// Captured code sample presentation; no service clients.
export const codeModules = [
  [
    [769809, 456539],
    (e) => {
      "use strict";
      let t;
      var n = e.i(843476),
        s = e.i(407043),
        r = e.i(688060),
        i = e.i(183343),
        a = e.i(132458),
        o = e.i(519455);
      let l = e.i(619877).z.json();
      var d = e.i(975157),
        c = e.i(716327),
        u = e.i(271645);
      function f({
        line: e,
        dense: t,
        index: s = 0,
        edit: o,
        stagger: l,
        control: c,
      }) {
        let u = "string" == typeof e ? (0, a.f)(e) : e,
          p = o?.editingKey?.startsWith(`${s}:`) ?? !1,
          m = p ? Number(o?.editingKey?.split(":")[1]) : -1,
          x = p ? (0, r.t)(u, m) : null,
          h = x ? o?.hints?.[x] : void 0;
        return (0, n.jsxs)("div", {
          className: (0, d.f)(
            "flex items-center whitespace-pre",
            t ? "h-[18px] text-[12px] leading-4" : "h-5 text-[13px] leading-5",
            l && "motion-safe:animate-code-line-in",
          ),
          style: l ? { animationDelay: `${12 * s}ms` } : void 0,
          children: [
            c,
            u.map((e, a) => {
              if ("key" in e) return (0, n.jsx)(i.d, { value: e.key }, a);
              if (o && ("string" === e.tone || e.bare)) {
                let i = `${s}:${a}`,
                  l = o.keys.indexOf(i);
                return (0, n.jsx)(
                  r.W,
                  {
                    token: e,
                    name: (0, r.t)(u, a) ?? "value",
                    editing: o.editingKey === i,
                    changed: o.changed(i),
                    dense: t,
                    hasNext: l >= 0 && l < o.keys.length - 1,
                    hasPrev: l > 0,
                    onStart: () => o.onStart(i),
                    onCommit: (e) => o.onCommit(i, e),
                    onCancel: o.onCancel,
                    onMove: (e) => {
                      let t = o.keys[l + ("next" === e ? 1 : -1)];
                      t && o.onStart(t);
                    },
                  },
                  a,
                );
              }
              return (0, n.jsx)(
                "span",
                {
                  className: (0, d.f)("shrink-0", !e.color && i.z[e.tone]),
                  style: e.color ? { color: e.color } : void 0,
                  children: e.text,
                },
                a,
              );
            }),
            h &&
              (0, n.jsx)("span", {
                className: "shrink-0 pl-3 text-code-muted",
                children: h,
              }),
          ],
        });
      }
      function p({
        lines: e,
        dense: t,
        className: s,
        notes: r,
        edit: i,
        stagger: a,
        collapsible: x,
      }) {
        let h = (0, u.useMemo)(
            () =>
              x
                ? (function (e) {
                    try {
                      let t = l.parse(JSON.parse(e)),
                        n = JSON.stringify(t, null, 2).split("\n");
                      if (n.join("\n") !== e) return null;
                      let s = new Map();
                      return (
                        !(function e(t, r, i, a) {
                          if (null === t || "object" != typeof t) return r + 1;
                          let o = Object.entries(t);
                          if (0 === o.length) return r + 1;
                          let l = Array.isArray(t),
                            d = r + 1;
                          for (let [t, n] of o)
                            d = e(
                              n,
                              d,
                              l ? `${i}[${t}]` : i ? `${i}.${t}` : t,
                              a + 1,
                            );
                          return (
                            (a > 0 || l) &&
                              s.set(r, {
                                end: d,
                                label: i || "response",
                                summary:
                                  n[r].slice(0, -1) +
                                  (l
                                    ? `[ ${o.length} item${1 === o.length ? "" : "s"} ]`
                                    : "{ … }") +
                                  (n[d]?.endsWith(",") ? "," : ""),
                                collapsed: l || a > 1,
                              }),
                            d + 1
                          );
                        })(t, 0, "", 0),
                        { lines: n, folds: s }
                      );
                    } catch {
                      return null;
                    }
                  })(e.map(m).join("\n"))
                : null,
            [x, e],
          ),
          [g, b] = (0, u.useState)(new Set()),
          y = h?.lines ?? e,
          j = [];
        for (let e = 0; e < y.length; e++) {
          let s = e,
            r = h?.folds.get(s),
            l = r && r.collapsed !== g.has(s);
          (j.push(
            (0, n.jsx)(
              f,
              {
                line: l ? r.summary : y[s],
                dense: t,
                index: j.length,
                edit: i,
                stagger: a,
                control:
                  h && h.folds.size > 0
                    ? (0, n.jsx)("span", {
                        className: "inline-flex w-5 shrink-0",
                        children:
                          r &&
                          (0, n.jsx)(o.K, {
                            type: "button",
                            variant: "ghost",
                            "aria-expanded": !l,
                            "aria-label": `${l ? "Expand" : "Collapse"} ${r.label}`,
                            onClick: () =>
                              b((e) => {
                                let t = new Set(e);
                                return (t.has(s) ? t.delete(s) : t.add(s), t);
                              }),
                            className:
                              "size-5 rounded-sm p-0 text-code-muted hover:bg-code-surface-hover hover:text-code-text",
                            children: (0, n.jsx)(c.f, {
                              "aria-hidden": "true",
                              className: (0, d.f)("size-3", l && "-rotate-90"),
                            }),
                          }),
                      })
                    : void 0,
              },
              s,
            ),
          ),
            l && (e = r.end));
        }
        return (0, n.jsxs)("div", {
          className: (0, d.f)("flex flex-col overflow-x-auto font-mono", s),
          children: [
            j,
            r?.map((e, t) =>
              (0, n.jsx)(
                "div",
                {
                  className: (0, d.f)(
                    "flex h-[18px] items-center whitespace-pre text-[12px] leading-4 text-code-muted",
                    0 === t && "mt-1.5",
                    a && "motion-safe:animate-code-line-in",
                  ),
                  style: a
                    ? { animationDelay: `${(j.length + t) * 12}ms` }
                    : void 0,
                  children: e,
                },
                `note-${t}`,
              ),
            ),
          ],
        });
      }
      function m(e) {
        return "string" == typeof e
          ? e
          : e.map((e) => ("key" in e ? e.key : e.text)).join("");
      }
      var x = e.i(242027);
      e.s(["f", () => x.f], 456539);
      var x = x;
      function h({ primary: e, secondary: t }) {
        return (0, n.jsxs)("span", {
          className:
            "flex items-center gap-2 font-mono text-[12px] leading-4 whitespace-nowrap",
          children: [
            (0, n.jsx)("span", {
              className: "font-semibold text-code-accent",
              children: e,
            }),
            t &&
              (0, n.jsxs)(n.Fragment, {
                children: [
                  (0, n.jsx)("span", {
                    className: "text-code-muted/45",
                    children: "·",
                  }),
                  (0, n.jsx)("span", {
                    className: "text-code-muted",
                    children: t,
                  }),
                ],
              }),
          ],
        });
      }
      function g({ strip: e, expanded: t, onToggle: s, bottom: r }) {
        return (0, n.jsxs)("button", {
          type: "button",
          "aria-expanded": t,
          onClick: s,
          className: (0, d.f)(
            "group flex h-10 w-full cursor-pointer items-center justify-between border-t border-code-hairline bg-code-surface pr-5 pl-[13px] text-left transition-colors duration-150 hover:bg-code-surface-hover",
            r && "border-b",
          ),
          children: [
            (0, n.jsxs)("span", {
              className: "flex items-center gap-[9px]",
              children: [
                (0, n.jsx)("span", {
                  className:
                    "flex size-[22px] items-center justify-center rounded-full transition-colors duration-150 group-hover:bg-code-accent-tint",
                  children: t
                    ? (0, n.jsx)(x.f, {
                        className: "size-3 text-code-accent",
                        strokeWidth: 2.4,
                      })
                    : (0, n.jsx)(c.f, {
                        className: "size-3 text-code-accent",
                        strokeWidth: 2.4,
                      }),
                }),
                (0, n.jsx)(i.G, { status: e.status, ok: e.ok }),
                e.latency &&
                  (0, n.jsx)("span", {
                    className:
                      "font-mono text-[12px] leading-4 text-code-muted",
                    children: e.latency,
                  }),
              ],
            }),
            (0, n.jsx)(h, { primary: e.primary, secondary: e.secondary }),
          ],
        });
      }
      function b({ strip: e, first: t, bottom: s }) {
        return (0, n.jsxs)("div", {
          className: (0, d.f)(
            "flex h-10 items-center justify-between border-t border-code-hairline bg-code-surface px-5",
            t && "border-t-0",
            s && "border-b",
          ),
          children: [
            (0, n.jsxs)("span", {
              className: "flex items-center gap-2.5",
              children: [
                (0, n.jsx)(i.G, { status: e.status, ok: e.ok }),
                e.latency &&
                  (0, n.jsx)("span", {
                    className:
                      "font-mono text-[12px] leading-4 text-code-muted",
                    children: e.latency,
                  }),
              ],
            }),
            (0, n.jsx)(h, { primary: e.primary, secondary: e.secondary }),
          ],
        });
      }
      function y(e) {
        let t = e.match(/^(.*?)(\$[\d.,]+)(.*)$/);
        return t
          ? {
              label: (t[1] ?? "").replace(/\s+$/, " "),
              amount: `${t[2] ?? ""}${t[3] ?? ""}`,
            }
          : { label: e, amount: "" };
      }
      function j({ from: e, to: t, active: s }) {
        return e === t
          ? (0, n.jsx)("span", { children: t })
          : (0, n.jsxs)("span", {
              className: "grid",
              children: [
                (0, n.jsx)("span", {
                  "aria-hidden": s,
                  className: (0, d.f)(
                    "col-start-1 row-start-1 justify-self-end motion-safe:transition-opacity motion-safe:duration-300",
                    s ? "opacity-0" : "opacity-100",
                  ),
                  children: e,
                }),
                (0, n.jsx)("span", {
                  "aria-hidden": !s,
                  className: (0, d.f)(
                    "col-start-1 row-start-1 justify-self-end motion-safe:transition-opacity motion-safe:duration-300",
                    s ? "opacity-100" : "opacity-0",
                  ),
                  children: t,
                }),
              ],
            });
      }
      function v({ value: e, play: t, token: s }) {
        let r = e.match(/^(\d+)(.*)$/),
          i = r ? Number(r[1]) : null,
          a = r?.[2] ?? "",
          [o, l] = (0, u.useState)(0);
        return (
          (0, u.useEffect)(() => {
            if (null === i || !t) return;
            let e = 0,
              n = performance.now(),
              s = (t) => {
                let r = Math.min(1, (t - n) / 300);
                (l(Math.round(i * (1 - Math.pow(1 - r, 3)))),
                  r < 1 && (e = window.requestAnimationFrame(s)));
              };
            return (
              (e = window.requestAnimationFrame(s)),
              () => window.cancelAnimationFrame(e)
            );
          }, [t, i, s]),
          (0, n.jsx)("span", {
            className:
              "font-mono text-[12px] leading-4 text-code-muted tabular-nums",
            children: null === i ? e : `${t ? o : i}${a}`,
          })
        );
      }
      function w({
        quote: e,
        strip: t,
        example: s,
        phase: r,
        hasRun: a,
        expanded: o,
        canExpand: l,
        onToggle: u,
        runCount: f,
      }) {
        let p = "sending" === r,
          m = "landing" === r,
          x = a && !!t,
          h = (x || !!s) && l,
          g = e ? y(e.primary) : null,
          b = t ? y(t.primary) : g,
          N = e?.secondary ?? t?.secondary ?? "",
          k = t?.secondary ?? e?.secondary ?? "";
        return (0, n.jsxs)("button", {
          type: "button",
          tabIndex: h ? 0 : -1,
          "aria-expanded": h ? o : void 0,
          onClick: h ? u : void 0,
          className: (0, d.f)(
            "group relative flex h-10 w-full items-center justify-between gap-3 overflow-hidden border-t border-code-hairline bg-code-surface pr-5 pl-[13px] text-left transition-colors duration-150",
            h ? "cursor-pointer hover:bg-code-surface-hover" : "cursor-default",
          ),
          children: [
            p &&
              (0, n.jsx)("span", {
                "aria-hidden": !0,
                className:
                  "pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden",
                children: (0, n.jsx)("span", {
                  className:
                    "block h-full w-2/5 bg-code-accent motion-safe:animate-code-sweep",
                }),
              }),
            (0, n.jsxs)("span", {
              className: "grid min-w-0 grid-cols-1 items-center",
              children: [
                e &&
                  (0, n.jsxs)("span", {
                    "aria-hidden": x,
                    className: (0, d.f)(
                      "col-start-1 row-start-1 flex items-center gap-[9px] motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out",
                      x
                        ? "pointer-events-none -translate-x-2 opacity-0"
                        : "translate-x-0 opacity-100",
                    ),
                    children: [
                      s
                        ? (0, n.jsxs)(n.Fragment, {
                            children: [
                              (0, n.jsx)("span", {
                                className:
                                  "flex size-[22px] items-center justify-center rounded-full transition-colors duration-150 group-hover:bg-code-accent-tint",
                                children: (0, n.jsx)(c.f, {
                                  className: (0, d.f)(
                                    "size-3 text-code-accent motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-out",
                                    o && "rotate-180",
                                  ),
                                  strokeWidth: 2.4,
                                }),
                              }),
                              (0, n.jsx)("span", {
                                className:
                                  "font-code-ui text-[12px] leading-4 font-medium whitespace-nowrap text-code-text",
                                children: "Example response",
                              }),
                              (0, n.jsx)("span", {
                                "aria-hidden": !0,
                                className: "h-4 w-px shrink-0 bg-code-hairline",
                              }),
                            ],
                          })
                        : (0, n.jsx)(i.E, { stopped: p }),
                      (0, n.jsx)(i.C, { mark: e.mark, listing: e.listing }),
                    ],
                  }),
                t &&
                  (0, n.jsxs)(
                    "span",
                    {
                      "aria-hidden": !x,
                      className: (0, d.f)(
                        "col-start-1 row-start-1 flex items-center gap-[9px]",
                        x
                          ? m
                            ? "motion-safe:animate-code-land"
                            : "opacity-100"
                          : "pointer-events-none opacity-0",
                      ),
                      children: [
                        (0, n.jsx)("span", {
                          className:
                            "flex size-[22px] items-center justify-center rounded-full transition-colors duration-150 group-hover:bg-code-accent-tint",
                          children: (0, n.jsx)(c.f, {
                            className: (0, d.f)(
                              "size-3 text-code-accent motion-safe:transition-transform motion-safe:duration-[220ms] motion-safe:ease-out",
                              o && "rotate-180",
                            ),
                            strokeWidth: 2.4,
                          }),
                        }),
                        (0, n.jsx)(i.G, { status: t.status, ok: t.ok }),
                        t.latency &&
                          (0, n.jsx)(v, {
                            value: t.latency,
                            play: m,
                            token: f,
                          }),
                      ],
                    },
                    f,
                  ),
              ],
            }),
            (0, n.jsxs)("span", {
              className:
                "flex shrink-0 items-center gap-2 font-mono text-[12px] leading-4 whitespace-nowrap",
              children: [
                (0, n.jsx)("span", {
                  className: "flex font-semibold text-code-accent",
                  children:
                    g && b
                      ? (0, n.jsxs)(n.Fragment, {
                          children: [
                            (0, n.jsx)(j, {
                              from: g.label,
                              to: b.label,
                              active: x,
                            }),
                            (0, n.jsx)(j, {
                              from: g.amount,
                              to: b.amount,
                              active: x,
                            }),
                          ],
                        })
                      : (b?.label ?? "") + (b?.amount ?? ""),
                }),
                (N || k) &&
                  (0, n.jsxs)(n.Fragment, {
                    children: [
                      (0, n.jsx)("span", {
                        className: "text-code-muted/45",
                        children: "·",
                      }),
                      (0, n.jsx)("span", {
                        className: "flex text-code-muted",
                        children: (0, n.jsx)(j, { from: N, to: k, active: x }),
                      }),
                    ],
                  }),
              ],
            }),
          ],
        });
      }
      var N = e.i(107308),
        k = e.i(867927),
        C = e.i(325164);
      function S({ preview: e }) {
        let [t, s] = (0, u.useState)("loading");
        return (0, n.jsxs)("div", {
          className: "space-y-3 font-code-ui text-[12px] leading-4",
          children: [
            "loaded" !== t &&
              (0, n.jsx)("p", {
                role: "status",
                className: "text-code-muted",
                children:
                  "loading" === t
                    ? "Loading screenshot…"
                    : "The screenshot could not be displayed.",
              }),
            (0, n.jsx)(C.default, {
              src: e.src,
              alt: e.alt,
              width: 800,
              height: 500,
              loading: "eager",
              onLoad: () => s("loaded"),
              onError: () => s("error"),
              className: (0, d.f)(
                "h-auto max-h-[360px] w-full rounded-code-control object-contain",
                "loaded" !== t && "hidden",
              ),
            }),
          ],
        });
      }
      function _({ run: e, dense: t, expanded: s }) {
        let r = e.response;
        return e.preview
          ? (0, n.jsxs)("div", {
              className: "px-5 pt-4 pb-[18px]",
              children: [
                (0, n.jsx)(S, { preview: e.preview }),
                r &&
                  (0, n.jsxs)(N.Collapsible, {
                    className: "mt-4",
                    children: [
                      (0, n.jsxs)(N.CollapsibleTrigger, {
                        className:
                          "group/json flex items-center gap-1 font-code-ui text-[12px] leading-4 text-code-text",
                        children: [
                          (0, n.jsx)(k.f, {
                            "aria-hidden": "true",
                            className:
                              "size-3.5 transition-transform duration-(--motion-ui) ease-(--ease-ui) group-data-[panel-open]/json:rotate-90 motion-reduce:transition-none",
                          }),
                          "View JSON",
                        ],
                      }),
                      (0, n.jsx)(N.CollapsibleContent, {
                        hiddenUntilFound: !0,
                        children: (0, n.jsx)(p, {
                          lines: r,
                          collapsible: !0,
                          notes: e.notes,
                          dense: t,
                          className: "mt-3",
                          stagger: s,
                        }),
                      }),
                    ],
                  }),
              ],
            })
          : r &&
              (0, n.jsx)(p, {
                lines: r,
                collapsible: !0,
                notes: e.notes,
                dense: t,
                className: "px-5 pt-4 pb-[18px]",
                stagger: s,
              });
      }
      function z({
        expanded: e,
        flush: t,
        quote: r,
        run: i,
        example: a,
        showExample: o,
        exampleNote: l,
        phase: d,
        hasRun: c,
        onToggle: u,
        runCount: f,
        dense: m,
      }) {
        let x = !!(i?.response || i?.preview);
        return (0, n.jsx)(s.I, {
          expanded: e,
          flush: t,
          strip: (0, n.jsx)(w, {
            quote: r,
            strip: i?.strip,
            example: o,
            phase: d,
            hasRun: c,
            expanded: e,
            canExpand: c ? x : o,
            onToggle: u,
            runCount: f,
          }),
          children: c
            ? x && i && (0, n.jsx)(_, { run: i, dense: m, expanded: e }, f)
            : o &&
              (0, n.jsx)(p, {
                lines: a ?? [],
                collapsible: !0,
                notes: [l],
                dense: m,
                className: "px-5 pt-4 pb-[18px]",
                stagger: e,
              }),
        });
      }
      function $({
        call: e,
        index: t,
        last: r,
        open: a,
        onToggle: o,
        hops: l,
        dense: c,
      }) {
        let u = !!(e.response || e.result || e.notes),
          f = a && u,
          m = (0, n.jsxs)(n.Fragment, {
            children: [
              e.result && (0, n.jsx)(i.Q, { result: e.result }),
              (e.response || e.notes) &&
                (0, n.jsx)(p, {
                  lines: e.response ?? [],
                  notes: e.notes,
                  dense: c,
                  className: (0, d.f)(
                    "px-5 pb-[18px]",
                    e.result ? "pt-1" : "pt-4",
                  ),
                }),
            ],
          });
        return (0, n.jsxs)("div", {
          className: (0, d.f)(
            "relative flex flex-col",
            r && "rounded-b-[inherit]",
            f && "z-20",
          ),
          children: [
            (0, n.jsxs)("div", {
              className: "overflow-hidden rounded-[inherit]",
              children: [
                e.request &&
                  (0, n.jsx)(p, {
                    lines: e.request,
                    dense: c,
                    className: (0, d.f)(
                      "px-5 py-4",
                      t > 0 && "border-t border-code-hairline",
                    ),
                  }),
                e.strip &&
                  l &&
                  (0, n.jsx)(b, {
                    strip: e.strip,
                    first: 0 === t && !e.request,
                    bottom: !!e.response,
                  }),
                l && m,
              ],
            }),
            !l &&
              e.strip &&
              (0, n.jsx)(s.I, {
                expanded: f,
                rounded: r || f,
                strip: (0, n.jsx)(g, {
                  strip: e.strip,
                  expanded: f,
                  onToggle: u ? o : void 0,
                }),
                children: u && m,
              }),
          ],
        });
      }
      var P = e.i(662537),
        E = e.i(383035);
      let M = ["cURL", "Node", "Python", "MCP"];
      e.s(
        [
          "v",
          0,
          function ({
            lines: i,
            tabs: a,
            accent: l,
            meta: c,
            dense: f,
            quote: x,
            run: h,
            example: g,
            exampleNote:
              b = "Example values, built from the documented fields.",
            onRun: y,
            onRequestChange: j,
            initialEdits: v,
            onEditsChange: w,
            runBelow: N,
            quoteControls: k,
            prose: C,
            initialState: S,
            runnable: _,
            editable: $,
            hints: O,
            flush: A,
            language: T,
            copy: R = !0,
            className: I,
          }) {
            let [q, W] = (0, u.useState)(null),
              F = q ?? h,
              D = Array.isArray(i) ? null : i,
              L = a ?? (D ? Object.keys(D) : M),
              [U, G] = (0, u.useState)(L[0] ?? ""),
              B =
                (!!h || !!y) && (Array.isArray(_) ? _.includes(U) : (_ ?? !!x)),
              K = Array.isArray(i) ? i : (i[U] ?? i[L[0] ?? ""] ?? []),
              V = S ?? (x ? "quoted" : F ? "called" : "quoted"),
              [H, J] = (0, u.useState)("quoted" !== V),
              [Z, Q] = (0, u.useState)("expanded" === V),
              [Y, X] = (0, u.useState)("idle"),
              [ee, et] = (0, u.useState)(0),
              en = (0, u.useRef)([]);
            (0, u.useEffect)(
              () => () => en.current.forEach((e) => window.clearTimeout(e)),
              [],
            );
            let es = (e, t) => {
                en.current.push(window.setTimeout(t, e));
              },
              [er, ei] = (0, u.useState)(() => v ?? {});
            (0, u.useEffect)(() => {
              w?.(er);
            }, [er, w]);
            let ea = er[U] ?? {},
              [eo, el] = (0, u.useState)(null),
              ed = "idle" !== Y,
              ec = async (e) => {
                let t,
                  n = !H;
                X("sending");
                try {
                  t = await e(ey);
                } catch (e) {
                  (en.current.forEach((e) => window.clearTimeout(e)),
                    (en.current = []),
                    X("idle"),
                    P.y(e, { tags: { where: "code block run" } }));
                  return;
                }
                t
                  ? (W(t),
                    J(!0),
                    et((e) => e + 1),
                    X("landing"),
                    es(300, () => {
                      (X("idle"), n && (t.response || t.preview) && Q(!0));
                    }))
                  : X("idle");
              },
              eu = () => {
                if (ed) return;
                if (
                  (en.current.forEach((e) => window.clearTimeout(e)),
                  (en.current = []),
                  y)
                )
                  return void ec(y);
                if (!F) return;
                let e = !H;
                (X("sending"),
                  es(450, () => {
                    (J(!0), et((e) => e + 1), X("landing"));
                  }),
                  es(750, () => {
                    (X("idle"), e && (F.response || F.preview) && Q(!0));
                  }));
              },
              ef = !H && !!g?.length,
              ep = !!(F?.response || F?.preview),
              em = Z && (H ? ep : ef),
              ex = Array.isArray($) ? $.includes(U) : $,
              eh = ex ? void 0 : "string" == typeof T ? T : T?.[U],
              eg = (function (n) {
                let [s, r] = (0, u.useState)(() => t);
                return (
                  (0, u.useEffect)(() => {
                    if (!n || s) return;
                    let i = !0;
                    return (
                      e.A(250582).then((e) => {
                        ((t = e.highlight), i && r(() => e.highlight));
                      }),
                      () => {
                        i = !1;
                      }
                    );
                  }, [n, s]),
                  s
                );
              })(void 0 !== eh),
              eb =
                eg && eh
                  ? eg(K.map(m).join("\n"), eh).map((e) =>
                      e.map((e) => ({ ...e, tone: "text" })),
                    )
                  : (0, r.d)(K, ea),
              ey = eb.map(m).join("\n");
            (0, u.useEffect)(() => {
              B && j?.(ey);
            }, [ey, B, j]);
            let ej = ex
                ? {
                    hints: O,
                    keys: (0, r.z)(eb),
                    editingKey: eo,
                    changed: (e) => void 0 !== ea[e],
                    onStart: el,
                    onCommit: (e, t) => {
                      (ei((n) => ({ ...n, [U]: { ...(n[U] ?? {}), [e]: t } })),
                        el(null),
                        j && (W(null), J(!1), Q(!1)));
                    },
                    onCancel: () => el(null),
                  }
                : void 0,
              ev = H ? "Run again" : "Run this call",
              ew = (0, n.jsxs)(s.g, {
                expanded: em,
                flush: A,
                className: I,
                children: [
                  (0, n.jsxs)("div", {
                    className: (0, d.f)(
                      "overflow-hidden rounded-[inherit]",
                      (x || F) && "rounded-b-none",
                    ),
                    children: [
                      (0, n.jsx)(s.q, {
                        tabs: L,
                        active: U,
                        accent: l ?? Object.keys(C ?? {}),
                        onTab: (e) => {
                          (G(e), el(null));
                        },
                        meta: c,
                        copyText: R ? ey : void 0,
                        run:
                          B && void 0 === N
                            ? (0, n.jsx)(o.K, {
                                type: "button",
                                size: "sm",
                                disabled: ed,
                                onClick: eu,
                                className:
                                  "h-7 rounded-code-control bg-code-button-bg px-3 font-code-ui text-[12px] leading-4 font-semibold text-code-button-fg transition-transform hover:bg-code-button-bg/90 active:scale-[0.97] disabled:opacity-100",
                                children: ev,
                              })
                            : void 0,
                      }),
                      (0, n.jsx)("div", {
                        className: (0, d.f)(
                          "motion-safe:transition-opacity motion-safe:duration-300",
                          "sending" === Y && "opacity-70",
                        ),
                        children:
                          C?.[U]?.body ??
                          (0, n.jsx)(p, {
                            lines: eb,
                            dense: f,
                            className: "px-5 py-4",
                            edit: ej,
                          }),
                      }),
                    ],
                  }),
                  k &&
                    (0, n.jsx)("div", {
                      className:
                        "flex flex-wrap items-center gap-1.5 border-t border-code-hairline bg-code-surface px-[13px] py-2 empty:hidden",
                      children: k,
                    }),
                  (x || F) &&
                    (0, n.jsx)(z, {
                      expanded: em,
                      flush: A,
                      quote:
                        x && j && eo
                          ? {
                              ...x,
                              primary: "Finish editing for a price",
                              secondary: void 0,
                            }
                          : x,
                      run: F,
                      example: g,
                      showExample: ef,
                      exampleNote: b,
                      phase: Y,
                      hasRun: H,
                      onToggle: () => {
                        (H || ef) && Q((e) => !e);
                      },
                      runCount: ee,
                      dense: f,
                    }),
                ],
              });
            if (void 0 === N) return ew;
            let eN = C?.[U],
              ek =
                "px-[18px] font-mono text-xs tracking-[0.06em] uppercase max-sm:w-full";
            return (0, n.jsxs)(n.Fragment, {
              children: [
                ew,
                (0, n.jsxs)("div", {
                  className: "mt-4 flex flex-wrap items-center gap-x-5 gap-y-3",
                  children: [
                    B &&
                      (0, n.jsxs)(o.K, {
                        size: "2xl",
                        type: "button",
                        disabled: ed,
                        onClick: eu,
                        className: ek,
                        children: [(0, n.jsx)(E.f, { "aria-hidden": !0 }), ev],
                      }),
                    eN &&
                      (0, n.jsx)(s.d, {
                        text: ey,
                        label: eN.copyLabel,
                        className: ek,
                      }),
                    N,
                  ],
                }),
              ],
            });
          },
          "a",
          0,
          function ({
            strip: e,
            lines: t,
            tabs: r = ["Response"],
            dense: i,
            className: a,
          }) {
            let [o, l] = (0, u.useState)(r[0] ?? "");
            return (0, n.jsx)(s.g, {
              className: a,
              children: (0, n.jsxs)("div", {
                className: "overflow-hidden rounded-[inherit]",
                children: [
                  (0, n.jsx)(s.q, {
                    tabs: r,
                    active: o,
                    onTab: l,
                    copyText: t.map(m).join("\n"),
                  }),
                  (0, n.jsx)(b, { strip: e, first: !0, bottom: !0 }),
                  (0, n.jsx)(p, {
                    lines: t,
                    dense: i,
                    className: "px-5 pt-4 pb-[18px]",
                  }),
                ],
              }),
            });
          },
          "C",
          0,
          function ({
            calls: e,
            tabs: t,
            meta: r,
            hops: i,
            dense: a,
            className: o,
          }) {
            let [l, d] = (0, u.useState)(t[0] ?? ""),
              [c, f] = (0, u.useState)(() => e.map(() => !1)),
              p = e
                .flatMap((e) => [
                  ...(e.request ?? []).map(m),
                  ...(e.response ?? []).map(m),
                ])
                .join("\n");
            return (0, n.jsxs)(s.g, {
              className: o,
              children: [
                (0, n.jsx)(s.q, {
                  tabs: t,
                  active: l,
                  onTab: d,
                  meta: r,
                  copyText: p,
                }),
                e.map((t, s) =>
                  (0, n.jsx)(
                    $,
                    {
                      call: t,
                      index: s,
                      last: s === e.length - 1,
                      open: c[s] ?? !1,
                      onToggle: () => f((e) => e.map((e, t) => t === s && !e)),
                      hops: i,
                      dense: a,
                    },
                    s,
                  ),
                ),
              ],
            });
          },
          "$",
          0,
          function ({
            lines: e,
            copy: t = "label",
            className: r,
            copyClassName: i,
          }) {
            return (0, n.jsxs)("div", {
              className: (0, d.f)(
                "flex items-center justify-between gap-3 rounded-code-control border border-code-hairline bg-code-bg py-2 pr-2 pl-3 text-code-text",
                r,
              ),
              children: [
                (0, n.jsx)(p, { lines: e, dense: !0 }),
                t &&
                  (0, n.jsx)(s.G, {
                    text: e.map(m).join("\n"),
                    iconOnly: "icon" === t,
                    className: i,
                  }),
              ],
            });
          },
        ],
        769809,
      );
    },
  ],
  [
    [407043, 183343, 132458, 688060],
    (e) => {
      "use strict";
      var t = e.i(843476),
        n = e.i(519455),
        s = e.i(808562),
        r = e.i(975157),
        i = e.i(689664),
        a = e.i(508734),
        o = e.i(328623),
        l = e.i(271645);
      function d(e) {
        let [t, n] = (0, l.useState)(!1),
          s = (0, l.useRef)(null);
        return (
          (0, l.useEffect)(
            () => () => window.clearTimeout(s.current ?? void 0),
            [],
          ),
          {
            copied: t,
            copy: async () => {
              try {
                await navigator.clipboard?.writeText(e);
              } catch {}
              (n(!0),
                window.clearTimeout(s.current ?? void 0),
                (s.current = window.setTimeout(() => n(!1), 1200)));
            },
          }
        );
      }
      function c({ text: e, iconOnly: s, className: i }) {
        let { copied: o, copy: l } = d(e);
        return (0, t.jsxs)(n.K, {
          type: "button",
          variant: "ghost",
          size: s ? "icon-xs" : "sm",
          "aria-label": s ? (o ? "Copied" : "Copy") : void 0,
          onClick: () => void l(),
          className: (0, r.f)(
            "rounded-code-control border border-code-control-border font-code-ui text-[12px] leading-4 font-semibold text-code-text hover:bg-code-control hover:text-code-text",
            s ? "size-6" : "h-7 gap-1.5 px-2.5",
            i,
          ),
          children: [
            (0, t.jsx)(a.f, { className: "size-3" }),
            !s && (o ? "Copied" : "Copy"),
          ],
        });
      }
      e.s(
        [
          "q",
          0,
          function ({
            tabs: e,
            active: n,
            onTab: i,
            meta: a,
            copyText: l,
            run: d,
            accent: u = [],
          }) {
            return (0, t.jsxs)("div", {
              className:
                "flex h-11 items-center justify-between gap-2 overflow-hidden rounded-t-[inherit] border-b border-code-hairline pr-2 pl-1",
              children: [
                (0, t.jsx)(s.z, {
                  className:
                    "flex min-w-0 items-start gap-0.5 self-stretch overflow-x-auto overflow-y-hidden px-1 pt-[7.5px]",
                  "aria-label": "Code samples",
                  value: n,
                  onValueChange: i,
                  children: e.map((e) =>
                    (0, t.jsxs)(
                      s.H,
                      {
                        value: e,
                        variant: "ghost",
                        size: "sm",
                        className: (t) =>
                          (0, r.f)(
                            "h-7 rounded-code-control px-2.5 font-code-ui text-[12px] leading-4 hover:bg-code-control hover:text-code-text",
                            t.pressed
                              ? "bg-code-control font-semibold text-code-text"
                              : "font-medium text-code-text-dim",
                            u.includes(e) && "gap-1.5 text-code-accent",
                          ),
                        children: [
                          u.includes(e) &&
                            (0, t.jsx)(o.f, {
                              "aria-hidden": !0,
                              className: "size-3",
                            }),
                          e,
                        ],
                      },
                      e,
                    ),
                  ),
                }),
                (0, t.jsxs)("div", {
                  className: "flex shrink-0 items-center gap-1.5",
                  children: [
                    a &&
                      (0, t.jsx)("span", {
                        className:
                          "pr-1 font-mono text-[12px] leading-4 text-code-muted",
                        children: a,
                      }),
                    void 0 !== l && (0, t.jsx)(c, { text: l }),
                    d,
                  ],
                }),
              ],
            });
          },
          "g",
          0,
          function ({ children: e, expanded: n, flush: s, className: i }) {
            return (0, t.jsx)("div", {
              className: (0, r.f)(
                "relative flex w-full min-w-0 flex-col rounded-code-block border border-code-hairline bg-code-bg text-code-text scheme-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                n && "z-20",
                s && "rounded-none border-0 shadow-none",
                i,
              ),
              children: e,
            });
          },
          "d",
          0,
          function ({ text: e, label: s, className: r }) {
            let { copied: o, copy: l } = d(e);
            return (0, t.jsxs)(n.K, {
              size: "2xl",
              type: "button",
              onClick: () => void l(),
              className: r,
              children: [
                o
                  ? (0, t.jsx)(i.f, { "aria-hidden": !0 })
                  : (0, t.jsx)(a.f, { "aria-hidden": !0 }),
                o ? "Copied" : s,
              ],
            });
          },
          "G",
          0,
          c,
          "I",
          0,
          function ({
            expanded: e,
            flush: n,
            rounded: s = !0,
            strip: i,
            children: a,
          }) {
            return (0, t.jsx)("div", {
              className: "relative h-10 shrink-0",
              children: (0, t.jsxs)("div", {
                className: (0, r.f)(
                  "absolute inset-x-[-1px] top-0 z-20 overflow-hidden border border-t-0 border-code-hairline bg-code-bg motion-safe:transition-[border-radius] motion-safe:ease-out",
                  s ? "rounded-b-code-block" : "rounded-none",
                  e
                    ? "motion-safe:duration-[220ms]"
                    : "motion-safe:duration-[160ms]",
                  n && "inset-x-0 rounded-none border-0",
                ),
                children: [
                  i,
                  (0, t.jsx)("div", {
                    inert: !e,
                    className: (0, r.f)(
                      "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:ease-out",
                      e
                        ? "grid-rows-[1fr] opacity-100 motion-safe:duration-[220ms]"
                        : "pointer-events-none grid-rows-[0fr] opacity-0 motion-safe:duration-[160ms]",
                    ),
                    children: (0, t.jsx)("div", {
                      className: "min-h-0 overflow-hidden",
                      children: (0, t.jsx)("div", {
                        className:
                          "max-h-[500px] overflow-y-auto border-t border-code-hairline",
                        children: a,
                      }),
                    }),
                  }),
                ],
              }),
            });
          },
        ],
        407043,
      );
      let u = {
        muted: "text-code-muted",
        text: "text-code-text",
        string: "text-code-string",
        accent: "font-medium text-code-accent",
        dim: "text-code-text-dim",
      };
      function f({ mark: e, listing: n }) {
        return (0, t.jsxs)("span", {
          title: n,
          className:
            "inline-flex h-5 min-w-0 items-center gap-1.5 rounded-code-chip border border-code-control-border bg-code-control pr-2 pl-[3px]",
          children: [
            (0, t.jsx)("span", {
              className:
                "flex size-3.5 shrink-0 items-center justify-center rounded-[3px] bg-code-button-bg font-code-ui text-[9px] font-bold text-code-button-fg",
              children: e,
            }),
            (0, t.jsx)("span", {
              className:
                "truncate font-mono text-[12px] leading-4 text-code-text",
              children: n,
            }),
          ],
        });
      }
      e.s(
        [
          "E",
          0,
          function ({ stopped: e }) {
            return (0, t.jsxs)("span", {
              className:
                "relative flex size-[22px] shrink-0 items-center justify-center rounded-full bg-code-accent-tint",
              children: [
                (0, t.jsx)("span", {
                  className: (0, r.f)(
                    "absolute size-3.5 rounded-full border-[1.5px] border-code-accent/50 motion-safe:transition-transform motion-safe:duration-200",
                    e ? "scale-0" : "motion-safe:animate-code-beacon",
                  ),
                }),
                (0, t.jsx)("span", {
                  className: "size-1.5 rounded-full bg-code-accent",
                }),
              ],
            });
          },
          "d",
          0,
          function ({ value: e }) {
            let n = /_live_|_run_/.test(e);
            return (0, t.jsxs)("span", {
              className:
                "inline-flex h-[18px] shrink-0 items-center gap-1.5 rounded-code-chip border border-code-control-border bg-code-control px-[7px]",
              children: [
                (0, t.jsx)("span", {
                  className: (0, r.f)(
                    "size-1.5 rounded-full",
                    n ? "bg-code-ok" : "bg-code-muted",
                  ),
                }),
                (0, t.jsx)("span", {
                  className: "font-mono text-[12px] leading-4 text-code-text",
                  children: e,
                }),
              ],
            });
          },
          "C",
          0,
          f,
          "Q",
          0,
          function ({ result: e }) {
            let n = e.stats.split(" · ");
            return (0, t.jsxs)("div", {
              className: "flex items-center gap-2.5 px-5 pt-3.5 pb-1",
              children: [
                (0, t.jsx)(f, { mark: e.mark, listing: e.listing }),
                (0, t.jsx)("span", {
                  className:
                    "flex shrink-0 items-center font-mono text-[13px] leading-5 whitespace-nowrap",
                  children: n.map((e, s) =>
                    (0, t.jsxs)(
                      "span",
                      {
                        className: "flex items-center",
                        children: [
                          s > 0 &&
                            (0, t.jsx)("span", {
                              className: "px-2 text-code-muted/45",
                              children: "·",
                            }),
                          (0, t.jsx)("span", {
                            className: (0, r.f)(
                              s === n.length - 1 && e.startsWith("$")
                                ? "font-semibold text-code-accent"
                                : "text-code-text",
                            ),
                            children: e,
                          }),
                        ],
                      },
                      s,
                    ),
                  ),
                }),
                e.chosen &&
                  (0, t.jsx)("span", {
                    className:
                      "inline-flex h-[18px] items-center rounded-code-chip bg-code-accent-tint px-[7px] font-code-ui text-[11px] leading-4 font-semibold tracking-code-pill text-code-accent",
                    children: "chosen",
                  }),
              ],
            });
          },
          "G",
          0,
          function ({ status: e, ok: n }) {
            return (0, t.jsx)("span", {
              className: (0, r.f)(
                "inline-flex h-5 shrink-0 items-center rounded-code-chip px-[7px] font-mono text-[11px] leading-4 font-semibold tracking-code-pill",
                n
                  ? "bg-code-ok-tint text-code-ok"
                  : "bg-code-accent-tint text-code-accent",
              ),
              children: e,
            });
          },
          "z",
          0,
          u,
        ],
        183343,
      );
      let p = /((?:ak|orth|sk)_(?:live|test|run)_[A-Za-z0-9•…]+)/,
        m =
          /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|https?:\/\/[^\s'"]+|\$?\d[\d,.]*[A-Za-z%★]*|[A-Za-z_$][\w\-.$/]*|\s+|.)/g,
        x = new Set([
          "curl",
          "orth",
          "npx",
          "npm",
          "pip",
          "brew",
          "gem",
          "go",
          "cargo",
          "composer",
          "git",
          "sleep",
        ]),
        h = new Set([
          "if",
          "const",
          "await",
          "return",
          "let",
          "var",
          "function",
          "import",
          "from",
          "new",
        ]),
        g = new Set(["→", "←", "↳", "·", "★", "—"]),
        b = /^(curl|POST|GET|PUT|PATCH|DELETE|→)\b/;
      function y(e) {
        let t = [],
          n = (e, n) => {
            let s = t[t.length - 1];
            s && "tone" in s && s.tone === n
              ? (s.text += e)
              : t.push({ text: e, tone: n });
          },
          s = b.test(e.trimStart());
        return (
          e.split(p).forEach((e, r) => {
            if (!e) return;
            if (r % 2 == 1) return void t.push({ key: e });
            let i = e.match(m) ?? [],
              a = !0;
            i.forEach((e, r) => {
              let o = i.slice(r + 1).find((e) => !/^\s+$/.test(e)) ?? "";
              if (/^\s+$/.test(e)) {
                let s;
                return void n(
                  e,
                  (s = t[t.length - 1]) && "tone" in s ? s.tone : "muted",
                );
              }
              if ('"' === e[0] || "'" === e[0])
                n(e, ":" === o ? "muted" : "string");
              else if (e.startsWith("http")) {
                let t = e.match(/^(https?:\/\/[^/]+)(.*)$/);
                t
                  ? (n(t[1] ?? "", "text"),
                    t[2] && n(t[2], s ? "accent" : "text"))
                  : n(e, "text");
              } else
                /^[A-Za-z_][\w\-.]*:$/.test(e)
                  ? n(e, "muted")
                  : /^\$?\d/.test(e)
                    ? n(e, "text")
                    : e.startsWith("/")
                      ? n(e, s ? "accent" : "text")
                      : e.startsWith("-") ||
                          g.has(e) ||
                          (a && (x.has(e) || "$" === e)) ||
                          h.has(e)
                        ? n(e, "muted")
                        : /^[A-Za-z_$]/.test(e)
                          ? n(
                              e,
                              ":" !== o || e.startsWith("$") ? "text" : "muted",
                            )
                          : n(e, "muted");
              a = !1;
            });
          }),
          t
        );
      }
      function j(e) {
        if (!("tone" in e)) return null;
        if (!e.bare) {
          var t;
          let n, s, r;
          return "string" === e.tone
            ? ((t = e.text),
              ('"' !==
                (r = (s = (n = t.match(/\s*$/)?.[0] ?? "")
                  ? t.slice(0, -n.length)
                  : t)[0]) &&
                "'" !== r) ||
              s.length < 2 ||
              s[s.length - 1] !== r
                ? null
                : { quote: r, inner: s.slice(1, -1), trailing: n })
            : null;
        }
        let [, n = "", s = ""] = e.text.match(/^(.*?)([,\s]*)$/) ?? [];
        return { quote: "", inner: n, trailing: s };
      }
      function v({
        initial: e,
        name: n,
        dense: s,
        hasNext: i,
        hasPrev: a,
        onCommit: o,
        onCancel: d,
        onMove: c,
      }) {
        let [u, f] = (0, l.useState)(e),
          p = (0, l.useRef)(null),
          m = (0, l.useRef)(!1);
        (0, l.useEffect)(() => {
          (p.current?.focus(), p.current?.select());
        }, []);
        let x = (e) => {
          m.current || ((m.current = !0), null === e ? d() : o(e));
        };
        return (0, t.jsx)("span", {
          className:
            "inline-flex h-[18px] items-center rounded-[3px] border-b border-code-accent bg-white/[0.09] px-[3px]",
          children: (0, t.jsx)("input", {
            ref: p,
            "aria-label": n,
            value: u,
            onChange: (e) => f(e.target.value),
            onKeyDown: (e) => {
              if (
                ("Enter" === e.key && x(u),
                "Escape" === e.key && x(null),
                "Tab" === e.key)
              ) {
                let t = e.shiftKey ? "prev" : "next";
                ("next" === t ? i : a)
                  ? (e.preventDefault(), x(u), c(t))
                  : x(u);
              }
            },
            onBlur: () => x(u),
            style: { width: `${Math.max(u.length, 1)}ch` },
            className: (0, r.f)(
              "m-0 border-0 bg-transparent p-0 font-mono text-code-string caret-code-accent outline-none",
              s ? "text-[12px] leading-4" : "text-[13px] leading-5",
            ),
          }),
        });
      }
      (e.s(["f", 0, y], 132458),
        e.s(
          [
            "W",
            0,
            function ({
              token: e,
              name: n,
              editing: s,
              changed: i,
              dense: a,
              hasNext: o,
              hasPrev: l,
              onStart: d,
              onCommit: c,
              onCancel: f,
              onMove: p,
            }) {
              let m = j(e);
              return m
                ? (0, t.jsxs)("span", {
                    className: (0, r.f)(
                      "inline-flex shrink-0 items-center",
                      u.string,
                    ),
                    children: [
                      m.quote,
                      s
                        ? (0, t.jsx)(v, {
                            initial: m.inner,
                            name: n,
                            dense: a,
                            hasNext: o,
                            hasPrev: l,
                            onCommit: c,
                            onCancel: f,
                            onMove: p,
                          })
                        : (0, t.jsx)("button", {
                            type: "button",
                            "aria-label": `Edit ${n}`,
                            onClick: d,
                            className: (0, r.f)(
                              "-mx-[3px] cursor-text rounded-[3px] px-[3px] underline underline-offset-[3px] hover:bg-code-surface-hover",
                              i
                                ? "decoration-solid decoration-code-accent"
                                : "decoration-dotted decoration-code-muted/70",
                            ),
                            children: m.inner,
                          }),
                      m.quote,
                      m.trailing,
                    ],
                  })
                : (0, t.jsx)("span", {
                    className: (0, r.f)("shrink-0", u.string),
                    children: e.text,
                  });
            },
            "d",
            0,
            function (e, t) {
              return e.map((e, n) =>
                ("string" == typeof e ? y(e) : e).map((e, s) => {
                  let r = t[`${n}:${s}`];
                  if (void 0 === r || !("tone" in e)) return e;
                  let i = j(e);
                  return i
                    ? { ...e, text: `${i.quote}${r}${i.quote}${i.trailing}` }
                    : e;
                }),
              );
            },
            "z",
            0,
            function (e) {
              return e.flatMap((e, t) =>
                ("string" == typeof e ? y(e) : e).flatMap((e, n) =>
                  j(e) ? [`${t}:${n}`] : [],
                ),
              );
            },
            "t",
            0,
            function (e, t) {
              for (let n = t - 1; n >= 0; n -= 1) {
                let t = e[n];
                if (t && "tone" in t && t.text.trim())
                  return t.text.match(/["']([\w.-]+)["']\s*:\s*$/)?.[1] ?? null;
              }
              return null;
            },
          ],
          688060,
        ));
    },
  ],
];
