import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { parseLocalDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/PhoneInput";
import { EmailInput } from "@/components/EmailInput";
import { DateOfBirthInput } from "@/components/DateOfBirthInput";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Calendar, CalendarCheck, Baby, Check, AlertTriangle } from "lucide-react";
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
import { useAutoSave } from "@/hooks/useAutoSave";
import { useInstantSave } from "@/hooks/useInstantSave";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import FatoresRiscoManager from "@/components/FatoresRiscoManager";
import { HospitalSelect } from "@/components/HospitalSelect";
import { validarDataCesarea, type DadosReferencia } from "@/lib/cesareanValidation";

interface FormularioGestanteProps {
  gestanteId?: number | null;
  onSuccess: (data?: any) => void;
  onCancel: () => void;
}

export default function FormularioGestante({
  gestanteId,
  onSuccess,
  onCancel,
}: FormularioGestanteProps) {
  const [, setLocation] = useLocation();
  const { setGestanteAtiva } = useGestanteAtiva();
  const [tipoDUM, setTipoDUM] = useState<"data" | "incerta" | "incompativel">("data");
  
  const [calculosEmTempoReal, setCalculosEmTempoReal] = useState<{
    igDUM: { semanas: number; dias: number } | null;
    dppDUM: string | null;
    igUS: { semanas: number; dias: number } | null;
    dppUS: string | null;
  }>({ igDUM: null, dppDUM: null, igUS: null, dppUS: null });
  
  // Estado para alerta de data de cesárea fora do período recomendado
  const [alertaDataCesarea, setAlertaDataCesarea] = useState<{
    show: boolean;
    tipo: 'pre-termo' | 'pos-termo' | null;
    igNaData: { semanas: number; dias: number } | null;
    acknowledged: boolean;
  }>({ show: false, tipo: null, igNaData: null, acknowledged: false });
  
  // Estado para diálogo de confirmação de data pré-termo/pós-termo/passado
  const [confirmacaoDataCesarea, setConfirmacaoDataCesarea] = useState<{
    open: boolean;
    tipo: 'pre-termo' | 'pos-termo' | 'passado' | null;
    igNaData: { semanas: number; dias: number } | null;
  }>({ open: false, tipo: null, igNaData: null });
  
  // Estado local para data de cesárea pendente (só confirma ao clicar "Agendar")
  const [dataCesareaLocal, setDataCesareaLocal] = useState("");
  const [dataCesareaConfirmada, setDataCesareaConfirmada] = useState(false);
  
  // Estado local para motivo de cesárea "Outro" (evitar auto-save)
  const [motivoCesareaOutroLocal, setMotivoCesareaOutroLocal] = useState("");
  
  // Estado para alerta de diferença entre IG DUM e IG US
  const [alertaDiferencaIG, setAlertaDiferencaIG] = useState<{
    show: boolean;
    diferencaDias: number;
  }>({ show: false, diferencaDias: 0 });
  
  // Estados para validação de altura e peso
  const [alertaAltura, setAlertaAltura] = useState<{
    show: boolean;
    mensagem: string;
  }>({ show: false, mensagem: "" });
  
  const [alertaPeso, setAlertaPeso] = useState<{
    show: boolean;
    mensagem: string;
  }>({ show: false, mensagem: "" });
  
  // Estado de validação
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    altura?: string;
    pesoInicial?: string;
  }>({});
  
  // Estados para confirmação ao sair
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [formDataInitial, setFormDataInitial] = useState<typeof formData | null>(null);
  
  // Estado para modal de iniciar consulta
  const [showStartConsultaModal, setShowStartConsultaModal] = useState(false);
  const [createdGestanteId, setCreatedGestanteId] = useState<number | null>(null);
  const [createdGestanteName, setCreatedGestanteName] = useState<string>("");
  
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    planoSaudeId: "",
    carteirinhaUnimed: "",
    medicoId: "",
    tipoPartoDesejado: "a_definir",
    gesta: "",
    para: "",
    partosNormais: "",
    cesareas: "",
    abortos: "",
    dum: "",
    igUltrassomSemanas: "",
    igUltrassomDias: "",
    dataUltrassom: "",
    dataPartoProgramado: "",
    motivoCesarea: "",
    motivoCesareaOutro: "",
    hospitalParto: "",
    nomeBebe: "",
    sexoBebe: "nao_informado",
    observacoes: "",
    altura: "",
    pesoInicial: "",
  });

  // Auto-save hook (500ms padrão)
  const { savedAt, loadDraft, clearDraft } = useAutoSave(
    `formulario-gestante-${gestanteId || 'novo'}`,
    { ...formData, tipoDUM }
  );
  
  // Salvamento instantâneo para campos críticos (0ms)
  useInstantSave(`gestante-nome-${gestanteId || 'novo'}`, formData.nome);
  useInstantSave(`gestante-dataNascimento-${gestanteId || 'novo'}`, formData.dataNascimento);
  useInstantSave(`gestante-dum-${gestanteId || 'novo'}`, formData.dum);
  
  // Formatar timestamp para exibição
  const lastSavedFormatted = savedAt ? new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

  const { data: gestante } = trpc.gestantes.get.useQuery(
    { id: gestanteId! },
    { enabled: !!gestanteId }
  );

  const { data: medicos = [] } = trpc.medicos.listar.useQuery();
  const { data: planos = [] } = trpc.planosSaude.listar.useQuery();

  // Rascunho removido: formulário sempre abre em branco para novos cadastros
  
  // Salvar estado inicial do formulário
  useEffect(() => {
    if (gestante || (!gestanteId && formDataInitial === null)) {
      setFormDataInitial({ ...formData });
    }
  }, [gestante]);
  
  // Detectar alterações
  useEffect(() => {
    if (formDataInitial) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(formDataInitial);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, formDataInitial]);
  
  // Recalcular IG e DPP quando campos relevantes mudarem
  useEffect(() => {
    // Usar meio-dia local para evitar problemas de fuso horário
    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);
    
    let igDUM = null;
    let dppDUM = null;
    let igUS = null;
    let dppUS = null;

    // Calcular IG e DPP pela DUM (se data conhecida)
    if (tipoDUM === "data" && formData.dum) {
      try {
        const dumDate = parseLocalDate(formData.dum);
        
        // Calcular IG DUM
        const diffMs = hoje.getTime() - dumDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const semanas = Math.floor(diffDays / 7);
        const dias = diffDays % 7;
        igDUM = { semanas, dias };

        // Calcular DPP DUM (DUM + 280 dias)
        const dppDate = new Date(dumDate);
        dppDate.setDate(dppDate.getDate() + 280);
        dppDUM = dppDate.toLocaleDateString('pt-BR');
      } catch (error) {
        console.error('Erro ao calcular pela DUM:', error);
      }
    }

    // Calcular IG e DPP pelo Ultrassom (se todos os campos preenchidos)
    if (formData.dataUltrassom && formData.igUltrassomSemanas && formData.igUltrassomDias !== '') {
      try {
        const dataUS = parseLocalDate(formData.dataUltrassom);
        const igSemanas = parseInt(formData.igUltrassomSemanas);
        const igDias = parseInt(formData.igUltrassomDias);
        
        if (!isNaN(igSemanas) && !isNaN(igDias)) {
          // Calcular IG US atual
          const diffMs = hoje.getTime() - dataUS.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const igTotalDiasUS = (igSemanas * 7) + igDias + diffDays;
          const semanasUS = Math.floor(igTotalDiasUS / 7);
          const diasUS = igTotalDiasUS % 7;
          igUS = { semanas: semanasUS, dias: diasUS };

          // Calcular DPP US (data do US + dias restantes até 40 semanas)
          const diasRestantes = (40 * 7) - (igSemanas * 7 + igDias);
          const dppDate = new Date(dataUS);
          dppDate.setDate(dppDate.getDate() + diasRestantes);
          dppUS = dppDate.toLocaleDateString('pt-BR');
        }
      } catch (error) {
        console.error('Erro ao calcular pelo US:', error);
      }
    }

    setCalculosEmTempoReal({ igDUM, dppDUM, igUS, dppUS });
    
    // Validar diferença entre IG DUM e IG US (comparar na data do ultrassom)
    if (tipoDUM === "data" && formData.dum && formData.dataUltrassom && formData.igUltrassomSemanas && formData.igUltrassomDias !== '') {
      try {
        const dumDate = parseLocalDate(formData.dum);
        const dataUS = parseLocalDate(formData.dataUltrassom);
        const igSemanas = parseInt(formData.igUltrassomSemanas);
        const igDias = parseInt(formData.igUltrassomDias);
        
        if (!isNaN(igSemanas) && !isNaN(igDias)) {
          // Calcular IG DUM na data do ultrassom
          const diffMs = dataUS.getTime() - dumDate.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const igDUMnaDataUS = diffDays; // IG DUM em dias na data do US
          
          // IG US registrada em dias
          const igUSregistrada = (igSemanas * 7) + igDias;
          
          // Calcular diferença
          const diferencaDias = Math.abs(igDUMnaDataUS - igUSregistrada);
          
          if (diferencaDias > 5) {
            setAlertaDiferencaIG({ show: true, diferencaDias });
          } else {
            setAlertaDiferencaIG({ show: false, diferencaDias: 0 });
          }
        } else {
          setAlertaDiferencaIG({ show: false, diferencaDias: 0 });
        }
      } catch (error) {
        console.error('Erro ao validar diferença IG:', error);
        setAlertaDiferencaIG({ show: false, diferencaDias: 0 });
      }
    } else {
      setAlertaDiferencaIG({ show: false, diferencaDias: 0 });
    }
  }, [formData.dum, formData.dataUltrassom, formData.igUltrassomSemanas, formData.igUltrassomDias, tipoDUM]);
  
  // Validação de data de cesárea agora é feita no botão "Agendar" (não mais automática)
  
  // Validar altura e peso
  useEffect(() => {
    // Validar altura (120-200 cm)
    if (formData.altura) {
      const altura = parseFloat(formData.altura);
      if (!isNaN(altura)) {
        if (altura < 120) {
          setAlertaAltura({
            show: true,
            mensagem: "⚠️ Altura muito baixa (< 120cm). Verifique se o valor está correto."
          });
        } else if (altura > 200) {
          setAlertaAltura({
            show: true,
            mensagem: "⚠️ Altura muito alta (> 200cm). Verifique se o valor está correto."
          });
        } else {
          setAlertaAltura({ show: false, mensagem: "" });
        }
      } else {
        setAlertaAltura({ show: false, mensagem: "" });
      }
    } else {
      setAlertaAltura({ show: false, mensagem: "" });
    }
    
    // Validar peso (30-180 kg)
    if (formData.pesoInicial) {
      const peso = parseFloat(formData.pesoInicial);
      if (!isNaN(peso)) {
        if (peso < 30) {
          setAlertaPeso({
            show: true,
            mensagem: "⚠️ Peso muito baixo (< 30kg). Verifique se o valor está correto."
          });
        } else if (peso > 180) {
          setAlertaPeso({
            show: true,
            mensagem: "⚠️ Peso muito alto (> 180kg). Verifique se o valor está correto."
          });
        } else {
          setAlertaPeso({ show: false, mensagem: "" });
        }
      } else {
        setAlertaPeso({ show: false, mensagem: "" });
      }
    } else {
      setAlertaPeso({ show: false, mensagem: "" });
    }
  }, [formData.altura, formData.pesoInicial]);

  const createMutation = trpc.gestantes.create.useMutation({
    onSuccess: (data) => {
      clearDraft();
      setHasUnsavedChanges(false);
      toast.success("Gestante cadastrada com sucesso!");
      
      // Passar os dados da gestante para o callback onSuccess (para seleção automática)
      onSuccess(data);
      
      // Mostrar modal para iniciar consulta
      setCreatedGestanteId(data.id);
      setCreatedGestanteName(formData.nome);
      setShowStartConsultaModal(true);
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar gestante: " + error.message);
    },
  });

  const updateMutation = trpc.gestantes.update.useMutation({
    onSuccess: (data) => {
      clearDraft();
      setHasUnsavedChanges(false);
      toast.success("Gestante atualizada com sucesso!");
      
      // Passar os dados da gestante para o callback onSuccess
      onSuccess(data);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar gestante: " + error.message);
    },
  });

  const enviarOrientacoesMutation = trpc.gestantes.enviarOrientacoesAlimentares.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error("Erro ao enviar orientações: " + error.message);
    },
  });

  useEffect(() => {
    if (gestante) {
      // Detectar tipo de DUM
      if (gestante.dum === "Incerta") {
        setTipoDUM("incerta");
      } else if (gestante.dum === "Incompatível com US") {
        setTipoDUM("incompativel");
      } else if (gestante.dum) {
        setTipoDUM("data");
      }
      
      setFormData({
        nome: gestante.nome || "",
        telefone: gestante.telefone || "",
        email: gestante.email || "",
        dataNascimento: gestante.dataNascimento ? (typeof gestante.dataNascimento === 'string' ? gestante.dataNascimento : (gestante.dataNascimento as Date).toISOString().split('T')[0]) : "",
        planoSaudeId: gestante.planoSaudeId?.toString() || "",
        carteirinhaUnimed: gestante.carteirinhaUnimed || "",
        medicoId: gestante.medicoId?.toString() || "",
        tipoPartoDesejado: gestante.tipoPartoDesejado || "",
        gesta: gestante.gesta?.toString() || "",
        para: gestante.para?.toString() || "",
        partosNormais: gestante.partosNormais?.toString() || "",
        cesareas: gestante.cesareas?.toString() || "",
        abortos: gestante.abortos?.toString() || "",
        dum: (gestante.dum === "Incerta" || gestante.dum === "Incompatível com US") ? "" : (gestante.dum ? (typeof gestante.dum === 'string' ? gestante.dum : (gestante.dum as Date).toISOString().split('T')[0]) : ""),
        igUltrassomSemanas: gestante.igUltrassomSemanas?.toString() || "",
        igUltrassomDias: gestante.igUltrassomDias?.toString() || "",
        dataUltrassom: gestante.dataUltrassom ? (typeof gestante.dataUltrassom === 'string' ? gestante.dataUltrassom : (gestante.dataUltrassom as Date).toISOString().split('T')[0]) : "",
        dataPartoProgramado: gestante.dataPartoProgramado ? (typeof gestante.dataPartoProgramado === 'string' ? gestante.dataPartoProgramado : (gestante.dataPartoProgramado as Date).toISOString().split('T')[0]) : "",
        motivoCesarea: gestante.motivoCesarea || "",
        motivoCesareaOutro: gestante.motivoCesareaOutro || "",
        hospitalParto: gestante.hospitalParto || "",
        nomeBebe: gestante.nomeBebe || "",
        sexoBebe: gestante.sexoBebe || "nao_informado",
        observacoes: gestante.observacoes || "",
        altura: gestante.altura?.toString() || "",
        pesoInicial: gestante.pesoInicial ? (gestante.pesoInicial / 1000).toFixed(1) : "", // converter gramas para kg
      });
      
      // Inicializar estado local para motivo de cesárea "Outro"
      setMotivoCesareaOutroLocal(gestante.motivoCesareaOutro || "");
      
      // Inicializar estado local para data de cesárea
      const dataExistente = gestante.dataPartoProgramado ? (typeof gestante.dataPartoProgramado === 'string' ? gestante.dataPartoProgramado : (gestante.dataPartoProgramado as Date).toISOString().split('T')[0]) : "";
      setDataCesareaLocal(dataExistente);
      setDataCesareaConfirmada(!!dataExistente);
    }
  }, [gestante]);

  // Função de validação
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    
    // Validar nome
    if (!formData.nome || formData.nome.trim() === '') {
      errors.nome = 'Nome é obrigatório';
    }
    
    // Validar data de nascimento
    if (!formData.dataNascimento) {
      errors.dataNascimento = 'Data de nascimento é obrigatória';
    }
    
    // Validar e-mail (obrigatório)
    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }
    
    // Validar telefone (obrigatório)
    if (!formData.telefone || formData.telefone.trim() === '') {
      errors.telefone = 'Telefone é obrigatório';
    }
    
    // Validar altura (obrigatório)
    if (!formData.altura || formData.altura.trim() === '') {
      errors.altura = 'Altura é obrigatória';
    }
    
    // Validar peso inicial (obrigatório)
    if (!formData.pesoInicial || formData.pesoInicial.trim() === '') {
      errors.pesoInicial = 'Peso ao engravidar é obrigatório';
    }
    
    setFieldErrors(errors);
    
    // Se houver erros, mostrar toast e retornar false
    if (Object.keys(errors).length > 0) {
      toast.error('Preencha todos os campos obrigatórios', {
        description: 'Verifique os campos destacados em vermelho.',
      });
      return false;
    }
    
    return true;
  };
  
  // Limpar erro de um campo quando ele for preenchido
  const clearFieldError = (fieldName: keyof typeof fieldErrors) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };
  
  // Validar campo individual (onBlur)
  const validateField = (fieldName: keyof typeof fieldErrors) => {
    const errors: typeof fieldErrors = {};
    
    switch (fieldName) {
      case 'nome':
        if (!formData.nome || formData.nome.trim() === '') {
          errors.nome = 'Nome é obrigatório';
        }
        break;
      case 'dataNascimento':
        if (!formData.dataNascimento) {
          errors.dataNascimento = 'Data de nascimento é obrigatória';
        }
        break;
      case 'email':
        if (!formData.email || formData.email.trim() === '') {
          errors.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'E-mail inválido';
        }
        break;
    }
    
    setFieldErrors(prev => ({
      ...prev,
      ...errors
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário antes de enviar
    if (!validateForm()) {
      return;
    }
    
    // Bloquear salvamento se data de cesárea foi preenchida mas não confirmada com o botão Agendar
    if (dataCesareaLocal && !dataCesareaConfirmada) {
      toast.error('Data de cesárea não confirmada', {
        description: 'Clique no botão "Agendar" para confirmar a data da cesárea antes de salvar.',
      });
      return;
    }

    const data: any = {
      nome: formData.nome,
      telefone: formData.telefone || undefined,
      email: formData.email || undefined,
      dataNascimento: formData.dataNascimento || undefined,
      planoSaudeId: formData.planoSaudeId ? parseInt(formData.planoSaudeId) : undefined,
      carteirinhaUnimed: formData.carteirinhaUnimed || undefined,
      medicoId: formData.medicoId && formData.medicoId !== "0" ? parseInt(formData.medicoId) : undefined,
      tipoPartoDesejado: formData.tipoPartoDesejado,
      gesta: formData.gesta ? parseInt(formData.gesta) : undefined,
      para: formData.para ? parseInt(formData.para) : undefined,
      partosNormais: formData.partosNormais ? parseInt(formData.partosNormais) : undefined,
      cesareas: formData.cesareas ? parseInt(formData.cesareas) : undefined,
      abortos: formData.abortos ? parseInt(formData.abortos) : undefined,
      dum: tipoDUM === "incerta" ? "Incerta" : tipoDUM === "incompativel" ? "Incompatível com US" : (formData.dum || undefined),
      igUltrassomSemanas: formData.igUltrassomSemanas ? parseInt(formData.igUltrassomSemanas) : undefined,
      igUltrassomDias: formData.igUltrassomSemanas && formData.igUltrassomDias === '' ? 0 : (formData.igUltrassomDias !== '' ? parseInt(formData.igUltrassomDias) : undefined),
      dataUltrassom: formData.dataUltrassom || undefined,
      dataPartoProgramado: formData.dataPartoProgramado || undefined,
      motivoCesarea: formData.motivoCesarea || undefined,
      motivoCesareaOutro: formData.motivoCesareaOutro || undefined,
      hospitalParto: formData.hospitalParto || undefined,
      nomeBebe: formData.nomeBebe || undefined,
      sexoBebe: formData.sexoBebe as "masculino" | "feminino" | "nao_informado" || undefined,
      observacoes: formData.observacoes || undefined,
      altura: formData.altura ? parseInt(formData.altura) : undefined,
      pesoInicial: formData.pesoInicial ? Math.round(parseFloat(formData.pesoInicial) * 1000) : undefined, // converter kg para gramas
    };

    if (gestanteId) {
      updateMutation.mutate({ id: gestanteId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowExitConfirmation(true);
            } else {
              onCancel();
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">
            {gestanteId ? "Editar Gestante" : "Nova Gestante"}
          </h2>
          <p className="text-muted-foreground">
            Preencha os dados da gestante
          </p>
        </div>
        {lastSavedFormatted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-600" />
            <span>Rascunho salvo {lastSavedFormatted}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    clearFieldError('nome');
                  }}
                  onBlur={() => validateField('nome')}
                  className={fieldErrors.nome ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required
                />
                {fieldErrors.nome && (
                  <p className="text-sm text-red-500">{fieldErrors.nome}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <DateOfBirthInput
                  id="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={(value) => {
                    setFormData({ ...formData, dataNascimento: value });
                    clearFieldError('dataNascimento');
                  }}
                  onBlur={() => validateField('dataNascimento')}
                  showAge={true}
                  minAge={10}
                  maxAge={60}
                  className={fieldErrors.dataNascimento ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.dataNascimento && (
                  <p className="text-sm text-red-500">{fieldErrors.dataNascimento}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PhoneInput
                      id="telefone"
                      value={formData.telefone}
                      onChange={(value) => {
                        setFormData({ ...formData, telefone: value });
                        if (fieldErrors.telefone) setFieldErrors(prev => ({ ...prev, telefone: undefined }));
                      }}
                      className={fieldErrors.telefone ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {fieldErrors.telefone && (
                      <p className="text-sm text-red-500 mt-1">{fieldErrors.telefone}</p>
                    )}
                  </div>
                  {gestanteId && formData.telefone && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                      title="Enviar Orientações Alimentares via WhatsApp"
                      disabled={enviarOrientacoesMutation.isPending}
                      onClick={() => {
                        enviarOrientacoesMutation.mutate({ gestanteId: gestanteId });
                      }}
                    >
                      {enviarOrientacoesMutation.isPending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
                <EmailInput
                  id="email"
                  value={formData.email}
                  onChange={(value) => {
                    setFormData({ ...formData, email: value });
                    clearFieldError('email');
                  }}
                  onBlur={() => validateField('email')}
                  className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Administrativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planoSaudeId">Plano de Saúde</Label>
                <Select
                  value={formData.planoSaudeId}
                  onValueChange={(v) => setFormData({ ...formData, planoSaudeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {planos.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carteirinhaUnimed">Carteirinha Unimed</Label>
                <Input
                  id="carteirinhaUnimed"
                  value={formData.carteirinhaUnimed}
                  onChange={(e) => setFormData({ ...formData, carteirinhaUnimed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicoId">Médico Responsável</Label>
                <Select
                  value={formData.medicoId}
                  onValueChange={(v) => setFormData({ ...formData, medicoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nenhum</SelectItem>
                    {medicos.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipoPartoDesejado">Tipo de Parto Desejado/Indicado</Label>
                <Select
                  value={formData.tipoPartoDesejado}
                  onValueChange={(v: any) => setFormData({ ...formData, tipoPartoDesejado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_definir">A definir</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="cesariana">Cesárea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>História Obstétrica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gesta">Gesta</Label>
                <Input
                  id="gesta"
                  type="number"
                  min="0"
                  value={formData.gesta}
                  onChange={(e) => setFormData({ ...formData, gesta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="para">Para</Label>
                <Input
                  id="para"
                  type="number"
                  min="0"
                  value={formData.para}
                  onChange={(e) => setFormData({ ...formData, para: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partosNormais">Partos Normais</Label>
                <Input
                  id="partosNormais"
                  type="number"
                  min="0"
                  value={formData.partosNormais}
                  onChange={(e) => setFormData({ ...formData, partosNormais: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cesareas">Cesáreas</Label>
                <Input
                  id="cesareas"
                  type="number"
                  min="0"
                  value={formData.cesareas}
                  onChange={(e) => setFormData({ ...formData, cesareas: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="abortos">Abortos</Label>
                <Input
                  id="abortos"
                  type="number"
                  min="0"
                  value={formData.abortos}
                  onChange={(e) => setFormData({ ...formData, abortos: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Obstétricos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Primeira linha: DUM e Data do Ultrassom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoDUM">DUM (Data da Última Menstruação)</Label>
                  <Select value={tipoDUM} onValueChange={(value: "data" | "incerta" | "incompativel") => {
                    setTipoDUM(value);
                    if (value !== "data") {
                      setFormData({ ...formData, dum: "" });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de DUM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data">Data Conhecida</SelectItem>
                      <SelectItem value="incerta">Incerta</SelectItem>
                      <SelectItem value="incompativel">Incompatível com US</SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoDUM === "data" && (
                    <Input
                      id="dum"
                      type="date"
                      value={formData.dum}
                      onChange={(e) => setFormData({ ...formData, dum: e.target.value })}
                      className="mt-2"
                    />
                  )}
                  {tipoDUM === "incerta" && (
                    <p className="text-sm text-muted-foreground mt-2">DUM incerta - cálculos baseados em DUM não serão exibidos</p>
                  )}
                  {tipoDUM === "incompativel" && (
                    <p className="text-sm text-muted-foreground mt-2">DUM incompatível com ultrassom - cálculos baseados em DUM não serão exibidos</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataUltrassom">Data do Ultrassom</Label>
                  <Input
                    id="dataUltrassom"
                    type="date"
                    value={formData.dataUltrassom}
                    onChange={(e) => setFormData({ ...formData, dataUltrassom: e.target.value })}
                  />
                  {/* IG Ultrassom (Semanas e Dias) abaixo da Data do Ultrassom */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="igUltrassomSemanas" className="text-xs">Semanas</Label>
                      <Input
                        id="igUltrassomSemanas"
                        type="number"
                        min="0"
                        max="42"
                        value={formData.igUltrassomSemanas}
                        onChange={(e) => setFormData({ ...formData, igUltrassomSemanas: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="igUltrassomDias" className="text-xs">Dias</Label>
                      <Input
                        id="igUltrassomDias"
                        type="number"
                        min="0"
                        max="6"
                        value={formData.igUltrassomDias}
                        onChange={(e) => setFormData({ ...formData, igUltrassomDias: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Segunda linha: Altura e Peso Inicial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="altura">Altura (cm) <span className="text-red-500">*</span></Label>
                  <Input
                    id="altura"
                    type="number"
                    min="100"
                    max="250"
                    placeholder="Ex: 165"
                    value={formData.altura}
                    onChange={(e) => {
                      setFormData({ ...formData, altura: e.target.value });
                      if (fieldErrors.altura) setFieldErrors(prev => ({ ...prev, altura: undefined }));
                    }}
                    className={fieldErrors.altura ? "border-red-500 focus-visible:ring-red-500" : alertaAltura.show ? "border-amber-500 focus-visible:ring-amber-500" : ""}
                  />
                  {fieldErrors.altura && (
                    <p className="text-sm text-red-500">{fieldErrors.altura}</p>
                  )}
                  {alertaAltura.show && (
                    <p className="text-sm text-amber-600 flex items-start gap-1">
                      <span className="mt-0.5">{alertaAltura.mensagem}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pesoInicial">Peso Inicial (kg) <span className="text-red-500">*</span></Label>
                  <Input
                    id="pesoInicial"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 65.5"
                    value={formData.pesoInicial}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      if (v === "" || /^\d{0,3}(\.\d{0,1})?$/.test(v)) {
                        setFormData({ ...formData, pesoInicial: v });
                        if (fieldErrors.pesoInicial) setFieldErrors(prev => ({ ...prev, pesoInicial: undefined }));
                      }
                    }}
                    className={fieldErrors.pesoInicial ? "border-red-500 focus-visible:ring-red-500" : alertaPeso.show ? "border-amber-500 focus-visible:ring-amber-500" : ""}
                  />
                  {fieldErrors.pesoInicial && (
                    <p className="text-sm text-red-500">{fieldErrors.pesoInicial}</p>
                  )}
                  {alertaPeso.show ? (
                    <p className="text-sm text-amber-600 flex items-start gap-1">
                      <span className="mt-0.5">{alertaPeso.mensagem}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Peso pré-gestacional para cálculo do IMC</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerta de Diferença entre IG DUM e IG US */}
        {alertaDiferencaIG.show && (
          <Card className="bg-amber-50 border-amber-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Atenção: Diferença entre IG DUM e IG US
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-amber-900 font-medium mb-2">
                  Foi detectada uma diferença de <span className="font-bold">{alertaDiferencaIG.diferencaDias} dias</span> entre a Idade Gestacional calculada pela DUM e pelo Ultrassom.
                </p>
                <p className="text-xs text-amber-800">
                  ⚠️ Diferenças maiores que 5 dias podem indicar:
                </p>
                <ul className="text-xs text-amber-800 mt-1 ml-4 list-disc space-y-1">
                  <li>DUM incerta ou incorreta</li>
                  <li>Necessidade de revisar os dados do ultrassom</li>
                  <li>Variação normal no desenvolvimento fetal</li>
                </ul>
                <p className="text-xs text-amber-700 mt-3 font-medium">
                  💡 Recomenda-se revisar os dados e, se necessário, considerar a IG pelo Ultrassom como referência principal.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Cálculos em Tempo Real */}
        {(calculosEmTempoReal.igDUM || calculosEmTempoReal.igUS) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Baby className="h-5 w-5" />
                Cálculos em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cálculos pela DUM */}
                {tipoDUM === "data" && calculosEmTempoReal.igDUM && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Pela DUM
                    </h4>
                    <div className="bg-white rounded-lg p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">IG Atual:</span>
                        <span className="font-semibold text-blue-900">
                          {calculosEmTempoReal.igDUM.semanas}s {calculosEmTempoReal.igDUM.dias}d
                        </span>
                      </div>
                      {calculosEmTempoReal.dppDUM && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">DPP:</span>
                          <span className="font-semibold text-blue-900">{calculosEmTempoReal.dppDUM}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cálculos pelo Ultrassom */}
                {calculosEmTempoReal.igUS && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Pelo Ultrassom
                    </h4>
                    <div className="bg-white rounded-lg p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">IG Atual:</span>
                        <span className="font-semibold text-blue-900">
                          {calculosEmTempoReal.igUS.semanas}s {calculosEmTempoReal.igUS.dias}d
                        </span>
                      </div>
                      {calculosEmTempoReal.dppUS && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">DPP:</span>
                          <span className="font-semibold text-blue-900">{calculosEmTempoReal.dppUS}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-blue-700 mt-3">
                💡 Estes cálculos são atualizados automaticamente conforme você preenche os campos acima
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Data Planejada e Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="dataPartoProgramado">Data Planejada para a Cesárea</Label>
                {dataCesareaConfirmada && formData.dataPartoProgramado && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    Sincronizará com Mapa Cirúrgico ao salvar
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  id="dataPartoProgramado"
                  type="date"
                  value={dataCesareaLocal}
                  onChange={(e) => {
                    const novaData = e.target.value;
                    setDataCesareaLocal(novaData);
                    // Se a data mudou, marcar como não confirmada
                    if (novaData !== formData.dataPartoProgramado) {
                      setDataCesareaConfirmada(false);
                    }
                    // Limpar alerta ao mudar data
                    setAlertaDataCesarea({ show: false, tipo: null, igNaData: null, acknowledged: false });
                  }}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const novaData = dataCesareaLocal;
                    
                    // Se a data foi limpa, remover agendamento
                    if (!novaData) {
                      setFormData(prev => ({
                        ...prev,
                        dataPartoProgramado: '',
                      }));
                      setAlertaDataCesarea({ show: false, tipo: null, igNaData: null, acknowledged: false });
                      setDataCesareaConfirmada(false);
                      toast.success('Agendamento de cesárea removido.');
                      return;
                    }
                    
                    // Usar utilitário compartilhado para validar
                    const dadosRef: DadosReferencia = {
                      dataUltrassom: formData.dataUltrassom || undefined,
                      igUltrassomSemanas: formData.igUltrassomSemanas ? parseInt(formData.igUltrassomSemanas) : undefined,
                      igUltrassomDias: formData.igUltrassomDias ? parseInt(formData.igUltrassomDias) : undefined,
                      dum: tipoDUM === "data" ? (formData.dum || undefined) : undefined,
                    };
                    
                    const resultado = validarDataCesarea(novaData, dadosRef);
                    
                    if (resultado.classificacao !== 'normal') {
                      setConfirmacaoDataCesarea({
                        open: true,
                        tipo: resultado.classificacao,
                        igNaData: resultado.igNaData
                      });
                      return;
                    }
                    
                    // Data dentro do período normal: confirmar
                    setFormData(prev => ({
                      ...prev,
                      dataPartoProgramado: novaData,
                      tipoPartoDesejado: "cesariana",
                    }));
                    setDataCesareaConfirmada(true);
                    setAlertaDataCesarea({ show: false, tipo: null, igNaData: null, acknowledged: false });
                    toast.success('Cesárea agendada!', {
                      description: `Data: ${novaData.split('-').reverse().join('/')}. Será sincronizada com o Mapa Cirúrgico ao salvar.`,
                    });
                  }}
                  disabled={dataCesareaConfirmada && dataCesareaLocal === formData.dataPartoProgramado}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CalendarCheck className="h-4 w-4 mr-1" />
                  {formData.dataPartoProgramado && dataCesareaConfirmada ? 'Reagendar' : 'Agendar'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Para cesáreas eletivas ou partos programados</p>
              {dataCesareaConfirmada && formData.dataPartoProgramado && (
                <p className="text-sm text-muted-foreground">
                  Data agendada: {formData.dataPartoProgramado.split('-').reverse().join('/')}
                  {dataCesareaLocal !== formData.dataPartoProgramado && dataCesareaLocal && (
                    <span className="ml-2 text-orange-600 font-medium">
                      (clique em "Reagendar" para confirmar a nova data)
                    </span>
                  )}
                </p>
              )}
              {!dataCesareaConfirmada && dataCesareaLocal && (
                <p className="text-sm text-orange-600 font-medium">
                  Clique em "Agendar" para confirmar a data da cesárea.
                </p>
              )}
              
              {alertaDataCesarea.show && alertaDataCesarea.igNaData && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  alertaDataCesarea.tipo === 'pre-termo' 
                    ? 'bg-orange-50 border-orange-300 text-orange-900' 
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      alertaDataCesarea.tipo === 'pre-termo' ? 'text-orange-600' : 'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {alertaDataCesarea.tipo === 'pre-termo' 
                          ? 'Cesárea agendada antes de 37 semanas (pré-termo)' 
                          : 'Cesárea agendada com 40 semanas ou mais (pós-termo)'}
                      </p>
                      <p className="text-xs mt-1">
                        IG estimada na data: {alertaDataCesarea.igNaData.semanas}s{alertaDataCesarea.igNaData.dias}d
                      </p>
                      <p className="text-xs mt-1">
                        {alertaDataCesarea.tipo === 'pre-termo' 
                          ? 'Cesáreas eletivas são recomendadas a partir de 37 semanas completas.' 
                          : 'Gestações com 40 semanas ou mais requerem avaliação rigorosa e monitoramento intensivo.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {dataCesareaConfirmada && formData.dataPartoProgramado && (
              <div className="space-y-2">
                <Label htmlFor="motivoCesarea">Motivo da Indicação da Cesárea</Label>
                <Select
                  value={formData.motivoCesarea}
                  onValueChange={(value) => setFormData({ ...formData, motivoCesarea: value })}
                >
                  <SelectTrigger id="motivoCesarea">
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
                <p className="text-sm text-muted-foreground">Selecione a indicação médica para a cesárea</p>
                
                {formData.motivoCesarea === "Outro" && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="motivoCesareaOutro">Especifique o motivo</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({ ...formData, motivoCesareaOutro: motivoCesareaOutroLocal });
                          toast.success("Motivo salvo com sucesso!");
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
              value={formData.hospitalParto}
              onValueChange={(v: string) => setFormData({ ...formData, hospitalParto: v })}
              label="Hospital do Parto"
              className="mt-0"
            />
          </CardContent>
        </Card>

        {/* Fatores de Risco - apenas para edição */}
        {gestanteId && (
          <FatoresRiscoManager 
            gestanteId={gestanteId} 
            idadeGestante={
              formData.dataNascimento ? 
                Math.floor((new Date().getTime() - new Date(formData.dataNascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : null
            }
            imcGestante={
              formData.altura && formData.pesoInicial ?
                parseFloat(formData.pesoInicial) / Math.pow(parseFloat(formData.altura) / 100, 2)
                : null
            }
          />
        )}

        <Card className={formData.sexoBebe === "masculino" ? "border-l-4 border-l-blue-400" : formData.sexoBebe === "feminino" ? "border-l-4 border-l-pink-400" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {formData.sexoBebe === "masculino" ? (
                <Baby className="h-5 w-5 text-blue-500" />
              ) : formData.sexoBebe === "feminino" ? (
                <Baby className="h-5 w-5 text-pink-500" />
              ) : (
                <Baby className="h-5 w-5" />
              )}
              <span>Dados do Bebê</span>
              {formData.sexoBebe === "masculino" && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  ♂ Menino
                </span>
              )}
              {formData.sexoBebe === "feminino" && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-700">
                  ♀ Menina
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeBebe">Nome planejado para o bebê (opcional)</Label>
                <Input
                  id="nomeBebe"
                  placeholder="Ex: Maria, João, etc."
                  value={formData.nomeBebe}
                  onChange={(e) => setFormData({ ...formData, nomeBebe: e.target.value })}
                  className={formData.sexoBebe === "masculino" ? "border-blue-300 focus:ring-blue-400" : formData.sexoBebe === "feminino" ? "border-pink-300 focus:ring-pink-400" : ""}
                />
                {formData.nomeBebe && (
                  <p className={`text-sm ${formData.sexoBebe === "masculino" ? "text-blue-600" : formData.sexoBebe === "feminino" ? "text-pink-600" : "text-muted-foreground"}`}>
                    Nome escolhido: <span className="font-medium">{formData.nomeBebe}</span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexoBebe">Sexo do bebê</Label>
                <Select
                  value={formData.sexoBebe}
                  onValueChange={(value) => setFormData({ ...formData, sexoBebe: value })}
                >
                  <SelectTrigger id="sexoBebe" className={formData.sexoBebe === "masculino" ? "border-blue-300 focus:ring-blue-400" : formData.sexoBebe === "feminino" ? "border-pink-300 focus:ring-pink-400" : ""}>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Anotações adicionais sobre a gestante"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitConfirmation(true);
              } else {
                onCancel();
              }
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
      
      {/* Modal de confirmação ao sair */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Deseja sair sem salvar?</h3>
            <p className="text-muted-foreground mb-6">
              Você tem alterações não salvas. Se sair agora, essas alterações serão perdidas.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowExitConfirmation(false)}
              >
                Continuar editando
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowExitConfirmation(false);
                  onCancel();
                }}
              >
                Sair sem salvar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de iniciar consulta */}
      {showStartConsultaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Iniciar consulta?</h3>
            
            {/* Informações da Gestante */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <Baby className="h-5 w-5 text-[#722F37]" />
                <span className="font-semibold text-lg">{createdGestanteName}</span>
              </div>
              
              {/* Idade Gestacional */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">IG (DUM):</span>
                  <span className="ml-2 font-medium">
                    {calculosEmTempoReal.igDUM 
                      ? `${calculosEmTempoReal.igDUM.semanas}s ${calculosEmTempoReal.igDUM.dias}d`
                      : tipoDUM === "incerta" ? "DUM Incerta" : tipoDUM === "incompativel" ? "DUM Incompatível" : "Não informada"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IG (US):</span>
                  <span className="ml-2 font-medium">
                    {calculosEmTempoReal.igUS 
                      ? `${calculosEmTempoReal.igUS.semanas}s ${calculosEmTempoReal.igUS.dias}d`
                      : "Não informada"}
                  </span>
                </div>
              </div>
              
              {/* DPP */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">DPP (DUM):</span>
                  <span className="ml-2 font-medium">
                    {calculosEmTempoReal.dppDUM || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">DPP (US):</span>
                  <span className="ml-2 font-medium">
                    {calculosEmTempoReal.dppUS || "-"}
                  </span>
                </div>
              </div>
              
              {/* História Obstétrica */}
              <div className="border-t pt-3 mt-3">
                <span className="text-muted-foreground text-sm">História Obstétrica:</span>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="bg-[#722F37]/10 text-[#722F37] px-2 py-1 rounded text-sm font-medium">
                    G{formData.gesta || "0"}
                  </span>
                  <span className="bg-[#722F37]/10 text-[#722F37] px-2 py-1 rounded text-sm font-medium">
                    P{formData.para || "0"}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                    PN: {formData.partosNormais || "0"}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                    PC: {formData.cesareas || "0"}
                  </span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm">
                    A: {formData.abortos || "0"}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4 text-sm">
              Deseja iniciar uma consulta agora?
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStartConsultaModal(false);
                  // Não precisa chamar onSuccess aqui pois já foi chamado no createMutation.onSuccess
                }}
              >
                Não, voltar
              </Button>
              <Button
                onClick={() => {
                  setShowStartConsultaModal(false);
                  // Navegar para página de consultas com gestante selecionada
                  setLocation(`/cartao-prenatal?gestanteId=${createdGestanteId}&novaConsulta=true&skipInfoModal=true`);
                }}
              >
                Sim, iniciar consulta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    
    {/* Diálogo de confirmação para data de cesárea fora do período recomendado */}
    <AlertDialog open={confirmacaoDataCesarea.open} onOpenChange={(open) => {
      if (!open) setConfirmacaoDataCesarea({ open: false, tipo: null, igNaData: null });
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
                    A data selecionada ({dataCesareaLocal.split('-').reverse().join('/')}) já passou.
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
              // Salvar a data após confirmação
              setFormData(prev => ({
                ...prev,
                dataPartoProgramado: dataCesareaLocal,
                tipoPartoDesejado: "cesariana",
              }));
              setDataCesareaConfirmada(true);
              // Mostrar alerta persistente
              if (confirmacaoDataCesarea.tipo !== 'passado' && confirmacaoDataCesarea.igNaData) {
                setAlertaDataCesarea({
                  show: true,
                  tipo: confirmacaoDataCesarea.tipo as 'pre-termo' | 'pos-termo',
                  igNaData: confirmacaoDataCesarea.igNaData,
                  acknowledged: true
                });
              }
              setConfirmacaoDataCesarea({ open: false, tipo: null, igNaData: null });
              toast.warning('Cesárea agendada com aviso', {
                description: confirmacaoDataCesarea.tipo === 'passado' 
                  ? `Data ${dataCesareaLocal.split('-').reverse().join('/')} está no passado. Será sincronizada ao salvar.`
                  : `Cesárea agendada fora do período recomendado (${confirmacaoDataCesarea.tipo}). Será sincronizada ao salvar.`,
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
