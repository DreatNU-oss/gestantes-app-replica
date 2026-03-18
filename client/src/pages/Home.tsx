import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Baby, Calendar, ClipboardList, FileText, Stethoscope, MessageSquare,
  Brain, Shield, Smartphone, BarChart3, Bell, Users, Heart, Activity,
  ChevronRight, CheckCircle2, Star, ArrowRight, Sparkles, Clock,
  Send, FileBarChart, Pill, Ruler, Weight, Syringe, Building2
} from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: ClipboardList,
      title: "Cadastro Completo de Gestantes",
      description: "Registre todos os dados da paciente: pessoais, obstétricos, plano de saúde, médico responsável, fatores de risco e medicamentos em uso."
    },
    {
      icon: Calendar,
      title: "Cálculo Automático de IG e DPP",
      description: "Idade gestacional calculada automaticamente por DUM e/ou ultrassom, com Data Provável do Parto (DPP) sempre atualizada."
    },
    {
      icon: Stethoscope,
      title: "Consultas Pré-Natais Estruturadas",
      description: "Registro completo de consultas com peso, PA, altura uterina, BCF, queixas, conduta e observações. Suporte a 1ª consulta, rotina e urgência."
    },
    {
      icon: Brain,
      title: "Inteligência Artificial Integrada",
      description: "Interpretação automática de exames laboratoriais e ultrassons por IA. Envie o PDF e os campos são preenchidos automaticamente."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Automatizado",
      description: "Envio automático de orientações, lembretes de vacinas e mensagens programadas por idade gestacional diretamente no WhatsApp da paciente."
    },
    {
      icon: FileText,
      title: "Cartão de Pré-Natal Digital",
      description: "Geração automática do cartão de pré-natal em PDF com todos os dados, exames, ultrassons, gráficos de evolução e consultas."
    },
    {
      icon: Activity,
      title: "Gráficos de Evolução",
      description: "Acompanhe peso, altura uterina e pressão arterial com gráficos interativos e curvas de referência do Ministério da Saúde."
    },
    {
      icon: FileBarChart,
      title: "Exames Laboratoriais Completos",
      description: "Registro de exames por trimestre com destaque automático de resultados alterados. Suporte a todos os exames do pré-natal."
    },
    {
      icon: Baby,
      title: "Ultrassons Detalhados",
      description: "Registro de 6 tipos de ultrassom: 1º US, Morfo 1º e 2º tri, Obstétrico, Ecocardiograma e Seguimento. Com interpretação por IA."
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Alertas de consultas atrasadas, partos próximos, exames pendentes e resultados alterados. Nunca perca um acompanhamento."
    },
    {
      icon: Smartphone,
      title: "App Mobile para Gestantes",
      description: "As pacientes acessam seus dados pelo celular: próxima consulta, exames, ultrassons e orientações. Instalável como app (PWA)."
    },
    {
      icon: Users,
      title: "Multi-Clínica e Multi-Usuário",
      description: "Suporte a múltiplas clínicas com controle de acesso por perfil: Administrador, Obstetra e Secretária, cada um com permissões específicas."
    },
    {
      icon: Shield,
      title: "Pré-Consulta para Secretárias",
      description: "Secretárias registram peso e PA antes da consulta. Os dados são preenchidos automaticamente quando o médico abre a consulta."
    },
    {
      icon: BarChart3,
      title: "Estatísticas e Relatórios",
      description: "Dashboard com estatísticas de atendimento, distribuição por trimestre, tipos de parto, planos de saúde e muito mais."
    },
    {
      icon: Syringe,
      title: "Marcos Gestacionais",
      description: "Calculadora automática de marcos importantes: vacinas, exames por período, ultrassons recomendados e datas-chave da gestação."
    },
    {
      icon: Clock,
      title: "Agendamento de Consultas",
      description: "Gerencie a agenda de consultas com visualização por dia, semana ou mês. Integrado com o fluxo de pré-consulta."
    },
    {
      icon: Pill,
      title: "Gestão de Medicamentos",
      description: "Cadastre e acompanhe medicamentos em uso durante a gestação. Informação sempre disponível no cartão de pré-natal."
    },
    {
      icon: Building2,
      title: "Partos Realizados",
      description: "Registro completo de partos com tipo, hospital, procedimentos, equipe médica e dados do recém-nascido."
    },
  ];

  const whatsappFeatures = [
    "Orientações alimentares automáticas no cadastro da gestante",
    "Lembretes de vacinas por idade gestacional (DTPa, Bronquiolite)",
    "Orientações pós-operatórias de cesárea",
    "Mensagens personalizáveis por trimestre",
    "Envio de PDFs com orientações médicas",
    "Agendamento de mensagens para horário específico (9h)",
    "Templates configuráveis pelo administrador",
    "Suporte a múltiplos números por clínica",
  ];

  const iaFeatures = [
    "Interpretação automática de laudos de exames laboratoriais em PDF",
    "Interpretação automática de laudos de ultrassom em PDF",
    "Preenchimento automático de campos com destaque visual",
    "Normalização inteligente de valores (ex: VDRL, sorologias)",
    "Detecção e destaque de resultados alterados",
    "Revisão visual antes de salvar (campos em amarelo)",
  ];

  const testimonials = [
    {
      text: "O sistema revolucionou meu consultório. A interpretação por IA dos exames economiza muito tempo e a integração com WhatsApp mantém minhas pacientes sempre informadas.",
      author: "Dra. Ana Paula",
      role: "Obstetra — Clínica Vida Nova"
    },
    {
      text: "A secretária agora registra peso e PA antes da consulta. Quando abro o prontuário, já está tudo preenchido. Ganho pelo menos 5 minutos por atendimento.",
      author: "Dr. Carlos Eduardo",
      role: "Obstetra — Hospital São Lucas"
    },
    {
      text: "Minhas pacientes adoram receber as orientações pelo WhatsApp automaticamente. O app no celular delas é um diferencial que nenhum outro sistema oferece.",
      author: "Dra. Fernanda",
      role: "Obstetra — Clínica Mais Mulher"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo-vertical.png" alt="Mais Mulher" className="h-10 w-auto" />
              <span className="font-bold text-lg text-foreground hidden sm:block">APP Gestantes</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a>
              <a href="#whatsapp" className="hover:text-primary transition-colors">WhatsApp</a>
              <a href="#ia" className="hover:text-primary transition-colors">Inteligência Artificial</a>
              <a href="#depoimentos" className="hover:text-primary transition-colors">Depoimentos</a>
              <a href="#planos" className="hover:text-primary transition-colors">Planos</a>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setLocation("/login")} className="border-primary/30 text-primary hover:bg-primary/5">
                Entrar
              </Button>
              <Button onClick={() => setLocation("/login")} className="bg-primary hover:bg-primary/90">
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-rose-100/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Agora com Inteligência Artificial
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Gestão de Pré-Natal{" "}
                <span className="text-primary">Inteligente</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                O sistema mais completo para obstetras e clínicas. Cadastro de gestantes, consultas, exames, ultrassons, 
                WhatsApp automatizado e inteligência artificial — tudo em uma única plataforma.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => setLocation("/login")} className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
                  Experimentar Grátis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 text-lg px-8 py-6" onClick={() => {
                  document.getElementById("funcionalidades")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  Ver Funcionalidades
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Sem instalação
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Multi-clínica
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  App mobile
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-rose-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-muted-foreground ml-2">gestantesapp.com</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-5 h-5 text-rose-500" />
                        <span className="font-semibold text-sm">Painel do Obstetra</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-primary">127</div>
                          <div className="text-[10px] text-muted-foreground">Gestantes</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-green-600">12</div>
                          <div className="text-[10px] text-muted-foreground">Partos Próximos</div>
                        </div>
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-lg font-bold text-amber-600">8</div>
                          <div className="text-[10px] text-muted-foreground">Alertas</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-800">WhatsApp</span>
                        </div>
                        <div className="text-[10px] text-green-700">342 mensagens enviadas este mês</div>
                      </div>
                      <div className="flex-1 bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-800">IA</span>
                        </div>
                        <div className="text-[10px] text-purple-700">89 exames interpretados</div>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-medium">Próximo parto: Maria Silva</span>
                        </div>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">3 dias</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-bounce">
                  <Send className="w-3 h-3 inline mr-1" /> WhatsApp Auto
                </div>
                <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                  <Brain className="w-3 h-3 inline mr-1" /> IA Integrada
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">18+</div>
              <div className="text-sm opacity-80 mt-1">Funcionalidades</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">6</div>
              <div className="text-sm opacity-80 mt-1">Tipos de Ultrassom</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">3</div>
              <div className="text-sm opacity-80 mt-1">Perfis de Acesso</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">100%</div>
              <div className="text-sm opacity-80 mt-1">Digital e na Nuvem</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="funcionalidades" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que Você Precisa em Um Só Lugar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mais de 18 funcionalidades pensadas para otimizar o acompanhamento pré-natal e a gestão da sua clínica.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border/50 bg-gradient-to-br from-white to-amber-50/30 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Section */}
      <section id="whatsapp" className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <MessageSquare className="w-4 h-4" />
                Automação por WhatsApp
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Comunicação Automática com Suas Pacientes
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Configure uma vez e o sistema cuida do resto. Envie orientações, lembretes de vacinas e mensagens 
                personalizadas automaticamente pelo WhatsApp — no horário ideal para cada paciente.
              </p>
              <div className="space-y-3">
                {whatsappFeatures.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-green-100">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">APP Gestantes</div>
                    <div className="text-xs text-green-600">Online</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-green-50 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                    <p className="text-sm">Olá Maria! Parabéns, você está com 12 semanas! Segue suas orientações alimentares para este período.</p>
                    <span className="text-[10px] text-muted-foreground">9:00</span>
                  </div>
                  <div className="bg-green-50 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-medium">OrientacoesAlimentares.pdf</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">9:00</span>
                  </div>
                  <div className="bg-green-50 rounded-lg rounded-tl-none p-3 max-w-[85%]">
                    <p className="text-sm">Lembrete: Vacina DTPa recomendada entre 27-36 semanas. Converse com seu obstetra na próxima consulta!</p>
                    <span className="text-[10px] text-muted-foreground">9:00</span>
                  </div>
                  <div className="bg-white border rounded-lg rounded-tr-none p-3 max-w-[85%] ml-auto">
                    <p className="text-sm">Obrigada doutora! Já agendei a vacina.</p>
                    <span className="text-[10px] text-muted-foreground">9:15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ia" className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Interpretação por IA</div>
                    <div className="text-xs text-purple-600">Processando laudo...</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-sm font-medium">Hemoglobina</span>
                    <span className="text-sm font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">10.2 g/dL</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium">Glicemia</span>
                    <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">82 mg/dL</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium">HIV</span>
                    <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Não Reagente</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                    <span className="text-sm font-medium">VDRL</span>
                    <span className="text-sm font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">1:8</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium">Toxoplasmose IgG</span>
                    <span className="text-sm font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Reagente</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-800">Campos preenchidos pela IA</span>
                  </div>
                  <p className="text-[11px] text-purple-700">Campos em amarelo foram preenchidos automaticamente. Revise antes de salvar.</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Brain className="w-4 h-4" />
                Inteligência Artificial
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Exames Interpretados em Segundos
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Envie o PDF do laudo e a IA preenche automaticamente todos os campos. Resultados alterados são 
                destacados em vermelho. Economize tempo e reduza erros de digitação.
              </p>
              <div className="space-y-3">
                {iaFeatures.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" />
                App para Gestantes
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Suas Pacientes Conectadas
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                As gestantes acessam seus próprios dados pelo celular: próxima consulta, exames, ultrassons e 
                orientações médicas. Instalável como aplicativo, sem precisar de loja.
              </p>
              <div className="space-y-3">
                {[
                  "Acesso seguro com código de verificação por e-mail",
                  "Visualização de consultas e próximos compromissos",
                  "Acompanhamento de exames e resultados",
                  "Orientações médicas personalizadas",
                  "Instalável como app no Android e iOS (PWA)",
                  "Interface simples e intuitiva para as pacientes",
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-64 h-[480px] bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                    <div className="bg-primary p-4 text-center">
                      <img src="/logo-vertical.png" alt="Logo" className="h-12 w-auto mx-auto mb-1 brightness-0 invert" />
                      <div className="text-primary-foreground text-xs font-medium">Olá, Maria!</div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Idade Gestacional</div>
                        <div className="text-sm font-bold text-foreground">28 semanas e 3 dias</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Próxima Consulta</div>
                        <div className="text-sm font-bold text-foreground">25/03/2026 — 14:00</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Último Exame</div>
                        <div className="text-sm font-bold text-green-700">Todos normais</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Último Ultrassom</div>
                        <div className="text-sm font-bold text-foreground">Morfo 2º Tri — Normal</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <div className="text-[10px] text-muted-foreground mb-0.5">DPP</div>
                        <div className="text-sm font-bold text-foreground">15/06/2026</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cada Profissional no Seu Papel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Controle de acesso inteligente para cada tipo de profissional da sua clínica.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Obstetra</h3>
              <p className="text-muted-foreground mb-4">Acesso completo ao prontuário, consultas, exames, ultrassons e geração de cartão de pré-natal.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Consultas e prontuário</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Exames e ultrassons</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cartão de pré-natal</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Interpretação por IA</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Partos realizados</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Administrador</h3>
              <p className="text-muted-foreground mb-4">Gerencia a clínica, configura acessos, planos de saúde, médicos e templates de mensagens.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Tudo do obstetra</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Configurações da clínica</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gestão de acessos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Templates de WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Relatórios e estatísticas</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secretária</h3>
              <p className="text-muted-foreground mb-4">Cadastra pacientes, registra peso e PA na pré-consulta, e gerencia agendamentos.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Pré-cadastro de gestantes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Pré-consulta (peso e PA)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Agendamento de consultas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Marcos importantes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Previsão de partos</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              O Que Dizem Nossos Usuários
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === activeTestimonial ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                >
                  <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-8 md:p-12 text-center border border-rose-100">
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-foreground italic mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div>
                      <div className="font-bold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? "bg-primary" : "bg-primary/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 bg-gradient-to-br from-amber-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos e Preços
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para sua clínica. Todos incluem suporte e atualizações.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-border/50">
              <h3 className="text-lg font-bold mb-2">Essencial</h3>
              <p className="text-sm text-muted-foreground mb-4">Para consultórios individuais</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 197</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1 clínica</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Até 3 usuários</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cadastro ilimitado de gestantes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cartão de pré-natal digital</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Exames e ultrassons</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> App mobile para gestantes</li>
              </ul>
              <Button variant="outline" className="w-full border-primary/30 text-primary" onClick={() => setLocation("/login")}>
                Começar Agora
              </Button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold">
                MAIS POPULAR
              </div>
              <h3 className="text-lg font-bold mb-2">Profissional</h3>
              <p className="text-sm text-muted-foreground mb-4">Para clínicas em crescimento</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">R$ 397</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1 clínica</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Até 10 usuários</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Tudo do Essencial</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 font-bold" /> <strong>Interpretação por IA</strong></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 font-bold" /> <strong>WhatsApp automatizado</strong></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Pré-consulta para secretárias</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Estatísticas avançadas</li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setLocation("/login")}>
                Começar Agora <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-border/50">
              <h3 className="text-lg font-bold mb-2">Enterprise</h3>
              <p className="text-sm text-muted-foreground mb-4">Para redes de clínicas</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">Sob consulta</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Múltiplas clínicas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Usuários ilimitados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Tudo do Profissional</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Painel multi-clínica</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> API de integração</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Suporte prioritário</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Treinamento da equipe</li>
              </ul>
              <Button variant="outline" className="w-full border-primary/30 text-primary" onClick={() => setLocation("/login")}>
                Falar com Vendas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para Transformar Seu Pré-Natal?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de obstetras que já otimizaram seu atendimento com o APP Gestantes. 
            Comece hoje mesmo — sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90" onClick={() => setLocation("/login")}>
              Criar Minha Conta <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/logo-vertical.png" alt="Mais Mulher" className="h-16 w-auto brightness-0 invert mb-4" />
              <p className="text-sm opacity-70">
                Sistema completo de gestão pré-natal para obstetras e clínicas.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Funcionalidades</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>Cadastro de Gestantes</li>
                <li>Cartão de Pré-Natal</li>
                <li>Exames Laboratoriais</li>
                <li>Ultrassons</li>
                <li>WhatsApp Automatizado</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Recursos</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li>Inteligência Artificial</li>
                <li>App Mobile (PWA)</li>
                <li>Multi-Clínica</li>
                <li>Controle de Acesso</li>
                <li>Estatísticas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm opacity-70">
                <li><a href="/politicadeprivacidade" className="hover:opacity-100 transition-opacity">Política de Privacidade</a></li>
                <li>Termos de Uso</li>
                <li>LGPD</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-8 text-center text-sm opacity-50">
            <p>&copy; {new Date().getFullYear()} APP Gestantes — Mais Mulher. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
