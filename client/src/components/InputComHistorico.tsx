import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { X } from "lucide-react";

/**
 * InputComHistorico - Componente universal de Input com autocomplete estilo Chrome.
 * 
 * Funciona como o autopreenchimento do Chrome:
 * - Grava textos automaticamente após uso (ao perder foco)
 * - Sugere textos anteriores ordenados por frequência de uso
 * - Permite deletar sugestões individuais com "X"
 * - Filtra sugestões conforme o usuário digita
 * - Navegação por teclado (↑↓ Enter Esc Tab)
 * 
 * Uso: substitui <Input> em qualquer campo, adicionando apenas o prop `tipo`.
 * O `tipo` é uma string livre que identifica o campo (ex: "pa_consulta", "peso_consulta").
 */

interface InputComHistoricoProps {
  value: string;
  onChange: (value: string) => void;
  tipo: string;
  placeholder?: string;
  className?: string;
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url" | "none";
  maxLength?: number;
  disabled?: boolean;
  id?: string;
  /** Minimum character length to trigger auto-save on blur (default: 1) */
  minSaveLength?: number;
  /** Additional onBlur handler */
  onBlurExtra?: () => void;
  /** Additional onKeyDown handler */
  onKeyDownExtra?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Ref forwarding */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Tab index */
  tabIndex?: number;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Read only */
  readOnly?: boolean;
  /** Required field */
  required?: boolean;
  /** Min value */
  min?: string | number;
  /** Max value */
  max?: string | number;
  /** Input type (text, email, etc) */
  type?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** onFocus handler */
  onFocus?: () => void;
  /** onKeyDown handler (alias for onKeyDownExtra) */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Pattern */
  pattern?: string;
  /** Style */
  style?: React.CSSProperties;
  /** Data attributes or any other props */
  [key: `data-${string}`]: string | undefined;
}

export function InputComHistorico({
  value: rawValue,
  onChange,
  tipo,
  placeholder,
  className,
  inputMode,
  maxLength,
  disabled,
  id,
  minSaveLength = 1,
  onBlurExtra,
  onKeyDownExtra,
  inputRef,
  tabIndex,
  autoComplete = "off",
  readOnly,
  required,
  min,
  max,
  type,
  autoFocus,
  onFocus: onFocusProp,
  onKeyDown: onKeyDownProp,
  pattern,
  style,
  ...rest
}: InputComHistoricoProps) {
  const value = rawValue || "";
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [dismissedByEscape, setDismissedByEscape] = useState(false);
  const [selectedFromSuggestion, setSelectedFromSuggestion] = useState(false);
  const valueOnFocusRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Use the forwarded ref or internal ref
  const resolvedRef = (inputRef as React.RefObject<HTMLInputElement>) || internalInputRef;

  // Fetch suggestions from history (ordered by usage count desc, last use desc)
  const { data: sugestoes, refetch: refetchSugestoes } = trpc.historicoTextos.getSugestoes.useQuery(
    { tipo },
    { enabled: !!tipo }
  );

  // Mutation to register usage
  const registrarUsoMutation = trpc.historicoTextos.registrarUso.useMutation({
    onSuccess: () => refetchSugestoes(),
  });

  // Mutation to delete suggestion
  const deletarMutation = trpc.historicoTextos.deletar.useMutation({
    onSuccess: () => refetchSugestoes(),
  });

  // Filter suggestions based on typed text (debounced 150ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Immediate clear when no suggestions available
    if (!sugestoes || sugestoes.length === 0) {
      setFilteredSuggestions([]);
      return;
    }

    // Debounce the filtering to reduce re-renders during fast typing
    debounceRef.current = setTimeout(() => {
      if (!value.trim()) {
        setFilteredSuggestions(sugestoes);
        return;
      }

      const valorLower = value.toLowerCase();
      const filtradas = sugestoes.filter((s) =>
        s.texto.toLowerCase().includes(valorLower)
      );

      setFilteredSuggestions(filtradas);
      setSelectedIndex(-1);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, sugestoes]);

  // Show suggestions when focused and available
  useEffect(() => {
    if (isFocused && filteredSuggestions.length > 0 && !dismissedByEscape) {
      setShowSuggestions(true);
    }
  }, [isFocused, filteredSuggestions, dismissedByEscape]);

  // Close suggestions when clicking outside
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

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-suggestion-item]");
      const selectedItem = items[selectedIndex] as HTMLElement | undefined;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Select a suggestion
  const selecionarSugestao = useCallback((sugestao: any) => {
    onChange(sugestao.texto);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSelectedFromSuggestion(true);

    // Register usage (increment counter)
    registrarUsoMutation.mutate({
      tipo,
      texto: sugestao.texto,
    });
  }, [onChange, tipo, registrarUsoMutation]);

  // Delete a suggestion
  const deletarSugestao = useCallback((e: React.MouseEvent, sugestao: any) => {
    e.preventDefault();
    e.stopPropagation();
    deletarMutation.mutate({ id: sugestao.id });
    setFilteredSuggestions(prev => prev.filter(s => s.id !== sugestao.id));
  }, [deletarMutation]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && showSuggestions && filteredSuggestions.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setShowSuggestions(false);
      setDismissedByEscape(true);
      if (onKeyDownExtra) onKeyDownExtra(e);
      if (onKeyDownProp) onKeyDownProp(e);
      return;
    }

    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (onKeyDownExtra) onKeyDownExtra(e);
      if (onKeyDownProp) onKeyDownProp(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selecionarSugestao(filteredSuggestions[selectedIndex]);
    } else if (e.key === "Tab" && filteredSuggestions.length > 0 && selectedIndex >= 0) {
      e.preventDefault();
      selecionarSugestao(filteredSuggestions[selectedIndex]);
    } else {
      if (onKeyDownExtra) onKeyDownExtra(e);
      if (onKeyDownProp) onKeyDownProp(e);
    }
  };

  // Save on blur (like Chrome - only saves after actual use)
  const handleBlur = () => {
    setIsFocused(false);
    setDismissedByEscape(false);

    const trimmedValue = value.trim();

    setTimeout(() => {
      if (
        trimmedValue &&
        trimmedValue.length >= minSaveLength &&
        trimmedValue !== valueOnFocusRef.current.trim() &&
        !selectedFromSuggestion
      ) {
        registrarUsoMutation.mutate({
          tipo,
          texto: trimmedValue,
        });
      }
      setSelectedFromSuggestion(false);
    }, 200);

    if (onBlurExtra) onBlurExtra();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDismissedByEscape(false);
    setSelectedFromSuggestion(false);
    valueOnFocusRef.current = value;
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
    onFocusProp?.();
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setDismissedByEscape(false);
    setSelectedFromSuggestion(false);
    if (!showSuggestions) {
      setShowSuggestions(true);
    }
  }, [onChange, showSuggestions]);

  // Extract data-* props
  const dataProps: Record<string, string | undefined> = {};
  for (const key of Object.keys(rest)) {
    if (key.startsWith("data-")) {
      dataProps[key] = (rest as any)[key];
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={resolvedRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        id={id}
        tabIndex={tabIndex}
        autoComplete={autoComplete}
        readOnly={readOnly}
        required={required}
        min={min}
        max={max}
        type={type}
        autoFocus={autoFocus}
        pattern={pattern}
        style={style}
        {...dataProps}
      />

      {/* Dropdown de sugestões */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={listRef}
          data-autocomplete-dropdown
          className="absolute z-[100] w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          <div className="py-0.5">
            {filteredSuggestions.map((sugestao, index) => (
              <div
                key={sugestao.id}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selecionarSugestao(sugestao);
                  }}
                  className="flex-1 text-left px-3 py-1.5 min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 truncate">{sugestao.texto}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {sugestao.contadorUso > 1 ? `${sugestao.contadorUso}x` : ""}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  title="Remover sugestão"
                  className="px-1.5 py-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onMouseDown={(e) => deletarSugestao(e, sugestao)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
