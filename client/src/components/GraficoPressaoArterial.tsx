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
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { BP_REFERENCE_DATA } from "@/lib/bpReferenceData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
  Filler
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
  // Calcular IG em semanas e extrair sistólica/diastólica para cada consulta
  const dadosConsultas = consultas
    .map((consulta) => {
      if (!consulta.pressaoArterial) return null;
      
      const match = consulta.pressaoArterial.match(/(\d+)\s*[x\/]\s*(\d+)/);
      if (!match) return null;

      const sistolica = parseInt(match[1]);
      const diastolica = parseInt(match[2]);

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
      
      // Filtrar apenas IGs >= 4 semanas
      if (igArredondada < 4) return null;

      return {
        ig: igArredondada,
        sistolica,
        diastolica,
      };
    })
    .filter((d): d is { ig: number; sistolica: number; diastolica: number } => d !== null);

  // Criar eixo X fixo de 4 a 42 semanas
  const todasSemanas = Array.from({ length: 39 }, (_, i) => 4 + i); // 4 a 42
  const labels = todasSemanas.map((s) => `${s}s`);

  // Criar arrays de referência completos (4 a 42 semanas)
  const sistolicaMin = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.systolic.min || null);
  const sistolicaMax = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.systolic.max || null);
  const sistolicaMediana = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.systolic.median || null);
  
  const diastolicaMin = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.diastolic.min || null);
  const diastolicaMax = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.diastolic.max || null);
  const diastolicaMediana = todasSemanas.map((s) => BP_REFERENCE_DATA[s]?.diastolic.median || null);

  // Criar array de dados medidos (null onde não há medição)
  const sistolicasMedidas = todasSemanas.map((semana) => {
    const consulta = dadosConsultas.find((d) => d.ig === semana);
    return consulta ? consulta.sistolica : null;
  });

  const diastolicasMedidas = todasSemanas.map((semana) => {
    const consulta = dadosConsultas.find((d) => d.ig === semana);
    return consulta ? consulta.diastolica : null;
  });

  // Identificar pontos com PA anormal (≥140/90)
  const pontosAnormais = todasSemanas.map((semana) => {
    const consulta = dadosConsultas.find((d) => d.ig === semana);
    if (!consulta) return false;
    return consulta.sistolica >= 140 || consulta.diastolica >= 90;
  });

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
      // Faixas de referência para SISTÓLICA
      {
        label: "Sistólica - Limite Inferior",
        data: sistolicaMin,
        borderColor: "rgba(239, 68, 68, 0.3)",
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
        label: "Sistólica - Limite Superior",
        data: sistolicaMax,
        borderColor: "rgba(239, 68, 68, 0.3)",
        backgroundColor: "rgba(239, 68, 68, 0.08)",
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
        label: "Sistólica - Mediana",
        data: sistolicaMediana,
        borderColor: "rgba(239, 68, 68, 0.4)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      // Faixas de referência para DIASTÓLICA
      {
        label: "Diastólica - Limite Inferior",
        data: diastolicaMin,
        borderColor: "rgba(59, 130, 246, 0.3)",
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
        label: "Diastólica - Limite Superior",
        data: diastolicaMax,
        borderColor: "rgba(59, 130, 246, 0.3)",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
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
        label: "Diastólica - Mediana",
        data: diastolicaMediana,
        borderColor: "rgba(59, 130, 246, 0.4)",
        backgroundColor: "transparent",
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      // Linha de hipertensão gestacional (140/90)
      {
        label: "Limite Hipertensão (140 mmHg)",
        data: todasSemanas.map(() => 140),
        borderColor: "rgba(220, 38, 38, 0.5)",
        backgroundColor: "transparent",
        borderDash: [8, 4],
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      {
        label: "Limite Hipertensão (90 mmHg)",
        data: todasSemanas.map(() => 90),
        borderColor: "rgba(59, 130, 246, 0.6)",
        backgroundColor: "transparent",
        borderDash: [8, 4],
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        datalabels: {
          display: false,
        },
      },
      // DADOS MEDIDOS
      {
        label: "Sistólica (mmHg)",
        data: sistolicasMedidas,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: coresSistolica,
        pointBorderColor: coresSistolica,
        pointBorderWidth: 2,
        spanGaps: false,
        datalabels: {
          display: (context: any) => context.dataset.data[context.dataIndex] !== null,
          align: "top" as const,
          anchor: "end" as const,
          offset: 4,
          color: (context: any) => pontosAnormais[context.dataIndex] ? "rgb(220, 38, 38)" : "rgb(239, 68, 68)",
          font: {
            size: 10,
            weight: "bold" as const,
          },
          formatter: (value: number | null) => value ? `${value}` : "",
        },
      },
      {
        label: "Diastólica (mmHg)",
        data: diastolicasMedidas,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: coresDiastolica,
        pointBorderColor: coresDiastolica,
        pointBorderWidth: 2,
        spanGaps: false,
        datalabels: {
          display: (context: any) => context.dataset.data[context.dataIndex] !== null,
          align: "bottom" as const,
          anchor: "end" as const,
          offset: 4,
          color: (context: any) => pontosAnormais[context.dataIndex] ? "rgb(220, 38, 38)" : "rgb(59, 130, 246)",
          font: {
            size: 10,
            weight: "bold" as const,
          },
          formatter: (value: number | null) => value ? `${value}` : "",
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
        labels: {
          filter: (item) => {
            // Mostrar apenas as legendas principais
            return [
              "Sistólica (mmHg)",
              "Diastólica (mmHg)",
              "Limite Hipertensão (140 mmHg)",
              "Limite Hipertensão (90 mmHg)",
            ].includes(item.text);
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (context.parsed.y === null) return "";
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
        max: 160,
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
