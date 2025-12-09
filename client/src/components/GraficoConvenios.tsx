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

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export function GraficoConvenios() {
  const { data: estatisticas, isLoading } = trpc.estatisticas.convenios.useQuery();

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

  if (!estatisticas || estatisticas.length === 0) {
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

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
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
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Convênio</CardTitle>
        <CardDescription>
          Planos de saúde das {total} gestantes cadastradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] flex items-center justify-center">
          <Pie data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
