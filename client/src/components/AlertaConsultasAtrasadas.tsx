import { useState, useEffect } from "react";
import { AlertTriangle, Calendar, Clock, Phone, Baby, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface GestanteAlerta {
  gestante: {
    id: number;
    nome: string;
    telefone?: string | null;
  };
  ultimaConsulta: Date | null;
  diasSemConsulta: number;
  igAtual: { semanas: number; dias: number; totalDias: number } | null;
  limiteDias: number;
  faixaIG: string;
}

const MOTIVOS_JUSTIFICATIVA = [
  { value: "ja_agendada", label: "Paciente já está agendada" },
  { value: "desistiu_prenatal", label: "Paciente desistiu do pré-natal" },
  { value: "abortamento", label: "Paciente evoluiu para abortamento" },
  { value: "mudou_cidade", label: "Paciente mudou-se para outra cidade" },
  { value: "evoluiu_parto", label: "Paciente evoluiu para parto" },
  { value: "espaco_maior_consultas", label: "Paciente decidiu um espaço maior entre as consultas por conta própria" },
] as const;

type MotivoJustificativa = typeof MOTIVOS_JUSTIFICATIVA[number]["value"];

export function AlertaConsultasAtrasadas() {
  const [modalAberto, setModalAberto] = useState(false);
  const [gestanteSelecionada, setGestanteSelecionada] = useState<GestanteAlerta | null>(null);
  const [motivoSelecionado, setMotivoSelecionado] = useState<MotivoJustificativa | "">("");
  const [dataPrevistaConsulta, setDataPrevistaConsulta] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  const utils = trpc.useUtils();
  
  const { data: gestantesAtrasadas, isLoading, refetch } = trpc.gestantes.semConsultaRecente.useQuery(
    undefined,
    {
      // Refetch on window focus to ensure alerts are always up-to-date
      refetchOnWindowFocus: true,
      // Refetch when the component mounts (app opens)
      refetchOnMount: 'always',
      // Keep data fresh - refetch every 5 minutes in background
      refetchInterval: 5 * 60 * 1000,
      // Don't refetch in background when window is not focused
      refetchIntervalInBackground: false,
    }
  );

  // Force refetch when the page becomes visible (e.g., switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  const criarJustificativaMutation = trpc.gestantes.criarJustificativa.useMutation({
    onSuccess: () => {
      toast.success("Justificativa registrada com sucesso!");
      setModalAberto(false);
      setGestanteSelecionada(null);
      setMotivoSelecionado("");
      setDataPrevistaConsulta("");
      setObservacoes("");
      utils.gestantes.semConsultaRecente.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar justificativa: " + error.message);
    }
  });

  const formatarData = (date: Date | null): string => {
    if (!date) return "Nunca consultou";
    const d = new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarIG = (ig: { semanas: number; dias: number } | null): string => {
    if (!ig) return "IG não informada";
    return `${ig.semanas}s ${ig.dias}d`;
  };

  const handleAbrirModal = (gestante: GestanteAlerta) => {
    setGestanteSelecionada(gestante);
    setMotivoSelecionado("");
    setDataPrevistaConsulta("");
    setObservacoes("");
    setModalAberto(true);
  };

  const handleConfirmarJustificativa = () => {
    if (!gestanteSelecionada || !motivoSelecionado) {
      toast.error("Selecione um motivo para a justificativa");
      return;
    }

    // Validar data prevista para justificativas temporárias
    if ((motivoSelecionado === 'ja_agendada' || motivoSelecionado === 'espaco_maior_consultas') && !dataPrevistaConsulta) {
      toast.error("Informe a data prevista da consulta");
      return;
    }

    criarJustificativaMutation.mutate({
      gestanteId: gestanteSelecionada.gestante.id,
      motivo: motivoSelecionado,
      dataPrevistaConsulta: (motivoSelecionado === 'ja_agendada' || motivoSelecionado === 'espaco_maior_consultas') ? dataPrevistaConsulta : undefined,
      observacoes: observacoes || undefined
    });
  };

  // Função para determinar a cor do badge baseado na faixa de IG
  const getBadgeColor = (faixaIG: string): string => {
    switch (faixaIG) {
      case 'Após 36 semanas':
        return 'bg-red-100 text-red-800 border-red-300';
      case '34-36 semanas':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  if (isLoading) {
    return null;
  }

  if (!gestantesAtrasadas || gestantesAtrasadas.length === 0) {
    return null;
  }

  // Agrupar por faixa de IG para melhor visualização
  const gestantesPorFaixa = {
    'Após 36 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === 'Após 36 semanas'),
    '34-36 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === '34-36 semanas'),
    'Até 34 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === 'Até 34 semanas' || g.faixaIG === 'Sem IG'),
  };

  const renderGestanteCard = (item: GestanteAlerta, corBorda: string, corTexto: string, corBotao: string) => (
    <div 
      key={item.gestante.id} 
      className={`flex items-center justify-between p-3 bg-white rounded-lg border ${corBorda}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{item.gestante.nome}</p>
          <Badge variant="outline" className={getBadgeColor(item.faixaIG)}>
            <Baby className="h-3 w-3 mr-1" />
            {formatarIG(item.igAtual)}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Última: {formatarData(item.ultimaConsulta)}
          </span>
          <span className={`flex items-center gap-1 ${corTexto} font-medium`}>
            <Clock className="h-3.5 w-3.5" />
            {item.diasSemConsulta === Infinity ? "Sem consultas" : `${item.diasSemConsulta} dias`}
          </span>
          {item.gestante.telefone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {item.gestante.telefone}
            </span>
          )}
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleAbrirModal(item)}
        className={corBotao}
      >
        <FileText className="h-4 w-4 mr-1" />
        Justificativa
      </Button>
    </div>
  );

  return (
    <>
      <Card className="border-orange-300 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Gestantes com Consulta Atrasada
            <Badge variant="destructive" className="ml-2">
              {gestantesAtrasadas.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-orange-700 mt-1">
            Limite dinâmico: até 34 sem (32 dias) | 34-36 sem (15 dias) | após 36 sem (8 dias)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gestantes após 36 semanas - URGENTE */}
            {gestantesPorFaixa['Após 36 semanas'].length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                  Após 36 semanas - URGENTE (limite: 8 dias)
                </h4>
                {gestantesPorFaixa['Após 36 semanas'].map((item: GestanteAlerta) => 
                  renderGestanteCard(
                    item, 
                    "border-red-200", 
                    "text-red-600",
                    "border-red-300 text-red-700 hover:bg-red-100"
                  )
                )}
              </div>
            )}

            {/* Gestantes 34-36 semanas - ATENÇÃO */}
            {gestantesPorFaixa['34-36 semanas'].length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                  34-36 semanas - ATENÇÃO (limite: 15 dias)
                </h4>
                {gestantesPorFaixa['34-36 semanas'].map((item: GestanteAlerta) => 
                  renderGestanteCard(
                    item, 
                    "border-orange-200", 
                    "text-orange-600",
                    "border-orange-300 text-orange-700 hover:bg-orange-100"
                  )
                )}
              </div>
            )}

            {/* Gestantes até 34 semanas */}
            {gestantesPorFaixa['Até 34 semanas'].length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                  Até 34 semanas (limite: 32 dias)
                </h4>
                {gestantesPorFaixa['Até 34 semanas'].map((item: GestanteAlerta) => 
                  renderGestanteCard(
                    item, 
                    "border-yellow-200", 
                    "text-yellow-700",
                    "border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  )
                )}
                
                
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Justificativa */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Justificativa</DialogTitle>
            <DialogDescription>
              {gestanteSelecionada && (
                <span>
                  Selecione o motivo para remover <strong>{gestanteSelecionada.gestante.nome}</strong> da lista de alertas.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Justificativa *</Label>
              <Select 
                value={motivoSelecionado} 
                onValueChange={(value) => setMotivoSelecionado(value as MotivoJustificativa)}
              >
                <SelectTrigger id="motivo">
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_JUSTIFICATIVA.map((motivo) => (
                    <SelectItem key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo de data prevista - aparece para justificativas temporárias */}
            {(motivoSelecionado === 'ja_agendada' || motivoSelecionado === 'espaco_maior_consultas') && (
              <div className="space-y-2">
                <Label htmlFor="dataPrevista">Data Prevista da Consulta *</Label>
                <input
                  type="date"
                  id="dataPrevista"
                  value={dataPrevistaConsulta}
                  onChange={(e) => setDataPrevistaConsulta(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  A gestante voltará para a lista de alertas após esta data se não houver consulta registrada.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações adicionais se necessário..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarJustificativa}
              disabled={!motivoSelecionado || criarJustificativaMutation.isPending}
            >
              {criarJustificativaMutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
