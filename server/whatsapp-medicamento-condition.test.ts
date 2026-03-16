import { describe, it, expect } from 'vitest';

describe('WhatsApp Scheduler - Condição de Medicamento', () => {

  it('deve ter campo condicaoMedicamento no schema de mensagemTemplates', async () => {
    const { mensagemTemplates } = await import('../drizzle/schema');
    expect(mensagemTemplates.condicaoMedicamento).toBeDefined();
  });

  it('deve ter tabela medicamentosGestacao com tipo "aas"', async () => {
    const { medicamentosGestacao } = await import('../drizzle/schema');
    expect(medicamentosGestacao).toBeDefined();
    expect(medicamentosGestacao.tipo).toBeDefined();
    expect(medicamentosGestacao.ativo).toBeDefined();
    expect(medicamentosGestacao.gestanteId).toBeDefined();
  });

  it('deve importar medicamentosGestacao no scheduler', async () => {
    const schedulerSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/server/whatsappScheduler.ts', 'utf-8')
    );
    expect(schedulerSource).toContain('medicamentosGestacao');
    expect(schedulerSource).toContain('condicaoMedicamento');
  });

  it('deve verificar condição de medicamento antes de enviar', async () => {
    const schedulerSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/server/whatsappScheduler.ts', 'utf-8')
    );
    // Deve verificar se a gestante usa o medicamento
    expect(schedulerSource).toContain('template.condicaoMedicamento');
    expect(schedulerSource).toContain('medicamentosGestacao.tipo');
    expect(schedulerSource).toContain('medicamentosGestacao.ativo');
    // Deve pular se gestante não usa o medicamento
    expect(schedulerSource).toContain('Gestante não usa este medicamento, pular');
  });

  it('deve ter sugestão de template AAS no TemplateWizard', async () => {
    const wizardSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/client/src/components/TemplateWizard.tsx', 'utf-8')
    );
    expect(wizardSource).toContain('suspensao_aas');
    expect(wizardSource).toContain("condicaoMedicamento: 'aas'");
    expect(wizardSource).toContain('igSemanas: 35');
    expect(wizardSource).toContain('igDias: 6');
    expect(wizardSource).toContain('Suspensão do AAS');
  });

  it('deve ter campo condicaoMedicamento nos routers de criar e atualizar template', async () => {
    const routersSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/server/routers.ts', 'utf-8')
    );
    // Deve aceitar condicaoMedicamento no input do zod
    const matches = routersSource.match(/condicaoMedicamento: z\.string/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2); // criarTemplate + atualizarTemplate
  });

  it('template AAS deve ter mensagem aprovada com texto correto', async () => {
    const wizardSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/client/src/components/TemplateWizard.tsx', 'utf-8')
    );
    expect(wizardSource).toContain('último dia de uso do AAS');
    expect(wizardSource).toContain('A partir de amanhã (36 semanas), o AAS deve ser *suspenso*');
    expect(wizardSource).toContain('Cálcio');
    expect(wizardSource).toContain('continuar tomando até acabar a caixa');
  });

  it('deve ter a categoria Medicamentos no wizard', async () => {
    const wizardSource = await import('fs').then(fs =>
      fs.readFileSync('/home/ubuntu/gestantes-app-replica/client/src/components/TemplateWizard.tsx', 'utf-8')
    );
    expect(wizardSource).toContain("'Medicamentos'");
    expect(wizardSource).toContain("'Medicamentos': { icon: Pill");
  });
});
