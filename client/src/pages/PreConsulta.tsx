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
  const [modo, setModo] = useState<"lista" | "formulario">("lista");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Form state
  const [peso, setPeso] = useState("");
  const [pressaoArterial, setPressaoArterial] = useState("");
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
      setModo("lista");
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
      setModo("lista");
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
    setPressaoArterial("");
    setTipoConsulta("");
    setEditandoId(null);
  };

  const handleSelecionarGestante = (g: any) => {
    setGestanteSelecionada(g.id);
    setGestanteAtiva({ id: g.id, nome: g.nome });
    setModo("lista");
    limparFormulario();
  };

  const handleEditar = (preConsultaItem: any) => {
    setEditandoId(preConsultaItem.id);
    setPeso(preConsultaItem.peso);
    setPressaoArterial(preConsultaItem.pressaoArterial);
    setTipoConsulta(preConsultaItem.tipoConsulta);
    setModo("formulario");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!peso.trim()) {
      toast.error("Peso é obrigatório");
      return;
    }
    if (!pressaoArterial.trim()) {
      toast.error("Pressão arterial é obrigatória");
      return;
    }
    if (!tipoConsulta) {
      toast.error("Tipo de consulta é obrigatório");
      return;
    }
    if (!gestanteSelecionada) {
      toast.error("Selecione uma gestante");
      return;
    }

    // Validar formato do peso (número decimal)
    const pesoNum = parseFloat(peso);
    if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 300) {
      toast.error("Peso inválido", {
        description: "Insira um peso válido em kg (ex: 72.5)",
      });
      return;
    }

    // Validar formato da pressão arterial (ex: 120/80 ou 120x80)
    const paMatch = pressaoArterial.match(/^(\d{2,3})\s*[\/xX]\s*(\d{2,3})$/);
    if (!paMatch) {
      toast.error("Pressão arterial inválida", {
        description: "Use o formato 120/80 ou 120x80",
      });
      return;
    }

    if (editandoId) {
      atualizarMutation.mutate({
        id: editandoId,
        peso: peso.trim(),
        pressaoArterial: pressaoArterial.trim(),
        tipoConsulta: tipoConsulta as any,
      });
    } else {
      criarMutation.mutate({
        gestanteId: gestanteSelecionada,
        peso: peso.trim(),
        pressaoArterial: pressaoArterial.trim(),
        tipoConsulta: tipoConsulta as any,
      });
    }
  };

  // Filtrar gestantes
  const gestantesFiltradas = gestantes?.filter((g: any) =>
    g.nome.toLowerCase().includes(busca.toLowerCase())
  ) || [];

  const gestanteInfo = gestantes?.find((g: any) => g.id === gestanteSelecionada);

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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGestanteSelecionada(null);
                        setGestanteAtiva(null);
                        limparFormulario();
                        setModo("lista");
                      }}
                    >
                      Trocar Gestante
                    </Button>
                    {modo === "lista" && (
                      <Button
                        onClick={() => {
                          limparFormulario();
                          setModo("formulario");
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Pré-Consulta
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário */}
            {modo === "formulario" && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editandoId ? "Editar Pré-Consulta" : "Nova Pré-Consulta"}
                  </CardTitle>
                  <CardDescription>
                    Todos os campos são obrigatórios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tipo de Consulta */}
                      <div>
                        <Label>
                          Tipo de Consulta <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={tipoConsulta}
                          onValueChange={setTipoConsulta}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1a_consulta">1ª Consulta</SelectItem>
                            <SelectItem value="consulta_rotina">Consulta de Rotina</SelectItem>
                            <SelectItem value="consulta_urgencia">Consulta de Urgência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Peso */}
                      <div>
                        <Label>
                          Peso (kg) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 72.5"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Pressão Arterial */}
                      <div>
                        <Label>
                          Pressão Arterial <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Ex: 120/80"
                            value={pressaoArterial}
                            onChange={(e) => setPressaoArterial(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="submit"
                        disabled={criarMutation.isPending || atualizarMutation.isPending}
                      >
                        {(criarMutation.isPending || atualizarMutation.isPending) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        {editandoId ? "Atualizar" : "Registrar"} Pré-Consulta
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          limparFormulario();
                          setModo("lista");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de pré-consultas */}
            <Card>
              <CardHeader>
                <CardTitle>Pré-Consultas Registradas</CardTitle>
                <CardDescription>
                  Registros de pré-consulta para {gestanteInfo.nome}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!preConsultas || preConsultas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma pré-consulta registrada</p>
                    <p className="text-sm mt-1">
                      Clique em "Nova Pré-Consulta" para registrar peso e pressão arterial
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>PA</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preConsultas.map((pc: any) => (
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
                          <TableCell className="font-medium">{pc.peso} kg</TableCell>
                          <TableCell className="font-medium">{pc.pressaoArterial}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {pc.registradoPorNome || "-"}
                          </TableCell>
                          <TableCell>
                            {pc.utilizado === 1 ? (
                              <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                                <Check className="h-3 w-3 mr-1" />
                                Utilizado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {pc.utilizado === 0 && (
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
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </GestantesLayout>
  );
}
