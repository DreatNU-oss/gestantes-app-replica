import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Baby, Calendar, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import GestantesLayout from "@/components/GestantesLayout";

export default function EstatisticasPartos() {
  const [, setLocation] = useLocation();
  const { data: partos, isLoading } = trpc.partos.listar.useQuery();

  // Calcular estatísticas
  const totalPartos = partos?.length || 0;
  const partosNormais = partos?.filter((p: any) => p.tipoParto?.toLowerCase() === "normal").length || 0;
  const partosCesarea = partos?.filter((p: any) => p.tipoParto?.toLowerCase() === "cesárea" || p.tipoParto?.toLowerCase() === "cesarea").length || 0;

  // Dados para gráfico de partos por mês
  const partosPorMes = partos?.reduce((acc: { mes: string; total: number }[], parto: any) => {
    // Converter dataParto para Date object
    let data: Date;
    if (parto.dataParto instanceof Date) {
      data = parto.dataParto;
    } else if (typeof parto.dataParto === 'string') {
      const dataStr = parto.dataParto.split('T')[0];
      data = new Date(dataStr + 'T12:00:00');
    } else {
      return acc; // Pular se data inválida
    }
    const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    const existing = acc.find((item: { mes: string; total: number }) => item.mes === mesAno);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ mes: mesAno, total: 1 });
    }
    return acc;
  }, [] as { mes: string; total: number }[]) || [];

  // Ordenar por data
  partosPorMes.sort((a: { mes: string; total: number }, b: { mes: string; total: number }) => {
    const [mesA, anoA] = a.mes.split(' ');
    const [mesB, anoB] = b.mes.split(' ');
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const dataA = new Date(parseInt(anoA), meses.indexOf(mesA.toLowerCase()));
    const dataB = new Date(parseInt(anoB), meses.indexOf(mesB.toLowerCase()));
    return dataA.getTime() - dataB.getTime();
  });

  // Dados para gráfico de pizza (tipo de parto)
  const dadosTipoParto = [
    { name: 'Normal', value: partosNormais, color: '#10b981' },
    { name: 'Cesárea', value: partosCesarea, color: '#f59e0b' }
  ];

  // Dados para gráfico de partos por médico
  const partosPorMedico = partos?.reduce((acc: { medico: string; total: number }[], parto: any) => {
    const existing = acc.find((item: { medico: string; total: number }) => item.medico === parto.medicoNome);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ medico: parto.medicoNome || 'Não informado', total: 1 });
    }
    return acc;
  }, [] as { medico: string; total: number }[]) || [];

  // Ordenar por total (decrescente)
  partosPorMedico.sort((a: { medico: string; total: number }, b: { medico: string; total: number }) => b.total - a.total);

  // Dados para gráfico de partos por convênio
  const partosPorConvenio = partos?.reduce((acc: { convenio: string; total: number }[], parto: any) => {
    const nomeConvenio = parto.planoSaudeNome || 'Particular';
    const existing = acc.find((item: { convenio: string; total: number }) => item.convenio === nomeConvenio);
    if (existing) {
      existing.total += 1;
    } else {
      acc.push({ convenio: nomeConvenio, total: 1 });
    }
    return acc;
  }, [] as { convenio: string; total: number }[]) || [];

  // Ordenar por total (decrescente)
  partosPorConvenio.sort((a: { convenio: string; total: number }, b: { convenio: string; total: number }) => b.total - a.total);

  if (isLoading) {
    return (
      <GestantesLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/partos-realizados")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-foreground shrink-0">Estatísticas de Partos</h2>
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </div>
      </GestantesLayout>
    );
  }

  return (
    <GestantesLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/partos-realizados")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-foreground shrink-0">Estatísticas de Partos</h2>
            <p className="text-sm text-muted-foreground">Análise dos partos realizados</p>
          </div>
        </div>

        {/* Cards de Totais */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Partos</CardTitle>
              <Baby className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPartos}</div>
              <p className="text-xs text-muted-foreground">
                Partos registrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partos Normais</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{partosNormais}</div>
              <p className="text-xs text-muted-foreground">
                {totalPartos > 0 ? `${Math.round((partosNormais / totalPartos) * 100)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cesáreas</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{partosCesarea}</div>
              <p className="text-xs text-muted-foreground">
                {totalPartos > 0 ? `${Math.round((partosCesarea / totalPartos) * 100)}%` : '0%'} do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Partos por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Partos por Mês</CardTitle>
              <CardDescription>Distribuição temporal dos partos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {partosPorMes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={partosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#722F37" name="Partos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum parto registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Tipo de Parto */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
              <CardDescription>Proporção entre partos normais e cesáreas</CardDescription>
            </CardHeader>
            <CardContent>
              {totalPartos > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosTipoParto}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosTipoParto.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum parto registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Partos por Médico */}
          <Card>
            <CardHeader>
              <CardTitle>Partos por Médico</CardTitle>
              <CardDescription>Distribuição de partos por profissional responsável</CardDescription>
            </CardHeader>
            <CardContent>
              {partosPorMedico.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={partosPorMedico} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="medico" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#722F37" name="Partos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum parto registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Partos por Convênio */}
          <Card>
            <CardHeader>
              <CardTitle>Partos por Convênio</CardTitle>
              <CardDescription>Distribuição de partos por plano de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              {partosPorConvenio.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={partosPorConvenio} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="convenio" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#722F37" name="Partos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  Nenhum parto registrado ainda
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </GestantesLayout>
  );
}
