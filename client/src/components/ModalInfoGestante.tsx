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
import { AlertTriangle, Pill, FileText, Loader2 } from "lucide-react";

// Mapeamento de tipos de fatores de risco para labels legíveis
const fatoresRiscoLabels: Record<string, string> = {
  alergia_medicamentos: "Alergia a Medicamentos",
  alteracoes_morfologicas_fetais: "Alterações Morfológicas Fetais",
  cirurgia_uterina_previa: "Cirurgia Uterina Prévia",
  diabetes_gestacional: "Diabetes Gestacional",
  diabetes_previa: "Diabetes Prévia",
  doenca_autoimune: "Doença Autoimune",
  doenca_cardiaca: "Doença Cardíaca",
  doenca_psiquiatrica: "Doença Psiquiátrica",
  doenca_renal: "Doença Renal",
  doenca_tireoide: "Doença da Tireoide",
  gestacao_gemelar: "Gestação Gemelar",
  hipertensao_cronica: "Hipertensão Crônica",
  hipertensao_gestacional: "Hipertensão Gestacional",
  infeccao_urinaria_recorrente: "Infecção Urinária Recorrente",
  obesidade: "Obesidade",
  pe_preeclampsia: "Pré-Eclâmpsia",
  placenta_previa: "Placenta Prévia",
  restricao_crescimento_fetal: "Restrição de Crescimento Fetal",
  trombofilia: "Trombofilia",
  malformacoes_mullerianas: "Malformações Müllerianas",
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

  const temFatoresRisco = fatoresRisco && fatoresRisco.length > 0;
  const temMedicamentos = medicamentos && medicamentos.length > 0;
  const temObservacoes = gestante?.observacoes && gestante.observacoes.trim() !== "";

  // Se não houver nenhuma informação, fechar o modal automaticamente
  useEffect(() => {
    if (!isLoading && open && !temFatoresRisco && !temMedicamentos && !temObservacoes) {
      // Fechar após um pequeno delay para não parecer um bug
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, open, temFatoresRisco, temMedicamentos, temObservacoes, onOpenChange]);

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
            {/* Fatores de Risco */}
            {temFatoresRisco && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-amber-700">Fatores de Risco</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {fatoresRisco.map((fator) => (
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
            )}

            {/* Medicamentos em Uso */}
            {temMedicamentos && (
              <>
                {temFatoresRisco && <Separator />}
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

            {/* Observações */}
            {temObservacoes && (
              <>
                {(temFatoresRisco || temMedicamentos) && <Separator />}
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
            {!temFatoresRisco && !temMedicamentos && !temObservacoes && (
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
