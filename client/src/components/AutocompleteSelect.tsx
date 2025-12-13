import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Option {
  id: number;
  nome: string;
}

interface AutocompleteSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Função para normalizar texto removendo acentos
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function AutocompleteSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  className = "",
}: AutocompleteSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Encontrar a opção selecionada
  const selectedOption = options.find((opt) => opt.id.toString() === value);

  // Filtrar opções com base no termo de busca (ignorando acentos)
  const filteredOptions = options.filter((opt) =>
    normalizeText(opt.nome).includes(normalizeText(searchTerm))
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
    setFocusedIndex(-1);
  };

  const handleSelectOption = (option: Option) => {
    onChange(option.id.toString());
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[focusedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          placeholder={selectedOption ? selectedOption.nome : placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {selectedOption && !showDropdown && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
      
      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelectOption(option)}
              className={`w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors ${
                index === focusedIndex ? "bg-accent text-accent-foreground" : ""
              } ${
                option.id.toString() === value ? "bg-accent/50" : ""
              }`}
            >
              {option.nome}
            </button>
          ))}
        </div>
      )}
      
      {showDropdown && searchTerm && filteredOptions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
          Nenhuma gestante encontrada
        </div>
      )}
    </div>
  );
}
