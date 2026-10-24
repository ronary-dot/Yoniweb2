import { describe, expect, it } from "vitest";
import { cycleFor, daysLeft, inCycle, shiftCycle } from "@/lib/domain/period";

describe("cycleFor", () => {
  it("uses the calendar month when cycles start on the 1st", () => {
    expect(cycleFor(new Date(2026, 9, 24), 1)).toEqual({ start: "2026-10-01", end: "2026-10-31" });
  });

  it("starts in the previous month before the start day", () => {
    expect(cycleFor(new Date(2026, 9, 5), 10)).toEqual({ start: "2026-09-10", end: "2026-10-09" });
  });

  it("starts in this month on or after the start day", () => {
    expect(cycleFor(new Date(2026, 9, 10), 10)).toEqual({ start: "2026-10-10", end: "2026-11-09" });
  });

  it("crosses the year boundary", () => {
    expect(cycleFor(new Date(2027, 0, 3), 15)).toEqual({ start: "2026-12-15", end: "2027-01-14" });
  });

  it("handles February", () => {
    expect(cycleFor(new Date(2027, 1, 20), 1)).toEqual({ start: "2027-02-01", end: "2027-02-28" });
  });
});

describe("shiftCycle", () => {
  it("moves back and forward whole cycles", () => {
    const today = new Date(2026, 9, 24);
    expect(shiftCycle(today, 10, -1)).toEqual({ start: "2026-09-10", end: "2026-10-09" });
    expect(shiftCycle(today, 10, 1)).toEqual({ start: "2026-11-10", end: "2026-12-09" });
    expect(shiftCycle(today, 1, -10)).toEqual({ start: "2025-12-01", end: "2025-12-31" });
  });
});

describe("inCycle / daysLeft", () => {
  const cycle = { start: "2026-10-01", end: "2026-10-31" };

  it("is inclusive at both ends", () => {
    expect(inCycle("2026-10-01", cycle)).toBe(true);
    expect(inCycle("2026-10-31", cycle)).toBe(true);
    expect(inCycle("2026-11-01", cycle)).toBe(false);
  });

  it("counts today and the last day", () => {
    expect(daysLeft(new Date(2026, 9, 24, 18, 30), cycle)).toBe(8);
    expect(daysLeft(new Date(2026, 9, 31), cycle)).toBe(1);
    expect(daysLeft(new Date(2026, 10, 2), cycle)).toBe(0);
  });
});
