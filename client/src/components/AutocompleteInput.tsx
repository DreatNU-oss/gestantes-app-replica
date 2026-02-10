import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      // Show all suggestions when input is empty and focused
      setFilteredSuggestions(suggestions);
      return;
    }

    // Get the last segment after the last separator (/ or ,)
    const separators = /[/,]/;
    const parts = value.split(separators);
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    if (!lastPart) {
      setFilteredSuggestions(suggestions);
      return;
    }

    // Filter suggestions that match the last part and aren't already in the value
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    // If there's already text, append with separator
    const separators = /[/,]/;
    const parts = value.split(separators);

    if (parts.length > 1) {
      // Replace the last part with the selected suggestion
      const separator = value.includes("/") ? " / " : ", ";
      const prefix = parts.slice(0, -1).join(separator).trim();
      onChange(`${prefix}${separator}${suggestion}`);
    } else if (value.trim() && !suggestions.some(s => s.toLowerCase() === value.trim().toLowerCase())) {
      // There's text that isn't a suggestion, append
      onChange(`${value.trim()} / ${suggestion}`);
    } else {
      onChange(suggestion);
    }

    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
