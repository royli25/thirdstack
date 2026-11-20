import { expect, test } from "vitest";
import { creditChange, ledgerReason, netCredits } from "../src/funding-format";

test("a wallet posting is signed unless it is zero", () => {
  expect(creditChange(10_000_000)).toBe("+$10.00");
  expect(creditChange(-8_800)).toBe("−$0.0088");
  expect(creditChange(0)).toBe("$0.00");
});

test("net credits always show cents, in dollars for credit billing", () => {
  expect(netCredits(6_000_000, true)).toBe("$6.00");
  expect(netCredits(0, true)).toBe("$0.00");
  expect(netCredits(6_000_000, false)).toBe("6.00");
});

test("a ledger reason reads as a label", () => {
  expect(ledgerReason("refund")).toBe("Refund");
  expect(ledgerReason("dispute_hold")).toBe("Dispute hold");
});
