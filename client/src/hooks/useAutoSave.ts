import { useEffect, useRef, useState } from 'react';

/**
 * Hook para salvamento automático de dados do formulário no localStorage
 * 
 * @param key - Chave única para identificar o rascunho no localStorage
 * @param data - Dados atuais do formulário
 * @param delay - Delay em ms antes de salvar (debounce), padrão 500ms
 * @returns {
 *   savedAt: timestamp do último salvamento,
 *   clearDraft: função para limpar o rascunho,
 *   loadDraft: função para carregar rascunho salvo
 * }
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  delay: number = 500
) {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const initialLoadRef = useRef(false);

  // Carregar rascunho salvo na primeira renderização
  const loadDraft = (): T | null => {
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAt(parsed.timestamp);
        return parsed.data;
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
    }
    return null;
  };

  // Limpar rascunho do localStorage
  const clearDraft = () => {
    try {
      localStorage.removeItem(`draft_${key}`);
      setSavedAt(null);
    } catch (error) {
      console.error('Erro ao limpar rascunho:', error);
    }
  };

  // Salvar automaticamente com debounce
  useEffect(() => {
    // Não salvar na primeira renderização (evitar sobrescrever com dados vazios)
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Agendar salvamento
    timeoutRef.current = setTimeout(() => {
      try {
        const timestamp = Date.now();
        localStorage.setItem(
          `draft_${key}`,
          JSON.stringify({ data, timestamp })
        );
        setSavedAt(timestamp);
      } catch (error) {
        console.error('Erro ao salvar rascunho:', error);
      }
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay]);

  return {
    savedAt,
    clearDraft,
    loadDraft,
  };
}
