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

export function GraficoConvenios() {
  const { data: estatisticas, isLoading } = trpc.estatisticas.convenios.useQuery();
  const { data: gestantes } = trpc.gestantes.list.useQuery();
  const { data: planos } = trpc.planosSaude.listarTodos.useQuery();
  const [modalAberto, setModalAberto] = useState(false);
  const [convenioSelecionado, setConvenioSelecionado] = useState("");
  const [gestantesSelecionadas, setGestantesSelecionadas] = useState<Array<{ nome: string; plano: string }>>([]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Convênio</CardTitle>
          <CardDescription>Planos de saúde das gestantes cadastradas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  if (!estatisticas || Object.keys(estatisticas).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Convênio</CardTitle>
          <CardDescription>Planos de saúde das gestantes cadastradas</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhuma gestante cadastrada ainda</p>
        </CardContent>
      </Card>
    );
  }

  // Paleta de cores para os convênios
  const coresPadrao = [
    "#3b82f6", // azul
    "#10b981", // verde
    "#f59e0b", // laranja
    "#ef4444", // vermelho
    "#8b5cf6", // roxo
    "#ec4899", // rosa
    "#14b8a6", // teal
    "#f97316", // laranja escuro
    "#6366f1", // indigo
    "#84cc16", // lime
  ];

  // Cor especial para "Não cadastrado"
  const corNaoCadastrado = "#9ca3af"; // cinza

  // Mapear os dados para o formato do gráfico
  const labels: string[] = [];
  const valores: number[] = [];
  const cores: string[] = [];

  let corIndex = 0;

  Object.entries(estatisticas).forEach(([nomePlano, total]) => {
    labels.push(nomePlano);
    valores.push(total as number);

    if (nomePlano === "Sem plano") {
      cores.push(corNaoCadastrado);
    } else {
      cores.push(coresPadrao[corIndex % coresPadrao.length]);
      corIndex++;
    }
  });

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
      const convenio = labels[index];
      
      // Filtrar gestantes por convênio
      const gestantesDoConvenio = (gestantes || [])
        .filter(g => {
          if (g.planoSaudeId) {
            const plano = (planos || []).find((p: any) => p.id === g.planoSaudeId);
            return plano?.nome === convenio;
          } else {
            return convenio === "Sem plano";
          }
        })
        .map(g => {
          let nomePlano = "Sem plano";
          if (g.planoSaudeId) {
            const plano = (planos || []).find((p: any) => p.id === g.planoSaudeId);
            nomePlano = plano?.nome || "Sem plano";
          }
          return {
            nome: g.nome,
            plano: nomePlano,
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      setConvenioSelecionado(convenio);
      setGestantesSelecionadas(gestantesDoConvenio);
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
        color: (context: any) => {
          // Usar cor branca para fatias grandes, cor da fatia para labels externos
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((context.dataset.data[context.dataIndex] / total) * 100);
          return percentage > 5 ? '#fff' : context.dataset.backgroundColor[context.dataIndex];
        },
        font: {
          weight: 'bold' as const,
          size: 14,
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((value / total) * 100).toFixed(1);
          // Mostrar percentual apenas se for maior que 1%
          return percentage !== '0.0' ? `${percentage}%` : '';
        },
        // Posicionar labels de fatias pequenas fora do gráfico
        anchor: (context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((context.dataset.data[context.dataIndex] / total) * 100);
          return percentage > 5 ? 'center' : 'end';
        },
        align: (context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((context.dataset.data[context.dataIndex] / total) * 100);
          return percentage > 5 ? 'center' : 'end';
        },
        offset: (context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((context.dataset.data[context.dataIndex] / total) * 100);
          return percentage > 5 ? 0 : 10;
        },
      },
    },
  };

  const total = valores.reduce((acc, val) => acc + val, 0);

  return (
    <>
      <Card style={{ cursor: 'pointer' }}>
        <CardHeader>
          <CardTitle>Distribuição por Convênio</CardTitle>
          <CardDescription>
            Planos de saúde das {total} gestantes cadastradas (clique para ver detalhes)
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
            <DialogTitle>Gestantes - {convenioSelecionado}</DialogTitle>
            <DialogDescription>
              {gestantesSelecionadas.length} gestante(s) com este convênio
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Plano de Saúde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestantesSelecionadas.map((gestante, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{gestante.nome}</TableCell>
                  <TableCell>{gestante.plano}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
