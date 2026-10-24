import { describe, expect, it } from "vitest";
import { amountToInput, parseAmount } from "@/lib/format";

describe("parseAmount", () => {
  it.each([
    ["120", 120_00],
    ["1,234.5", 1_234_50],
    ["₪ 80.05", 80_05],
    ["0.5", 50],
    ["12.", 12_00],
  ])("parses %s", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "0", "abc", "-5", "1.234", "1.2.3"])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull();
  });

  it("round-trips through amountToInput", () => {
    expect(parseAmount(amountToInput(1_234_50))).toBe(1_234_50);
  });
});
