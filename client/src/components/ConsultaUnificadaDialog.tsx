import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Stethoscope,
  AlertTriangle,
  Pill,
  ShieldAlert,
  Baby,
  FileText,
  Heart,
  Calendar,
  Loader2,
  ClipboardList,
} from "lucide-react";

// Labels de fatores de risco
const fatoresRiscoLabels: Record<string, string> = {
  alergia_medicamentos: "Alergia a Medicamentos",
  alteracoes_morfologicas_fetais: "Alterações Morfológicas Fetais",
  cirurgia_uterina_previa: "Cirurgia Uterina Prévia",
  diabetes_gestacional: "Diabetes Gestacional",
  diabetes_previa: "Diabetes Prévia",
  diabetes_tipo2: "Diabetes Tipo 2",
  doenca_autoimune: "Doença Autoimune",
  doenca_cardiaca: "Doença Cardíaca",
  doenca_psiquiatrica: "Doença Psiquiátrica",
  doenca_renal: "Doença Renal",
  doenca_tireoide: "Doença da Tireoide",
  dpoc_asma: "DPOC/Asma",
  epilepsia: "Epilepsia",
  fator_preditivo_dheg: "Fator Preditivo DHEG",
  fator_rh_negativo: "Fator Rh Negativo",
  gemelar: "Gestação Gemelar",
  gestacao_gemelar: "Gestação Gemelar",
  hipertensao: "Hipertensão",
  hipertensao_cronica: "Hipertensão Crônica",
  hipertensao_gestacional: "Hipertensão Gestacional",
  hipotireoidismo: "Hipotireoidismo",
  historico_familiar_dheg: "Histórico Familiar DHEG",
  idade_avancada: "Idade Avançada",
  incompetencia_istmo_cervical: "Incompetência Istmo-Cervical",
  infeccao_urinaria_recorrente: "Infecção Urinária Recorrente",
  mal_passado_obstetrico: "Mau Passado Obstétrico",
  malformacoes_mullerianas: "Malformações Müllerianas",
  obesidade: "Obesidade",
  pe_preeclampsia: "Pré-Eclâmpsia",
  placenta_previa: "Placenta Prévia",
  restricao_crescimento_fetal: "Restrição de Crescimento Fetal",
  sobrepeso_obesidade: "Sobrepeso/Obesidade",
  trombofilia: "Trombofilia",
  outro: "Outro",
};

const medicamentosLabels: Record<string, string> = {
  acido_folico: "Ácido Fólico",
  aas: "AAS (Ácido Acetilsalicílico)",
  carbonato_calcio: "Carbonato de Cálcio",
  enoxaparina: "Enoxaparina",
  insulina: "Insulina",
  levotiroxina: "Levotiroxina",
  medicamentos_inalatorios: "Medicamentos Inalatórios",
  polivitaminicos: "Polivitamínicos",
  progestagenos: "Progestágenos",
  psicotropicos: "Psicotrópicos",
  sulfato_ferroso: "Sulfato Ferroso",
  outro: "Outro",
};

const tipoPartoLabels: Record<string, string> = {
  cesariana: "Cesárea",
  normal: "Parto Normal",
  a_definir: "A Definir",
};

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

interface ConsultaUnificadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestanteParaConsulta: {
    id: number;
    nome: string;
    dum?: string;
    tipoDum?: string;
    dataUltrassom?: string;
    igUltrassomSemanas?: number;
    igUltrassomDias?: number;
    gesta?: number;
    para?: number;
    partosNormais?: number;
    cesareas?: number;
    abortos?: number;
  } | null;
  onClose: () => void;
  onConfirm: (isPrimeiraConsulta?: boolean, isUrgencia?: boolean) => void;
}

export default function ConsultaUnificadaDialog({
  open,
  onOpenChange,
  gestanteParaConsulta,
  onClose,
  onConfirm,
}: ConsultaUnificadaDialogProps) {
  const gestanteId = gestanteParaConsulta?.id || null;

  // Buscar fatores de risco
  const { data: fatoresRisco, isLoading: loadingFatores } = trpc.fatoresRisco.list.useQuery(
    { gestanteId: gestanteId! },
    { enabled: open && gestanteId !== null }
  );

  // Buscar medicamentos
  const { data: medicamentos, isLoading: loadingMedicamentos } = trpc.medicamentos.list.useQuery(
    { gestanteId: gestanteId! },
    { enabled: open && gestanteId !== null }
  );

  // Buscar dados completos da gestante
  const { data: gestante, isLoading: loadingGestante } = trpc.gestantes.get.useQuery(
    { id: gestanteId! },
    { enabled: open && gestanteId !== null }
  );

  const isLoading = loadingFatores || loadingMedicamentos || loadingGestante;

  // Separar alergias dos outros fatores de risco
  const alergias = fatoresRisco?.filter(f => f.tipo === "alergia_medicamentos") || [];
  const outrosFatoresRisco = fatoresRisco?.filter(f => f.tipo !== "alergia_medicamentos") || [];

  const temFatoresRisco = outrosFatoresRisco.length > 0;
  const temMedicamentos = medicamentos && medicamentos.length > 0;
  const temAlergias = alergias.length > 0;
  const temObservacoes = gestante?.observacoes && gestante.observacoes.trim() !== "";

  // Tipo de parto
  const tipoParto = gestante?.tipoPartoDesejado;
  const temTipoParto = tipoParto && tipoParto !== "a_definir";
  const dataPartoProgramado = gestante?.dataPartoProgramado;

  if (!gestanteParaConsulta) return null;

  // Função para normalizar data para formato YYYY-MM-DD
  const normalizarData = (data: string): string => {
    if (!data) return '';
    // Se já contém T (ISO format), extrair apenas a parte da data
    if (data.includes('T')) {
      return data.split('T')[0];
    }
    // Se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return data;
    }
    // Tentar converter
    const d = new Date(data);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return data;
  };

  // Calcular IG pela DUM
  const calcularIgDum = () => {
    if (gestanteParaConsulta.tipoDum === "incerta") return "DUM Incerta";
    if (gestanteParaConsulta.tipoDum === "incompativel") return "Não considerada (incompatível com US)";
    if (!gestanteParaConsulta.dum) return "Não informada";
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const dumNorm = normalizarData(gestanteParaConsulta.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return "Não informada";
    const diffMs = hoje.getTime() - dumDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(diffDays / 7);
    const dias = diffDays % 7;
    return `${semanas}s ${dias}d`;
  };

  // Calcular IG pelo US
  const calcularIgUs = () => {
    if (!gestanteParaConsulta.dataUltrassom || gestanteParaConsulta.igUltrassomSemanas === undefined) return "Não informada";
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const usNorm = normalizarData(gestanteParaConsulta.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return "Não informada";
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const igTotalDias = (gestanteParaConsulta.igUltrassomSemanas * 7) + (gestanteParaConsulta.igUltrassomDias || 0) + diffDays;
    const semanas = Math.floor(igTotalDias / 7);
    const dias = igTotalDias % 7;
    return `${semanas}s ${dias}d`;
  };

  // Calcular DPP pela DUM
  const calcularDppDum = () => {
    if (!gestanteParaConsulta.dum || gestanteParaConsulta.tipoDum !== "data") return "-";
    const dumNorm = normalizarData(gestanteParaConsulta.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return "-";
    const dppDate = new Date(dumDate);
    dppDate.setDate(dppDate.getDate() + 280);
    return dppDate.toLocaleDateString('pt-BR');
  };

  // Calcular DPP pelo US
  const calcularDppUs = () => {
    if (!gestanteParaConsulta.dataUltrassom || gestanteParaConsulta.igUltrassomSemanas === undefined) return "-";
    const usNorm = normalizarData(gestanteParaConsulta.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return "-";
    const diasRestantes = (40 * 7) - ((gestanteParaConsulta.igUltrassomSemanas * 7) + (gestanteParaConsulta.igUltrassomDias || 0));
    const dppDate = new Date(dataUS);
    dppDate.setDate(dppDate.getDate() + diasRestantes);
    return dppDate.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Stethoscope className="h-5 w-5 text-[#722F37]" />
            {gestanteParaConsulta.nome}
          </DialogTitle>
          {gestante?.nomeBebe && (
            <div className="flex items-center gap-2 mt-1 ml-1">
              <Baby className={`h-4 w-4 ${gestante?.sexoBebe === 'masculino' ? 'text-blue-500' : gestante?.sexoBebe === 'feminino' ? 'text-pink-500' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${gestante?.sexoBebe === 'masculino' ? 'text-blue-600' : gestante?.sexoBebe === 'feminino' ? 'text-pink-600' : 'text-muted-foreground'}`}>
                Bebê: {gestante.nomeBebe}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Idade Gestacional e DPP */}
          <div className="bg-[#722F37]/5 border border-[#722F37]/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Baby className="h-4 w-4 text-[#722F37]" />
              <span className="font-semibold text-[#722F37] text-sm">Idade Gestacional</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">IG (DUM):</span>
                <span className="ml-2 font-medium">{calcularIgDum()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">IG (US):</span>
                <span className="ml-2 font-medium">{calcularIgUs()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">DPP (DUM):</span>
                <span className="ml-2 font-medium">{calcularDppDum()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">DPP (US):</span>
                <span className="ml-2 font-medium">{calcularDppUs()}</span>
              </div>
            </div>
          </div>

          {/* História Obstétrica */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[#722F37]" />
              <span className="font-semibold text-sm">História Obstétrica</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-[#722F37]/10 text-[#722F37] border-[#722F37]/30">
                G{gestanteParaConsulta.gesta || 0}
              </Badge>
              <Badge variant="outline" className="bg-[#722F37]/10 text-[#722F37] border-[#722F37]/30">
                P{gestanteParaConsulta.para || 0}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                PN: {gestanteParaConsulta.partosNormais || 0}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                PC: {gestanteParaConsulta.cesareas || 0}
              </Badge>
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                A: {gestanteParaConsulta.abortos || 0}
              </Badge>
            </div>
          </div>

          {/* Tipo de Parto e Data */}
          {(temTipoParto || dataPartoProgramado) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary text-sm">Informações do Parto</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {temTipoParto && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tipo de Parto</p>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      {tipoPartoLabels[tipoParto!] || tipoParto}
                    </Badge>
                  </div>
                )}
                {dataPartoProgramado && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Data Programada</p>
                    <span className="font-medium text-primary text-sm">{formatDateBR(dataPartoProgramado)}</span>
                  </div>
                )}
              </div>
              {gestante?.motivoCesarea && gestante.motivoCesarea !== "" && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Motivo da Indicação da Cesárea</p>
                  <p className="text-sm font-medium text-primary">
                    {gestante.motivoCesarea}
                    {gestante.motivoCesarea === "Outro motivo" && gestante.motivoCesareaOutro && (
                      <span className="text-muted-foreground"> - {gestante.motivoCesareaOutro}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Carregando dados adicionais */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando informações...</span>
            </div>
          )}

          {/* Fatores de Risco */}
          {!isLoading && temFatoresRisco && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-amber-700 text-sm">Fatores de Risco</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {outrosFatoresRisco.map((fator) => (
                      <div key={fator.id} className="space-y-1">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                          {fatoresRiscoLabels[fator.tipo] || fator.tipo}
                        </Badge>
                        {fator.descricao && (
                          <p className="text-xs text-amber-700 pl-1">{fator.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Alergias */}
          {!isLoading && temAlergias && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-700 text-sm">Alergias</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {alergias.map((alergia) => (
                      <div key={alergia.id} className="space-y-1">
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                          Alergia a Medicamentos
                        </Badge>
                        {alergia.descricao && (
                          <p className="text-xs text-red-700 pl-1">{alergia.descricao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Medicamentos em Uso */}
          {!isLoading && temMedicamentos && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-700 text-sm">Medicamentos em Uso</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {medicamentos!.map((med) => (
                      <div key={med.id} className="space-y-1">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                          {medicamentosLabels[med.tipo] || med.tipo}
                        </Badge>
                        {med.especificacao && (
                          <p className="text-xs text-blue-700 pl-1">{med.especificacao}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {!isLoading && temObservacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-700 text-sm">Observações</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{gestante?.observacoes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <Separator className="my-2" />

        <p className="text-muted-foreground text-sm text-center">Que tipo de consulta deseja registrar?</p>

        <DialogFooter className="flex flex-col gap-3 sm:flex-col">
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button onClick={() => onConfirm(true)} className="bg-[#722F37] hover:bg-[#5a252c] text-xs sm:text-sm px-2">
              <ClipboardList className="h-4 w-4 mr-1 shrink-0" />
              1ª Consulta
            </Button>
            <Button onClick={() => onConfirm(false)} className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-2">
              <Stethoscope className="h-4 w-4 mr-1 shrink-0" />
              Retorno
            </Button>
            <Button onClick={() => onConfirm(false, true)} className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm px-2">
              <AlertTriangle className="h-4 w-4 mr-1 shrink-0" />
              Urgência
            </Button>
          </div>
          <Button variant="outline" onClick={onClose} className="w-full">
            Não, agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
