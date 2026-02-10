import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { highlightMatch } from "@/lib/highlightMatch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle, Star } from "lucide-react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export function AutocompleteInput({
  value: rawValue,
  onChange,
  suggestions,
  placeholder,
  className,
}: AutocompleteInputProps) {
  const value = rawValue || "";
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extrair o último segmento digitado (após / ou ,) para usar no highlight
  const getLastSegment = (): string => {
    if (!value.trim()) return "";
    const separators = /[/,]/;
    const parts = value.split(separators);
    return parts[parts.length - 1].trim();
  };

  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuggestions(suggestions);
      return;
    }

    const separators = /[/,]/;
    const parts = value.split(separators);
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    if (!lastPart) {
      setFilteredSuggestions(suggestions);
      return;
    }

    const alreadyUsed = parts
      .slice(0, -1)
      .map((p) => p.trim().toLowerCase());

    const filtered = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(lastPart) &&
        !alreadyUsed.includes(s.toLowerCase())
    );

    setFilteredSuggestions(filtered);
  }, [value, suggestions]);

  // Reset selected index when filtered suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    const separators = /[/,]/;
    const parts = value.split(separators);

    if (parts.length > 1) {
      const separator = value.includes("/") ? " / " : ", ";
      const prefix = parts.slice(0, -1).join(separator).trim();
      onChange(`${prefix}${separator}${suggestion}`);
    } else if (value.trim() && !suggestions.some(s => s.toLowerCase() === value.trim().toLowerCase())) {
      onChange(`${value.trim()} / ${suggestion}`);
    } else {
      onChange(suggestion);
    }

    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [value, suggestions, onChange]);

  // Scroll the selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-suggestion-item]");
      const selectedItem = items[selectedIndex] as HTMLElement | undefined;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;

      case "Tab":
        // Accept the selected suggestion, or the first one if none is selected
        if (filteredSuggestions.length > 0) {
          e.preventDefault();
          const idx = selectedIndex >= 0 ? selectedIndex : 0;
          handleSelectSuggestion(filteredSuggestions[idx]);
        }
        break;
    }
  };

  const lastSegment = getLastSegment();

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!showSuggestions) setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="text-xs space-y-1">
              <div><strong>Tab</strong> - Aceitar primeira sugestão</div>
              <div><strong>↑ ↓</strong> - Navegar sugestões</div>
              <div><strong>Enter</strong> - Selecionar</div>
              <div><strong>Esc</strong> - Fechar</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              data-suggestion-item
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1">{highlightMatch(suggestion, lastSegment)}</span>
                {index === 0 && (
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
