import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Calendar, Baby, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PrevisaoPartos() {
  const [, setLocation] = useLocation();
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [medicoFiltro, setMedicoFiltro] = useState("todos");
  const [tipoPartoFiltro, setTipoPartoFiltro] = useState("todos");

  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery();
  const { data: medicos = [] } = trpc.medicos.listar.useQuery();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatIG = (ig: { semanas: number; dias: number } | null) => {
    if (!ig) return "-";
    return `${ig.semanas}s ${ig.dias}d`;
  };

  // Calcula DPP pelo ultrassom
  const calcularDppUS = (gestante: any) => {
    if (!gestante.igUltrassomSemanas || gestante.igUltrassomSemanas === null || !gestante.dataUltrassom) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const igTotalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0);
    const diasRestantes = 280 - igTotalDias;
    const dpp = new Date(dataUS.getTime() + (diasRestantes + 1) * 24 * 60 * 60 * 1000); // +1 para contar o dia do US
    return dpp;
  };

  // Calcula DPP pela DUM
  const calcularDppDUM = (gestante: any) => {
    if (!gestante.dum) return null;
    const dum = new Date(gestante.dum);
    const dpp = new Date(dum.getTime() + 280 * 24 * 60 * 60 * 1000);
    return dpp;
  };

  // Determina a data a ser exibida (prioridade: US > DUM)
  const obterDataParto = (gestante: any) => {
    const dppUS = calcularDppUS(gestante);
    if (dppUS) {
      return { data: dppUS, tipo: "DPP US" };
    }
    const dppDUM = calcularDppDUM(gestante);
    if (dppDUM) {
      return { data: dppDUM, tipo: "DPP DUM" };
    }
    return null;
  };

  const gestantesFiltradas = useMemo(() => {
    if (!gestantes || !dataInicio || !dataFim) return [];

    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    return gestantes.filter((g) => {
      const dataParto = obterDataParto(g);
      if (!dataParto) return false;

      const dentroIntervalo = dataParto.data >= inicio && dataParto.data <= fim;
      const matchMedico = medicoFiltro === "todos" || g.medicoId?.toString() === medicoFiltro;
      const matchTipoParto = tipoPartoFiltro === "todos" || g.tipoPartoDesejado === tipoPartoFiltro;

      return dentroIntervalo && matchMedico && matchTipoParto;
    }).sort((a, b) => {
      const dataA = obterDataParto(a);
      const dataB = obterDataParto(b);
      if (!dataA || !dataB) return 0;
      return dataA.data.getTime() - dataB.data.getTime();
    });
  }, [gestantes, dataInicio, dataFim, medicoFiltro, tipoPartoFiltro]);

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Previsão de Partos</h2>
            <p className="text-muted-foreground">
              Visualize as gestantes com previsão de parto em um período específico
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Selecione o período e os filtros desejados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medico">Médico</Label>
                <Select value={medicoFiltro} onValueChange={setMedicoFiltro}>
                  <SelectTrigger id="medico">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os médicos</SelectItem>
                    {medicos.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoParto">Tipo de Parto</Label>
                <Select value={tipoPartoFiltro} onValueChange={setTipoPartoFiltro}>
                  <SelectTrigger id="tipoParto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="cesariana">Cesárea</SelectItem>
                    <SelectItem value="a_definir">A definir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {dataInicio && dataFim && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Gestantes com Previsão de Parto
                <Badge variant="secondary" className="ml-auto">
                  {gestantesFiltradas.length} {gestantesFiltradas.length === 1 ? "gestante" : "gestantes"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gestantesFiltradas.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma gestante encontrada no período selecionado
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>IG Atual (DUM)</TableHead>
                      <TableHead>IG Atual (US)</TableHead>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tipo de Parto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gestantesFiltradas.map((g) => {
                      const dataParto = obterDataParto(g);
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.nome}</TableCell>
                          <TableCell>{formatIG(g.calculado?.igDUM)}</TableCell>
                          <TableCell>{formatIG(g.calculado?.igUS)}</TableCell>
                          <TableCell>
                            {dataParto ? formatDate(dataParto.data) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {dataParto?.tipo || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {g.tipoPartoDesejado === "a_definir" ? "A definir" : g.tipoPartoDesejado}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {(!dataInicio || !dataFim) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Selecione um período para visualizar as previsões de parto
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
