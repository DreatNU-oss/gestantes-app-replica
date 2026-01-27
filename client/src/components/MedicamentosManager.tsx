import { useState, useMemo } from "react";
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
import { Pill, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface MedicamentosManagerProps {
  gestanteId: number;
}

// Medicamentos padrão (fallback se o banco estiver vazio)
const MEDICAMENTOS_LABELS_DEFAULT: Record<string, string> = {
  aas: "AAS",
  anti_hipertensivos: "Anti-hipertensivos",
  calcio: "Cálcio",
  enoxaparina: "Enoxaparina",
  insulina: "Insulina",
  levotiroxina: "Levotiroxina",
  medicamentos_inalatorios: "Medicamentos Inalatórios (corticosteroides/broncodilatadores)",
  polivitaminicos: "Polivitamínicos / Vitaminas específicas",
  progestagenos: "Progestágenos",
  psicotropicos: "Psicotrópicos",
  outros: "Outros",
};

export default function MedicamentosManager({ gestanteId }: MedicamentosManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoMedicamento, setNovoMedicamento] = useState({
    tipo: "",
    especificacao: "",
  });

  const utils = trpc.useUtils();
  const { data: medicamentos = [], isLoading } = trpc.medicamentos.getMedicamentos.useQuery({ gestanteId });
  
  // Buscar opções de medicamentos do banco de dados
  const { data: opcoesMedicamentos = [] } = trpc.opcoesMedicamentos.list.useQuery();

  // Criar mapa de labels a partir das opções do banco
  const medicamentosLabels = useMemo(() => {
    if (opcoesMedicamentos.length === 0) {
      return MEDICAMENTOS_LABELS_DEFAULT;
    }
    const labels: Record<string, string> = {};
    opcoesMedicamentos.forEach(opcao => {
      if (opcao.ativo === 1) {
        labels[opcao.codigo] = opcao.nome;
      }
    });
    return labels;
  }, [opcoesMedicamentos]);

  // Opções ordenadas alfabeticamente para o select
  const opcoesOrdenadas = useMemo(() => {
    if (opcoesMedicamentos.length === 0) {
      // Fallback para opções padrão
      return Object.entries(MEDICAMENTOS_LABELS_DEFAULT)
        .map(([codigo, nome]) => ({ 
          codigo, 
          nome, 
          permiteTextoLivre: ['anti_hipertensivos', 'medicamentos_inalatorios', 'insulina', 'outros'].includes(codigo) ? 1 : 0 
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
    return opcoesMedicamentos
      .filter(opcao => opcao.ativo === 1)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [opcoesMedicamentos]);

  // Verificar se o tipo selecionado permite texto livre
  const tipoPermiteTextoLivre = useMemo(() => {
    if (!novoMedicamento.tipo) return false;
    const opcao = opcoesOrdenadas.find(o => o.codigo === novoMedicamento.tipo);
    return opcao?.permiteTextoLivre === 1;
  }, [novoMedicamento.tipo, opcoesOrdenadas]);

  const addMedicamentoMutation = trpc.medicamentos.addMedicamento.useMutation({
    onSuccess: () => {
      utils.medicamentos.getMedicamentos.invalidate({ gestanteId });
      toast.success("Medicamento adicionado");
      setShowAddForm(false);
      setNovoMedicamento({ tipo: "", especificacao: "" });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar medicamento", {
        description: error.message,
      });
    },
  });

  const deleteMedicamentoMutation = trpc.medicamentos.deleteMedicamento.useMutation({
    onSuccess: () => {
      utils.medicamentos.getMedicamentos.invalidate({ gestanteId });
      toast.success("Medicamento removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover medicamento", {
        description: error.message,
      });
    },
  });

  const handleAddMedicamento = () => {
    if (!novoMedicamento.tipo) {
      toast.error("Selecione um tipo de medicamento");
      return;
    }

    if (tipoPermiteTextoLivre && !novoMedicamento.especificacao) {
      const opcao = opcoesOrdenadas.find(o => o.codigo === novoMedicamento.tipo);
      toast.error(`Especifique o medicamento para ${opcao?.nome || 'este tipo'}`);
      return;
    }

    addMedicamentoMutation.mutate({
      gestanteId,
      tipo: novoMedicamento.tipo as any,
      especificacao: novoMedicamento.especificacao || undefined,
    });
  };

  const handleDeleteMedicamento = (id: number) => {
    if (confirm("Tem certeza que deseja remover este medicamento?")) {
      deleteMedicamentoMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando medicamentos...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5 text-blue-600" />
          Medicamentos na Gestação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {medicamentos.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground">Nenhum medicamento registrado</p>
        )}

        {medicamentos.length > 0 && (
          <div className="space-y-2">
            {medicamentos.map((med: any) => (
              <div key={med.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex-1">
                  <Badge variant="outline" className="mb-1">
                    {medicamentosLabels[med.tipo] || med.tipo}
                  </Badge>
                  {med.especificacao && (
                    <p className="text-sm text-muted-foreground mt-1">{med.especificacao}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMedicamento(med.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="tipoMedicamento">Tipo de Medicamento</Label>
              <Select
                value={novoMedicamento.tipo}
                onValueChange={(value) => setNovoMedicamento({ tipo: value, especificacao: "" })}
              >
                <SelectTrigger id="tipoMedicamento">
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
              <div className="space-y-2">
                <Label htmlFor="especificacao">Especificar *</Label>
                <Input
                  id="especificacao"
                  value={novoMedicamento.especificacao}
                  onChange={(e) => setNovoMedicamento({ ...novoMedicamento, especificacao: e.target.value })}
                  placeholder="Ex: Losartana 50mg, Atenolol 25mg"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddMedicamento} disabled={addMedicamentoMutation.isPending}>
                Adicionar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNovoMedicamento({ tipo: "", especificacao: "" });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Medicamento
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
