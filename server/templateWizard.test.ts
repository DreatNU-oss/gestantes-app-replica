import { describe, it, expect } from 'vitest';

// Test the template suggestion data structure and logic
// The wizard uses predefined suggestions that auto-fill form fields

interface TemplateSuggestion {
  nome: string;
  mensagem: string;
  gatilhoTipo: 'idade_gestacional' | 'evento' | 'manual';
  igSemanas?: number;
  igDias?: number;
  evento?: string;
  condicaoRhNegativo?: boolean;
}

// Replicate the suggestion data from TemplateWizard.tsx for testing
const SUGESTOES: Record<string, TemplateSuggestion[]> = {
  vacinas: [
    {
      nome: 'Lembrete Vacina dTpa',
      gatilhoTipo: 'idade_gestacional',
      igSemanas: 27,
      mensagem: 'Olá, {nome}! 💉\n\nVocê está com {ig_semanas} semanas de gestação e chegou o momento de tomar a *vacina dTpa* (tríplice bacteriana acelular).\n\nEsta vacina protege você e seu bebê contra *difteria, tétano e coqueluche*.\n\n📅 *Período recomendado:* entre 27 e 36 semanas.\n\n💉 Procure uma clínica de vacinação para agendar.\n💚 Disponível gratuitamente pelo SUS.\n\n📌 _Caso já tenha tomado, desconsidere esta mensagem._',
    },
    {
      nome: 'Vacina Anti-Rh (Imunoglobulina)',
      gatilhoTipo: 'idade_gestacional',
      igSemanas: 28,
      condicaoRhNegativo: true,
      mensagem: 'Olá, {nome}! ⚠️💉\n\nVocê está com {ig_semanas} semanas de gestação. Como seu tipo sanguíneo é *Rh negativo*, é muito importante que você receba a *Imunoglobulina Anti-Rh* nesta fase da gestação.\n\nEsta vacina previne a *sensibilização Rh*, protegendo seu bebê atual e futuras gestações.\n\n📍 Agende com {medico} para receber a imunoglobulina o mais breve possível.\n📞 Telefone: {telefone_medico}\n\nAtenciosamente,\nEquipe de Pré-Natal',
    },
  ],
  exames: [
    {
      nome: 'Lembrete Exames 1º Trimestre',
      gatilhoTipo: 'idade_gestacional',
      igSemanas: 8,
      mensagem: 'Olá, {nome}! 🔬\n\nVocê está com {ig_semanas} semanas de gestação. É hora de realizar os *exames laboratoriais do 1º trimestre*.\n\n📋 Exames recomendados:\n• Hemograma completo\n• Tipagem sanguínea e fator Rh\n• Glicemia de jejum\n• Sorologias (HIV, Sífilis, Hepatite B, Toxoplasmose, Rubéola)\n• EAS e Urocultura\n• TSH\n\n📌 _Leve a solicitação de exames na próxima consulta._',
    },
  ],
  pos_parto: [
    {
      nome: 'Orientações Pós-Cesárea',
      gatilhoTipo: 'evento',
      evento: 'pos_cesarea',
      mensagem: 'Olá, {nome}! 💜\n\nParabéns pelo nascimento do seu bebê! 🎉\n\nAlgumas orientações importantes para o pós-cesárea:\n\n🩹 *Cuidados com a cicatriz:*\n• Mantenha limpa e seca\n• Lave com água e sabão neutro\n• Evite esforço físico por 40 dias\n\n⚠️ *Sinais de alerta* (procure atendimento):\n• Febre acima de 38°C\n• Sangramento intenso\n• Dor forte na cicatriz\n• Secreção com odor forte\n\n📅 Agende sua consulta de revisão para 7-10 dias após o parto.\n\nEstamos à disposição! 💚',
    },
  ],
};

describe('Template Wizard Suggestions', () => {
  it('should have vaccine suggestions with correct structure', () => {
    const vacinas = SUGESTOES.vacinas;
    expect(vacinas).toBeDefined();
    expect(vacinas.length).toBeGreaterThanOrEqual(2);
    
    vacinas.forEach(v => {
      expect(v.nome).toBeTruthy();
      expect(v.mensagem).toBeTruthy();
      expect(v.gatilhoTipo).toBe('idade_gestacional');
      expect(v.igSemanas).toBeGreaterThan(0);
    });
  });

  it('should have Anti-Rh suggestion with condicaoRhNegativo flag', () => {
    const antiRh = SUGESTOES.vacinas.find(v => v.nome.includes('Anti-Rh'));
    expect(antiRh).toBeDefined();
    expect(antiRh!.condicaoRhNegativo).toBe(true);
    expect(antiRh!.igSemanas).toBe(28);
    expect(antiRh!.mensagem).toContain('Rh negativo');
    expect(antiRh!.mensagem).toContain('{medico}');
    expect(antiRh!.mensagem).toContain('{telefone_medico}');
  });

  it('should have dTpa suggestion without Rh condition', () => {
    const dtpa = SUGESTOES.vacinas.find(v => v.nome.includes('dTpa'));
    expect(dtpa).toBeDefined();
    expect(dtpa!.condicaoRhNegativo).toBeUndefined();
    expect(dtpa!.igSemanas).toBe(27);
  });

  it('should have exam suggestions with correct trigger type', () => {
    const exames = SUGESTOES.exames;
    expect(exames).toBeDefined();
    exames.forEach(e => {
      expect(e.gatilhoTipo).toBe('idade_gestacional');
      expect(e.igSemanas).toBeGreaterThan(0);
    });
  });

  it('should have post-partum suggestions with event trigger', () => {
    const posParto = SUGESTOES.pos_parto;
    expect(posParto).toBeDefined();
    posParto.forEach(p => {
      expect(p.gatilhoTipo).toBe('evento');
      expect(p.evento).toBeTruthy();
    });
  });

  it('should use template variables in all messages', () => {
    const allSuggestions = Object.values(SUGESTOES).flat();
    allSuggestions.forEach(s => {
      expect(s.mensagem).toContain('{nome}');
    });
  });

  it('should have valid evento values for event-based templates', () => {
    const validEventos = ['pos_cesarea', 'pos_parto_normal', 'cadastro_gestante', 'primeira_consulta'];
    const eventTemplates = Object.values(SUGESTOES).flat().filter(s => s.gatilhoTipo === 'evento');
    eventTemplates.forEach(t => {
      expect(validEventos).toContain(t.evento);
    });
  });

  it('should have IG weeks within valid range for IG-based templates', () => {
    const igTemplates = Object.values(SUGESTOES).flat().filter(s => s.gatilhoTipo === 'idade_gestacional');
    igTemplates.forEach(t => {
      expect(t.igSemanas).toBeGreaterThanOrEqual(1);
      expect(t.igSemanas).toBeLessThanOrEqual(45);
    });
  });
});

describe('Template Preview Variable Replacement', () => {
  const replacePreviewVariables = (mensagem: string): string => {
    let preview = mensagem;
    preview = preview.replace(/\{nome\}/g, 'Maria Silva');
    preview = preview.replace(/\{ig_semanas\}/g, '28');
    preview = preview.replace(/\{ig_dias\}/g, '3');
    preview = preview.replace(/\{dpp\}/g, '15/06/2026');
    preview = preview.replace(/\{medico\}/g, 'Dr. João');
    preview = preview.replace(/\{telefone_medico\}/g, '(35) 99999-0000');
    return preview;
  };

  it('should replace all variables in Anti-Rh template', () => {
    const antiRh = SUGESTOES.vacinas.find(v => v.nome.includes('Anti-Rh'))!;
    const preview = replacePreviewVariables(antiRh.mensagem);
    
    expect(preview).not.toContain('{nome}');
    expect(preview).not.toContain('{ig_semanas}');
    expect(preview).not.toContain('{medico}');
    expect(preview).not.toContain('{telefone_medico}');
    expect(preview).toContain('Maria Silva');
    expect(preview).toContain('28');
    expect(preview).toContain('Dr. João');
    expect(preview).toContain('(35) 99999-0000');
  });

  it('should replace all variables in dTpa template', () => {
    const dtpa = SUGESTOES.vacinas.find(v => v.nome.includes('dTpa'))!;
    const preview = replacePreviewVariables(dtpa.mensagem);
    
    expect(preview).not.toContain('{nome}');
    expect(preview).not.toContain('{ig_semanas}');
    expect(preview).toContain('Maria Silva');
  });
});
