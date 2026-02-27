import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "./ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, HelpCircle, Star, X, BookmarkPlus } from "lucide-react";
import { highlightMatch } from "@/lib/highlightMatch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface TextareaComAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  tipo: "observacao" | "conduta_complementacao" | "historia_patologica" | "historia_social" | "historia_familiar" | "us_biometria" | "us_avaliacao_anatomica" | "us_observacoes" | "eco_conclusao" | "us_seguimento_observacoes" | "hipotese_diagnostica" | "detalhamento_queixa_urgencia" | "toque_vaginal" | "usg_hoje" | "auf_urgencia" | "outra_conduta_urgencia";
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
  // Track whether the user selected a suggestion (already saved) or typed manually
  const [selectedFromSuggestion, setSelectedFromSuggestion] = useState(false);
  // Track the value when the field was focused to detect real changes
  const valueOnFocusRef = useRef<string>("");
  // Track if phrase was just saved to show feedback
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  // Buscar sugestões do histórico (ordenadas por contadorUso desc, ultimoUso desc)
  const { data: sugestoes, isLoading, refetch: refetchSugestoes } = trpc.historicoTextos.getSugestoes.useQuery({
    tipo,
  });

  // Mutation para registrar uso
  const registrarUsoMutation = trpc.historicoTextos.registrarUso.useMutation({
    onSuccess: () => refetchSugestoes(),
  });

  // Mutation para deletar sugestão
  const deletarMutation = trpc.historicoTextos.deletar.useMutation({
    onSuccess: () => refetchSugestoes(),
  });

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
    setSelectedFromSuggestion(true);

    // Registrar uso da sugestão selecionada (incrementa contador)
    registrarUsoMutation.mutate({
      tipo,
      texto: sugestao.texto,
    });
  };

  // Deletar uma sugestão
  const deletarSugestao = useCallback((e: React.MouseEvent, sugestao: any) => {
    e.preventDefault();
    e.stopPropagation();
    deletarMutation.mutate({ id: sugestao.id });
    // Remover localmente imediatamente
    setSugestoesFiltradas(prev => prev.filter(s => s.id !== sugestao.id));
  }, [deletarMutation]);

  // Salvar frase atual como sugestão favorita com um clique
  const salvarComoFavorita = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.length < 3) {
      toast.error("Digite uma frase com pelo menos 3 caracteres para salvar");
      return;
    }

    // Verifica se já existe nas sugestões
    const jaExiste = sugestoes?.some(s => s.texto.toLowerCase() === trimmedValue.toLowerCase());
    if (jaExiste) {
      toast.info("Essa frase já está salva nas sugestões");
      return;
    }

    registrarUsoMutation.mutate(
      { tipo, texto: trimmedValue },
      {
        onSuccess: () => {
          toast.success("Frase salva como sugestão!");
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2000);
        },
      }
    );
  }, [value, tipo, sugestoes, registrarUsoMutation]);

  // Registrar uso APENAS ao perder foco (blur) — quando o usuário terminou de digitar
  // Não grava se: o texto é muito curto, não mudou desde o foco, ou veio de seleção de sugestão
  const handleBlur = () => {
    setIsFocused(false);
    setDismissedByEscape(false);

    const trimmedValue = value.trim();

    // Delay para permitir clique em sugestão antes de fechar
    setTimeout(() => {
      // Só salva se:
      // 1. Tem texto com pelo menos 5 caracteres
      // 2. O texto mudou desde que o campo foi focado
      // 3. Não veio de uma seleção de sugestão (já foi salvo no selecionarSugestao)
      if (
        trimmedValue &&
        trimmedValue.length >= 5 &&
        trimmedValue !== valueOnFocusRef.current.trim() &&
        !selectedFromSuggestion
      ) {
        registrarUsoMutation.mutate({
          tipo,
          texto: trimmedValue,
        });
      }
      // Reset flag
      setSelectedFromSuggestion(false);
    }, 200);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDismissedByEscape(false);
    setSelectedFromSuggestion(false);
    // Captura o valor atual ao focar para comparar no blur
    valueOnFocusRef.current = value;
    if (sugestoesFiltradas.length > 0) {
      setMostrarSugestoes(true);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Reset escape dismiss when user types
    setDismissedByEscape(false);
    // Reset suggestion selection flag since user is typing manually
    setSelectedFromSuggestion(false);
    // Mostrar sugestões ao digitar
    if (!mostrarSugestoes) {
      setMostrarSugestoes(true);
    }
  }, [onChange, mostrarSugestoes]);

  const hasText = value.trim().length >= 3;

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
            onFocus={handleFocus}
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
                    <div
                      key={sugestao.id}
                      className={`group flex items-center w-full text-sm transition-colors ${
                        index === indiceSelecionado ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selecionarSugestao(sugestao);
                        }}
                        className="flex-1 text-left px-3 py-2"
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
                      <button
                        type="button"
                        title="Remover sugestão"
                        className="px-2 py-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onMouseDown={(e) => deletarSugestao(e, sugestao)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Botão salvar como favorita */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`transition-colors mt-2 ${
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
              <div><strong>Bookmark</strong> - Salvar frase atual</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
