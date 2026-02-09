/**
 * Converte texto para Unicode Mathematical Bold.
 * Funciona com letras A-Z, a-z, 0-9 e caracteres acentuados do português.
 * O texto resultante aparece em negrito quando colado em qualquer sistema
 * (PEP, WhatsApp, etc.) sem precisar de Markdown.
 */

// Mapeamento de caracteres acentuados para Unicode Bold
const accentBoldMap: Record<string, string> = {
  'À': '𝐀\u0300', 'Á': '𝐀\u0301', 'Â': '𝐀\u0302', 'Ã': '𝐀\u0303',
  'È': '𝐄\u0300', 'É': '𝐄\u0301', 'Ê': '𝐄\u0302',
  'Ì': '𝐈\u0300', 'Í': '𝐈\u0301', 'Î': '𝐈\u0302',
  'Ò': '𝐎\u0300', 'Ó': '𝐎\u0301', 'Ô': '𝐎\u0302', 'Õ': '𝐎\u0303',
  'Ù': '𝐔\u0300', 'Ú': '𝐔\u0301', 'Û': '𝐔\u0302',
  'Ç': '𝐂\u0327',
  'à': '𝐚\u0300', 'á': '𝐚\u0301', 'â': '𝐚\u0302', 'ã': '𝐚\u0303',
  'è': '𝐞\u0300', 'é': '𝐞\u0301', 'ê': '𝐞\u0302',
  'ì': '𝐢\u0300', 'í': '𝐢\u0301', 'î': '𝐢\u0302',
  'ò': '𝐨\u0300', 'ó': '𝐨\u0301', 'ô': '𝐨\u0302', 'õ': '𝐨\u0303',
  'ù': '𝐮\u0300', 'ú': '𝐮\u0301', 'û': '𝐮\u0302',
  'ç': '𝐜\u0327',
};

export function toBold(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.codePointAt(0)!;
    
    // Check accent map first
    if (accentBoldMap[char]) {
      result += accentBoldMap[char];
    }
    // A-Z → 𝐀-𝐙 (U+1D400 - U+1D419)
    else if (code >= 0x41 && code <= 0x5A) {
      result += String.fromCodePoint(0x1D400 + (code - 0x41));
    }
    // a-z → 𝐚-𝐳 (U+1D41A - U+1D433)
    else if (code >= 0x61 && code <= 0x7A) {
      result += String.fromCodePoint(0x1D41A + (code - 0x61));
    }
    // 0-9 → 𝟎-𝟗 (U+1D7CE - U+1D7D7)
    else if (code >= 0x30 && code <= 0x39) {
      result += String.fromCodePoint(0x1D7CE + (code - 0x30));
    }
    // Keep everything else as-is (spaces, punctuation, etc.)
    else {
      result += char;
    }
  }
  return result;
}
