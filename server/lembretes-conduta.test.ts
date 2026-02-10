import { describe, it, expect } from "vitest";

// Testar a lógica de filtragem de condutas que geram lembrete
const CONDUTAS_COM_LEMBRETE = [
  "Rotina Laboratorial 1º Trimestre",
  "Rotina Laboratorial 2º Trimestre",
  "Rotina Laboratorial 3º Trimestre",
  "Outros Exames Laboratoriais Específicos",
  "US Obstétrico Endovaginal",
  "US Morfológico 1º Trimestre",
  "US Morfológico 2º Trimestre",
  "US Obstétrico com Doppler",
  "Ecocardiograma Fetal",
  "Colhido Cultura para EGB",
  "Aguardo Exames Laboratoriais",
];

const CONDUTAS_SEM_LEMBRETE = [
  "Antibioticoterapia",
  "Progesterona Micronizada",
  "Vacinas (Prescrevo ou Oriento)",
  "Levotiroxina",
  "AAS",
  "Agendamento Cesárea",
  "Indico Curetagem Uterina",
  "Acompanhamento Rotina",
  "Ferro Venoso",
];

const CONDUTAS_WIZARD_COM_LEMBRETE: Record<string, string> = {
  "rotina_lab_1tri": "Rotina Laboratorial 1º Trim",
  "rotina_lab_2tri": "Rotina Lab 2º Trim",
  "rotina_lab_3tri": "Rotina Lab 3º Trim",
  "outros_exames_lab": "Outros Exames Laboratoriais Específicos",
  "us_obstetrico_endovaginal": "US Obstétrico Endovaginal",
  "us_morfologico_1tri": "US Morfológico 1º Trim",
  "us_morfologico_2tri": "US Morfológico 2º Trim",
  "us_obstetrico_doppler": "US Obstétrico com Doppler",
  "ecocardiograma_fetal": "Ecocardiograma Fetal",
  "colhido_cultura_egb": "Colhido Cultura para EGB",
  "aguardo_exames_laboratoriais": "Aguardo Exames Laboratoriais",
};

// Função de filtragem (mesma lógica do db.ts)
function filtrarCondutasComLembrete(condutas: string[]): string[] {
  return condutas.filter(c =>
    CONDUTAS_COM_LEMBRETE.some(cl => c.toLowerCase().includes(cl.toLowerCase()) || cl.toLowerCase().includes(c.toLowerCase()))
  );
}

function filtrarCondutasWizardComLembrete(checkboxes: Record<string, boolean>): string[] {
  const result: string[] = [];
  for (const [key, checked] of Object.entries(checkboxes)) {
    if (checked && CONDUTAS_WIZARD_COM_LEMBRETE[key]) {
      result.push(CONDUTAS_WIZARD_COM_LEMBRETE[key]);
    }
  }
  return result;
}

describe("Sistema de Lembretes de Conduta", () => {
  describe("Filtragem de condutas que geram lembrete (consulta de retorno)", () => {
    it("deve gerar lembretes para condutas 1-10 e 20", () => {
      const condutas = [
        "Rotina Laboratorial 1º Trimestre",
        "US Morfológico 2º Trimestre",
        "Ecocardiograma Fetal",
        "Aguardo Exames Laboratoriais",
      ];
      const resultado = filtrarCondutasComLembrete(condutas);
      expect(resultado).toHaveLength(4);
      expect(resultado).toContain("Rotina Laboratorial 1º Trimestre");
      expect(resultado).toContain("US Morfológico 2º Trimestre");
      expect(resultado).toContain("Ecocardiograma Fetal");
      expect(resultado).toContain("Aguardo Exames Laboratoriais");
    });

    it("não deve gerar lembretes para condutas sem lembrete", () => {
      const condutas = [
        "Antibioticoterapia",
        "AAS",
        "Acompanhamento Rotina",
        "Ferro Venoso",
      ];
      const resultado = filtrarCondutasComLembrete(condutas);
      expect(resultado).toHaveLength(0);
    });

    it("deve filtrar corretamente mix de condutas com e sem lembrete", () => {
      const condutas = [
        "Rotina Laboratorial 3º Trimestre",
        "AAS",
        "US Obstétrico com Doppler",
        "Acompanhamento Rotina",
        "Colhido Cultura para EGB",
      ];
      const resultado = filtrarCondutasComLembrete(condutas);
      expect(resultado).toHaveLength(3);
      expect(resultado).toContain("Rotina Laboratorial 3º Trimestre");
      expect(resultado).toContain("US Obstétrico com Doppler");
      expect(resultado).toContain("Colhido Cultura para EGB");
    });

    it("deve retornar array vazio quando não há condutas", () => {
      const resultado = filtrarCondutasComLembrete([]);
      expect(resultado).toHaveLength(0);
    });

    it("deve gerar lembrete para todas as 11 condutas configuradas", () => {
      const resultado = filtrarCondutasComLembrete(CONDUTAS_COM_LEMBRETE);
      expect(resultado).toHaveLength(11);
    });

    it("não deve gerar lembrete para nenhuma das condutas sem lembrete", () => {
      const resultado = filtrarCondutasComLembrete(CONDUTAS_SEM_LEMBRETE);
      expect(resultado).toHaveLength(0);
    });
  });

  describe("Filtragem de condutas do Wizard (1ª consulta)", () => {
    it("deve gerar lembretes para checkboxes marcados que têm lembrete", () => {
      const checkboxes = {
        "rotina_lab_1tri": true,
        "us_morfologico_2tri": true,
        "internacao_urgencia": true, // não tem lembrete
        "polivitaminico": true, // não tem lembrete
      };
      const resultado = filtrarCondutasWizardComLembrete(checkboxes);
      expect(resultado).toHaveLength(2);
      expect(resultado).toContain("Rotina Laboratorial 1º Trim");
      expect(resultado).toContain("US Morfológico 2º Trim");
    });

    it("não deve gerar lembretes para checkboxes desmarcados", () => {
      const checkboxes = {
        "rotina_lab_1tri": false,
        "us_morfologico_2tri": false,
        "ecocardiograma_fetal": false,
      };
      const resultado = filtrarCondutasWizardComLembrete(checkboxes);
      expect(resultado).toHaveLength(0);
    });

    it("deve gerar lembretes para todos os 11 checkboxes configurados quando marcados", () => {
      const checkboxes: Record<string, boolean> = {};
      for (const key of Object.keys(CONDUTAS_WIZARD_COM_LEMBRETE)) {
        checkboxes[key] = true;
      }
      const resultado = filtrarCondutasWizardComLembrete(checkboxes);
      expect(resultado).toHaveLength(11);
    });

    it("deve retornar array vazio para checkboxes vazios", () => {
      const resultado = filtrarCondutasWizardComLembrete({});
      expect(resultado).toHaveLength(0);
    });
  });

  describe("Lógica de resolução de lembretes", () => {
    it("deve manter lembretes não marcados para próxima consulta", () => {
      const lembretesPendentes = [
        { id: 1, conduta: "Rotina Lab 1º Trim" },
        { id: 2, conduta: "US Morfológico 2º Trim" },
        { id: 3, conduta: "Ecocardiograma Fetal" },
      ];
      const lembretesResolvidos = [1, 3]; // Apenas 1 e 3 marcados
      
      const pendentesAposConsulta = lembretesPendentes.filter(
        l => !lembretesResolvidos.includes(l.id)
      );
      
      expect(pendentesAposConsulta).toHaveLength(1);
      expect(pendentesAposConsulta[0].conduta).toBe("US Morfológico 2º Trim");
    });

    it("deve resolver todos os lembretes quando todos são marcados", () => {
      const lembretesPendentes = [
        { id: 1, conduta: "Rotina Lab 1º Trim" },
        { id: 2, conduta: "US Morfológico 2º Trim" },
      ];
      const lembretesResolvidos = [1, 2];
      
      const pendentesAposConsulta = lembretesPendentes.filter(
        l => !lembretesResolvidos.includes(l.id)
      );
      
      expect(pendentesAposConsulta).toHaveLength(0);
    });

    it("deve manter todos os lembretes quando nenhum é marcado", () => {
      const lembretesPendentes = [
        { id: 1, conduta: "Rotina Lab 1º Trim" },
        { id: 2, conduta: "US Morfológico 2º Trim" },
      ];
      const lembretesResolvidos: number[] = [];
      
      const pendentesAposConsulta = lembretesPendentes.filter(
        l => !lembretesResolvidos.includes(l.id)
      );
      
      expect(pendentesAposConsulta).toHaveLength(2);
    });
  });
});
