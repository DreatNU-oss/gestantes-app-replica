import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, FileText, Plus, Trash2, Edit2, Download } from "lucide-react";
import { useLocation } from "wouter";
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
      alturaUterina: formData.alturaUterina ? parseInt(formData.alturaUterina) * 10 : undefined, // converter cm para mm
      bcf: formData.bcf ? parseInt(formData.bcf) : undefined,
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
      alturaUterina: consulta.alturaUterina ? String(consulta.alturaUterina / 10) : "",
      bcf: consulta.bcf ? String(consulta.bcf) : "",
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

  const formatarData = (data: Date | string) => {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

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
            <Select
              value={gestanteSelecionada?.toString() || ""}
              onValueChange={(value) => {
                setGestanteSelecionada(parseInt(value));
                setMostrarFormulario(false);
                resetForm();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma gestante" />
              </SelectTrigger>
              <SelectContent>
                {gestantes?.map((g: any) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Informações da Gestante */}
        {gestante && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Gestante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{gestante.nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Idade</Label>
                  <p className="font-medium">{gestante.calculado?.idade || "-"} anos</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">DUM</Label>
                  <p className="font-medium">{gestante.dum ? formatarData(gestante.dum) : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">DPP</Label>
                  <p className="font-medium">{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IG (DUM)</Label>
                  <p className="font-medium">
                    {gestante.calculado?.igDUM 
                      ? `${gestante.calculado.igDUM.semanas}s${gestante.calculado.igDUM.dias}d`
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IG (US)</Label>
                  <p className="font-medium">
                    {gestante.calculado?.igUS 
                      ? `${gestante.calculado.igUS.semanas}s${gestante.calculado.igUS.dias}d`
                      : "-"}
                  </p>
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
                    <Input
                      type="number"
                      value={formData.alturaUterina}
                      onChange={(e) => setFormData({ ...formData, alturaUterina: e.target.value })}
                      placeholder="Ex: 25"
                    />
                  </div>
                  <div>
                    <Label>BCF (bpm)</Label>
                    <Input
                      type="number"
                      value={formData.bcf}
                      onChange={(e) => setFormData({ ...formData, bcf: e.target.value })}
                      placeholder="Ex: 140"
                    />
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
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultas.map((consulta: any) => {
                    const ig = calcularIG(consulta.dataConsulta);
                    return (
                      <TableRow key={consulta.id}>
                        <TableCell>{formatarData(consulta.dataConsulta)}</TableCell>
                        <TableCell>{ig ? `${ig.semanas}s${ig.dias}d` : "-"}</TableCell>
                        <TableCell>{consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell>{consulta.pressaoArterial || "-"}</TableCell>
                        <TableCell>{consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)} cm` : "-"}</TableCell>
                        <TableCell>{consulta.bcf ? `${consulta.bcf} bpm` : "-"}</TableCell>
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
      </div>
    </GestantesLayout>
  );
}
