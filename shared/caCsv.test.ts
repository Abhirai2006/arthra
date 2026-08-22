import { describe, expect, it } from "vitest";
import { createCaLedgerCsv } from "./caCsv";

describe("createCaLedgerCsv", () => {
  it("emits CA-friendly headers, INR decimal amounts, GST fields, and escaped notes", () => {
    const csv = createCaLedgerCsv([{ occurredAt: new Date(Date.UTC(2026, 3, 1)), spaceName: "Office", description: "Client lunch", kind: "expense", categoryName: "Food", amountPaise: 12345, isGstApplicable: true, gstKind: "cgst_sgst", gstRateBasisPoints: 1800, note: "Discussed \"proposal\", follow-up" }], "2026-27");
    expect(csv.split("\n")[0]).toContain("Financial Year");
    expect(csv).toContain("2026-27");
    expect(csv).toContain("123.45");
    expect(csv).toContain("18.00");
    expect(csv).toContain('"Discussed ""proposal"", follow-up"');
  });
});
