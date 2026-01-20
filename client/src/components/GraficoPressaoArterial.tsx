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
  pressaoArterial: string | null;
  igDumSemanas?: number | null;
  igDumDias?: number | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
}

interface GraficoPressaoArterialProps {
  consultas: Consulta[];
  dum?: string | null;
}

export function GraficoPressaoArterial({ consultas, dum }: GraficoPressaoArterialProps) {
  // Filtrar consultas com PA válida e ordenar por data
  const consultasValidas = consultas
    .filter((c) => {
      if (!c.pressaoArterial) return false;
      const match = c.pressaoArterial.match(/(\d+)\s*[x\/]\s*(\d+)/);
      return match !== null;
    })
    .sort((a, b) => {
      const dataA = a.dataConsulta instanceof Date ? a.dataConsulta : new Date(a.dataConsulta);
      const dataB = b.dataConsulta instanceof Date ? b.dataConsulta : new Date(b.dataConsulta);
      return dataA.getTime() - dataB.getTime();
    });

  if (consultasValidas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum dado de pressão arterial registrado
      </div>
    );
  }

  // Calcular IG em semanas e extrair sistólica/diastólica
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

    // Extrair sistólica e diastólica
    const match = consulta.pressaoArterial?.match(/(\d+)\s*[x\/]\s*(\d+)/);
    const sistolica = match ? parseInt(match[1]) : 0;
    const diastolica = match ? parseInt(match[2]) : 0;

    return {
      ig: Math.round(igSemanas),
      sistolica,
      diastolica,
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

  // Preparar dados (eixo Y) - pressão arterial
  const sistolicas = dadosFiltrados.map((d) => d.sistolica);
  const diastolicas = dadosFiltrados.map((d) => d.diastolica);

  // Identificar pontos com PA anormal (≥140/90)
  const pontosAnormais = dadosFiltrados.map((d) => d.sistolica >= 140 || d.diastolica >= 90);
  
  // Cores dos pontos (vermelho para anormais, cor padrão para normais)
  const coresSistolica = pontosAnormais.map((anormal) => 
    anormal ? "rgb(220, 38, 38)" : "rgb(239, 68, 68)"
  );
  const coresDiastolica = pontosAnormais.map((anormal) => 
    anormal ? "rgb(220, 38, 38)" : "rgb(59, 130, 246)"
  );

  const data = {
    labels,
    datasets: [
      {
        label: "Sistólica (mmHg)",
        data: sistolicas,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: coresSistolica,
        pointBorderColor: coresSistolica,
        pointBorderWidth: 2,
      },
      {
        label: "Diastólica (mmHg)",
        data: diastolicas,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: coresDiastolica,
        pointBorderColor: coresDiastolica,
        pointBorderWidth: 2,
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
            return `${context.dataset.label}: ${context.parsed.y} mmHg`;
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
          text: "Pressão Arterial (mmHg)",
        },
        beginAtZero: false,
        min: 40,
        max: 180,
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
