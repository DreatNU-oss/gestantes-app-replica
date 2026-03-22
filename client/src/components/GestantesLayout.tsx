import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Calendar, 
  FileText, 
  ClipboardCheck,
  Activity,
  BarChart3,
  Settings,
  Baby,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Eye,
  Plus,
  TestTube,
  Scan,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  Building2,
  MessageSquare,
  ClipboardPlus,
  Smartphone
} from "lucide-react";
import { useEffect, useState } from "react";

// Ícone SVG do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { trpc } from "@/lib/trpc";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import { Input } from "@/components/ui/input";
import { InputComHistorico } from "@/components/InputComHistorico";
import { Button } from "@/components/ui/button";
import ConsultaUnificadaDialog from "@/components/ConsultaUnificadaDialog";
import WizardPrimeiraConsulta from "@/components/WizardPrimeiraConsulta";
import { formatarParidade } from "@shared/paridade";


// Definição de menus com controle de acesso por role
// roles: quais roles podem ver este item. Se vazio/undefined, todos podem ver.
const allMenuItems = [
  { icon: ClipboardPlus, label: "Pré-Cadastro", path: "/pre-cadastro", roles: ['secretaria'] },
  { icon: Stethoscope, label: "Pré-Consulta", path: "/pre-consulta", roles: ['secretaria'] },
  { icon: Users, label: "Gestantes", path: "/dashboard", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: FileText, label: "Cartão de Pré-natal", path: "/cartao-prenatal", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: FileText, label: "Exames Laboratoriais", path: "/exames", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: FileText, label: "Ultrassons", path: "/ultrassons", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: Calendar, label: "Marcos Importantes", path: "/marcos", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Calendar, label: "Previsão de Partos", path: "/previsao-partos", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Calendar, label: "Agendamento de Consultas", path: "/agendamento-consultas", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Baby, label: "Partos Realizados", path: "/partos-realizados", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: BarChart3, label: "Estatísticas", path: "/estatisticas", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: WhatsAppIcon, label: "WhatsApp Programado", path: "/mensagens-texto", roles: ['superadmin', 'admin', 'obstetra'], iconColor: 'text-green-500' },
  { icon: ClipboardCheck, label: "Exames Pendentes", path: "/exames-pendentes", roles: ['superadmin', 'admin', 'obstetra'] },
];

const allConfigMenuItems = [
  { label: "Gerenciar Convênios", path: "/gerenciar-planos" },
  { label: "Gerenciar Hospitais", path: "/gerenciar-hospitais" },
  { label: "Gerenciar Procedimentos", path: "/gerenciar-procedimentos" },
  { label: "Gerenciar Médicos", path: "/gerenciar-medicos" },
  { label: "Fatores de Risco", path: "/gerenciar-fatores-risco" },
  { label: "Medicamentos", path: "/gerenciar-medicamentos" },
  { label: "Usuários", path: "/emails-autorizados" },
  { label: "Alterar Senha", path: "/alterar-senha" },
  // [REMOVIDO] Monitoramento de E-mails desativado
  { label: "Integrações", path: "/integracoes", clinicaOnly: "00001" },
];

// Helper para verificar se o usuário tem acesso a Configurações
const canAccessConfig = (role: string) => ['superadmin', 'admin'].includes(role);

export default function GestantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  
  const userRole = (user as any)?.role || 'obstetra';
  
  // Contar exames pendentes para badge
  const { data: pendentesCount } = trpc.examesLab.contarPendentes.useQuery(undefined, {
    refetchInterval: 60_000,
    enabled: !!user && ['superadmin', 'admin', 'obstetra'].includes(userRole),
  });

  // Filtrar menus principais baseado no role do usuário e na clínica
  const menuItems = allMenuItems.filter(item => {
    if (!item.roles.includes(userRole)) return false;
    if ('clinicaOnly' in item && item.clinicaOnly) {
      return (user as any)?.clinicaCodigo === item.clinicaOnly;
    }
    return true;
  });
  
  // Filtrar itens de configuração baseado na clínica do usuário (só admin/superadmin)
  const showConfigMenu = canAccessConfig(userRole);
  const configMenuItems = showConfigMenu ? allConfigMenuItems.filter(item => {
    if ('clinicaOnly' in item && item.clinicaOnly) {
      return (user as any)?.clinicaCodigo === item.clinicaOnly;
    }
    return true;
  }) : [];
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [configOpen, setConfigOpen] = useState(false);
  const { gestanteAtiva, setGestanteAtiva, limparGestanteAtiva } = useGestanteAtiva();
  const [busca, setBusca] = useState("");
  const [sugestoes, setSugestoes] = useState<Array<{ id: number; nome: string }>>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [showConsultaDialog, setShowConsultaDialog] = useState(false);
  const [showWizardPrimeiraConsulta, setShowWizardPrimeiraConsulta] = useState(false);
  const [gestanteParaConsulta, setGestanteParaConsulta] = useState<{
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
  } | null>(null);


  // Buscar dados completos da gestante ativa para o diálogo de consulta
  const { data: gestanteAtivaCompleta } = trpc.gestantes.get.useQuery(
    { id: gestanteAtiva?.id! },
    { enabled: !!gestanteAtiva?.id }
  );

  // Buscar gestantes para autocomplete
  const { data: gestantes } = trpc.gestantes.list.useQuery({
    searchTerm: busca,
  });

  // Atualizar sugestões quando a busca mudar
  useEffect(() => {
    if (busca.length > 0 && gestantes) {
      setSugestoes(gestantes.slice(0, 5).map(g => ({ id: g.id, nome: g.nome })));
      setMostrarSugestoes(true);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
    }
  }, [busca, gestantes]);

  const handleSelecionarGestante = (gestante: { id: number; nome: string }) => {
    setGestanteAtiva(gestante);
    setBusca("");
    setMostrarSugestoes(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full" style={{ backgroundColor: (user as any)?.clinicaCorFundo || '#FDF8F5' }}>
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center justify-center">
              {(user as any)?.clinicaLogoUrl ? (
                <img 
                  src={(user as any).clinicaLogoUrl} 
                  alt={(user as any)?.clinicaNome || "Clínica"} 
                  className="h-20 w-auto object-contain"
                />
              ) : (
                <div className="h-20 flex flex-col items-center justify-center text-center px-2">
                  <p className="text-xs text-muted-foreground leading-tight">
                    Sua logo aqui
                  </p>
                </div>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.path)}
                    isActive={location === item.path}
                  >
                    <item.icon className={`h-4 w-4 ${(item as any).iconColor || ''}`} />
                    <span>{item.label}</span>
                    {item.path === '/exames-pendentes' && pendentesCount && pendentesCount.count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                        {pendentesCount.count}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Submenu Configurações - apenas admin/superadmin */}
              {showConfigMenu && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setConfigOpen(!configOpen)}
                      isActive={configMenuItems.some(item => location === item.path)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                      {configOpen ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {/* Subitens de Configurações */}
                  {configOpen && configMenuItems.map((item) => (
                    <SidebarMenuItem key={item.path} className="pl-6">
                      <SidebarMenuButton
                        onClick={() => setLocation(item.path)}
                        isActive={location === item.path}
                      >
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
              {/* Link Admin - admin e owner */}
              {((user as any)?.isOwner || userRole === 'admin') && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setLocation('/admin/clinicas')}
                    isActive={location === '/admin/clinicas'}
                    className="mt-2 border-t border-sidebar-border pt-2"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="font-semibold">Admin Clínicas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {/* Acesso ao App - apenas owner */}
              {(user as any)?.isOwner && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setLocation('/acesso-app')}
                    isActive={location === '/acesso-app'}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="font-semibold">Acesso ao App</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{user.name || "Usuário"}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      userRole === 'superadmin' ? 'bg-red-100 text-red-700' :
                      userRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                      userRole === 'obstetra' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {userRole === 'superadmin' ? 'Super Admin' :
                       userRole === 'admin' ? 'Administrador' :
                       userRole === 'obstetra' ? 'Obstetra' : 'Secretária'}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          {/* Barra 1: Nome/IG da gestante (sem título fixo) */}
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-background px-6 h-14">
            <SidebarTrigger />
            {gestanteAtiva ? (() => {
              const ig = gestanteAtivaCompleta?.calculado
                ? (gestanteAtivaCompleta.calculado.igUS || gestanteAtivaCompleta.calculado.igDUM)
                : null;
              return (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-bold text-foreground leading-tight">{gestanteAtiva.nome}</span>
                  {gestanteAtivaCompleta && (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-sm text-muted-foreground leading-tight">
                        {formatarParidade({ gesta: gestanteAtivaCompleta.gesta, para: gestanteAtivaCompleta.para, partosNormais: gestanteAtivaCompleta.partosNormais, cesareas: gestanteAtivaCompleta.cesareas, abortos: gestanteAtivaCompleta.abortos })}
                      </span>
                    </>
                  )}
                  {gestanteAtivaCompleta?.calculado?.igDUM && (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        IG(DUM): <span className="font-semibold text-foreground">{gestanteAtivaCompleta.calculado.igDUM.semanas}s {gestanteAtivaCompleta.calculado.igDUM.dias}d</span>
                      </span>
                      {gestanteAtivaCompleta.calculado.dpp && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          DPP DUM: <span className="font-semibold text-foreground">{gestanteAtivaCompleta.calculado.dpp}</span>
                        </span>
                      )}
                    </>
                  )}
                  {gestanteAtivaCompleta?.calculado?.igUS && (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground leading-tight">
                        IG(US): <span className="font-semibold text-emerald-600">{gestanteAtivaCompleta.calculado.igUS.semanas}s {gestanteAtivaCompleta.calculado.igUS.dias}d</span>
                      </span>
                      {gestanteAtivaCompleta.calculado.dppUS && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          DPP US: <span className="font-semibold text-emerald-600">{gestanteAtivaCompleta.calculado.dppUS}</span>
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })() : (
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                {(user as any)?.clinicaNome || 'Gestão de Pré-Natal'}
              </h1>
            )}
          </header>

          {/* Barra 2: Botões de ação rápida (só aparece quando há gestante selecionada) */}
          {gestanteAtiva && userRole !== 'secretaria' && (
            <div className="sticky top-14 z-19 flex items-center gap-2 border-b bg-muted/40 px-6 py-2">
              <Button
                variant={location === '/cartao-prenatal' ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-xs ${location === '/cartao-prenatal' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                onClick={() => setLocation('/cartao-prenatal')}
                title="Ver Cartão de Pré-natal"
              >
                <Eye className="h-3 w-3 mr-1" />
                Cartão
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-background"
                title="Nova Consulta"
                onClick={() => {
                  const g = gestanteAtivaCompleta || gestanteAtiva;
                  setGestanteParaConsulta({
                    id: gestanteAtiva.id,
                    nome: gestanteAtiva.nome,
                    dum: (g as any).dum || undefined,
                    tipoDum: (g as any).tipoDum || undefined,
                    dataUltrassom: (g as any).dataUltrassom || undefined,
                    igUltrassomSemanas: (g as any).igUltrassomSemanas || undefined,
                    igUltrassomDias: (g as any).igUltrassomDias || undefined,
                    gesta: (g as any).gesta || undefined,
                    para: (g as any).para || undefined,
                    partosNormais: (g as any).partosNormais || undefined,
                    cesareas: (g as any).cesareas || undefined,
                    abortos: (g as any).abortos || undefined,
                  });
                  setShowConsultaDialog(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Consulta
              </Button>
              <Button
                variant={location === '/exames' ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-xs ${location === '/exames' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                onClick={() => setLocation('/exames')}
                title="Exames Laboratoriais"
              >
                <TestTube className="h-3 w-3 mr-1" />
                Exames
              </Button>
              <Button
                variant={location === '/ultrassons' ? 'default' : 'outline'}
                size="sm"
                className={`h-8 text-xs ${location === '/ultrassons' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                onClick={() => setLocation('/ultrassons')}
                title="Ultrassons"
              >
                <Scan className="h-3 w-3 mr-1" />
                Ultrassons
              </Button>
            </div>
          )}
          <main className="flex-1 p-6" style={{ backgroundColor: (user as any)?.clinicaCorFundo || '#FDF8F5' }}>
            {children}
          </main>
        </SidebarInset>
      </div>


      {/* Diálogo Unificado de Consulta */}
      <ConsultaUnificadaDialog
        open={showConsultaDialog}
        onOpenChange={setShowConsultaDialog}
        gestanteParaConsulta={gestanteParaConsulta}
        onClose={() => {
          setShowConsultaDialog(false);
          setGestanteParaConsulta(null);
        }}
        onConfirm={(isPrimeiraConsulta?: boolean, isUrgencia?: boolean) => {
          setShowConsultaDialog(false);
          if (gestanteParaConsulta) {
            if (isUrgencia) {
              window.location.href = `/cartao-prenatal?gestanteId=${gestanteParaConsulta.id}&novaConsulta=true&urgencia=true&skipInfoModal=true`;
            } else if (isPrimeiraConsulta) {
              setShowWizardPrimeiraConsulta(true);
            } else {
              window.location.href = `/cartao-prenatal?gestanteId=${gestanteParaConsulta.id}&novaConsulta=true&skipInfoModal=true`;
            }
          }
        }}
      />

      {/* Wizard de 1ª Consulta */}
      {gestanteParaConsulta && (
        <WizardPrimeiraConsulta
          open={showWizardPrimeiraConsulta}
          onOpenChange={(open) => {
            setShowWizardPrimeiraConsulta(open);
            if (!open) setGestanteParaConsulta(null);
          }}
          gestante={gestanteParaConsulta}
          onSuccess={() => {
            setShowWizardPrimeiraConsulta(false);
            setGestanteParaConsulta(null);
          }}
        />
      )}
    </SidebarProvider>
  );
}
