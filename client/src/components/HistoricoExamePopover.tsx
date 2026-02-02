import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { History, Trash2, Check } from "lucide-react";

interface HistoricoItem {
  id: number;
  resultado: string;
  dataExame: string | null;
  criadoEm: Date | null;
}

interface HistoricoExamePopoverProps {
  nomeExame: string;
  trimestre: 1 | 2 | 3;
  historico: HistoricoItem[];
  valorAtual: string;
  dataAtual: string;
  onExcluir: (id: number) => void;
  onSelecionarAtivo: (item: HistoricoItem) => void;
}

export function HistoricoExamePopover({
  nomeExame,
  trimestre,
  historico,
  valorAtual,
  dataAtual,
  onExcluir,
  onSelecionarAtivo,
}: HistoricoExamePopoverProps) {
  const [open, setOpen] = useState(false);

  // Só mostrar se houver mais de 1 registro no histórico
  if (historico.length <= 1) return null;

  const formatarData = (data: string | null) => {
    if (!data) return "Sem data";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          title={`${historico.length} registros no histórico`}
        >
          <History className="h-3.5 w-3.5" />
          <span className="sr-only">Ver histórico</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-medium text-sm">Histórico de {nomeExame}</h4>
          <p className="text-xs text-muted-foreground">{trimestre}º Trimestre - {historico.length} registros</p>
        </div>
        <div className="max-h-[250px] overflow-y-auto">
          {historico.map((item) => {
            const isAtivo = item.resultado === valorAtual && item.dataExame === dataAtual;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 border-b last:border-b-0 ${
                  isAtivo ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.resultado || "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatarData(item.dataExame)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {isAtivo ? (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Ativo
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        onSelecionarAtivo(item);
                        setOpen(false);
                      }}
                    >
                      Usar
                    </Button>
                  )}
                  {historico.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => onExcluir(item.id)}
                      title="Excluir este registro"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
