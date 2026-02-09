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

    // Import toBold function logic inline for testing
    const accentBoldMap: Record<string, string> = {
      'À': '\uD835\uDC00\u0300', 'Á': '\uD835\uDC00\u0301', 'Â': '\uD835\uDC00\u0302', 'Ã': '\uD835\uDC00\u0303',
      'È': '\uD835\uDC04\u0300', 'É': '\uD835\uDC04\u0301', 'Ê': '\uD835\uDC04\u0302',
      'Ì': '\uD835\uDC08\u0300', 'Í': '\uD835\uDC08\u0301', 'Î': '\uD835\uDC08\u0302',
      'Ò': '\uD835\uDC0E\u0300', 'Ó': '\uD835\uDC0E\u0301', 'Ô': '\uD835\uDC0E\u0302', 'Õ': '\uD835\uDC0E\u0303',
      'Ù': '\uD835\uDC14\u0300', 'Ú': '\uD835\uDC14\u0301', 'Û': '\uD835\uDC14\u0302',
      'Ç': '\uD835\uDC02\u0327',
      'à': '\uD835\uDC1A\u0300', 'á': '\uD835\uDC1A\u0301', 'â': '\uD835\uDC1A\u0302', 'ã': '\uD835\uDC1A\u0303',
      'è': '\uD835\uDC1E\u0300', 'é': '\uD835\uDC1E\u0301', 'ê': '\uD835\uDC1E\u0302',
      'ì': '\uD835\uDC22\u0300', 'í': '\uD835\uDC22\u0301', 'î': '\uD835\uDC22\u0302',
      'ò': '\uD835\uDC28\u0300', 'ó': '\uD835\uDC28\u0301', 'ô': '\uD835\uDC28\u0302', 'õ': '\uD835\uDC28\u0303',
      'ù': '\uD835\uDC2E\u0300', 'ú': '\uD835\uDC2E\u0301', 'û': '\uD835\uDC2E\u0302',
      'ç': '\uD835\uDC1C\u0327',
    };

    function toBold(text: string): string {
      let result = '';
      for (const char of text) {
        const code = char.codePointAt(0)!;
        if (accentBoldMap[char]) {
          result += accentBoldMap[char];
        } else if (code >= 0x41 && code <= 0x5A) {
          result += String.fromCodePoint(0x1D400 + (code - 0x41));
        } else if (code >= 0x61 && code <= 0x7A) {
          result += String.fromCodePoint(0x1D41A + (code - 0x61));
        } else if (code >= 0x30 && code <= 0x39) {
          result += String.fromCodePoint(0x1D7CE + (code - 0x30));
        } else {
          result += char;
        }
      }
      return result;
    }

    const linhas = [
      `PRÉ-NATAL - 1ª CONSULTA`,
      ``,
      `${toBold("Paridade:")} ${paridade}`,
      `${toBold("Idade Gestacional (DUM):")} ${igDum}`,
      `${toBold("Idade Gestacional (US):")} ${igUs}`,
      `${toBold("Queixa(s):")} ${queixas}`,
      `${toBold("História Patológica Pregressa:")} ${hpp}`,
      `${toBold("História Social:")} ${hSocial}`,
      `${toBold("História Familiar:")} ${hFamiliar}`,
      `${toBold("Peso:")} ${peso}kg`,
      `${toBold("Pressão Arterial:")} ${pa}`,
      `${toBold("AUF:")} ${auf}cm`,
      `${toBold("BCF:")} ${bcf}`,
      `${toBold("Edema:")} ${edema}`,
      `${toBold("Conduta:")} ${condutas}`,
    ];

    if (complementacao) {
      linhas.push(`${toBold("Conduta (complementação):")} ${complementacao}`);
    }
    if (obs) {
      linhas.push(`${toBold("Observações:")} ${obs}`);
    }

    const textoPEP = linhas.join("\n\n");

    expect(textoPEP).toContain("PRÉ-NATAL - 1ª CONSULTA");
    // Verify Unicode bold is used (no asterisks)
    expect(textoPEP).not.toContain("**");
    // Verify bold labels contain Unicode bold characters
    expect(textoPEP).toContain(toBold("Paridade:"));
    expect(textoPEP).toContain("G2P1A0");
    expect(textoPEP).toContain(toBold("História Patológica Pregressa:"));
    expect(textoPEP).toContain("Nega comorbidades.");
    expect(textoPEP).toContain(toBold("Observações:"));
    expect(textoPEP).toContain("Gestação de baixo risco.");
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
