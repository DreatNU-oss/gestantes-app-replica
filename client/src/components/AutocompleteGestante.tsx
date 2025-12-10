import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Gestante {
  id: number;
  nome: string;
}

interface AutocompleteGestanteProps {
  gestantes: Gestante[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (gestante: Gestante) => void;
  placeholder?: string;
  className?: string;
}

export function AutocompleteGestante({
  gestantes,
  value,
  onChange,
  onSelect,
  placeholder = "Buscar por nome...",
  className = "",
}: AutocompleteGestanteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar gestantes com base no termo de busca
  const filteredGestantes = gestantes.filter((g) =>
    g.nome.toLowerCase().includes(value.toLowerCase())
  );

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    setFocusedIndex(-1);
  };

  const handleSelectGestante = (gestante: Gestante) => {
    onChange(gestante.nome);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(gestante);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredGestantes.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredGestantes.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredGestantes.length) {
          handleSelectGestante(filteredGestantes[focusedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        className="pl-10"
        autoComplete="off"
      />
      
      {showSuggestions && value && filteredGestantes.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredGestantes.slice(0, 10).map((gestante, index) => (
            <button
              key={gestante.id}
              type="button"
              onClick={() => handleSelectGestante(gestante)}
              className={`w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors ${
                index === focusedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              {gestante.nome}
            </button>
          ))}
          {filteredGestantes.length > 10 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t">
              +{filteredGestantes.length - 10} mais resultados...
            </div>
          )}
        </div>
      )}
      
      {showSuggestions && value && filteredGestantes.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
          Nenhuma gestante encontrada
        </div>
      )}
    </div>
  );
}
