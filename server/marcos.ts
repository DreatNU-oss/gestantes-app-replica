/**
 * Calcula os marcos importantes da gestação baseado na data do ultrassom e IG
 */
export function calcularMarcosImportantes(dataUltrassom: string, igUltrassom: string): any[] {
  const dataUS = new Date(dataUltrassom);
  const [semanas, dias] = igUltrassom.split("s").map((s) => parseInt(s.replace("d", "")));
  const totalDiasIG = semanas * 7 + (dias || 0);

  // Calcular DPP baseado no ultrassom (280 dias - 40 semanas)
  const dppUS = new Date(dataUS);
  dppUS.setDate(dppUS.getDate() + (280 - totalDiasIG));

  const marcos = [
    {
      titulo: "Concepção",
      data: new Date(dppUS.getTime() - 280 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "Estimada",
    },
    {
      titulo: "Primeiro Ultrassom",
      data: new Date(dppUS.getTime() - (280 - 42) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "6 semanas",
    },
    {
      titulo: "Morfológico 1º Trimestre",
      data: new Date(dppUS.getTime() - (280 - 84) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "11-14 semanas",
    },
    {
      titulo: "Morfológico 2º Trimestre",
      data: new Date(dppUS.getTime() - (280 - 140) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "18-24 semanas",
    },
    {
      titulo: "Ecocardiograma Fetal",
      data: new Date(dppUS.getTime() - (280 - 168) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "24-28 semanas",
    },
    {
      titulo: "Início do 3º Trimestre",
      data: new Date(dppUS.getTime() - (280 - 196) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "28 semanas",
    },
    {
      titulo: "Termo Precoce",
      data: new Date(dppUS.getTime() - (280 - 259) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "37 semanas",
    },
    {
      titulo: "Termo Completo",
      data: new Date(dppUS.getTime() - (280 - 273) * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "39 semanas",
    },
    {
      titulo: "Data Provável do Parto (DPP)",
      data: dppUS.toLocaleDateString("pt-BR"),
      periodo: "40 semanas",
    },
    {
      titulo: "Termo Tardio",
      data: new Date(dppUS.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "41 semanas",
    },
    {
      titulo: "Pós-termo",
      data: new Date(dppUS.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR"),
      periodo: "42 semanas",
    },
  ];

  return marcos;
}
