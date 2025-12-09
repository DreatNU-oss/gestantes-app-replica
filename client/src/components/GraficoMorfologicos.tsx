import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "lucide-react";
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

interface Gestante {
  id: number;
  nome: string;
  dum?: Date | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
  dataUltrassom?: Date | null;
}

interface GraficoMorfologicosProps {
  gestantes: Gestante[];
}

export function GraficoMorfologicos({ gestantes }: GraficoMorfologicosProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [gestantesSelecionadas, setGestantesSelecionadas] = useState<Array<{ nome: string; dataMorfo: string; dataMorfoDate?: Date | null; tipo: string }>>([]); 
  const [tituloModal, setTituloModal] = useState("");

  // Calcula data para uma semana específica priorizando ultrassom, com fallback para DUM
  const calcularData = (gestante: Gestante, semanas: number, dias: number = 0): Date | null => {
    // Prioridade 1: Cálculo pelo Ultrassom
    if (
      gestante.dataUltrassom &&
      gestante.igUltrassomSemanas !== null &&
      gestante.igUltrassomSemanas !== undefined
    ) {
      const dataUS = new Date(gestante.dataUltrassom);
      const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias ?? 0);
      const diasDesdeUS = semanas * 7 + dias - igUltrassomDias;
      const dataAlvo = new Date(dataUS);
      dataAlvo.setDate(dataAlvo.getDate() + diasDesdeUS);
      return dataAlvo;
    }

    // Fallback: Cálculo pela DUM
    if (gestante.dum) {
      const dum = new Date(gestante.dum);
      const totalDias = semanas * 7 + dias;
      const dataAlvo = new Date(dum);
      dataAlvo.setDate(dataAlvo.getDate() + totalDias);
      return dataAlvo;
    }

    return null;
  };

  const dadosGrafico = useMemo(() => {
    const distribuicao = new Map<string, { morfo1: number; morfo2: number }>();
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Encontrar a data mais distante (considerando morfológico 2º trimestre - 20 semanas)
    let dataMaisDistante: Date | null = null;
    
    gestantes.forEach((gestante) => {
      const dataMorfo2 = calcularData(gestante, 20, 0);
      
      if (dataMorfo2 && (!dataMaisDistante || dataMorfo2 > dataMaisDistante)) {
        dataMaisDistante = dataMorfo2;
      }
    });

    if (!dataMaisDistante) {
      return [];
    }

    // Criar lista de meses do mês atual até a data mais distante
    const meses: string[] = [];
    const mesLimite = new Date(
      (dataMaisDistante as Date).getFullYear(),
      (dataMaisDistante as Date).getMonth(),
      1
    );

    let mesIteracao = new Date(mesAtual);
    while (mesIteracao <= mesLimite) {
      const chave = `${mesIteracao.getFullYear()}-${String(
        mesIteracao.getMonth() + 1
      ).padStart(2, "0")}`;
      meses.push(chave);
      distribuicao.set(chave, { morfo1: 0, morfo2: 0 });
      mesIteracao.setMonth(mesIteracao.getMonth() + 1);
    }

    // Contar morfológicos por mês
    gestantes.forEach((gestante) => {
      // Morfológico 1º trimestre: 11 semanas e 5 dias
      const dataMorfo1 = calcularData(gestante, 11, 5);

      if (dataMorfo1) {
        const chave = `${dataMorfo1.getFullYear()}-${String(dataMorfo1.getMonth() + 1).padStart(2, "0")}`;
        if (distribuicao.has(chave)) {
          const atual = distribuicao.get(chave)!;
          distribuicao.set(chave, { ...atual, morfo1: atual.morfo1 + 1 });
        }
      }

      // Morfológico 2º trimestre: 20 semanas
      const dataMorfo2 = calcularData(gestante, 20, 0);

      if (dataMorfo2) {
        const chave = `${dataMorfo2.getFullYear()}-${String(dataMorfo2.getMonth() + 1).padStart(2, "0")}`;
        if (distribuicao.has(chave)) {
          const atual = distribuicao.get(chave)!;
          distribuicao.set(chave, { ...atual, morfo2: atual.morfo2 + 1 });
        }
      }
    });

    // Converter para formato do gráfico
    return meses.map((chave) => {
      const [ano, mes] = chave.split("-");
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const mesNome = data.toLocaleDateString("pt-BR", {
        month: "long",
      });

      const valores = distribuicao.get(chave) || { morfo1: 0, morfo2: 0 };

      return {
        mes: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
        "1º Trimestre": valores.morfo1,
        "2º Trimestre": valores.morfo2,
        chave,
      };
    });
  }, [gestantes]);

  const maxValue = Math.max(
    ...dadosGrafico.map((d) => d["1º Trimestre"] + d["2º Trimestre"]),
    1
  );

  const handleBarClick = (data: any, tipoMorfo: "1º Trimestre" | "2º Trimestre") => {
    if (!data || !data.chave) return;
    
    const chave = data.chave;
    const mes = data.mes;
    const semanas = tipoMorfo === "1º Trimestre" ? 11 : 20;
    const dias = tipoMorfo === "1º Trimestre" ? 5 : 0;
    
    // Filtrar gestantes com morfológico no mês selecionado
    const gestantesDoMes = gestantes
      .filter((gestante) => {
        const dataMorfo = calcularData(gestante, semanas, dias);
        
        if (!dataMorfo) return false;
        
        const chaveMorfo = `${dataMorfo.getFullYear()}-${String(dataMorfo.getMonth() + 1).padStart(2, "0")}`;
        return chaveMorfo === chave;
      })
      .map((gestante) => {
        const dataMorfo = calcularData(gestante, semanas, dias);
        
        const dataFormatada = dataMorfo ? new Date(dataMorfo).toLocaleDateString("pt-BR") : "-";
        
        return {
          nome: gestante.nome,
          dataMorfo: dataFormatada,
          dataMorfoDate: dataMorfo, // Guardar data para ordenação
          tipo: tipoMorfo,
        };
      })
      // Ordenar por data do morfológico cronológica (do mais próximo ao mais distante)
      .sort((a, b) => {
        if (!a.dataMorfoDate || !b.dataMorfoDate) return 0;
        return a.dataMorfoDate.getTime() - b.dataMorfoDate.getTime();
      });
    
    setGestantesSelecionadas(gestantesDoMes);
    setTituloModal(`Morfológico ${tipoMorfo} - ${mes}`);
    setModalAberto(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Ultrassons Morfológicos por Mês
            </h2>
            <p className="text-sm text-muted-foreground">
              Previsão de morfológicos nos próximos meses
            </p>
          </div>
        </div>

      </div>

      {dadosGrafico.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhuma gestante com datas calculadas
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="mes"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[0, maxValue + 1]}
              allowDecimals={false}
              axisLine={false}
              tick={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="square"
            />
            <Bar 
              dataKey="1º Trimestre" 
              stackId="a" 
              fill="#10b981" 
              radius={[0, 0, 0, 0]}
              onClick={(data) => handleBarClick(data, "1º Trimestre")}
              style={{ cursor: "pointer" }}
            >
              <LabelList
                dataKey="1º Trimestre"
                position="inside"
                style={{ fill: "white", fontWeight: "bold", fontSize: "14px" }}
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Bar>
            <Bar 
              dataKey="2º Trimestre" 
              stackId="a" 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
              onClick={(data) => handleBarClick(data, "2º Trimestre")}
              style={{ cursor: "pointer" }}
            >
              <LabelList
                dataKey="2º Trimestre"
                position="inside"
                style={{ fill: "white", fontWeight: "bold", fontSize: "14px" }}
                formatter={(value: number) => (value > 0 ? value : "")}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tituloModal}</DialogTitle>
            <DialogDescription>
              {gestantesSelecionadas.length} gestante(s) com morfológico previsto
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data do Morfológico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestantesSelecionadas.map((gestante, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{gestante.nome}</TableCell>
                  <TableCell>{gestante.dataMorfo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
