import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GestanteAtivaProvider } from "./contexts/GestanteAtivaContext";
import RoleGuard from "./components/RoleGuard";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import MarcosImportantes from "./pages/MarcosImportantes";
import PrevisaoPartos from "./pages/PrevisaoPartos";
import ExamesLaboratoriais from "./pages/ExamesLaboratoriais";
import CartaoPrenatal from "./pages/CartaoPrenatal";
import CartaoPrenatalImpressao from "./pages/CartaoPrenatalImpressao";
import Estatisticas from "./pages/Estatisticas";
import GerenciarPlanos from "./pages/GerenciarPlanos";
import GerenciarMedicos from "./pages/GerenciarMedicos";
import AgendamentoConsultas from "./pages/AgendamentoConsultas";
import Ultrassons from "./pages/Ultrassons";
import PartosRealizados from "./pages/PartosRealizados";
import EstatisticasPartos from "./pages/EstatisticasPartos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import TermosDeUso from "./pages/TermosDeUso";
import GerenciarFatoresRisco from "./pages/GerenciarFatoresRisco";
import GerenciarMedicamentosConfig from "./pages/GerenciarMedicamentos";
import Login from "./pages/Login";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import EmailsAutorizados from "./pages/EmailsAutorizados";
import AlterarSenha from "./pages/AlterarSenha";
import Integracoes from "./pages/Integracoes";
import AdminClinicas from "./pages/AdminClinicas";
import GerenciarHospitais from "./pages/GerenciarHospitais";
import GerenciarProcedimentos from "./pages/GerenciarProcedimentos";
import MensagensTexto from "./pages/MensagensTexto";
import ExamesPendentes from "./pages/ExamesPendentes";
import PreCadastro from "./pages/PreCadastro";
import PreConsulta from "./pages/PreConsulta";
import AcessoApp from "./pages/AcessoApp";

// Roles que podem acessar conteúdo clínico (cartão, exames, ultrassons, partos)
const CLINICAL_ROLES = ["superadmin", "admin", "obstetra"] as const;
// Roles que podem acessar configurações
const CONFIG_ROLES = ["superadmin", "admin"] as const;

function Router() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/esqueci-senha"} component={EsqueciSenha} />
      <Route path={"/redefinir-senha"} component={RedefinirSenha} />
      <Route path={"/politicadeprivacidade"} component={PoliticaPrivacidade} />
      <Route path={"/privacidade"} component={PoliticaPrivacidade} />
      <Route path={"/termos"} component={TermosDeUso} />

      {/* Rotas acessíveis a todos os roles autenticados */}
      <Route path={"/pre-cadastro"}>
        <RoleGuard allowedRoles={["secretaria"]}><PreCadastro /></RoleGuard>
      </Route>
      <Route path={"/pre-consulta"}>
        <RoleGuard allowedRoles={["secretaria"]}><PreConsulta /></RoleGuard>
      </Route>
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/marcos"} component={MarcosImportantes} />
      <Route path={"/previsao-partos"} component={PrevisaoPartos} />
      <Route path={"/agendamento-consultas"} component={AgendamentoConsultas} />
      <Route path={"/estatisticas"} component={Estatisticas} />

      {/* Acesso ao App Mobile - superadmin, admin, obstetra */}
      <Route path="/acesso-app">
        <RoleGuard allowedRoles={['superadmin', 'admin', 'obstetra']}><AcessoApp /></RoleGuard>
      </Route>

      {/* Mensagens de Texto - superadmin, admin, obstetra */}
      <Route path={"/mensagens-texto"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><MensagensTexto /></RoleGuard>
      </Route>
      <Route path={"/exames-pendentes"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><ExamesPendentes /></RoleGuard>
      </Route>

      {/* Rotas clínicas - apenas superadmin, admin, obstetra */}
      <Route path={"/cartao-prenatal"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><CartaoPrenatal /></RoleGuard>
      </Route>
      <Route path={"/cartao-prenatal-impressao/:gestanteId"}>
        {(params: any) => (
          <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><CartaoPrenatalImpressao {...params} /></RoleGuard>
        )}
      </Route>
      <Route path={"/exames"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><ExamesLaboratoriais /></RoleGuard>
      </Route>
      <Route path={"/ultrassons"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><Ultrassons /></RoleGuard>
      </Route>
      <Route path={"/partos-realizados"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><PartosRealizados /></RoleGuard>
      </Route>
      <Route path={"/estatisticas-partos"}>
        <RoleGuard allowedRoles={[...CLINICAL_ROLES]}><EstatisticasPartos /></RoleGuard>
      </Route>

      {/* Rotas de configuração - apenas superadmin e admin */}
      <Route path={"/gerenciar-planos"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarPlanos /></RoleGuard>
      </Route>
      <Route path={"/gerenciar-hospitais"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarHospitais /></RoleGuard>
      </Route>
      <Route path={"/gerenciar-procedimentos"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarProcedimentos /></RoleGuard>
      </Route>
      <Route path={"/gerenciar-medicos"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarMedicos /></RoleGuard>
      </Route>
      <Route path={"/gerenciar-fatores-risco"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarFatoresRisco /></RoleGuard>
      </Route>
      <Route path={"/gerenciar-medicamentos"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><GerenciarMedicamentosConfig /></RoleGuard>
      </Route>
      <Route path={"/emails-autorizados"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><EmailsAutorizados /></RoleGuard>
      </Route>
      <Route path={"/integracoes"}>
        <RoleGuard allowedRoles={[...CONFIG_ROLES]}><Integracoes /></RoleGuard>
      </Route>
      
      {/* Alterar senha - acessível a todos os autenticados */}
      <Route path={"/alterar-senha"} component={AlterarSenha} />

      {/* Admin Clínicas - superadmin (owner) e admin */}
      <Route path={"/admin/clinicas"}>
        <RoleGuard allowedRoles={["superadmin", "admin"]}><AdminClinicas /></RoleGuard>
      </Route>

      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <GestanteAtivaProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </GestanteAtivaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
