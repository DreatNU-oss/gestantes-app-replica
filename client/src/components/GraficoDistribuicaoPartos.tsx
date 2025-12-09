import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
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

interface GestanteModal {
  nome: string;
  dpp: string;
  dppDate?: Date | null;
  ig: string;
}

interface GraficoDistribuicaoPartosProps {
  gestantes: Gestante[];
}

export function GraficoDistribuicaoPartos({ gestantes }: GraficoDistribuicaoPartosProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [gestantesSelecionadas, setGestantesSelecionadas] = useState<GestanteModal[]>([]); 
  const [mesSelecionado, setMesSelecionado] = useState("");

  const calcularDPP = (gestante: Gestante): Date | null => {
    if (
      gestante.dataUltrassom &&
      gestante.igUltrassomSemanas !== null &&
      gestante.igUltrassomSemanas !== undefined
    ) {
      const igTotalDias =
        gestante.igUltrassomSemanas * 7 + (gestante.igUltrassomDias || 0);
      const diasRestantes = 280 - igTotalDias;
      const dpp = new Date(gestante.dataUltrassom);
      dpp.setDate(dpp.getDate() + diasRestantes + 1); // +1 para contar o dia do US
      return dpp;
    }

    if (gestante.dum) {
      const dpp = new Date(gestante.dum);
      dpp.setDate(dpp.getDate() + 280);
      return dpp;
    }

    return null;
  };

  const dadosGrafico = useMemo(() => {
    const distribuicao = new Map<string, number>();
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    let dppMaisDistante: Date | null = null;
    gestantes.forEach((gestante) => {
      const dpp = calcularDPP(gestante);
      if (dpp && (!dppMaisDistante || dpp > dppMaisDistante)) {
        dppMaisDistante = dpp;
      }
    });

    if (!dppMaisDistante) {
      return [];
    }

    const meses: string[] = [];
    const dppDate: Date = dppMaisDistante;
    const mesLimite = new Date(
      dppDate.getFullYear(),
      dppDate.getMonth(),
      1
    );

    let mesIteracao = new Date(mesAtual);
    while (mesIteracao <= mesLimite) {
      const chave = `${mesIteracao.getFullYear()}-${String(
        mesIteracao.getMonth() + 1
      ).padStart(2, "0")}`;
      meses.push(chave);
      distribuicao.set(chave, 0);
      mesIteracao.setMonth(mesIteracao.getMonth() + 1);
    }

    gestantes.forEach((gestante) => {
      const dpp = calcularDPP(gestante);
      if (dpp) {
        const chave = `${dpp.getFullYear()}-${String(dpp.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        if (distribuicao.has(chave)) {
          distribuicao.set(chave, (distribuicao.get(chave) || 0) + 1);
        }
      }
    });

    return meses.map((chave) => {
      const [ano, mes] = chave.split("-");
      const data = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const mesNome = data.toLocaleDateString("pt-BR", {
        month: "long",
      });

      return {
        mes: mesNome.charAt(0).toUpperCase() + mesNome.slice(1),
        quantidade: distribuicao.get(chave) || 0,
        chave,
      };
    });
  }, [gestantes]);

  const maxValue = Math.max(...dadosGrafico.map((d) => d.quantidade), 1);

  const handleBarClick = (data: any) => {
    if (!data || !data.chave) return;
    
    const chave = data.chave;
    const mes = data.mes;
    
    const gestantesDoMes = gestantes
      .filter((gestante) => {
        const dpp = calcularDPP(gestante);
        if (!dpp) return false;
        
        const chaveDPP = `${dpp.getFullYear()}-${String(dpp.getMonth() + 1).padStart(2, "0")}`;
        return chaveDPP === chave;
      })
      .map((gestante) => {
        const dpp = calcularDPP(gestante);
        const dppFormatada = dpp ? new Date(dpp).toLocaleDateString("pt-BR") : "-";
        
        let igAtual = "-";
        if (gestante.dum) {
          const hoje = new Date();
          const dum = new Date(gestante.dum);
          const diffMs = hoje.getTime() - dum.getTime();
          const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const semanas = Math.floor(diffDias / 7);
          const dias = diffDias % 7;
          igAtual = `${semanas}s ${dias}d`;
        }
        
        return {
          nome: gestante.nome,
          dpp: dppFormatada,
          dppDate: dpp,
          ig: igAtual,
        };
      })
      .sort((a, b) => {
        if (!a.dppDate || !b.dppDate) return 0;
        return a.dppDate.getTime() - b.dppDate.getTime();
      });
    
    setGestantesSelecionadas(gestantesDoMes);
    setMesSelecionado(mes);
    setModalAberto(true);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Distribuição de Partos por Mês
            </h2>
            <p className="text-sm text-muted-foreground">
              Previsão de partos nos próximos meses
            </p>
          </div>
        </div>
      </div>

      {dadosGrafico.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhuma gestante com DPP calculada
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
            <Bar 
              dataKey="quantidade" 
              radius={[8, 8, 0, 0]}
              onClick={handleBarClick}
              style={{ cursor: "pointer" }}
            >
              {dadosGrafico.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.quantidade > 0 ? "#9b4d96" : "hsl(var(--muted))"}
                />
              ))}
              <LabelList
                dataKey="quantidade"
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
            <DialogTitle>Gestantes com DPP em {mesSelecionado}</DialogTitle>
            <DialogDescription>
              {gestantesSelecionadas.length} gestante(s) com previsão de parto neste mês
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>IG Atual</TableHead>
                <TableHead>DPP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gestantesSelecionadas.map((gestante, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{gestante.nome}</TableCell>
                  <TableCell>{gestante.ig}</TableCell>
                  <TableCell>{gestante.dpp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
