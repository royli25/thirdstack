import { describe, expect, it } from "vitest";
import {
  CONNECTOR_OFFER_LIMIT,
  matchConnectorTools,
  terms,
} from "../server/connector-discovery";
import type { ApprovedConnectorTool } from "../server/connectors";

const allowance = {
  enforced: false,
  state: "local" as const,
  limitMicros: 0,
  spentMicros: 0,
  reservedMicros: 0,
  remainingMicros: null,
  revision: 0,
  basis: "estimated_provider_spend_since_activation" as const,
};
function approved(name: string, description: string, estimateMicros = 1000) {
  return {
    connectorId: "c1",
    connectorName: "Fixture Co",
    slug: "fixtureco",
    tool: {
      name,
      exposedName: `fixtureco__${name}`,
      description,
      inputSchema: { type: "object", properties: {} },
      schemaHash: "f".repeat(64),
      status: "approved",
      approvedHash: "f".repeat(64),
      estimateMicros,
      firstSeenAt: "",
      changedAt: "",
    },
  } as ApprovedConnectorTool;
}
const options = {
  remainingMicros: 100_000,
  allowance,
  keyAllowsConnectors: true,
  calls: [],
};

describe("connector term matching", () => {
  it("splits identifiers, drops filler words and folds simple plurals", () => {
    expect([...terms("getForecast for the convert_currency tools")]).toEqual([
      "forecast",
      "convert",
      "currency",
    ]);
    expect(terms("currencies flights booking hotels")).toEqual(
      new Set(["currency", "flight", "book", "hotel"]),
    );
  });

  it("ranks name matches above description matches, then by price", () => {
    const { offers } = matchConnectorTools(
      { need: "book a flight" },
      [
        approved("search_hotels", "Find hotels near a flight arrival.", 500),
        approved("book_flight", "Reserve a seat.", 3000),
        approved("flight_status", "Live status of a flight.", 2000),
      ],
      options,
    );
    expect(offers.map((o) => o.tool)).toEqual([
      "fixtureco__book_flight",
      "fixtureco__flight_status",
      "fixtureco__search_hotels",
    ]);
    expect(offers[0].relevance.matchedTerms).toEqual(["book", "flight"]);
  });

  it("caps the shortlist and reports how many were withheld", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      approved(`weather_${i}`, "Weather data."),
    );
    const result = matchConnectorTools({ need: "weather" }, many, options);
    expect(result.offers).toHaveLength(CONNECTOR_OFFER_LIMIT);
    expect(result.withheld).toBe(4);
    expect(result.considered).toBe(14);
  });

  it("explains an enforced operator allowance that blocks the call", () => {
    const { offers } = matchConnectorTools(
      { need: "weather" },
      [approved("weather", "Weather data.")],
      {
        ...options,
        allowance: { ...allowance, enforced: true, state: "unconfigured" },
      },
    );
    expect(offers[0]).toMatchObject({
      status: "unavailable",
      reason: "Paid tool access is currently unavailable for this account.",
    });
  });
});
