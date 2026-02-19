/**
 * Testes para validação de alertas visuais de exames alterados
 * Verifica que a função validarResultado do valoresReferencia.ts
 * retorna os alertas corretos para diferentes cenários
 */
import { describe, it, expect } from 'vitest';

// Importar diretamente do arquivo de dados (client-side, mas é puro JS)
// Usamos import dinâmico com alias resolvido
import { validarResultado, TipoAlerta, VALORES_REFERENCIA, isExameSorologico } from '../client/src/data/valoresReferencia';
import { MAPEAMENTO_EXAMES, obterIdValidacao } from '../client/src/data/mapeamentoExames';

describe('Alertas de Exames - validarResultado', () => {
  describe('Tipagem sanguínea', () => {
    it('deve alertar para RH negativo', () => {
      const resultado = validarResultado('tipagem_sanguinea', 'A RH-', 1);
      expect(resultado.tipo).toBe('atencao');
      expect(resultado.mensagem).toContain('RH NEGATIVO');
    });

    it('deve ser normal para RH positivo', () => {
      const resultado = validarResultado('tipagem_sanguinea', 'O RH+', 1);
      expect(resultado.tipo).toBe('normal');
    });
  });

  describe('Coombs indireto', () => {
    it('deve alertar para Coombs positivo', () => {
      const resultado = validarResultado('coombs_indireto', 'Positivo', 1);
      expect(['anormal', 'critico', 'atencao']).toContain(resultado.tipo);
    });

    it('deve ser normal para Coombs negativo', () => {
      const resultado = validarResultado('coombs_indireto', 'Negativo', 1);
      expect(resultado.tipo).toBe('normal');
    });
  });

  describe('Sorologias', () => {
    it('deve alertar para HIV reagente', () => {
      const resultado = validarResultado('hiv', 'Reagente', 1);
      expect(resultado.tipo).not.toBe('normal');
    });

    it('deve ser normal para HIV não reagente', () => {
      const resultado = validarResultado('hiv', 'Não Reagente', 1);
      expect(resultado.tipo).toBe('normal');
    });

    it('deve alertar para Toxoplasmose IgM reagente', () => {
      const resultado = validarResultado('toxoplasmose_igm', 'Reagente', 1);
      expect(resultado.tipo).not.toBe('normal');
    });

    it('deve ser normal para Toxoplasmose IgM não reagente', () => {
      const resultado = validarResultado('toxoplasmose_igm', 'Não Reagente', 1);
      expect(resultado.tipo).toBe('normal');
    });

    it('deve alertar para VDRL reagente', () => {
      const resultado = validarResultado('vdrl', 'Reagente', 1);
      expect(resultado.tipo).not.toBe('normal');
    });

    it('deve alertar para Hepatite B reagente', () => {
      const resultado = validarResultado('hepatite_b', 'Reagente', 1);
      expect(resultado.tipo).not.toBe('normal');
    });
  });

  describe('Exames numéricos', () => {
    it('deve alertar para hemoglobina baixa', () => {
      const resultado = validarResultado('hemoglobina_hematocrito', '9.0', 1);
      // Hemoglobina < 11 é anormal na gestação
      expect(resultado.tipo).not.toBe('normal');
    });

    it('deve alertar para TSH muito alto', () => {
      const resultado = validarResultado('tsh', '10.0', 1);
      expect(resultado.tipo).not.toBe('normal');
    });

    it('deve alertar para glicemia de jejum elevada', () => {
      const resultado = validarResultado('glicemia_jejum', '100', 1);
      expect(resultado.tipo).not.toBe('normal');
    });
  });

  describe('Valores vazios e inexistentes', () => {
    it('deve retornar normal para valor vazio', () => {
      const resultado = validarResultado('hiv', '', 1);
      expect(resultado.tipo).toBe('normal');
    });

    it('deve retornar normal para valor "-"', () => {
      const resultado = validarResultado('hiv', '-', 1);
      expect(resultado.tipo).toBe('normal');
    });

    it('deve retornar normal para exame não configurado', () => {
      const resultado = validarResultado('exame_inexistente', 'qualquer valor', 1);
      expect(resultado.tipo).toBe('normal');
    });
  });
});

describe('Mapeamento de Exames para Validação', () => {
  it('deve mapear Toxoplasmose IgM corretamente', () => {
    expect(MAPEAMENTO_EXAMES['Toxoplasmose IgM']).toBe('toxoplasmose_igm');
  });

  it('deve mapear Toxoplasmose IgG corretamente', () => {
    expect(MAPEAMENTO_EXAMES['Toxoplasmose IgG']).toBe('toxoplasmose_igg');
  });

  it('deve mapear HIV corretamente', () => {
    expect(MAPEAMENTO_EXAMES['HIV']).toBe('hiv');
  });

  it('deve mapear TTGO subcampos corretamente', () => {
    expect(MAPEAMENTO_EXAMES['TTGO 75g (Curva Glicêmica)-Jejum']).toBe('ttgo_jejum');
    expect(MAPEAMENTO_EXAMES['TTGO 75g (Curva Glicêmica)-1 hora']).toBe('ttgo_1h');
    expect(MAPEAMENTO_EXAMES['TTGO 75g (Curva Glicêmica)-2 horas']).toBe('ttgo_2h');
  });

  it('deve retornar null para exame não mapeado', () => {
    expect(obterIdValidacao('Exame Inexistente')).toBeNull();
  });
});

describe('Integração: nome do exame → validação → alerta', () => {
  it('deve validar Toxoplasmose IgM Reagente como alterado', () => {
    const idValidacao = MAPEAMENTO_EXAMES['Toxoplasmose IgM'];
    expect(idValidacao).toBe('toxoplasmose_igm');
    
    const resultado = validarResultado(idValidacao, 'Reagente', 1);
    expect(resultado.tipo).not.toBe('normal');
    expect(resultado.mensagem).toBeDefined();
  });

  it('deve validar Toxoplasmose IgM Não Reagente como normal', () => {
    const idValidacao = MAPEAMENTO_EXAMES['Toxoplasmose IgM'];
    const resultado = validarResultado(idValidacao, 'Não Reagente', 1);
    expect(resultado.tipo).toBe('normal');
  });

  it('deve validar HIV Reagente como crítico', () => {
    const idValidacao = MAPEAMENTO_EXAMES['HIV'];
    const resultado = validarResultado(idValidacao, 'Reagente', 1);
    expect(resultado.tipo).not.toBe('normal');
  });

  it('deve validar Hemoglobina baixa como alterada', () => {
    const idValidacao = MAPEAMENTO_EXAMES['Hemoglobina/Hematócrito'];
    expect(idValidacao).toBe('hemoglobina_hematocrito');
    
    const resultado = validarResultado(idValidacao, '8.5', 2);
    expect(resultado.tipo).not.toBe('normal');
  });

  it('deve tratar subcampo TTGO com separador " - " convertido para "-"', () => {
    // No relatório, o nome vem como "TTGO 75g (Curva Glicêmica) - Jejum"
    // Precisa ser convertido para "TTGO 75g (Curva Glicêmica)-Jejum" para o mapeamento
    const nomeRelatorio = 'TTGO 75g (Curva Glicêmica) - Jejum';
    const nomeConvertido = nomeRelatorio.replace(' - ', '-');
    
    const idValidacao = MAPEAMENTO_EXAMES[nomeConvertido];
    expect(idValidacao).toBe('ttgo_jejum');
  });
});
