import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { highlightMatch } from "@/lib/highlightMatch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle, Star, X, BookmarkPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SUGESTOES_QUEIXAS } from "@/lib/sugestoesQueixas";
import { toast } from "sonner";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
  /** IDs das sugestões personalizadas (na mesma ordem que suggestions) */
  suggestionIds?: (number | null)[];
}

export function AutocompleteInput({
  value: rawValue,
  onChange,
  suggestions,
  placeholder,
  className,
  suggestionIds,
}: AutocompleteInputProps) {
  const value = rawValue || "";
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [filteredIds, setFilteredIds] = useState<(number | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSaved, setJustSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const deleteQueixaMutation = trpc.queixas.delete.useMutation();
  const upsertQueixaMutation = trpc.queixas.upsert.useMutation();
  const { refetch: refetchQueixas } = trpc.queixas.list.useQuery(undefined, { enabled: false });

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

    let filtered: string[];
    let filtIds: (number | null)[];

    if (!value.trim() || !lastPart) {
      filtered = suggestions;
      filtIds = suggestionIds || suggestions.map(() => null);
    } else {
      const indices: number[] = [];
      filtered = suggestions.filter((s, i) => {
        const match = s.toLowerCase().includes(lastPart) && !alreadyUsed.includes(s.toLowerCase());
        if (match) indices.push(i);
        return match;
      });
      filtIds = indices.map(i => suggestionIds ? suggestionIds[i] ?? null : null);
    }

    setFilteredSuggestions(filtered);
    setFilteredIds(filtIds);
  }, [value, suggestions, suggestionIds]);

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
    } else {
      onChange(suggestion);
    }

    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [value, onChange]);

  const handleDeleteSuggestion = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const id = filteredIds[index];
    if (id != null) {
      deleteQueixaMutation.mutate({ id }, {
        onSuccess: () => refetchQueixas(),
      });
      // Remover localmente da lista imediatamente
      setFilteredSuggestions(prev => prev.filter((_, i) => i !== index));
      setFilteredIds(prev => prev.filter((_, i) => i !== index));
    }
  }, [filteredIds, deleteQueixaMutation, refetchQueixas]);

  // Salvar frase atual como sugestão favorita com um clique
  const salvarComoFavorita = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.length < 3) {
      toast.error("Digite uma frase com pelo menos 3 caracteres para salvar");
      return;
    }

    // Extrair todas as frases separadas por / ou ,
    const separators = /[/,]/;
    const frases = trimmedValue.split(separators).map(f => f.trim()).filter(f => f.length >= 3);

    if (frases.length === 0) {
      toast.error("Digite uma frase com pelo menos 3 caracteres para salvar");
      return;
    }

    let savedCount = 0;
    let alreadyExistCount = 0;

    frases.forEach(frase => {
      // Verifica se já é uma sugestão estática
      if (SUGESTOES_QUEIXAS.includes(frase)) {
        alreadyExistCount++;
        return;
      }

      // Verifica se já existe nas sugestões personalizadas
      const jaExiste = suggestions.some(s => s.toLowerCase() === frase.toLowerCase() && !SUGESTOES_QUEIXAS.includes(s));
      if (jaExiste) {
        alreadyExistCount++;
        return;
      }

      upsertQueixaMutation.mutate(
        { texto: frase },
        {
          onSuccess: () => {
            savedCount++;
            if (savedCount === 1) {
              refetchQueixas();
            }
          },
        }
      );
      savedCount++;
    });

    if (savedCount > 0) {
      toast.success(savedCount === 1 ? "Frase salva como sugestão!" : `${savedCount} frases salvas como sugestões!`);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } else if (alreadyExistCount > 0) {
      toast.info("Todas as frases já estão salvas nas sugestões");
    }
  }, [value, suggestions, upsertQueixaMutation, refetchQueixas]);

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
  const hasText = value.trim().length >= 3;

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
        {/* Botão salvar como favorita */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`transition-colors ${
                justSaved
                  ? "text-green-500"
                  : hasText
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-muted-foreground/40 cursor-not-allowed"
              }`}
              tabIndex={-1}
              onClick={salvarComoFavorita}
              disabled={!hasText}
            >
              <BookmarkPlus className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="text-xs">
              Salvar frase como sugestão favorita
            </div>
          </TooltipContent>
        </Tooltip>
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
              <div><strong>Bookmark</strong> - Salvar frase atual</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => {
            const isCustom = !SUGESTOES_QUEIXAS.includes(suggestion);
            const id = filteredIds[index];
            return (
              <div
                key={index}
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
                    handleSelectSuggestion(suggestion);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1">{highlightMatch(suggestion, lastSegment)}</span>
                    {index === 0 && (
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                    )}
                  </div>
                </button>
                {isCustom && id != null && (
                  <button
                    type="button"
                    title="Remover sugestão"
                    className="px-2 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onMouseDown={(e) => handleDeleteSuggestion(e, index)}
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
