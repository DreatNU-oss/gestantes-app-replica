import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { formatarParidade } from "@shared/paridade";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Plane,
  Calendar,
  Baby,
  Heart,
  AlertTriangle,
  Pill,
  ShieldAlert,
  FileText,
  Smartphone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

// Labels de fatores de risco
const fatoresRiscoLabels: Record<string, string> = {
  alergia_medicamentos: "Alergia a Medicamentos",
  alteracoes_morfologicas_fetais: "Alterações Morfológicas Fetais",
  anemia_falciforme: "Anemia Falciforme",
  cirurgia_uterina_previa: "Cirurgia Uterina Prévia",
  diabetes_gestacional: "Diabetes Gestacional",
  diabetes_previa: "Diabetes Prévia",
  diabetes_tipo_1: "Diabetes Tipo 1",
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
  fiv_nesta_gestacao: "FIV nesta Gestação",
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
  aas: "AAS (Ácido Acetilsalicílico)",
  acido_folico: "Ácido Fólico",
  anti_hipertensivos: "Anti-hipertensivos",
  calcio: "Carbonato de Cálcio",
  carbonato_calcio: "Carbonato de Cálcio",
  enoxaparina: "Enoxaparina",
  insulina: "Insulina",
  levotiroxina: "Levotiroxina",
  medicamentos_inalatorios: "Medicamentos Inalatórios",
  polivitaminicos: "Polivitamínicos",
  progestagenos: "Progestágenos",
  psicotropicos: "Psicotrópicos",
  sulfato_ferroso: "Sulfato Ferroso",
  outros: "Outros",
  outro: "Outro",
};

const tipoPartoLabels: Record<string, string> = {
  cesariana: "Cesárea",
  normal: "Parto Normal",
  a_definir: "A Definir",
};

interface GestanteComCalculos {
  id: number;
  nome: string;
  dum?: string | null;
  dataUltrassom?: string | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
  tipoPartoDesejado?: string | null;
  dataPartoProgramado?: string | null;
  motivoCesarea?: string | null;
  motivoCesareaOutro?: string | null;
  nomeBebe?: string | null;
  sexoBebe?: string | null;
  gesta?: number | null;
  para?: number | null;
  partosNormais?: number | null;
  cesareas?: number | null;
  abortos?: number | null;
  observacoes?: string | null;
  medicoId?: number | null;
  baixouApp?: boolean;
  hospitalParto?: string | null;
  calculado?: {
    igDUM?: { semanas: number; dias: number; totalDias: number } | null;
    igUS?: { semanas: number; dias: number; totalDias: number } | null;
    dpp?: string | null;
    dppUS?: string | null;
    idade?: number | null;
  } | null;
}

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

function normalizarData(data: string): string {
  if (!data) return '';
  if (data.includes('T')) return data.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  const d = new Date(data);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return data;
}

function calcularIgNaData(gestante: GestanteComCalculos, dataAlvo: Date): { semanas: number; dias: number; totalDias: number } | null {
  dataAlvo.setHours(12, 0, 0, 0);

  // Priorizar US
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null && gestante.igUltrassomSemanas !== undefined) {
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (isNaN(dataUS.getTime())) return null;
    const diffMs = dataAlvo.getTime() - dataUS.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const igTotalDias = ((gestante.igUltrassomSemanas ?? 0) * 7) + (gestante.igUltrassomDias || 0) + diffDays;
    if (igTotalDias < 0) return null;
    return {
      semanas: Math.floor(igTotalDias / 7),
      dias: igTotalDias % 7,
      totalDias: igTotalDias,
    };
  }

  // Fallback DUM
  if (gestante.dum && gestante.dum !== "Incerta" && !gestante.dum.includes("Incompatível")) {
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (isNaN(dumDate.getTime())) return null;
    const diffMs = dataAlvo.getTime() - dumDate.getTime();
    const totalDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (totalDias < 0) return null;
    return {
      semanas: Math.floor(totalDias / 7),
      dias: totalDias % 7,
      totalDias,
    };
  }

  return null;
}

function calcularDppGestante(gestante: GestanteComCalculos): { data: Date; tipo: string } | null {
  // Prioridade 1: DPP por US
  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null && gestante.igUltrassomSemanas !== undefined) {
    const usNorm = normalizarData(gestante.dataUltrassom);
    const dataUS = new Date(usNorm + "T12:00:00");
    if (!isNaN(dataUS.getTime())) {
      const igTotalDias = ((gestante.igUltrassomSemanas ?? 0) * 7) + (gestante.igUltrassomDias || 0);
      const diasRestantes = 280 - igTotalDias;
      const dpp = new Date(dataUS);
      dpp.setDate(dpp.getDate() + diasRestantes);
      return { data: dpp, tipo: "DPP US" };
    }
  }

  // Prioridade 2: DPP por DUM
  if (gestante.dum && gestante.dum !== "Incerta" && !gestante.dum.includes("Incompatível")) {
    const dumNorm = normalizarData(gestante.dum);
    const dumDate = new Date(dumNorm + "T12:00:00");
    if (!isNaN(dumDate.getTime())) {
      const dpp = new Date(dumDate);
      dpp.setDate(dpp.getDate() + 280);
      return { data: dpp, tipo: "DPP DUM" };
    }
  }

  return null;
}

function calcularIgAtualFormatada(gestante: GestanteComCalculos): string {
  const hoje = new Date();
  const ig = calcularIgNaData(gestante, hoje);
  if (!ig) return "-";
  return `${ig.semanas}s ${ig.dias}d`;
}

function calcularDppFormatada(gestante: GestanteComCalculos): string {
  const dpp = calcularDppGestante(gestante);
  if (!dpp) return "-";
  return formatDateBR(dpp.data.toISOString().split("T")[0]);
}

export default function QueroViajar({ gestantes, medicos }: { gestantes: GestanteComCalculos[]; medicos: { id: number; nome: string }[] }) {

  const [aberto, setAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [igMinima, setIgMinima] = useState([37]);
  const [copiado, setCopiado] = useState(false);
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  // Filtrar gestantes que estarão a termo no período
  const gestantesFiltradas = useMemo(() => {
    if (!gestantes || !dataInicio || !dataFim) return [];

    const igMinSemanas = igMinima[0];
    const igMinDias = igMinSemanas * 7;

    return gestantes.filter((g) => {
      // Verificar se a gestante terá IG >= igMinima em algum momento durante o período
      const inicio = new Date(dataInicio + "T12:00:00");
      const fim = new Date(dataFim + "T12:00:00");

      // Calcular IG no início e no fim do período
      const igNoInicio = calcularIgNaData(g, new Date(inicio));
      const igNoFim = calcularIgNaData(g, new Date(fim));

      if (!igNoInicio && !igNoFim) return false;

      // Se a IG no fim do período for >= igMinima, a gestante estará a termo em algum momento
      // E a IG no início não deve ser > 42 semanas (já teria passado)
      const igFimDias = igNoFim?.totalDias ?? 0;
      const igInicioDias = igNoInicio?.totalDias ?? 0;

      // A gestante está no range se:
      // - Sua IG no fim do período >= IG mínima (ela atinge o termo durante o período)
      // - Sua IG no início do período <= 294 dias (42 semanas) - não passou demais
      return igFimDias >= igMinDias && igInicioDias <= 294;
    }).sort((a, b) => {
      // Ordenar por DPP (mais próximo primeiro)
      const dppA = calcularDppGestante(a);
      const dppB = calcularDppGestante(b);
      if (!dppA && !dppB) return 0;
      if (!dppA) return 1;
      if (!dppB) return -1;
      return dppA.data.getTime() - dppB.data.getTime();
    });
  }, [gestantes, dataInicio, dataFim, igMinima]);

  // IDs para buscar dados em lote
  const gestanteIds = useMemo(() => gestantesFiltradas.map(g => g.id), [gestantesFiltradas]);

  // Buscar fatores de risco e medicamentos em lote
  const { data: dadosExtras } = trpc.queroViajar.dadosGestantes.useQuery(
    { gestanteIds },
    { enabled: gestanteIds.length > 0 }
  );

  const toggleExpandido = useCallback((id: number) => {
    setExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandirTodos = useCallback(() => {
    if (expandidos.size === gestantesFiltradas.length) {
      setExpandidos(new Set());
    } else {
      setExpandidos(new Set(gestantesFiltradas.map(g => g.id)));
    }
  }, [expandidos.size, gestantesFiltradas]);

  // Gerar texto formatado para WhatsApp
  const gerarTextoWhatsApp = useCallback(() => {
    if (gestantesFiltradas.length === 0) return "";

    const linhas: string[] = [];
    linhas.push(`*GESTANTES A TERMO*`);
    linhas.push(`Período de ausência: ${formatDateBR(dataInicio)} a ${formatDateBR(dataFim)}`);
    linhas.push(`IG mínima: ${igMinima[0]} semanas`);
    linhas.push(`Total: ${gestantesFiltradas.length} gestante${gestantesFiltradas.length > 1 ? "s" : ""}`);
    linhas.push("");
    linhas.push("─────────────────");

    gestantesFiltradas.forEach((g, index) => {
      const igAtual = calcularIgAtualFormatada(g);
      const dpp = calcularDppFormatada(g);
      const tipoParto = tipoPartoLabels[g.tipoPartoDesejado || "a_definir"] || "A Definir";
      const paridade = formatarParidade({
        gesta: g.gesta,
        para: g.para,
        partosNormais: g.partosNormais,
        cesareas: g.cesareas,
        abortos: g.abortos,
      });

      linhas.push("");
      linhas.push(`*${index + 1}. ${g.nome}*`);
      if (g.nomeBebe) linhas.push(`   Bebê: ${g.nomeBebe}`);
      linhas.push(`   IG atual: ${igAtual}`);
      linhas.push(`   DPP: ${dpp}`);
      linhas.push(`   Tipo de parto: ${tipoParto}`);
      if (g.dataPartoProgramado) linhas.push(`   Data programada: ${formatDateBR(g.dataPartoProgramado)}`);
      if (g.motivoCesarea) {
        let motivo = g.motivoCesarea;
        if (motivo === "Outro motivo" && g.motivoCesareaOutro) motivo += ` - ${g.motivoCesareaOutro}`;
        linhas.push(`   Motivo cesárea: ${motivo}`);
      }
      linhas.push(`   Paridade: ${paridade}`);
      if (g.hospitalParto) linhas.push(`   Hospital: ${g.hospitalParto}`);

      const medico = medicos.find(m => m.id === g.medicoId);
      if (medico) linhas.push(`   Médico: ${medico.nome}`);

      // Fatores de risco e medicamentos
      const extras = dadosExtras?.[g.id];
      if (extras) {
        const fatores = extras.fatoresRisco.filter(f => f.tipo !== "alergia_medicamentos");
        const alergias = extras.fatoresRisco.filter(f => f.tipo === "alergia_medicamentos");
        const meds = extras.medicamentos;

        if (fatores.length > 0) {
          linhas.push(`   ⚠️ Fatores de risco: ${fatores.map(f => fatoresRiscoLabels[f.tipo] || f.tipo).join(", ")}`);
        }
        if (alergias.length > 0) {
          linhas.push(`   🚫 Alergias: ${alergias.map(a => a.descricao || "Alergia a Medicamentos").join(", ")}`);
        }
        if (meds.length > 0) {
          linhas.push(`   💊 Medicamentos: ${meds.map(m => {
            const nome = medicamentosLabels[m.tipo] || m.tipo;
            return m.especificacao ? `${nome} (${m.especificacao})` : nome;
          }).join(", ")}`);
        }
      }

      if (g.observacoes && g.observacoes.trim()) {
        linhas.push(`   📝 Obs: ${g.observacoes.trim()}`);
      }

      linhas.push("─────────────────");
    });

    return linhas.join("\n");
  }, [gestantesFiltradas, dataInicio, dataFim, igMinima, medicos, dadosExtras]);

  const copiarTexto = useCallback(() => {
    const texto = gerarTextoWhatsApp();
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      toast.success("Lista copiada!", { description: "Cole no WhatsApp para enviar ao colega." });
      setTimeout(() => setCopiado(false), 3000);
    });
  }, [gerarTextoWhatsApp]);

  // Calcular IG no início e fim do período para exibição
  const calcularIgNoPeriodo = useCallback((g: GestanteComCalculos) => {
    if (!dataInicio || !dataFim) return { igInicio: "-", igFim: "-" };
    const inicio = new Date(dataInicio + "T12:00:00");
    const fim = new Date(dataFim + "T12:00:00");
    const igInicio = calcularIgNaData(g, new Date(inicio));
    const igFim = calcularIgNaData(g, new Date(fim));
    return {
      igInicio: igInicio ? `${igInicio.semanas}s ${igInicio.dias}d` : "-",
      igFim: igFim ? `${igFim.semanas}s ${igFim.dias}d` : "-",
    };
  }, [dataInicio, dataFim]);

  if (!aberto) {
    return (
      <Button
        onClick={() => setAberto(true)}
        variant="outline"
        className="gap-2 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800"
      >
        <Plane className="h-4 w-4" />
        Quero Viajar!
      </Button>
    );
  }

  return (
    <Card className="border-sky-200 bg-sky-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky-600" />
            <CardTitle className="text-lg text-sky-900">Quero Viajar!</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAberto(false)} className="text-sky-600 hover:text-sky-800">
            Fechar
          </Button>
        </div>
        <CardDescription className="text-sky-700">
          Quando vai precisar se ausentar do consultório?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Seletores de data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="viajar-inicio" className="text-sky-800 font-medium">Data de Início</Label>
            <Input
              id="viajar-inicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="border-sky-200 focus:border-sky-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="viajar-fim" className="text-sky-800 font-medium">Data de Fim</Label>
            <Input
              id="viajar-fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="border-sky-200 focus:border-sky-400"
            />
          </div>
        </div>

        {/* Filtro de IG mínima */}
        {dataInicio && dataFim && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sky-800 font-medium">
                Idade Gestacional mínima
              </Label>
              <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 font-bold text-base px-3 py-1">
                {igMinima[0]} semanas
              </Badge>
            </div>
            <Slider
              value={igMinima}
              onValueChange={setIgMinima}
              min={34}
              max={41}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-sky-600">
              <span>34 sem</span>
              <span>35</span>
              <span>36</span>
              <span>37</span>
              <span>38</span>
              <span>39</span>
              <span>40</span>
              <span>41 sem</span>
            </div>
          </div>
        )}

        {/* Resultados */}
        {dataInicio && dataFim && (
          <>
            <Separator className="bg-sky-200" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-600" />
                <span className="font-semibold text-sky-900">
                  {gestantesFiltradas.length} {gestantesFiltradas.length === 1 ? "gestante" : "gestantes"} possivelmente a termo
                </span>
              </div>
              <div className="flex items-center gap-2">
                {gestantesFiltradas.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={expandirTodos}
                      className="text-xs border-sky-300 text-sky-700 hover:bg-sky-100"
                    >
                      {expandidos.size === gestantesFiltradas.length ? "Recolher todos" : "Expandir todos"}
                    </Button>
                    <Button
                      onClick={copiarTexto}
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiado ? "Copiado!" : "Copiar lista"}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {gestantesFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <Plane className="h-12 w-12 mx-auto mb-4 text-sky-300" />
                <p className="text-sky-600">
                  Nenhuma gestante com IG {"\u2265"} {igMinima[0]} semanas no período selecionado.
                  <br />
                  <span className="text-sm">Pode viajar tranquilo!</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {gestantesFiltradas.map((g, index) => {
                  const igAtual = calcularIgAtualFormatada(g);
                  const dpp = calcularDppFormatada(g);
                  const tipoParto = tipoPartoLabels[g.tipoPartoDesejado || "a_definir"] || "A Definir";
                  const paridade = formatarParidade({
                    gesta: g.gesta,
                    para: g.para,
                    partosNormais: g.partosNormais,
                    cesareas: g.cesareas,
                    abortos: g.abortos,
                  });
                  const { igInicio, igFim } = calcularIgNoPeriodo(g);
                  const isExpanded = expandidos.has(g.id);
                  const extras = dadosExtras?.[g.id];
                  const fatores = extras?.fatoresRisco.filter(f => f.tipo !== "alergia_medicamentos") || [];
                  const alergias = extras?.fatoresRisco.filter(f => f.tipo === "alergia_medicamentos") || [];
                  const meds = extras?.medicamentos || [];
                  const medico = medicos.find(m => m.id === g.medicoId);

                  return (
                    <div
                      key={g.id}
                      className={`rounded-lg border transition-all ${
                        g.sexoBebe === "masculino" ? "border-l-4 border-l-blue-400 border-blue-200 bg-blue-50/50" :
                        g.sexoBebe === "feminino" ? "border-l-4 border-l-pink-400 border-pink-200 bg-pink-50/50" :
                        "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Header do card - sempre visível */}
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => toggleExpandido(g.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm font-bold text-gray-400 shrink-0">{index + 1}.</span>
                            <span className="font-semibold text-gray-900 truncate">{g.nome}</span>
                            {g.baixouApp && (
                              <Smartphone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                            {g.sexoBebe === "masculino" && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 shrink-0">♂</span>
                            )}
                            {g.sexoBebe === "feminino" && (
                              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-700 shrink-0">♀</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                              IG: {igAtual}
                            </Badge>
                            <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 text-xs">
                              {tipoParto}
                            </Badge>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {/* Resumo rápido */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                          <span>DPP: {dpp}</span>
                          <span>{paridade}</span>
                          {medico && <span>Médico: {medico.nome}</span>}
                          {g.nomeBebe && <span>Bebê: {g.nomeBebe}</span>}
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
                          {/* IG e DPP */}
                          <div className="bg-[#722F37]/5 border border-[#722F37]/20 rounded-lg p-3 mt-3 space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Baby className="h-4 w-4 text-[#722F37]" />
                              <span className="font-semibold text-[#722F37] text-sm">Idade Gestacional</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">IG atual:</span>
                                <span className="ml-2 font-medium">{igAtual}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">DPP:</span>
                                <span className="ml-2 font-medium">{dpp}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IG em {formatDateBR(dataInicio)}:</span>
                                <span className="ml-2 font-medium">{igInicio}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IG em {formatDateBR(dataFim)}:</span>
                                <span className="ml-2 font-medium">{igFim}</span>
                              </div>
                            </div>
                          </div>

                          {/* História Obstétrica */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Heart className="h-4 w-4 text-[#722F37]" />
                              <span className="font-semibold text-sm">História Obstétrica</span>
                            </div>
                            <Badge variant="outline" className="bg-[#722F37]/10 text-[#722F37] border-[#722F37]/30 font-bold">
                              {paridade}
                            </Badge>
                          </div>

                          {/* Tipo de Parto */}
                          {(g.tipoPartoDesejado && g.tipoPartoDesejado !== "a_definir" || g.dataPartoProgramado) && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary text-sm">Informações do Parto</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {g.tipoPartoDesejado && g.tipoPartoDesejado !== "a_definir" && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Tipo de Parto</p>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                      {tipoParto}
                                    </Badge>
                                  </div>
                                )}
                                {g.dataPartoProgramado && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Data Programada</p>
                                    <span className="font-medium text-primary text-sm">{formatDateBR(g.dataPartoProgramado)}</span>
                                  </div>
                                )}
                              </div>
                              {g.motivoCesarea && (
                                <div className="mt-2 pt-2 border-t border-primary/20">
                                  <p className="text-xs text-muted-foreground mb-1">Motivo da Cesárea</p>
                                  <p className="text-sm font-medium text-primary">
                                    {g.motivoCesarea}
                                    {g.motivoCesarea === "Outro motivo" && g.motivoCesareaOutro && (
                                      <span className="text-muted-foreground"> - {g.motivoCesareaOutro}</span>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fatores de Risco */}
                          {fatores.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="font-semibold text-amber-700 text-sm">Fatores de Risco</span>
                              </div>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                <div className="flex flex-wrap gap-1">
                                  {fatores.map((fator) => (
                                    <div key={fator.id}>
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
                          )}

                          {/* Alergias */}
                          {alergias.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-red-500" />
                                <span className="font-semibold text-red-700 text-sm">Alergias</span>
                              </div>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                <div className="flex flex-wrap gap-1">
                                  {alergias.map((a) => (
                                    <Badge key={a.id} variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                                      {a.descricao || "Alergia a Medicamentos"}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Medicamentos */}
                          {meds.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-blue-500" />
                                <span className="font-semibold text-blue-700 text-sm">Medicamentos em Uso</span>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="flex flex-wrap gap-1">
                                  {meds.map((med) => (
                                    <div key={med.id}>
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
                          )}

                          {/* Observações */}
                          {g.observacoes && g.observacoes.trim() && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="font-semibold text-gray-700 text-sm">Observações</span>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{g.observacoes}</p>
                              </div>
                            </div>
                          )}

                          {/* Hospital */}
                          {g.hospitalParto && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Hospital:</span> {g.hospitalParto}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
