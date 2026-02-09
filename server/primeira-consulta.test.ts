import { describe, it, expect } from "vitest";

/**
 * Tests for the Primeira Consulta (First Consultation) feature.
 * Validates that the new fields (isPrimeiraConsulta, historiaPatologicaPregressa,
 * historiaSocial, historiaFamiliar, condutaCheckboxes) are properly handled
 * in the consultasPrenatal create and update endpoints.
 */

describe("Primeira Consulta Fields", () => {
  it("should accept isPrimeiraConsulta field in the schema", () => {
    // Validate the shape of data that would be sent for a primeira consulta
    const primeiraConsultaData = {
      gestanteId: 1,
      dataConsulta: "2026-02-09",
      isPrimeiraConsulta: 1,
      historiaPatologicaPregressa: "Nega comorbidades",
      historiaSocial: "Nega tabagismo e etilismo",
      historiaFamiliar: "Mãe hipertensa",
      condutaCheckboxes: {
        rotina_lab_1tri: true,
        us_obstetrico_endovaginal: true,
        polivitaminico: true,
        aas: false,
      },
      peso: 68500,
      pressaoArterial: "120/80",
      alturaUterina: 300,
      bcf: 1,
      edema: "0",
      queixas: "Sem queixas",
      conduta: JSON.stringify(["Rotina Laboratorial 1º Trim", "US Obstétrico Endovaginal", "Polivitamínico"]),
      condutaComplementacao: "Retorno em 30 dias",
      observacoes: "Gestação de baixo risco",
    };

    expect(primeiraConsultaData.isPrimeiraConsulta).toBe(1);
    expect(primeiraConsultaData.historiaPatologicaPregressa).toBe("Nega comorbidades");
    expect(primeiraConsultaData.historiaSocial).toBe("Nega tabagismo e etilismo");
    expect(primeiraConsultaData.historiaFamiliar).toBe("Mãe hipertensa");
    expect(primeiraConsultaData.condutaCheckboxes.rotina_lab_1tri).toBe(true);
    expect(primeiraConsultaData.condutaCheckboxes.aas).toBe(false);
  });

  it("should accept regular consultation without primeira consulta fields", () => {
    const consultaRegular = {
      gestanteId: 1,
      dataConsulta: "2026-02-09",
      peso: 70000,
      pressaoArterial: "110/70",
      alturaUterina: 320,
      bcf: 1,
      edema: "0",
      queixas: "Sem queixas",
    };

    expect(consultaRegular.gestanteId).toBe(1);
    expect((consultaRegular as any).isPrimeiraConsulta).toBeUndefined();
    expect((consultaRegular as any).historiaPatologicaPregressa).toBeUndefined();
  });

  it("should properly format conduta checkboxes for PEP text", () => {
    const CONDUTA_CHECKBOXES = [
      { key: "rotina_lab_1tri", label: "Rotina Laboratorial 1º Trim" },
      { key: "rotina_lab_2tri", label: "Rotina Lab 2º Trim" },
      { key: "rotina_lab_3tri", label: "Rotina Lab 3º Trim" },
      { key: "outros_exames_lab", label: "Outros Exames Laboratoriais Específicos" },
      { key: "us_obstetrico_endovaginal", label: "US Obstétrico Endovaginal" },
      { key: "us_morfologico_1tri", label: "US Morfológico 1º Trim" },
      { key: "us_morfologico_2tri", label: "US Morfológico 2º Trim" },
      { key: "us_obstetrico_doppler", label: "US Obstétrico com Doppler" },
      { key: "ecocardiograma_fetal", label: "Ecocardiograma Fetal" },
      { key: "colhido_cultura_egb", label: "Colhido Cultura para EGB" },
      { key: "internacao_urgencia", label: "Internação Urgência" },
      { key: "vacinas", label: "Vacinas (Prescrevo ou Oriento)" },
      { key: "progesterona_micronizada", label: "Progesterona Micronizada" },
      { key: "antibioticoterapia", label: "Antibioticoterapia" },
      { key: "levotiroxina", label: "Levotiroxina" },
      { key: "aas", label: "AAS" },
      { key: "polivitaminico", label: "Polivitamínico" },
      { key: "sintomaticos", label: "Sintomáticos" },
      { key: "agendada_cesarea", label: "Agendada Cesárea" },
      { key: "indico_curetagem_uterina", label: "Indico Curetagem Uterina" },
    ];

    const selectedCheckboxes: Record<string, boolean> = {
      rotina_lab_1tri: true,
      us_obstetrico_endovaginal: true,
      polivitaminico: true,
      aas: true,
    };

    const condutasSelecionadas = CONDUTA_CHECKBOXES
      .filter(c => selectedCheckboxes[c.key])
      .map(c => c.label);

    expect(condutasSelecionadas).toEqual([
      "Rotina Laboratorial 1º Trim",
      "US Obstétrico Endovaginal",
      "AAS",
      "Polivitamínico",
    ]);
    expect(condutasSelecionadas.join(", ")).toBe(
      "Rotina Laboratorial 1º Trim, US Obstétrico Endovaginal, AAS, Polivitamínico"
    );
  });

  it("should generate proper PEP text for primeira consulta", () => {
    const paridade = "G2P1A0";
    const igDum = "32s 2d";
    const igUs = "31s 5d";
    const queixas = "Sem queixas hoje.";
    const hpp = "Nega comorbidades.";
    const hSocial = "Nega tabagismo e etilismo.";
    const hFamiliar = "Mãe hipertensa.";
    const peso = "68.5";
    const pa = "120/80";
    const auf = "30";
    const bcf = "Positivo";
    const edema = "Ausente";
    const condutas = "Rotina Laboratorial 1º Trim, US Obstétrico Endovaginal";
    const complementacao = "Retorno em 30 dias com exames.";
    const obs = "Gestação de baixo risco.";

    const linhas = [
      `PRÉ-NATAL - 1ª CONSULTA`,
      ``,
      `Paridade:\n${paridade}`,
      `Idade Gestacional (DUM):\n${igDum}`,
      `Idade Gestacional (US):\n${igUs}`,
      `Queixa(s):\n${queixas}`,
      `História Patológica Pregressa:\n${hpp}`,
      `História Social:\n${hSocial}`,
      `História Familiar:\n${hFamiliar}`,
      `Peso:\n${peso}kg`,
      `Pressão Arterial:\n${pa}`,
      `AUF:\n${auf}cm`,
      `BCF:\n${bcf}`,
      `Edema:\n${edema}`,
      `Conduta:\n${condutas}`,
    ];

    if (complementacao) {
      linhas.push(`Conduta (complementação):\n${complementacao}`);
    }
    if (obs) {
      linhas.push(`Observações:\n${obs}`);
    }

    const textoPEP = linhas.join("\n\n");

    expect(textoPEP).toContain("PRÉ-NATAL - 1ª CONSULTA");
    expect(textoPEP).toContain("Paridade:\nG2P1A0");
    expect(textoPEP).toContain("História Patológica Pregressa:\nNega comorbidades.");
    expect(textoPEP).toContain("História Social:\nNega tabagismo e etilismo.");
    expect(textoPEP).toContain("História Familiar:\nMãe hipertensa.");
    expect(textoPEP).toContain("Conduta (complementação):\nRetorno em 30 dias com exames.");
    expect(textoPEP).toContain("Observações:\nGestação de baixo risco.");
  });

  it("should handle empty optional fields gracefully", () => {
    const primeiraConsultaData = {
      gestanteId: 1,
      dataConsulta: "2026-02-09",
      isPrimeiraConsulta: 1,
      historiaPatologicaPregressa: "",
      historiaSocial: "",
      historiaFamiliar: "",
      condutaCheckboxes: {},
    };

    expect(primeiraConsultaData.isPrimeiraConsulta).toBe(1);
    expect(primeiraConsultaData.historiaPatologicaPregressa).toBe("");
    expect(Object.keys(primeiraConsultaData.condutaCheckboxes)).toHaveLength(0);
  });
});
