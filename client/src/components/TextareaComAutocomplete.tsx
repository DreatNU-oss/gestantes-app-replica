import { useState, useEffect, useRef } from "react";
import { Textarea } from "./ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface TextareaComAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  tipo: "observacao" | "conduta_complementacao" | "historia_patologica" | "historia_social" | "historia_familiar";
  className?: string;
}

export function TextareaComAutocomplete({
  value,
  onChange,
  placeholder,
  rows = 3,
  tipo,
  className,
}: TextareaComAutocompleteProps) {
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [sugestoesFiltradas, setSugestoesFiltradas] = useState<any[]>([]);
  const [indiceSelecionado, setIndiceSelecionado] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sugestoesRef = useRef<HTMLDivElement>(null);

  // Buscar sugestões do histórico
  const { data: sugestoes, isLoading } = trpc.historicoTextos.getSugestoes.useQuery({
    tipo,
  });

  // Mutation para registrar uso
  const registrarUsoMutation = trpc.historicoTextos.registrarUso.useMutation();

  // Filtrar sugestões baseado no texto digitado
  useEffect(() => {
    if (!sugestoes || !value.trim()) {
      setSugestoesFiltradas([]);
      setMostrarSugestoes(false);
      return;
    }

    const valorLower = value.toLowerCase();
    const filtradas = sugestoes.filter((s) =>
      s.texto.toLowerCase().includes(valorLower)
    );

    setSugestoesFiltradas(filtradas);
    setMostrarSugestoes(filtradas.length > 0 && value.length >= 3);
    setIndiceSelecionado(-1);
  }, [value, sugestoes]);

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
    } else if (e.key === "Escape") {
      setMostrarSugestoes(false);
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

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => {
          if (value.length >= 3 && sugestoesFiltradas.length > 0) {
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
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
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
                  onClick={() => selecionarSugestao(sugestao)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                    index === indiceSelecionado ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1 line-clamp-2">{sugestao.texto}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {sugestao.contadorUso}x
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Indicador de sugestões disponíveis */}
      {!mostrarSugestoes && sugestoes && sugestoes.length > 0 && value.length < 3 && (
        <div className="absolute right-2 top-2 text-xs text-muted-foreground">
          Digite 3+ caracteres para ver sugestões
        </div>
      )}
    </div>
  );
}
