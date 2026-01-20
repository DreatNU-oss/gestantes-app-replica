import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface Consulta {
  id: number;
  dataConsulta: Date | string;
  alturaUterina: number | string | null;
  igDumSemanas?: number | null;
  igDumDias?: number | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
}

interface GraficoAlturaUterinaProps {
  consultas: Consulta[];
  dum?: string | null;
}

// Dados oficiais de referência (Ministério da Saúde/FEBRASGO - Percentis 10 e 90)
const referenceData: Record<number, { min: number; max: number; median: number }> = {
  12: { min: 10, max: 12, median: 11 },
  13: { min: 6, max: 14, median: 10 },
  14: { min: 9, max: 16, median: 12.5 },
  15: { min: 10, max: 18, median: 14 },
  16: { min: 11, max: 19, median: 15 },
  17: { min: 13, max: 24, median: 18.5 },
  18: { min: 13, max: 23, median: 18 },
  19: { min: 14, max: 24, median: 19 },
  20: { min: 18, max: 22, median: 20 },
  21: { min: 16, max: 24, median: 20 },
  22: { min: 17, max: 26, median: 21.5 },
  23: { min: 19, max: 27, median: 23 },
  24: { min: 19, max: 28, median: 23.5 },
  25: { min: 20, max: 28, median: 24 },
  26: { min: 21, max: 30, median: 25.5 },
  27: { min: 23, max: 29, median: 26 },
  28: { min: 24, max: 32, median: 28 },
  29: { min: 24, max: 35, median: 29.5 },
  30: { min: 25, max: 34, median: 29.5 },
  31: { min: 25, max: 35, median: 30 },
  32: { min: 26, max: 36, median: 31 },
  33: { min: 27, max: 35, median: 31 },
  34: { min: 27, max: 36, median: 31.5 },
  35: { min: 28, max: 37, median: 32.5 },
  36: { min: 29, max: 37, median: 33 },
  37: { min: 30, max: 38, median: 34 },
  38: { min: 31, max: 39, median: 35 },
  39: { min: 31, max: 38, median: 34.5 },
  40: { min: 32, max: 36, median: 34 },
  41: { min: 35, max: 40, median: 37.5 },
  42: { min: 35, max: 41, median: 38 },
};

export function GraficoAlturaUterina({ consultas, dum }: GraficoAlturaUterinaProps) {
  // Calcular IG em semanas para cada consulta
  const dadosConsultas = consultas
    .map((consulta) => {
      if (!consulta.alturaUterina) return null;
      
      const au = typeof consulta.alturaUterina === 'string' 
        ? parseFloat(consulta.alturaUterina) 
        : consulta.alturaUterina;
      
      if (au <= 0) return null;

      let igSemanas = 0;

      // Priorizar IG do ultrassom, depois DUM
      if (consulta.igUltrassomSemanas !== null && consulta.igUltrassomSemanas !== undefined) {
        igSemanas = consulta.igUltrassomSemanas;
        if (consulta.igUltrassomDias) {
          igSemanas += consulta.igUltrassomDias / 7;
        }
      } else if (consulta.igDumSemanas !== null && consulta.igDumSemanas !== undefined) {
        igSemanas = consulta.igDumSemanas;
        if (consulta.igDumDias) {
          igSemanas += consulta.igDumDias / 7;
        }
      }

      const igArredondada = Math.round(igSemanas);
      
      // Filtrar apenas IGs >= 12 semanas
      if (igArredondada < 12) return null;

      return {
        ig: igArredondada,
        au: au / 10, // Converter de mm para cm
      };
    })
    .filter((d): d is { ig: number; au: number } => d !== null);

  // Criar eixo X fixo de 12 a 42 semanas
  const todasSemanas = Array.from({ length: 31 }, (_, i) => 12 + i); // 12 a 42
  const labels = todasSemanas.map((s) => `${s}s`);

  // Criar arrays de referência completos (12 a 42 semanas)
  const valoresP10 = todasSemanas.map((s) => referenceData[s]?.min || null);
  const valoresP90 = todasSemanas.map((s) => referenceData[s]?.max || null);
  const valoresMediana = todasSemanas.map((s) => referenceData[s]?.median || null);

  // Criar array de dados medidos (null onde não há medição)
  const valoresMedidos = todasSemanas.map((semana) => {
    const consulta = dadosConsultas.find((d) => d.ig === semana);
    return consulta ? consulta.au : null;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Percentil 10 (limite inferior)",
        data: valoresP10,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "transparent",
        borderDash: [3, 3],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      {
        label: "Percentil 90 (limite superior)",
        data: valoresP90,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "rgba(156, 163, 175, 0.2)",
        borderDash: [3, 3],
        fill: "-1",
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      {
        label: "Mediana (referência)",
        data: valoresMediana,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      {
        label: "Altura Uterina (cm)",
        data: valoresMedidos,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        spanGaps: false, // Não conectar pontos com gaps
        datalabels: {
          display: (context: any) => context.dataset.data[context.dataIndex] !== null,
          align: "top" as const,
          anchor: "end" as const,
          offset: 4,
          color: "rgb(168, 85, 247)",
          font: {
            size: 11,
            weight: "bold" as const,
          },
          formatter: (value: number | null) => value ? `${value} cm` : "",
        },
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (context.parsed.y === null) return "";
            return `AU: ${context.parsed.y} cm`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Idade Gestacional (semanas)",
        },
        grid: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Altura Uterina (cm)",
        },
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
