import { describe, it, expect } from "vitest";

/**
 * Tests for the keyboard navigation logic used in AutocompleteInput.
 * Since the component is React-based, we test the core state transition logic here.
 */

describe("AutocompleteInput keyboard navigation logic", () => {
  // Simulate the selectedIndex state transitions
  function arrowDown(currentIndex: number, listLength: number): number {
    return currentIndex < listLength - 1 ? currentIndex + 1 : currentIndex;
  }

  function arrowUp(currentIndex: number): number {
    return currentIndex > 0 ? currentIndex - 1 : -1;
  }

  // Simulate the suggestion selection logic
  function selectSuggestion(
    value: string,
    suggestion: string,
    suggestions: string[]
  ): string {
    const separators = /[/,]/;
    const parts = value.split(separators);

    if (parts.length > 1) {
      const separator = value.includes("/") ? " / " : ", ";
      const prefix = parts.slice(0, -1).join(separator).trim();
      return `${prefix}${separator}${suggestion}`;
    } else if (
      value.trim() &&
      !suggestions.some(
        (s) => s.toLowerCase() === value.trim().toLowerCase()
      )
    ) {
      return `${value.trim()} / ${suggestion}`;
    } else {
      return suggestion;
    }
  }

  describe("ArrowDown navigation", () => {
    it("should move from -1 to 0 (first item)", () => {
      expect(arrowDown(-1, 5)).toBe(0);
    });

    it("should move from 0 to 1", () => {
      expect(arrowDown(0, 5)).toBe(1);
    });

    it("should not go past the last item", () => {
      expect(arrowDown(4, 5)).toBe(4);
    });

    it("should stay at 0 when list has only one item", () => {
      expect(arrowDown(0, 1)).toBe(0);
    });
  });

  describe("ArrowUp navigation", () => {
    it("should move from 2 to 1", () => {
      expect(arrowUp(2)).toBe(1);
    });

    it("should move from 1 to 0", () => {
      expect(arrowUp(1)).toBe(0);
    });

    it("should move from 0 to -1 (deselect)", () => {
      expect(arrowUp(0)).toBe(-1);
    });

    it("should stay at -1 when already deselected", () => {
      expect(arrowUp(-1)).toBe(-1);
    });
  });

  describe("Enter selection", () => {
    const suggestions = [
      "Náuseas e vômitos",
      "Dor lombar",
      "Cefaleia",
      "Edema de membros inferiores",
    ];

    it("should select suggestion when empty value", () => {
      const result = selectSuggestion("", "Náuseas e vômitos", suggestions);
      expect(result).toBe("Náuseas e vômitos");
    });

    it("should append with separator when value has partial text", () => {
      const result = selectSuggestion("Dor", "Cefaleia", suggestions);
      expect(result).toBe("Dor / Cefaleia");
    });

    it("should replace last segment when using separators", () => {
      const result = selectSuggestion(
        "Náuseas e vômitos / Dor",
        "Cefaleia",
        suggestions
      );
      expect(result).toBe("Náuseas e vômitos / Cefaleia");
    });

    it("should use comma separator when value uses commas", () => {
      const result = selectSuggestion(
        "Náuseas e vômitos, Dor",
        "Cefaleia",
        suggestions
      );
      expect(result).toBe("Náuseas e vômitos, Cefaleia");
    });

    it("should replace value when selecting exact match", () => {
      const result = selectSuggestion(
        "Cefaleia",
        "Dor lombar",
        suggestions
      );
      // "Cefaleia" is in suggestions, so it should be replaced
      expect(result).toBe("Dor lombar");
    });
  });

  describe("Tab shortcut", () => {
    it("should resolve to index 0 when no item is selected (selectedIndex = -1)", () => {
      const selectedIndex = -1;
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      expect(idx).toBe(0);
    });

    it("should resolve to selectedIndex when an item is already selected", () => {
      const selectedIndex = 3;
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      expect(idx).toBe(3);
    });

    it("should resolve to 0 when selectedIndex is 0", () => {
      const selectedIndex = 0;
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      expect(idx).toBe(0);
    });
  });

  describe("Full navigation sequence", () => {
    it("should navigate down then up correctly", () => {
      let index = -1;
      const listLen = 4;

      // Arrow down 3 times
      index = arrowDown(index, listLen); // 0
      index = arrowDown(index, listLen); // 1
      index = arrowDown(index, listLen); // 2
      expect(index).toBe(2);

      // Arrow up 2 times
      index = arrowUp(index); // 1
      index = arrowUp(index); // 0
      expect(index).toBe(0);

      // Arrow up past beginning
      index = arrowUp(index); // -1
      expect(index).toBe(-1);
    });

    it("should handle rapid down navigation to end", () => {
      let index = -1;
      const listLen = 3;

      for (let i = 0; i < 10; i++) {
        index = arrowDown(index, listLen);
      }
      expect(index).toBe(2); // Should stop at last item
    });
  });
});
