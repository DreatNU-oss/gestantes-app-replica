import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TextareaComAutocomplete } from "@/components/TextareaComAutocomplete";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import { toast } from "sonner";
import { ArrowLeft, AlertTriangle, Loader2, Copy, Check } from "lucide-react";

// Queixas de urgência (checkboxes)
const QUEIXAS_URGENCIA = [
  "Sangramento Vaginal",
  "Dor em Baixo Ventre / Abdominal",
  "Dor abaixo do Rebordo Costal",
  "Lombalgia",
  "Cefaleia",
  "Perda de Líquido",
  "Febre",
  "Dispneia",
  "Elevação dos Níveis Pressóricos",
  "Sintomas de Resfriado",
  "Contrações Uterinas",
  "Outra (Descreva Abaixo)",
];

// Atividade uterina (checkboxes)
const ATIVIDADE_UTERINA = [
  "Ausência / Não é Possível",
  "Útero Não Palpável no Abdome (1º Trimestre)",
  "Ausente — Tônus Uterino Normal",
  "Contrações de Braxton-Hicks",
  "Trabalho de Parto (>5DU/Montevidéu)",
];

// Condutas de urgência (checkboxes)
const CONDUTAS_URGENCIA = [
  { key: "orientacoes", label: "Orientações" },
  { key: "exames_laboratoriais", label: "Exames Laboratoriais" },
  { key: "progesterona_micronizada", label: "Progesterona Micronizada" },
  { key: "analgesicos", label: "Analgésicos" },
  { key: "us_rins_vias_urinarias", label: "US de Rins e Vias Urinárias" },
  { key: "us_figado_vias_biliares", label: "US de Fígado e Vias Biliares" },
  { key: "internacao_hospitalar", label: "Internação Hospitalar" },
  { key: "indicacao_curetagem", label: "Indicação Curetagem" },
  { key: "indicacao_cesarea", label: "Indicação Cesárea" },
  { key: "outra_conduta", label: "Outra Conduta" },
];

export default function ConsultaUrgencia() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  const [gestanteId, setGestanteId] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);

  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const [formData, setFormData] = useState({
    dataConsulta: getDataHoje(),
    idadeGestacional: "",
    queixasUrgencia: [] as string[],
    detalhamentoQueixa: "",
    pressaoArterial: "",
    auf: "",
    atividadeUterina: [] as string[],
    toqueVaginal: "",
    usgHoje: "",
    hipoteseDiagnostica: "",
    condutaUrgencia: {} as Record<string, boolean>,
    outraCondutaDescricao: "",
    condutaComplementacao: "",
  });

  // Lembretes pendentes
  const [lembretesResolvidos, setLembretesResolvidos] = useState<number[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gId = params.get("gestanteId");
    if (gId) {
      setGestanteId(parseInt(gId));
    } else if (gestanteAtiva) {
      setGestanteId(gestanteAtiva.id);
    }
    // Limpar query params
    if (gId) {
      window.history.replaceState({}, "", "/consulta-urgencia");
    }
  }, [gestanteAtiva]);

  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteId! },
    { enabled: !!gestanteId }
  );

  const { data: lembretesPendentes } = trpc.lembretes.pendentes.useQuery(
    { gestanteId: gestanteId! },
    { enabled: !!gestanteId }
  );

  const utils = trpc.useUtils();

  const createMutation = trpc.consultasPrenatal.create.useMutation({
    onSuccess: (result) => {
      toast.success("Consulta de urgência registrada com sucesso!");

      // Resolver lembretes marcados
      if (lembretesResolvidos.length > 0 && result && (result as any).insertId) {
        resolverLembretesMutation.mutate({
          ids: lembretesResolvidos,
          consultaId: (result as any).insertId,
        });
      }

      // Gerar e mostrar PEP
      const textoGerado = gerarTextoPEP();
      setTextoPEP(textoGerado);
      setShowPEPModal(true);

      utils.consultasPrenatal.list.invalidate();
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao salvar consulta: " + error.message);
    },
  });

  const resolverLembretesMutation = trpc.lembretes.resolver.useMutation({
    onSuccess: () => {
      utils.lembretes.pendentes.invalidate();
    },
  });

  // Estado para PEP
  const [showPEPModal, setShowPEPModal] = useState(false);
  const [textoPEP, setTextoPEP] = useState("");

  // Calcular IG
  const calcularIG = useCallback(
    (dataRef?: string) => {
      if (!gestante) return "";
      const dataReferencia = dataRef || formData.dataConsulta;
      const hoje = new Date(dataReferencia + "T12:00:00");

      // Tentar pela DUM
      if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
        const dumDate = new Date(
          (gestante.dum as string).includes("T")
            ? (gestante.dum as string).split("T")[0] + "T12:00:00"
            : gestante.dum + "T12:00:00"
        );
        if (!isNaN(dumDate.getTime())) {
          const diffMs = hoje.getTime() - dumDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          const semanas = Math.floor(diffDays / 7);
          const dias = diffDays % 7;
          return `${semanas}s ${dias}d`;
        }
      }

      // Tentar pelo US
      if (
        gestante.dataUltrassom &&
        gestante.igUltrassomSemanas !== undefined &&
        gestante.igUltrassomSemanas !== null
      ) {
        const usStr = (gestante.dataUltrassom as string).includes("T")
          ? (gestante.dataUltrassom as string).split("T")[0]
          : gestante.dataUltrassom;
        const dataUS = new Date(usStr + "T12:00:00");
        if (!isNaN(dataUS.getTime())) {
          const diffMs = hoje.getTime() - dataUS.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          const igTotalDias =
            ((gestante.igUltrassomSemanas as number) * 7 +
              ((gestante.igUltrassomDias as number) || 0) +
              diffDays);
          const semanas = Math.floor(igTotalDias / 7);
          const dias = igTotalDias % 7;
          return `${semanas}s ${dias}d`;
        }
      }

      return "";
    },
    [gestante, formData.dataConsulta]
  );

  // Auto-preencher IG quando gestante muda
  useEffect(() => {
    if (gestante) {
      const ig = calcularIG();
      if (ig) {
        setFormData((prev) => ({ ...prev, idadeGestacional: ig }));
      }
    }
  }, [gestante, calcularIG]);

  const toggleQueixa = (queixa: string) => {
    setFormData((prev) => ({
      ...prev,
      queixasUrgencia: prev.queixasUrgencia.includes(queixa)
        ? prev.queixasUrgencia.filter((q) => q !== queixa)
        : [...prev.queixasUrgencia, queixa],
    }));
  };

  const toggleAtividadeUterina = (atividade: string) => {
    setFormData((prev) => ({
      ...prev,
      atividadeUterina: prev.atividadeUterina.includes(atividade)
        ? prev.atividadeUterina.filter((a) => a !== atividade)
        : [...prev.atividadeUterina, atividade],
    }));
  };

  const toggleConduta = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      condutaUrgencia: {
        ...prev.condutaUrgencia,
        [key]: !prev.condutaUrgencia[key],
      },
    }));
  };

  const gerarTextoPEP = () => {
    const linhas: string[] = [];
    linhas.push("CONSULTA DE URGÊNCIA OBSTÉTRICA");
    linhas.push(`Data: ${formData.dataConsulta.split("-").reverse().join("/")}`);
    if (formData.idadeGestacional) linhas.push(`IG: ${formData.idadeGestacional}`);
    linhas.push("");

    if (formData.queixasUrgencia.length > 0) {
      linhas.push("QUEIXAS / URGÊNCIA:");
      formData.queixasUrgencia.forEach((q) => linhas.push(`• ${q}`));
      linhas.push("");
    }

    if (formData.detalhamentoQueixa) {
      linhas.push(`DETALHAMENTO DA QUEIXA: ${formData.detalhamentoQueixa}`);
      linhas.push("");
    }

    if (formData.pressaoArterial) {
      linhas.push(`PRESSÃO ARTERIAL: ${formData.pressaoArterial}`);
    }

    if (formData.auf) {
      linhas.push(`AUF: ${formData.auf}`);
    }

    if (formData.atividadeUterina.length > 0) {
      linhas.push("");
      linhas.push("ATIVIDADE UTERINA:");
      formData.atividadeUterina.forEach((a) => linhas.push(`• ${a}`));
    }

    if (formData.toqueVaginal) {
      linhas.push("");
      linhas.push(`TOQUE VAGINAL: ${formData.toqueVaginal}`);
    }

    if (formData.usgHoje) {
      linhas.push("");
      linhas.push(`USG HOJE: ${formData.usgHoje}`);
    }

    if (formData.hipoteseDiagnostica) {
      linhas.push("");
      linhas.push(`HIPÓTESE DIAGNÓSTICA: ${formData.hipoteseDiagnostica}`);
    }

    const condutasMarcadas = CONDUTAS_URGENCIA.filter(
      (c) => formData.condutaUrgencia[c.key]
    );
    if (condutasMarcadas.length > 0) {
      linhas.push("");
      linhas.push("CONDUTA:");
      condutasMarcadas.forEach((c) => {
        if (c.key === "outra_conduta" && formData.outraCondutaDescricao) {
          linhas.push(`• ${c.label}: ${formData.outraCondutaDescricao}`);
        } else {
          linhas.push(`• ${c.label}`);
        }
      });
    }

    if (formData.condutaComplementacao) {
      linhas.push("");
      linhas.push(`CONDUTA (COMPLEMENTAÇÃO): ${formData.condutaComplementacao}`);
    }

    return linhas.join("\n");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!gestanteId) {
      toast.error("Gestante não identificada");
      return;
    }

    // Calcular IG
    const igStr = calcularIG();
    let igDumSemanas: number | undefined;
    let igDumDias: number | undefined;
    if (igStr) {
      const match = igStr.match(/(\d+)s\s*(\d+)d/);
      if (match) {
        igDumSemanas = parseInt(match[1]);
        igDumDias = parseInt(match[2]);
      }
    }

    // Processar pressão arterial
    let pressaoSistolica: number | undefined;
    let pressaoDiastolica: number | undefined;
    if (formData.pressaoArterial) {
      const paMatch = formData.pressaoArterial.match(/(\d+)\s*[\/xX]\s*(\d+)/);
      if (paMatch) {
        pressaoSistolica = parseInt(paMatch[1]);
        pressaoDiastolica = parseInt(paMatch[2]);
      }
    }

    createMutation.mutate({
      gestanteId,
      dataConsulta: formData.dataConsulta,
      isUrgencia: 1,
      igDumSemanas,
      igDumDias,
      pressaoArterial: formData.pressaoArterial || undefined,
      pressaoSistolica,
      pressaoDiastolica,
      queixasUrgencia: formData.queixasUrgencia.length > 0 ? formData.queixasUrgencia : undefined,
      detalhamentoQueixa: formData.detalhamentoQueixa || undefined,
      auf: formData.auf || undefined,
      atividadeUterina: formData.atividadeUterina.length > 0 ? formData.atividadeUterina : undefined,
      toqueVaginal: formData.toqueVaginal || undefined,
      usgHoje: formData.usgHoje || undefined,
      hipoteseDiagnostica: formData.hipoteseDiagnostica || undefined,
      condutaUrgencia: Object.keys(formData.condutaUrgencia).length > 0 ? formData.condutaUrgencia : undefined,
      outraCondutaDescricao: formData.outraCondutaDescricao || undefined,
      condutaComplementacao: formData.condutaComplementacao || undefined,
      queixas: formData.queixasUrgencia.join(", ") || undefined,
    });
  };

  const resetForm = () => {
    setFormData({
      dataConsulta: getDataHoje(),
      idadeGestacional: "",
      queixasUrgencia: [],
      detalhamentoQueixa: "",
      pressaoArterial: "",
      auf: "",
      atividadeUterina: [],
      toqueVaginal: "",
      usgHoje: "",
      hipoteseDiagnostica: "",
      condutaUrgencia: {},
      outraCondutaDescricao: "",
      condutaComplementacao: "",
    });
    setLembretesResolvidos([]);
  };

  const copiarPEP = async () => {
    try {
      await navigator.clipboard.writeText(textoPEP);
      setCopiado(true);
      toast.success("PEP copiado!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  if (!gestanteId) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhuma gestante selecionada</p>
            <p className="text-muted-foreground mt-2">
              Selecione uma gestante antes de registrar uma consulta de urgência.
            </p>
            <Button className="mt-4" onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#722F37]">
            Consulta de Urgência Obstétrica
          </h1>
          {gestante && (
            <p className="text-muted-foreground">
              Paciente: <span className="font-medium">{gestante.nome}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Lembretes Pendentes */}
          {lembretesPendentes && lembretesPendentes.length > 0 && (
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Lembretes da Consulta Anterior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lembretesPendentes.map((lembrete: any) => (
                  <div key={lembrete.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`lembrete-${lembrete.id}`}
                      checked={lembretesResolvidos.includes(lembrete.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setLembretesResolvidos((prev) => [...prev, lembrete.id]);
                        } else {
                          setLembretesResolvidos((prev) =>
                            prev.filter((id) => id !== lembrete.id)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`lembrete-${lembrete.id}`}
                      className={`text-sm cursor-pointer ${
                        lembretesResolvidos.includes(lembrete.id)
                          ? "line-through text-muted-foreground"
                          : "text-yellow-800"
                      }`}
                    >
                      {lembrete.conduta}
                    </label>
                  </div>
                ))}
                <p className="text-xs text-yellow-600 mt-2">
                  Marque os itens resolvidos. Itens não marcados permanecerão para a próxima consulta.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Data e IG */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data da Consulta</Label>
                  <Input
                    type="date"
                    value={formData.dataConsulta}
                    onChange={(e) =>
                      setFormData({ ...formData, dataConsulta: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Idade Gestacional</Label>
                  <Input
                    value={formData.idadeGestacional}
                    onChange={(e) =>
                      setFormData({ ...formData, idadeGestacional: e.target.value })
                    }
                    placeholder="Ex: 32s 4d"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queixas / Urgência */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#722F37]">
                Queixas / Urgência:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUEIXAS_URGENCIA.map((queixa) => (
                  <div key={queixa} className="flex items-center gap-2">
                    <Checkbox
                      id={`queixa-${queixa}`}
                      checked={formData.queixasUrgencia.includes(queixa)}
                      onCheckedChange={() => toggleQueixa(queixa)}
                    />
                    <label
                      htmlFor={`queixa-${queixa}`}
                      className="text-sm cursor-pointer"
                    >
                      {queixa}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento da Queixa */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#722F37]">
                Detalhamento da Queixa:
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaComAutocomplete
                value={formData.detalhamentoQueixa}
                onChange={(detalhamentoQueixa) =>
                  setFormData({ ...formData, detalhamentoQueixa })
                }
                placeholder="Detalhe a queixa da paciente..."
                rows={3}
                tipo="observacao"
              />
            </CardContent>
          </Card>

          {/* Pressão Arterial */}
          <Card>
            <CardContent className="pt-6">
              <Label>Pressão Arterial</Label>
              <Input
                value={formData.pressaoArterial}
                onChange={(e) =>
                  setFormData({ ...formData, pressaoArterial: e.target.value })
                }
                placeholder="Ex: 120/80"
              />
            </CardContent>
          </Card>

          {/* AUF */}
          <Card>
            <CardContent className="pt-6">
              <Label>AUF (Altura Uterina de Fundo)</Label>
              <TextareaComAutocomplete
                value={formData.auf}
                onChange={(auf) => setFormData({ ...formData, auf })}
                placeholder="Altura uterina de fundo..."
                rows={1}
                tipo="observacao"
              />
            </CardContent>
          </Card>

          {/* Atividade Uterina */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#722F37]">
                Atividade Uterina:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ATIVIDADE_UTERINA.map((atividade) => (
                <div key={atividade} className="flex items-center gap-2">
                  <Checkbox
                    id={`atividade-${atividade}`}
                    checked={formData.atividadeUterina.includes(atividade)}
                    onCheckedChange={() => toggleAtividadeUterina(atividade)}
                  />
                  <label
                    htmlFor={`atividade-${atividade}`}
                    className="text-sm cursor-pointer"
                  >
                    {atividade}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Toque Vaginal */}
          <Card>
            <CardContent className="pt-6">
              <Label>Toque Vaginal</Label>
              <TextareaComAutocomplete
                value={formData.toqueVaginal}
                onChange={(toqueVaginal) =>
                  setFormData({ ...formData, toqueVaginal })
                }
                placeholder="Resultado do toque vaginal..."
                rows={2}
                tipo="observacao"
              />
            </CardContent>
          </Card>

          {/* USG Hoje */}
          <Card>
            <CardContent className="pt-6">
              <Label>USG Hoje</Label>
              <TextareaComAutocomplete
                value={formData.usgHoje}
                onChange={(usgHoje) => setFormData({ ...formData, usgHoje })}
                placeholder="Resultado da USG realizada hoje..."
                rows={2}
                tipo="observacao"
              />
            </CardContent>
          </Card>

          {/* Hipótese Diagnóstica */}
          <Card>
            <CardContent className="pt-6">
              <Label>Hipótese Diagnóstica</Label>
              <TextareaComAutocomplete
                value={formData.hipoteseDiagnostica}
                onChange={(hipoteseDiagnostica) =>
                  setFormData({ ...formData, hipoteseDiagnostica })
                }
                placeholder="Hipótese diagnóstica..."
                rows={2}
                tipo="observacao"
              />
            </CardContent>
          </Card>

          {/* Condutas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#722F37]">Conduta:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CONDUTAS_URGENCIA.map((conduta) => (
                  <div key={conduta.key}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`conduta-${conduta.key}`}
                        checked={!!formData.condutaUrgencia[conduta.key]}
                        onCheckedChange={() => toggleConduta(conduta.key)}
                      />
                      <label
                        htmlFor={`conduta-${conduta.key}`}
                        className="text-sm cursor-pointer"
                      >
                        {conduta.label}
                      </label>
                    </div>
                    {/* Campo de descrição para "Outra Conduta" */}
                    {conduta.key === "outra_conduta" &&
                      formData.condutaUrgencia["outra_conduta"] && (
                        <div className="ml-6 mt-2">
                          <TextareaComAutocomplete
                            value={formData.outraCondutaDescricao}
                            onChange={(outraCondutaDescricao) =>
                              setFormData({ ...formData, outraCondutaDescricao })
                            }
                            placeholder="Descreva a conduta..."
                            rows={2}
                            tipo="conduta_complementacao"
                          />
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conduta (complementação) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#722F37]">
                Conduta (complementação):
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaComAutocomplete
                value={formData.condutaComplementacao}
                onChange={(condutaComplementacao) =>
                  setFormData({ ...formData, condutaComplementacao })
                }
                placeholder="Complementação da conduta..."
                rows={3}
                tipo="conduta_complementacao"
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#722F37] hover:bg-[#5a252c]"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {createMutation.isPending ? "Salvando..." : "Salvar Consulta de Urgência"}
            </Button>
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>

      {/* Modal PEP */}
      {showPEPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#722F37]">
                  Texto PEP - Consulta de Urgência
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarPEP}
                  className="flex items-center gap-1"
                >
                  {copiado ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                {textoPEP}
              </pre>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setShowPEPModal(false);
                    window.history.back();
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
