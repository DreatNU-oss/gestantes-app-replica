import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { TextareaComAutocomplete } from "@/components/TextareaComAutocomplete";
import { SUGESTOES_QUEIXAS } from "@/lib/sugestoesQueixas";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Stethoscope,
  Pill,
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  Baby,
  Heart,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// Lista de checkboxes de conduta da 1ª consulta
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

// Função para normalizar data para formato YYYY-MM-DD
const normalizarData = (data: string): string => {
  if (!data) return '';
  if (data.includes('T')) return data.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const d = new Date(data);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return data;
};

interface WizardPrimeiraConsultaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestante: {
    id: number;
    nome: string;
    dum?: string | null;
    dataUltrassom?: string | null;
    igUltrassomSemanas?: number | null;
    igUltrassomDias?: number | null;
    gesta?: number | null;
    para?: number | null;
    partosNormais?: number | null;
    cesareas?: number | null;
    abortos?: number | null;
  };
  onSuccess: () => void;
}

export default function WizardPrimeiraConsulta({
  open,
  onOpenChange,
  gestante,
  onSuccess,
}: WizardPrimeiraConsultaProps) {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showPEP, setShowPEP] = useState(false);
  const [textoPEP, setTextoPEP] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Estado do formulário - Etapa 1 (Anamnese)
  const [anamnese, setAnamnese] = useState({
    historiaPatologicaPregressa: "",
    historiaSocial: "",
    historiaFamiliar: "",
  });

  // Estado do formulário - Etapa 2 (Exame Físico)
  const [exameFisico, setExameFisico] = useState({
    queixas: "",
    peso: "",
    pressaoArterial: "",
    alturaUterina: "",
    bcf: "",
    edema: "",
  });

  // Estado do formulário - Etapa 3 (Conduta)
  const [condutaCheckboxes, setCondutaCheckboxes] = useState<Record<string, boolean>>({});
  const [condutaComplementacao, setCondutaComplementacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const createConsulta = trpc.consultasPrenatal.create.useMutation();

  // Calcular IG pela DUM
  const igDum = useMemo(() => {
    if (!gestante.dum || gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US') {
      if (gestante.dum === 'Incerta') return "DUM Incerta";
      if (gestante.dum === 'Incompatível com US') return "Incompatível com US";
      return "Não informada";
    }
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return "Não informada";
    const diffMs = hoje.getTime() - dumDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(diffDays / 7);
    const dias = diffDays % 7;
    return `${semanas}s ${dias}d`;
  }, [gestante.dum]);

  // Calcular IG pelo US
  const igUs = useMemo(() => {
    if (!gestante.dataUltrassom || gestante.igUltrassomSemanas === undefined || gestante.igUltrassomSemanas === null) return "Não informada";
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return "Não informada";
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const igTotalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diffDays;
    const semanas = Math.floor(igTotalDias / 7);
    const dias = igTotalDias % 7;
    return `${semanas}s ${dias}d`;
  }, [gestante.dataUltrassom, gestante.igUltrassomSemanas, gestante.igUltrassomDias]);

  // Calcular DPP pela DUM
  const dppDum = useMemo(() => {
    if (!gestante.dum || gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US') return "-";
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return "-";
    const dppDate = new Date(dumDate);
    dppDate.setDate(dppDate.getDate() + 280);
    return dppDate.toLocaleDateString('pt-BR');
  }, [gestante.dum]);

  // Calcular DPP pelo US
  const dppUs = useMemo(() => {
    if (!gestante.dataUltrassom || gestante.igUltrassomSemanas === undefined || gestante.igUltrassomSemanas === null) return "-";
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return "-";
    const diasRestantes = (40 * 7) - ((gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0));
    const dppDate = new Date(dataUS);
    dppDate.setDate(dppDate.getDate() + diasRestantes);
    return dppDate.toLocaleDateString('pt-BR');
  }, [gestante.dataUltrassom, gestante.igUltrassomSemanas, gestante.igUltrassomDias]);

  // Paridade
  const paridade = useMemo(() => {
    const g = gestante.gesta ?? 0;
    const p = gestante.para ?? 0;
    const a = gestante.abortos ?? 0;
    return `G${g}P${p}A${a}`;
  }, [gestante.gesta, gestante.para, gestante.abortos]);

  // Calcular IG numérica para salvar
  const calcularIgNumerica = () => {
    // Tentar pelo US primeiro
    if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== undefined && gestante.igUltrassomSemanas !== null) {
      const hoje = new Date();
      hoje.setHours(12, 0, 0, 0);
      const usNorm = normalizarData(gestante.dataUltrassom);
      const dataUS = new Date(usNorm + "T12:00:00");
      if (!isNaN(dataUS.getTime())) {
        const diffMs = hoje.getTime() - dataUS.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const igTotalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diffDays;
        return { semanas: Math.floor(igTotalDias / 7), dias: igTotalDias % 7 };
      }
    }
    // Tentar pela DUM
    if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
      const hoje = new Date();
      hoje.setHours(12, 0, 0, 0);
      const dumNorm = normalizarData(gestante.dum);
      const dumDate = new Date(dumNorm + "T12:00:00");
      if (!isNaN(dumDate.getTime())) {
        const diffMs = hoje.getTime() - dumDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return { semanas: Math.floor(diffDays / 7), dias: diffDays % 7 };
      }
    }
    return null;
  };

  // Calcular IG DUM numérica
  const calcularIgDumNumerica = () => {
    if (!gestante.dum || gestante.dum === 'Incerta' || gestante.dum === 'Incompatível com US') return null;
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return null;
    const diffMs = hoje.getTime() - dumDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return { semanas: Math.floor(diffDays / 7), dias: diffDays % 7 };
  };

  // Calcular IG US numérica
  const calcularIgUsNumerica = () => {
    if (!gestante.dataUltrassom || gestante.igUltrassomSemanas === undefined || gestante.igUltrassomSemanas === null) return null;
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return null;
    const diffMs = hoje.getTime() - dataUS.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const igTotalDias = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diffDays;
    return { semanas: Math.floor(igTotalDias / 7), dias: igTotalDias % 7 };
  };

  // Gerar texto PEP
  const gerarTextoPEP = () => {
    const ig = calcularIgNumerica();
    const igTexto = ig ? `${ig.semanas}s ${ig.dias}d` : "-";

    // Formatar BCF
    let bcfTexto = "-";
    if (exameFisico.bcf === "1") bcfTexto = "Positivo";
    else if (exameFisico.bcf === "2") bcfTexto = "Não audível";

    // Formatar Edema
    let edemaTexto = "-";
    if (exameFisico.edema === "0") edemaTexto = "Ausente";
    else if (exameFisico.edema === "1") edemaTexto = "+";
    else if (exameFisico.edema === "2") edemaTexto = "++";
    else if (exameFisico.edema === "3") edemaTexto = "+++";
    else if (exameFisico.edema === "4") edemaTexto = "++++";

    // Formatar AUF
    let aufTexto = "-";
    if (exameFisico.alturaUterina === "nao_palpavel") aufTexto = "Não palpável";
    else if (exameFisico.alturaUterina) aufTexto = `${exameFisico.alturaUterina}cm`;

    // Condutas selecionadas
    const condutasSelecionadas = CONDUTA_CHECKBOXES
      .filter(c => condutaCheckboxes[c.key])
      .map(c => c.label);

    const linhas = [
      `PRÉ-NATAL - 1ª CONSULTA`,
      ``,
      `Paridade: ${paridade}`,
      `Idade Gestacional (DUM): ${igDum}`,
      `Idade Gestacional (US): ${igUs}`,
      `Queixa(s): ${exameFisico.queixas || "Sem queixas hoje."}`,
      `História Patológica Pregressa: ${anamnese.historiaPatologicaPregressa || "-"}`,
      `História Social: ${anamnese.historiaSocial || "-"}`,
      `História Familiar: ${anamnese.historiaFamiliar || "-"}`,
      `Peso: ${exameFisico.peso ? `${exameFisico.peso}kg` : "-"}`,
      `Pressão Arterial: ${exameFisico.pressaoArterial || "-"}`,
      `AUF: ${aufTexto}`,
      `BCF: ${bcfTexto}`,
      `Edema: ${edemaTexto}`,
      `Conduta: ${condutasSelecionadas.length > 0 ? condutasSelecionadas.join(", ") : "-"}`,
    ];

    if (condutaComplementacao) {
      linhas.push(`Conduta (complementação): ${condutaComplementacao}`);
    }

    if (observacoes) {
      linhas.push(`Observações: ${observacoes}`);
    }

    return linhas.join("\n\n");
  };

  // Salvar consulta
  const handleSalvar = async () => {
    setIsSaving(true);
    try {
      const hoje = new Date();
      const dataConsulta = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

      const ig = calcularIgNumerica();
      const igDumNum = calcularIgDumNumerica();
      const igUsNum = calcularIgUsNumerica();

      // Processar pressão arterial
      let pressaoSistolica: number | undefined;
      let pressaoDiastolica: number | undefined;
      if (exameFisico.pressaoArterial) {
        const match = exameFisico.pressaoArterial.match(/(\d+)\s*[\/xX]\s*(\d+)/);
        if (match) {
          pressaoSistolica = parseInt(match[1]);
          pressaoDiastolica = parseInt(match[2]);
        }
      }

      // Condutas selecionadas como array de strings (para campo conduta existente)
      const condutasSelecionadas = CONDUTA_CHECKBOXES
        .filter(c => condutaCheckboxes[c.key])
        .map(c => c.label);

      await createConsulta.mutateAsync({
        gestanteId: gestante.id,
        dataConsulta,
        igSemanas: ig?.semanas,
        igDias: ig?.dias,
        igDumSemanas: igDumNum?.semanas,
        igDumDias: igDumNum?.dias,
        igUltrassomSemanas: igUsNum?.semanas,
        igUltrassomDias: igUsNum?.dias,
        peso: exameFisico.peso ? Math.round(parseFloat(exameFisico.peso) * 1000) : undefined,
        pressaoArterial: exameFisico.pressaoArterial || undefined,
        pressaoSistolica,
        pressaoDiastolica,
        alturaUterina: exameFisico.alturaUterina === "nao_palpavel" ? -1 : (exameFisico.alturaUterina ? Math.round(parseFloat(exameFisico.alturaUterina) * 10) : undefined),
        bcf: exameFisico.bcf ? parseInt(exameFisico.bcf) : undefined,
        edema: exameFisico.edema || undefined,
        conduta: condutasSelecionadas.length > 0 ? JSON.stringify(condutasSelecionadas) : undefined,
        condutaComplementacao: condutaComplementacao || undefined,
        observacoes: observacoes || undefined,
        queixas: exameFisico.queixas || undefined,
        // Campos específicos da 1ª consulta
        isPrimeiraConsulta: 1,
        historiaPatologicaPregressa: anamnese.historiaPatologicaPregressa || undefined,
        historiaSocial: anamnese.historiaSocial || undefined,
        historiaFamiliar: anamnese.historiaFamiliar || undefined,
        condutaCheckboxes: condutaCheckboxes,
      });

      // Gerar texto PEP e redirecionar para cartão com PEP aberto
      const pep = gerarTextoPEP();
      setTextoPEP(pep);
      
      toast.success("1ª Consulta registrada com sucesso!");
      
      // Redirecionar para o cartão pré-natal com modal PEP aberto
      onOpenChange(false);
      const pepEncoded = encodeURIComponent(pep);
      window.location.href = `/cartao-prenatal?gestanteId=${gestante.id}&showPEP=true&pepTexto=${pepEncoded}`;
    } catch (error) {
      console.error("Erro ao salvar consulta:", error);
      toast.error("Erro ao salvar consulta. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const copiarPEP = async () => {
    try {
      await navigator.clipboard.writeText(textoPEP);
      setCopiado(true);
      toast.success("Texto copiado para a área de transferência!");
      setTimeout(() => setCopiado(false), 2000);
      // Redirecionar para o cartão pré-natal com scroll para marcos
      setTimeout(() => {
        irParaCartaoPrenatal(false);
      }, 500);
    } catch {
      toast.error("Erro ao copiar texto");
    }
  };

  const irParaCartaoPrenatal = (comPEP: boolean) => {
    setShowPEP(false);
    setEtapaAtual(1);
    setAnamnese({ historiaPatologicaPregressa: "", historiaSocial: "", historiaFamiliar: "" });
    setExameFisico({ queixas: "", peso: "", pressaoArterial: "", alturaUterina: "", bcf: "", edema: "" });
    setCondutaCheckboxes({});
    setCondutaComplementacao("");
    setObservacoes("");
    onOpenChange(false);
    
    if (comPEP) {
      // Ir para cartão com modal PEP aberto
      const pepEncoded = encodeURIComponent(textoPEP);
      window.location.href = `/cartao-prenatal?gestanteId=${gestante.id}&showPEP=true&pepTexto=${pepEncoded}`;
    } else {
      // Ir para cartão e scroll para marcos
      window.location.href = `/cartao-prenatal?gestanteId=${gestante.id}&scrollToMarcos=true`;
    }
  };

  const fecharTudo = () => {
    irParaCartaoPrenatal(false);
  };

  const etapas = [
    { num: 1, titulo: "Anamnese", icone: ClipboardList },
    { num: 2, titulo: "Exame Físico", icone: Stethoscope },
    { num: 3, titulo: "Conduta", icone: Pill },
  ];

  return (
    <>
      <Dialog open={open && !showPEP} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Stethoscope className="h-5 w-5 text-[#722F37]" />
              Pré-Natal 1ª Consulta - {gestante.nome}
            </DialogTitle>
          </DialogHeader>

          {/* Barra de Progresso */}
          <div className="flex items-center justify-between mb-6">
            {etapas.map((etapa, index) => {
              const Icon = etapa.icone;
              const isActive = etapaAtual === etapa.num;
              const isCompleted = etapaAtual > etapa.num;
              return (
                <div key={etapa.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-[#722F37] text-white shadow-lg"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isActive ? "text-[#722F37]" : isCompleted ? "text-emerald-600" : "text-muted-foreground"
                      }`}
                    >
                      {etapa.titulo}
                    </span>
                  </div>
                  {index < etapas.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-all ${
                        isCompleted ? "bg-emerald-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Etapa 1 - Anamnese */}
          {etapaAtual === 1 && (
            <div className="space-y-4">
              {/* Dados automáticos */}
              <Card className="border-[#722F37]/20 bg-[#722F37]/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Baby className="h-4 w-4 text-[#722F37]" />
                    <span className="font-semibold text-[#722F37] text-sm">Dados da Gestante (automáticos)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Paridade:</span>
                      <span className="ml-2 font-medium">{paridade}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hist. Obstétrica:</span>
                      <span className="ml-2 font-medium">
                        PN:{gestante.partosNormais ?? 0} PC:{gestante.cesareas ?? 0} A:{gestante.abortos ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IG (DUM):</span>
                      <span className="ml-2 font-medium">{igDum}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IG (US):</span>
                      <span className="ml-2 font-medium">{igUs}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">DPP (DUM):</span>
                      <span className="ml-2 font-medium">{dppDum}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">DPP (US):</span>
                      <span className="ml-2 font-medium">{dppUs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campos de história */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">História Patológica Pregressa</Label>
                  <TextareaComAutocomplete
                    placeholder="Doenças prévias, cirurgias, internações..."
                    value={anamnese.historiaPatologicaPregressa}
                    onChange={(val) => setAnamnese({ ...anamnese, historiaPatologicaPregressa: val })}
                    tipo="historia_patologica"
                    rows={3}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">História Social</Label>
                  <TextareaComAutocomplete
                    placeholder="Tabagismo, etilismo, drogas, profissão, situação conjugal..."
                    value={anamnese.historiaSocial}
                    onChange={(val) => setAnamnese({ ...anamnese, historiaSocial: val })}
                    tipo="historia_social"
                    rows={3}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">História Familiar</Label>
                  <TextareaComAutocomplete
                    placeholder="HAS, DM, pré-eclâmpsia, doenças genéticas na família..."
                    value={anamnese.historiaFamiliar}
                    onChange={(val) => setAnamnese({ ...anamnese, historiaFamiliar: val })}
                    tipo="historia_familiar"
                    rows={3}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2 - Exame Físico */}
          {etapaAtual === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Queixas</Label>
                <AutocompleteInput
                  value={exameFisico.queixas}
                  onChange={(val) => setExameFisico({ ...exameFisico, queixas: val })}
                  suggestions={SUGESTOES_QUEIXAS}
                  placeholder="Ex: Sem queixas hoje / Dor lombar / Náuseas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68.5"
                    value={exameFisico.peso}
                    onChange={(e) => setExameFisico({ ...exameFisico, peso: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Pressão Arterial</Label>
                  <Input
                    placeholder="Ex: 120/80"
                    value={exameFisico.pressaoArterial}
                    onChange={(e) => setExameFisico({ ...exameFisico, pressaoArterial: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">AUF (cm)</Label>
                  <select
                    value={exameFisico.alturaUterina}
                    onChange={(e) => setExameFisico({ ...exameFisico, alturaUterina: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione...</option>
                    <option value="nao_palpavel">Útero não palpável</option>
                    {Array.from({ length: 31 }, (_, i) => i + 10).map(cm => (
                      <option key={cm} value={String(cm)}>{cm} cm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">BCF</Label>
                  <Select
                    value={exameFisico.bcf}
                    onValueChange={(value) => setExameFisico({ ...exameFisico, bcf: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Positivo</SelectItem>
                      <SelectItem value="2">Não audível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Edema</Label>
                <Select
                  value={exameFisico.edema}
                  onValueChange={(value) => setExameFisico({ ...exameFisico, edema: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ausente</SelectItem>
                    <SelectItem value="1">+</SelectItem>
                    <SelectItem value="2">++</SelectItem>
                    <SelectItem value="3">+++</SelectItem>
                    <SelectItem value="4">++++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Etapa 3 - Conduta */}
          {etapaAtual === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-3 block">Conduta</Label>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CONDUTA_CHECKBOXES.map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.key}
                            checked={condutaCheckboxes[item.key] || false}
                            onCheckedChange={(checked) =>
                              setCondutaCheckboxes({
                                ...condutaCheckboxes,
                                [item.key]: checked === true,
                              })
                            }
                          />
                          <label
                            htmlFor={item.key}
                            className="text-sm cursor-pointer leading-tight"
                          >
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label className="text-sm font-semibold">Conduta (complementação)</Label>
                <TextareaComAutocomplete
                  placeholder="Complementação da conduta..."
                  value={condutaComplementacao}
                  onChange={(val) => setCondutaComplementacao(val)}
                  tipo="conduta_complementacao"
                  rows={2}
                  className="mt-1 min-h-[60px]"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold">Observações</Label>
                <TextareaComAutocomplete
                  placeholder="Observações gerais..."
                  value={observacoes}
                  onChange={(val) => setObservacoes(val)}
                  tipo="observacao"
                  rows={2}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (etapaAtual === 1) {
                  onOpenChange(false);
                } else {
                  setEtapaAtual(etapaAtual - 1);
                }
              }}
              disabled={isSaving}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {etapaAtual === 1 ? "Cancelar" : "Voltar"}
            </Button>

            {etapaAtual < 3 ? (
              <Button
                onClick={() => setEtapaAtual(etapaAtual + 1)}
                className="bg-[#722F37] hover:bg-[#5a252c]"
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSalvar}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Consulta
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Texto PEP */}
      <Dialog open={showPEP} onOpenChange={(open) => {
        if (!open) fecharTudo();
      }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#722F37]" />
              Texto para PEP - 1ª Consulta
            </DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
            {textoPEP}
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={fecharTudo}>
              Fechar
            </Button>
            <Button
              onClick={copiarPEP}
              className={copiado ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#722F37] hover:bg-[#5a252c]"}
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar para PEP
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
