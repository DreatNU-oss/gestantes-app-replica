import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputComHistorico } from "@/components/InputComHistorico";
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Syringe,
  Stethoscope,
  TestTube,
  Baby,
  Heart,
  Calendar,
  FileText,
  Upload,
  X,
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  PenLine,
  ChevronRight,
  AlertTriangle,
  Pill,
} from 'lucide-react';

// ─── Template Suggestions ───────────────────────────────────────────────────

interface TemplateSuggestion {
  id: string;
  categoria: string;
  icon: typeof Syringe;
  iconColor: string;
  bgColor: string;
  nome: string;
  descricao: string;
  gatilhoTipo: 'idade_gestacional' | 'evento' | 'manual' | 'pos_consulta_conduta';
  igSemanas?: number;
  igDias?: number;
  evento?: string;
  condicaoRhNegativo?: boolean;
  condicaoMedicamento?: string;
  condutaGatilho?: string;
  diasAposConsulta?: number;
  mensagem: string;
}

const TEMPLATE_SUGGESTIONS: TemplateSuggestion[] = [
  // Vacinas
  {
    id: 'vacina_dtpa',
    categoria: 'Vacinas',
    icon: Syringe,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    nome: 'Lembrete Vacina dTpa',
    descricao: 'Vacina dTpa (tríplice bacteriana) recomendada entre 27-36 semanas',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 27,
    igDias: 0,
    mensagem: `Olá, {nome}! 💉

Você está com {ig_semanas} semanas de gestação e chegou o momento de tomar a vacina *dTpa (tríplice bacteriana acelular)*.

Esta vacina protege você e seu bebê contra *difteria, tétano e coqueluche*. É recomendada entre a 27ª e 36ª semana de gestação.

📍 Procure a Unidade Básica de Saúde mais próxima ou a clínica de vacinação de sua preferência.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'vacina_influenza',
    categoria: 'Vacinas',
    icon: Syringe,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    nome: 'Lembrete Vacina Influenza',
    descricao: 'Vacina contra gripe, recomendada durante a gestação',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 14,
    igDias: 0,
    mensagem: `Olá, {nome}! 💉

Você está com {ig_semanas} semanas de gestação. Lembramos que a vacina contra *Influenza (gripe)* é recomendada durante a gestação.

A vacina é segura e protege tanto a mãe quanto o bebê nos primeiros meses de vida.

📍 Procure a Unidade Básica de Saúde mais próxima.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'vacina_hepatite_b',
    categoria: 'Vacinas',
    icon: Syringe,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    nome: 'Lembrete Vacina Hepatite B',
    descricao: 'Completar esquema vacinal de Hepatite B se necessário',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 12,
    igDias: 0,
    mensagem: `Olá, {nome}! 💉

Você está com {ig_semanas} semanas de gestação. Caso seu esquema vacinal contra *Hepatite B* esteja incompleto, este é um bom momento para atualizá-lo.

A vacina é segura durante a gestação e protege você e seu bebê.

📍 Procure a Unidade Básica de Saúde mais próxima com sua caderneta de vacinação.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'vacina_anti_rh',
    categoria: 'Vacinas',
    icon: Syringe,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
    nome: 'Vacina Anti-Rh (Imunoglobulina)',
    descricao: 'Apenas para gestantes Rh negativo, às 28 semanas',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 28,
    igDias: 0,
    condicaoRhNegativo: true,
    mensagem: `Olá, {nome}! ⚠️💉

Você está com {ig_semanas} semanas de gestação. Como seu tipo sanguíneo é *Rh negativo*, é muito importante que você receba a *Imunoglobulina Anti-Rh* nesta fase da gestação.

Esta vacina previne a *sensibilização Rh*, protegendo seu bebê atual e futuras gestações.

📍 Agende com {medico} para receber a imunoglobulina o mais breve possível.
📞 Telefone: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  // Consultas e Exames
  {
    id: 'exames_1tri',
    categoria: 'Exames',
    icon: TestTube,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    nome: 'Lembrete Exames 1º Trimestre',
    descricao: 'Exames laboratoriais do primeiro trimestre',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 8,
    igDias: 0,
    mensagem: `Olá, {nome}! 🔬

Você está com {ig_semanas} semanas de gestação. É hora de realizar os *exames laboratoriais do 1º trimestre*:

• Hemograma completo
• Tipagem sanguínea ABO/Rh
• Glicemia de jejum
• Sorologias (HIV, Sífilis, Hepatites, Toxoplasmose, Rubéola, CMV)
• EAS e Urocultura
• TSH

📋 Leve o pedido de exames na próxima consulta ou retire na recepção.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'exames_2tri',
    categoria: 'Exames',
    icon: TestTube,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    nome: 'Lembrete Exames 2º Trimestre',
    descricao: 'Exames laboratoriais do segundo trimestre + TOTG',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 24,
    igDias: 0,
    mensagem: `Olá, {nome}! 🔬

Você está com {ig_semanas} semanas de gestação. É hora de realizar os *exames do 2º trimestre*, incluindo:

• TOTG (Teste Oral de Tolerância à Glicose) - 75g
• Hemograma
• Sorologias de controle
• EAS e Urocultura

⚠️ Para o TOTG, é necessário *jejum de 8-14 horas*. O exame leva cerca de 2 horas.

📋 Leve o pedido de exames na próxima consulta.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'exames_3tri',
    categoria: 'Exames',
    icon: TestTube,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    nome: 'Lembrete Exames 3º Trimestre',
    descricao: 'Exames laboratoriais do terceiro trimestre + EGB',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 35,
    igDias: 0,
    mensagem: `Olá, {nome}! 🔬

Você está com {ig_semanas} semanas de gestação. É hora de realizar os *exames do 3º trimestre*:

• Hemograma
• Sorologias de controle (HIV, Sífilis, Hepatites)
• EAS e Urocultura
• Swab vaginal/retal para EGB (Estreptococo do Grupo B)

📋 Leve o pedido de exames na próxima consulta.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'ultrassom_morfologico',
    categoria: 'Exames',
    icon: Stethoscope,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    nome: 'Lembrete Ultrassom Morfológico',
    descricao: 'Ultrassom morfológico entre 20-24 semanas',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 20,
    igDias: 0,
    mensagem: `Olá, {nome}! 🏥

Você está com {ig_semanas} semanas de gestação. Este é o período ideal para realizar o *Ultrassom Morfológico do 2º trimestre* (entre 20-24 semanas).

Este exame avalia detalhadamente a anatomia do bebê e é muito importante para o acompanhamento da gestação.

📍 Agende o exame o mais breve possível.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  // Consultas
  {
    id: 'consulta_primeira',
    categoria: 'Consultas',
    icon: Calendar,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
    nome: 'Boas-vindas ao Pré-Natal',
    descricao: 'Mensagem de boas-vindas após cadastro da gestante',
    gatilhoTipo: 'evento',
    evento: 'cadastro_gestante',
    mensagem: `Olá, {nome}! 🤰✨

Seja muito bem-vinda ao nosso acompanhamento de pré-natal!

Estamos felizes em cuidar de você e do seu bebê durante essa jornada tão especial. Sua data provável de parto é *{dpp}*.

📋 Algumas orientações iniciais:
• Inicie o ácido fólico conforme orientação médica
• Mantenha uma alimentação saudável e equilibrada
• Beba bastante água
• Traga seus exames anteriores na próxima consulta

Seu médico responsável é {medico}.
📞 Em caso de dúvidas: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'consulta_retorno',
    categoria: 'Consultas',
    icon: Calendar,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200 hover:bg-green-100',
    nome: 'Lembrete de Retorno Mensal',
    descricao: 'Lembrete para agendar consulta de retorno',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 16,
    igDias: 0,
    mensagem: `Olá, {nome}! 📅

Você está com {ig_semanas} semanas de gestação. Lembre-se de agendar sua próxima consulta de pré-natal.

As consultas devem ser realizadas:
• Mensalmente até 28 semanas
• Quinzenalmente de 28 a 36 semanas
• Semanalmente a partir de 36 semanas

📞 Agende pelo telefone ou na recepção da clínica.

Em caso de dúvidas, entre em contato com {medico}.

Atenciosamente,
Equipe de Pré-Natal`,
  },
  // Pós-parto
  {
    id: 'pos_cesarea',
    categoria: 'Pós-Parto',
    icon: Baby,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    nome: 'Orientações Pós-Cesárea',
    descricao: 'Cuidados e orientações após cesárea',
    gatilhoTipo: 'evento',
    evento: 'pos_cesarea',
    mensagem: `Olá, {nome}! 👶💕

Parabéns pelo nascimento do seu bebê! Seguem algumas orientações importantes para o pós-operatório da cesárea:

🩹 *Cuidados com a cicatriz:*
• Mantenha a incisão limpa e seca
• Evite esforços físicos por 40 dias
• Não carregue peso acima de 5kg

🤱 *Amamentação:*
• Amamente em livre demanda
• Use travesseiro para apoiar o bebê e proteger a cicatriz

📅 *Retorno:*
• Agende sua consulta de revisão em 7-10 dias
• Consulta puerperal em 42 dias

📞 Em caso de febre, sangramento ou dor intensa, entre em contato imediatamente com {medico}: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'pos_parto_normal',
    categoria: 'Pós-Parto',
    icon: Baby,
    iconColor: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    nome: 'Orientações Pós-Parto Normal',
    descricao: 'Cuidados e orientações após parto normal',
    gatilhoTipo: 'evento',
    evento: 'pos_parto_normal',
    mensagem: `Olá, {nome}! 👶💕

Parabéns pelo nascimento do seu bebê! Seguem algumas orientações para o pós-parto:

🤱 *Amamentação:*
• Amamente em livre demanda (sempre que o bebê pedir)
• Procure ajuda se sentir dificuldades

🩺 *Cuidados:*
• Repouso relativo nos primeiros dias
• Higiene íntima com água e sabão neutro
• Atenção ao sangramento (lóquios) - é normal nos primeiros dias

📅 *Retorno:*
• Consulta puerperal em 42 dias

📞 Em caso de febre, sangramento intenso ou dor, entre em contato com {medico}: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  // Alertas
  {
    id: 'sinais_alerta',
    categoria: 'Alertas',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    nome: 'Sinais de Alerta na Gestação',
    descricao: 'Informações sobre sinais de alerta durante a gestação',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 20,
    igDias: 0,
    mensagem: `Olá, {nome}! ⚠️

Você está com {ig_semanas} semanas de gestação. É importante conhecer os *sinais de alerta* que exigem atendimento médico imediato:

🚨 *Procure atendimento se apresentar:*
• Sangramento vaginal
• Perda de líquido pela vagina
• Dor abdominal intensa
• Febre acima de 37,8°C
• Dor de cabeça forte e persistente
• Visão turva ou embaçada
• Inchaço súbito de rosto e mãos
• Diminuição dos movimentos do bebê
• Contrações regulares antes de 37 semanas

📞 Emergência: entre em contato com {medico}: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  {
    id: 'preparacao_parto',
    categoria: 'Alertas',
    icon: Heart,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    nome: 'Preparação para o Parto',
    descricao: 'Orientações de preparação para o parto a partir de 36 semanas',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 36,
    igDias: 0,
    mensagem: `Olá, {nome}! 🏥

Você está com {ig_semanas} semanas de gestação e se aproximando do momento do parto! Sua DPP é *{dpp}*.

📋 *Prepare-se:*
• Monte a mala da maternidade (sua e do bebê)
• Tenha os documentos em mãos (RG, cartão SUS, cartão de pré-natal)
• Defina o acompanhante para o parto
• Conheça o caminho até a maternidade

🤰 *Sinais de trabalho de parto:*
• Contrações regulares (a cada 5 minutos por 1 hora)
• Perda do tampão mucoso
• Ruptura da bolsa amniótica

📞 Quando iniciar trabalho de parto, entre em contato com {medico}: {telefone_medico}

Atenciosamente,
Equipe de Pré-Natal`,
  },
  // Pós-Consulta
  {
    id: 'lembrete_rotina_lab_1tri',
    categoria: 'Pós-Consulta',
    icon: TestTube,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    nome: 'Lembrete Colher Exames 1º Trimestre',
    descricao: 'Lembrete 14 dias após solicitar Rotina Lab 1º Trim na consulta',
    gatilhoTipo: 'pos_consulta_conduta' as any,
    condutaGatilho: 'Rotina Laboratorial 1º Trimestre',
    diasAposConsulta: 14,
    mensagem: `Olá, {nome}! 🔬\n\nNa sua última consulta de pré-natal, foram solicitados os *exames laboratoriais de rotina do 1º trimestre*.\n\nEste é um lembrete para que você colha os exames o mais breve possível e leve os resultados na próxima consulta de pré-natal.\n\n📋 Caso ainda não tenha colhido, procure o laboratório com o pedido de exames em mãos.\n\nEm caso de dúvidas, entre em contato com {medico}.\n\nAtenciosamente,\nEquipe de Pré-Natal`,
  },
  {
    id: 'lembrete_rotina_lab_2tri',
    categoria: 'Pós-Consulta',
    icon: TestTube,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    nome: 'Lembrete Colher Exames 2º Trimestre',
    descricao: 'Lembrete 14 dias após solicitar Rotina Lab 2º Trim na consulta',
    gatilhoTipo: 'pos_consulta_conduta' as any,
    condutaGatilho: 'Rotina Laboratorial 2º Trimestre',
    diasAposConsulta: 14,
    mensagem: `Olá, {nome}! 🔬\n\nNa sua última consulta de pré-natal, foram solicitados os *exames laboratoriais de rotina do 2º trimestre*.\n\nEste é um lembrete para que você colha os exames o mais breve possível e leve os resultados na próxima consulta de pré-natal.\n\n📋 Caso ainda não tenha colhido, procure o laboratório com o pedido de exames em mãos.\n\nEm caso de dúvidas, entre em contato com {medico}.\n\nAtenciosamente,\nEquipe de Pré-Natal`,
  },
  {
    id: 'lembrete_rotina_lab_3tri',
    categoria: 'Pós-Consulta',
    icon: TestTube,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    nome: 'Lembrete Colher Exames 3º Trimestre',
    descricao: 'Lembrete 14 dias após solicitar Rotina Lab 3º Trim na consulta',
    gatilhoTipo: 'pos_consulta_conduta' as any,
    condutaGatilho: 'Rotina Laboratorial 3º Trimestre',
    diasAposConsulta: 14,
    mensagem: `Olá, {nome}! 🔬\n\nNa sua última consulta de pré-natal, foram solicitados os *exames laboratoriais de rotina do 3º trimestre*.\n\nEste é um lembrete para que você colha os exames o mais breve possível e leve os resultados na próxima consulta de pré-natal.\n\n📋 Caso ainda não tenha colhido, procure o laboratório com o pedido de exames em mãos.\n\nEm caso de dúvidas, entre em contato com {medico}.\n\nAtenciosamente,\nEquipe de Pré-Natal`,
  },
  // Medicamentos
  {
    id: 'suspensao_aas',
    categoria: 'Medicamentos',
    icon: Pill,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    nome: 'Suspensão do AAS (35s6d)',
    descricao: 'Aviso de suspensão do AAS para gestantes que fazem uso, às 35 semanas e 6 dias',
    gatilhoTipo: 'idade_gestacional',
    igSemanas: 35,
    igDias: 6,
    condicaoMedicamento: 'aas',
    mensagem: `Olá {nome}! 🤰

Informamos que hoje, com *35 semanas e 6 dias* de gestação, é o *último dia de uso do AAS (Ácido Acetilsalicílico)*.

A partir de amanhã (36 semanas), o AAS deve ser *suspenso*.

Quanto ao *Cálcio*, você pode continuar tomando até acabar a caixa de medicamentos.

Em caso de dúvidas, converse com seu médico na próxima consulta.

Abraços da equipe Mais Mulher! 💜`,
  },
];

// Group suggestions by category
const CATEGORIAS = ['Vacinas', 'Exames', 'Consultas', 'Pós-Consulta', 'Medicamentos', 'Pós-Parto', 'Alertas'];

const CATEGORIA_ICONS: Record<string, { icon: typeof Syringe; color: string }> = {
  'Vacinas': { icon: Syringe, color: 'text-blue-600' },
  'Exames': { icon: TestTube, color: 'text-purple-600' },
  'Consultas': { icon: Calendar, color: 'text-green-600' },
  'Pós-Parto': { icon: Baby, color: 'text-pink-600' },
  'Alertas': { icon: AlertTriangle, color: 'text-amber-600' },
  'Pós-Consulta': { icon: FileText, color: 'text-teal-600' },
  'Medicamentos': { icon: Pill, color: 'text-orange-600' },
};

const EVENTO_LABELS: Record<string, string> = {
  pos_cesarea: 'Pós-Cesárea',
  pos_parto_normal: 'Pós-Parto Normal',
  cadastro_gestante: 'Cadastro de Gestante',
  primeira_consulta: 'Primeira Consulta',
};

// ─── Wizard Component ───────────────────────────────────────────────────────

interface TemplateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    nome: string;
    mensagem: string;
    gatilhoTipo: 'idade_gestacional' | 'evento' | 'manual' | 'pos_consulta_conduta';
    igSemanas?: number;
    igDias?: number;
    evento?: string;
    pdfUrl?: string;
    pdfKey?: string;
    pdfNome?: string;
    condicaoRhNegativo?: number;
    condicaoMedicamento?: string;
    condutaGatilho?: string;
    diasAposConsulta?: number;
  }) => void;
  onUploadPdf: (file: File) => Promise<{ url: string; key: string }>;
  isSaving: boolean;
  uploadingPdf: boolean;
}

export default function TemplateWizard({
  open,
  onOpenChange,
  onSave,
  onUploadPdf,
  isSaving,
  uploadingPdf,
}: TemplateWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TemplateSuggestion | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [gatilhoTipo, setGatilhoTipo] = useState<'idade_gestacional' | 'evento' | 'manual' | 'pos_consulta_conduta'>('manual');
  const [condutaGatilho, setCondutaGatilho] = useState<string>('');
  const [diasAposConsulta, setDiasAposConsulta] = useState<number>(14);
  const [igSemanas, setIgSemanas] = useState<number | undefined>();
  const [igDias, setIgDias] = useState<number>(0);
  const [evento, setEvento] = useState<string>('');
  const [condicaoRhNegativo, setCondicaoRhNegativo] = useState(false);
  const [condicaoMedicamento, setCondicaoMedicamento] = useState<string | undefined>();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [pdfKey, setPdfKey] = useState<string>();
  const [pdfNome, setPdfNome] = useState<string>();

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  const resetWizard = () => {
    setStep(1);
    setSelectedSuggestion(null);
    setIsCustom(false);
    setExpandedCategoria(null);
    setNome('');
    setMensagem('');
    setGatilhoTipo('manual');
    setIgSemanas(undefined);
    setIgDias(0);
    setEvento('');
    setCondutaGatilho('');
    setDiasAposConsulta(14);
    setCondicaoRhNegativo(false);
    setCondicaoMedicamento(undefined);
    setPdfUrl(undefined);
    setPdfKey(undefined);
    setPdfNome(undefined);
    setShowPreview(false);
  };

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
  };

  const handleSelectSuggestion = (suggestion: TemplateSuggestion) => {
    setSelectedSuggestion(suggestion);
    setNome(suggestion.nome);
    setMensagem(suggestion.mensagem);
    setGatilhoTipo(suggestion.gatilhoTipo);
    setIgSemanas(suggestion.igSemanas);
    setIgDias(suggestion.igDias || 0);
    setEvento(suggestion.evento || '');
    setCondicaoRhNegativo(suggestion.condicaoRhNegativo || false);
    setCondicaoMedicamento(suggestion.condicaoMedicamento || undefined);
    setCondutaGatilho(suggestion.condutaGatilho || '');
    setDiasAposConsulta(suggestion.diasAposConsulta || 14);
    setStep(2);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setSelectedSuggestion(null);
    setStep(2);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB.');
      return;
    }
    setPdfNome(file.name);
    try {
      const result = await onUploadPdf(file);
      setPdfUrl(result.url);
      setPdfKey(result.key);
    } catch {
      toast.error('Erro ao enviar PDF.');
    }
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error('Preencha o nome do template.');
      return;
    }
    if (!mensagem.trim()) {
      toast.error('Preencha a mensagem.');
      return;
    }
    if (gatilhoTipo === 'idade_gestacional' && !igSemanas) {
      toast.error('Informe a semana gestacional.');
      return;
    }
    if (gatilhoTipo === 'evento' && !evento) {
      toast.error('Selecione o evento.');
      return;
    }
    if (gatilhoTipo === 'pos_consulta_conduta' && !condutaGatilho) {
      toast.error('Selecione a conduta que dispara o envio.');
      return;
    }

    onSave({
      nome: nome.trim(),
      mensagem: mensagem.trim(),
      gatilhoTipo,
      igSemanas: gatilhoTipo === 'idade_gestacional' ? igSemanas : undefined,
      igDias: gatilhoTipo === 'idade_gestacional' ? igDias : undefined,
      evento: gatilhoTipo === 'evento' ? evento as any : undefined,
      pdfUrl,
      pdfKey,
      pdfNome,
      condicaoRhNegativo: condicaoRhNegativo ? 1 : 0,
      condicaoMedicamento: condicaoMedicamento || undefined,
      condutaGatilho: gatilhoTipo === 'pos_consulta_conduta' ? condutaGatilho : undefined,
      diasAposConsulta: gatilhoTipo === 'pos_consulta_conduta' ? diasAposConsulta : undefined,
    });

    resetWizard();
  };

  const getPreviewMessage = () => {
    let preview = mensagem;
    preview = preview.replace(/\{nome\}/g, 'Maria Silva');
    preview = preview.replace(/\{ig_semanas\}/g, String(igSemanas || 28));
    preview = preview.replace(/\{ig_dias\}/g, String(igDias || 3));
    preview = preview.replace(/\{dpp\}/g, '15/06/2026');
    preview = preview.replace(/\{medico\}/g, 'Dr. João');
    preview = preview.replace(/\{telefone_medico\}/g, '(35) 99999-0000');
    return preview;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            {step === 1 && 'Novo Template - Escolha uma Categoria'}
            {step === 2 && (selectedSuggestion ? `Configurar: ${selectedSuggestion.nome}` : 'Configurar Template Personalizado')}
            {step === 3 && 'Revisar e Confirmar'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Selecione uma sugestão pré-definida ou crie um template personalizado'}
            {step === 2 && 'Ajuste as configurações e personalize a mensagem'}
            {step === 3 && 'Revise todos os detalhes antes de salvar'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-500' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Choose Category ─── */}
        {step === 1 && (
          <div className="space-y-3">
            {CATEGORIAS.map((cat) => {
              const catIcon = CATEGORIA_ICONS[cat];
              const suggestions = TEMPLATE_SUGGESTIONS.filter(s => s.categoria === cat);
              const isExpanded = expandedCategoria === cat;
              const CatIcon = catIcon.icon;

              return (
                <div key={cat} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => setExpandedCategoria(isExpanded ? null : cat)}
                  >
                    <div className={`p-2 rounded-lg bg-muted`}>
                      <CatIcon className={`h-5 w-5 ${catIcon.color}`} />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{cat}</span>
                      <span className="text-xs text-muted-foreground ml-2">({suggestions.length} sugestões)</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/20 p-2 space-y-2">
                      {suggestions.map((suggestion) => {
                        const SugIcon = suggestion.icon;
                        return (
                          <button
                            key={suggestion.id}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${suggestion.bgColor}`}
                            onClick={() => handleSelectSuggestion(suggestion)}
                          >
                            <div className="flex items-start gap-3">
                              <SugIcon className={`h-5 w-5 mt-0.5 ${suggestion.iconColor} shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{suggestion.nome}</span>
                                  {suggestion.condicaoRhNegativo && (
                                    <Badge variant="outline" className="text-xs border-red-400 text-red-700 bg-red-50">Rh-</Badge>
                                  )}
                                  {suggestion.condicaoMedicamento && (
                                    <Badge variant="outline" className="text-xs border-orange-400 text-orange-700 bg-orange-50">{suggestion.condicaoMedicamento.toUpperCase()}</Badge>
                                  )}
                                  {suggestion.gatilhoTipo === 'idade_gestacional' && suggestion.igSemanas && (
                                    <Badge variant="secondary" className="text-xs">{suggestion.igSemanas}ª semana</Badge>
                                  )}
                                  {suggestion.gatilhoTipo === 'evento' && suggestion.evento && (
                                    <Badge variant="secondary" className="text-xs">{EVENTO_LABELS[suggestion.evento]}</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.descricao}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom template option */}
            <button
              className="w-full text-left p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-all"
              onClick={handleSelectCustom}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <PenLine className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-medium">Template Personalizado</span>
                  <p className="text-xs text-muted-foreground">Crie um template do zero com suas próprias configurações</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ─── Step 2: Configure ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Nome do Template</Label>
              <InputComHistorico
                tipo="template_nome"
                placeholder="Ex: Lembrete Vacina DTPa"
                value={nome}
                onChange={(v) => setNome(v)}
              />
            </div>

            <div>
              <Label>Tipo de Gatilho</Label>
              <Select
                value={gatilhoTipo}
                onValueChange={(v) => setGatilhoTipo(v as typeof gatilhoTipo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idade_gestacional">Por Idade Gestacional</SelectItem>
                  <SelectItem value="evento">Por Evento</SelectItem>
                  <SelectItem value="pos_consulta_conduta">Pós-Consulta (por Conduta)</SelectItem>
                  <SelectItem value="manual">Envio Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gatilhoTipo === 'idade_gestacional' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Semana</Label>
                  <InputComHistorico
                    tipo="template_igsemanas"
                    min={1}
                    max={45}
                    placeholder="Ex: 28"
                    value={String(igSemanas || '')}
                    onChange={(v) => setIgSemanas(parseInt(v) || undefined)}
                  />
                </div>
                <div className="w-24">
                  <Label>Dias</Label>
                  <InputComHistorico
                    tipo="template_igdias"
                    min={0}
                    max={6}
                    placeholder="0"
                    value={String(igDias || '')}
                    onChange={(v) => setIgDias(parseInt(v) || 0)}
                  />
                </div>
              </div>
            )}

            {gatilhoTipo === 'evento' && (
              <div>
                <Label>Evento</Label>
                <Select value={evento} onValueChange={setEvento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pos_cesarea">Pós-Cesárea</SelectItem>
                    <SelectItem value="pos_parto_normal">Pós-Parto Normal</SelectItem>
                    <SelectItem value="cadastro_gestante">Cadastro de Gestante</SelectItem>
                    <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {gatilhoTipo === 'pos_consulta_conduta' && (
              <div className="space-y-3">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800 font-medium mb-2">
                    A mensagem será agendada automaticamente quando a conduta selecionada for marcada em uma consulta.
                  </p>
                </div>
                <div>
                  <Label>Conduta que dispara o envio</Label>
                  <Select value={condutaGatilho} onValueChange={setCondutaGatilho}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conduta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rotina Laboratorial 1º Trimestre">Rotina Laboratorial 1º Trimestre</SelectItem>
                      <SelectItem value="Rotina Laboratorial 2º Trimestre">Rotina Laboratorial 2º Trimestre</SelectItem>
                      <SelectItem value="Rotina Laboratorial 3º Trimestre">Rotina Laboratorial 3º Trimestre</SelectItem>
                      <SelectItem value="Outros Exames Laboratoriais Específicos">Outros Exames Laboratoriais Específicos</SelectItem>
                      <SelectItem value="US Obstétrico Endovaginal">US Obstétrico Endovaginal</SelectItem>
                      <SelectItem value="US Morfológico 1º Trimestre">US Morfológico 1º Trimestre</SelectItem>
                      <SelectItem value="US Morfológico 2º Trimestre">US Morfológico 2º Trimestre</SelectItem>
                      <SelectItem value="US Obstétrico com Doppler">US Obstétrico com Doppler</SelectItem>
                      <SelectItem value="Ecocardiograma Fetal">Ecocardiograma Fetal</SelectItem>
                      <SelectItem value="Colhido Cultura para EGB">Colhido Cultura para EGB</SelectItem>
                      <SelectItem value="Vacinas (Prescrevo ou Oriento)">Vacinas (Prescrevo ou Oriento)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dias após a consulta para enviar</Label>
                  <InputComHistorico
                    tipo="template_diasaposconsulta"
                    min={1}
                    max={90}
                    placeholder="Ex: 14"
                    value={String(diasAposConsulta)}
                    onChange={(v) => setDiasAposConsulta(parseInt(v) || 14)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">A mensagem será enviada {diasAposConsulta} dia(s) após a consulta.</p>
                </div>
              </div>
            )}

            {/* Condição Rh Negativo */}
            {gatilhoTipo === 'idade_gestacional' && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="wizardRhNeg"
                  checked={condicaoRhNegativo}
                  onChange={e => setCondicaoRhNegativo(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="wizardRhNeg" className="text-sm font-medium text-amber-800 cursor-pointer">
                  Enviar apenas para gestantes com Rh negativo
                </label>
              </div>
            )}

            {/* Condição Medicamento */}
            {gatilhoTipo === 'idade_gestacional' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-orange-600" />
                  <Label className="text-sm font-medium text-orange-800">Condição: Medicamento em uso</Label>
                </div>
                <Select value={condicaoMedicamento || 'nenhum'} onValueChange={v => setCondicaoMedicamento(v === 'nenhum' ? undefined : v)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Sem filtro de medicamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem filtro (todas as gestantes)</SelectItem>
                    <SelectItem value="aas">AAS (Ácido Acetilsalicílico)</SelectItem>
                    <SelectItem value="calcio">Cálcio</SelectItem>
                    <SelectItem value="anti_hipertensivos">Anti-hipertensivos</SelectItem>
                    <SelectItem value="enoxaparina">Enoxaparina</SelectItem>
                    <SelectItem value="insulina">Insulina</SelectItem>
                    <SelectItem value="levotiroxina">Levotiroxina</SelectItem>
                    <SelectItem value="medicamentos_inalatorios">Medicamentos Inalatórios</SelectItem>
                    <SelectItem value="polivitaminicos">Polivitamínicos</SelectItem>
                    <SelectItem value="progestagenos">Progestágenos</SelectItem>
                    <SelectItem value="psicotropicos">Psicotrópicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Mensagem</Label>
                {selectedSuggestion && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    Sugerida automaticamente
                  </Badge>
                )}
              </div>
              <Textarea
                placeholder="Olá {nome}! Você está com {ig_semanas} semanas de gestação..."
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Variáveis:</span>
                {['{nome}', '{ig_semanas}', '{ig_dias}', '{dpp}', '{medico}', '{telefone_medico}'].map(v => (
                  <Badge
                    key={v}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-primary/20"
                    onClick={() => setMensagem(prev => prev + ' ' + v)}
                  >
                    {v}
                  </Badge>
                ))}
              </div>
            </div>

            {/* PDF Upload */}
            <div>
              <Label>PDF Anexo (opcional)</Label>
              <div className="mt-1">
                {pdfUrl ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-sm flex-1 truncate">{pdfNome || 'Documento.pdf'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => { setPdfUrl(undefined); setPdfKey(undefined); setPdfNome(undefined); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handlePdfUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPdf}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingPdf ? 'Enviando...' : 'Anexar PDF'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Máximo: 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Review ─── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium text-sm">{nome}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs text-muted-foreground">Gatilho</p>
                  <p className="font-medium text-sm">
                    {gatilhoTipo === 'idade_gestacional' && `IG: ${igSemanas}s${igDias ? `+${igDias}d` : ''}`}
                    {gatilhoTipo === 'evento' && EVENTO_LABELS[evento]}
                    {gatilhoTipo === 'pos_consulta_conduta' && `Pós-Consulta (+${diasAposConsulta}d)`}
                    {gatilhoTipo === 'manual' && 'Envio Manual'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Conditions */}
            <div className="flex flex-wrap gap-2">
              {condicaoRhNegativo && (
                <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">
                  Apenas Rh Negativo
                </Badge>
              )}
              {condicaoMedicamento && (
                <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50 gap-1">
                  <Pill className="h-3 w-3" />
                  Apenas com {condicaoMedicamento.toUpperCase()}
                </Badge>
              )}
              {condutaGatilho && (
                <Badge variant="outline" className="border-teal-400 text-teal-700 bg-teal-50 gap-1">
                  <TestTube className="h-3 w-3" />
                  Conduta: {condutaGatilho}
                </Badge>
              )}
              {pdfUrl && (
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {pdfNome || 'PDF anexo'}
                </Badge>
              )}
              {selectedSuggestion && (
                <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700 bg-amber-50">
                  <Sparkles className="h-3 w-3" />
                  Baseado em sugestão
                </Badge>
              )}
            </div>

            {/* Message preview toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Mensagem</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  {showPreview ? 'Ver código' : 'Pré-visualizar'}
                </Button>
              </div>
              {showPreview ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap font-mono">{mensagem}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Footer Navigation ─── */}
        <DialogFooter className="flex justify-between gap-2 sm:justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            {step === 2 && (
              <Button onClick={() => {
                if (!nome.trim()) { toast.error('Preencha o nome do template.'); return; }
                if (!mensagem.trim()) { toast.error('Preencha a mensagem.'); return; }
                if (gatilhoTipo === 'idade_gestacional' && !igSemanas) { toast.error('Informe a semana gestacional.'); return; }
                if (gatilhoTipo === 'evento' && !evento) { toast.error('Selecione o evento.'); return; }
                setStep(3);
              }} className="gap-1">
                Revisar
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleSave} disabled={isSaving} className="gap-1">
                <Check className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Criar Template'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
