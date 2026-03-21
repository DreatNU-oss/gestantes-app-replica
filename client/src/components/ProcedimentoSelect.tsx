import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InputComHistorico } from "@/components/InputComHistorico";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProcedimentoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Texto digitado quando "Outra" é selecionado */
  outroTexto?: string;
  onOutroTextoChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  /** Se true, não aplica o valor padrão automaticamente (útil para edição) */
  skipDefault?: boolean;
}

export function ProcedimentoSelect({
  value,
  onValueChange,
  outroTexto = "",
  onOutroTextoChange,
  label = "Procedimento",
  required = false,
  className,
  skipDefault = false,
}: ProcedimentoSelectProps) {
  const { data: procedimentosData, isLoading } = trpc.procedimentos.listar.useQuery();

  const procedimentos = procedimentosData || [];

  // Auto-preencher com procedimento padrão quando o campo está vazio
  useEffect(() => {
    if (skipDefault || isLoading || !procedimentosData || value) return;
    const padrao = procedimentosData.find((p: any) => p.padrao === 1);
    if (padrao) {
      onValueChange(padrao.nome);
    }
  }, [procedimentosData, isLoading, value, skipDefault, onValueChange]);

  // Determinar se o valor atual é um dos procedimentos cadastrados ou "Outra"
  const isOutra = value === "Outra";
  const isKnownValue = !value || isOutra || procedimentos.some((p: any) => p.nome === value);

  // Se o valor não é reconhecido nos procedimentos cadastrados e não é vazio,
  // pode ser um valor customizado salvo anteriormente
  const displayValue = (!isKnownValue && value) ? "Outra" : value;

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className || ""}`}>
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select disabled>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Carregando procedimentos..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={displayValue || undefined}
        onValueChange={(val) => {
          onValueChange(val);
          if (val !== "Outra" && onOutroTextoChange) {
            onOutroTextoChange("");
          }
        }}
      >
        <SelectTrigger className="max-w-md">
          <SelectValue placeholder="Selecione o procedimento" />
        </SelectTrigger>
        <SelectContent>
          {procedimentos.length === 0 ? (
            <SelectItem value="__none" disabled>
              Nenhum procedimento cadastrado
            </SelectItem>
          ) : (
            procedimentos.map((p: any) => (
              <SelectItem key={p.id} value={p.nome}>
                {p.nome}
                {p.padrao === 1 && " \u2605"}
              </SelectItem>
            ))
          )}
          <SelectItem value="Outra">Outra</SelectItem>
        </SelectContent>
      </Select>
      {(isOutra || (!isKnownValue && value)) && onOutroTextoChange && (
        <div className="mt-2 space-y-2">
          <Label>
            Descreva o procedimento {required && <span className="text-red-500">*</span>}
          </Label>
          <InputComHistorico
            tipo="procedimento_outrotexto______isknownvalue____value___value"
            placeholder="Ex: Laparoscopia diagnóstica"
            value={outroTexto || (!isKnownValue && value ? value : "")}
            onChange={(v) => onOutroTextoChange(v)}
            className="max-w-md"
          />
        </div>
      )}
      {procedimentos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre procedimentos em Configurações &rarr; Gerenciar Procedimentos
        </p>
      )}
    </div>
  );
}
