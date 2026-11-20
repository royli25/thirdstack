import type { BillingRecord } from "../server/provider-billing-types";

export function usdMicros(value: string) {
  if (!/^-?\d{1,7}(?:\.\d{1,6})?$/.test(value.trim()))
    throw new Error("Use a dollar amount with up to six decimal places.");
  const negative = value.trim().startsWith("-");
  const [whole, fraction = ""] = value.trim().replace(/^-/, "").split(".");
  const amount = Number(whole) * 1e6 + Number(fraction.padEnd(6, "0"));
  return negative ? -amount : amount;
}
/** Bounded CSV reader; quoted commas/newlines and escaped quotes are supported. */
export function billingCsv(text: string): BillingRecord[] {
  if (text.length > 20000) throw new Error("Import up to 20 KB at a time.");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  const input = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i <= input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === undefined) throw new Error("A quoted CSV value is unfinished.");
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += c;
    } else if (c === "," || c === "\n" || c === undefined) {
      row.push(field.trim());
      field = "";
      closed = false;
      if (c !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else if (c === '"' && !field && !closed) quoted = true;
    else {
      if (closed || c === '"')
        throw new Error("A CSV value has misplaced quotes.");
      field += c;
    }
  }
  const header = rows.shift()?.map((s) => s.toLowerCase());
  if (header?.join(",") !== "record id,request id,amount,credits")
    throw new Error(
      "Use the template columns: Record ID, Request ID, Amount, Credits.",
    );
  if (!rows.length || rows.length > 1000)
    throw new Error("Include between 1 and 1,000 billing records.");
  return rows.map((r, i) => {
    if (r.length !== 4 || !r[0])
      throw new Error(`Check the columns and Record ID on row ${i + 2}.`);
    const credits = r[3] ? Number(r[3]) : undefined;
    if (
      credits !== undefined &&
      (!/^\d+(?:\.\d+)?$/.test(r[3]) || !Number.isFinite(credits))
    )
      throw new Error(`Check credits on row ${i + 2}.`);
    return {
      recordId: r[0],
      ...(r[1] ? { requestId: r[1] } : {}),
      ...(r[2] ? { amountMicros: usdMicros(r[2]) } : {}),
      ...(credits !== undefined ? { credits } : {}),
    };
  });
}
