import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConvenioSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  /** Se true, não aplica o valor padrão automaticamente (útil para edição) */
  skipDefault?: boolean;
}

export function ConvenioSelect({ value, onValueChange, label = "Convênio", required = false, className, skipDefault = false }: ConvenioSelectProps) {
  const { data: planos, isLoading } = trpc.planosSaude.listar.useQuery();

  // Auto-preencher com convênio padrão quando o campo está vazio
  useEffect(() => {
    if (skipDefault || isLoading || !planos || value) return;
    const padrao = planos.find((p: any) => p.padrao === 1);
    if (padrao) {
      onValueChange(padrao.nome);
    }
  }, [planos, isLoading, value, skipDefault, onValueChange]);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className || ""}`}>
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <Select disabled>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Carregando convênios..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  const planosAtivos = (planos || []).filter((p: any) => p.ativo !== false);

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="max-w-md">
          <SelectValue placeholder="Selecione o convênio" />
        </SelectTrigger>
        <SelectContent>
          {planosAtivos.length === 0 ? (
            <SelectItem value="__none" disabled>
              Nenhum convênio cadastrado
            </SelectItem>
          ) : (
            planosAtivos.map((p: any) => (
              <SelectItem key={p.id} value={p.nome}>
                {p.nome}
                {p.padrao === 1 && " \u2605"}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {planosAtivos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre convênios em Configurações &rarr; Gerenciar Convênios
        </p>
      )}
    </div>
  );
}
