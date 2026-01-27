import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Pill, FileText, Loader2, ShieldAlert, Baby, Calendar } from "lucide-react";

// Mapeamento de tipos de fatores de risco para labels legíveis
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

// Mapeamento de tipos de medicamentos para labels legíveis
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

// Mapeamento de tipos de parto para labels legíveis
const tipoPartoLabels: Record<string, string> = {
  cesariana: "Cesárea",
  normal: "Parto Normal",
  a_definir: "A Definir",
};

// Função para formatar data no formato brasileiro
function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Função para formatar Date no formato brasileiro
function formatDateObjBR(date: Date | null | undefined): string {
  if (!date) return "";
  try {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

interface ModalInfoGestanteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestanteId: number | null;
  gestanteNome: string;
}

export default function ModalInfoGestante({
  open,
  onOpenChange,
  gestanteId,
  gestanteNome,
}: ModalInfoGestanteProps) {
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

  // Buscar dados da gestante para observações
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
  
  // Verificar tipo de parto e data do parto
  const tipoParto = gestante?.tipoPartoDesejado;
  const temTipoParto = tipoParto && tipoParto !== "a_definir";
  
  // Data do parto: preferência para data programada, senão usa DPP calculada
  const dataPartoProgramado = gestante?.dataPartoProgramado;
  const dppCalculada = gestante?.calculado?.dppUS || gestante?.calculado?.dpp;
  const dataParto = dataPartoProgramado || (dppCalculada ? formatDateObjBR(dppCalculada) : null);
  const isDataProgramada = !!dataPartoProgramado;
  const temDataParto = !!dataParto;

  // Se não houver nenhuma informação, fechar o modal automaticamente
  useEffect(() => {
    if (!isLoading && open && !temFatoresRisco && !temMedicamentos && !temAlergias && !temObservacoes && !temTipoParto && !temDataParto) {
      // Fechar após um pequeno delay para não parecer um bug
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, open, temFatoresRisco, temMedicamentos, temAlergias, temObservacoes, temTipoParto, temDataParto, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {gestanteNome}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando informações...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tipo de Parto Desejado e Data do Parto */}
            {(temTipoParto || temDataParto) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-primary">Informações do Parto</h3>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {temTipoParto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tipo de Parto Desejado</p>
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary border-primary/30"
                        >
                          {tipoPartoLabels[tipoParto] || tipoParto}
                        </Badge>
                      </div>
                    )}
                    {temDataParto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {isDataProgramada ? "Data Programada" : "Data Provável (DPP)"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">
                            {isDataProgramada ? formatDateBR(dataPartoProgramado) : dataParto}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fatores de Risco */}
            {temFatoresRisco && (
              <>
                {(temTipoParto || temDataParto) && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-amber-700">Fatores de Risco</h3>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {outrosFatoresRisco.map((fator) => (
                        <div key={fator.id} className="space-y-1">
                          <Badge 
                            variant="outline" 
                            className="bg-amber-100 text-amber-800 border-amber-300"
                          >
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

            {/* Medicamentos em Uso */}
            {temMedicamentos && (
              <>
                {(temFatoresRisco || temTipoParto || temDataParto) && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-blue-700">Medicamentos em Uso</h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {medicamentos.map((med) => (
                        <div key={med.id} className="space-y-1">
                          <Badge 
                            variant="outline" 
                            className="bg-blue-100 text-blue-800 border-blue-300"
                          >
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

            {/* Alergias */}
            {temAlergias && (
              <>
                {(temFatoresRisco || temMedicamentos || temTipoParto || temDataParto) && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-700">Alergias</h3>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex flex-wrap gap-2">
                      {alergias.map((alergia) => (
                        <div key={alergia.id} className="space-y-1">
                          <Badge 
                            variant="outline" 
                            className="bg-red-100 text-red-800 border-red-300"
                          >
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

            {/* Observações */}
            {temObservacoes && (
              <>
                {(temFatoresRisco || temMedicamentos || temAlergias || temTipoParto || temDataParto) && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-700">Observações</h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {gestante?.observacoes}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Mensagem se não houver informações */}
            {!temFatoresRisco && !temMedicamentos && !temAlergias && !temObservacoes && !temTipoParto && !temDataParto && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma informação adicional registrada para esta gestante.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
