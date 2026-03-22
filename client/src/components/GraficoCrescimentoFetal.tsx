/**
 * GraficoCrescimentoFetal
 *
 * Gráfico de crescimento fetal com curvas de percentis FMF (Fetal Medicine Foundation).
 * Suporta dois modos:
 *   - "peso"  → Peso Fetal Estimado (g), eixo X de 22 a 40 semanas
 *   - "ca"    → Circunferência Abdominal (mm), eixo X de 20 a 40 semanas
 *
 * Faixas de cor:
 *   - P10–P90  → verde  (normal)
 *   - P3–P10 e P90–P97 → amarelo (atenção)
 *   - P1–P3 e P97–P99  → vermelho (alerta)
 *
 * REGRA DE IG: A IG de cada ponto é calculada exclusivamente a partir do
 * primeiro ultrassom do cadastro (igUltrassomSemanas + igUltrassomDias + dataUltrassom).
 * A IG que consta no laudo individual é IGNORADA.
 */

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { FMF_PESO, FMF_CA } from "../../../shared/fmfPercentis";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PontoUltrassom {
  /** Data do exame (YYYY-MM-DD) */
  dataExame: string;
  /** Valor medido: peso em gramas OU CA em mm (já convertida) */
  valor: number;
}

interface Props {
  tipo: "peso" | "ca";
  pontos: PontoUltrassom[];
  /** Data do primeiro ultrassom (YYYY-MM-DD) — do cadastro da gestante */
  dataUltrassom: string;
  /** IG do primeiro ultrassom em semanas — do cadastro da gestante */
  igUltrassomSemanas: number;
  /** IG do primeiro ultrassom em dias — do cadastro da gestante */
  igUltrassomDias?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula a IG em semanas decimais para uma data de exame,
 * usando como âncora o primeiro ultrassom do cadastro da gestante.
 */
function calcularIGPeloUS(
  dataExame: string,
  dataUltrassom: string,
  igUSSemanas: number,
  igUSDias: number
): number {
  const dtExame = new Date(dataExame + "T12:00:00");
  const dtUS = new Date(dataUltrassom + "T12:00:00");
  const diffMs = dtExame.getTime() - dtUS.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  const igTotalDias = igUSSemanas * 7 + igUSDias + diffDias;
  return igTotalDias / 7; // semanas decimais
}

/**
 * Interpola linearmente entre dois valores de percentil para uma IG decimal.
 */
function interpolar(
  igDecimal: number,
  tabela: typeof FMF_PESO,
  campo: keyof (typeof FMF_PESO)[0]
): number {
  const igFloor = Math.floor(igDecimal);
  const igCeil = Math.ceil(igDecimal);
  const frac = igDecimal - igFloor;

  const rowFloor = tabela.find((r) => r.ig === igFloor);
  const rowCeil = tabela.find((r) => r.ig === igCeil);

  if (!rowFloor && !rowCeil) return 0;
  if (!rowFloor) return (rowCeil![campo] as number);
  if (!rowCeil || igFloor === igCeil) return (rowFloor[campo] as number);

  return (rowFloor[campo] as number) * (1 - frac) + (rowCeil[campo] as number) * frac;
}

/**
 * Determina em qual faixa de percentil um valor se enquadra.
 */
function calcularFaixaPercentil(ig: number, valor: number, tabela: typeof FMF_PESO): string {
  const p1 = interpolar(ig, tabela, "p1");
  const p3 = interpolar(ig, tabela, "p3");
  const p10 = interpolar(ig, tabela, "p10");
  const p50 = interpolar(ig, tabela, "p50");
  const p90 = interpolar(ig, tabela, "p90");
  const p97 = interpolar(ig, tabela, "p97");
  const p99 = interpolar(ig, tabela, "p99");

  if (valor < p1) return "< P1";
  if (valor < p3) return "P1–P3";
  if (valor < p10) return "P3–P10";
  if (valor < p50) return "P10–P50";
  if (valor < p90) return "P50–P90";
  if (valor < p97) return "P90–P97";
  if (valor < p99) return "P97–P99";
  return "> P99";
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
  tipo,
  tabela,
}: any) => {
  if (!active || !payload || !payload.length) return null;

  const ponto = payload.find((p: any) => p.dataKey === "valor");
  const unidade = tipo === "peso" ? "g" : "mm";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">IG: {Number(label).toFixed(1)} semanas</p>
      {ponto && ponto.value != null && (
        <>
          <p className="text-blue-700 font-bold">
            {tipo === "peso" ? "Peso Fetal" : "CA"}: {ponto.value} {unidade}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Percentil: {calcularFaixaPercentil(Number(label), ponto.value, tabela)}
          </p>
        </>
      )}
    </div>
  );
};

// ─── Label customizado para os pontos medidos ─────────────────────────────────

const CustomLabel = (props: any) => {
  const { x, y, value, tipo } = props;
  if (value == null) return null;
  const unidade = tipo === "peso" ? "g" : "mm";
  return (
    <text
      x={x}
      y={y - 10}
      textAnchor="middle"
      fontSize={11}
      fontWeight="600"
      fill="#1d4ed8"
    >
      {value}{unidade}
    </text>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoCrescimentoFetal({
  tipo,
  pontos,
  dataUltrassom,
  igUltrassomSemanas,
  igUltrassomDias = 0,
}: Props) {
  const tabela = tipo === "peso" ? FMF_PESO : FMF_CA;
  const igMin = tipo === "peso" ? 22 : 20;
  const igMax = 40;
  const unidade = tipo === "peso" ? "g" : "mm";
  const titulo = tipo === "peso" ? "Peso Fetal Estimado (g)" : "Circunferência Abdominal (mm)";

  // ── Construir dados das curvas de referência ──────────────────────────────
  const curvas = tabela.map((row) => ({
    ig: row.ig,
    p1: row.p1,
    p3: row.p3,
    p10: row.p10,
    p50: row.p50,
    p90: row.p90,
    p97: row.p97,
    p99: row.p99,
    // Faixas para áreas coloridas (recharts Area usa [min, max])
    faixaVerde: [row.p10, row.p90] as [number, number],
    faixaAmareloInf: [row.p3, row.p10] as [number, number],
    faixaAmareloSup: [row.p90, row.p97] as [number, number],
    faixaVermelhoInf: [row.p1, row.p3] as [number, number],
    faixaVermelhoSup: [row.p97, row.p99] as [number, number],
  }));

  // ── Calcular pontos medidos com IG pelo 1º US ─────────────────────────────
  const pontosMedidos = pontos
    .filter((p) => p.dataExame && p.valor > 0)
    .map((p) => {
      const ig = calcularIGPeloUS(
        p.dataExame,
        dataUltrassom,
        igUltrassomSemanas,
        igUltrassomDias
      );
      return { ig: parseFloat(ig.toFixed(2)), valor: p.valor };
    })
    .filter((p) => p.ig >= igMin - 1 && p.ig <= igMax + 1)
    .sort((a, b) => a.ig - b.ig);

  // ── Determinar cor de cada ponto (para o dot) ─────────────────────────────
  const getCorPonto = (ig: number, valor: number): string => {
    const p3 = interpolar(ig, tabela, "p3");
    const p10 = interpolar(ig, tabela, "p10");
    const p90 = interpolar(ig, tabela, "p90");
    const p97 = interpolar(ig, tabela, "p97");

    if (valor >= p10 && valor <= p90) return "#16a34a"; // verde
    if ((valor >= p3 && valor < p10) || (valor > p90 && valor <= p97)) return "#ca8a04"; // amarelo
    return "#dc2626"; // vermelho
  };

  // ── Merge de dados para o gráfico (curvas + pontos) ──────────────────────
  const igTicks = tabela.map((r) => r.ig);
  const curvaMap = new Map(curvas.map((c) => [c.ig, c]));

  const todasIGs = Array.from(
    new Set([...igTicks, ...pontosMedidos.map((p) => p.ig)])
  ).sort((a, b) => a - b);

  const dadosGrafico = todasIGs.map((ig) => {
    const curva = curvaMap.get(ig);
    const ponto = pontosMedidos.find((p) => p.ig === ig);

    if (curva) {
      return {
        ig,
        p1: curva.p1,
        p3: curva.p3,
        p10: curva.p10,
        p50: curva.p50,
        p90: curva.p90,
        p97: curva.p97,
        p99: curva.p99,
        faixaVerde: curva.faixaVerde,
        faixaAmareloInf: curva.faixaAmareloInf,
        faixaAmareloSup: curva.faixaAmareloSup,
        faixaVermelhoInf: curva.faixaVermelhoInf,
        faixaVermelhoSup: curva.faixaVermelhoSup,
        valor: ponto?.valor,
      };
    }

    // Ponto em IG decimal (interpolado)
    const p1i = interpolar(ig, tabela, "p1");
    const p3i = interpolar(ig, tabela, "p3");
    const p10i = interpolar(ig, tabela, "p10");
    const p50i = interpolar(ig, tabela, "p50");
    const p90i = interpolar(ig, tabela, "p90");
    const p97i = interpolar(ig, tabela, "p97");
    const p99i = interpolar(ig, tabela, "p99");

    return {
      ig,
      p1: p1i,
      p3: p3i,
      p10: p10i,
      p50: p50i,
      p90: p90i,
      p97: p97i,
      p99: p99i,
      faixaVerde: [p10i, p90i] as [number, number],
      faixaAmareloInf: [p3i, p10i] as [number, number],
      faixaAmareloSup: [p90i, p97i] as [number, number],
      faixaVermelhoInf: [p1i, p3i] as [number, number],
      faixaVermelhoSup: [p97i, p99i] as [number, number],
      valor: ponto?.valor,
    };
  });

  // ── Domínio do eixo Y ─────────────────────────────────────────────────────
  const yMin = tabela[0].p1 * 0.9;
  const yMax = tabela[tabela.length - 1].p99 * 1.05;

  const temDados = pontosMedidos.length > 0;

  return (
    <div className="w-full">
      {!temDados && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum dado de{" "}
          {tipo === "peso" ? "peso fetal" : "circunferência abdominal"}{" "}
          registrado nos ultrassons.
        </p>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={dadosGrafico}
          margin={{ top: 24, right: 30, left: 10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="ig"
            type="number"
            domain={[igMin, igMax]}
            ticks={igTicks}
            tickFormatter={(v) => `${v}s`}
            label={{
              value: "Idade Gestacional (semanas)",
              position: "insideBottom",
              offset: -10,
              fontSize: 12,
              fill: "#6b7280",
            }}
          />

          <YAxis
            domain={[Math.round(yMin), Math.round(yMax)]}
            tickFormatter={(v) => `${v}`}
            label={{
              value: titulo,
              angle: -90,
              position: "insideLeft",
              offset: 10,
              fontSize: 11,
              fill: "#6b7280",
            }}
            width={65}
          />

          <Tooltip content={<CustomTooltip tipo={tipo} tabela={tabela} />} />

          {/* ── Faixas coloridas ── */}

          {/* Vermelho inferior: P1–P3 */}
          <Area
            dataKey="faixaVermelhoInf"
            stroke="none"
            fill="#fca5a5"
            fillOpacity={0.5}
            isAnimationActive={false}
            legendType="none"
            name="P1–P3"
          />

          {/* Amarelo inferior: P3–P10 */}
          <Area
            dataKey="faixaAmareloInf"
            stroke="none"
            fill="#fde68a"
            fillOpacity={0.6}
            isAnimationActive={false}
            legendType="none"
            name="P3–P10"
          />

          {/* Verde: P10–P90 */}
          <Area
            dataKey="faixaVerde"
            stroke="none"
            fill="#86efac"
            fillOpacity={0.5}
            isAnimationActive={false}
            legendType="none"
            name="P10–P90"
          />

          {/* Amarelo superior: P90–P97 */}
          <Area
            dataKey="faixaAmareloSup"
            stroke="none"
            fill="#fde68a"
            fillOpacity={0.6}
            isAnimationActive={false}
            legendType="none"
            name="P90–P97"
          />

          {/* Vermelho superior: P97–P99 */}
          <Area
            dataKey="faixaVermelhoSup"
            stroke="none"
            fill="#fca5a5"
            fillOpacity={0.5}
            isAnimationActive={false}
            legendType="none"
            name="P97–P99"
          />

          {/* ── Linhas de percentil ── */}
          <Line
            dataKey="p10"
            stroke="#16a34a"
            strokeWidth={1}
            strokeDasharray="4 2"
            dot={false}
            isAnimationActive={false}
            name="P10"
          />
          <Line
            dataKey="p90"
            stroke="#16a34a"
            strokeWidth={1}
            strokeDasharray="4 2"
            dot={false}
            isAnimationActive={false}
            name="P90"
          />
          <Line
            dataKey="p3"
            stroke="#ca8a04"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
            name="P3"
          />
          <Line
            dataKey="p97"
            stroke="#ca8a04"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
            name="P97"
          />
          <Line
            dataKey="p1"
            stroke="#dc2626"
            strokeWidth={1}
            strokeDasharray="2 3"
            dot={false}
            isAnimationActive={false}
            name="P1"
          />
          <Line
            dataKey="p99"
            stroke="#dc2626"
            strokeWidth={1}
            strokeDasharray="2 3"
            dot={false}
            isAnimationActive={false}
            name="P99"
          />

          {/* ── Linha de mediana P50 ── */}
          <Line
            dataKey="p50"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            isAnimationActive={false}
            name="P50 (Mediana)"
          />

          {/* ── Pontos medidos com rótulos de valor ── */}
          {temDados && (
            <Line
              dataKey="valor"
              stroke="#1d4ed8"
              strokeWidth={0}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.valor == null) return <g key={`dot-empty-${cx}`} />;
                const cor = getCorPonto(payload.ig, payload.valor);
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill={cor}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8 }}
              connectNulls={false}
              isAnimationActive={false}
              name={tipo === "peso" ? `Peso (${unidade})` : `CA (${unidade})`}
            >
              <LabelList
                dataKey="valor"
                content={(props: any) => <CustomLabel {...props} tipo={tipo} />}
              />
            </Line>
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legenda manual das faixas */}
      <div className="flex flex-wrap gap-4 justify-center mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded" style={{ background: "#86efac", opacity: 0.8 }} />
          <span>P10–P90 (Normal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded" style={{ background: "#fde68a", opacity: 0.9 }} />
          <span>P3–P10 / P90–P97 (Atenção)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-3 rounded" style={{ background: "#fca5a5", opacity: 0.8 }} />
          <span>P1–P3 / P97–P99 (Alerta)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-8 h-0.5 rounded" style={{ background: "#6366f1" }} />
          <span>P50 (Mediana)</span>
        </div>
        {temDados && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-1 rounded" style={{ background: "#1d4ed8" }} />
            <span>{tipo === "peso" ? "Peso medido" : "CA medida"}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-2">
        Curvas FMF (Fetal Medicine Foundation) — IG calculada pelo 1º ultrassom do cadastro
      </p>
    </div>
  );
}
