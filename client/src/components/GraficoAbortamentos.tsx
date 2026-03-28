import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TIPO_LABELS: Record<string, string> = {
  espontaneo: "Espontâneo",
  retido: "Retido",
  incompleto: "Incompleto",
  inevitavel: "Inevitável",
  outro: "Outro",
};

export function GraficoAbortamentos() {
  const { data: estatisticas, isLoading } = trpc.abortamentos.estatisticas.useQuery();
  const { data: listaAbortamentos } = trpc.abortamentos.listar.useQuery();
  const [modalAberto, setModalAberto] = useState(false);

  const dadosPorMes = useMemo(() => {
    if (!estatisticas?.porMes) return [];
    return estatisticas.porMes.map((item) => {
      const [ano, mes] = (item.mes as string).split("-");
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const mesNome = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      return {
        mes: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
        quantidade: item.count,
        chave: item.mes,
      };
    });
  }, [estatisticas]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          Carregando estatísticas de abortamentos...
        </div>
      </Card>
    );
  }

  if (!estatisticas || estatisticas.total === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Abortamentos</h2>
            <p className="text-sm text-muted-foreground">
              Nenhum abortamento registrado
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const formatarData = (dateValue: Date | string | null | undefined): string => {
    if (!dateValue) return "-";
    if (typeof dateValue === "string") {
      const [year, month, day] = dateValue.split("T")[0].split("-").map(Number);
      if (year && month && day) {
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      }
    }
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "-";
    return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Abortamentos</h2>
            <p className="text-sm text-muted-foreground">
              {estatisticas.total} abortamento{estatisticas.total !== 1 ? "s" : ""} registrado{estatisticas.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          Ver detalhes
        </button>
      </div>

      {/* Gráfico por Mês */}
      {dadosPorMes.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosPorMes}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis allowDecimals={false} axisLine={false} tick={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="quantidade" radius={[8, 8, 0, 0]} fill="#f59e0b">
                <LabelList
                  dataKey="quantidade"
                  position="inside"
                  style={{ fill: "white", fontWeight: "bold", fontSize: "14px" }}
                  formatter={(value: number) => (value > 0 ? value : "")}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Modal com lista detalhada */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Abortamentos Registrados</DialogTitle>
            <DialogDescription>
              {estatisticas.total} registro{estatisticas.total !== 1 ? "s" : ""} no total
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gestante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>IG</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaAbortamentos?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nomeGestante}</TableCell>
                  <TableCell>{formatarData(item.dataAbortamento)}</TableCell>
                  <TableCell>
                    {item.igSemanas !== null ? `${item.igSemanas}s${item.igDias ? ` ${item.igDias}d` : ""}` : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                      {TIPO_LABELS[item.tipoAbortamento || "outro"] || item.tipoAbortamento}
                    </span>
                  </TableCell>
                  <TableCell>{item.medicoNome || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.observacoes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
