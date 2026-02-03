import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export function GraficoTiposPartosDesejados() {
  const { data: estatisticas, isLoading } = trpc.estatisticas.tiposPartosDesejados.useQuery();
  const { data: gestantes } = trpc.gestantes.list.useQuery();
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [gestantesSelecionadas, setGestantesSelecionadas] = useState<Array<{ nome: string; tipo: string }>>([]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Parto Desejado/Indicado</CardTitle>
          <CardDescription>Distribuição das preferências de parto das gestantes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  if (!estatisticas) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Parto Desejado/Indicado</CardTitle>
          <CardDescription>Distribuição das preferências de parto das gestantes</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhuma gestante cadastrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  const labels: string[] = [];
  const valores: number[] = [];
  const cores: string[] = [];
  const tiposMap: Record<string, string> = {};

  if (estatisticas.normal > 0) {
    labels.push("Parto Normal");
    valores.push(estatisticas.normal);
    cores.push("#10b981");
    tiposMap["Parto Normal"] = "normal";
  }
  if (estatisticas.cesariana > 0) {
    labels.push("Cesárea");
    valores.push(estatisticas.cesariana);
    cores.push("#f59e0b");
    tiposMap["Cesárea"] = "cesariana";
  }
  if (estatisticas.a_definir > 0) {
    labels.push("A Definir");
    valores.push(estatisticas.a_definir);
    cores.push("#6b7280");
    tiposMap["A Definir"] = "a_definir";
  }

  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: cores,
        borderColor: cores.map(c => c),
        borderWidth: 2,
      },
    ],
  };

  const handleClick = (_event: any, elements: any[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const tipo = labels[index];
      const tipoEnum = tiposMap[tipo];
      
      // Filtrar gestantes por tipo de parto
      const gestantesDoTipo = (gestantes || [])
        .filter(g => g.tipoPartoDesejado === tipoEnum)
        .map(g => {
          let tipoFormatado = "A Definir";
          if (g.tipoPartoDesejado === "normal") tipoFormatado = "Parto Normal";
          else if (g.tipoPartoDesejado === "cesariana") tipoFormatado = "Cesárea";
          
          return {
            nome: g.nome,
            tipo: tipoFormatado,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      setTipoSelecionado(tipo);
      setGestantesSelecionadas(gestantesDoTipo);
      setModalAberto(true);
    }
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleClick,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 13,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 16,
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        },
      },
    },
  };

  const total = valores.reduce((acc, val) => acc + val, 0);

  return (
    <>
      <Card style={{ cursor: 'pointer' }}>
        <CardHeader>
          <CardTitle>Tipo de Parto Desejado/Indicado</CardTitle>
          <CardDescription>
            Distribuição das preferências de parto das {total} gestantes cadastradas (clique para ver detalhes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center">
            <Pie data={data} options={options} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestantes - {tipoSelecionado}</DialogTitle>
            <DialogDescription>
              {gestantesSelecionadas.length} gestante(s) com este tipo de parto
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo de Parto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestantesSelecionadas.map((gestante, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{gestante.nome}</TableCell>
                  <TableCell>{gestante.tipo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
