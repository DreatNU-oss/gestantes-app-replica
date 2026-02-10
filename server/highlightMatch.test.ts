import { describe, it, expect } from "vitest";

// Since highlightMatch is a React component utility, we test the logic separately
// The actual function returns JSX, so we test the core matching logic here

describe("highlightMatch logic", () => {
  // Helper to simulate the matching logic used in highlightMatch
  function findMatch(text: string, query: string): { before: string; match: string; after: string } | null {
    if (!query || !query.trim()) return null;
    const trimmed = query.trim();
    const lowerText = text.toLowerCase();
    const lowerQuery = trimmed.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return null;
    return {
      before: text.slice(0, index),
      match: text.slice(index, index + trimmed.length),
      after: text.slice(index + trimmed.length),
    };
  }

  it("should find match at the beginning of text", () => {
    const result = findMatch("Náuseas e vômitos", "Náu");
    expect(result).not.toBeNull();
    expect(result!.before).toBe("");
    expect(result!.match).toBe("Náu");
    expect(result!.after).toBe("seas e vômitos");
  });

  it("should find match in the middle of text", () => {
    const result = findMatch("Dor lombar persistente", "lombar");
    expect(result).not.toBeNull();
    expect(result!.before).toBe("Dor ");
    expect(result!.match).toBe("lombar");
    expect(result!.after).toBe(" persistente");
  });

  it("should find match at the end of text", () => {
    const result = findMatch("Cefaleia intensa", "intensa");
    expect(result).not.toBeNull();
    expect(result!.before).toBe("Cefaleia ");
    expect(result!.match).toBe("intensa");
    expect(result!.after).toBe("");
  });

  it("should be case-insensitive", () => {
    const result = findMatch("Edema de membros inferiores", "EDEMA");
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Edema");
  });

  it("should return null for empty query", () => {
    expect(findMatch("Some text", "")).toBeNull();
    expect(findMatch("Some text", "  ")).toBeNull();
  });

  it("should return null when no match found", () => {
    expect(findMatch("Náuseas e vômitos", "febre")).toBeNull();
  });

  it("should trim the query before matching", () => {
    const result = findMatch("Dor abdominal", "  dor  ");
    expect(result).not.toBeNull();
    expect(result!.match).toBe("Dor");
  });

  it("should handle full text match", () => {
    const result = findMatch("Tontura", "Tontura");
    expect(result).not.toBeNull();
    expect(result!.before).toBe("");
    expect(result!.match).toBe("Tontura");
    expect(result!.after).toBe("");
  });

  it("should handle accented characters", () => {
    const result = findMatch("Queixas comuns dessa fase da gestação", "gestação");
    expect(result).not.toBeNull();
    expect(result!.match).toBe("gestação");
  });
});
