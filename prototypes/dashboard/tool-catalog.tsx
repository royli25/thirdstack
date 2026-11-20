import { useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight, SearchMd } from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  demoProviders,
  type DemoProvider,
  type DemoToolName,
} from "./demo-providers";
import { ProviderMark } from "./provider-mark";
import "./tool-catalog.css";

const categories = [
  ["all", "All tools"],
  ["search", "Web search"],
  ["extract", "Extraction"],
] as const;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 4,
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

type ToolSample = {
  name: string;
  requests: number;
  completed: number;
  failed: number;
  latency: number;
};

function statusOf(
  provider: DemoProvider,
  pausedTools: ReadonlySet<DemoToolName>,
) {
  if (provider.readiness === "preview") return "Preview";
  return provider.endpoints.every(({ name }) => pausedTools.has(name))
    ? "Paused"
    : "Available";
}

function lowestEstimate(provider: DemoProvider) {
  return Math.min(
    ...provider.endpoints.map(({ estimatedUsd }) => estimatedUsd),
  );
}

function ToolStatus({ status }: { status: ReturnType<typeof statusOf> }) {
  return (
    <Badge className="demo-catalog-status" variant="secondary">
      {status}
    </Badge>
  );
}

export function ToolCatalog({
  pausedTools,
  onToggle,
  samples,
}: {
  pausedTools: ReadonlySet<DemoToolName>;
  onToggle: (tool: DemoToolName, enabled: boolean) => void;
  samples: readonly ToolSample[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number][0]>("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("name");
  const [dialog, setDialog] = useState<DemoProvider | null>(null);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const term = query.trim().toLowerCase();
  const visible = demoProviders
    .filter((provider) => {
      const matchesAvailability =
        availability === "all" ||
        statusOf(provider, pausedTools) === availability;
      return (
        matchesAvailability &&
        (category === "all" ||
          provider.endpoints.some(({ operation }) => operation === category)) &&
        [
          provider.label,
          provider.summary,
          provider.description,
          ...provider.endpoints.map(({ name }) => name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    })
    .sort((a, b) =>
      sort === "price"
        ? lowestEstimate(a) - lowestEstimate(b) ||
          a.label.localeCompare(b.label)
        : a.label.localeCompare(b.label),
    );

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setAvailability("all");
  }

  function openDialog(
    event: MouseEvent<HTMLButtonElement>,
    next: typeof dialog,
  ) {
    returnFocus.current = event.currentTarget;
    setDialog(next);
  }

  function restoreFocus(event: Event) {
    event.preventDefault();
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    else search.current?.focus();
  }

  const detail = dialog;
  const detailSample = detail
    ? samples.find(({ name }) => name === detail.label)
    : undefined;

  return (
    <>
      <section className="demo-catalog" aria-label="Browse tools">
        <div className="demo-catalog-controls">
          <div className="demo-catalog-toolbar">
            <label className="demo-search demo-catalog-search">
              <SearchMd size={16} aria-hidden="true" />
              <Input
                ref={search}
                type="search"
                aria-label="Search tools"
                placeholder="Search tools or providers"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger
                aria-label="Availability"
                className="demo-catalog-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectItem value="all">Any availability</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Preview">Preview</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger
                aria-label="Sort tools"
                className="demo-catalog-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectItem value="name">Provider name</SelectItem>
                <SelectItem value="price">Lowest estimate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="demo-catalog-filters">
            <div
              className="demo-catalog-categories"
              role="group"
              aria-label="Tool categories"
            >
              {categories.map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-pressed={category === id}
                  onClick={() => setCategory(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="sr-only" role="status">
              {visible.length} {visible.length === 1 ? "provider" : "providers"}
            </p>
          </div>
        </div>

        <section aria-label="Tool results">
          {visible.length ? (
            <div className="demo-catalog-grid">
              {visible.map((tool) => {
                const endpoint = tool.endpoints[0];
                const multiple = tool.endpoints.length > 1;
                return (
                  <Card
                    className="demo-catalog-card"
                    role="article"
                    key={tool.id}
                  >
                    <div className="demo-catalog-card-intro">
                      <div className="demo-catalog-card-header">
                        <div className="demo-catalog-card-identity">
                          <ProviderMark logo={tool.logo} />
                          <CardTitle className="font-medium">
                            {tool.label}
                          </CardTitle>
                        </div>
                        <ToolStatus status={statusOf(tool, pausedTools)} />
                      </div>
                      <p className="demo-catalog-summary">{tool.summary}</p>
                    </div>
                    <div className="demo-catalog-estimate">
                      <p>{multiple ? "Estimates from" : "Default estimate"}</p>
                      <div className="demo-catalog-estimate-value">
                        <span>
                          {currency.format(lowestEstimate(tool))}{" "}
                          <small>/ call</small>
                        </span>
                        <span>
                          {tool.endpoints.length}{" "}
                          {multiple ? "endpoints" : "endpoint"}
                        </span>
                      </div>
                    </div>
                    <footer className="demo-catalog-card-footer">
                      {multiple ? (
                        <span className="demo-catalog-endpoint-chip">
                          Search and extraction
                        </span>
                      ) : (
                        <code>{endpoint.name}</code>
                      )}
                      <Button
                        className="demo-action-chip"
                        type="button"
                        variant="secondary"
                        size="xs"
                        aria-label={`View ${tool.label} tool`}
                        onClick={(event) => openDialog(event, tool)}
                      >
                        View tool
                        <ArrowUpRight className="size-[13px]" />
                      </Button>
                    </footer>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="demo-catalog-empty">
              <CardTitle className="font-medium">No matching tools</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </Card>
          )}
        </section>
      </section>

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        {detail && (
          <DialogContent
            className="demo-catalog-dialog"
            onCloseAutoFocus={restoreFocus}
          >
            <DialogHeader>
              <DialogTitle className="demo-catalog-detail-title">
                <ProviderMark logo={detail.logo} />
                {detail.label}
                <ToolStatus status={statusOf(detail, pausedTools)} />
              </DialogTitle>
              <DialogDescription>
                {detail.description ?? detail.summary}
              </DialogDescription>
            </DialogHeader>
            {detailSample && (
              <dl className="demo-catalog-facts">
                <div>
                  <dt>Sample calls</dt>
                  <dd>{detailSample.requests}</dd>
                </div>
                <div>
                  <dt>Average latency</dt>
                  <dd>{detailSample.latency} ms</dd>
                </div>
                <div>
                  <dt>API success rate</dt>
                  <dd>
                    {detailSample.completed >= 5
                      ? percent.format(
                          (detailSample.completed - detailSample.failed) /
                            detailSample.completed,
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            )}
            {(detail.useWhen || detail.limitations) && (
              <div className="demo-catalog-detail-copy">
                {detail.useWhen && (
                  <>
                    <h3>When to use it</h3>
                    <p>{detail.useWhen}</p>
                  </>
                )}
                {detail.limitations && (
                  <>
                    <h3>What to expect</h3>
                    <p>{detail.limitations}</p>
                  </>
                )}
              </div>
            )}
            <ul className="demo-catalog-endpoints" aria-label="Endpoints">
              {detail.endpoints.map(({ name, estimatedUsd }) => (
                <li key={name} className="demo-catalog-config-row">
                  <div>
                    <code>{name}</code>
                    <span>{currency.format(estimatedUsd)} / call</span>
                  </div>
                  {detail.readiness === "integrated" && (
                    <Switch
                      aria-label={`Allow ${name} on this demo account`}
                      checked={!pausedTools.has(name)}
                      onCheckedChange={(checked) => onToggle(name, checked)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
