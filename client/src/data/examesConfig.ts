// Configuração de exames por trimestre
// true = exame solicitado neste trimestre
// false = não solicitar

export interface ExameConfig {
  nome: string;
  trimestres: {
    primeiro: boolean;
    segundo: boolean;
    terceiro: boolean;
  };
  subcampos?: string[]; // Para exames com múltiplos valores (ex: TTGO)
}

export const examesSangue: ExameConfig[] = [
  { nome: "Tipagem sanguínea ABO/Rh", trimestres: { primeiro: true, segundo: false, terceiro: false } },
  { nome: "Coombs indireto", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Hemoglobina/Hematócrito", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Plaquetas", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Glicemia de jejum", trimestres: { primeiro: true, segundo: false, terceiro: false } },
  { nome: "VDRL", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "FTA-ABS IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "FTA-ABS IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "HIV", trimestres: { primeiro: true, segundo: false, terceiro: true } },
  { nome: "Hepatite B (HBsAg)", trimestres: { primeiro: true, segundo: false, terceiro: true } },
  { nome: "Anti-HBs", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Hepatite C (Anti-HCV)", trimestres: { primeiro: true, segundo: false, terceiro: false } },
  { nome: "Toxoplasmose IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Toxoplasmose IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Rubéola IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Rubéola IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Citomegalovírus IgG", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Citomegalovírus IgM", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "TSH", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "T4 Livre", trimestres: { primeiro: true, segundo: false, terceiro: false } },
  { nome: "Eletroforese de Hemoglobina", trimestres: { primeiro: true, segundo: false, terceiro: false } },
  { nome: "Ferritina", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Vitamina D (25-OH)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Vitamina B12", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { 
    nome: "TTGO 75g (Curva Glicêmica)", 
    trimestres: { primeiro: false, segundo: true, terceiro: false },
    subcampos: ["Jejum", "1 hora", "2 horas"]
  },
];

export const examesUrina: ExameConfig[] = [
  { nome: "EAS (Urina tipo 1)", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Urocultura", trimestres: { primeiro: true, segundo: true, terceiro: true } },
  { nome: "Proteinúria de 24 horas", trimestres: { primeiro: false, segundo: false, terceiro: true } },
];

export const examesFezes: ExameConfig[] = [
  { nome: "EPF (Parasitológico de Fezes)", trimestres: { primeiro: true, segundo: false, terceiro: false } },
];

export const outrosExames: ExameConfig[] = [
  { nome: "Swab vaginal/retal EGB", trimestres: { primeiro: false, segundo: false, terceiro: true } },
];
