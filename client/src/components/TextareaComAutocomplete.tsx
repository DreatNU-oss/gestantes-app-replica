import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "./ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, HelpCircle, Star } from "lucide-react";
import { highlightMatch } from "@/lib/highlightMatch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TextareaComAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  tipo: "observacao" | "conduta_complementacao" | "historia_patologica" | "historia_social" | "historia_familiar" | "us_biometria" | "us_avaliacao_anatomica" | "us_observacoes" | "eco_conclusao" | "us_seguimento_observacoes";
  className?: string;
}

export function TextareaComAutocomplete({
  value: rawValue,
  onChange,
  placeholder,
  rows = 3,
  tipo,
  className,
}: TextareaComAutocompleteProps) {
  const value = rawValue || "";
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [sugestoesFiltradas, setSugestoesFiltradas] = useState<any[]>([]);
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [dismissedByEscape, setDismissedByEscape] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  // Buscar sugestões do histórico (ordenadas por contadorUso desc, ultimoUso desc)
  const { data: sugestoes, isLoading } = trpc.historicoTextos.getSugestoes.useQuery({
    tipo,
  });

  // Mutation para registrar uso
  const registrarUsoMutation = trpc.historicoTextos.registrarUso.useMutation();

  // Filtrar sugestões baseado no texto digitado
  useEffect(() => {
    if (!sugestoes) {
      setSugestoesFiltradas([]);
      return;
    }

    // Se não há texto, mostrar todas as sugestões (mais usadas no topo)
    if (!value.trim()) {
      setSugestoesFiltradas(sugestoes);
      return;
    }

    const valorLower = value.toLowerCase();
    const filtradas = sugestoes.filter((s) =>
      s.texto.toLowerCase().includes(valorLower)
    );

    setSugestoesFiltradas(filtradas);
    setIndiceSelecionado(-1);
  }, [value, sugestoes]);

  // Mostrar sugestões quando o campo está focado e há sugestões disponíveis
  // Isso resolve o caso onde onFocus é chamado antes dos dados serem carregados
  useEffect(() => {
    if (isFocused && sugestoesFiltradas.length > 0 && !dismissedByEscape) {
      setMostrarSugestoes(true);
    }
  }, [isFocused, sugestoesFiltradas, dismissedByEscape]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugestoesRef.current &&
        !sugestoesRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setMostrarSugestoes(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navegar pelas sugestões com teclado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && mostrarSugestoes && sugestoesFiltradas.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setMostrarSugestoes(false);
      setDismissedByEscape(true);
      return;
    }

    if (!mostrarSugestoes || sugestoesFiltradas.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceSelecionado((prev) =>
        prev < sugestoesFiltradas.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceSelecionado((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && indiceSelecionado >= 0) {
      e.preventDefault();
      selecionarSugestao(sugestoesFiltradas[indiceSelecionado]);
    } else if (e.key === "Tab") {
      // Accept the selected suggestion, or the first one if none is selected
      if (sugestoesFiltradas.length > 0) {
        e.preventDefault();
        const idx = indiceSelecionado >= 0 ? indiceSelecionado : 0;
        selecionarSugestao(sugestoesFiltradas[idx]);
      }
    }
  };

  // Selecionar uma sugestão
  const selecionarSugestao = (sugestao: any) => {
    onChange(sugestao.texto);
    setMostrarSugestoes(false);
    setIndiceSelecionado(-1);

    // Registrar uso da sugestão
    registrarUsoMutation.mutate({
      tipo,
      texto: sugestao.texto,
    });
  };

  // Registrar uso ao perder foco (blur) se houver texto
  const handleBlur = () => {
    setIsFocused(false);
    setDismissedByEscape(false);
    // Delay para permitir clique em sugestão
    setTimeout(() => {
      if (value.trim() && value.length >= 5) {
        registrarUsoMutation.mutate({
          tipo,
          texto: value.trim(),
        });
      }
    }, 200);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Reset escape dismiss when user types
    setDismissedByEscape(false);
    // Mostrar sugestões ao digitar
    if (!mostrarSugestoes) {
      setMostrarSugestoes(true);
    }
  }, [onChange, mostrarSugestoes]);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-1">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              setIsFocused(true);
              setDismissedByEscape(false);
              // Mostrar sugestões ao focar, mesmo sem texto
              if (sugestoesFiltradas.length > 0) {
                setMostrarSugestoes(true);
              }
            }}
            placeholder={placeholder}
            rows={rows}
            className={className}
          />

          {/* Lista de sugestões */}
          {mostrarSugestoes && sugestoesFiltradas.length > 0 && (
            <div
              ref={sugestoesRef}
              data-autocomplete-dropdown
              className="absolute z-[100] w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <div className="py-1">
                  {sugestoesFiltradas.map((sugestao, index) => (
                    <button
                      key={sugestao.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selecionarSugestao(sugestao);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        index === indiceSelecionado ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex-1 line-clamp-2">
                          {highlightMatch(sugestao.texto, value)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {index === 0 && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {sugestao.contadorUso}x
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors mt-2"
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
    </div>
  );
}
