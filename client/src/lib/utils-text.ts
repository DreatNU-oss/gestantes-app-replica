/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 * Útil para buscas case-insensitive e accent-insensitive
 * 
 * @param text - Texto a ser normalizado
 * @returns Texto normalizado (sem acentos, em minúsculas)
 * 
 * @example
 * normalizeText("José María") // retorna "jose maria"
 * normalizeText("Débora Gouvêa") // retorna "debora gouvea"
 * normalizeText("Tamiris Cristina") // retorna "tamiris cristina"
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompõe caracteres acentuados (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas (acentos)
    .toLowerCase(); // Converte para minúsculas
}
