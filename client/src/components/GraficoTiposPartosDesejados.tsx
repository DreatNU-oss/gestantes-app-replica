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

export function GraficoTiposPartosDesejados() {
  const { data: estatisticas, isLoading } = trpc.estatisticas.tiposPartosDesejados.useQuery();

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

  if (estatisticas.normal > 0) {
    labels.push("Parto Normal");
    valores.push(estatisticas.normal);
    cores.push("#10b981");
  }
  if (estatisticas.cesariana > 0) {
    labels.push("Cesárea");
    valores.push(estatisticas.cesariana);
    cores.push("#f59e0b");
  }
  if (estatisticas.a_definir > 0) {
    labels.push("A Definir");
    valores.push(estatisticas.a_definir);
    cores.push("#6b7280");
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
        <CardTitle>Tipo de Parto Desejado/Indicado</CardTitle>
        <CardDescription>
          Distribuição das preferências de parto das {total} gestantes cadastradas
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
