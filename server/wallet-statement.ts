import type { WalletStatement } from "./wallet.js";

/**
 * A wallet statement as CSV. Amounts are integer USD micros (1,000,000 = $1)
 * as stored, with a dollar column for reading. The file holds no prompts,
 * results, keys or payment secrets.
 */

const descriptions: Record<string, string> = {
  deposit: "Card top-up",
  refund: "Refund to card",
  dispute_hold: "Payment dispute hold",
  dispute_release: "Payment dispute closed",
  usage: "Tool call (provider cost plus 10%)",
  adjustment: "Adjustment by Two Hands",
};
/** Plain decimal dollars with all six places, so the file adds up exactly. */
export function microsToUsd(micros: number) {
  const sign = micros < 0 ? "-" : "";
  const abs = Math.abs(micros);
  return `${sign}${Math.floor(abs / 1_000_000)}.${String(abs % 1_000_000).padStart(6, "0")}`;
}
/**
 * Quotes a field, and stops a spreadsheet from running one as a formula.
 * Numbers written by this module are passed with `numeric` and left alone.
 */
function cell(value: string | number | null, numeric = false) {
  if (value === null) return "";
  let text = String(value);
  if (!numeric && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function statementCsv(statement: WalletStatement) {
  const header = [
    "recorded_at_utc",
    "type",
    "description",
    "reference",
    "tool",
    "provider_cost_usd_micros",
    "markup_usd_micros",
    "amount_usd_micros",
    "amount_usd",
    "balance_usd_micros",
    "balance_usd",
    "credits",
  ];
  // Sandbox credits are never presented as money.
  const credits =
    statement.mode === "live"
      ? "USD service credits"
      : "sandbox credits (not real money)";
  const balanceRow = (at: string, type: string, text: string, micros: number) =>
    [
      cell(at),
      type,
      text,
      "",
      "",
      "",
      "",
      "",
      "",
      cell(micros, true),
      cell(microsToUsd(micros), true),
      credits,
    ].join(",");
  return (
    [
      header.join(","),
      balanceRow(
        statement.from,
        "opening_balance",
        "Opening balance",
        statement.openingMicros,
      ),
      ...statement.lines.map((line) =>
        [
          cell(line.at),
          cell(line.kind),
          cell(descriptions[line.kind] ?? line.kind.replaceAll("_", " ")),
          cell(line.reference),
          cell(line.tool),
          cell(line.providerCostMicros, true),
          cell(line.markupMicros, true),
          cell(line.micros, true),
          cell(microsToUsd(line.micros), true),
          cell(line.balanceMicros, true),
          cell(microsToUsd(line.balanceMicros), true),
          credits,
        ].join(","),
      ),
      balanceRow(
        statement.to,
        "closing_balance",
        "Closing balance",
        statement.closingMicros,
      ),
    ].join("\r\n") + "\r\n"
  );
}
