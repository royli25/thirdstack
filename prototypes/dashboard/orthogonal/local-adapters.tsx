import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Key01,
  Code01,
  Play,
  TerminalSquare,
  SearchLg,
  Check,
  CheckVerified01,
  XClose,
  Copy01,
  Menu01,
  Plus,
  CreditCard01,
  ShieldTick,
  Coins01,
} from "@untitledui/icons";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { DropdownMenu, ToggleGroup } from "radix-ui";
import catalog from "./data/catalog.json";
import assetManifest from "./data/assets.json";
import { referenceModules } from "./vendor/reference-modules.js";
import { codeModules } from "./vendor/code-modules.js";

type AnyRecord = Record<string, any>;
const data = catalog as any[];
export const publishers: AnyRecord[] = data.find(
  ([q]) => q[0][1] === "publishers",
)![1];
export const categories: AnyRecord[] = data.find(
  ([q]) => q[0][1] === "categories",
)![1];
const snapshots = new Map(
  data
    .filter(([q]) => q[0][1] === "publisher")
    .map(([q, d]) => [q[1].input.slug, d]),
);
const imageMap = new Map(
  Object.entries(assetManifest).map(([path, url]) => [
    url,
    `/orthogonal/assets${path}`,
  ]),
);
const bundledAssets = import.meta.glob<string>("./assets/**/*", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
export function localImage(src: string) {
  const local =
    imageMap.get(src) ??
    (src?.startsWith("/logos/") ? `/orthogonal/assets${src}` : src);
  const relative = local?.replace("/orthogonal/assets/", "./assets/");
  return bundledAssets[relative] ?? local;
}
const cn = (...values: any[]) => twMerge(clsx(values));
const iconMap: Record<string, any> = {
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "arrow-up": ArrowUp,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "key-round": Key01,
  key: Key01,
  braces: Code01,
  play: Play,
  "square-terminal": TerminalSquare,
  search: SearchLg,
  check: Check,
  "badge-check": CheckVerified01,
  "circle-check": CheckVerified01,
  x: XClose,
  copy: Copy01,
  menu: Menu01,
  plus: Plus,
  "credit-card": CreditCard01,
  "shield-check": ShieldTick,
  coins: Coins01,
};
function NativeButton({ render, children, ...props }: AnyRecord) {
  return render ? (
    React.cloneElement(render, props, children ?? render.props.children)
  ) : (
    <button {...props}>{children}</button>
  );
}
function linkDestination(href: string) {
  return href === "/"
    ? "/orthogonal.html"
    : href?.startsWith("/")
      ? `https://www.orthogonal.com${href}`
      : href;
}
function LocalLink({
  href,
  children,
  prefetch: _prefetch,
  scroll: _scroll,
  replace: _replace,
  ...props
}: AnyRecord) {
  const localHome = href === "/";
  const destination = linkDestination(href);
  return (
    <a
      href={destination}
      {...(!localHome && destination?.startsWith("http")
        ? { target: "_blank", rel: "noreferrer" }
        : {})}
      {...props}
    >
      {children}
    </a>
  );
}
function LocalImage({
  src,
  fill,
  unoptimized: _u,
  priority: _p,
  quality: _q,
  placeholder: _ph,
  blurDataURL: _b,
  ...props
}: AnyRecord) {
  return (
    <img
      src={localImage(src)}
      {...props}
      style={
        fill
          ? {
              position: "absolute",
              width: "100%",
              height: "100%",
              inset: 0,
              ...props.style,
            }
          : props.style
      }
    />
  );
}
function queryOptions(name: string, args?: AnyRecord) {
  const input = args?.input;
  let result: any;
  if (name === "publishers") result = publishers;
  else if (name === "categories" || name === "categoriesByUse")
    result = categories;
  else if (name === "publisher") result = snapshots.get(input?.slug);
  else if (name === "search")
    result = {
      results: publishers
        .filter((p) =>
          `${p.name} ${p.blurb}`
            .toLowerCase()
            .includes((input?.query ?? "").toLowerCase()),
        )
        .slice(0, 6),
    };
  return { data: result, queryKey: [name, input] };
}
const localCatalog = new Proxy(
  {},
  {
    get: (_, name: string) => ({
      queryOptions: (args?: AnyRecord) => queryOptions(name, args),
    }),
  },
);
const queryHook = (options: AnyRecord) => ({
  data: options?.data,
  isPending: false,
  isLoading: false,
  error: null,
});
const auth = () => ({
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  orgId: null,
});
const router = {
  push: (href: string) => {
    const destination = linkDestination(href);
    if (href === "/") window.location.assign(destination);
    else window.open(destination, "_blank", "noopener,noreferrer");
  },
  replace: (href: string) => {
    const destination = linkDestination(href);
    if (href === "/") window.location.replace(destination);
    else window.open(destination, "_blank", "noopener,noreferrer");
  },
  prefetch: () => {},
  refresh: () => {},
};
function SignIn({ children, ...props }: AnyRecord) {
  return (
    <a
      href="#prototype-sign-in"
      {...props}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent("orthogonal-prototype-dialog", { detail: "Sign in" }),
        );
      }}
    >
      {children}
    </a>
  );
}
function TryCall({ publisher, endpoint }: AnyRecord) {
  const CodeView = load(769809).v;
  const lines = load(655667)
    .c(
      endpoint.callSlug,
      endpoint,
      { api: "https://api.orthogonal.com/v1" },
      new Set(),
    )
    .map((line: AnyRecord) => line.text);
  return (
    <CodeView
      lines={lines}
      tabs={["cURL"]}
      quote={{
        mark: publisher.name[0],
        listing: `${publisher.name} · ${endpoint.name}`,
        primary: "$0.03 per call",
      }}
      onRun={async () => {
        window.dispatchEvent(
          new CustomEvent("orthogonal-prototype-dialog", {
            detail: "Create an account to try this API",
          }),
        );
        return undefined;
      }}
    />
  );
}
function SearchSuggestions({ query, category }: AnyRecord) {
  const matches = publishers
    .filter(
      (p) =>
        (!category || p.categorySlugs.includes(category)) &&
        `${p.name} ${p.blurb}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 4);
  const PublisherLogo = load(103697).PublisherLogo;
  return (
    <div className="animate-in fade-in-0 slide-in-from-top-1 absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl duration-(--motion-ui) ease-(--ease-enter) motion-reduce:animate-none">
      <p className="border-b border-border px-4 py-3 font-mono text-2xs tracking-wide text-muted-foreground uppercase">
        APIs
      </p>
      {matches.map((p) => (
        <LocalLink
          href={`/publisher/${p.slug}`}
          key={p.slug}
          className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-(--motion-fast) ease-(--ease-ui) hover:bg-muted focus-visible:bg-muted"
        >
          <PublisherLogo publisher={p} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{p.name}</span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {p.endpoints} endpoints · {p.blurb}
            </span>
          </span>
        </LocalLink>
      ))}
      {!matches.length && (
        <p role="status" className="px-4 py-4 text-sm text-muted-foreground">
          Nothing in the catalog matches this yet.
        </p>
      )}
      <div className="bg-muted px-4 py-3 text-xs text-muted-foreground">
        Local catalog snapshot
      </div>
    </div>
  );
}
const unknownModules = new Map<number, AnyRecord>();
const overrides = new Map<number, AnyRecord>([
  [768877, { f: ArrowRight }],
  [375775, { f: ArrowUpRight }],
  [758925, { f: Key01 }],
  [159888, { f: Code01 }],
  [21357, { f: Play }],
  [383035, { f: TerminalSquare }],
  [716327, { f: ChevronDown }],
  [566595, { f: SearchLg }],
  [84449, { f: CreditCard01 }],
  [578171, { f: Check }],
  [980799, { f: Check }],
  [867927, { f: ChevronRight }],
  [
    843476,
    {
      ...jsxRuntime,
      jsx: (type: any, props: any, ...rest: any[]) => {
        if (!type)
          throw new Error(
            "Missing JSX component: " + JSON.stringify(Object.keys(props)),
          );
        return (jsxRuntime.jsx as any)(type, props, ...rest);
      },
      jsxs: (type: any, props: any, ...rest: any[]) => {
        if (!type)
          throw new Error(
            "Missing JSX component: " + JSON.stringify(Object.keys(props)),
          );
        return (jsxRuntime.jsxs as any)(type, props, ...rest);
      },
    },
  ],
  [271645, React],
  [174080, { createPortal }],
  [975157, { f: cn }],
  [207670, { f: clsx }],
  [154452, { f: queryHook }],
  [266027, { f: queryHook }],
  [
    492855,
    { r: { catalog: localCatalog }, d: () => ({ catalog: localCatalog }) },
  ],
  [297819, { f: auth }],
  [354245, { f: () => ({ organization: null }) }],
  [368356, { Link: LocalLink, NavigationBar: () => null }],
  [325164, { default: LocalImage }],
  [
    298428,
    {
      getImageProps: (props: AnyRecord) => ({
        props: { ...props, src: localImage(props.src) },
      }),
    },
  ],
  [
    456420,
    {
      f: ({ name }: AnyRecord) => {
        const Icon = iconMap[name];
        if (!Icon) throw new Error(`Unmapped interface icon: ${name}`);
        return Icon;
      },
    },
  ],
  [527930, { Button: NativeButton }],
  [984452, { z }],
  [
    853355,
    {
      f: ({ when, children }: AnyRecord) =>
        when === "signed-out" ? children : null,
    },
  ],
  [247167, { env: {} }],
  [619877, { z }],
  [689664, { f: Check }],
  [508734, { f: Copy01 }],
  [328623, { f: Plus }],
  [
    808562,
    {
      z: ({ children, value, onValueChange, ...props }: AnyRecord) => (
        <ToggleGroup.Root
          type="single"
          value={value}
          onValueChange={(v) => {
            if (v) onValueChange(v);
          }}
          {...props}
        >
          {React.Children.map(children, (child: any) =>
            React.isValidElement(child)
              ? React.cloneElement(child as any, { activeValue: value })
              : child,
          )}
        </ToggleGroup.Root>
      ),
      H: ({ className, activeValue, value, ...props }: AnyRecord) => (
        <ToggleGroup.Item
          value={value}
          className={
            typeof className === "function"
              ? className({ pressed: activeValue === value })
              : className
          }
          {...props}
        />
      ),
    },
  ],
  [86275, { SearchSuggestions }],
  [
    633078,
    {
      X: TryCall,
      u: () => ({
        quote: {
          mark: "H",
          listing: "Hunter · Email Finder",
          primary: "$0.01 per call",
        },
      }),
    },
  ],
  [
    671468,
    {
      useSiteUrls: () => ({
        api: "https://api.orthogonal.com/v1",
        origin: window.location.origin,
        mcp: "https://mcp.orthogonal.com",
      }),
      useAgentConnect: () => ({
        scope: "signed-out",
        name: "orthogonal",
        url: "https://mcp.orthogonal.com",
        command:
          "claude mcp add --transport http orthogonal https://mcp.orthogonal.com",
        payer: "Sign in to see who pays: your account or your organization.",
      }),
    },
  ],
  [
    618566,
    {
      useRouter: () => router,
      usePathname: () => "/",
      useSearchParams: () => new URLSearchParams(),
    },
  ],
  [529332, { b: () => "/sell", T: () => false }],
  [78996, { f: SignIn }],
  [
    755146,
    {
      G: DropdownMenu.Root,
      X: DropdownMenu.Trigger,
      L: ({ children, ...props }: AnyRecord) => (
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            {...props}
            className={cn("ortho-category-menu", props.className)}
          >
            {children}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      ),
      O: DropdownMenu.RadioGroup,
      T: ({ closeOnClick: _c, ...props }: AnyRecord) => (
        <DropdownMenu.RadioItem
          {...props}
          value={props.value}
          className="ortho-category-item"
        />
      ),
    },
  ],
  [793479, { f: (props: AnyRecord) => <input {...props} /> }],
  [
    604354,
    {
      default: {
        fill: "Blk7Ma_fill",
        horizon: "Blk7Ma_horizon",
        hv: "Blk7Ma_hv",
        plane: "Blk7Ma_plane",
      },
    },
  ],
  [
    78193,
    {
      z: { founders: "founders@orthogonal.com" },
      Z: { booking: "https://cal.com/orthogonal" },
    },
  ],
]);
const factories = new Map<number, (context: any) => void>();
for (const [ids, factory] of [...referenceModules, ...codeModules])
  for (const id of ids) factories.set(id, factory);
const exports = new Map<number, AnyRecord>();
const initialized = new Set<(context: any) => void>();
function load(id: number): AnyRecord {
  if (overrides.has(id)) return overrides.get(id)!;
  if (exports.has(id)) return exports.get(id)!;
  const factory = factories.get(id);
  const result: AnyRecord = {};
  exports.set(id, result);
  if (!factory) {
    exports.delete(id);
    if (!unknownModules.has(id))
      unknownModules.set(
        id,
        new Proxy(
          {},
          {
            get: (_, name) => {
              if (name === "__esModule") return true;
              return (..._args: any[]) => {
                throw new Error(
                  `Reference adapter ${id}.${String(name)} is unavailable`,
                );
              };
            },
          },
        ),
      );
    return unknownModules.get(id)!;
  }
  if (initialized.has(factory)) return result;
  initialized.add(factory);
  const context = {
    g: { process: { env: {} } },
    i: load,
    r: load,
    A: async (id: number) => {
      if (id === 250582) {
        const { highlightModules } =
          await import("./vendor/highlight-modules.js");
        for (const [ids, factory] of highlightModules)
          for (const id of ids) factories.set(id, factory);
        return load(946834);
      }
      return load(id);
    },
    v: (value: any) => {
      result.default = value;
    },
    s: (pairs: any[], target = id) => {
      const destination = exports.get(target) ?? {};
      exports.set(target, destination);
      for (let i = 0; i < pairs.length;) {
        const key = pairs[i++];
        if (pairs[i] === 0) {
          i++;
          destination[key] = pairs[i++];
        } else {
          const getter = pairs[i++];
          Object.defineProperty(destination, key, {
            enumerable: true,
            configurable: true,
            get: getter,
          });
        }
      }
    },
  };
  factory(context);
  return exports.get(id)!;
}
export function getReferenceComponents() {
  const { D1Root } = load(35813);
  const { D1Landing } = load(618248);
  return { D1Root, D1Landing };
}
