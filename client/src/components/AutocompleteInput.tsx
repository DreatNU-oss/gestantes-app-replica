import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { highlightMatch } from "@/lib/highlightMatch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle, Star, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SUGESTOES_QUEIXAS } from "@/lib/sugestoesQueixas";

/** Tipo interno para sugestão unificada (personalizada ou estática) */
interface SugestaoUnificada {
  texto: string;
  id: number | null;
  usageCount: number;
  isCustom: boolean; // true = personalizada (pode ser deletada)
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  /** IDs das sugestões personalizadas (na mesma ordem que suggestions) */
  suggestionIds?: (number | null)[];
  /** Usage counts das sugestões personalizadas (na mesma ordem que suggestions) */
  suggestionUsageCounts?: (number | null)[];
}

export function AutocompleteInput({
  value: rawValue,
  onChange,
  suggestions,
  placeholder,
  className,
  suggestionIds,
  suggestionUsageCounts,
}: AutocompleteInputProps) {
  const value = rawValue || "";
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SugestaoUnificada[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Track if a suggestion click is in progress (mouseDown on suggestion)
  const isSelectingSuggestionRef = useRef(false);

  const deleteQueixaMutation = trpc.queixas.delete.useMutation();
  const { refetch: refetchQueixas } = trpc.queixas.list.useQuery(undefined, { enabled: false });

  // Build unified suggestion list with usage counts, maintaining order from props
  const unifiedSuggestions = useMemo((): SugestaoUnificada[] => {
    return suggestions.map((texto, i) => {
      const id = suggestionIds?.[i] ?? null;
      const usageCount = suggestionUsageCounts?.[i] ?? 0;
      const isCustom = !SUGESTOES_QUEIXAS.includes(texto);
      return { texto, id, usageCount, isCustom };
    });
  }, [suggestions, suggestionIds, suggestionUsageCounts]);

  // Extrair o último segmento digitado (após / ou ,) para usar no highlight
  const getLastSegment = (): string => {
    if (!value.trim()) return "";
    const separators = /[/,]/;
    const parts = value.split(separators);
    return parts[parts.length - 1].trim();
  };

  useEffect(() => {
    const separators = /[/,]/;
    const parts = value.split(separators);
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    const alreadyUsed = parts
      .slice(0, -1)
      .map((p) => p.trim().toLowerCase());

    let filtered: SugestaoUnificada[];

    if (!value.trim() || !lastPart) {
      filtered = unifiedSuggestions;
    } else {
      filtered = unifiedSuggestions.filter((s) =>
        s.texto.toLowerCase().includes(lastPart) && !alreadyUsed.includes(s.texto.toLowerCase())
      );
    }

    setFilteredSuggestions(filtered);
  }, [value, unifiedSuggestions]);

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
        // Don't close if a suggestion click is in progress
        if (isSelectingSuggestionRef.current) return;
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: SugestaoUnificada) => {
    const separators = /[/,]/;
    const parts = value.split(separators);

    if (parts.length > 1) {
      const separator = value.includes("/") ? " / " : ", ";
      const prefix = parts.slice(0, -1).join(separator).trim();
      onChange(`${prefix}${separator}${suggestion.texto}`);
    } else {
      onChange(suggestion.texto);
    }

    setShowSuggestions(false);
    setSelectedIndex(-1);
    isSelectingSuggestionRef.current = false;
    inputRef.current?.focus();
  }, [value, onChange]);

  const handleDeleteSuggestion = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    isSelectingSuggestionRef.current = true;
    const sugestao = filteredSuggestions[index];
    if (sugestao.id != null) {
      deleteQueixaMutation.mutate({ id: sugestao.id }, {
        onSuccess: () => refetchQueixas(),
      });
      // Remover localmente da lista imediatamente
      setFilteredSuggestions(prev => {
        const updated = prev.filter((_, i) => i !== index);
        if (updated.length === 0) {
          setShowSuggestions(false);
        }
        return updated;
      });
    }
    // Reset after a tick
    setTimeout(() => { isSelectingSuggestionRef.current = false; }, 200);
  }, [filteredSuggestions, deleteQueixaMutation, refetchQueixas]);

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
          {filteredSuggestions.map((sugestao, index) => {
            return (
              <div
                key={`${sugestao.texto}-${index}`}
                data-suggestion-item
                className={`group flex items-center w-full text-sm transition-colors ${
                  index === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <button
                  type="button"
                  className="flex-1 text-left px-3 py-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isSelectingSuggestionRef.current = true;
                    handleSelectSuggestion(sugestao);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{highlightMatch(sugestao.texto, lastSegment)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {index === 0 && (
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      )}
                      {sugestao.usageCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {sugestao.usageCount}x
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                {sugestao.isCustom && sugestao.id != null && (
                  <button
                    type="button"
                    title="Remover sugestão"
                    className="px-2 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      isSelectingSuggestionRef.current = true;
                      handleDeleteSuggestion(e, index);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
