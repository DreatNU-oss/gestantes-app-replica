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

interface HospitalSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  /** Se true, não aplica o valor padrão automaticamente (útil para edição) */
  skipDefault?: boolean;
}

export function HospitalSelect({ value, onValueChange, label = "Hospital", className, skipDefault = false }: HospitalSelectProps) {
  const { data: hospitais, isLoading } = trpc.hospitais.listar.useQuery();

  // Auto-preencher com hospital padrão quando o campo está vazio
  useEffect(() => {
    if (skipDefault || isLoading || !hospitais || value) return;
    const padrao = hospitais.find((h: any) => h.padrao === 1);
    if (padrao) {
      onValueChange(padrao.nome);
    }
  }, [hospitais, isLoading, value, skipDefault, onValueChange]);

  if (isLoading) {
    return (
      <div className={`space-y-2 mt-4 ${className || ""}`}>
        <Label>{label}</Label>
        <Select disabled>
          <SelectTrigger className="max-w-md">
            <SelectValue placeholder="Carregando hospitais..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  const hospitaisAtivos = hospitais || [];

  return (
    <div className={`space-y-2 mt-4 ${className || ""}`}>
      <Label>{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="max-w-md">
          <SelectValue placeholder="Selecione o hospital" />
        </SelectTrigger>
        <SelectContent>
          {hospitaisAtivos.length === 0 ? (
            <SelectItem value="__none" disabled>
              Nenhum hospital cadastrado
            </SelectItem>
          ) : (
            hospitaisAtivos.map((h) => (
              <SelectItem key={h.id} value={h.nome}>
                {h.nome}
                {(h as any).padrao === 1 && " \u2605"}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {hospitaisAtivos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre hospitais em Configurações &rarr; Gerenciar Hospitais
        </p>
      )}
    </div>
  );
}
