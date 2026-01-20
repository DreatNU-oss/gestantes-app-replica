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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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

export function GraficoAlturaUterina({ consultas, dum }: GraficoAlturaUterinaProps) {
  // Filtrar consultas com AU válida e ordenar por data
  const consultasValidas = consultas
    .filter((c) => {
      if (!c.alturaUterina) return false;
      const au = typeof c.alturaUterina === 'string' ? parseFloat(c.alturaUterina) : c.alturaUterina;
      return au > 0;
    })
    .sort((a, b) => {
      const dataA = a.dataConsulta instanceof Date ? a.dataConsulta : new Date(a.dataConsulta);
      const dataB = b.dataConsulta instanceof Date ? b.dataConsulta : new Date(b.dataConsulta);
      return dataA.getTime() - dataB.getTime();
    });

  if (consultasValidas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum dado de altura uterina registrado
      </div>
    );
  }

  // Calcular IG em semanas para cada consulta
  const dadosGrafico = consultasValidas.map((consulta) => {
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

    const au = typeof consulta.alturaUterina === 'string' 
      ? parseFloat(consulta.alturaUterina) 
      : consulta.alturaUterina || 0;

    return {
      ig: Math.round(igSemanas),
      au,
    };
  });

  // Filtrar apenas IGs >= 4 semanas
  const dadosFiltrados = dadosGrafico.filter((d) => d.ig >= 4);

  if (dadosFiltrados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhuma consulta com IG ≥ 4 semanas
      </div>
    );
  }

  // Preparar labels (eixo X) - semanas de IG
  const labels = dadosFiltrados.map((d) => `${d.ig}s`);

  // Preparar dados (eixo Y) - altura uterina
  const valores = dadosFiltrados.map((d) => d.au);

  // Gerar curva de referência (AU esperada = semanas de IG)
  // Entre 20-34 semanas: AU (cm) ≈ semanas de IG ± 2cm
  const valoresReferencia = dadosFiltrados.map((d) => d.ig);

  const data = {
    labels,
    datasets: [
      {
        label: "AU Esperada (referência)",
        data: valoresReferencia,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
      {
        label: "Altura Uterina (cm)",
        data: valores,
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
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
