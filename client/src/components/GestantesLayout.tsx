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
import { getLoginUrl } from "@/const";
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
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: Users, label: "Gestantes", path: "/dashboard" },
  { icon: FileText, label: "Cartão de Pré-natal", path: "/cartao-prenatal" },
  { icon: FileText, label: "Exames Laboratoriais", path: "/exames" },
  { icon: FileText, label: "Ultrassons", path: "/ultrassons" },
  { icon: Calendar, label: "Marcos Importantes", path: "/marcos" },
  { icon: Calendar, label: "Previsão de Partos", path: "/previsao-partos" },
  { icon: Calendar, label: "Agendamento de Consultas", path: "/agendamento-consultas" },
  { icon: BarChart3, label: "Estatísticas", path: "/estatisticas" },
];

const configMenuItems = [
  { label: "Gerenciar Planos", path: "/gerenciar-planos" },
  { label: "Gerenciar Médicos", path: "/gerenciar-medicos" },
];

export default function GestantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
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
    window.location.href = getLoginUrl();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center justify-center">
              <img 
                src="/logo-horizontal.png" 
                alt="Mais Mulher - Clínica de Saúde Feminina" 
                className="h-20 w-auto object-contain"
              />
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
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Submenu Configurações */}
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
                    <span className="text-xs text-muted-foreground">{user.email}</span>
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
              Gestão de Pré-Natal - Clínica Mais Mulher
            </h1>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
