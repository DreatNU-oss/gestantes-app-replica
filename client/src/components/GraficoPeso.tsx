import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart, Label, LabelList } from 'recharts';

interface ConsultaComIG {
  data: string;
  peso: number; // em kg
  igSemanas: number;
}

interface GraficoPesoProps {
  consultas: ConsultaComIG[];
  altura: number; // em cm
  pesoInicial: number; // em kg
  metodoCalculo: 'US' | 'DUM'; // Método usado para calcular IG
}

// Função para calcular IMC
function calcularIMC(pesoKg: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

// Função para determinar categoria de IMC
function getCategoriaIMC(imc: number): 'baixo' | 'adequado' | 'sobrepeso' | 'obesidade' {
  if (imc < 18.5) return 'baixo';
  if (imc < 25) return 'adequado';
  if (imc < 30) return 'sobrepeso';
  return 'obesidade';
}

// Taxas semanais de ganho de peso (kg/semana) para 2º e 3º trimestres
const TAXAS_GANHO: Record<string, { min: number; max: number }> = {
  baixo: { min: 0.44, max: 0.58 },
  adequado: { min: 0.35, max: 0.50 },
  sobrepeso: { min: 0.23, max: 0.33 },
  obesidade: { min: 0.17, max: 0.27 },
};

// Ganho no 1º trimestre (semanas 0-13)
const GANHO_PRIMEIRO_TRI = { min: 0.5, max: 2.0 };

// Função para calcular faixa ideal de peso por semana
function calcularFaixaIdeal(
  semana: number,
  pesoInicial: number,
  categoria: 'baixo' | 'adequado' | 'sobrepeso' | 'obesidade'
): { min: number; max: number } {
  if (semana <= 13) {
    // Primeiro trimestre: ganho pequeno e linear
    const proporcao = semana / 13;
    return {
      min: pesoInicial + (GANHO_PRIMEIRO_TRI.min * proporcao),
      max: pesoInicial + (GANHO_PRIMEIRO_TRI.max * proporcao),
    };
  }

  // Segundo e terceiro trimestres
  const semanasApos13 = semana - 13;
  const ganhoTri1 = (GANHO_PRIMEIRO_TRI.min + GANHO_PRIMEIRO_TRI.max) / 2; // média do 1º tri
  const taxas = TAXAS_GANHO[categoria];

  return {
    min: pesoInicial + ganhoTri1 + (taxas.min * semanasApos13),
    max: pesoInicial + ganhoTri1 + (taxas.max * semanasApos13),
  };
}

export function GraficoPeso({ consultas, altura, pesoInicial, metodoCalculo }: GraficoPesoProps) {
  if (!altura || !pesoInicial || consultas.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>Dados insuficientes para gerar o gráfico de peso.</p>
        <p className="text-sm mt-2">
          É necessário cadastrar altura, peso inicial e ter pelo menos uma consulta registrada.
        </p>
      </div>
    );
  }

  const imc = calcularIMC(pesoInicial, altura);
  const categoria = getCategoriaIMC(imc);

  // Cores por categoria
  const coresCategoria: Record<string, { faixa: string; linha: string; nome: string }> = {
    baixo: { faixa: '#93c5fd', linha: '#3b82f6', nome: 'Baixo Peso' },
    adequado: { faixa: '#86efac', linha: '#22c55e', nome: 'Peso Adequado' },
    sobrepeso: { faixa: '#fde047', linha: '#eab308', nome: 'Sobrepeso' },
    obesidade: { faixa: '#fca5a5', linha: '#ef4444', nome: 'Obesidade' },
  };

  const cor = coresCategoria[categoria];

  // Gerar dados da faixa ideal (semana 0 até 42)
  const dadosFaixa = [];
  for (let semana = 0; semana <= 42; semana++) {
    const faixa = calcularFaixaIdeal(semana, pesoInicial, categoria);
    dadosFaixa.push({
      semana,
      pesoMin: faixa.min,
      pesoMax: faixa.max,
    });
  }

  // Combinar dados reais com faixa ideal
  // Quando houver múltiplas consultas na mesma semana, usar a mais recente
  const dadosGrafico = dadosFaixa.map((faixa) => {
    const consultasNaSemana = consultas.filter((c) => c.igSemanas === faixa.semana);
    
    // Se houver múltiplas consultas, ordenar por data e pegar a última
    let consultaNaSemana = null;
    if (consultasNaSemana.length > 0) {
      consultasNaSemana.sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        return dataB - dataA; // Ordem decrescente (mais recente primeiro)
      });
      consultaNaSemana = consultasNaSemana[0];
    }
    
    return {
      ...faixa,
      pesoReal: consultaNaSemana?.peso || null,
    };
  });

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Curva de Ganho de Peso Gestacional</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            metodoCalculo === 'US' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {metodoCalculo === 'US' ? '📊 IG pelo Ultrassom' : '📅 IG pela DUM'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          IMC pré-gestacional: <strong>{imc.toFixed(1)}</strong> ({cor.nome})
        </p>
        <p className="text-sm text-muted-foreground">
          Altura: {altura} cm | Peso inicial: {pesoInicial.toFixed(1)} kg
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={dadosGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="semana"
            label={{ value: 'Semana de Gestação', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
            domain={[pesoInicial - 5, 'dataMax + 5']}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                
                // Calcular diferença se houver peso real
                let diferenca: { valor: number; tipo: 'acima' | 'abaixo' | 'normal' } | null = null;
                if (data.pesoReal) {
                  if (data.pesoReal > data.pesoMax) {
                    diferenca = {
                      valor: data.pesoReal - data.pesoMax,
                      tipo: 'acima'
                    };
                  } else if (data.pesoReal < data.pesoMin) {
                    diferenca = {
                      valor: data.pesoMin - data.pesoReal,
                      tipo: 'abaixo'
                    };
                  } else {
                    diferenca = { valor: 0, tipo: 'normal' };
                  }
                }
                
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold">Semana {data.semana}</p>
                    <p className="text-sm text-muted-foreground">
                      Faixa ideal: {data.pesoMin.toFixed(1)} - {data.pesoMax.toFixed(1)} kg
                    </p>
                    {data.pesoReal && (
                      <>
                        <p className="text-sm font-semibold" style={{ color: cor.linha }}>
                          Peso real: {data.pesoReal.toFixed(1)} kg
                        </p>
                        {diferenca && diferenca.tipo !== 'normal' && (
                          <p 
                            className="text-sm font-bold mt-1"
                            style={{ 
                              color: diferenca.tipo === 'acima' ? '#ef4444' : '#f97316'
                            }}
                          >
                            {diferenca.tipo === 'acima' ? '⚠️ ' : '⚠️ '}
                            {diferenca.tipo === 'acima' 
                              ? `+${diferenca.valor.toFixed(1)} kg acima` 
                              : `-${diferenca.valor.toFixed(1)} kg abaixo`
                            }
                          </p>
                        )}
                        {diferenca && diferenca.tipo === 'normal' && (
                          <p className="text-sm font-semibold mt-1" style={{ color: '#22c55e' }}>
                            ✓ Dentro da faixa ideal
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {/* Área sombreada da faixa ideal */}
          <Area
            type="monotone"
            dataKey="pesoMax"
            stroke="none"
            fill={cor.faixa}
            fillOpacity={0.3}
            name="Faixa ideal"
          />
          <Area
            type="monotone"
            dataKey="pesoMin"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
            name=""
            legendType="none"
          />

          {/* Linhas de limite da faixa */}
          <Line
            type="monotone"
            dataKey="pesoMin"
            stroke={cor.linha}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name=""
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="pesoMax"
            stroke={cor.linha}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name=""
            legendType="none"
          />

          {/* Linha de peso real */}
          <Line
            type="monotone"
            dataKey="pesoReal"
            stroke={cor.linha}
            strokeWidth={3}
            dot={(props: any) => {
              const { cx, cy, payload, onMouseEnter, onMouseLeave } = props;
              if (!payload.pesoReal) return null;
              
              // Determinar cor do ponto baseado na posição
              let corPonto = cor.linha; // verde/azul padrão
              if (payload.pesoReal > payload.pesoMax) {
                corPonto = '#ef4444'; // vermelho se acima
              } else if (payload.pesoReal < payload.pesoMin) {
                corPonto = '#f97316'; // laranja se abaixo
              }
              
              return (
                <circle
                  key={`dot-${payload.semana}`}
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill={corPonto}
                  stroke="#ffffff"
                  strokeWidth={2}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  style={{ cursor: 'pointer' }}
                />
              );
            }}
            connectNulls={false}
            name="Peso real"
          >
            <LabelList
              dataKey="pesoReal"
              position="top"
              content={(props: any) => {
                const { x, y, value, index } = props;
                if (!value) return null;
                
                const payload = dadosGrafico[index];
                if (!payload || !payload.pesoReal) return null;
                
                // Mostrar apenas o peso
                const textoLabel = `${value.toFixed(1)} kg`;
                
                // Determinar cor baseado na posição
                let corTexto = '#22c55e'; // verde padrão
                if (payload.pesoReal > payload.pesoMax) {
                  corTexto = '#ef4444'; // vermelho se acima
                } else if (payload.pesoReal < payload.pesoMin) {
                  corTexto = '#f97316'; // laranja se abaixo
                }
                
                return (
                  <text
                    x={x}
                    y={y - 10}
                    fill={corTexto}
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {textoLabel}
                  </text>
                );
              }}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong>Legenda:</strong> A área sombreada representa a faixa ideal de ganho de peso para sua categoria de IMC.
          Os pontos mostram o peso registrado em cada consulta.
        </p>
      </div>
    </div>
  );
}
