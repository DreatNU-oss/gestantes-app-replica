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

export function GraficoMotivosCesarea() {
  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery();
  const [modalAberto, setModalAberto] = useState(false);
  const [motivoSelecionado, setMotivoSelecionado] = useState("");
  const [gestantesSelecionadas, setGestantesSelecionadas] = useState<Array<{ nome: string; motivo: string }>>([]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Motivos de Indicação de Cesárea</CardTitle>
          <CardDescription>Distribuição dos motivos de cesárea programada</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar gestantes com cesárea programada e motivo definido
  const gestantesComCesarea = (gestantes || []).filter(
    g => g.dataPartoProgramado && g.motivoCesarea
  );

  if (gestantesComCesarea.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Motivos de Indicação de Cesárea</CardTitle>
          <CardDescription>Distribuição dos motivos de cesárea programada</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhuma cesárea programada com motivo registrado</p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por motivo e contar
  const contagemMotivos: Record<string, number> = {};
  gestantesComCesarea.forEach(g => {
    const motivo = g.motivoCesarea || "Não especificado";
    contagemMotivos[motivo] = (contagemMotivos[motivo] || 0) + 1;
  });

  // Ordenar por frequência (maior para menor)
  const motivosOrdenados = Object.entries(contagemMotivos)
    .sort((a, b) => b[1] - a[1]);

  const labels = motivosOrdenados.map(([motivo]) => motivo);
  const valores = motivosOrdenados.map(([, count]) => count);

  // Cores variadas para o gráfico (14 cores para incluir "Desejo materno")
  const cores = [
    "#ef4444", // vermelho
    "#f59e0b", // laranja
    "#10b981", // verde
    "#3b82f6", // azul
    "#8b5cf6", // roxo
    "#ec4899", // rosa
    "#14b8a6", // teal
    "#f97316", // laranja escuro
    "#06b6d4", // ciano
    "#84cc16", // lime
    "#a855f7", // roxo claro
    "#f43f5e", // vermelho rosado
    "#6366f1", // indigo
    "#fbbf24", // amarelo
  ];

  const data = {
    labels,
    datasets: [
      {
        data: valores,
        backgroundColor: cores.slice(0, labels.length),
        borderColor: cores.slice(0, labels.length),
        borderWidth: 2,
      },
    ],
  };

  const handleClick = (_event: any, elements: any[]) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const motivo = labels[index];
      
      // Filtrar gestantes por motivo de cesárea
      const gestantesDoMotivo = gestantesComCesarea
        .filter(g => (g.motivoCesarea || "Não especificado") === motivo)
        .map(g => ({
          nome: g.nome,
          motivo: g.motivoCesarea || "Não especificado",
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      
      setMotivoSelecionado(motivo);
      setGestantesSelecionadas(gestantesDoMotivo);
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
            size: 12,
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
          size: 14,
        },
        formatter: (value: number, context: any) => {
          const total = context.dataset.data.reduce((acc: number, val: any) => acc + (val as number), 0);
          const percentage = ((value / total) * 100).toFixed(1);
          // Mostrar porcentagem em todas as fatias
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
          <CardTitle>Motivos de Indicação de Cesárea</CardTitle>
          <CardDescription>
            Distribuição dos motivos de cesárea programada entre {total} gestante{total !== 1 ? 's' : ''} (clique para ver detalhes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <Pie data={data} options={options} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestantes - {motivoSelecionado}</DialogTitle>
            <DialogDescription>
              {gestantesSelecionadas.length} gestante(s) com este motivo de cesárea
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Motivo de Cesárea</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestantesSelecionadas.map((gestante, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{gestante.nome}</TableCell>
                  <TableCell>{gestante.motivo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
