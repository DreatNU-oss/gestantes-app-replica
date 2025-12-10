import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Edit2, Download, Copy, Baby, Activity, Syringe, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { GraficoPeso } from "@/components/GraficoPeso";
import { toast } from "sonner";

export default function CartaoPrenatal() {
  const [, setLocation] = useLocation();
  
  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState<number | null>(null);


  const [formData, setFormData] = useState({
    dataConsulta: getDataHoje(),
    peso: "",
    pressaoArterial: "",
    alturaUterina: "",
    bcf: "",
    mf: "",
    observacoes: "",
  });

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: consultas, refetch: refetchConsultas } = trpc.consultasPrenatal.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  const createMutation = trpc.consultasPrenatal.create.useMutation({
    onSuccess: () => {
      toast.success("Consulta registrada com sucesso!");
      refetchConsultas();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar consulta: ${error.message}`);
    },
  });

  const updateMutation = trpc.consultasPrenatal.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      refetchConsultas();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar consulta: ${error.message}`);
    },
  });

  const deleteMutation = trpc.consultasPrenatal.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta excluída com sucesso!");
      refetchConsultas();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir consulta: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      dataConsulta: getDataHoje(),
      peso: "",
      pressaoArterial: "",
      alturaUterina: "",
      bcf: "",
      mf: "",
      observacoes: "",
    });
    setMostrarFormulario(false);
    setConsultaEditando(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gestanteSelecionada) {
      toast.error("Selecione uma gestante");
      return;
    }

    const data = {
      gestanteId: gestanteSelecionada,
      dataConsulta: formData.dataConsulta,
      peso: formData.peso ? parseInt(formData.peso) * 1000 : undefined, // converter kg para gramas
      pressaoArterial: formData.pressaoArterial || undefined,
      alturaUterina: formData.alturaUterina === "nao_palpavel" ? -1 : (formData.alturaUterina ? parseInt(formData.alturaUterina) * 10 : undefined), // -1 = não palpável, converter cm para mm
      bcf: formData.bcf ? parseInt(formData.bcf) : undefined,
      mf: formData.mf ? parseInt(formData.mf) : undefined,
      observacoes: formData.observacoes || undefined,
    };

    if (consultaEditando) {
      updateMutation.mutate({ id: consultaEditando, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (consulta: any) => {
    setConsultaEditando(consulta.id);
    setFormData({
      dataConsulta: new Date(consulta.dataConsulta).toISOString().split('T')[0],
      peso: consulta.peso ? String(consulta.peso / 1000) : "",
      pressaoArterial: consulta.pressaoArterial || "",
      alturaUterina: consulta.alturaUterina === -1 ? "nao_palpavel" : (consulta.alturaUterina ? String(consulta.alturaUterina / 10) : ""),
      bcf: consulta.bcf ? String(consulta.bcf) : "",
      mf: consulta.mf ? String(consulta.mf) : "",
      observacoes: consulta.observacoes || "",
    });
    setMostrarFormulario(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      deleteMutation.mutate({ id });
    }
  };

  const calcularIG = (dataConsulta: string) => {
    if (!gestante?.dum) return null;
    
    const dum = new Date(gestante.dum);
    const consulta = new Date(dataConsulta);
    const diffMs = consulta.getTime() - dum.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    
    return { semanas, dias };
  };

  const calcularIGPorUS = (dataConsulta: string) => {
    if (!gestante?.dataUltrassom || !gestante?.igUltrassomSemanas) return null;
    
    const ultrassom = new Date(gestante.dataUltrassom);
    const consulta = new Date(dataConsulta);
    const diffMs = consulta.getTime() - ultrassom.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const totalDiasUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diasDesdeUS;
    const semanas = Math.floor(totalDiasUS / 7);
    const dias = totalDiasUS % 7;
    
    return { semanas, dias };
  };

  const formatarData = (data: Date | string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  // Calcula data para uma semana específica pelo Ultrassom
  const calcularDataPorUS = (semanas: number, dias: number = 0) => {
    if (!gestante?.dataUltrassom || gestante?.igUltrassomSemanas === null || gestante?.igUltrassomDias === null) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
    const diasDesdeUS = semanas * 7 + dias - igUltrassomDias;
    const dataAlvo = new Date(dataUS);
    dataAlvo.setDate(dataAlvo.getDate() + diasDesdeUS);
    return dataAlvo;
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Copiado para a área de transferência!");
  };

  const marcos = [
    {
      titulo: "Concepção",
      icon: Baby,
      semanas: 2,
      dias: 0,
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      titulo: "Morfológico 1º Tri",
      icon: Activity,
      semanas: [11, 13],
      dias: [5, 3],
      color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      isRange: true,
    },
    {
      titulo: "13 Semanas",
      icon: CheckCircle2,
      semanas: 13,
      dias: 0,
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    {
      titulo: "Morfológico 2º Tri",
      icon: Activity,
      semanas: [20, 24],
      dias: [0, 6],
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
      isRange: true,
    },
    {
      titulo: "Vacina dTpa",
      icon: Syringe,
      semanas: 27,
      dias: 0,
      color: "bg-orange-100 text-orange-700 border-orange-300",
    },
    {
      titulo: "Vacina Bronquiolite",
      icon: Syringe,
      semanas: [32, 36],
      dias: [0, 0],
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      isRange: true,
    },
    {
      titulo: "Termo Precoce",
      icon: Calendar,
      semanas: 37,
      dias: 0,
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
    },
    {
      titulo: "Termo Completo",
      icon: Calendar,
      semanas: 39,
      dias: 0,
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      titulo: "DPP (40 semanas)",
      icon: Calendar,
      semanas: 40,
      dias: 0,
      color: "bg-rose-100 text-rose-700 border-rose-300",
    },
  ];

  return (
    <GestantesLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cartão de Pré-natal</h1>
            <p className="text-muted-foreground">Registre e acompanhe as consultas pré-natais</p>
          </div>
        </div>

        {/* Seleção de Gestante */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Gestante</CardTitle>
            <CardDescription>Escolha a gestante para visualizar ou registrar consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Selecionar Gestante</Label>
              <AutocompleteSelect
                options={gestantes?.slice().sort((a: any, b: any) => a.nome.localeCompare(b.nome)) || []}
                value={gestanteSelecionada?.toString() || ""}
                onChange={(value) => {
                  setGestanteSelecionada(parseInt(value));
                  setMostrarFormulario(false);
                  resetForm();
                }}
                placeholder="Digite o nome da gestante..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações da Gestante */}
        {gestante && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados da Gestante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Nome Completo</Label>
                    <p className="font-semibold text-lg">{gestante.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Gesta</Label>
                    <p className="font-medium">{gestante.gesta || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Partos Normais</Label>
                    <p className="font-medium">{gestante.partosNormais || "-"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">DPP pela DUM</Label>
                    <p className="font-semibold text-lg">{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Para</Label>
                    <p className="font-medium">{gestante.para || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Cesáreas</Label>
                    <p className="font-medium">{gestante.cesareas || "-"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">DPP pelo Ultrassom</Label>
                    <p className="font-semibold text-lg">{gestante.calculado?.dppUS ? formatarData(gestante.calculado.dppUS) : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Abortos</Label>
                    <p className="font-medium">{gestante.abortos || "-"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Nova Consulta */}
        {gestanteSelecionada && !mostrarFormulario && (
          <Button onClick={() => setMostrarFormulario(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        )}

        {/* Formulário de Consulta */}
        {mostrarFormulario && (
          <Card>
            <CardHeader>
              <CardTitle>{consultaEditando ? "Editar Consulta" : "Nova Consulta"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Consulta</Label>
                    <Input
                      type="date"
                      value={formData.dataConsulta}
                      onChange={(e) => setFormData({ ...formData, dataConsulta: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Idade Gestacional</Label>
                    <div className="bg-muted p-3 rounded-md space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">DUM:</span>{" "}
                        {(() => {
                          const ig = calcularIG(formData.dataConsulta);
                          return ig ? `${ig.semanas} semanas e ${ig.dias} dias` : "-";
                        })()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Ultrassom:</span>{" "}
                        {(() => {
                          const igUS = calcularIGPorUS(formData.dataConsulta);
                          return igUS ? `${igUS.semanas} semanas e ${igUS.dias} dias` : "-";
                        })()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.peso}
                      onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                      placeholder="Ex: 65.5"
                    />
                  </div>
                  <div>
                    <Label>Pressão Arterial</Label>
                    <Input
                      type="text"
                      value={formData.pressaoArterial}
                      onChange={(e) => setFormData({ ...formData, pressaoArterial: e.target.value })}
                      placeholder="Ex: 120/80"
                    />
                  </div>
                  <div>
                    <Label>Altura Uterina (cm)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.alturaUterina}
                      onChange={(e) => setFormData({ ...formData, alturaUterina: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="nao_palpavel">Úter--snip--o não palpável</option>
                      {Array.from({ length: 31 }, (_, i) => i + 10).map(cm => (
                        <option key={cm} value={String(cm)}>{cm} cm</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>BCF</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.bcf}
                      onChange={(e) => setFormData({ ...formData, bcf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </div>
                  <div>
                    <Label>MF (Movimento Fetal)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.mf}
                      onChange={(e) => setFormData({ ...formData, mf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações da consulta..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {consultaEditando ? "Atualizar" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Marcos Importantes da Gestação */}
        {gestante && gestante.dataUltrassom && (
          <Card>
            <CardHeader>
              <CardTitle>Marcos Importantes da Gestação</CardTitle>
              <CardDescription>Calculados pela data do Ultrassom</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {marcos.map((marco, idx) => {
                  const Icon = marco.icon;
                  let dataInicio = null;
                  let dataFim = null;
                  let textoParaCopiar = "";

                  if (marco.isRange && Array.isArray(marco.semanas) && Array.isArray(marco.dias)) {
                    dataInicio = calcularDataPorUS(marco.semanas[0], marco.dias[0]);
                    dataFim = calcularDataPorUS(marco.semanas[1], marco.dias[1]);
                    // Formato: "DD/MM a DD/MM/AAAA"
                    if (dataInicio && dataFim) {
                      const diaInicio = String(dataInicio.getDate()).padStart(2, '0');
                      const mesInicio = String(dataInicio.getMonth() + 1).padStart(2, '0');
                      const diaFim = String(dataFim.getDate()).padStart(2, '0');
                      const mesFim = String(dataFim.getMonth() + 1).padStart(2, '0');
                      const anoFim = dataFim.getFullYear();
                      textoParaCopiar = `${diaInicio}/${mesInicio} a ${diaFim}/${mesFim}/${anoFim}`;
                    } else {
                      textoParaCopiar = '-';
                    }
                  } else if (typeof marco.semanas === 'number' && typeof marco.dias === 'number') {
                    dataInicio = calcularDataPorUS(marco.semanas, marco.dias);
                    textoParaCopiar = dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-';
                  }

                  return (
                    <Card key={idx} className={`border-2 ${marco.color} relative`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-semibold text-sm">{marco.titulo}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copiarTexto(textoParaCopiar)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {marco.isRange ? (
                          <div className="text-sm space-y-1">
                            <div>{dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'} a</div>
                            <div>{dataFim ? dataFim.toLocaleDateString('pt-BR') : '-'}</div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium">
                            {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Consultas */}
        {gestanteSelecionada && consultas && consultas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>IG</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>AU</TableHead>
                    <TableHead>BCF</TableHead>
                    <TableHead>MF</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultas.map((consulta: any) => {
                    const igDUM = calcularIG(consulta.dataConsulta);
                    const igUS = gestante?.dataUltrassom ? calcularIGPorUS(consulta.dataConsulta) : null;
                    return (
                      <TableRow key={consulta.id}>
                        <TableCell>{formatarData(consulta.dataConsulta)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>I.G. DUM: {igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : "-"}</div>
                            {igUS && <div>I.G. US: {igUS.semanas}s {igUS.dias}d</div>}
                          </div>
                        </TableCell>
                        <TableCell>{consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell>{consulta.pressaoArterial || "-"}</TableCell>
                        <TableCell>
                          {consulta.alturaUterina === -1 ? (
                            <span className="text-muted-foreground italic">Úter--snip--o não palpável</span>
                          ) : consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)} cm` : "-"}
                        </TableCell>
                        <TableCell>
                          {consulta.bcf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sim</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {consulta.mf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sim</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{consulta.observacoes || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(consulta)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(consulta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Evolução de Peso */}
        {gestanteSelecionada && gestante && gestante.altura && gestante.pesoInicial && consultas && consultas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Peso Gestacional</CardTitle>
              <CardDescription>Acompanhamento do ganho de peso baseado no IMC pré-gestacional</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoPeso
                consultas={consultas.map((c: any) => {
                  const igDUM = calcularIG(c.dataConsulta);
                  return {
                    data: c.dataConsulta,
                    peso: c.peso / 1000, // converter gramas para kg
                    igSemanas: igDUM?.semanas || 0,
                  };
                })}
                altura={gestante.altura}
                pesoInicial={gestante.pesoInicial / 1000} // converter gramas para kg
              />
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
