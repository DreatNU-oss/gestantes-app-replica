import { useEffect } from 'react';

/**
 * Hook para salvamento instantâneo (sem debounce) de campos críticos no localStorage
 * Usado para campos como nome, data, CPF que devem ser salvos imediatamente
 * 
 * @param key - Chave única para identificar o rascunho no localStorage
 * @param value - Valor atual do campo crítico
 * @param enabled - Se o salvamento está habilitado (padrão: true)
 */
export function useInstantSave(
  key: string,
  value: any,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || value === undefined || value === null) {
      return;
    }

    try {
      // Salvar imediatamente sem debounce
      const timestamp = Date.now();
      localStorage.setItem(
        `instant_${key}`,
        JSON.stringify({ value, timestamp })
      );
    } catch (error) {
      console.error('Erro ao salvar campo crítico:', error);
    }
  }, [key, value, enabled]);

  // Função para carregar valor salvo
  const loadValue = (): any | null => {
    try {
      const saved = localStorage.getItem(`instant_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.value;
      }
    } catch (error) {
      console.error('Erro ao carregar campo crítico:', error);
    }
    return null;
  };

  // Função para limpar valor salvo
  const clearValue = () => {
    try {
      localStorage.removeItem(`instant_${key}`);
    } catch (error) {
      console.error('Erro ao limpar campo crítico:', error);
    }
  };

  return {
    loadValue,
    clearValue,
  };
}
