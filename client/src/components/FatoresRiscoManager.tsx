import { useState, useEffect, useMemo } from "react";
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

// Fatores de risco padrão (fallback se o banco estiver vazio)
const FATORES_RISCO_LABELS_DEFAULT: Record<string, string> = {
  alergia_medicamentos: "Alergia a medicamentos",
  alteracoes_morfologicas_fetais: "Alterações morfológicas fetais",
  cirurgia_uterina_previa: "Cirurgia Uterina Prévia",
  diabetes_gestacional: "Diabetes Gestacional",
  diabetes_tipo2: "Diabetes Tipo 2",
  dpoc_asma: "DPOC/Asma",
  epilepsia: "Epilepsia",
  fator_preditivo_dheg: "Fator Preditivo Positivo para DHEG (Hist. Familiar, Doppler uterinas e/ou outros fatores de risco)",
  fator_rh_negativo: "Fator Rh Negativo",
  gemelar: "Gemelar",
  hipertensao: "Hipertensão",
  hipotireoidismo: "Hipotireoidismo",
  historico_familiar_dheg: "Mãe/irmã com histórico de DHEG",
  idade_avancada: "Idade ≥ 35 anos",
  incompetencia_istmo_cervical: "Incompetência Istmo-cervical",
  mal_passado_obstetrico: "Mal Passado Obstétrico",
  malformacoes_mullerianas: "Malformações Müllerianas (Útero bicorno/septado/arqueado)",
  outro: "Outro",
  sobrepeso_obesidade: "Sobrepeso/obesidade",
  trombofilia: "Trombofilia",
};

export default function FatoresRiscoManager({ gestanteId, idadeGestante }: FatoresRiscoManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoFator, setNovoFator] = useState({
    tipo: "",
    descricao: "",
  });

  const utils = trpc.useUtils();
  const { data: fatores = [], isLoading } = trpc.gestantes.getFatoresRisco.useQuery({ gestanteId });
  
  // Buscar opções de fatores de risco do banco de dados
  const { data: opcoesFatoresRisco = [] } = trpc.opcoesFatoresRisco.list.useQuery();

  // Criar mapa de labels a partir das opções do banco
  const fatoresRiscoLabels = useMemo(() => {
    if (opcoesFatoresRisco.length === 0) {
      return FATORES_RISCO_LABELS_DEFAULT;
    }
    const labels: Record<string, string> = {};
    opcoesFatoresRisco.forEach(opcao => {
      if (opcao.ativo === 1) {
        labels[opcao.codigo] = opcao.nome;
      }
    });
    return labels;
  }, [opcoesFatoresRisco]);

  // Opções ordenadas alfabeticamente para o select
  const opcoesOrdenadas = useMemo(() => {
    if (opcoesFatoresRisco.length === 0) {
      // Fallback para opções padrão
      return Object.entries(FATORES_RISCO_LABELS_DEFAULT)
        .map(([codigo, nome]) => ({ codigo, nome, permiteTextoLivre: codigo === 'outro' || codigo === 'alergia_medicamentos' || codigo === 'mal_passado_obstetrico' ? 1 : 0 }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
    return opcoesFatoresRisco
      .filter(opcao => opcao.ativo === 1)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [opcoesFatoresRisco]);

  // Verificar se o tipo selecionado permite texto livre
  const tipoPermiteTextoLivre = useMemo(() => {
    if (!novoFator.tipo) return false;
    const opcao = opcoesOrdenadas.find(o => o.codigo === novoFator.tipo);
    return opcao?.permiteTextoLivre === 1;
  }, [novoFator.tipo, opcoesOrdenadas]);

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
  // Executa quando a idade da gestante muda (após preencher data de nascimento)
  // ou quando os fatores de risco são carregados/atualizados
  useEffect(() => {
    // Só executa se temos uma idade válida >= 35 anos e os dados já carregaram
    if (!idadeGestante || idadeGestante < 35 || isLoading) {
      return;
    }

    // Verifica se já existe o fator de risco "idade_avancada" ativo
    const temIdadeAvancada = fatores.some(f => f.tipo === "idade_avancada" && f.ativo === 1);
    
    // Adiciona automaticamente se não existir e não estiver em processo de adição
    if (!temIdadeAvancada && !addFatorMutation.isPending) {
      addFatorMutation.mutate({
        gestanteId,
        tipo: "idade_avancada",
        descricao: "Detectado automaticamente",
      });
    }
  }, [idadeGestante, fatores, isLoading, gestanteId]);

  const handleAddFator = () => {
    if (!novoFator.tipo) {
      toast.error("Selecione um tipo de fator de risco");
      return;
    }

    // Verificar se o tipo requer descrição
    if (tipoPermiteTextoLivre && !novoFator.descricao) {
      const opcao = opcoesOrdenadas.find(o => o.codigo === novoFator.tipo);
      toast.error(`Preencha o campo de descrição para ${opcao?.nome || 'este fator'}`);
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
  
  // Verificar se tem fatores de risco relevantes (excluindo "Alergia a medicamento")
  const temFatoresRelevantes = fatoresAtivos.some(f => 
    f.descricao?.toLowerCase() !== 'alergia a medicamento' &&
    f.descricao?.toLowerCase() !== 'alergia a medicamentos'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Fatores de Risco
          {temFatoresRelevantes && (
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
                    {fatoresRiscoLabels[fator.tipo] || fator.tipo}
                  </p>
                  {fator.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {fator.descricao}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
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
            type="button"
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
                  setNovoFator({ ...novoFator, tipo: value, descricao: "" })
                }
              >
                <SelectTrigger id="tipoFator">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {opcoesOrdenadas.map((opcao) => (
                    <SelectItem key={opcao.codigo} value={opcao.codigo}>
                      {opcao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tipoPermiteTextoLivre && (
              <div>
                <Label htmlFor="descricao">
                  {novoFator.tipo === "outro" ? "Descrição *" : 
                   novoFator.tipo === "alergia_medicamentos" ? "Especificar medicamentos *" : 
                   "Detalhes *"}
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
                type="button"
                onClick={handleAddFator}
                disabled={addFatorMutation.isPending}
                size="sm"
                className="flex-1"
              >
                Adicionar
              </Button>
              <Button
                type="button"
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
