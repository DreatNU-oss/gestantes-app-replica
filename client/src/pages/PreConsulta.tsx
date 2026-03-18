import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Heart,
  Scale,
  Check,
  Clock,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";
import GestantesLayout from "@/components/GestantesLayout";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";

const TIPO_CONSULTA_LABELS: Record<string, string> = {
  "1a_consulta": "1ª Consulta",
  "consulta_rotina": "Consulta de Rotina",
  "consulta_urgencia": "Consulta de Urgência",
};

export default function PreConsulta() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva, setGestanteAtiva } = useGestanteAtiva();
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id ?? null);
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  // Form state
  const [peso, setPeso] = useState("");
  const [pressaoSistolica, setPressaoSistolica] = useState("");
  const [pressaoDiastolica, setPressaoDiastolica] = useState("");
  const [tipoConsulta, setTipoConsulta] = useState<string>("");

  // Sync com gestante ativa
  useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
    }
  }, [gestanteAtiva]);

  // Queries
  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  const { data: preConsultas, refetch: refetchPreConsultas } = trpc.preConsulta.listarPorGestante.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  // Mutations
  const criarMutation = trpc.preConsulta.criar.useMutation({
    onSuccess: () => {
      toast.success("Pré-consulta registrada com sucesso!", {
        description: "Os dados serão pré-preenchidos na consulta do médico.",
        duration: 4000,
      });
      limparFormulario();
      refetchPreConsultas();
    },
    onError: (error) => {
      toast.error("Erro ao registrar pré-consulta", {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const atualizarMutation = trpc.preConsulta.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Pré-consulta atualizada com sucesso!");
      limparFormulario();
      refetchPreConsultas();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar pré-consulta", {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const deletarMutation = trpc.preConsulta.deletar.useMutation({
    onSuccess: () => {
      toast.success("Pré-consulta removida com sucesso!");
      refetchPreConsultas();
    },
    onError: (error) => {
      toast.error("Erro ao remover pré-consulta", {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const limparFormulario = () => {
    setPeso("");
    setPressaoSistolica("");
    setPressaoDiastolica("");
    setTipoConsulta("");
    setEditandoId(null);
  };

  const handleSelecionarGestante = (g: any) => {
    setGestanteSelecionada(g.id);
    setGestanteAtiva({ id: g.id, nome: g.nome });
    limparFormulario();
  };

  const handleEditar = (preConsultaItem: any) => {
    setEditandoId(preConsultaItem.id);
    setPeso(preConsultaItem.peso);
    // Parse pressão arterial (formato "120/80" ou "120x80")
    const paMatch = preConsultaItem.pressaoArterial?.match(/^(\d{2,3})\s*[\/xX]\s*(\d{2,3})$/);
    if (paMatch) {
      setPressaoSistolica(paMatch[1]);
      setPressaoDiastolica(paMatch[2]);
    } else {
      setPressaoSistolica("");
      setPressaoDiastolica("");
    }
    setTipoConsulta(preConsultaItem.tipoConsulta);
    setMostrarHistorico(false);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!tipoConsulta) {
      toast.error("Tipo de consulta é obrigatório", {
        description: "Selecione se é 1ª Consulta, Rotina ou Urgência.",
      });
      return;
    }
    if (!peso.trim()) {
      toast.error("Peso é obrigatório", {
        description: "Preencha o peso da gestante em kg.",
      });
      return;
    }
    if (!pressaoSistolica.trim() || !pressaoDiastolica.trim()) {
      toast.error("Pressão arterial é obrigatória", {
        description: "Preencha a pressão sistólica e diastólica.",
      });
      return;
    }
    if (!gestanteSelecionada) {
      toast.error("Selecione uma gestante");
      return;
    }

    // Validar formato do peso (número decimal)
    const pesoNum = parseFloat(peso.replace(",", "."));
    if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 300) {
      toast.error("Peso inválido", {
        description: "Insira um peso válido em kg (ex: 72.5)",
      });
      return;
    }

    // Validar pressão arterial
    const sistolica = parseInt(pressaoSistolica);
    const diastolica = parseInt(pressaoDiastolica);
    if (isNaN(sistolica) || sistolica < 50 || sistolica > 300) {
      toast.error("Pressão sistólica inválida", {
        description: "Insira um valor entre 50 e 300 mmHg",
      });
      return;
    }
    if (isNaN(diastolica) || diastolica < 30 || diastolica > 200) {
      toast.error("Pressão diastólica inválida", {
        description: "Insira um valor entre 30 e 200 mmHg",
      });
      return;
    }

    const pressaoArterial = `${sistolica}/${diastolica}`;

    if (editandoId) {
      atualizarMutation.mutate({
        id: editandoId,
        peso: peso.trim().replace(",", "."),
        pressaoArterial,
        tipoConsulta: tipoConsulta as any,
      });
    } else {
      criarMutation.mutate({
        gestanteId: gestanteSelecionada,
        peso: peso.trim().replace(",", "."),
        pressaoArterial,
        tipoConsulta: tipoConsulta as any,
      });
    }
  };

  // Filtrar gestantes
  const gestantesFiltradas = gestantes?.filter((g: any) =>
    g.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const gestanteInfo = gestantes?.find((g: any) => g.id === gestanteSelecionada);

  // Contar pendentes
  const pendentes = preConsultas?.filter((pc: any) => pc.utilizado === 0) || [];
  const utilizados = preConsultas?.filter((pc: any) => pc.utilizado === 1) || [];

  if (loadingGestantes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Pré-Consulta</h1>
            <p className="text-muted-foreground">
              Registre peso e pressão arterial da gestante antes da consulta médica
            </p>
          </div>
        </div>

        {/* Seleção de gestante */}
        {!gestanteSelecionada && (
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Gestante</CardTitle>
              <CardDescription>Busque e selecione a gestante para registrar a pré-consulta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {gestantesFiltradas.map((g: any) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelecionarGestante(g)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{g.nome}</p>
                      {g.telefone && (
                        <p className="text-sm text-muted-foreground">{g.telefone}</p>
                      )}
                    </div>
                    <Heart className="h-4 w-4 text-pink-400" />
                  </button>
                ))}
                {gestantesFiltradas.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma gestante encontrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gestante selecionada */}
        {gestanteSelecionada && gestanteInfo && (
          <>
            {/* Header com info da gestante */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">{gestanteInfo.nome}</h2>
                      {gestanteInfo.telefone && (
                        <p className="text-sm text-muted-foreground">{gestanteInfo.telefone}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGestanteSelecionada(null);
                      setGestanteAtiva(null);
                      limparFormulario();
                    }}
                  >
                    Trocar Gestante
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Formulário SEMPRE visível */}
            <Card className="border-2 border-pink-200 bg-pink-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-pink-600" />
                  {editandoId ? "Editar Pré-Consulta" : "Registrar Pré-Consulta"}
                </CardTitle>
                <CardDescription className="text-base">
                  Preencha <strong>todos os campos</strong> abaixo. Eles são obrigatórios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Tipo de Consulta */}
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Tipo de Consulta <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={tipoConsulta}
                      onValueChange={setTipoConsulta}
                    >
                      <SelectTrigger className="h-12 text-base bg-white">
                        <SelectValue placeholder="Selecione o tipo de consulta..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1a_consulta">1ª Consulta</SelectItem>
                        <SelectItem value="consulta_rotina">Consulta de Rotina</SelectItem>
                        <SelectItem value="consulta_urgencia">Consulta de Urgência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Peso e PA lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Peso */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Scale className="h-4 w-4 text-blue-600" />
                        Peso Hoje (kg) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 72.5"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        className="h-14 text-2xl font-bold text-center bg-white"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Peso em quilogramas
                      </p>
                    </div>

                    {/* Pressão Arterial */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-600" />
                        Pressão Arterial (mmHg) <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="120"
                          value={pressaoSistolica}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 3) setPressaoSistolica(val);
                          }}
                          className="h-14 text-2xl font-bold text-center bg-white"
                          maxLength={3}
                        />
                        <span className="text-3xl font-bold text-muted-foreground">/</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="80"
                          value={pressaoDiastolica}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 3) setPressaoDiastolica(val);
                          }}
                          className="h-14 text-2xl font-bold text-center bg-white"
                          maxLength={3}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Sistólica / Diastólica
                      </p>
                    </div>
                  </div>

                  {/* Alerta de PA alta */}
                  {pressaoSistolica && pressaoDiastolica && (
                    parseInt(pressaoSistolica) >= 140 || parseInt(pressaoDiastolica) >= 90
                  ) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                      <Activity className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">
                        Atenção: Pressão arterial elevada ({pressaoSistolica}/{pressaoDiastolica} mmHg). Informar o médico.
                      </span>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 h-12 text-base"
                      disabled={criarMutation.isPending || atualizarMutation.isPending}
                    >
                      {(criarMutation.isPending || atualizarMutation.isPending) ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-5 w-5" />
                      )}
                      {editandoId ? "Atualizar Pré-Consulta" : "Salvar Pré-Consulta"}
                    </Button>
                    {editandoId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={limparFormulario}
                      >
                        Cancelar Edição
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Pré-consultas pendentes */}
            {pendentes.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Pré-Consultas Pendentes
                    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 ml-2">
                      {pendentes.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Aguardando utilização pelo médico na consulta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>PA</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendentes.map((pc: any) => (
                        <TableRow key={pc.id}>
                          <TableCell>
                            {new Date(pc.createdAt).toLocaleDateString("pt-BR")}{" "}
                            <span className="text-muted-foreground text-xs">
                              {new Date(pc.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pc.tipoConsulta === "consulta_urgencia" ? "destructive" : "secondary"}>
                              {TIPO_CONSULTA_LABELS[pc.tipoConsulta] || pc.tipoConsulta}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-lg">{pc.peso} kg</TableCell>
                          <TableCell className="font-bold text-lg">{pc.pressaoArterial}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {pc.registradoPorNome || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditar(pc)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Remover"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover pré-consulta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Os dados de peso e pressão arterial serão removidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => deletarMutation.mutate({ id: pc.id })}
                                    >
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Histórico de pré-consultas utilizadas */}
            {utilizados.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Check className="h-5 w-5 text-green-600" />
                      Histórico
                      <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 ml-2">
                        {utilizados.length} utilizado{utilizados.length > 1 ? "s" : ""}
                      </Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarHistorico(!mostrarHistorico)}
                    >
                      {mostrarHistorico ? "Ocultar" : "Ver Histórico"}
                    </Button>
                  </div>
                </CardHeader>
                {mostrarHistorico && (
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Peso</TableHead>
                          <TableHead>PA</TableHead>
                          <TableHead>Registrado por</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {utilizados.map((pc: any) => (
                          <TableRow key={pc.id} className="opacity-60">
                            <TableCell>
                              {new Date(pc.createdAt).toLocaleDateString("pt-BR")}{" "}
                              <span className="text-muted-foreground text-xs">
                                {new Date(pc.createdAt).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {TIPO_CONSULTA_LABELS[pc.tipoConsulta] || pc.tipoConsulta}
                              </Badge>
                            </TableCell>
                            <TableCell>{pc.peso} kg</TableCell>
                            <TableCell>{pc.pressaoArterial}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {pc.registradoPorNome || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                <Check className="h-3 w-3 mr-1" />
                                Utilizado
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Mensagem quando não há registros */}
            {(!preConsultas || preConsultas.length === 0) && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Nenhuma pré-consulta registrada ainda para esta gestante.
                      <br />
                      Preencha o formulário acima para registrar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </GestantesLayout>
  );
}
