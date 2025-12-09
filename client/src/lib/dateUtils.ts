/**
 * Converte string de data (YYYY-MM-DD) para objeto Date no timezone local (meio-dia)
 * Evita problemas de timezone ao salvar datas no banco
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Converte Date ou string do banco para string YYYY-MM-DD sem problema de timezone
 * Usa apenas a parte da data, ignorando hora e timezone
 */
export function formatDateLocal(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
