import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TextareaComAutocomplete } from "@/components/TextareaComAutocomplete";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { SUGESTOES_QUEIXAS } from "@/lib/sugestoesQueixas";
import { trpc } from "@/lib/trpc";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useInstantSave } from "@/hooks/useInstantSave";
import { ArrowLeft, Calendar, CalendarCheck, FileText, Plus, Trash2, Edit2, Download, Copy, Baby, Activity, Syringe, CheckCircle2, Loader2, UserCog, AlertTriangle, CircleUser, Check, ClipboardList, Heart, Pill, Milestone, ChartLine, Stethoscope, ShieldAlert, Send, MessageSquare, UtensilsCrossed } from "lucide-react";
import { useLocation } from "wouter";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { GraficoPeso } from "@/components/GraficoPeso";
import { GraficoAlturaUterina } from "@/components/GraficoAlturaUterina";
import { GraficoPressaoArterial } from "@/components/GraficoPressaoArterial";
import { CartaoPrenatalPDF } from "@/components/CartaoPrenatalPDF";
import FatoresRiscoManager from "@/components/FatoresRiscoManager";
import { HospitalSelect } from "@/components/HospitalSelect";
import { ConvenioSelect } from "@/components/ConvenioSelect";
import { ProcedimentoSelect } from "@/components/ProcedimentoSelect";
import MedicamentosManager from "@/components/MedicamentosManager";
// ModalInfoGestante removido do fluxo de consulta - informações agora no ConsultaUnificadaDialog
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isAUAbnormal } from "@/lib/auReferenceData";
import { isBPAbnormal } from "@/lib/bpValidation";
import { validarDataCesarea, type DadosReferencia } from "@/lib/cesareanValidation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CartaoPrenatal() {
  const [, setLocation] = useLocation();
  const { gestanteAtiva } = useGestanteAtiva();
  
  const getDataHoje = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(gestanteAtiva?.id || null);
  const [dadosBebe, setDadosBebe] = useState({
    nomeBebe: "",
    sexoBebe: "nao_informado" as "masculino" | "feminino" | "nao_informado"
  });
  
  // Atualizar gestante selecionada quando gestante ativa mudar
  useEffect(() => {
    if (gestanteAtiva) {
      setGestanteSelecionada(gestanteAtiva.id);
    }
  }, [gestanteAtiva]);
  
  // Verificar query params para abrir formulário automaticamente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gestanteIdParam = params.get('gestanteId');
    const novaConsultaParam = params.get('novaConsulta');
    const showPEPParam = params.get('showPEP');
    const pepTextoParam = params.get('pepTexto');
    const scrollToMarcosParam = params.get('scrollToMarcos');
    const urgenciaParam = params.get('urgencia');
    
    if (gestanteIdParam) {
      setGestanteSelecionada(parseInt(gestanteIdParam));
    }
    
    if (novaConsultaParam === 'true') {
      setMostrarFormulario(true);
      if (urgenciaParam === 'true') {
        setIsUrgencia(true);
      }
    }
    
    if (showPEPParam === 'true' && pepTextoParam) {
      try {
        const decodedPEP = decodeURIComponent(pepTextoParam);
        setTextoPEP(decodedPEP);
        setShowPEPModal(true);
        setScrollToMarcosAfterPEP(true);
      } catch {
        // ignore decode errors
      }
    }
    
    if (scrollToMarcosParam === 'true') {
      setTimeout(() => {
        const marcosEl = document.getElementById('marcos-importantes');
        if (marcosEl) {
          marcosEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1000);
    }
    
    // Limpar query params da URL
    if (gestanteIdParam || novaConsultaParam || showPEPParam || scrollToMarcosParam || urgenciaParam) {
      window.history.replaceState({}, '', '/cartao-prenatal');
    }
  }, []);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState<number | null>(null);
  const [isUrgencia, setIsUrgencia] = useState(false);

  const [isGerandoPDF, setIsGerandoPDF] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Estado para alerta de data de cesárea fora do período recomendado
  const [alertaDataCesarea, setAlertaDataCesarea] = useState<{
    show: boolean;
    tipo: 'pre-termo' | 'pos-termo' | null;
    igNaData: { semanas: number; dias: number } | null;
  }>({ show: false, tipo: null, igNaData: null });
  
  // Estado para diálogo de confirmação de data pré-termo/pós-termo
  const [confirmacaoDataCesarea, setConfirmacaoDataCesarea] = useState<{
    open: boolean;
    tipo: 'pre-termo' | 'pos-termo' | 'passado' | null;
    novaData: string;
    igNaData: { semanas: number; dias: number } | null;
  }>({ open: false, tipo: null, novaData: '', igNaData: null });
  
  // Estado local para data de cesárea pendente (só salva ao clicar "Agendar")
  const [dataCesareaLocal, setDataCesareaLocal] = useState("");
  const [dataCesareaModificada, setDataCesareaModificada] = useState(false);
  
  // Estado local para motivo de cesárea "Outro" (evitar auto-save)
  const [motivoCesareaOutroLocal, setMotivoCesareaOutroLocal] = useState("");
  
  // Estado local para convênio e procedimento de cirurgia
  const [convenioCirurgiaLocal, setConvenioCirurgiaLocal] = useState("");
  const [procedimentoCirurgiaLocal, setProcedimentoCirurgiaLocal] = useState("");
  const [procedimentoOutroTexto, setProcedimentoOutroTexto] = useState("");
  
  // Estado para modal de texto PEP
  const [showPEPModal, setShowPEPModal] = useState(false);
  const [textoPEP, setTextoPEP] = useState("");
  
  // Estado para modal de PEP de consulta anterior
  const [showPEPConsultaAnterior, setShowPEPConsultaAnterior] = useState(false);
  const [textoPEPConsultaAnterior, setTextoPEPConsultaAnterior] = useState("");
  
  // Estado para scroll automático para Marcos Importantes após fechar PEP
  const [scrollToMarcosAfterPEP, setScrollToMarcosAfterPEP] = useState(false);

  // Lista de opções de conduta predefinidas
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

  const OPCOES_CONDUTA = [
    "Rotina Laboratorial 1º Trimestre",
    "Rotina Laboratorial 2º Trimestre",
    "Rotina Laboratorial 3º Trimestre",
    "Outros Exames Laboratoriais Específicos",
    "US Obstétrico Endovaginal",
    "US Morfológico 1º Trimestre",
    "US Morfológico 2º Trimestre",
    "US Obstétrico com Doppler",
    "Ecocardiograma Fetal",
    "Colhido Cultura para EGB",
    "Antibioticoterapia",
    "Progesterona Micronizada",
    "Vacinas (Prescrevo ou Oriento)",
    "Levotiroxina",
    "AAS",
    "Agendamento Cesárea",
    "Indico Curetagem Uterina",
    "Acompanhamento Rotina",
    "Ferro Venoso",
    "Aguardo Exames Laboratoriais",
  ];

  const [formData, setFormData] = useState({
    dataConsulta: getDataHoje(),
    peso: "",
    pressaoArterial: "",
    alturaUterina: "",
    bcf: "",
    mf: "",
    edema: "",
    conduta: [] as string[],
    condutaComplementacao: "",
    observacoes: "",
    queixas: "",
    // Campos de urgência
    queixasUrgencia: [] as string[],
    detalhamentoQueixa: "",
    atividadeUterina: [] as string[],
    toqueVaginal: "",
    usgHoje: "",
    hipoteseDiagnostica: "",
    condutaUrgencia: {} as Record<string, boolean>,
    outraCondutaDescricao: "",
    auf: "",
  });

  // Auto-save: salvar rascunho automaticamente (500ms padrão)
  const { savedAt, clearDraft, loadDraft } = useAutoSave(
    `consulta_${gestanteSelecionada}`,
    formData
  );
  
  // Salvamento instantâneo para campos críticos (0ms)
  useInstantSave(`consulta-data-${gestanteSelecionada}`, formData.dataConsulta, mostrarFormulario);
  useInstantSave(`consulta-peso-${gestanteSelecionada}`, formData.peso, mostrarFormulario);

  // Carregar rascunho ao abrir o formulário
  useEffect(() => {
    if (mostrarFormulario && !consultaEditando) {
      const draft = loadDraft();
      if (draft) {
        // Sempre usar a data atual para novas consultas, ignorando a data do rascunho
        setFormData({
          ...draft,
          dataConsulta: getDataHoje()
        });
        toast.info('Rascunho restaurado', {
          description: 'Seus dados foram recuperados automaticamente. Data atualizada para hoje.',
        });
      }
    }
  }, [mostrarFormulario, consultaEditando]);

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  
  // Validar data de cesárea
  useEffect(() => {
    if (gestante && gestante.dataPartoProgramado && gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
      try {
        const dumDate = new Date(gestante.dum);
        const dataCesarea = new Date(gestante.dataPartoProgramado);
        
        // Calcular IG na data da cesárea
        const diffMs = dataCesarea.getTime() - dumDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const semanas = Math.floor(diffDays / 7);
        const dias = diffDays % 7;
        
        // Validar se está fora do período recomendado (37-41 semanas)
        if (semanas < 37) {
          setAlertaDataCesarea({
            show: true,
            tipo: 'pre-termo',
            igNaData: { semanas, dias }
          });
        } else if (semanas > 41) {
          setAlertaDataCesarea({
            show: true,
            tipo: 'pos-termo',
            igNaData: { semanas, dias }
          });
        } else {
          setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
        }
      } catch (error) {
        console.error('Erro ao validar data de cesárea:', error);
        setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
      }
    } else {
      setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
    }
  }, [gestante]);
  
  // Sincronizar dadosBebe com gestante quando gestante mudar
  useEffect(() => {
    if (gestante) {
      setDadosBebe({
        nomeBebe: gestante.nomeBebe || "",
        sexoBebe: gestante.sexoBebe || "nao_informado"
      });
      
      // Inicializar estado local para motivo de cesárea "Outro"
      setMotivoCesareaOutroLocal(gestante.motivoCesareaOutro || "");
      
      // Inicializar estado local para data de cesárea
      setDataCesareaLocal(gestante.dataPartoProgramado || "");
      setDataCesareaModificada(false);
      
      // Inicializar estado local para convênio e procedimento
      setConvenioCirurgiaLocal(gestante.convenioCirurgia || "");
      // Para procedimento: usar o valor salvo diretamente (o ProcedimentoSelect detecta se é "Outra")
      setProcedimentoCirurgiaLocal(gestante.procedimentoCirurgia || "");
      setProcedimentoOutroTexto("");
    }
  }, [gestante]);
  const { data: consultas, refetch: refetchConsultas } = trpc.consultasPrenatal.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: ultrassons } = trpc.ultrassons.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: exames } = trpc.exames.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: resultadosExamesLab, isLoading: loadingExamesLab, isError: errorExamesLab } = trpc.examesLab.buscar.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  
  console.log('🧪 [CartaoPrenatal] Query examesLab:', {
    gestanteSelecionada,
    isLoading: loadingExamesLab,
    isError: errorExamesLab,
    data: resultadosExamesLab,
    keys: resultadosExamesLab ? Object.keys(resultadosExamesLab) : 'undefined'
  });
  
  // Buscar fatores de risco e medicamentos para o PDF
  const { data: fatoresRisco } = trpc.fatoresRisco.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const { data: medicamentos } = trpc.medicamentos.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  // Buscar lembretes pendentes da gestante
  const { data: lembretesPendentes, refetch: refetchLembretes } = trpc.lembretes.pendentes.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );
  const [lembretesResolvidos, setLembretesResolvidos] = useState<number[]>([]);
  const resolverLembretesMutation = trpc.lembretes.resolver.useMutation({
    onSuccess: () => {
      refetchLembretes();
    },
  });

  // Buscar condutas personalizadas
  const { data: condutasPersonalizadas, refetch: refetchCondutas } = trpc.condutas.list.useQuery();
  const createCondutaMutation = trpc.condutas.create.useMutation({
    onSuccess: () => {
      toast.success("Conduta personalizada adicionada!");
      refetchCondutas();
      setNovaConduta("");
      setMostrarAddConduta(false);
    },
    onError: (error) => {
      toast.error("Erro ao adicionar conduta: " + error.message);
    },
  });

  // Buscar queixas personalizadas
  const { data: queixasPersonalizadas, refetch: refetchQueixas } = trpc.queixas.list.useQuery();
  const upsertQueixaMutation = trpc.queixas.upsert.useMutation();
  const deleteQueixaMutation = trpc.queixas.delete.useMutation({
    onSuccess: () => refetchQueixas(),
  });

  // Combinar sugestões estáticas com queixas personalizadas ordenadas por frequência
  const sugestoesQueixasCombinadas = [
    ...(queixasPersonalizadas?.map((q: any) => q.texto) || []),
    ...SUGESTOES_QUEIXAS.filter(s => !queixasPersonalizadas?.some((q: any) => q.texto === s))
  ];
  // IDs correspondentes: personalizadas têm ID, estáticas têm null
  const sugestoesQueixasIds: (number | null)[] = [
    ...(queixasPersonalizadas?.map((q: any) => q.id as number) || []),
    ...SUGESTOES_QUEIXAS.filter(s => !queixasPersonalizadas?.some((q: any) => q.texto === s)).map(() => null)
  ];
  const deleteCondutaMutation = trpc.condutas.delete.useMutation({
    onSuccess: () => {
      toast.success("Conduta removida!");
      refetchCondutas();
    },
  });

  const [novaConduta, setNovaConduta] = useState("");
  const [mostrarAddConduta, setMostrarAddConduta] = useState(false);

  // Combinar condutas predefinidas com personalizadas
  const todasCondutas = [
    ...OPCOES_CONDUTA,
    ...(condutasPersonalizadas?.map(c => c.nome) || [])
  ];

  const utils = trpc.useUtils();

  const createMutation = trpc.consultasPrenatal.create.useMutation({
    onSuccess: (result) => {
      toast.success("Consulta registrada com sucesso!");
      
      // Resolver lembretes marcados
      if (lembretesResolvidos.length > 0 && result && (result as any).insertId) {
        resolverLembretesMutation.mutate({
          ids: lembretesResolvidos,
          consultaId: (result as any).insertId,
        });
      }
      setLembretesResolvidos([]);
      
      refetchConsultas();
      refetchLembretes();
      // Mostrar modal PEP antes de resetar o formulário
      setShowPEPModal(true);
      resetForm();
      // Invalidar cache de alertas de consultas atrasadas
      utils.gestantes.semConsultaRecente.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao registrar consulta: ${error.message}`);
    },
  });

  const updateMutation = trpc.consultasPrenatal.update.useMutation({
    onSuccess: () => {
      toast.success("Consulta atualizada com sucesso!");
      refetchConsultas();
      // Abrir modal de PEP após atualização
      setShowPEPModal(true);
      resetForm();
      // Invalidar cache de alertas de consultas atrasadas
      utils.gestantes.semConsultaRecente.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar consulta: ${error.message}`);
    },
  });

  const deleteMutation = trpc.consultasPrenatal.delete.useMutation({
    onSuccess: () => {
      toast.success("Consulta excluída com sucesso!");
      refetchConsultas();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir consulta: ${error.message}`);
    },
  });

  const updateGestanteMutation = trpc.gestantes.update.useMutation({
    onSuccess: () => {
      toast.success("Data planejada atualizada!");
      utils.gestantes.get.invalidate({ id: gestanteSelecionada! });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const gerarPDFMutation = trpc.pdf.gerarCartaoPrenatal.useMutation();

  // ─── Envio Rápido WhatsApp ─────────────────────────────────────────────────
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState<string | null>(null);
  const enviarWhatsAppMutation = trpc.whatsapp.enviarManual.useMutation({
    onSuccess: () => {
      toast.success('Mensagem enviada com sucesso via WhatsApp!');
      setEnviandoWhatsApp(null);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
      setEnviandoWhatsApp(null);
    },
  });

  const enviarCartaoMutation = trpc.pdf.enviarCartaoWhatsApp.useMutation({
    onSuccess: () => {
      toast.success('Cartão de Pré-Natal enviado com sucesso via WhatsApp!');
      setEnviandoWhatsApp(null);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar cartão: ${error.message}`);
      setEnviandoWhatsApp(null);
    },
  });

  const handleEnviarOrientacao = (tipo: string, mensagem: string, pdfUrl?: string) => {
    if (!gestante) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }
    if (!gestante.telefone) {
      toast.error('Gestante não possui telefone cadastrado. Cadastre o telefone primeiro.');
      return;
    }
    setEnviandoWhatsApp(tipo);
    enviarWhatsAppMutation.mutate({
      telefone: gestante.telefone,
      mensagem,
      pdfUrl,
      nomeGestante: gestante.nome,
      gestanteId: gestante.id,
    });
  };

  const handleGerarPDF = async () => {
    if (!gestante) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }
    
    setIsGerandoPDF(true);
    try {
      // Abrir página de impressão em nova janela
      const url = `/cartao-prenatal-impressao/${gestante.id}`;
      const janela = window.open(url, '_blank', 'width=900,height=1200');
      
      if (!janela) {
        toast.error('Popup bloqueado. Permita popups para este site.');
        return;
      }
      
      // Aguardar carregamento e chamar print automaticamente
      const checkLoaded = setInterval(() => {
        try {
          if (janela.document && janela.document.body.getAttribute('data-content-loaded') === 'true') {
            clearInterval(checkLoaded);
            // Aguardar gráficos renderizarem
            setTimeout(() => {
              janela.print();
              toast.success('Use "Salvar como PDF" no diálogo de impressão para baixar o PDF.');
              setIsGerandoPDF(false);
            }, 2000);
          }
        } catch (e) {
          // Ignorar erros de cross-origin - a janela vai carregar normalmente
        }
      }, 500);
      
      // Timeout após 30 segundos
      setTimeout(() => {
        clearInterval(checkLoaded);
        setIsGerandoPDF(false);
      }, 30000);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao abrir página de impressão.');
      setIsGerandoPDF(false);
    }
  };

  const handleGerarPDFAntigo = async () => {
    if (!gestante) {
      toast.error('Selecione uma gestante primeiro');
      return;
    }
    
    setIsGerandoPDF(true);
    try {
      // Criar PDF diretamente com jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      // Adicionar conteúdo ao PDF
      let y = 15;
      
      // Adicionar logo da clínica no cabeçalho
      try {
        // Logo horizontal da clínica Mais Mulher
        const logoImg = new Image();
        logoImg.src = '/logo-horizontal.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        // Adicionar logo centralizado (largura 60mm, altura 26.7mm - mantendo aspect ratio 2.25:1)
        const logoWidth = 60;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const logoX = (pageWidth - logoWidth) / 2; // Centralizar horizontalmente
        pdf.addImage(logoImg, 'PNG', logoX, y, logoWidth, 26.7);
      } catch (error) {
        console.warn('Erro ao carregar logo:', error);
      }
      
      y += 35; // Espaço após o logo (aumentado de 30 para 35)
      
      // Título abaixo do logo
      pdf.setFontSize(18);
      pdf.setTextColor(139, 64, 73);
      pdf.text('Cartão de Pré-natal', 20, y);
      y += 15;
      
      // Dados da Gestante
      pdf.setFontSize(14);
      pdf.text('Dados da Gestante', 20, y);
      y += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const idade = gestante.calculado?.idade || '-';
      pdf.text(`Nome: ${gestante.nome} - Idade: ${idade} anos`, 20, y);
      y += 7;
      
      // Formatar dados obstétricos no padrão médico (ex: G5P3(2PC1PN)A1)
      const gesta = gestante.gesta || 0;
      const para = gestante.para || 0;
      const cesareas = gestante.cesareas || 0;
      const partosNormais = gestante.partosNormais || 0;
      const abortos = gestante.abortos || 0;
      
      let notacaoObstetrica = `G${gesta}P${para}`;
      if (para > 0) {
        notacaoObstetrica += `(${cesareas}PC${partosNormais}PN)`;
      }
      notacaoObstetrica += `A${abortos}`;
      
      pdf.text(notacaoObstetrica, 20, y);
      y += 7;
      pdf.text(`DPP pela DUM: ${gestante.calculado?.dpp ? new Date(gestante.calculado.dpp).toLocaleDateString('pt-BR') : '-'}`, 20, y);
      y += 7;
      pdf.text(`DPP pelo Ultrassom: ${gestante.calculado?.dppUS ? new Date(gestante.calculado.dppUS).toLocaleDateString('pt-BR') : '-'}`, 20, y);
      y += 7;
      if (gestante.nomeBebe) {
        pdf.text(`Nome do Bebê: ${gestante.nomeBebe}`, 20, y);
        y += 7;
      }
      if (gestante.sexoBebe && gestante.sexoBebe !== "nao_informado") {
        pdf.text(`Sexo do Bebê: ${gestante.sexoBebe === "masculino" ? "Masculino" : "Feminino"}`, 20, y);
        y += 7;
      }
      y += 8;
      
      // Fatores de Risco
      if (fatoresRisco && fatoresRisco.length > 0) {
        // Verificar se precisa de nova página
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Fatores de Risco', 20, y);
        y += 8;
        
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        
        // Agrupar fatores de risco em linhas
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (2 * margin);
        let currentX = margin;
        let lineHeight = 7;
        
        fatoresRisco.forEach((fator: any, index: number) => {
          const nomeExibicao = fator.tipo === 'idade_avancada' ? 'Idade > 35 anos' :
                               fator.tipo === 'hipertensao' ? 'Hipertensão' :
                               fator.tipo === 'diabetes' ? 'Diabetes' :
                               fator.tipo === 'epilepsia' ? 'Epilepsia' :
                               fator.tipo === 'gemelaridade' ? 'Gemelaridade' :
                               fator.tipo === 'cirurgia_uterina_previa' ? 'Cirurgia Uterina Prévia' :
                               fator.tipo === 'morte_fetal_neonatal' ? 'Morte Fetal/Neonatal' :
                               fator.tipo === 'abortos_repetidos' ? 'Abortos Repetidos' :
                               fator.tipo === 'malformacao_fetal' ? 'Malformação Fetal' :
                               fator.tipo === 'restricao_crescimento' ? 'Restrição de Crescimento' :
                               fator.tipo === 'parto_prematuro' ? 'Parto Prematuro' :
                               fator.tipo === 'macrossomia' ? 'Macrossomia' :
                               fator.tipo === 'isoimunizacao' ? 'Isoimunização' :
                               fator.tipo === 'outro' ? (fator.especificacao || 'Outro') :
                               fator.tipo;
          
          // Calcular largura do texto com padding adequado
          pdf.setFontSize(9);
          const textWidth = pdf.getTextWidth(nomeExibicao) + 12; // Aumentado padding para 12 (badge maior)
          
          // Verificar se cabe na linha atual
          if (currentX + textWidth > maxWidth + margin) {
            currentX = margin;
            y += lineHeight;
            
            // Verificar se precisa de nova página
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
          }
          
          // Desenhar badge
          pdf.setFillColor(254, 226, 226); // Vermelho claro
          pdf.setDrawColor(220, 38, 38); // Borda vermelha
          pdf.setLineWidth(0.3);
          pdf.roundedRect(currentX, y - 4, textWidth, 6, 1, 1, 'FD');
          
          // Texto do badge (centralizado verticalmente no retângulo)
          pdf.setTextColor(153, 27, 27); // Texto vermelho escuro
          pdf.text(nomeExibicao, currentX + 3, y + 0.5); // Aumentado padding de 2 para 3
          
          currentX += textWidth + 3; // Espaço entre badges
        });
        
        y += 12;
      }
      
      // Medicamentos em Uso
      if (medicamentos && medicamentos.length > 0) {
        // Verificar se precisa de nova página
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Medicamentos em Uso', 20, y);
        y += 8;
        
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        
        // Agrupar medicamentos em linhas
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (2 * margin);
        let currentX = margin;
        let lineHeight = 7;
        
        medicamentos.forEach((med: any) => {
          const nomeExibicao = med.tipo === 'acido_folico' ? 'Ácido Fólico' :
                               med.tipo === 'sulfato_ferroso' ? 'Sulfato Ferroso' :
                               med.tipo === 'anti_hipertensivos' ? 'Anti-hipertensivos' :
                               med.tipo === 'insulina' ? 'Insulina' :
                               med.tipo === 'levotiroxina' ? 'Levotiroxina' :
                               med.tipo === 'atorvastatina' ? 'Atorvastatina' :
                               med.tipo === 'enalapril' ? 'Enalapril' :
                               med.tipo === 'metformina' ? 'Metformina' :
                               med.tipo === 'atenolol' ? 'Atenolol' :
                               med.tipo === 'losartana' ? 'Losartana' :
                               med.tipo === 'aas' ? 'AAS' :
                               med.tipo === 'outro' ? (med.especificacao || 'Outro') :
                               med.tipo;
          
          // Calcular largura do texto com padding adequado
          pdf.setFontSize(9);
          const textWidth = pdf.getTextWidth(nomeExibicao) + 12; // Aumentado padding para 12 (badge maior)
          
          // Verificar se cabe na linha atual
          if (currentX + textWidth > maxWidth + margin) {
            currentX = margin;
            y += lineHeight;
            
            // Verificar se precisa de nova página
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
          }
          
          // Desenhar badge
          pdf.setFillColor(219, 234, 254); // Azul claro
          pdf.setDrawColor(59, 130, 246); // Borda azul
          pdf.setLineWidth(0.3);
          pdf.roundedRect(currentX, y - 4, textWidth, 6, 1, 1, 'FD');
          
          // Texto do badge (centralizado verticalmente no retângulo)
          pdf.setTextColor(30, 64, 175); // Texto azul escuro
          pdf.text(nomeExibicao, currentX + 3, y + 0.5); // Aumentado padding de 2 para 3
          
          currentX += textWidth + 3; // Espaço entre badges
          
          // Se houver especificação, adicionar ao lado do badge (na mesma linha)
          if (med.especificacao && med.tipo !== 'outro') {
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            const especTexto = ` ${med.especificacao}`;
            const especWidth = pdf.getTextWidth(especTexto);
            
            // Verificar se cabe na linha atual
            if (currentX + especWidth > maxWidth + margin) {
              // Não cabe, ir para próxima linha
              currentX = margin;
              y += lineHeight;
              
              // Verificar se precisa de nova página
              if (y > 270) {
                pdf.addPage();
                y = 20;
              }
            }
            
            pdf.text(especTexto, currentX, y + 0.5);
            currentX += especWidth + 3;
          }
        });
        
        y += 12;
      }
      
      // Histórico de Consultas
      if (consultas && consultas.length > 0) {
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Histórico de Consultas', 20, y);
        y += 10;
        
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        
        consultas.forEach((consulta: any) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          
          // Calcular IG pela DUM
          let igDUMTexto = '-';
          if (gestante.dum) {
            const dum = new Date(gestante.dum);
            const dataConsulta = new Date(consulta.dataConsulta);
            const diffMs = dataConsulta.getTime() - dum.getTime();
            const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const semanas = Math.floor(totalDias / 7);
            const dias = totalDias % 7;
            // Validar se os valores são válidos
            if (!isNaN(semanas) && !isNaN(dias) && semanas >= 0 && dias >= 0) {
              igDUMTexto = `${semanas}s ${dias}d`;
            }
          }
          
          // Calcular IG pelo Ultrassom
          let igUSTexto = '-';
          if (gestante.dataUltrassom && gestante.igUltrassomSemanas) {
            const ultrassom = new Date(gestante.dataUltrassom);
            const dataConsulta = new Date(consulta.dataConsulta);
            const diffMs = dataConsulta.getTime() - ultrassom.getTime();
            const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const totalDiasUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diasDesdeUS;
            const semanas = Math.floor(totalDiasUS / 7);
            const dias = totalDiasUS % 7;
            // Validar se os valores são válidos
            if (!isNaN(semanas) && !isNaN(dias) && semanas >= 0 && dias >= 0) {
              igUSTexto = `${semanas}s ${dias}d`;
            }
          }
          
          const pesoFormatado = consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : '-';
          const bcf = consulta.bcf === 1 ? 'Positivo' : consulta.bcf === 0 ? 'Não audível' : '-';
          const mf = consulta.mf ? 'Sim' : 'Não';
          
          pdf.text(`Data: ${new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')} | IG DUM: ${igDUMTexto} | IG US: ${igUSTexto}`, 20, y);
          y += 5;
          const paFormatado = consulta.pressaoSistolica && consulta.pressaoDiastolica 
            ? `${consulta.pressaoSistolica}/${consulta.pressaoDiastolica}`
            : consulta.pressaoArterial || '-';
          const auFormatado = consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)}cm` : '-';
          pdf.text(`Peso: ${pesoFormatado} | PA: ${paFormatado} | AU: ${auFormatado}`, 20, y);
          y += 5;
          pdf.text(`BCF: ${bcf} | MF: ${mf}`, 20, y);
          y += 5;
          
          // Adicionar condutas com formatação visual melhorada
          if (consulta.conduta || consulta.condutaComplementacao) {
            // Desenhar caixa de destaque para condutas
            const hasConduta = consulta.conduta && JSON.parse(consulta.conduta).length > 0;
            const hasComplementacao = consulta.condutaComplementacao;
            
            if (hasConduta || hasComplementacao) {
              // Verificar se precisa de nova página
              if (y > 255) {
                pdf.addPage();
                y = 20;
              }
              
              // Fundo suave para a seção de conduta
              pdf.setFillColor(248, 240, 241); // Rosa bem claro
              pdf.setDrawColor(139, 64, 73); // Cor da clínica
              
              // Calcular altura da caixa baseado no conteúdo
              let alturaBox = 8;
              let condutaTexto = '';
              let linhasConduta: string[] = [];
              let linhasCompl: string[] = [];
              
              if (hasConduta) {
                try {
                  const condutas = JSON.parse(consulta.conduta);
                  condutaTexto = condutas.join(' \u2022 '); // Separador com bullet
                  linhasConduta = pdf.splitTextToSize(condutaTexto, 160);
                  alturaBox += linhasConduta.length * 4.5;
                } catch (e) {}
              }
              
              if (hasComplementacao) {
                linhasCompl = pdf.splitTextToSize(consulta.condutaComplementacao, 160);
                alturaBox += linhasCompl.length * 4.5 + 3;
              }
              
              // Desenhar retângulo com borda arredondada
              pdf.roundedRect(20, y - 1, 170, alturaBox, 2, 2, 'FD');
              
              // Título "CONDUTA" em destaque
              pdf.setFontSize(8);
              pdf.setFont('', 'bold');
              pdf.setTextColor(139, 64, 73); // Cor da clínica
              pdf.text('CONDUTA:', 23, y + 4);
              
              // Texto das condutas
              pdf.setFont('', 'normal');
              pdf.setTextColor(60, 60, 60);
              pdf.setFontSize(8);
              
              let yTexto = y + 4;
              
              if (hasConduta && linhasConduta.length > 0) {
                // Primeira linha ao lado do título
                pdf.text(linhasConduta[0], 48, yTexto);
                yTexto += 4.5;
                
                // Linhas adicionais
                for (let i = 1; i < linhasConduta.length; i++) {
                  pdf.text(linhasConduta[i], 23, yTexto);
                  yTexto += 4.5;
                }
              }
              
              // Complementação em itálico
              if (hasComplementacao) {
                yTexto += 5; // Aumentar espaço antes da complementação
                pdf.setFont('', 'italic');
                pdf.setTextColor(100, 100, 100);
                pdf.text('Complementação:', 23, yTexto);
                yTexto += 4.5;
                
                pdf.setFont('', 'normal');
                linhasCompl.forEach((linha: string) => {
                  pdf.text(linha, 23, yTexto);
                  yTexto += 4.5;
                });
              }
              
              // Resetar cores
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(9);
              
              y += alturaBox + 3;
            }
          }
          
          if (consulta.observacoes) {
            pdf.text(`Obs: ${consulta.observacoes}`, 20, y);
            y += 5;
          }
          y += 3;
        });
        y += 5;
      }
      
      // Marcos Importantes
      if (gestante.calculado?.dppUS) {
        if (y > 230) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Marcos Importantes da Gesta\u00e7\u00e3o', 20, y);
        y += 10;
        
        // Adicionar T12:00:00 para evitar problemas de fuso horário
        const dppUSStr = typeof gestante.calculado.dppUS === 'string' ? gestante.calculado.dppUS : gestante.calculado.dppUS;
        const dppUS = new Date(dppUSStr + 'T12:00:00');
        const concepcao = new Date(dppUS);
        concepcao.setDate(concepcao.getDate() - 280);
        
        const marcosData = [
          { titulo: 'Concep\u00e7\u00e3o', data: concepcao, color: [216, 180, 254] }, // purple-300
          { titulo: 'Morfol\u00f3gico 1\u00ba Tri (11-13s)', inicio: new Date(concepcao.getTime() + 77*24*60*60*1000), fim: new Date(concepcao.getTime() + 98*24*60*60*1000), color: [110, 231, 183] }, // emerald-300
          { titulo: '13 Semanas', data: new Date(concepcao.getTime() + 91*24*60*60*1000), color: [147, 197, 253] }, // blue-300
          { titulo: 'Morfol\u00f3gico 2\u00ba Tri (20-24s)', inicio: new Date(concepcao.getTime() + 140*24*60*60*1000), fim: new Date(concepcao.getTime() + 168*24*60*60*1000), color: [103, 232, 249] }, // cyan-300
          { titulo: 'Curva Glic\u00eamica (24-28s)', inicio: new Date(concepcao.getTime() + 168*24*60*60*1000), fim: new Date(concepcao.getTime() + 202*24*60*60*1000), color: [251, 191, 36] }, // amber-300
          { titulo: 'Vacina dTpa (27s)', data: new Date(concepcao.getTime() + 189*24*60*60*1000), color: [253, 186, 116] }, // orange-300
          { titulo: 'Vacina Bronquiolite (32-36s)', inicio: new Date(concepcao.getTime() + 224*24*60*60*1000), fim: new Date(concepcao.getTime() + 252*24*60*60*1000), color: [253, 224, 71] }, // yellow-300
          { titulo: 'Termo Precoce (37s)', data: new Date(concepcao.getTime() + 259*24*60*60*1000), color: [103, 232, 249] }, // cyan-300
          { titulo: 'Termo Completo (39s)', data: new Date(concepcao.getTime() + 273*24*60*60*1000), color: [134, 239, 172] }, // green-300
          { titulo: 'DPP (40 semanas)', data: dppUS, color: [253, 164, 175] }, // rose-300
        ];
        
        pdf.setFontSize(9);
        
        // Organizar marcos em 2 colunas
        let coluna = 0;
        let xPos = 20;
        const larguraColuna = 85;
        const espacoEntreLinhas = 9;
        
        marcosData.forEach((marco: any, index: number) => {
          if (y > 265 && coluna === 0) {
            pdf.addPage();
            y = 20;
          }
          
          // Calcular posição X baseado na coluna
          xPos = coluna === 0 ? 20 : 110;
          
          // Desenhar retângulo colorido
          pdf.setFillColor(marco.color[0], marco.color[1], marco.color[2]);
          pdf.setDrawColor(marco.color[0] * 0.8, marco.color[1] * 0.8, marco.color[2] * 0.8);
          pdf.roundedRect(xPos, y - 3, larguraColuna, 7, 1, 1, 'FD');
          
          // Texto do marco (cor escura para melhor legibilidade)
          pdf.setTextColor(30, 30, 30);
          pdf.setFont('', 'bold');
          pdf.text(marco.titulo, xPos + 2, y + 2);
          
          // Data (ajustar para caber na coluna)
          const dataTexto = marco.inicio 
            ? `${marco.inicio.toLocaleDateString('pt-BR').substring(0, 5)} a ${marco.fim.toLocaleDateString('pt-BR').substring(0, 5)}`
            : marco.data.toLocaleDateString('pt-BR');
          pdf.setFontSize(8);
          pdf.text(dataTexto, xPos + larguraColuna - 2, y + 2, { align: 'right' });
          pdf.setFontSize(9);
          
          pdf.setFont('', 'normal');
          
          // Alternar entre colunas
          coluna = coluna === 0 ? 1 : 0;
          if (coluna === 0) {
            y += espacoEntreLinhas;
          }
        });
        
        // Se terminou em coluna 1, avançar y
        if (coluna === 1) {
          y += espacoEntreLinhas;
        }
        
        pdf.setTextColor(0, 0, 0);
        y += 5;
      }
      
      // Exames Laboratoriais
      if (resultadosExamesLab && Object.keys(resultadosExamesLab).length > 0) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Exames Laboratoriais', 20, y);
        y += 10;
        
        // Cabeçalhos das colunas (uma única vez no topo)
        const col1X = 22;
        const col2X = 80;
        const col3X = 138;
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 'bold');
        pdf.text('1º Trimestre', col1X, y);
        pdf.text('2º Trimestre', col2X, y);
        pdf.text('3º Trimestre', col3X, y);
        y += 6;
        
        // Linha separadora
        pdf.setDrawColor(139, 64, 73);
        pdf.line(20, y, 190, y);
        y += 5;
        
        pdf.setFontSize(9);
        pdf.setFont('', 'normal');
        
        // Iterar pelos exames estruturados
        for (const [nomeExame, valor] of Object.entries(resultadosExamesLab)) {
          if (nomeExame === 'outros_observacoes') {
            // Pular observações gerais
            continue;
          }
          
          if (y > 260) {
            pdf.addPage();
            y = 20;
          }
          
          // Nome do exame em negrito
          pdf.setFont('', 'bold');
          pdf.text(nomeExame.replace(/_/g, ' ').toUpperCase(), 20, y);
          y += 5;
          
          // Se for objeto com trimestres, mostrar em 3 colunas
          if (typeof valor === 'object' && valor !== null) {
            // Filtrar apenas trimestres (1, 2, 3), ignorar campos data1, data2, data3
            const trimestres = ['1', '2', '3'];
            const resultadosTrimestres = trimestres.map(t => {
              const resultado = valor[t];
              // Ignorar se for uma data (formato YYYY-MM-DD)
              if (resultado && typeof resultado === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(resultado.trim())) {
                return resultado;
              }
              return '-';
            });
            
            // Verificar se tem pelo menos um resultado válido
            const temResultado = resultadosTrimestres.some(r => r !== '-');
            
            if (temResultado) {
              pdf.setFont('', 'normal');
              pdf.setFontSize(8);
              
              // Extrair datas dos trimestres
              const datas = trimestres.map(t => {
                const dataKey = `data${t}`;
                const dataValor = valor[dataKey];
                if (dataValor && typeof dataValor === 'string') {
                  // Converter YYYY-MM-DD para DD/MM/AAAA
                  const partes = dataValor.split('-');
                  if (partes.length === 3) {
                    return `${partes[2]}/${partes[1]}/${partes[0]}`;
                  }
                }
                return '-';
              });
              
              // Mostrar datas em cinza e itálico
              pdf.setFont('', 'italic');
              pdf.setTextColor(100, 100, 100);
              pdf.text(datas[0], col1X, y);
              pdf.text(datas[1], col2X, y);
              pdf.text(datas[2], col3X, y);
              y += 4;
              
              // Resultados
              pdf.setFont('', 'normal');
              pdf.setTextColor(0, 0, 0);
              const linhas1 = pdf.splitTextToSize(resultadosTrimestres[0], 55);
              const linhas2 = pdf.splitTextToSize(resultadosTrimestres[1], 55);
              const linhas3 = pdf.splitTextToSize(resultadosTrimestres[2], 55);
              
              const maxLinhas = Math.max(linhas1.length, linhas2.length, linhas3.length);
              
              for (let i = 0; i < maxLinhas; i++) {
                if (y > 275) {
                  pdf.addPage();
                  y = 20;
                }
                if (i < linhas1.length) pdf.text(linhas1[i], col1X, y);
                if (i < linhas2.length) pdf.text(linhas2[i], col2X, y);
                if (i < linhas3.length) pdf.text(linhas3[i], col3X, y);
                y += 4;
              }
              
              pdf.setFontSize(9);
            }
          }
          y += 2;
        }
        
        // Observações gerais
        if (resultadosExamesLab.outros_observacoes && typeof resultadosExamesLab.outros_observacoes === 'string' && resultadosExamesLab.outros_observacoes.trim()) {
          if (y > 260) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFont('', 'bold');
          pdf.text('OBSERVAÇÕES:', 20, y);
          y += 5;
          pdf.setFont('', 'normal');
          const linhasObs = pdf.splitTextToSize(resultadosExamesLab.outros_observacoes, 170);
          linhasObs.forEach((linha: string) => {
            if (y > 275) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(linha, 22, y);
            y += 4;
          });
        }
        
        y += 5;
      }
      
      // Ultrassons
      if (ultrassons && ultrassons.length > 0) {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(139, 64, 73);
        pdf.text('Ultrassons', 20, y);
        y += 10;
        
        // Cabeçalho da tabela
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 'bold');
        pdf.text('Data', 20, y);
        pdf.text('Tipo', 50, y);
        pdf.text('IG', 100, y);
        pdf.text('Dados', 120, y);
        y += 5;
        
        // Linha separadora
        pdf.setDrawColor(139, 64, 73);
        pdf.line(20, y, 190, y);
        y += 5;
        
        pdf.setFont('', 'normal');
        
        ultrassons.forEach((us: any) => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
            // Repetir cabeçalho na nova página
            pdf.setFont('', 'bold');
            pdf.text('Data', 20, y);
            pdf.text('Tipo', 50, y);
            pdf.text('IG', 100, y);
            pdf.text('Dados', 120, y);
            y += 5;
            pdf.line(20, y, 190, y);
            y += 5;
            pdf.setFont('', 'normal');
          }
          
          const dataExame = us.dataExame ? new Date(us.dataExame).toLocaleDateString('pt-BR') : '-';
          const tipo = us.tipoUltrassom?.replace(/_/g, ' ') || '-';
          const ig = us.idadeGestacional || '-';
          
          // Extrair dados principais do JSON
          let dadosTexto = '-';
          let usarMultiplasLinhas = false;
          if (us.dados) {
            const dados = typeof us.dados === 'string' ? JSON.parse(us.dados) : us.dados;
            // Priorizar dados mais relevantes de cada tipo de exame
            if (dados.conclusao) {
              dadosTexto = dados.conclusao; // Ecocardiograma e outros
              usarMultiplasLinhas = dados.conclusao.length > 35; // Se for longo, usar múltiplas linhas
            }
            else if (dados.dpp) dadosTexto = `DPP: ${dados.dpp}`;
            else if (dados.pesoFetal) dadosTexto = `Peso: ${dados.pesoFetal}g`;
            else if (dados.bcf) dadosTexto = `BCF: ${dados.bcf}bpm`;
            else if (dados.tn) dadosTexto = `TN: ${dados.tn}mm`;
            else if (dados.ccn) dadosTexto = `CCN: ${dados.ccn}mm`;
          }
          
          pdf.text(dataExame, 20, y);
          pdf.text(tipo.substring(0, 20), 50, y);
          pdf.text(ig, 100, y);
          
          // Se for texto longo (conclusão), quebrar em múltiplas linhas
          if (usarMultiplasLinhas) {
            const linhasDados = pdf.splitTextToSize(dadosTexto, 70); // Largura de 70mm para os dados
            linhasDados.forEach((linha: string, idx: number) => {
              pdf.text(linha, 120, y + (idx * 4));
            });
            y += Math.max(5, linhasDados.length * 4); // Avançar mais se tiver múltiplas linhas
          } else {
            pdf.text(dadosTexto.substring(0, 35), 120, y);
            y += 5;
          }
        });
      }
      
      
      // Abrir PDF em nova aba ao invés de baixar
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      toast.success("PDF aberto em nova aba!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGerandoPDF(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dataConsulta: getDataHoje(),
      peso: "",
      pressaoArterial: "",
      alturaUterina: "",
      bcf: "",
      mf: "",
      edema: "",
      conduta: [],
      condutaComplementacao: "",
      observacoes: "",
      queixas: "",
      queixasUrgencia: [],
      detalhamentoQueixa: "",
      atividadeUterina: [],
      toqueVaginal: "",
      usgHoje: "",
      hipoteseDiagnostica: "",
      condutaUrgencia: {},
      outraCondutaDescricao: "",
      auf: "",
    });
    clearDraft(); // Limpar rascunho ao resetar formulário
    setMostrarFormulario(false);
    setConsultaEditando(null);
    setIsUrgencia(false);
  };

  // Função para toggle de conduta no checkbox
  const toggleConduta = (opcao: string) => {
    setFormData(prev => ({
      ...prev,
      conduta: prev.conduta.includes(opcao)
        ? prev.conduta.filter(c => c !== opcao)
        : [...prev.conduta, opcao]
    }));
  };

  const calcularMarcos = () => {
    // Usar DPP por US se disponível, senão usar DPP por DUM
    const dppStr = gestante?.calculado?.dppUS || gestante?.calculado?.dpp;
    if (!dppStr) return [];
    
    // Adicionar T12:00:00 para evitar problemas de fuso horário
    const dpp = new Date(dppStr + 'T12:00:00');
    const marcos = [];
    
    // Concepção
    const concepcao = new Date(dpp);
    concepcao.setDate(concepcao.getDate() - 280);
    marcos.push({ titulo: "Concepção", data: concepcao.toLocaleDateString("pt-BR") });
    
    // Morfológico 1º Tri (11-14 semanas)
    const morf1Inicio = new Date(concepcao);
    morf1Inicio.setDate(morf1Inicio.getDate() + 77);
    const morf1Fim = new Date(concepcao);
    morf1Fim.setDate(morf1Fim.getDate() + 98);
    marcos.push({ titulo: "Morfológico 1º Tri", data: `${morf1Inicio.toLocaleDateString("pt-BR")} a ${morf1Fim.toLocaleDateString("pt-BR")}` });
    
    // 13 Semanas
    const s13 = new Date(concepcao);
    s13.setDate(s13.getDate() + 91);
    marcos.push({ titulo: "13 Semanas", data: s13.toLocaleDateString("pt-BR") });
    
    // Morfológico 2º Tri (20-24 semanas)
    const morf2Inicio = new Date(concepcao);
    morf2Inicio.setDate(morf2Inicio.getDate() + 140);
    const morf2Fim = new Date(concepcao);
    morf2Fim.setDate(morf2Fim.getDate() + 168);
    marcos.push({ titulo: "Morfológico 2º Tri", data: `${morf2Inicio.toLocaleDateString("pt-BR")} a ${morf2Fim.toLocaleDateString("pt-BR")}` });
    
    // Curva Glicêmica (24-28 semanas e 6 dias)
    const curvaGlicInicio = new Date(concepcao);
    curvaGlicInicio.setDate(curvaGlicInicio.getDate() + 168);
    const curvaGlicFim = new Date(concepcao);
    curvaGlicFim.setDate(curvaGlicFim.getDate() + 202);
    marcos.push({ titulo: "Curva Glicêmica", data: `${curvaGlicInicio.toLocaleDateString("pt-BR")} a ${curvaGlicFim.toLocaleDateString("pt-BR")}` });
    
    // Vacina dTpa (27 semanas)
    const dtpa = new Date(concepcao);
    dtpa.setDate(dtpa.getDate() + 189);
    marcos.push({ titulo: "Vacina dTpa", data: dtpa.toLocaleDateString("pt-BR") });
    
    // Vacina Anti-Rh (28 semanas) - apenas para gestantes Rh negativo
    if (fatoresRisco?.some((f: any) => f.tipo === 'fator_rh_negativo' && f.ativo === 1)) {
      const antiRh = new Date(concepcao);
      antiRh.setDate(antiRh.getDate() + 196);
      marcos.push({ titulo: "Vacina Anti-Rh (Imunoglobulina)", data: antiRh.toLocaleDateString("pt-BR") });
    }
    
    // Vacina Bronquiolite (32-36 semanas)
    const bronqInicio = new Date(concepcao);
    bronqInicio.setDate(bronqInicio.getDate() + 224);
    const bronqFim = new Date(concepcao);
    bronqFim.setDate(bronqFim.getDate() + 252);
    marcos.push({ titulo: "Vacina Bronquiolite", data: `${bronqInicio.toLocaleDateString("pt-BR")} a ${bronqFim.toLocaleDateString("pt-BR")}` });
    
    // Termo Precoce (37 semanas)
    const termoPrecoce = new Date(concepcao);
    termoPrecoce.setDate(termoPrecoce.getDate() + 259);
    marcos.push({ titulo: "Termo Precoce", data: termoPrecoce.toLocaleDateString("pt-BR") });
    
    // Termo Completo (39 semanas)
    const termoCompleto = new Date(concepcao);
    termoCompleto.setDate(termoCompleto.getDate() + 273);
    marcos.push({ titulo: "Termo Completo", data: termoCompleto.toLocaleDateString("pt-BR") });
    
    // DPP (40 semanas)
    marcos.push({ titulo: "DPP (40 semanas)", data: dpp.toLocaleDateString("pt-BR") });
    
    return marcos;
  };

  // Função para gerar texto formatado para PEP
  const gerarTextoPEP = () => {
    // Calcular IG (prioridade: US > DUM)
    const igUS = calcularIGPorUS(formData.dataConsulta);
    const igDUM = calcularIG(formData.dataConsulta);
    
    let igTexto = "-";
    if (igUS && !isNaN(igUS.semanas) && !isNaN(igUS.dias)) {
      igTexto = `${igUS.semanas}+${igUS.dias}/7`;
    } else if (igDUM && !isNaN(igDUM.semanas) && !isNaN(igDUM.dias)) {
      igTexto = `${igDUM.semanas}+${igDUM.dias}/7`;
    }
    
    // Formatar AUF
    let aufTexto = "-";
    if (formData.alturaUterina === "nao_palpavel") {
      aufTexto = "Não palpável";
    } else if (formData.alturaUterina) {
      aufTexto = `${formData.alturaUterina}cm`;
    }
    
    // Formatar conduta
    let condutaTexto = "-";
    if (formData.conduta.length > 0) {
      condutaTexto = formData.conduta.join(", ");
    }
    
    // Formatar BCF
    let bcfTexto = "-";
    if (formData.bcf === "1") {
      bcfTexto = "Positivo";
    } else if (formData.bcf === "2") {
      bcfTexto = "Não audível";
    }
    

    // Formatar Edema
    let edemaTexto = "-";
    if (formData.edema === "0") {
      edemaTexto = "Ausente";
    } else if (formData.edema === "1") {
      edemaTexto = "+";
    } else if (formData.edema === "2") {
      edemaTexto = "++";
    } else if (formData.edema === "3") {
      edemaTexto = "+++";
    } else if (formData.edema === "4") {
      edemaTexto = "++++";
    }
    
    // Montar texto no formato do PEP (rótulos e dados na mesma linha)
    const linhas: string[] = [];
    
    if (isUrgencia) {
      linhas.push(`** CONSULTA DE URGÊNCIA **`);
    }
    
    linhas.push(`Idade Gestacional: ${igTexto}`);
    
    if (isUrgencia) {
      // Queixas de urgência
      const queixasTexto = formData.queixasUrgencia.length > 0 
        ? formData.queixasUrgencia.join(", ") 
        : "-";
      linhas.push(`Queixa(s): ${queixasTexto}`);
      if (formData.detalhamentoQueixa) {
        linhas.push(`Detalhamento: ${formData.detalhamentoQueixa}`);
      }
    } else {
      linhas.push(`Queixa(s): ${formData.queixas || "Sem queixas hoje."}`);
    }
    
    linhas.push(
      `Peso: ${formData.peso ? `${formData.peso}kg` : "-"}`,
      `AUF: ${aufTexto}`,
      `BCF: ${bcfTexto}`,
      `Edema: ${edemaTexto}`,
      `Pressão Arterial: ${formData.pressaoArterial || "-"}`,
    );
    
    // Campos extras de urgência
    if (isUrgencia) {
      if (formData.atividadeUterina.length > 0) {
        linhas.push(`Atividade Uterina: ${formData.atividadeUterina.join(", ")}`);
      }
      if (formData.auf) {
        linhas.push(`AUF (Urgência): ${formData.auf}`);
      }
      if (formData.toqueVaginal) {
        linhas.push(`Toque Vaginal: ${formData.toqueVaginal}`);
      }
      if (formData.usgHoje) {
        linhas.push(`USG Hoje: ${formData.usgHoje}`);
      }
      if (formData.hipoteseDiagnostica) {
        linhas.push(`Hipótese Diagnóstica: ${formData.hipoteseDiagnostica}`);
      }
      // Condutas de urgência
      const condutasUrg = Object.entries(formData.condutaUrgencia)
        .filter(([_, v]) => v)
        .map(([k]) => {
          const found = CONDUTAS_URGENCIA.find(c => c.key === k);
          return found ? found.label : k;
        });
      if (condutasUrg.length > 0) {
        linhas.push(`Condutas de Urgência: ${condutasUrg.join(", ")}`);
      }
      if (formData.outraCondutaDescricao) {
        linhas.push(`Outra Conduta: ${formData.outraCondutaDescricao}`);
      }
    }
    
    linhas.push(`Conduta: ${condutaTexto}`);
    
    // Adicionar complementação se houver
    if (formData.condutaComplementacao) {
      linhas.push(`Conduta (complementação): ${formData.condutaComplementacao}`);
    }
    
    // Adicionar observações se houver
    if (formData.observacoes) {
      linhas.push(`Observações: ${formData.observacoes}`);
    }
    
    return linhas.join("\n\n");
  };
  
  // Função para gerar texto PEP a partir de uma consulta anterior (dados do banco)
  const gerarTextoPEPConsultaAnterior = (consulta: any) => {
    // Calcular IG (prioridade: US > DUM)
    const igUS = calcularIGPorUS(consulta.dataConsulta);
    const igDUM = calcularIG(consulta.dataConsulta);
    
    let igTexto = "-";
    if (igUS && !isNaN(igUS.semanas) && !isNaN(igUS.dias)) {
      igTexto = `${igUS.semanas}+${igUS.dias}/7`;
    } else if (igDUM && !isNaN(igDUM.semanas) && !isNaN(igDUM.dias)) {
      igTexto = `${igDUM.semanas}+${igDUM.dias}/7`;
    }
    
    // Formatar AUF
    let aufTexto = "-";
    if (consulta.alturaUterina === -1) {
      aufTexto = "Não palpável";
    } else if (consulta.alturaUterina) {
      aufTexto = `${(consulta.alturaUterina / 10).toFixed(0)}cm`;
    }
    
    // Formatar conduta
    let condutaTexto = "-";
    if (consulta.conduta) {
      try {
        const condutas = JSON.parse(consulta.conduta);
        if (condutas.length > 0) {
          condutaTexto = condutas.join(", ");
        }
      } catch {
        condutaTexto = consulta.conduta;
      }
    }
    
    // Formatar BCF
    let bcfTexto = "-";
    if (consulta.bcf === 1) {
      bcfTexto = "Positivo";
    } else if (consulta.bcf === 0) {
      bcfTexto = "Não audível";
    }
    

    // Formatar Peso
    let pesoTexto = "-";
    if (consulta.peso) {
      pesoTexto = `${(consulta.peso / 1000).toFixed(1)}kg`;
    }
    
    // Formatar Pressão Arterial
    let paTexto = "-";
    if (consulta.pressaoSistolica && consulta.pressaoDiastolica) {
      paTexto = `${consulta.pressaoSistolica}/${consulta.pressaoDiastolica}`;
    } else if (consulta.pressaoArterial) {
      paTexto = consulta.pressaoArterial;
    }
    
    const isConsultaUrg = consulta.isUrgencia === 1;
    
    // Montar texto no formato do PEP (rótulos e dados na mesma linha)
    const linhas: string[] = [];
    
    if (isConsultaUrg) {
      linhas.push(`** CONSULTA DE URGÊNCIA **`);
    }
    
    linhas.push(`Idade Gestacional: ${igTexto}`);
    
    if (isConsultaUrg) {
      // Queixas de urgência
      let queixasTexto = "-";
      if (consulta.queixasUrgencia) {
        try {
          const q = typeof consulta.queixasUrgencia === 'string' ? JSON.parse(consulta.queixasUrgencia) : consulta.queixasUrgencia;
          if (q.length > 0) queixasTexto = q.join(", ");
        } catch { /* ignore */ }
      }
      linhas.push(`Queixa(s): ${queixasTexto}`);
      if (consulta.detalhamentoQueixa) {
        linhas.push(`Detalhamento: ${consulta.detalhamentoQueixa}`);
      }
    } else {
      linhas.push(`Queixa(s): ${consulta.queixas || "Sem queixas hoje."}`);
    }
    
    linhas.push(
      `Peso: ${pesoTexto}`,
      `AUF: ${aufTexto}`,
      `BCF: ${bcfTexto}`,
      `Edema: ${(() => {
        const edema = (consulta as any).edema;
        if (!edema) return "-";
        if (edema === "0") return "Ausente";
        if (edema === "1") return "+";
        if (edema === "2") return "++";
        if (edema === "3") return "+++";
        if (edema === "4") return "++++";
        return edema;
      })()}`,
      `Pressão Arterial: ${paTexto}`,
    );
    
    // Campos extras de urgência
    if (isConsultaUrg) {
      if (consulta.atividadeUterina) {
        try {
          const au = typeof consulta.atividadeUterina === 'string' ? JSON.parse(consulta.atividadeUterina) : consulta.atividadeUterina;
          if (au.length > 0) linhas.push(`Atividade Uterina: ${au.join(", ")}`);
        } catch { /* ignore */ }
      }
      if (consulta.auf) linhas.push(`AUF (Urgência): ${consulta.auf}`);
      if (consulta.toqueVaginal) linhas.push(`Toque Vaginal: ${consulta.toqueVaginal}`);
      if (consulta.usgHoje) linhas.push(`USG Hoje: ${consulta.usgHoje}`);
      if (consulta.hipoteseDiagnostica) linhas.push(`Hipótese Diagnóstica: ${consulta.hipoteseDiagnostica}`);
      if (consulta.condutaUrgencia) {
        try {
          const cu = typeof consulta.condutaUrgencia === 'string' ? JSON.parse(consulta.condutaUrgencia) : consulta.condutaUrgencia;
          const condutasUrg = Object.entries(cu)
            .filter(([_, v]) => v)
            .map(([k]) => {
              const found = CONDUTAS_URGENCIA.find(c => c.key === k);
              return found ? found.label : k;
            });
          if (condutasUrg.length > 0) linhas.push(`Condutas de Urgência: ${condutasUrg.join(", ")}`);
        } catch { /* ignore */ }
      }
      if (consulta.outraCondutaDescricao) linhas.push(`Outra Conduta: ${consulta.outraCondutaDescricao}`);
    }
    
    linhas.push(`Conduta: ${condutaTexto}`);
    
    // Adicionar complementação se houver
    if (consulta.condutaComplementacao) {
      linhas.push(`Conduta (complementação): ${consulta.condutaComplementacao}`);
    }
    
    // Adicionar observações se houver
    if (consulta.observacoes) {
      linhas.push(`Observações: ${consulta.observacoes}`);
    }
    
    return linhas.join("\n\n");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gestanteSelecionada) {
      toast.error("Selecione uma gestante");
      return;
    }
    
    // Gerar texto PEP antes de salvar (enquanto formData ainda está disponível)
    const textoGerado = gerarTextoPEP();
    setTextoPEP(textoGerado);

    // Salvar queixas personalizadas para rastreamento de frequência
    if (formData.queixas && formData.queixas.trim()) {
      const queixasArray = formData.queixas.split(/[/,]/).map(q => q.trim()).filter(q => q.length > 0);
      queixasArray.forEach(queixa => {
        // Apenas queixas que não são sugestões estáticas
        if (!SUGESTOES_QUEIXAS.includes(queixa)) {
          upsertQueixaMutation.mutate({ texto: queixa });
        }
      });
    }

    // Calcular IG pela DUM e pelo Ultrassom
    const igDUM = calcularIG(formData.dataConsulta);
    const igUS = calcularIGPorUS(formData.dataConsulta);

    const data = {
      gestanteId: gestanteSelecionada,
      dataConsulta: formData.dataConsulta,
      peso: formData.peso ? Math.round(parseFloat(formData.peso) * 1000) : undefined, // converter kg para gramas (preserva 1 casa decimal)
      pressaoArterial: formData.pressaoArterial || undefined,
      alturaUterina: formData.alturaUterina === "nao_palpavel" ? -1 : (formData.alturaUterina ? parseInt(formData.alturaUterina) * 10 : undefined), // -1 = não palpável, converter cm para mm
      bcf: formData.bcf ? parseInt(formData.bcf) : undefined,
      mf: formData.mf ? parseInt(formData.mf) : undefined,
      conduta: formData.conduta.length > 0 ? JSON.stringify(formData.conduta) : undefined,
      condutaComplementacao: formData.condutaComplementacao || undefined,
      observacoes: formData.observacoes || undefined,
      queixas: formData.queixas || undefined,
      edema: formData.edema || undefined,
      // Salvar IG calculada pela DUM
      igDumSemanas: (igDUM && !isNaN(igDUM.semanas)) ? igDUM.semanas : undefined,
      igDumDias: (igDUM && !isNaN(igDUM.dias)) ? igDUM.dias : undefined,
      // Salvar IG calculada pelo Ultrassom
      igUltrassomSemanas: (igUS && !isNaN(igUS.semanas)) ? igUS.semanas : undefined,
      igUltrassomDias: (igUS && !isNaN(igUS.dias)) ? igUS.dias : undefined,
      // Campos de urgência
      ...(isUrgencia ? {
        isUrgencia: 1,
        queixasUrgencia: formData.queixasUrgencia.length > 0 ? formData.queixasUrgencia : undefined,
        detalhamentoQueixa: formData.detalhamentoQueixa || undefined,
        atividadeUterina: formData.atividadeUterina.length > 0 ? formData.atividadeUterina : undefined,
        toqueVaginal: formData.toqueVaginal || undefined,
        usgHoje: formData.usgHoje || undefined,
        hipoteseDiagnostica: formData.hipoteseDiagnostica || undefined,
        condutaUrgencia: Object.keys(formData.condutaUrgencia).length > 0 ? formData.condutaUrgencia : undefined,
        outraCondutaDescricao: formData.outraCondutaDescricao || undefined,
        auf: formData.auf || undefined,
      } : {}),
    };

    if (consultaEditando) {
      updateMutation.mutate({ id: consultaEditando, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (consulta: any) => {
    setConsultaEditando(consulta.id);
    const isConsultaUrgencia = consulta.isUrgencia === 1;
    setIsUrgencia(isConsultaUrgencia);
    
    let condutaArray: string[] = [];
    if (consulta.conduta) {
      try {
        condutaArray = JSON.parse(consulta.conduta);
      } catch {
        condutaArray = [];
      }
    }
    
    // Parse queixas de urgência
    let queixasUrgenciaArray: string[] = [];
    if (isConsultaUrgencia && consulta.queixasUrgencia) {
      try {
        queixasUrgenciaArray = typeof consulta.queixasUrgencia === 'string' 
          ? JSON.parse(consulta.queixasUrgencia) 
          : consulta.queixasUrgencia;
      } catch {
        queixasUrgenciaArray = [];
      }
    }
    
    // Parse atividade uterina
    let atividadeUterinaArray: string[] = [];
    if (isConsultaUrgencia && consulta.atividadeUterina) {
      try {
        atividadeUterinaArray = typeof consulta.atividadeUterina === 'string'
          ? JSON.parse(consulta.atividadeUterina)
          : consulta.atividadeUterina;
      } catch {
        atividadeUterinaArray = [];
      }
    }
    
    // Parse conduta de urgência
    let condutaUrgenciaObj: Record<string, boolean> = {};
    if (isConsultaUrgencia && consulta.condutaUrgencia) {
      try {
        condutaUrgenciaObj = typeof consulta.condutaUrgencia === 'string'
          ? JSON.parse(consulta.condutaUrgencia)
          : consulta.condutaUrgencia;
      } catch {
        condutaUrgenciaObj = {};
      }
    }
    
    setFormData({
      dataConsulta: new Date(consulta.dataConsulta).toISOString().split('T')[0],
      peso: consulta.peso ? String(consulta.peso / 1000) : "",
      pressaoArterial: consulta.pressaoSistolica && consulta.pressaoDiastolica
        ? `${consulta.pressaoSistolica}/${consulta.pressaoDiastolica}`
        : consulta.pressaoArterial || "",
      alturaUterina: consulta.alturaUterina === -1 ? "nao_palpavel" : (consulta.alturaUterina ? String(consulta.alturaUterina / 10) : ""),
      bcf: consulta.bcf ? String(consulta.bcf) : "",
      mf: consulta.mf ? String(consulta.mf) : "",
      edema: (consulta as any).edema || "",
      conduta: condutaArray,
      condutaComplementacao: consulta.condutaComplementacao || "",
      observacoes: consulta.observacoes || "",
      queixas: consulta.queixas || "",
      // Campos de urgência
      queixasUrgencia: queixasUrgenciaArray,
      detalhamentoQueixa: consulta.detalhamentoQueixa || "",
      atividadeUterina: atividadeUterinaArray,
      toqueVaginal: consulta.toqueVaginal || "",
      usgHoje: consulta.usgHoje || "",
      hipoteseDiagnostica: consulta.hipoteseDiagnostica || "",
      condutaUrgencia: condutaUrgenciaObj,
      outraCondutaDescricao: consulta.outraCondutaDescricao || "",
      auf: consulta.auf || "",
    });
    setMostrarFormulario(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Função auxiliar para normalizar data para formato YYYY-MM-DD
  const normalizarData = (data: string | Date): string => {
    if (!data) return '';
    const dataStr = typeof data === 'string' ? data : data.toISOString();
    // Extrair apenas a parte da data (YYYY-MM-DD), ignorando timestamp se houver
    return dataStr.split('T')[0];
  };

  const calcularIG = (dataConsulta: string) => {
    if (!gestante?.dum) return null;
    
    // Normalizar as datas para formato YYYY-MM-DD e adicionar T12:00:00
    const dumNormalizada = normalizarData(gestante.dum);
    const consultaNormalizada = normalizarData(dataConsulta);
    
    if (!dumNormalizada || !consultaNormalizada) return null;
    
    const dum = new Date(dumNormalizada + 'T12:00:00');
    const consulta = new Date(consultaNormalizada + 'T12:00:00');
    
    // Validar se as datas são válidas
    if (isNaN(dum.getTime()) || isNaN(consulta.getTime())) return null;
    
    const diffMs = consulta.getTime() - dum.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(totalDias / 7);
    const dias = totalDias % 7;
    
    // Validar se os valores calculados são válidos
    if (isNaN(semanas) || isNaN(dias)) return null;
    
    return { semanas, dias };
  };

  const calcularIGPorUS = (dataConsulta: string) => {
    if (!gestante?.dataUltrassom || !gestante?.igUltrassomSemanas) return null;
    
    // Normalizar as datas para formato YYYY-MM-DD e adicionar T12:00:00
    const ultrassomNormalizada = normalizarData(gestante.dataUltrassom);
    const consultaNormalizada = normalizarData(dataConsulta);
    
    if (!ultrassomNormalizada || !consultaNormalizada) return null;
    
    const ultrassom = new Date(ultrassomNormalizada + 'T12:00:00');
    const consulta = new Date(consultaNormalizada + 'T12:00:00');
    
    // Validar se as datas são válidas
    if (isNaN(ultrassom.getTime()) || isNaN(consulta.getTime())) return null;
    
    const diffMs = consulta.getTime() - ultrassom.getTime();
    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const totalDiasUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0) + diasDesdeUS;
    const semanas = Math.floor(totalDiasUS / 7);
    const dias = totalDiasUS % 7;
    
    // Validar se os valores calculados são válidos
    if (isNaN(semanas) || isNaN(dias)) return null;
    
    return { semanas, dias };
  };

  const formatarData = (data: Date | string) => {
    // Adicionar T12:00:00 para evitar problemas de fuso horário
    const dataStr = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    const d = new Date(dataStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  // Calcula data para uma semana específica pelo Ultrassom ou DUM
  const calcularDataPorUS = (semanas: number, dias: number = 0) => {
    // Tentar usar dados de ultrassom primeiro
    if (gestante?.dataUltrassom && gestante?.igUltrassomSemanas !== null && gestante?.igUltrassomDias !== null) {
      // Adicionar T12:00:00 para evitar problemas de fuso horário
      const dataUSStr = typeof gestante.dataUltrassom === 'string' ? gestante.dataUltrassom : gestante.dataUltrassom;
      const dataUS = new Date(dataUSStr + 'T12:00:00');
      const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
      const diasDesdeUS = semanas * 7 + dias - igUltrassomDias;
      const dataAlvo = new Date(dataUS);
      dataAlvo.setDate(dataAlvo.getDate() + diasDesdeUS);
      return dataAlvo;
    }
    
    // Fallback: usar DUM se disponível
    if (gestante?.dum && gestante.dum !== "Incerta" && gestante.dum !== "Incompatível com US") {
      const dumStr = typeof gestante.dum === 'string' ? gestante.dum : gestante.dum;
      const dumDate = new Date(dumStr + 'T12:00:00');
      // A DUM corresponde à semana 0, dia 0 da gestação
      const diasDesdedum = semanas * 7 + dias;
      const dataAlvo = new Date(dumDate);
      dataAlvo.setDate(dataAlvo.getDate() + diasDesdedum);
      return dataAlvo;
    }
    
    return null;
  };

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Copiado para a área de transferência!");
  };

  const marcos = [
    {
      titulo: "Concepção",
      icon: Baby,
      semanas: 2,
      dias: 0,
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      titulo: "Morfológico 1º Tri",
      icon: Activity,
      semanas: [11, 13],
      dias: [5, 3],
      color: "bg-emerald-100 text-emerald-700 border-emerald-300",
      isRange: true,
    },
    {
      titulo: "13 Semanas",
      icon: CheckCircle2,
      semanas: 13,
      dias: 0,
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    {
      titulo: "Morfológico 2º Tri",
      icon: Activity,
      semanas: [20, 24],
      dias: [0, 6],
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
      isRange: true,
    },
    {
      titulo: "Curva Glicêmica",
      icon: Activity,
      semanas: [24, 28],
      dias: [0, 6],
      color: "bg-amber-100 text-amber-700 border-amber-300",
      isRange: true,
    },
    {
      titulo: "Vacina dTpa",
      icon: Syringe,
      semanas: 27,
      dias: 0,
      color: "bg-orange-100 text-orange-700 border-orange-300",
    },
    ...(fatoresRisco?.some((f: any) => f.tipo === 'fator_rh_negativo' && f.ativo === 1) ? [{
      titulo: "Vacina Anti-Rh (Imunoglobulina)",
      icon: ShieldAlert,
      semanas: 28,
      dias: 0,
      color: "bg-red-100 text-red-700 border-red-300",
    }] : []),
    {
      titulo: "Vacina Bronquiolite",
      icon: Syringe,
      semanas: [32, 36],
      dias: [0, 0],
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      isRange: true,
    },
    {
      titulo: "Termo Precoce",
      icon: Calendar,
      semanas: 37,
      dias: 0,
      color: "bg-cyan-100 text-cyan-700 border-cyan-300",
    },
    {
      titulo: "Termo Completo",
      icon: Calendar,
      semanas: 39,
      dias: 0,
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      titulo: "DPP (40 semanas)",
      icon: Calendar,
      semanas: 40,
      dias: 0,
      color: "bg-rose-100 text-rose-700 border-rose-300",
    },
  ];

  return (
    <>
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Cartão de Pré-natal</h2>
            <p className="text-muted-foreground">Registre e acompanhe as consultas pré-natais</p>
          </div>
        </div>

        {/* Seleção de Gestante */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Gestante</CardTitle>
            <CardDescription>Escolha a gestante para visualizar ou registrar consultas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Selecionar Gestante</Label>
              <AutocompleteSelect
                options={gestantes?.slice().sort((a: any, b: any) => a.nome.localeCompare(b.nome)) || []}
                value={gestanteSelecionada?.toString() || ""}
                onChange={(value) => {
                  setGestanteSelecionada(parseInt(value));
                  setMostrarFormulario(false);
                  resetForm();
                }}
                placeholder="Digite o nome da gestante..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Barra de Navegação Rápida */}
        {gestanteSelecionada && gestante && (
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b py-2 px-1 -mx-1 rounded-lg">
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                { id: 'dados-gestante', label: 'Dados', icon: FileText },
                { id: 'nova-consulta', label: 'Consulta', icon: Stethoscope },
                { id: 'historico-consultas', label: 'Histórico', icon: ClipboardList },
                { id: 'cesarea', label: 'Cesárea', icon: Calendar },
                { id: 'dados-bebe', label: 'Bebê', icon: Baby },
                { id: 'fatores-risco', label: 'Fatores de Risco', icon: Heart },
                { id: 'medicamentos', label: 'Medicamentos', icon: Pill },
                { id: 'marcos-importantes', label: 'Marcos', icon: Milestone },
                { id: 'graficos', label: 'Gráficos', icon: ChartLine },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    const el = document.getElementById(id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full border bg-card hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Informações da Gestante */}
        {gestante && (
          <Card id="dados-gestante">
            <CardHeader className="flex flex-row items-center justify-between py-0 px-3">
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <FileText className="h-4 w-4" />
                Dados da Gestante
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/dashboard?editar=${gestante.id}`)}
                className="flex items-center gap-2 h-7 text-xs"
              >
                <UserCog className="h-3 w-3" />
                Editar Cadastro
              </Button>
            </CardHeader>
            <CardContent className="px-3 pb-0 pt-0">
              <div className="flex items-center gap-2 mb-0">
                <p className="font-semibold text-base">{gestante.nome}</p>
                <span className="text-muted-foreground text-xs">|</span>
                <span className="text-sm text-muted-foreground">
                  G{gestante.gesta || 0}P{gestante.para || 0}(PN{gestante.partosNormais || 0}PC{gestante.cesareas || 0})A{gestante.abortos || 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">DPP (DUM):</span>
                  <span className="font-medium">{gestante.calculado?.dpp ? formatarData(gestante.calculado.dpp) : "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">DPP (US):</span>
                  <span className="font-medium">{gestante.calculado?.dppUS ? formatarData(gestante.calculado.dppUS) : "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Nova Consulta */}
        <div id="nova-consulta">
        {gestanteSelecionada && !mostrarFormulario && (
          <Button onClick={() => {
            setMostrarFormulario(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Consulta
          </Button>
        )}
        </div>

        {/* Formulário de Consulta */}
        {mostrarFormulario && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {consultaEditando ? "Editar Consulta" : "Nova Consulta"}
                  {isUrgencia && (
                    <span className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgência
                    </span>
                  )}
                </CardTitle>
                {savedAt && !consultaEditando && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    Rascunho salvo {new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Alerta Rh Negativo */}
              {(() => {
                // Verificar se gestante é Rh negativo via exames lab ou fatores de risco
                const tipagemExame = resultadosExamesLab?.['Tipagem sanguínea ABO/Rh'];
                const tipoSanguineo = tipagemExame && typeof tipagemExame === 'object' ? (tipagemExame['1'] || '') : '';
                const isRhNegativo = tipoSanguineo.includes('-') || fatoresRisco?.some((f: any) => f.tipo === 'fator_rh_negativo');
                const temTipoSanguineo = !!tipoSanguineo;
                
                if (!isRhNegativo) return null;
                
                // Calcular data de 28 semanas
                let data28Semanas = '';
                let igAtualSemanas = 0;
                if (gestante) {
                  // Priorizar US sobre DUM
                  if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== undefined && gestante.igUltrassomSemanas !== null) {
                    const dataUS = new Date(gestante.dataUltrassom);
                    const igDiasNoUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0);
                    const hoje = new Date();
                    const diffMs = hoje.getTime() - dataUS.getTime();
                    const diasDesdeUS = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const igAtualDias = igDiasNoUS + diasDesdeUS;
                    igAtualSemanas = Math.floor(igAtualDias / 7);
                    const diasFaltam28 = (28 * 7) - igAtualDias;
                    if (diasFaltam28 > 0) {
                      const data28 = new Date(hoje.getTime() + diasFaltam28 * 24 * 60 * 60 * 1000);
                      data28Semanas = data28.toLocaleDateString('pt-BR');
                    }
                  } else if (gestante.dum && gestante.dum !== 'Incerta' && gestante.dum !== 'Incompatível com US') {
                    const dum = new Date(gestante.dum);
                    const hoje = new Date();
                    const diffMs = hoje.getTime() - dum.getTime();
                    const igAtualDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    igAtualSemanas = Math.floor(igAtualDias / 7);
                    const diasFaltam28 = (28 * 7) - igAtualDias;
                    if (diasFaltam28 > 0) {
                      const data28 = new Date(hoje.getTime() + diasFaltam28 * 24 * 60 * 60 * 1000);
                      data28Semanas = data28.toLocaleDateString('pt-BR');
                    }
                  }
                }
                
                return (
                  <div className="mb-4 p-4 rounded-lg border-2 border-red-400 bg-red-50 dark:bg-red-950/30">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="font-bold text-red-700 dark:text-red-400 text-base">
                          ⚠️ GESTANTE Rh NEGATIVO {temTipoSanguineo ? `(${tipoSanguineo})` : ''}
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1.5 list-disc list-inside">
                          <li><strong>Solicitar Coombs Indireto</strong> nesta consulta</li>
                          <li>
                            <strong>Prescrever Imunoglobulina anti-Rh</strong>
                            {igAtualSemanas >= 28 ? (
                              <span className="ml-1 font-bold text-red-800 dark:text-red-200">
                                — ATENÇÃO: gestante já atingiu 28 semanas! Prescrever AGORA se ainda não prescrito.
                              </span>
                            ) : data28Semanas ? (
                              <span className="ml-1">
                                — completará 28 semanas em <strong>{data28Semanas}</strong>
                              </span>
                            ) : null}
                          </li>
                          <li>Em caso de <strong>sangramento vaginal antes de 28 semanas</strong>, prescrever imunoglobulina imediatamente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Consulta</Label>
                    <Input
                      type="date"
                      value={formData.dataConsulta}
                      onChange={(e) => setFormData({ ...formData, dataConsulta: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Idade Gestacional</Label>
                    <div className="bg-muted p-3 rounded-md space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">DUM:</span>{" "}
                        {(() => {
                          const ig = calcularIG(formData.dataConsulta);
                          if (!ig) return "-";
                          // Verificar se os valores são NaN (DUM incerta ou incompatível)
                          if (isNaN(ig.semanas) || isNaN(ig.dias)) {
                            return <span className="italic text-muted-foreground">desconsiderada</span>;
                          }
                          return `${ig.semanas} ${ig.semanas === 1 ? 'semana' : 'semanas'} e ${ig.dias} ${ig.dias === 1 ? 'dia' : 'dias'}`;
                        })()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Ultrassom:</span>{" "}
                        {(() => {
                          const igUS = calcularIGPorUS(formData.dataConsulta);
                          if (!igUS) return "-";
                          // Verificar se os valores são NaN
                          if (isNaN(igUS.semanas) || isNaN(igUS.dias)) {
                            return <span className="italic text-muted-foreground">desconsiderada</span>;
                          }
                          return `${igUS.semanas} ${igUS.semanas === 1 ? 'semana' : 'semanas'} e ${igUS.dias} ${igUS.dias === 1 ? 'dia' : 'dias'}`;
                        })()}
                      </p>
                      {(() => {
                        // Calcular diferença entre IG DUM e IG US
                        const igDUM = calcularIG(formData.dataConsulta);
                        const igUS = calcularIGPorUS(formData.dataConsulta);
                        
                        if (!igDUM || !igUS) return null;
                        if (isNaN(igDUM.semanas) || isNaN(igDUM.dias) || isNaN(igUS.semanas) || isNaN(igUS.dias)) return null;
                        
                        // Converter para dias totais
                        const diasDUM = igDUM.semanas * 7 + igDUM.dias;
                        const diasUS = igUS.semanas * 7 + igUS.dias;
                        const diferenca = Math.abs(diasDUM - diasUS);
                        
                        // Mostrar alerta se diferença > 5 dias
                        if (diferenca > 5) {
                          return (
                            <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div className="text-xs text-yellow-800">
                                <p className="font-medium">Divergência detectada ({diferenca} dias)</p>
                                <p className="text-yellow-700 mt-0.5">Revise a DUM ou data do ultrassom para garantir precisão nos cálculos.</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Queixa(s)</Label>
                    {isUrgencia ? (
                      <div className="border rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {QUEIXAS_URGENCIA.map((queixa) => (
                            <label
                              key={queixa}
                              className="flex items-center gap-2 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.queixasUrgencia.includes(queixa)}
                                onChange={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    queixasUrgencia: prev.queixasUrgencia.includes(queixa)
                                      ? prev.queixasUrgencia.filter(q => q !== queixa)
                                      : [...prev.queixasUrgencia, queixa]
                                  }));
                                }}
                                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm">{queixa}</span>
                            </label>
                          ))}
                        </div>
                        <div>
                          <Label className="text-sm">Detalhamento da Queixa</Label>
                          <TextareaComAutocomplete
                            value={formData.detalhamentoQueixa}
                            onChange={(detalhamentoQueixa) => setFormData({ ...formData, detalhamentoQueixa })}
                            placeholder="Detalhe a queixa da paciente..."
                            rows={2}
                            tipo="detalhamento_queixa_urgencia"
                          />
                        </div>
                      </div>
                    ) : (
                       <AutocompleteInput
                         value={formData.queixas}
                         onChange={(val) => setFormData({ ...formData, queixas: val })}
                         suggestions={sugestoesQueixasCombinadas}
                         suggestionIds={sugestoesQueixasIds}
                         placeholder="Ex: Sem queixas hoje / Dor lombar / Náuseas..."
                       />
                    )}
                  </div>
                  {/* Campos de exame físico - ocultos na consulta de urgência (redundantes com campos específicos abaixo) */}
                  {!isUrgencia && (
                    <>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={formData.peso}
                      onChange={(e) => {
                        const v = e.target.value.replace(",", ".");
                        if (v === "" || /^\d{0,3}(\.\d{0,1})?$/.test(v)) {
                          setFormData({ ...formData, peso: v });
                        }
                      }}
                      placeholder="Ex: 65.5"
                    />
                  </div>
                    </>
                  )}
                  <div className={isUrgencia ? "col-span-2" : ""}>
                    <Label>Pressão Arterial</Label>
                    <Input
                      type="text"
                      value={formData.pressaoArterial}
                      onChange={(e) => setFormData({ ...formData, pressaoArterial: e.target.value })}
                      placeholder="Ex: 120/80 ou 120x80"
                    />
                  </div>
                  {!isUrgencia && (
                    <>
                  <div>
                    <Label>Altura Uterina (cm)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.alturaUterina}
                      onChange={(e) => setFormData({ ...formData, alturaUterina: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="nao_palpavel">Útero não palpável</option>
                      {Array.from({ length: 31 }, (_, i) => i + 10).map(cm => (
                        <option key={cm} value={String(cm)}>{cm} cm</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>BCF</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.bcf}
                      onChange={(e) => setFormData({ ...formData, bcf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Positivo</option>
                      <option value="0">Não audível</option>
                    </select>
                  </div>
                  <div>
                    <Label>MF (Movimento Fetal)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.mf}
                      onChange={(e) => setFormData({ ...formData, mf: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">Sim</option>
                      <option value="0">Não</option>
                    </select>
                  </div>
                  <div>
                    <Label>Edema</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.edema}
                      onChange={(e) => setFormData({ ...formData, edema: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="0">Ausente</option>
                      <option value="1">+ (Tornozelo)</option>
                      <option value="2">++ (Joelho)</option>
                      <option value="3">+++ (Coxa)</option>
                      <option value="4">++++ (Generalizado)</option>
                    </select>
                  </div>
                    </>
                  )}
                </div>
                
                {/* Seção de Lembretes Pendentes */}
                {!consultaEditando && lembretesPendentes && lembretesPendentes.length > 0 && (
                  <div className="border-2 border-amber-400 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <Label className="text-base font-semibold text-amber-800 dark:text-amber-300">Lembretes da Consulta Anterior</Label>
                      <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                        {lembretesPendentes.length} {lembretesPendentes.length === 1 ? 'pendente' : 'pendentes'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                      Marque os itens resolvidos. Itens não marcados continuarão aparecendo na próxima consulta.
                    </p>
                    <div className="space-y-2">
                      {lembretesPendentes.map((lembrete) => (
                        <label
                          key={lembrete.id}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                            lembretesResolvidos.includes(lembrete.id)
                              ? 'bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700'
                              : 'bg-white dark:bg-background border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={lembretesResolvidos.includes(lembrete.id)}
                            onChange={() => {
                              setLembretesResolvidos(prev =>
                                prev.includes(lembrete.id)
                                  ? prev.filter(id => id !== lembrete.id)
                                  : [...prev, lembrete.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-amber-400 text-green-600 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${
                              lembretesResolvidos.includes(lembrete.id)
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                            }`}>
                              {lembrete.conduta}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              (desde {new Date(lembrete.criadoEm).toLocaleDateString('pt-BR')})
                            </span>
                          </div>
                          {lembretesResolvidos.includes(lembrete.id) && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Conduta com Checkboxes */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Conduta:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarAddConduta(!mostrarAddConduta)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar Conduta
                    </Button>
                  </div>

                  {/* Formulário para adicionar nova conduta */}
                  {mostrarAddConduta && (
                    <div className="mb-4 p-3 bg-background rounded-lg border flex gap-2">
                      <Input
                        value={novaConduta}
                        onChange={(e) => setNovaConduta(e.target.value)}
                        placeholder="Nome da nova conduta..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (novaConduta.trim()) {
                            createCondutaMutation.mutate({ nome: novaConduta.trim() });
                          }
                        }}
                        disabled={!novaConduta.trim() || createCondutaMutation.isPending}
                      >
                        Salvar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNovaConduta("");
                          setMostrarAddConduta(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* Condutas predefinidas */}
                    {OPCOES_CONDUTA.map((opcao) => (
                      <label
                        key={opcao}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.conduta.includes(opcao)}
                          onChange={() => toggleConduta(opcao)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-muted-foreground">{opcao}</span>
                      </label>
                    ))}

                    {/* Condutas personalizadas */}
                    {condutasPersonalizadas && condutasPersonalizadas.length > 0 && (
                      <>
                        <div className="col-span-full border-t my-2 pt-2">
                          <span className="text-xs text-muted-foreground font-medium">Condutas Personalizadas:</span>
                        </div>
                        {condutasPersonalizadas.map((conduta) => (
                          <label
                            key={`custom-${conduta.id}`}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors group"
                          >
                            <input
                              type="checkbox"
                              checked={formData.conduta.includes(conduta.nome)}
                              onChange={() => toggleConduta(conduta.nome)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-muted-foreground flex-1">{conduta.nome}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm(`Remover conduta "${conduta.nome}"?`)) {
                                  deleteCondutaMutation.mutate({ id: conduta.id });
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Campos extras de Urgência */}
                {isUrgencia && (
                  <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50/30 dark:bg-red-950/10 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Label className="text-base font-semibold text-red-800 dark:text-red-300">Campos da Consulta de Urgência</Label>
                    </div>

                    {/* Atividade Uterina */}
                    <div>
                      <Label className="text-sm font-medium">Atividade Uterina</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        {ATIVIDADE_UTERINA.map((opcao) => (
                          <label
                            key={opcao}
                            className="flex items-center gap-2 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.atividadeUterina.includes(opcao)}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  atividadeUterina: prev.atividadeUterina.includes(opcao)
                                    ? prev.atividadeUterina.filter(a => a !== opcao)
                                    : [...prev.atividadeUterina, opcao]
                                }));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm">{opcao}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* AUF */}
                    <div>
                      <Label className="text-sm font-medium">AUF</Label>
                      <TextareaComAutocomplete
                        value={formData.auf}
                        onChange={(auf) => setFormData({ ...formData, auf })}
                        placeholder="Altura uterina de fundo..."
                        rows={1}
                        tipo="auf_urgencia"
                      />
                    </div>

                    {/* Toque Vaginal */}
                    <div>
                      <Label className="text-sm font-medium">Toque Vaginal</Label>
                      <TextareaComAutocomplete
                        value={formData.toqueVaginal}
                        onChange={(toqueVaginal) => setFormData({ ...formData, toqueVaginal })}
                        placeholder="Resultado do toque vaginal..."
                        rows={1}
                        tipo="toque_vaginal"
                      />
                    </div>

                    {/* USG Hoje */}
                    <div>
                      <Label className="text-sm font-medium">USG Hoje</Label>
                      <TextareaComAutocomplete
                        value={formData.usgHoje}
                        onChange={(usgHoje) => setFormData({ ...formData, usgHoje })}
                        placeholder="Resultado da ultrassonografia..."
                        rows={2}
                        tipo="usg_hoje"
                      />
                    </div>

                    {/* Hipótese Diagnóstica */}
                    <div>
                      <Label className="text-sm font-medium">Hipótese Diagnóstica</Label>
                      <TextareaComAutocomplete
                        value={formData.hipoteseDiagnostica}
                        onChange={(hipoteseDiagnostica) => setFormData({ ...formData, hipoteseDiagnostica })}
                        placeholder="Hipótese diagnóstica..."
                        rows={2}
                        tipo="hipotese_diagnostica"
                      />
                    </div>

                    {/* Condutas de Urgência */}
                    <div>
                      <Label className="text-sm font-medium">Condutas de Urgência</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                        {CONDUTAS_URGENCIA.map((conduta) => (
                          <label
                            key={conduta.key}
                            className="flex items-center gap-2 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={!!formData.condutaUrgencia[conduta.key]}
                              onChange={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  condutaUrgencia: {
                                    ...prev.condutaUrgencia,
                                    [conduta.key]: !prev.condutaUrgencia[conduta.key]
                                  }
                                }));
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm">{conduta.label}</span>
                          </label>
                        ))}
                      </div>
                      {formData.condutaUrgencia['outra_conduta'] && (
                        <div className="mt-2">
                          <Label className="text-sm">Descrição da Outra Conduta</Label>
                          <TextareaComAutocomplete
                            value={formData.outraCondutaDescricao}
                            onChange={(outraCondutaDescricao) => setFormData({ ...formData, outraCondutaDescricao })}
                            placeholder="Descreva a outra conduta..."
                            rows={2}
                            tipo="outra_conduta_urgencia"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conduta Complementação */}
                <div>
                  <Label>Conduta (complementação):</Label>
                  <TextareaComAutocomplete
                    value={formData.condutaComplementacao}
                    onChange={(condutaComplementacao) => setFormData({ ...formData, condutaComplementacao })}
                    placeholder="Complementação da conduta..."
                    rows={2}
                    tipo="conduta_complementacao"
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <TextareaComAutocomplete
                    value={formData.observacoes}
                    onChange={(observacoes) => setFormData({ ...formData, observacoes })}
                    placeholder="Observações da consulta..."
                    rows={3}
                    tipo="observacao"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {(createMutation.isPending || updateMutation.isPending) 
                      ? 'Salvando...' 
                      : (consultaEditando ? "Atualizar" : "Salvar")}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  {!consultaEditando && savedAt && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        clearDraft();
                        setFormData({
                          dataConsulta: getDataHoje(),
                          peso: "",
                          pressaoArterial: "",
                          alturaUterina: "",
                          bcf: "",
                          mf: "",
                          edema: "",
                          conduta: [],
                          condutaComplementacao: "",
                          observacoes: "",
                          queixas: "",
                          queixasUrgencia: [],
                          detalhamentoQueixa: "",
                          atividadeUterina: [],
                          toqueVaginal: "",
                          usgHoje: "",
                          hipoteseDiagnostica: "",
                          condutaUrgencia: {},
                          outraCondutaDescricao: "",
                          auf: "",
                        });
                        toast.success('Rascunho limpo', {
                          description: 'Formulário resetado com sucesso.',
                        });
                      }}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Rascunho
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Consultas */}
        {gestanteSelecionada && consultas && consultas.length > 0 && (
          <Card id="historico-consultas">
            <CardHeader>
              <CardTitle>Histórico de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>IG</TableHead>
                    <TableHead>Peso</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>AU</TableHead>
                    <TableHead>BCF</TableHead>
                    <TableHead>MF</TableHead>
                    <TableHead>Conduta</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultas.map((consulta: any) => {
                    const igDUM = calcularIG(consulta.dataConsulta);
                    const igUS = gestante?.dataUltrassom ? calcularIGPorUS(consulta.dataConsulta) : null;
                    return (
                      <TableRow key={consulta.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{formatarData(consulta.dataConsulta)}</span>
                            {consulta.isUrgencia === 1 && (
                              <span className="inline-flex items-center rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Urgência
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>I.G. DUM: {igDUM ? `${igDUM.semanas}s ${igDUM.dias}d` : "-"}</div>
                            {igUS && <div>I.G. US: {igUS.semanas}s {igUS.dias}d</div>}
                          </div>
                        </TableCell>
                        <TableCell>{consulta.peso ? `${(consulta.peso / 1000).toFixed(1)} kg` : "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {consulta.pressaoSistolica && consulta.pressaoDiastolica 
                              ? `${consulta.pressaoSistolica}/${consulta.pressaoDiastolica}`
                              : consulta.pressaoArterial || "-"}
                            {((consulta.pressaoSistolica && consulta.pressaoSistolica >= 140) || 
                              (consulta.pressaoDiastolica && consulta.pressaoDiastolica >= 90) ||
                              isBPAbnormal(consulta.pressaoArterial)) && (
                              <span title="Pressão arterial ≥140/90 mmHg">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>
                              {consulta.alturaUterina === -1 ? (
                                <span className="text-muted-foreground italic">Útero não palpável</span>
                              ) : consulta.alturaUterina ? `${(consulta.alturaUterina / 10).toFixed(0)} cm` : "-"}
                            </span>
                            {consulta.alturaUterina && consulta.alturaUterina !== -1 && isAUAbnormal(consulta.alturaUterina / 10, consulta.igDumSemanas || consulta.igUltrassomSemanas) && (
                              <span title="Altura uterina fora dos percentis 10-90">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {consulta.bcf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Positivo</span>
                          ) : consulta.bcf === 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Não audível</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {consulta.mf === 1 ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sim</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            if (!consulta.conduta) return "-";
                            try {
                              const condutas = JSON.parse(consulta.conduta);
                              if (condutas.length === 0) return "-";
                              return (
                                <div className="space-y-1">
                                  {condutas.map((c: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 mr-1">
                                      {c}
                                    </span>
                                  ))}
                                  {consulta.condutaComplementacao && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {consulta.condutaComplementacao}
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              return "-";
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {consulta.observacoes && <span>{consulta.observacoes}</span>}
                            {consulta.isUrgencia === 1 && consulta.hipoteseDiagnostica && (
                              <div className="text-xs text-red-700 bg-red-50 rounded px-1.5 py-0.5">
                                <span className="font-medium">HD:</span> {consulta.hipoteseDiagnostica}
                              </div>
                            )}
                            {!consulta.observacoes && !(consulta.isUrgencia === 1 && consulta.hipoteseDiagnostica) && "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Copiar texto PEP"
                              onClick={() => {
                                const texto = gerarTextoPEPConsultaAnterior(consulta);
                                setTextoPEPConsultaAnterior(texto);
                                setShowPEPConsultaAnterior(true);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Editar consulta"
                              onClick={() => handleEdit(consulta)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Excluir consulta"
                              onClick={() => handleDelete(consulta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Envio Rápido de Orientações via WhatsApp */}
        {gestanteSelecionada && gestante && (
          <Card id="envio-rapido-whatsapp">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Envio Rápido de Orientações via WhatsApp
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Envie orientações diretamente para {gestante.nome?.split(' ')[0] || 'a paciente'} durante a consulta
                {!gestante.telefone && (
                  <span className="text-red-500 font-medium ml-1">(telefone não cadastrado)</span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-green-200 hover:bg-green-50 hover:border-green-400 text-green-800"
                  disabled={!gestante.telefone || enviandoWhatsApp === 'or-alimentares-1a'}
                  onClick={() => handleEnviarOrientacao(
                    'or-alimentares-1a',
                    `Olá ${gestante.nome?.split(' ')[0] || ''}! 🤰\n\nSegue o *Guia de Alimentação para uma Gestação Saudável* da Clínica Mais Mulher.\n\nEste material contém orientações nutricionais importantes para esta fase, incluindo:\n• Princípios de ouro da nutrição na gravidez\n• Alimentos que devem ser evitados\n• Sugestão de cardápio semanal balanceado\n\nLeia com atenção e em caso de dúvidas, converse com seu médico na próxima consulta.\n\nAbraços da equipe Mais Mulher! 💜`,
                    'https://d2xsxph8kpxj0f.cloudfront.net/310519663167696128/bSA4q7aMJsJeSmafooCq7A/orientacoes-alimentares-1a-consulta_bb34a959.pdf'
                  )}
                >
                  {enviandoWhatsApp === 'or-alimentares-1a' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UtensilsCrossed className="h-4 w-4" />
                  )}
                  Or. Alimentares 1ª cons
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 text-blue-800"
                  disabled={!gestante.telefone || enviandoWhatsApp === 'enviar-cartao'}
                  onClick={() => {
                    if (!gestante) return;
                    setEnviandoWhatsApp('enviar-cartao');
                    enviarCartaoMutation.mutate({ gestanteId: gestante.id });
                  }}
                >
                  {enviandoWhatsApp === 'enviar-cartao' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Enviar Cartão
                </Button>
                {/* Espaço para futuros botões */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Planejada para a Cesárea */}
        {gestanteSelecionada && gestante && (
          <Card id="cesarea">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Agendamento de Cirurgia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Data da Cirurgia */}
                <div className="space-y-2">
                  <Label htmlFor="dataPartoProgramado">Data da Cirurgia</Label>
                  <Input
                    id="dataPartoProgramado"
                    type="date"
                    value={dataCesareaLocal}
                    onChange={(e) => {
                      const novaData = e.target.value;
                      setDataCesareaLocal(novaData);
                      setDataCesareaModificada(novaData !== (gestante.dataPartoProgramado || ""));
                      setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
                    }}
                    className="max-w-xs"
                  />
                </div>

                {/* Convênio - Obrigatório */}
                <ConvenioSelect
                  value={convenioCirurgiaLocal}
                  onValueChange={(value: string) => {
                    setConvenioCirurgiaLocal(value);
                    setDataCesareaModificada(true);
                    // Se já tem agendamento, salvar imediatamente
                    if (gestante.dataPartoProgramado) {
                      updateGestanteMutation.mutate({
                        id: gestanteSelecionada!,
                        convenioCirurgia: value,
                      });
                    }
                  }}
                  label="Convênio"
                  required
                />

                {/* Procedimento - Obrigatório */}
                <ProcedimentoSelect
                  value={procedimentoCirurgiaLocal}
                  onValueChange={(value) => {
                    setProcedimentoCirurgiaLocal(value);
                    setDataCesareaModificada(true);
                    // Se não é "Outra" e já tem agendamento, salvar imediatamente
                    if (value !== "Outra" && gestante.dataPartoProgramado) {
                      updateGestanteMutation.mutate({
                        id: gestanteSelecionada!,
                        procedimentoCirurgia: value,
                      });
                      setProcedimentoOutroTexto("");
                    }
                  }}
                  outroTexto={procedimentoOutroTexto}
                  onOutroTextoChange={setProcedimentoOutroTexto}
                  label="Procedimento"
                  required
                  skipDefault={!!gestante?.procedimentoCirurgia}
                />

                {/* Botão de Agendar */}
                <div className="flex gap-2 items-center pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const novaData = dataCesareaLocal;
                      
                      // Validar campos obrigatórios
                      if (!novaData) {
                        toast.error('Selecione a data da cirurgia.');
                        return;
                      }
                      if (!convenioCirurgiaLocal) {
                        toast.error('Selecione o convênio.');
                        return;
                      }
                      if (!procedimentoCirurgiaLocal) {
                        toast.error('Selecione o procedimento.');
                        return;
                      }
                      if (procedimentoCirurgiaLocal === "Outra" && !procedimentoOutroTexto.trim()) {
                        toast.error('Descreva o procedimento.');
                        return;
                      }
                      
                      // Determinar o valor final do procedimento
                      const procedimentoFinal = procedimentoCirurgiaLocal === "Outra" 
                        ? procedimentoOutroTexto.trim() 
                        : procedimentoCirurgiaLocal;
                      
                      // Se a data foi limpa, salvar imediatamente (remover agendamento)
                      if (!novaData) {
                        updateGestanteMutation.mutate({
                          id: gestanteSelecionada!,
                          dataPartoProgramado: novaData,
                        });
                        setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
                        setDataCesareaModificada(false);
                        toast.success('Agendamento removido.');
                        return;
                      }
                      
                      // Usar utilitário compartilhado para validar
                      const dadosRef: DadosReferencia = gestante ? {
                        dataUltrassom: gestante.dataUltrassom,
                        igUltrassomSemanas: gestante.igUltrassomSemanas,
                        igUltrassomDias: gestante.igUltrassomDias,
                        dum: gestante.dum,
                      } : {};
                      
                      const resultado = validarDataCesarea(novaData, dadosRef);
                      
                      if (resultado.classificacao !== 'normal') {
                        setConfirmacaoDataCesarea({
                          open: true,
                          tipo: resultado.classificacao,
                          novaData,
                          igNaData: resultado.igNaData
                        });
                        return;
                      }
                      
                      setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
                      
                      // Salvar todos os campos e enviar ao Mapa Cirúrgico
                      updateGestanteMutation.mutate({
                        id: gestanteSelecionada!,
                        dataPartoProgramado: novaData,
                        tipoPartoDesejado: "cesariana",
                        convenioCirurgia: convenioCirurgiaLocal,
                        procedimentoCirurgia: procedimentoFinal,
                      });
                      setDataCesareaModificada(false);
                      toast.success('Cirurgia agendada com sucesso!', {
                        description: `${procedimentoFinal} | ${convenioCirurgiaLocal} | ${novaData.split('-').reverse().join('/')}. Enviado ao Mapa Cirúrgico.`,
                      });
                    }}
                    disabled={!dataCesareaLocal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CalendarCheck className="h-4 w-4 mr-1" />
                    {gestante.dataPartoProgramado ? 'Reagendar' : 'Agendar'}
                  </Button>
                  {gestante.dataPartoProgramado && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        updateGestanteMutation.mutate({
                          id: gestanteSelecionada!,
                          dataPartoProgramado: "",
                        });
                        setDataCesareaLocal("");
                        setAlertaDataCesarea({ show: false, tipo: null, igNaData: null });
                        setDataCesareaModificada(false);
                        toast.success('Agendamento de cirurgia removido.');
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Remover Agendamento
                    </Button>
                  )}
                </div>
                {gestante.dataPartoProgramado && (
                  <p className="text-sm text-muted-foreground">
                    Agendamento atual: {formatarData(gestante.dataPartoProgramado)}
                    {gestante.convenioCirurgia && ` | ${gestante.convenioCirurgia}`}
                    {gestante.procedimentoCirurgia && ` | ${gestante.procedimentoCirurgia}`}
                  </p>
                )}
                {!gestante.dataPartoProgramado && dataCesareaLocal && (
                  <p className="text-sm text-orange-600 font-medium">
                    Preencha todos os campos e clique em "Agendar" para confirmar e enviar ao Mapa Cirúrgico.
                  </p>
                )}
              </div>
              
              {gestante.dataPartoProgramado && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="motivoCesarea">Motivo da Indicação da Cirurgia</Label>
                  <Select
                    value={gestante.motivoCesarea || ""}
                    onValueChange={(value) => {
                      updateGestanteMutation.mutate({
                        id: gestanteSelecionada!,
                        motivoCesarea: value,
                      });
                    }}
                  >
                    <SelectTrigger id="motivoCesarea" className="max-w-md">
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apresentacao pelvica">Apresentação pélvica</SelectItem>
                      <SelectItem value="Cesarea iterativa">Cesárea iterativa</SelectItem>
                      <SelectItem value="Cirurgia uterina previa">Cirurgia uterina prévia</SelectItem>
                      <SelectItem value="Descolamento prematuro placenta">Descolamento prematuro de placenta</SelectItem>
                      <SelectItem value="Desejo materno">Desejo materno</SelectItem>
                      <SelectItem value="Desproporção cefalopelvica">Desproporção cefalopélvica</SelectItem>
                      <SelectItem value="Falha inducao parto">Falha na indução do parto</SelectItem>
                      <SelectItem value="Gemelar">Gestação gemelar</SelectItem>
                      <SelectItem value="Herpes genital ativo">Herpes genital ativo</SelectItem>
                      <SelectItem value="HIV positivo">HIV positivo (carga viral elevada)</SelectItem>
                      <SelectItem value="Macrossomia fetal">Macrossomia fetal</SelectItem>
                      <SelectItem value="Placenta previa">Placenta prévia</SelectItem>
                      <SelectItem value="Sofrimento fetal">Sofrimento fetal</SelectItem>
                      <SelectItem value="Outro">Outro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Selecione a indicação médica para a cirurgia</p>
                  
                  {gestante.motivoCesarea === "Outro" && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="motivoCesareaOutro">Especifique o motivo</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateGestanteMutation.mutate({
                              id: gestanteSelecionada!,
                              motivoCesareaOutro: motivoCesareaOutroLocal,
                            });
                          }}
                          className="h-8"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                      <Input
                        id="motivoCesareaOutro"
                        type="text"
                        placeholder="Descreva a indicação médica"
                        value={motivoCesareaOutroLocal}
                        onChange={(e) => setMotivoCesareaOutroLocal(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Hospital do Parto */}
              <HospitalSelect
                value={gestante.hospitalParto || ""}
                onValueChange={(value) => {
                  updateGestanteMutation.mutate({
                    id: gestanteSelecionada!,
                    hospitalParto: value,
                  });
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Dados do Bebê */}
        {gestanteSelecionada && gestante && (
          <Card id="dados-bebe" className={gestante.sexoBebe === "masculino" ? "border-l-4 border-l-blue-400" : gestante.sexoBebe === "feminino" ? "border-l-4 border-l-pink-400" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {gestante.sexoBebe === "masculino" ? (
                  <Baby className="h-5 w-5 text-blue-500" />
                ) : gestante.sexoBebe === "feminino" ? (
                  <Baby className="h-5 w-5 text-pink-500" />
                ) : (
                  <Baby className="h-5 w-5" />
                )}
                <span>Dados do Bebê</span>
                {gestante.sexoBebe === "masculino" && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    ♂ Menino
                  </span>
                )}
                {gestante.sexoBebe === "feminino" && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
                    ♀ Menina
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeBebe">Nome planejado para o bebê</Label>
                    <Input
                      id="nomeBebe"
                      placeholder="Ex: Maria, João, etc."
                      value={dadosBebe.nomeBebe}
                      onChange={(e) => setDadosBebe(prev => ({ ...prev, nomeBebe: e.target.value }))}
                      className="max-w-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexoBebe">Sexo do bebê</Label>
                    <Select
                      value={dadosBebe.sexoBebe}
                      onValueChange={(value) => setDadosBebe(prev => ({ ...prev, sexoBebe: value as "masculino" | "feminino" | "nao_informado" }))}
                    >
                      <SelectTrigger id="sexoBebe" className={`max-w-xs ${dadosBebe.sexoBebe === "masculino" ? "border-blue-300 focus:ring-blue-400" : dadosBebe.sexoBebe === "feminino" ? "border-pink-300 focus:ring-pink-400" : ""}`}>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_informado">Não Informado</SelectItem>
                        <SelectItem value="masculino">
                          <span className="flex items-center gap-2">
                            <span className="text-blue-500">♂</span> Masculino
                          </span>
                        </SelectItem>
                        <SelectItem value="feminino">
                          <span className="flex items-center gap-2">
                            <span className="text-pink-500">♀</span> Feminino
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      updateGestanteMutation.mutate({
                        id: gestanteSelecionada!,
                        nomeBebe: dadosBebe.nomeBebe,
                        sexoBebe: dadosBebe.sexoBebe,
                      }, {
                        onSuccess: () => {
                          toast.success("Dados do bebê atualizados com sucesso!");
                        }
                      });
                    }}
                    disabled={updateGestanteMutation.isPending}
                  >
                    {updateGestanteMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fatores de Risco */}
        <div id="fatores-risco">
        {gestanteSelecionada && gestante && (
          <FatoresRiscoManager 
            gestanteId={gestanteSelecionada} 
            idadeGestante={gestante.calculado?.idade}
          />
        )}

        </div>

        {/* Medicamentos na Gestação */}
        <div id="medicamentos">
        {gestanteSelecionada && (
          <MedicamentosManager gestanteId={gestanteSelecionada} />
        )}
        </div>

        {/* Marcos Importantes da Gestação */}
        {gestante && (gestante.dataUltrassom || gestante.dum) && (
          <Card id="marcos-importantes">
            <CardHeader>
              <CardTitle>Marcos Importantes da Gestação</CardTitle>
              <CardDescription>
                {gestante.dataUltrassom 
                  ? "Calculados pela data do Ultrassom" 
                  : "Calculados pela Data da Última Menstruação (DUM)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {marcos.map((marco, idx) => {
                  const Icon = marco.icon;
                  let dataInicio = null;
                  let dataFim = null;
                  let textoParaCopiar = "";

                  if (marco.isRange && Array.isArray(marco.semanas) && Array.isArray(marco.dias)) {
                    dataInicio = calcularDataPorUS(marco.semanas[0], marco.dias[0]);
                    dataFim = calcularDataPorUS(marco.semanas[1], marco.dias[1]);
                    // Formato: "DD/MM a DD/MM/AAAA"
                    if (dataInicio && dataFim) {
                      const diaInicio = String(dataInicio.getDate()).padStart(2, '0');
                      const mesInicio = String(dataInicio.getMonth() + 1).padStart(2, '0');
                      const diaFim = String(dataFim.getDate()).padStart(2, '0');
                      const mesFim = String(dataFim.getMonth() + 1).padStart(2, '0');
                      const anoFim = dataFim.getFullYear();
                      textoParaCopiar = `${diaInicio}/${mesInicio} a ${diaFim}/${mesFim}/${anoFim}`;
                    } else {
                      textoParaCopiar = '-';
                    }
                  } else if (typeof marco.semanas === 'number' && typeof marco.dias === 'number') {
                    dataInicio = calcularDataPorUS(marco.semanas, marco.dias);
                    textoParaCopiar = dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-';
                  }

                  return (
                    <Card key={idx} className={`border-2 ${marco.color} relative`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            <span className="font-semibold text-sm">{marco.titulo}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copiarTexto(textoParaCopiar)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {marco.isRange ? (
                          <div className="text-sm space-y-1">
                            <div>{dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'} a</div>
                            <div>{dataFim ? dataFim.toLocaleDateString('pt-BR') : '-'}</div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium">
                            {dataInicio ? dataInicio.toLocaleDateString('pt-BR') : '-'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Peso */}
        <div id="graficos">
        {gestante && consultas && consultas.length > 0 && gestante.altura && gestante.pesoInicial && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Peso Gestacional</CardTitle>
              <CardDescription>Acompanhamento do ganho de peso baseado no IMC pré-gestacional</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoPeso
                consultas={consultas.map((c: any) => {
                  // Priorizar IG pelo Ultrassom, usar DUM como fallback
                  const igUS = calcularIGPorUS(c.dataConsulta);
                  const igDUM = calcularIG(c.dataConsulta);
                  const ig = igUS || igDUM; // Prioriza US
                  return {
                    data: c.dataConsulta,
                    peso: c.peso / 1000, // converter gramas para kg
                    igSemanas: ig?.semanas || 0,
                  };
                })}
                altura={gestante.altura}
                pesoInicial={gestante.pesoInicial / 1000} // converter gramas para kg
                metodoCalculo={
                  // Priorizar US se disponível, senão usar DUM
                  (gestante?.dataUltrassom && gestante?.igUltrassomSemanas !== null) 
                    ? 'US' 
                    : (gestante?.dum && gestante?.dum !== 'Incerta' && gestante?.dum !== 'Incompatível com US')
                      ? 'DUM'
                      : 'US' // Fallback para US se nenhum estiver disponível
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Altura Uterina */}
        {gestante && consultas && consultas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Altura Uterina (AU)</CardTitle>
              <CardDescription>Acompanhamento da altura uterina ao longo da gestação</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoAlturaUterina
                consultas={consultas}
                dum={gestante.dum}
              />
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pressão Arterial */}
        {gestante && consultas && consultas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Pressão Arterial</CardTitle>
              <CardDescription>Acompanhamento da pressão arterial ao longo da gestação</CardDescription>
            </CardHeader>
            <CardContent>
              <GraficoPressaoArterial
                consultas={consultas}
                dum={gestante.dum}
              />
            </CardContent>
          </Card>
        )}

        </div>

        {/* Botão Gerar Cartão */}
        {gestante && (
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={handleGerarPDF}
              size="lg"
              disabled={isGerandoPDF}
              className="bg-[#8B4049] hover:bg-[#6d3239]"
            >
              {isGerandoPDF ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Abrindo...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Imprimir / Salvar PDF
                </>
              )}
            </Button>
          </div>
        )}

        {/* Componente invisível para geração de PDF */}

        {gestante && (
          <CartaoPrenatalPDF
            ref={pdfRef}
            gestante={gestante}
            consultas={consultas || []}
            marcos={calcularMarcos()}
            ultrassons={ultrassons || []}
            exames={exames || []}
          />
        )}



        {/* Modal de Texto para PEP (nova consulta) */}
        {showPEPModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Copiar para PEP
                </CardTitle>
                <CardDescription>
                  Texto formatado para colar no Prontuário Eletrônico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={textoPEP}
                  readOnly
                  rows={12}
                  className="font-mono text-sm bg-muted"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(textoPEP);
                      toast.success("Texto copiado para a área de transferência!");
                      setShowPEPModal(false);
                      if (scrollToMarcosAfterPEP) {
                        setScrollToMarcosAfterPEP(false);
                        setTimeout(() => {
                          const marcosEl = document.getElementById('marcos-importantes');
                          if (marcosEl) {
                            marcosEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }
                    }}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Texto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPEPModal(false);
                      if (scrollToMarcosAfterPEP) {
                        setScrollToMarcosAfterPEP(false);
                        setTimeout(() => {
                          const marcosEl = document.getElementById('marcos-importantes');
                          if (marcosEl) {
                            marcosEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 300);
                      }
                    }}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Modal de Texto PEP para consultas anteriores */}
        {showPEPConsultaAnterior && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Texto PEP - Consulta Anterior
                </CardTitle>
                <CardDescription>
                  Texto formatado para colar no Prontuário Eletrônico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={textoPEPConsultaAnterior}
                  readOnly
                  rows={14}
                  className="font-mono text-sm bg-muted"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(textoPEPConsultaAnterior);
                      toast.success("Texto copiado para a área de transferência!");
                    }}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Texto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPEPConsultaAnterior(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </GestantesLayout>
    {/* Diálogo de confirmação para data de cesárea fora do período recomendado */}
    <AlertDialog open={confirmacaoDataCesarea.open} onOpenChange={(open) => {
      if (!open) setConfirmacaoDataCesarea({ open: false, tipo: null, novaData: '', igNaData: null });
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${
              confirmacaoDataCesarea.tipo === 'passado' ? 'text-red-600' :
              confirmacaoDataCesarea.tipo === 'pre-termo' ? 'text-orange-600' : 'text-red-600'
            }`} />
            {confirmacaoDataCesarea.tipo === 'passado' 
              ? 'Data no passado!' 
              : confirmacaoDataCesarea.tipo === 'pre-termo' 
                ? 'Cesárea pré-termo!' 
                : 'Cesárea pós-termo!'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {confirmacaoDataCesarea.tipo === 'passado' ? (
                <>
                  <p className="text-red-700 font-medium">
                    A data selecionada ({confirmacaoDataCesarea.novaData.split('-').reverse().join('/')}) já passou.
                  </p>
                  <p>Verifique se o ano está correto. Deseja realmente agendar para esta data?</p>
                </>
              ) : confirmacaoDataCesarea.tipo === 'pre-termo' ? (
                <>
                  <p className="text-orange-700 font-medium">
                    A cesárea está agendada antes de 37 semanas (pré-termo).
                  </p>
                  {confirmacaoDataCesarea.igNaData && (
                    <p>IG estimada na data: <strong>{confirmacaoDataCesarea.igNaData.semanas}s{confirmacaoDataCesarea.igNaData.dias}d</strong></p>
                  )}
                  <p>Cesáreas eletivas são recomendadas a partir de 37 semanas completas. Deseja confirmar esta data?</p>
                </>
              ) : (
                <>
                  <p className="text-red-700 font-medium">
                    A cesárea está agendada com 40 semanas ou mais (pós-termo).
                  </p>
                  {confirmacaoDataCesarea.igNaData && (
                    <p>IG estimada na data: <strong>{confirmacaoDataCesarea.igNaData.semanas}s{confirmacaoDataCesarea.igNaData.dias}d</strong></p>
                  )}
                  <p>Gestações com 40 semanas ou mais requerem avaliação rigorosa. Deseja confirmar esta data?</p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={`${
              confirmacaoDataCesarea.tipo === 'passado' ? 'bg-red-600 hover:bg-red-700' :
              confirmacaoDataCesarea.tipo === 'pre-termo' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={() => {
              // Determinar o valor final do procedimento
              const procedimentoFinal = procedimentoCirurgiaLocal === "Outra" 
                ? procedimentoOutroTexto.trim() 
                : procedimentoCirurgiaLocal;
              // Salvar a data após confirmação com convênio e procedimento
              updateGestanteMutation.mutate({
                id: gestanteSelecionada!,
                dataPartoProgramado: confirmacaoDataCesarea.novaData,
                tipoPartoDesejado: "cesariana",
                convenioCirurgia: convenioCirurgiaLocal,
                procedimentoCirurgia: procedimentoFinal,
              });
              // Mostrar o alerta persistente
              if (confirmacaoDataCesarea.tipo !== 'passado' && confirmacaoDataCesarea.igNaData) {
                setAlertaDataCesarea({
                  show: true,
                  tipo: confirmacaoDataCesarea.tipo as 'pre-termo' | 'pos-termo',
                  igNaData: confirmacaoDataCesarea.igNaData
                });
              }
              setDataCesareaModificada(false);
              setConfirmacaoDataCesarea({ open: false, tipo: null, novaData: '', igNaData: null });
              toast.warning('Cesárea agendada com aviso', {
                description: confirmacaoDataCesarea.tipo === 'passado' 
                  ? `Data ${confirmacaoDataCesarea.novaData.split('-').reverse().join('/')} está no passado. Enviado ao Mapa Cirúrgico.`
                  : `Cesárea agendada fora do período recomendado (${confirmacaoDataCesarea.tipo}). Enviado ao Mapa Cirúrgico.`,
              });
            }}
          >
            Confirmar mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>);
}
