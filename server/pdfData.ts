import { getGestanteById, getConsultasByGestanteId, getFatoresRiscoByGestanteId, getMedicamentosByGestanteId } from './db';
import { Gestante, ConsultaPrenatal, FatorRisco, MedicamentoGestacao } from '../drizzle/schema';

export interface DadosCartaoPrenatal {
  gestante: Gestante;
  consultas: ConsultaPrenatal[];
  fatoresRisco: FatorRisco[];
  medicamentos: MedicamentoGestacao[];
}

/**
 * Busca todos os dados necessários para gerar o cartão pré-natal
 */
export async function buscarDadosCartaoPrenatal(gestanteId: number): Promise<DadosCartaoPrenatal> {
  const gestante = await getGestanteById(gestanteId);
  if (!gestante) {
    throw new Error(`Gestante com ID ${gestanteId} não encontrada`);
  }

  const [consultas, fatoresRisco, medicamentos] = await Promise.all([
    getConsultasByGestanteId(gestanteId),
    getFatoresRiscoByGestanteId(gestanteId),
    getMedicamentosByGestanteId(gestanteId)
  ]);

  return {
    gestante,
    consultas,
    fatoresRisco,
    medicamentos
  };
}
