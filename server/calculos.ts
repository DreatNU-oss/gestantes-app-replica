/**
 * Funções de cálculos obstétricos compartilhadas
 */

// Calcular idade gestacional por DUM
export function calcularIdadeGestacionalPorDUM(
  dum: Date | string, 
  dataReferencia?: Date | string
): { semanas: number; dias: number; totalDias: number } {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const hoje = dataReferencia 
    ? (typeof dataReferencia === 'string' ? new Date(dataReferencia + 'T12:00:00') : dataReferencia)
    : new Date();
  
  const diffMs = hoje.getTime() - dumDate.getTime();
  const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return { semanas, dias, totalDias };
}

// Calcular idade gestacional por Ultrassom
export function calcularIdadeGestacionalPorUS(
  igUltrassomDias: number, 
  dataUltrassom: Date | string,
  dataReferencia?: Date | string
): { semanas: number; dias: number; totalDias: number } {
  const dataUS = typeof dataUltrassom === 'string' ? new Date(dataUltrassom + 'T12:00:00') : dataUltrassom;
  const hoje = dataReferencia 
    ? (typeof dataReferencia === 'string' ? new Date(dataReferencia + 'T12:00:00') : dataReferencia)
    : new Date();
  
  const diffMs = hoje.getTime() - dataUS.getTime();
  const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalDias = igUltrassomDias + diasDesdeUS;
  const semanas = Math.floor(totalDias / 7);
  const dias = totalDias % 7;
  
  return { semanas, dias, totalDias };
}

// Função unificada para calcular IG (aceita DUM ou US)
export function calcularIdadeGestacional(
  dataBase: Date | string,
  igUltrassomStr?: string | null,
  dataReferencia?: Date | string
): { semanas: number; dias: number; totalDias: number } | null {
  if (!dataBase) return null;
  
  // Se tem IG do ultrassom, usa cálculo por US
  if (igUltrassomStr) {
    const igDias = parseIGParaDias(igUltrassomStr);
    if (igDias !== null) {
      return calcularIdadeGestacionalPorUS(igDias, dataBase, dataReferencia);
    }
  }
  
  // Senão, usa cálculo por DUM
  return calcularIdadeGestacionalPorDUM(dataBase, dataReferencia);
}

// Calcular DPP por DUM
export function calcularDPP(dum: Date | string): Date {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const dpp = new Date(dumDate);
  dpp.setDate(dpp.getDate() + 280); // 40 semanas = 280 dias
  return dpp;
}

// Calcular DPP por Ultrassom
export function calcularDPPPorUS(dataUltrassom: Date | string, igUltrassomStr: string): Date | null {
  const igDias = parseIGParaDias(igUltrassomStr);
  if (igDias === null) return null;
  
  const dataUS = typeof dataUltrassom === 'string' ? new Date(dataUltrassom + 'T12:00:00') : dataUltrassom;
  const diasRestantes = 280 - igDias;
  const dpp = new Date(dataUS);
  dpp.setDate(dpp.getDate() + diasRestantes);
  return dpp;
}

// Calcular data para uma semana específica
export function calcularDataParaSemana(dum: Date | string, semanasAlvo: number): Date {
  const dumDate = typeof dum === 'string' ? new Date(dum + 'T12:00:00') : dum;
  const dataAlvo = new Date(dumDate);
  dataAlvo.setDate(dataAlvo.getDate() + (semanasAlvo * 7));
  return dataAlvo;
}

// Calcular idade a partir de data de nascimento
export function calcularIdade(dataNascimento: Date | string): number {
  const dataNasc = typeof dataNascimento === 'string' ? new Date(dataNascimento + 'T12:00:00') : dataNascimento;
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const mes = hoje.getMonth() - dataNasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < dataNasc.getDate())) {
    idade--;
  }
  return idade;
}

// Parsear string de IG (ex: "7s 2d" ou "7s2d") para dias totais
export function parseIGParaDias(igStr: string): number | null {
  if (!igStr) return null;
  
  // Formatos aceitos: "7s 2d", "7s2d", "7 2", "7+2"
  const match = igStr.match(/(\d+)\s*[s+]?\s*(\d+)?/i);
  if (!match) return null;
  
  const semanas = parseInt(match[1], 10);
  const dias = match[2] ? parseInt(match[2], 10) : 0;
  
  return semanas * 7 + dias;
}

// Formatar IG para exibição
export function formatarIG(semanas: number, dias: number): string {
  return `${semanas}s ${dias}d`;
}

// Formatar data para exibição (DD/MM/YYYY)
export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data + 'T12:00:00') : data;
  return d.toLocaleDateString('pt-BR');
}
