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
  Mail,
  Stethoscope,
  ClipboardList,
  AlertTriangle,
  Building2,
  MessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { trpc } from "@/lib/trpc";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ConsultaUnificadaDialog from "@/components/ConsultaUnificadaDialog";
import WizardPrimeiraConsulta from "@/components/WizardPrimeiraConsulta";


// Definição de menus com controle de acesso por role
// roles: quais roles podem ver este item. Se vazio/undefined, todos podem ver.
const allMenuItems = [
  { icon: Users, label: "Gestantes", path: "/dashboard", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: FileText, label: "Cartão de Pré-natal", path: "/cartao-prenatal", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: FileText, label: "Exames Laboratoriais", path: "/exames", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: FileText, label: "Ultrassons", path: "/ultrassons", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: Calendar, label: "Marcos Importantes", path: "/marcos", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Calendar, label: "Previsão de Partos", path: "/previsao-partos", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Calendar, label: "Agendamento de Consultas", path: "/agendamento-consultas", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: Baby, label: "Partos Realizados", path: "/partos-realizados", roles: ['superadmin', 'admin', 'obstetra'] },
  { icon: BarChart3, label: "Estatísticas", path: "/estatisticas", roles: ['superadmin', 'admin', 'obstetra', 'secretaria'] },
  { icon: MessageSquare, label: "Mensagens de Texto", path: "/mensagens-texto", roles: ['superadmin', 'admin', 'obstetra'] },
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
  { label: "Monitoramento de E-mails", path: "/monitoramento-emails", icon: Mail },
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
  
  // Filtrar menus principais baseado no role do usuário
  const menuItems = allMenuItems.filter(item => {
    return item.roles.includes(userRole);
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
            {/* Seletor de Gestante */}
            <div className="border-b border-sidebar-border p-4 space-y-3">
              {gestanteAtiva ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Gestante Selecionada:</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={limparGestanteAtiva}
                      title="Limpar seleção"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="rounded-md bg-primary/10 px-3 py-2 space-y-2">
                    <p className="text-sm font-medium text-primary truncate">
                      {gestanteAtiva.nome}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {userRole !== 'secretaria' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setLocation('/cartao-prenatal')}
                          title="Ver Cartão de Pré-natal"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Cartão
                        </Button>
                      )}
                      {userRole !== 'secretaria' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
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
                      )}
                      {userRole !== 'secretaria' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setLocation('/exames')}
                          title="Exames Laboratoriais"
                        >
                          <TestTube className="h-3 w-3 mr-1" />
                          Exames
                        </Button>
                      )}
                      {userRole !== 'secretaria' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setLocation('/ultrassons')}
                          title="Ultrassons"
                        >
                          <Scan className="h-3 w-3 mr-1" />
                          Ultrassons
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Selecionar Gestante:
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Digite o nome..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      onFocus={() => busca.length > 0 && setMostrarSugestoes(true)}
                      className="pl-8 h-9 text-sm"
                    />
                    {mostrarSugestoes && sugestoes.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                        {sugestoes.map((gestante) => (
                          <button
                            key={gestante.id}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleSelecionarGestante(gestante)}
                          >
                            {gestante.nome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.path)}
                    isActive={location === item.path}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
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
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold text-foreground">
              Gestão de Pré-Natal{(user as any)?.clinicaNome ? ` - ${(user as any).clinicaNome}` : ''}
            </h1>
          </header>
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
