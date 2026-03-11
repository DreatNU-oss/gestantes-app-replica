/**
 * Converte datas de formatos variados (dd/mm/yyyy, dd-mm-yyyy, etc.)
 * para yyyy-MM-dd (formato HTML date input)
 */
export function normalizeDateForInput(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  const trimmed = dateStr.trim();
  // Já está no formato yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // Formato dd/mm/yyyy ou dd-mm-yyyy
  const match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  // Formato yyyy/mm/dd
  const match2 = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (match2) {
    const [, year, month, day] = match2;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return trimmed; // Retorna como está se não reconhecer o formato
}

/** Campos que são do tipo date e precisam de normalização */
const dateFields = ['dataExame', 'dpp'];

/** Normaliza campos de data nos dados extraídos pela IA */
export function normalizeDadosDatas(dados: Record<string, string>): Record<string, string> {
  const normalized = { ...dados };
  for (const field of dateFields) {
    if (normalized[field]) {
      normalized[field] = normalizeDateForInput(normalized[field]);
    }
  }
  return normalized;
}
