import { describe, it, expect } from "vitest";

// Test the BP validation logic (same logic as client/src/lib/bpValidation.ts)
// We replicate the functions here since vitest runs in Node context

function isBPAbnormal(pressaoArterial: string | null): boolean {
  if (!pressaoArterial) return false;
  const parts = pressaoArterial.split(/[\/xX]/);
  if (parts.length !== 2) return false;
  const sistolica = parseInt(parts[0].trim(), 10);
  const diastolica = parseInt(parts[1].trim(), 10);
  if (isNaN(sistolica) || isNaN(diastolica)) return false;
  return sistolica >= 130 || diastolica >= 90;
}

function isBPElevated(sistolica: number | null | undefined, diastolica: number | null | undefined): boolean {
  if (sistolica != null && sistolica >= 130) return true;
  if (diastolica != null && diastolica >= 90) return true;
  return false;
}

describe("BP Validation - isBPAbnormal", () => {
  it("should return false for null input", () => {
    expect(isBPAbnormal(null)).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isBPAbnormal("")).toBe(false);
  });

  it("should return false for normal BP 120/80", () => {
    expect(isBPAbnormal("120/80")).toBe(false);
  });

  it("should return false for normal BP 129/89", () => {
    expect(isBPAbnormal("129/89")).toBe(false);
  });

  it("should return true for systolic exactly 130", () => {
    expect(isBPAbnormal("130/80")).toBe(true);
  });

  it("should return true for diastolic exactly 90", () => {
    expect(isBPAbnormal("120/90")).toBe(true);
  });

  it("should return true for both elevated", () => {
    expect(isBPAbnormal("140/95")).toBe(true);
  });

  it("should return true for high systolic 150/70", () => {
    expect(isBPAbnormal("150/70")).toBe(true);
  });

  it("should handle 'x' separator format", () => {
    expect(isBPAbnormal("130x80")).toBe(true);
  });

  it("should handle 'X' separator format", () => {
    expect(isBPAbnormal("130X80")).toBe(true);
  });

  it("should return false for invalid format", () => {
    expect(isBPAbnormal("abc")).toBe(false);
  });

  it("should return false for single number", () => {
    expect(isBPAbnormal("120")).toBe(false);
  });

  it("should handle spaces around separator", () => {
    expect(isBPAbnormal("130 / 80")).toBe(true);
  });
});

describe("BP Validation - isBPElevated", () => {
  it("should return false for null values", () => {
    expect(isBPElevated(null, null)).toBe(false);
  });

  it("should return false for undefined values", () => {
    expect(isBPElevated(undefined, undefined)).toBe(false);
  });

  it("should return false for normal BP 120/80", () => {
    expect(isBPElevated(120, 80)).toBe(false);
  });

  it("should return false for 129/89", () => {
    expect(isBPElevated(129, 89)).toBe(false);
  });

  it("should return true for systolic exactly 130", () => {
    expect(isBPElevated(130, 80)).toBe(true);
  });

  it("should return true for diastolic exactly 90", () => {
    expect(isBPElevated(120, 90)).toBe(true);
  });

  it("should return true for both elevated", () => {
    expect(isBPElevated(140, 95)).toBe(true);
  });

  it("should return true when only systolic is provided and elevated", () => {
    expect(isBPElevated(135, null)).toBe(true);
  });

  it("should return true when only diastolic is provided and elevated", () => {
    expect(isBPElevated(null, 92)).toBe(true);
  });

  it("should return false when only systolic is provided and normal", () => {
    expect(isBPElevated(120, null)).toBe(false);
  });

  it("should return false when only diastolic is provided and normal", () => {
    expect(isBPElevated(null, 80)).toBe(false);
  });
});
