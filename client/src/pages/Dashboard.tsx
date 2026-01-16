import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import GestantesLayout from "@/components/GestantesLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Baby
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import FormularioGestante from "@/components/FormularioGestante";
import DetalhesGestante from "@/components/DetalhesGestante";
import { AlertasPartosProximos } from "@/components/AlertasPartosProximos";
import { AlertaConsultasAtrasadas } from "@/components/AlertaConsultasAtrasadas";
import { AutocompleteGestante } from "@/components/AutocompleteGestante";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import AltoRiscoBadge from "@/components/AltoRiscoBadge";

// Função para formatar data de forma segura, evitando problemas de timezone
const formatarDataSegura = (dateValue: Date | string | null | undefined): string => {
  if (!dateValue) return "-";
  
  // Se for string no formato YYYY-MM-DD, parsear manualmente
  if (typeof dateValue === 'string') {
    const [year, month, day] = dateValue.split('T')[0].split('-').map(Number);
    if (year && month && day) {
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
  }
  
  // Se for Date object, usar getUTC para evitar shift de timezone
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "-";
  
  const dia = String(date.getUTCDate()).padStart(2, '0');
  const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
  const ano = date.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
};

export default function Dashboard() {
  const { gestanteAtiva, setGestanteAtiva } = useGestanteAtiva();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'nome' | 'ig_asc' | 'ig_desc'>('ig_desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoParto, setFilterTipoParto] = useState<string>("todos");
  const [filterMedico, setFilterMedico] = useState<string>("todos");
  const [filterPlano, setFilterPlano] = useState<string>("todos");
  const [filterDppInicio, setFilterDppInicio] = useState<string>("");
  const [filterDppFim, setFilterDppFim] = useState<string>("");
  
  // Estados para modal de parto
  const [showPartoModal, setShowPartoModal] = useState(false);
  const [partoGestanteId, setPartoGestanteId] = useState<number | null>(null);
  const [partoData, setPartoData] = useState<string>("");
  const [partoTipo, setPartoTipo] = useState<"normal" | "cesarea">("normal");
  const [partoMedicoId, setPartoMedicoId] = useState<string>("");
  
  // Estados para diálogo de confirmação de consulta
  const [showConsultaDialog, setShowConsultaDialog] = useState(false);
  const [gestanteParaConsulta, setGestanteParaConsulta] = useState<{id: number, nome: string} | null>(null);
  
  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery({ searchTerm, sortBy });
  const { data: medicos = [] } = trpc.medicos.listar.useQuery();
  const { data: planos = [] } = trpc.planosSaude.listar.useQuery();
  const utils = trpc.useUtils();

  // Detectar parâmetro de edição na URL (vindo do Cartão de Pré-Natal)
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const editarId = params.get('editar');
    
    if (editarId) {
      const id = parseInt(editarId);
      if (!isNaN(id)) {
        setEditingId(id);
        setShowForm(true);
        // Limpar o parâmetro da URL
        setLocation('/dashboard', { replace: true });
      }
    }
  }, [searchString, setLocation]);

  const deleteMutation = trpc.gestantes.delete.useMutation({
    onSuccess: () => {
      toast.success("Gestante removida com sucesso!");
      utils.gestantes.list.invalidate();
      utils.gestantes.semConsultaRecente.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover gestante: " + error.message);
    },
  });

  const registrarPartoMutation = trpc.partos.registrar.useMutation({
    onSuccess: (data) => {
      toast.success("Parto registrado com sucesso! PDF gerado.");
      setShowPartoModal(false);
      // Limpar campos
      setPartoGestanteId(null);
      setPartoData("");
      setPartoTipo("normal");
      setPartoMedicoId("");
      // Atualizar lista de gestantes
      utils.gestantes.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar parto: " + error.message);
    },
  });

  const sortedGestantes = useMemo(() => {
    if (!gestantes) return [];
    
    // Ordenação já feita no backend, apenas filtrar aqui
    return gestantes.filter(g => {
      const matchTipoParto = filterTipoParto === "todos" || g.tipoPartoDesejado === filterTipoParto;
      const matchMedico = filterMedico === "todos" || g.medicoId?.toString() === filterMedico;
      const matchPlano = filterPlano === "todos" || g.planoSaudeId?.toString() === filterPlano;
      
      let matchDppPeriodo = true;
      if (filterDppInicio || filterDppFim) {
        const dpp = g.calculado?.dpp ? new Date(g.calculado.dpp) : null;
        if (dpp) {
          if (filterDppInicio) {
            const inicio = new Date(filterDppInicio);
            if (dpp < inicio) matchDppPeriodo = false;
          }
          if (filterDppFim) {
            const fim = new Date(filterDppFim);
            if (dpp > fim) matchDppPeriodo = false;
          }
        } else {
          matchDppPeriodo = false;
        }
      }
      
      return matchTipoParto && matchMedico && matchPlano && matchDppPeriodo;
    });
  }, [gestantes, filterTipoParto, filterMedico, filterPlano, filterDppInicio, filterDppFim]);

  const handleSuccess = (data?: any) => {
    // Se criou/editou uma gestante, selecionar automaticamente no menu lateral
    if (data && data.id && data.nome) {
      setGestanteAtiva({
        id: data.id,
        nome: data.nome
      });
      
      // Se foi criação (não edição), mostrar diálogo de confirmação de consulta
      if (!editingId) {
        setGestanteParaConsulta({ id: data.id, nome: data.nome });
        setShowConsultaDialog(true);
      }
    }
    
    setShowForm(false);
    setEditingId(null);
    setViewingId(null);
    utils.gestantes.list.invalidate();
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setShowForm(true);
    setViewingId(null);
  };

  const handleView = (id: number) => {
    setViewingId(id);
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta gestante?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleRegistrarParto = (gestanteId: number) => {
    setPartoGestanteId(gestanteId);
    setPartoData(new Date().toISOString().split('T')[0]); // Data de hoje como padrão
    setShowPartoModal(true);
  };

  const handleConfirmarParto = () => {
    if (!partoGestanteId || !partoData || !partoMedicoId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    registrarPartoMutation.mutate({
      gestanteId: partoGestanteId,
      dataParto: partoData,
      tipoParto: partoTipo,
      medicoId: parseInt(partoMedicoId),
    });
  };

  const getTrimestre = (semanas: number) => {
    if (semanas <= 13) return { nome: "1º Tri", cor: "bg-green-100 text-green-700 border border-green-300" };
    if (semanas <= 27) return { nome: "2º Tri", cor: "bg-blue-100 text-blue-700 border border-blue-300" };
    return { nome: "3º Tri", cor: "bg-pink-100 text-pink-700 border border-pink-300" };
  };

  const formatIGBadge = (ig: { semanas: number; dias: number; totalDias?: number } | null | undefined) => {
    if (!ig) return null;
    const trimestre = getTrimestre(ig.semanas);
    return {
      text: `${ig.semanas}s ${ig.dias}d`,
      trimestre: trimestre.nome,
      cor: trimestre.cor
    };
  };

  if (showForm) {
    return (
      <GestantesLayout>
        <FormularioGestante
          gestanteId={editingId}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      </GestantesLayout>
    );
  }

  if (viewingId) {
    return (
      <GestantesLayout>
        <DetalhesGestante
          gestanteId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={() => handleEdit(viewingId)}
        />
      </GestantesLayout>
    );
  }

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Gestantes</h2>
            <p className="text-muted-foreground">
              Gerencie todas as gestantes cadastradas
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Gestante
          </Button>
        </div>

        {/* Card de Filtros e Busca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AutocompleteGestante
                gestantes={gestantes || []}
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nome..."
              />
              
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'nome' | 'ig_asc' | 'ig_desc')}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="ig_asc">IG Crescente (menos avançadas)</SelectItem>
                  <SelectItem value="ig_desc">IG Decrescente (mais avançadas)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTipoParto} onValueChange={setFilterTipoParto}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de parto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Tipo de parto</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="cesariana">Cesárea</SelectItem>
                  <SelectItem value="a_definir">A definir</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMedico} onValueChange={setFilterMedico}>
                <SelectTrigger>
                  <SelectValue placeholder="Médico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Médico</SelectItem>
                  {medicos.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPlano} onValueChange={setFilterPlano}>
                <SelectTrigger>
                  <SelectValue placeholder="Plano de Saúde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Plano de saúde</SelectItem>
                  {planos.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Período de DPP:</span>
              <Input
                type="date"
                value={filterDppInicio}
                onChange={(e) => setFilterDppInicio(e.target.value)}
                className="w-auto"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="date"
                value={filterDppFim}
                onChange={(e) => setFilterDppFim(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Alertas de Partos Próximos */}
        {gestantes && gestantes.length > 0 && (
          <AlertasPartosProximos 
            gestantes={gestantes} 
            medicos={medicos} 
            onRegistrarParto={handleRegistrarParto}
          />
        )}

        {/* Alerta de Consultas Atrasadas */}
        <AlertaConsultasAtrasadas />

        {/* Tabela de Gestantes */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Carregando gestantes...</p>
              </div>
            ) : sortedGestantes.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma gestante encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Seleção</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>IG (DUM)</TableHead>
                    <TableHead>DPP (DUM)</TableHead>
                    <TableHead>IG (US)</TableHead>
                    <TableHead>DPP (US)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGestantes.map((g, idx) => {
                    const igDumBadge = formatIGBadge(g.calculado?.igDUM);
                    const igUsBadge = formatIGBadge(g.calculado?.igUS);
                    return (
                      <TableRow key={g.id} className={gestanteAtiva?.id === g.id ? "bg-primary/10" : ""}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <Button
                            variant={gestanteAtiva?.id === g.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGestanteAtiva({ id: g.id, nome: g.nome })}
                          >
                            {gestanteAtiva?.id === g.id ? "Selecionada" : "Selecionar"}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{g.nome}</TableCell>
                        <TableCell>
                          <AltoRiscoBadge gestanteId={g.id} />
                        </TableCell>
                        <TableCell>
                          {igDumBadge ? (
                            <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${igDumBadge.cor}`}>
                              {igDumBadge.text}
                              <br />
                              <span className="text-[10px]">{igDumBadge.trimestre}</span>
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {formatarDataSegura(g.calculado?.dpp)}
                        </TableCell>
                        <TableCell>
                          {igUsBadge ? (
                            <span className={`inline-block px-3 py-1.5 rounded text-xs font-medium ${igUsBadge.cor}`}>
                              {igUsBadge.text}
                              <br />
                              <span className="text-[10px]">{igUsBadge.trimestre}</span>
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {formatarDataSegura(g.calculado?.dppUS)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(g.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(g.id)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegistrarParto(g.id)}
                              title="Registrar Parto"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Baby className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(g.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Confirmação de Consulta */}
      <Dialog open={showConsultaDialog} onOpenChange={setShowConsultaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Gestante cadastrada com sucesso!</DialogTitle>
            <DialogDescription>
              Deseja registrar uma consulta para <strong>{gestanteParaConsulta?.nome}</strong> agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConsultaDialog(false);
                setGestanteParaConsulta(null);
              }}
            >
              Não, agora não
            </Button>
            <Button
              onClick={() => {
                setShowConsultaDialog(false);
                // Redirecionar para Cartão Pré-Natal com query params para abrir formulário
                if (gestanteParaConsulta) {
                  window.location.href = `/cartao-prenatal?gestanteId=${gestanteParaConsulta.id}&novaConsulta=true`;
                }
              }}
            >
              Sim, registrar consulta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Registro de Parto */}
      <Dialog open={showPartoModal} onOpenChange={setShowPartoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Parto Realizado</DialogTitle>
            <DialogDescription>
              Preencha os dados do parto. O PDF do cartão pré-natal será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dataParto">Data do Parto *</Label>
              <Input
                id="dataParto"
                type="date"
                value={partoData}
                onChange={(e) => setPartoData(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoParto">Tipo de Parto *</Label>
              <Select value={partoTipo} onValueChange={(value: "normal" | "cesarea") => setPartoTipo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="cesarea">Cesárea</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicoId">Médico Responsável *</Label>
              <Select value={partoMedicoId} onValueChange={setPartoMedicoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o médico" />
                </SelectTrigger>
                <SelectContent>
                  {medicos.map((medico) => (
                    <SelectItem key={medico.id} value={medico.id.toString()}>
                      {medico.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPartoModal(false)}
              disabled={registrarPartoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarParto}
              disabled={registrarPartoMutation.isPending}
            >
              {registrarPartoMutation.isPending ? "Gerando PDF..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GestantesLayout>
  );
}
