import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface FatoresRiscoManagerProps {
  gestanteId: number;
  idadeGestante?: number | null;
}

const FATORES_RISCO_LABELS: Record<string, string> = {
  diabetes_gestacional: "Diabetes Gestacional",
  diabetes_tipo2: "Diabetes Tipo 2",
  dpoc_asma: "DPOC/Asma",
  epilepsia: "Epilepsia",
  hipotireoidismo: "Hipotireoidismo",
  hipertensao: "Hipertensão",
  historico_familiar_dheg: "Mãe/irmã com histórico de DHEG",
  idade_avancada: "Idade ≥ 35 anos",
  incompetencia_istmo_cervical: "Incompetência Istmo-cervical",
  mal_passado_obstetrico: "Mal Passado Obstétrico",
  malformacoes_mullerianas: "Malformações Müllerianas (Útero bicorno/septado/arqueado)",
  trombofilia: "Trombofilia",
  outro: "Outro",
};

export default function FatoresRiscoManager({ gestanteId, idadeGestante }: FatoresRiscoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoFator, setNovoFator] = useState({
    tipo: "",
    descricao: "",
  });

  const utils = trpc.useUtils();
  const { data: fatores = [], isLoading } = trpc.gestantes.getFatoresRisco.useQuery({ gestanteId });

  const addFatorMutation = trpc.gestantes.addFatorRisco.useMutation({
    onSuccess: () => {
      utils.gestantes.getFatoresRisco.invalidate({ gestanteId });
      toast.success("Fator de risco adicionado");
      setShowAddForm(false);
      setNovoFator({ tipo: "", descricao: "" });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar fator de risco", {
        description: error.message,
      });
    },
  });

  const deleteFatorMutation = trpc.gestantes.deleteFatorRisco.useMutation({
    onSuccess: () => {
      utils.gestantes.getFatoresRisco.invalidate({ gestanteId });
      toast.success("Fator de risco removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover fator de risco", {
        description: error.message,
      });
    },
  });

  // Verificar se deve adicionar automaticamente "idade_avancada"
  useEffect(() => {
    if (idadeGestante && idadeGestante >= 35 && fatores.length > 0) {
      const temIdadeAvancada = fatores.some(f => f.tipo === "idade_avancada" && f.ativo === 1);
      if (!temIdadeAvancada) {
        addFatorMutation.mutate({
          gestanteId,
          tipo: "idade_avancada",
          descricao: "Detectado automaticamente",
        });
      }
    }
  }, [idadeGestante, fatores]);

  const handleAddFator = () => {
    if (!novoFator.tipo) {
      toast.error("Selecione um tipo de fator de risco");
      return;
    }

    if (novoFator.tipo === "outro" && !novoFator.descricao) {
      toast.error("Descreva o fator de risco");
      return;
    }

    addFatorMutation.mutate({
      gestanteId,
      tipo: novoFator.tipo as any,
      descricao: novoFator.descricao || undefined,
    });
  };

  const handleRemoveFator = (id: number) => {
    deleteFatorMutation.mutate({ id });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando fatores de risco...</div>;
  }

  const fatoresAtivos = fatores.filter(f => f.ativo === 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Fatores de Risco
          {fatoresAtivos.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              Alto Risco
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fatoresAtivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum fator de risco registrado
          </p>
        ) : (
          <div className="space-y-2">
            {fatoresAtivos.map((fator) => (
              <div
                key={fator.id}
                className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {FATORES_RISCO_LABELS[fator.tipo]}
                  </p>
                  {fator.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {fator.descricao}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFator(fator.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!showAddForm ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Fator de Risco
          </Button>
        ) : (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="tipoFator">Tipo de Fator de Risco</Label>
              <Select
                value={novoFator.tipo}
                onValueChange={(value) =>
                  setNovoFator({ ...novoFator, tipo: value })
                }
              >
                <SelectTrigger id="tipoFator">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diabetes_gestacional">Diabetes Gestacional</SelectItem>
                  <SelectItem value="diabetes_tipo2">Diabetes Tipo 2</SelectItem>
                  <SelectItem value="dpoc_asma">DPOC/Asma</SelectItem>
                  <SelectItem value="epilepsia">Epilepsia</SelectItem>
                  <SelectItem value="hipotireoidismo">Hipotireoidismo</SelectItem>
                  <SelectItem value="hipertensao">Hipertensão</SelectItem>
                  <SelectItem value="historico_familiar_dheg">
                    Mãe/irmã com histórico de DHEG
                  </SelectItem>
                  <SelectItem value="idade_avancada">Idade ≥ 35 anos</SelectItem>
                  <SelectItem value="incompetencia_istmo_cervical">
                    Incompetência Istmo-cervical
                  </SelectItem>
                  <SelectItem value="mal_passado_obstetrico">
                    Mal Passado Obstétrico
                  </SelectItem>
                  <SelectItem value="malformacoes_mullerianas">
                    Malformações Müllerianas (Útero bicorno/septado/arqueado)
                  </SelectItem>
                  <SelectItem value="trombofilia">Trombofilia</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(novoFator.tipo === "outro" || novoFator.tipo === "mal_passado_obstetrico") && (
              <div>
                <Label htmlFor="descricao">
                  {novoFator.tipo === "outro" ? "Descrição *" : "Detalhes (opcional)"}
                </Label>
                <Input
                  id="descricao"
                  value={novoFator.descricao}
                  onChange={(e) =>
                    setNovoFator({ ...novoFator, descricao: e.target.value })
                  }
                  placeholder="Descreva o fator de risco..."
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleAddFator}
                disabled={addFatorMutation.isPending}
                size="sm"
                className="flex-1"
              >
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNovoFator({ tipo: "", descricao: "" });
                }}
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
