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
  Baby,
  FileText,
  Stethoscope,
  TestTube,
  MonitorDot,
  X,
  User,
  AlertTriangle
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
import ConsultaUnificadaDialog from "@/components/ConsultaUnificadaDialog";
import WizardPrimeiraConsulta from "@/components/WizardPrimeiraConsulta";

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
  const [showWizardPrimeiraConsulta, setShowWizardPrimeiraConsulta] = useState(false);
  const [gestanteParaConsulta, setGestanteParaConsulta] = useState<{
    id: number;
    nome: string;
    dum?: string;
    tipoDum?: string;
    dataUltrassom?: string;
    igUltrassomSemanas?: number;
    igUltrassomDias?: number;
    gesta?: number;
    para?: number;
    partosNormais?: number;
    cesareas?: number;
    abortos?: number;
  } | null>(null);
  

  
  const { data: gestantes, isLoading, refetch: refetchGestantes } = trpc.gestantes.list.useQuery(
    { searchTerm, sortBy },
    {
      // Refetch on window focus to ensure data is always up-to-date
      refetchOnWindowFocus: true,
      // Refetch when the component mounts (app opens)
      refetchOnMount: 'always',
    }
  );
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
        setGestanteParaConsulta({
          id: data.id,
          nome: data.nome,
          dum: data.dum,
          tipoDum: data.tipoDum,
          dataUltrassom: data.dataUltrassom,
          igUltrassomSemanas: data.igUltrassomSemanas,
          igUltrassomDias: data.igUltrassomDias,
          gesta: data.gesta,
          para: data.para,
          partosNormais: data.partosNormais,
          cesareas: data.cesareas,
          abortos: data.abortos,
        });
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

  // Estados para diálogo de exclusão/abortamento
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteGestanteId, setDeleteGestanteId] = useState<number | null>(null);
  const [deleteGestanteNome, setDeleteGestanteNome] = useState<string>("");
  const [deleteGestanteIG, setDeleteGestanteIG] = useState<{semanas?: number; dias?: number} | null>(null);
  const [isAbortamento, setIsAbortamento] = useState(false);
  const [abortamentoData, setAbortamentoData] = useState<string>("");
  const [abortamentoTipo, setAbortamentoTipo] = useState<string>("espontaneo");
  const [abortamentoIGSemanas, setAbortamentoIGSemanas] = useState<string>("");
  const [abortamentoIGDias, setAbortamentoIGDias] = useState<string>("");
  const [abortamentoObs, setAbortamentoObs] = useState<string>("");

  const registrarAbortamentoMutation = trpc.abortamentos.registrar.useMutation({
    onSuccess: (data) => {
      toast.success(`Abortamento registrado para ${data.nomeGestante}`);
      setShowDeleteDialog(false);
      resetDeleteDialog();
      utils.gestantes.list.invalidate();
      utils.gestantes.semConsultaRecente.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao registrar abortamento: " + error.message);
    },
  });

  const resetDeleteDialog = () => {
    setDeleteGestanteId(null);
    setDeleteGestanteNome("");
    setDeleteGestanteIG(null);
    setIsAbortamento(false);
    setAbortamentoData("");
    setAbortamentoTipo("espontaneo");
    setAbortamentoIGSemanas("");
    setAbortamentoIGDias("");
    setAbortamentoObs("");
  };

  const handleDelete = (id: number) => {
    const gestante = gestantes?.find(g => g.id === id);
    setDeleteGestanteId(id);
    setDeleteGestanteNome(gestante?.nome || "");
    setAbortamentoData(new Date().toISOString().split('T')[0]);
    // Pré-preencher IG se disponível (usar igDUM ou igUS)
    const ig = gestante?.calculado?.igDUM || gestante?.calculado?.igUS;
    if (ig) {
      setAbortamentoIGSemanas(String(ig.semanas));
      setAbortamentoIGDias(String(ig.dias || 0));
      setDeleteGestanteIG({ semanas: ig.semanas, dias: ig.dias });
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmarDelete = () => {
    if (!deleteGestanteId) return;
    if (isAbortamento) {
      if (!abortamentoData) {
        toast.error("Informe a data do abortamento");
        return;
      }
      registrarAbortamentoMutation.mutate({
        gestanteId: deleteGestanteId,
        dataAbortamento: abortamentoData,
        igSemanas: abortamentoIGSemanas ? parseInt(abortamentoIGSemanas) : undefined,
        igDias: abortamentoIGDias ? parseInt(abortamentoIGDias) : undefined,
        tipoAbortamento: abortamentoTipo as any,
        observacoes: abortamentoObs || undefined,
      });
    } else {
      deleteMutation.mutate({ id: deleteGestanteId });
      setShowDeleteDialog(false);
      resetDeleteDialog();
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <AutocompleteGestante
                gestantes={gestantes || []}
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={(gestante) => {
                  setGestanteAtiva({ id: gestante.id, nome: gestante.nome });
                  setSearchTerm(""); // Limpar campo de busca após seleção
                }}
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
          </CardContent>
        </Card>

        {/* Card da Gestante Selecionada */}
        {gestanteAtiva && (() => {
          const gestanteSelecionada = gestantes?.find(g => g.id === gestanteAtiva.id);
          if (!gestanteSelecionada) return null;
          
          // Calcular IG
          const igUS = gestanteSelecionada.calculado?.igUS;
          const igDUM = gestanteSelecionada.calculado?.igDUM;
          const ig = igUS || igDUM;
          const igTexto = ig ? `${ig.semanas}s ${ig.dias}d` : "-";
          
          // Formatar paridade
          const gesta = gestanteSelecionada.gesta || 0;
          const para = gestanteSelecionada.para || 0;
          const pn = gestanteSelecionada.partosNormais || 0;
          const pc = gestanteSelecionada.cesareas || 0;
          const abortos = gestanteSelecionada.abortos || 0;
          const paridade = `G${gesta}P${para}(PN${pn}PC${pc})A${abortos}`;
          
          return (
            <Card className="border-2 border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-full">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-primary">{gestanteSelecionada.nome}</h3>
                        <AltoRiscoBadge gestanteId={gestanteSelecionada.id} />
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="font-medium">IG: <span className="text-emerald-600 font-bold">{igTexto}</span></span>
                        <span>|</span>
                        <span className="font-medium">Paridade: <span className="text-pink-600 font-bold">{paridade}</span></span>
                        {gestanteSelecionada.calculado?.dppUS && (
                          <>
                            <span>|</span>
                            <span className="font-medium">DPP: <span className="text-blue-600 font-bold">{formatarDataSegura(gestanteSelecionada.calculado.dppUS)}</span></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(gestanteSelecionada.id);
                        setShowForm(true);
                      }}
                      className="gap-2"
                      title="Editar cadastro da gestante"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation("/cartao-prenatal")}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Cartão
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setGestanteParaConsulta({
                          id: gestanteSelecionada.id,
                          nome: gestanteSelecionada.nome,
                          dum: gestanteSelecionada.dum || undefined,
                          dataUltrassom: gestanteSelecionada.dataUltrassom || undefined,
                          igUltrassomSemanas: gestanteSelecionada.igUltrassomSemanas || undefined,
                          igUltrassomDias: gestanteSelecionada.igUltrassomDias || undefined,
                          gesta: gestanteSelecionada.gesta || undefined,
                          para: gestanteSelecionada.para || undefined,
                          partosNormais: gestanteSelecionada.partosNormais || undefined,
                          cesareas: gestanteSelecionada.cesareas || undefined,
                          abortos: gestanteSelecionada.abortos || undefined,
                        });
                        setShowConsultaDialog(true);
                      }}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Consulta
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation("/exames-laboratoriais")}
                      className="gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <TestTube className="h-4 w-4" />
                      Exames
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setLocation("/ultrassons")}
                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <MonitorDot className="h-4 w-4" />
                      Ultrassons
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGestanteAtiva(null)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

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
                            onClick={() => {
                              setGestanteAtiva({ id: g.id, nome: g.nome });
                            }}
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

      {/* Diálogo Unificado de Consulta */}
      <ConsultaUnificadaDialog
        open={showConsultaDialog}
        onOpenChange={setShowConsultaDialog}
        gestanteParaConsulta={gestanteParaConsulta}
        onClose={() => {
          setShowConsultaDialog(false);
          setGestanteParaConsulta(null);
        }}
        onConfirm={(isPrimeiraConsulta?: boolean, isUrgencia?: boolean) => {
          setShowConsultaDialog(false);
          if (gestanteParaConsulta) {
            if (isUrgencia) {
              window.location.href = `/cartao-prenatal?gestanteId=${gestanteParaConsulta.id}&novaConsulta=true&urgencia=true&skipInfoModal=true`;
            } else if (isPrimeiraConsulta) {
              setShowWizardPrimeiraConsulta(true);
            } else {
              window.location.href = `/cartao-prenatal?gestanteId=${gestanteParaConsulta.id}&novaConsulta=true&skipInfoModal=true`;
            }
          }
        }}
      />

      {/* Wizard de 1ª Consulta */}
      {gestanteParaConsulta && (
        <WizardPrimeiraConsulta
          open={showWizardPrimeiraConsulta}
          onOpenChange={(open) => {
            setShowWizardPrimeiraConsulta(open);
            if (!open) setGestanteParaConsulta(null);
          }}
          gestante={gestanteParaConsulta}
          onSuccess={() => {
            setShowWizardPrimeiraConsulta(false);
            setGestanteParaConsulta(null);
            refetchGestantes();
          }}
        />
      )}

      {/* Diálogo de Exclusão / Abortamento */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => { if (!open) { setShowDeleteDialog(false); resetDeleteDialog(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Remover Gestante
            </DialogTitle>
            <DialogDescription>
              {deleteGestanteNome && (
                <span>Escolha como deseja remover <strong>{deleteGestanteNome}</strong> do sistema.</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Opções: Excluir ou Abortamento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Motivo da remoção</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!isAbortamento ? "default" : "outline"}
                  onClick={() => setIsAbortamento(false)}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
                <Button
                  variant={isAbortamento ? "default" : "outline"}
                  onClick={() => setIsAbortamento(true)}
                  className={`w-full ${isAbortamento ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                  size="sm"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Abortamento
                </Button>
              </div>
            </div>

            {!isAbortamento && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                A gestante será removida permanentemente do sistema. Esta ação não pode ser desfeita.
              </p>
            )}

            {isAbortamento && (
              <div className="space-y-3 border rounded-md p-3 bg-amber-50 dark:bg-amber-950/20">
                <p className="text-sm text-muted-foreground">
                  O abortamento será registrado nas estatísticas e a gestante será removida da lista ativa.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="abortamentoData">Data do Abortamento *</Label>
                  <Input
                    id="abortamentoData"
                    type="date"
                    value={abortamentoData}
                    onChange={(e) => setAbortamentoData(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abortamentoTipo">Tipo</Label>
                  <Select value={abortamentoTipo} onValueChange={setAbortamentoTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="espontaneo">Espontâneo</SelectItem>
                      <SelectItem value="retido">Retido</SelectItem>
                      <SelectItem value="incompleto">Incompleto</SelectItem>
                      <SelectItem value="inevitavel">Inevitável</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Idade Gestacional</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Sem."
                      value={abortamentoIGSemanas}
                      onChange={(e) => setAbortamentoIGSemanas(e.target.value)}
                      className="w-20"
                      min={0}
                      max={42}
                    />
                    <span className="text-sm text-muted-foreground">sem</span>
                    <Input
                      type="number"
                      placeholder="Dias"
                      value={abortamentoIGDias}
                      onChange={(e) => setAbortamentoIGDias(e.target.value)}
                      className="w-20"
                      min={0}
                      max={6}
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="abortamentoObs">Observações</Label>
                  <Textarea
                    id="abortamentoObs"
                    value={abortamentoObs}
                    onChange={(e) => setAbortamentoObs(e.target.value)}
                    placeholder="Observações sobre o abortamento..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowDeleteDialog(false); resetDeleteDialog(); }}
              disabled={registrarAbortamentoMutation.isPending || deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant={isAbortamento ? "default" : "destructive"}
              onClick={handleConfirmarDelete}
              disabled={registrarAbortamentoMutation.isPending || deleteMutation.isPending}
              className={isAbortamento ? 'bg-amber-600 hover:bg-amber-700' : ''}
            >
              {(registrarAbortamentoMutation.isPending || deleteMutation.isPending)
                ? "Processando..."
                : isAbortamento
                  ? "Registrar Abortamento"
                  : "Excluir Permanentemente"}
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
