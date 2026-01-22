import { getGestanteById, getConsultasByGestanteId, getFatoresRiscoByGestanteId, getMedicamentosByGestanteId, getResultadosExamesByGestanteId } from './db';
import { buscarUltrassons } from './ultrassons';
import { Gestante, ConsultaPrenatal, FatorRisco, MedicamentoGestacao, ExameLaboratorial, Ultrassom, ResultadoExame } from '../drizzle/schema';

// Interface para exames agrupados por trimestre
export interface ExameAgrupado {
  nome: string;
  trimestre1: { data: string | null; resultado: string | null };
  trimestre2: { data: string | null; resultado: string | null };
  trimestre3: { data: string | null; resultado: string | null };
}

// Interface para marcos importantes
export interface MarcoImportante {
  titulo: string;
  semanaInicio: number;
  semanaFim: number;
  dataEstimada: string | null;
  status: 'pendente' | 'atual' | 'concluido';
}

export interface DadosCartaoPrenatal {
  gestante: Gestante;
  consultas: ConsultaPrenatal[];
  fatoresRisco: FatorRisco[];
  medicamentos: MedicamentoGestacao[];
  examesAgrupados: ExameAgrupado[];
  ultrassons: Ultrassom[];
  marcos: MarcoImportante[];
}

/**
 * Agrupa exames laboratoriais por trimestre
 */
function agruparExamesPorTrimestre(exames: ResultadoExame[]): ExameAgrupado[] {
  // Lista de exames padrão
  const nomesExames = [
    'Hemograma',
    'Tipo Sanguíneo',
    'Glicemia Jejum',
    'TSH',
    'T4 Livre',
    'Uréia',
    'Creatinina',
    'TGO',
    'TGP',
    'Urina I',
    'Urocultura',
    'HIV',
    'VDRL',
    'Hepatite B (HBsAg)',
    'Hepatite C (Anti-HCV)',
    'Toxoplasmose IgG',
    'Toxoplasmose IgM',
    'Rubéola IgG',
    'Rubéola IgM',
    'CMV IgG',
    'CMV IgM',
    'Coombs Indireto',
    'TOTG 75g',
    'Estreptococo Grupo B',
  ];

  const resultado: ExameAgrupado[] = nomesExames.map(nome => ({
    nome,
    trimestre1: { data: null, resultado: null },
    trimestre2: { data: null, resultado: null },
    trimestre3: { data: null, resultado: null },
  }));

  // Mapear exames do banco para o formato agrupado
  // A tabela resultadosExames tem: nomeExame, trimestre (1, 2 ou 3), resultado, dataExame
  exames.forEach(exame => {
    const index = resultado.findIndex(e => 
      e.nome.toLowerCase().includes(exame.nomeExame.toLowerCase()) ||
      exame.nomeExame.toLowerCase().includes(e.nome.toLowerCase())
    );
    
    if (index !== -1) {
      // Usar o trimestre diretamente do banco (1, 2 ou 3)
      const trimestre = exame.trimestre;
      const key = `trimestre${trimestre}` as 'trimestre1' | 'trimestre2' | 'trimestre3';
      resultado[index][key] = {
        data: exame.dataExame ? (typeof exame.dataExame === 'string' ? exame.dataExame : exame.dataExame.toISOString().split('T')[0]) : null,
        resultado: exame.resultado,
      };
    }
  });

  // Filtrar apenas exames que têm algum resultado
  return resultado.filter(e => 
    e.trimestre1.resultado || e.trimestre2.resultado || e.trimestre3.resultado
  );
}

/**
 * Calcula marcos importantes baseado na DUM ou ultrassom
 */
function calcularMarcos(gestante: Gestante): MarcoImportante[] {
  // Determinar data base para cálculo
  let dataBase: Date | null = null;
  let igBaseSemanas = 0;
  let igBaseDias = 0;

  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
    dataBase = new Date(gestante.dataUltrassom + 'T12:00:00');
    igBaseSemanas = gestante.igUltrassomSemanas;
    igBaseDias = gestante.igUltrassomDias || 0;
  } else if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
    dataBase = new Date(gestante.dum + 'T12:00:00');
    igBaseSemanas = 0;
    igBaseDias = 0;
  }

  if (!dataBase) return [];

  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  // Calcular IG atual
  const diffMs = hoje.getTime() - dataBase.getTime();
  const diasDesdeBase = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDias = (igBaseSemanas * 7) + igBaseDias + diasDesdeBase;
  const igAtualSemanas = Math.floor(totalDias / 7);

  // Definir marcos
  const marcosDefinidos = [
    { titulo: '1º Ultrassom', semanaInicio: 6, semanaFim: 9 },
    { titulo: 'Morfológico 1º Tri', semanaInicio: 11, semanaFim: 14 },
    { titulo: 'Morfológico 2º Tri', semanaInicio: 20, semanaFim: 24 },
    { titulo: 'TOTG 75g', semanaInicio: 24, semanaFim: 28 },
    { titulo: 'Ecocardiograma Fetal', semanaInicio: 24, semanaFim: 28 },
    { titulo: 'Vacina dTpa', semanaInicio: 27, semanaFim: 36 },
    { titulo: 'Estreptococo Grupo B', semanaInicio: 35, semanaFim: 37 },
    { titulo: 'Termo de Gestação', semanaInicio: 37, semanaFim: 42 },
  ];

  // Calcular data estimada e status de cada marco
  return marcosDefinidos.map(marco => {
    // Calcular data estimada (semana de início)
    const diasAteSemanaInicio = ((marco.semanaInicio - igBaseSemanas) * 7) - igBaseDias;
    const dataEstimada = new Date(dataBase!.getTime() + (diasAteSemanaInicio * 24 * 60 * 60 * 1000));

    let status: 'pendente' | 'atual' | 'concluido' = 'pendente';
    if (igAtualSemanas >= marco.semanaFim) {
      status = 'concluido';
    } else if (igAtualSemanas >= marco.semanaInicio) {
      status = 'atual';
    }

    return {
      ...marco,
      dataEstimada: dataEstimada.toISOString().split('T')[0],
      status,
    };
  });
}

/**
 * Busca todos os dados necessários para gerar o cartão pré-natal
 */
export async function buscarDadosCartaoPrenatal(gestanteId: number): Promise<DadosCartaoPrenatal> {
  const gestante = await getGestanteById(gestanteId);
  if (!gestante) {
    throw new Error(`Gestante com ID ${gestanteId} não encontrada`);
  }

  const [consultas, fatoresRisco, medicamentos, exames, ultrassons] = await Promise.all([
    getConsultasByGestanteId(gestanteId),
    getFatoresRiscoByGestanteId(gestanteId),
    getMedicamentosByGestanteId(gestanteId),
    getResultadosExamesByGestanteId(gestanteId),
    buscarUltrassons(gestanteId),
  ]);

  // Agrupar exames por trimestre
  const examesAgrupados = agruparExamesPorTrimestre(exames);

  // Calcular marcos importantes
  const marcos = calcularMarcos(gestante);

  return {
    gestante,
    consultas,
    fatoresRisco,
    medicamentos,
    examesAgrupados,
    ultrassons,
    marcos,
  };
}
