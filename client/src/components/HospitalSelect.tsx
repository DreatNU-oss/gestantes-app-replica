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
}

export function HospitalSelect({ value, onValueChange, label = "Hospital", className }: HospitalSelectProps) {
  const { data: hospitais, isLoading } = trpc.hospitais.listar.useQuery();

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
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {hospitaisAtivos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Cadastre hospitais em Configurações → Gerenciar Hospitais
        </p>
      )}
    </div>
  );
}
