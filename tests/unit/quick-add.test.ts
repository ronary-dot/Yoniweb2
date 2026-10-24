import { describe, expect, it } from "vitest";
import { createEmptyData } from "@/lib/defaults";
import { parseQuickAdd } from "@/lib/domain/quick-add";

const family = createEmptyData().categories.filter((c) => c.workspaceId === "ws-family");
const business = createEmptyData().categories.filter((c) => c.workspaceId === "ws-business");

describe("parseQuickAdd", () => {
  it.each([
    ["הוצאה 120 סופר", "expense", 120_00, "family-groceries"],
    ["120 סופר", "expense", 120_00, "family-groceries"],
    ["₪86.5 מסעדות", "expense", 86_50, "family-leisure"],
    ["דלק 300", "expense", 300_00, "family-transport"],
    ["הכנסה 3500 משכורת", "income", 3_500_00, "family-salary"],
    ["50 משהו", "expense", 50_00, "family-misc"],
    ["הכנסה 900", "income", 900_00, "family-other-income"],
  ])("%s", (query, kind, amount, categoryId) => {
    expect(parseQuickAdd(query, family)).toMatchObject({ kind, amount, category: { id: categoryId } });
  });

  it("matches business categories", () => {
    expect(parseQuickAdd("180 תוכנה", business)?.category.id).toBe("business-software");
  });

  it("needs an amount", () => {
    expect(parseQuickAdd("סופר", family)).toBeNull();
    expect(parseQuickAdd("", family)).toBeNull();
  });
});
