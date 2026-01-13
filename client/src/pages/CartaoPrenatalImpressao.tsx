import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { GraficoPeso } from "@/components/GraficoPeso";
import { Loader2 } from "lucide-react";

export default function CartaoPrenatalImpressao() {
  const params = useParams<{ gestanteId: string }>();
  const gestanteId = parseInt(params.gestanteId || "0");
  const [isLoading, setIsLoading] = useState(true);

  // Queries para buscar todos os dados
  const { data: gestante } = trpc.gestantes.get.useQuery({ id: gestanteId });
  const { data: consultas = [] } = trpc.consultasPrenatal.list.useQuery({ gestanteId });
  const { data: ultrassons = [] } = trpc.ultrassons.buscar.useQuery({ gestanteId });
  const { data: exames = [] } = trpc.examesLab.buscar.useQuery({ gestanteId });
  const { data: fatoresRisco = [] } = trpc.fatoresRisco.list.useQuery({ gestanteId });
  const { data: medicamentos = [] } = trpc.medicamentos.list.useQuery({ gestanteId });
  // const { data: marcos = [] } = trpc.marcos.list.useQuery({ gestanteId });

  useEffect(() => {
    if (gestante && consultas) {
      setIsLoading(false);
      // Adicionar sinal no DOM para Puppeteer saber que dados foram carregados
      setTimeout(() => {
        document.body.setAttribute('data-content-loaded', 'true');
      }, 100);
    }
  }, [gestante, consultas]);

  // Funções auxiliares (copiadas EXATAMENTE da página normal)
  const formatarData = (data: Date | string) => {
    // Adicionar T12:00:00 para evitar problemas de fuso horário
    const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    const d = new Date(dataStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const calcularIG = (dataConsulta: string) => {
    if (!gestante?.dum) return null;
    
    const dum = new Date(gestante.dum);
    const consulta = new Date(dataConsulta);
    
    // Validar se as datas são válidas
    if (isNaN(dum.getTime()) || isNaN(consulta.getTime())) return null;
    
    const diffMs = consulta.getTime() - dum.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    
    // Validar se os valores calculados são válidos
    if (isNaN(semanas) || isNaN(dias)) return null;
    
    return { semanas, dias };
  };

  const calcularIGPorUS = (dataConsulta: string) => {
    if (!gestante?.dataUltrassom || gestante?.igUltrassomSemanas === null) return null;
    
    const ultrassom = new Date(gestante.dataUltrassom);
    const consulta = new Date(dataConsulta);
    
    if (isNaN(ultrassom.getTime()) || isNaN(consulta.getTime())) return null;
    
    const diffMs = consulta.getTime() - ultrassom.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalDiasUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diasDesdeUS;
    const semanas = Math.floor(totalDiasUS / 7);
    const dias = totalDiasUS % 7;
    
    if (isNaN(semanas) || isNaN(dias)) return null;
    
    return { semanas, dias };
  };

  const handleImprimir = () => {
    window.print();
  };

  if (isLoading || !gestante) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 print:p-0" data-pdf-ready="true">
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          @page { 
            margin: 1cm;
            size: A4;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      
      {/* Estilos globais para remover cabeçalhos e rodapés do navegador */}
      <style>{`
        @page {
          margin: 1cm;
          size: A4;
        }
      `}</style>

      {/* Botão de imprimir */}
      <div className="fixed top-4 right-4 no-print z-50">
        <button
          onClick={handleImprimir}
          className="bg-[#6B4226] hover:bg-[#5a3620] text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      {/* Logo e Título */}
      <div className="text-center mb-8">
        <img 
          src="/logo-horizontal.png" 
          alt="Mais Mulher" 
          className="mx-auto h-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-[#6B4226] border-b-2 border-[#6B4226] pb-2">
          Cartão de Pré-Natal
        </h1>
      </div>

      {/* Dados da Gestante */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Dados da Gestante</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-semibold">Nome:</span>
            <div>{gestante.nome}</div>
          </div>
          <div>
            <span className="font-semibold">Idade:</span>
            <div>-</div>
          </div>
          <div>
            <span className="font-semibold">Telefone:</span>
            <div>{gestante.telefone || "-"}</div>
          </div>
          <div>
            <span className="font-semibold">DUM:</span>
            <div>{gestante.dum === "Incerta" || gestante.dum === "Incompatível com US" ? gestante.dum : (gestante.dum ? formatarData(gestante.dum) : "-")}</div>
          </div>
          <div>
            <span className="font-semibold">DPP pela DUM:</span>
            <div>{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</div>
          </div>
          <div>
            <span className="font-semibold">História Obstétrica:</span>
            <div>G{gestante.gesta || 0}P{gestante.para || 0}A{gestante.abortos || 0}</div>
          </div>
          <div className="col-span-3 border-t pt-4 mt-2">
            <div className="font-semibold text-base mb-2">Dados do Ultrassom</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">Data do Ultrassom:</span>
                <div>{gestante.dataUltrassom ? formatarData(gestante.dataUltrassom) : "-"}</div>
              </div>
              <div>
                <span className="font-semibold">IG no Ultrassom:</span>
                <div>{gestante.igUltrassomSemanas !== null ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias || 0}d` : "-"}</div>
              </div>
              <div>
                <span className="font-semibold">DPP pelo Ultrassom:</span>
                <div>{gestante.calculado?.dppUS ? formatarData(gestante.calculado.dppUS) : "-"}</div>
              </div>
            </div>
          </div>
          <div>
            <span className="font-semibold">Tipo de Parto Desejado:</span>
            <div>{gestante.tipoPartoDesejado || "-"}</div>
          </div>
          <div>
            <span className="font-semibold">Médico Responsável:</span>
            <div>-</div>
          </div>
          <div>
            <span className="font-semibold">Plano de Saúde:</span>
            <div>-</div>
          </div>
        </div>
      </div>

      {/* Fatores de Risco */}
      {fatoresRisco && fatoresRisco.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Fatores de Risco</h2>
          <div className="flex flex-wrap gap-2">
            {fatoresRisco.map((fator: any) => (
              <span key={fator.id} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                {fator.tipo.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Medicamentos em Uso */}
      {medicamentos && medicamentos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Medicamentos em Uso</h2>
          <div className="flex flex-wrap gap-2">
            {medicamentos.map((med: any) => (
              <span key={med.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {med.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Consultas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Histórico de Consultas</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-2 py-2 text-left">Data</th>
                <th className="border border-gray-300 px-2 py-2 text-left">IG DUM</th>
                <th className="border border-gray-300 px-2 py-2 text-left">IG US</th>
                <th className="border border-gray-300 px-2 py-2 text-left">Peso (kg)</th>
                <th className="border border-gray-300 px-2 py-2 text-left">PA</th>
                <th className="border border-gray-300 px-2 py-2 text-left">AU (cm)</th>
                <th className="border border-gray-300 px-2 py-2 text-left">BCF</th>
                <th className="border border-gray-300 px-2 py-2 text-left">MF</th>
                <th className="border border-gray-300 px-2 py-2 text-left">Conduta</th>
                <th className="border border-gray-300 px-2 py-2 text-left">Observações</th>
              </tr>
            </thead>
            <tbody>
              {consultas.map((consulta: any) => {
                const igDUM = calcularIG(consulta.dataConsulta);
                const igUS = gestante?.dataUltrassom ? calcularIGPorUS(consulta.dataConsulta) : null;
                return (
                  <tr key={consulta.id}>
                    <td className="border border-gray-300 px-2 py-2">
                      {formatarData(consulta.dataConsulta)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {igUS ? `${igUS.semanas}s ${igUS.dias}d` : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.peso ? (consulta.peso / 1000).toFixed(1) : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.pressaoArterial || "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.alturaUterina === -1 ? "Não palpável" : (consulta.alturaUterina ? (consulta.alturaUterina / 10).toFixed(0) + " cm" : "-")}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.bcf === 1 ? "Sim" : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.mf === 1 ? "Sim" : "-"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {(() => {
                        if (!consulta.conduta) return "-";
                        try {
                          const condutas = JSON.parse(consulta.conduta);
                          if (condutas.length === 0) return "-";
                          return condutas.join(", ");
                        } catch {
                          return consulta.conduta;
                        }
                      })()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      {consulta.observacoes || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de Peso */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Evolução de Peso Gestacional</h2>
        <GraficoPeso
          consultas={consultas.map((c: any) => {
            // Priorizar IG pelo Ultrassom, usar DUM como fallback
            const igUS = calcularIGPorUS(c.dataConsulta);
            const igDUM = calcularIG(c.dataConsulta);
            const ig = igUS || igDUM;
            return {
              data: c.dataConsulta,
              peso: c.peso / 1000,
              igSemanas: ig?.semanas || 0,
            };
          })}
          altura={gestante.altura || 0}
          pesoInicial={(gestante.pesoInicial || 0) / 1000}
          metodoCalculo={
            (gestante?.dataUltrassom && gestante?.igUltrassomSemanas !== null) 
              ? 'US' 
              : 'DUM'
          }
        />
      </div>


    </div>
  );
}
