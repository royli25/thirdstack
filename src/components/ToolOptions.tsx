import { ProviderLogo } from "./shared";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { StateBadge } from "../observation-ui";
import { money } from "../api";
import type { Observatory } from "../../server/observation";
import type {
  DiscoveryEstimate,
  DiscoveryMatch,
} from "../../server/tool-discovery";

// Optional new fields preserve the rendering of historical discovery events.
type ToolOption = Pick<
  Awaited<ReturnType<Observatory["catalog"]>>[number],
  "tool" | "provider" | "available" | "estimatedMicros" | "sampleCount"
> & {
  requestEstimates?: (Omit<
    DiscoveryEstimate,
    "operationIndex" | "origin" | "mappingNotes"
  > &
    Partial<
      Pick<DiscoveryEstimate, "operationIndex" | "origin" | "mappingNotes">
    >)[];
  discoveryMatches?: DiscoveryMatch[];
  reputation?: Awaited<
    ReturnType<Observatory["catalog"]>
  >[number]["reputation"];
};

function priceLabel(tool: ToolOption) {
  const quotes = tool.requestEstimates ?? [];
  if (!quotes.length) return `${money(tool.estimatedMicros)} default`;
  const prices = quotes.map((q) => q.estimatedMicros);
  const low = Math.min(...prices),
    high = Math.max(...prices);
  const price = low === high ? money(low) : `${money(low)}–${money(high)}`;
  return (
    <>
      {price} est.
      {quotes.length > 1 && (
        <span className="provider-quote-count"> · {quotes.length} quotes</span>
      )}
    </>
  );
}

export function ToolOptions({ tools }: { tools: ToolOption[] }) {
  return (
    <div className="offered-tools">
      <Accordion
        type="multiple"
        className="provider-options"
        aria-label="Provider options"
      >
        {tools.map((tool) => (
          <AccordionItem
            key={tool.tool}
            value={tool.tool}
            className="provider-option"
          >
            <AccordionTrigger className="provider-option-trigger">
              <ProviderLogo
                provider={tool.provider}
                className={`provider-option-logo provider-option-logo-${tool.provider}`}
              />
              <span className="provider-option-name">
                {tool.tool.replaceAll("_", " ")}
              </span>
              <StateBadge
                label={tool.available ? "Available" : "Not configured"}
              />
              <span className="provider-option-price">{priceLabel(tool)}</span>
            </AccordionTrigger>
            <AccordionContent className="provider-option-details">
              {(tool.requestEstimates ?? []).map((estimate, i) => (
                <div className="request-estimate" key={i}>
                  <strong>
                    {money(estimate.estimatedMicros)} estimated for this request
                  </strong>
                  <span>{estimate.breakdown}</span>
                  <span className="estimate-query">
                    {estimate.request.query || estimate.request.url}
                  </span>
                  <span>
                    {estimate.withinBudget
                      ? "Within remaining budget"
                      : "Exceeds remaining budget"}
                  </span>
                  <span>{estimate.uncertainty}</span>
                  {estimate.mappingNotes?.map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
              ))}
              {!tool.requestEstimates?.length && (
                <p>
                  {money(tool.estimatedMicros)} default call estimate · request
                  not quoted
                </p>
              )}
              {tool.discoveryMatches
                ?.filter((m) => m.status !== "eligible")
                .map((m) => (
                  <p key={m.operationIndex}>
                    Request {m.operationIndex + 1}: {m.reason}
                  </p>
                ))}
              <p>{tool.sampleCount} recorded calls across all sessions</p>
              {tool.reputation && (
                <div className="provider-reputation">
                  <strong>Recorded evidence</strong>
                  <p>
                    Organic execution: {tool.reputation.organic.succeeded} /{" "}
                    {tool.reputation.organic.sampleCount} completed calls
                    succeeded.
                    {tool.reputation.organic.medianLatencyMs !== null
                      ? ` Median ${Math.round(tool.reputation.organic.medianLatencyMs)} ms across ${tool.reputation.organic.latencySampleCount} timed calls.`
                      : " Latency not measured."}
                    {tool.reputation.organic.interrupted > 0
                      ? ` ${tool.reputation.organic.interrupted} interrupted calls recorded separately.`
                      : ""}
                  </p>
                  <p>{tool.reputation.organic.scope}</p>
                  <p>
                    Linked outcome reviews:{" "}
                    {tool.reputation.outcomeEvidence.reviewedSessions} sessions;{" "}
                    {tool.reputation.outcomeEvidence.linkedCriteria.pass} pass,{" "}
                    {tool.reputation.outcomeEvidence.linkedCriteria.fail} fail,{" "}
                    {tool.reputation.outcomeEvidence.linkedCriteria.unknown}{" "}
                    unknown criteria. These assess answers citing this tool, not
                    the tool’s accuracy.
                  </p>
                  <p>
                    Controlled sample:{" "}
                    {tool.reputation.controlled
                      ? `${tool.reputation.controlled.succeeded} / ${tool.reputation.controlled.attempted} calls succeeded; ${tool.reputation.controlled.referencePassed} / ${tool.reputation.controlled.referenceKnown} reference checks; ${tool.reputation.controlled.reviewed} usefulness reviews. Forced-provider tests, separate from organic choices.`
                      : "No completed sample."}
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="field-hint">
        Each quote is a separate candidate request, not a batch total. Defaults
        are not request quotes. Usage is a snapshot at discovery time and does
        not establish answer quality or prove the agent considered every option.
      </p>
    </div>
  );
}

type ConnectorOfferView = Pick<
  import("../../server/connector-discovery").ConnectorOffer,
  "tool" | "company" | "status" | "reason" | "estimatedMicros" | "relevance"
>;
const offerStatus: Record<string, string> = {
  eligible: "Eligible",
  disabled: "Not allowed",
  unavailable: "Unavailable",
  over_budget: "Over budget",
};
/** Company connector tools shown with a discovery. Absent on older events. */
export function ConnectorOffers({ offers }: { offers?: ConnectorOfferView[] }) {
  if (!offers?.length) return null;
  return (
    <div className="offered-tools connector-offers">
      <strong>Company connector tools offered</strong>
      <ul>
        {offers.map((o) => (
          <li key={o.tool}>
            <span className="provider-option-name">
              <code>{o.tool}</code> · {o.company}
            </span>
            <StateBadge label={offerStatus[o.status] ?? o.status} />
            <span className="provider-option-price">
              {money(o.estimatedMicros)} est.
            </span>
            <span className="field-hint">
              Matched on: {o.relevance.matchedTerms.join(", ")}.{" "}
              {o.status === "eligible" ? "" : o.reason}
            </span>
          </li>
        ))}
      </ul>
      <p className="field-hint">
        Matched on shared words with the stated need, not judged for fit.
        Descriptions are company-supplied.
      </p>
    </div>
  );
}
