import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { formatarParidade } from "@shared/paridade";
import { GraficoPeso } from "@/components/GraficoPeso";
import { GraficoAlturaUterina } from "@/components/GraficoAlturaUterina";
import { GraficoPressaoArterial } from "@/components/GraficoPressaoArterial";
import { GraficoCrescimentoFetal } from "@/components/GraficoCrescimentoFetal";
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
  const { data: dadosExamesPdf } = trpc.examesLab.buscarTodosParaPdf.useQuery({ gestanteId });
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
            margin-top: 0.5cm;
            margin-bottom: 0.5cm;
            size: A4;
          }
          /* Remove cabeçalhos e rodapés automáticos do navegador */
          html {
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          /* Garantir que os gráficos SVG/canvas sejam impressos corretamente */
          svg, canvas { max-width: 100% !important; }
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
            <span className="font-semibold">História Obstétrica:</span>
            <div>{formatarParidade({ gesta: gestante.gesta, para: gestante.para, partosNormais: gestante.partosNormais, cesareas: gestante.cesareas, abortos: gestante.abortos })}</div>
          </div>
          <div>
            <span className="font-semibold">DUM:</span>
            <div>{gestante.dum === "Incerta" || gestante.dum === "Incompatível com US" ? gestante.dum : (gestante.dum ? formatarData(gestante.dum) : "-")}</div>
          </div>
          <div>
            <span className="font-semibold">DPP pela DUM:</span>
            <div>{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</div>
          </div>
          <div className="col-span-3 border-t pt-4 mt-2">
            <div className="font-semibold text-base mb-2">Dados do Primeiro Ultrassom</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">Data do Primeiro Ultrassom:</span>
                <div>{gestante.dataUltrassom ? formatarData(gestante.dataUltrassom) : "-"}</div>
              </div>
              <div>
                <span className="font-semibold">IG no Primeiro Ultrassom:</span>
                <div>{gestante.igUltrassomSemanas !== null ? `${gestante.igUltrassomSemanas}s ${gestante.igUltrassomDias || 0}d` : "-"}</div>
              </div>
              <div>
                <span className="font-semibold">DPP pelo Primeiro Ultrassom:</span>
                <div>{gestante.calculado?.dppUS ? formatarData(gestante.calculado.dppUS) : "-"}</div>
              </div>
            </div>
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
            {medicamentos.map((med: any) => {
              // Mapeamento de tipos para nomes legíveis
              const tipoNomes: Record<string, string> = {
                aas: "AAS 100mg/dia",
                anti_hipertensivos: "Anti-hipertensivos",
                calcio: "Cálcio",
                enoxaparina: "Enoxaparina",
                insulina: "Insulina",
                levotiroxina: "Levotiroxina",
                medicamentos_inalatorios: "Medicamentos Inalatórios",
                polivitaminicos: "Polivitamínico gestacional",
                progestagenos: "Progestágenos",
                psicotropicos: "Psicotrópicos",
                outros: "Outros"
              };
              const nome = tipoNomes[med.tipo] || med.tipo;
              const especificacao = med.especificacao ? ` (${med.especificacao})` : "";
              return (
                <span key={med.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {nome}{especificacao}
                </span>
              );
            })}
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
                      {consulta.bcf === 1 ? "Positivo" : consulta.bcf === 0 ? "Não audível" : "-"}
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

      {/* Gráfico de Altura Uterina */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Evolução da Altura Uterina (AU)</h2>
        <GraficoAlturaUterina
          consultas={consultas.map((c: any) => {
            const igUS = calcularIGPorUS(c.dataConsulta);
            const igDUM = calcularIG(c.dataConsulta);
            return {
              id: c.id,
              dataConsulta: c.dataConsulta,
              alturaUterina: c.alturaUterina,
              igDumSemanas: igDUM?.semanas || null,
              igDumDias: igDUM?.dias || null,
              igUltrassomSemanas: igUS?.semanas || null,
              igUltrassomDias: igUS?.dias || null,
            };
          })}
          dum={gestante.dum}
        />
      </div>

      {/* Gráfico de Pressão Arterial */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Evolução da Pressão Arterial</h2>
        <GraficoPressaoArterial
          consultas={consultas.map((c: any) => {
            const igUS = calcularIGPorUS(c.dataConsulta);
            const igDUM = calcularIG(c.dataConsulta);
            return {
              id: c.id,
              dataConsulta: c.dataConsulta,
              pressaoArterial: c.pressaoArterial,
              igDumSemanas: igDUM?.semanas || null,
              igDumDias: igDUM?.dias || null,
              igUltrassomSemanas: igUS?.semanas || null,
              igUltrassomDias: igUS?.dias || null,
            };
          })}
          dum={gestante.dum}
        />
      </div>

      {/* Exames Laboratoriais - mostra TODOS os resultados por trimestre */}
      {dadosExamesPdf && Object.keys(dadosExamesPdf.todosResultados || {}).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Exames Laboratoriais</h2>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((trimestre) => {
              const todosRes = dadosExamesPdf.todosResultados || {};
              // Coletar exames que têm resultado para este trimestre
              const examesTrimestre: Array<{ nomeExame: string; resultados: Array<{ resultado: string; data: string | null }> }> = [];
              for (const [nomeExame, trimestres] of Object.entries(todosRes)) {
                const triArr = (trimestres as any)[trimestre.toString()] as Array<{ resultado: string; data: string | null }> | undefined;
                if (triArr && triArr.length > 0) {
                  const filtrados = triArr.filter(r => r.resultado && r.resultado.trim());
                  if (filtrados.length > 0) {
                    examesTrimestre.push({ nomeExame, resultados: filtrados });
                  }
                }
              }
              
              if (examesTrimestre.length === 0) return null;
              return (
                <div key={trimestre} className="border border-gray-300 rounded p-3">
                  <h3 className="font-semibold text-sm mb-2 text-center bg-gray-100 py-1 rounded">
                    {trimestre === 1 ? '1º Trimestre' : trimestre === 2 ? '2º Trimestre' : '3º Trimestre'}
                  </h3>
                  <div className="space-y-1 text-xs">
                    {examesTrimestre.map((exame) => (
                      <div key={exame.nomeExame}>
                        {exame.resultados.map((r, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium">
                              {idx === 0 ? `${exame.nomeExame.replace(/_/g, ' ')}:` : ''}
                            </span>
                            <span>
                              {r.resultado || '-'}
                              {r.data && exame.resultados.length > 1 ? (
                                <span className="text-gray-400 ml-1">
                                  ({r.data.split('-').reverse().slice(0, 2).join('/')})
                                </span>
                              ) : null}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ultrassons */}
      {ultrassons && ultrassons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Ultrassons</h2>
          <div className="space-y-4">
            {ultrassons.map((us: any) => {
              // Os dados estão no campo JSON 'dados'
              const dados = us.dados || {};
              
              // Mapeamento de tipos para nomes legíveis
              const tipoNomes: Record<string, string> = {
                'primeiro_ultrassom': '1º Ultrassom',
                'morfologico_1tri': 'Morfológico 1º Trimestre',
                'ultrassom_obstetrico': 'Ultrassom Obstétrico',
                'morfologico_2tri': 'Morfológico 2º Trimestre',
                'ecocardiograma_fetal': 'Ecocardiograma Fetal',
                'ultrassom_seguimento': 'Ultrassom de Seguimento',
              };
              
              // Mapeamento de campos para labels legíveis
              const campoLabels: Record<string, string> = {
                // 1º Ultrassom
                ccn: 'CCN',
                bcf: 'BCF',
                sacoVitelino: 'Saco Vitelino',
                hematoma: 'Hematoma/Coleções',
                corpoLuteo: 'Corpo Lúteo',
                dpp: 'DPP',
                // Morfo 1º Tri
                tn: 'Translucência Nucal',
                ductoVenoso: 'Ducto Venoso',
                valvaTricuspide: 'Valva Tricúspide',
                dopplerUterinas: 'Doppler Uterinas',
                ipsUterinas: 'IPs Uterinas',
                incisuraPresente: 'Incisura',
                coloUterino: 'Colo Uterino',
                colo: 'Colo Uterino',
                riscoTrissomias: 'Risco Trissomias',
                riscoPreEclampsia: 'Risco Pré-Eclâmpsia',
                ossoNasal: 'Osso Nasal',
                malformacoes: 'Malformações',
                // Obstétrico e Morfo 2º Tri
                biometria: 'Biometria',
                pesoEstimado: 'Peso Estimado',
                pesoFetal: 'Peso Fetal',
                placenta: 'Placenta',
                placentaLocalizacao: 'Placenta',
                grauPlacenta: 'Grau Placenta',
                placentaGrau: 'Grau Placenta',
                distanciaOCI: 'Distância ao OI',
                placentaDistanciaOI: 'Distância ao OI',
                liquidoAmniotico: 'Líquido Amniótico',
                coloUterinoTV: 'Colo Uterino (TV)',
                coloUterinoMedida: 'Medida Colo',
                morfologiaFetal: 'Morfologia Fetal',
                avaliacaoAnatomica: 'Avaliação Anatômica',
                dopplers: 'Dopplers',
                sexoFetal: 'Sexo Fetal',
                // Seguimento
                percentil: 'Percentil',
                percentilPeso: 'Percentil Peso',
                movimentosFetais: 'Movimentos Fetais',
                apresentacao: 'Apresentação',
                apresentacaoFetal: 'Apresentação',
                // Ecocardiograma
                conclusao: 'Conclusão',
                // Geral
                observacoes: 'Observações',
              };
              
              // Campos que devem ser exibidos em linha separada (textos longos)
              const camposLongos = ['biometria', 'morfologiaFetal', 'avaliacaoAnatomica', 'conclusao', 'observacoes'];
              
              // Separar campos curtos e longos
              const camposCurtos = Object.entries(dados).filter(([key]) => !camposLongos.includes(key) && dados[key]);
              const camposLongosPreenchidos = Object.entries(dados).filter(([key]) => camposLongos.includes(key) && dados[key]);
              
              return (
                <div key={us.id} className="border border-gray-300 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">
                      {tipoNomes[us.tipoUltrassom] || us.tipoUltrassom}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {us.dataExame ? new Date(us.dataExame + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                  
                  {/* IG sempre primeiro */}
                  {us.idadeGestacional && (
                    <div className="text-xs mb-2">
                      <span className="font-medium">Idade Gestacional:</span> {us.idadeGestacional}
                    </div>
                  )}
                  
                  {/* Campos curtos em grid */}
                  {camposCurtos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {camposCurtos.map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{campoLabels[key] || key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Campos longos em linhas separadas */}
                  {camposLongosPreenchidos.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                      {camposLongosPreenchidos.map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-medium">{campoLabels[key] || key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos de Crescimento Fetal */}
      {gestante && gestante.dataUltrassom && gestante.igUltrassomSemanas !== null && gestante.igUltrassomSemanas !== undefined && (() => {
        const parsePeso = (v: string | undefined | null): number => {
          if (!v) return 0;
          const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
          return isNaN(n) ? 0 : n;
        };
        const pontosPeso = (ultrassons as any[])
          .filter((us: any) => us.dataExame && us.dados?.pesoFetal)
          .map((us: any) => ({ dataExame: us.dataExame, valor: parsePeso(us.dados.pesoFetal) }))
          .filter((p: any) => p.valor > 0);

        const parseCA = (us: any): number => {
          if (us.dados?.circunferenciaAbdominal) {
            const v = parseFloat(String(us.dados.circunferenciaAbdominal).replace(/[^0-9.]/g, ''));
            if (!isNaN(v) && v > 0) return v <= 100 ? v * 10 : v;
          }
          const bio: string = us.dados?.biometria || '';
          const match = bio.match(/\bCA\s*[=:\s]?\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
          if (match) {
            const val = parseFloat(match[1]);
            const unit = (match[2] || '').toLowerCase();
            if (!isNaN(val) && val > 0) return unit === 'cm' || val <= 100 ? val * 10 : val;
          }
          return 0;
        };
        const pontosCA = (ultrassons as any[])
          .filter((us: any) => us.dataExame)
          .map((us: any) => ({ dataExame: us.dataExame, valor: parseCA(us) }))
          .filter((p: any) => p.valor > 0);

        if (pontosPeso.length === 0 && pontosCA.length === 0) return null;
        return (
          <>
            {pontosPeso.length > 0 && (
              <div className="mb-8 page-break-inside-avoid">
                <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Crescimento Fetal — Peso Estimado (FMF)</h2>
                <GraficoCrescimentoFetal
                  tipo="peso"
                  pontos={pontosPeso}
                  dataUltrassom={gestante.dataUltrassom!}
                  igUltrassomSemanas={gestante.igUltrassomSemanas!}
                  igUltrassomDias={gestante.igUltrassomDias ?? 0}
                />
                <p className="text-xs text-gray-400 mt-1 text-center">Curvas FMF — IG calculada pelo 1º ultrassom do cadastro</p>
              </div>
            )}
            {pontosCA.length > 0 && (
              <div className="mb-8 page-break-inside-avoid">
                <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Crescimento Fetal — Circunferência Abdominal (FMF)</h2>
                <GraficoCrescimentoFetal
                  tipo="ca"
                  pontos={pontosCA}
                  dataUltrassom={gestante.dataUltrassom!}
                  igUltrassomSemanas={gestante.igUltrassomSemanas!}
                  igUltrassomDias={gestante.igUltrassomDias ?? 0}
                />
                <p className="text-xs text-gray-400 mt-1 text-center">Curvas FMF — IG calculada pelo 1º ultrassom do cadastro. Valores em mm.</p>
              </div>
            )}
          </>
        );
      })()}

      {/* Marcos Importantes */}
      {gestante && (gestante.calculado?.dppUS || gestante.calculado?.dpp) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[#6B4226]">Marcos Importantes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(() => {
              // Usar DPP por US se disponível, senão usar DPP por DUM
              const dppValue = gestante.calculado?.dppUS || gestante.calculado?.dpp;
              if (!dppValue) return null;
              
              // Converter para Date - agora sempre é string
              const dppStr = String(dppValue);
              const dpp = new Date(dppStr.includes('T') ? dppStr : dppStr + 'T12:00:00');
              
              // Verificar se a data é válida
              if (isNaN(dpp.getTime())) return null;
              const marcos = [];
              
              // Concepção
              const concepcao = new Date(dpp);
              concepcao.setDate(concepcao.getDate() - 280);
              marcos.push({ titulo: "Concepção", ig: "0 semanas", data: concepcao.toLocaleDateString("pt-BR") });
              
              // Morfológico 1º Tri (11-14 semanas)
              const morf1Inicio = new Date(concepcao);
              morf1Inicio.setDate(morf1Inicio.getDate() + 77);
              const morf1Fim = new Date(concepcao);
              morf1Fim.setDate(morf1Fim.getDate() + 98);
              marcos.push({ titulo: "Morfológico 1º Tri", ig: "11-14 semanas", data: `${morf1Inicio.toLocaleDateString("pt-BR")} a ${morf1Fim.toLocaleDateString("pt-BR")}` });
              
              // 13 Semanas
              const s13 = new Date(concepcao);
              s13.setDate(s13.getDate() + 91);
              marcos.push({ titulo: "13 Semanas", ig: "13 semanas", data: s13.toLocaleDateString("pt-BR") });
              
              // Morfológico 2º Tri (20-24 semanas)
              const morf2Inicio = new Date(concepcao);
              morf2Inicio.setDate(morf2Inicio.getDate() + 140);
              const morf2Fim = new Date(concepcao);
              morf2Fim.setDate(morf2Fim.getDate() + 168);
              marcos.push({ titulo: "Morfológico 2º Tri", ig: "20-24 semanas", data: `${morf2Inicio.toLocaleDateString("pt-BR")} a ${morf2Fim.toLocaleDateString("pt-BR")}` });
              
              // Vacina dTpa (27 semanas)
              const dtpa = new Date(concepcao);
              dtpa.setDate(dtpa.getDate() + 189);
              marcos.push({ titulo: "Vacina dTpa", ig: "27 semanas", data: dtpa.toLocaleDateString("pt-BR") });
              
              // Vacina Bronquiolite (32-36 semanas)
              const bronqInicio = new Date(concepcao);
              bronqInicio.setDate(bronqInicio.getDate() + 224);
              const bronqFim = new Date(concepcao);
              bronqFim.setDate(bronqFim.getDate() + 252);
              marcos.push({ titulo: "Vacina Bronquiolite", ig: "32-36 semanas", data: `${bronqInicio.toLocaleDateString("pt-BR")} a ${bronqFim.toLocaleDateString("pt-BR")}` });
              
              // Termo Precoce (37 semanas)
              const termoPrecoce = new Date(concepcao);
              termoPrecoce.setDate(termoPrecoce.getDate() + 259);
              marcos.push({ titulo: "Termo Precoce", ig: "37 semanas", data: termoPrecoce.toLocaleDateString("pt-BR") });
              
              // Termo Completo (39 semanas)
              const termoCompleto = new Date(concepcao);
              termoCompleto.setDate(termoCompleto.getDate() + 273);
              marcos.push({ titulo: "Termo Completo", ig: "39 semanas", data: termoCompleto.toLocaleDateString("pt-BR") });
              
              // DPP (40 semanas)
              marcos.push({ titulo: "DPP", ig: "40 semanas", data: dpp.toLocaleDateString("pt-BR") });
              
              // Cores suaves para cada marco
              const cores = [
                'bg-pink-50 border-pink-200',
                'bg-purple-50 border-purple-200',
                'bg-blue-50 border-blue-200',
                'bg-indigo-50 border-indigo-200',
                'bg-green-50 border-green-200',
                'bg-teal-50 border-teal-200',
                'bg-yellow-50 border-yellow-200',
                'bg-orange-50 border-orange-200',
                'bg-red-50 border-red-200',
              ];
              
              return marcos.map((marco, index) => (
                <div key={index} className={`border rounded p-2 ${cores[index % cores.length]}`}>
                  <div className="font-semibold text-sm text-gray-800">{marco.titulo}</div>
                  <div className="text-xs text-gray-600">{marco.ig}</div>
                  <div className="text-xs font-medium text-gray-700 mt-1">{marco.data}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
