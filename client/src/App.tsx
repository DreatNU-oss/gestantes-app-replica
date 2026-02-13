import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GestanteAtivaProvider } from "./contexts/GestanteAtivaContext";
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
import GerenciarEmails from "./pages/GerenciarEmails";
import Ultrassons from "./pages/Ultrassons";
import LogsEmails from "./pages/LogsEmails";
import PartosRealizados from "./pages/PartosRealizados";
import EstatisticasPartos from "./pages/EstatisticasPartos";
import MonitoramentoEmails from "./pages/MonitoramentoEmails";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import GerenciarFatoresRisco from "./pages/GerenciarFatoresRisco";
import GerenciarMedicamentosConfig from "./pages/GerenciarMedicamentos";
import Login from "./pages/Login";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import EmailsAutorizados from "./pages/EmailsAutorizados";
import AlterarSenha from "./pages/AlterarSenha";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/marcos"} component={MarcosImportantes} />
      <Route path={"/previsao-partos"} component={PrevisaoPartos} />
      <Route path={"/exames"} component={ExamesLaboratoriais} />
      <Route path={"/ultrassons"} component={Ultrassons} />
      <Route path={"/cartao-prenatal"} component={CartaoPrenatal} />
      <Route path={"/cartao-prenatal-impressao/:gestanteId"} component={CartaoPrenatalImpressao} />
      <Route path={"/estatisticas"} component={Estatisticas} />
      <Route path={"/gerenciar-planos"} component={GerenciarPlanos} />
      <Route path={"/gerenciar-medicos"} component={GerenciarMedicos} />
      <Route path={"/agendamento-consultas"} component={AgendamentoConsultas} />
      <Route path={"/gerenciar-emails"} component={GerenciarEmails} />
      <Route path={"/logs-emails"} component={LogsEmails} />
      <Route path={"/monitoramento-emails"} component={MonitoramentoEmails} />
      <Route path={"/partos-realizados"} component={PartosRealizados} />
      <Route path={"/estatisticas-partos"} component={EstatisticasPartos} />
      <Route path={"/politicadeprivacidade"} component={PoliticaPrivacidade} />
      <Route path={"/gerenciar-fatores-risco"} component={GerenciarFatoresRisco} />
      <Route path={"/gerenciar-medicamentos"} component={GerenciarMedicamentosConfig} />
      <Route path={"/login"} component={Login} />
      <Route path={"/esqueci-senha"} component={EsqueciSenha} />
      <Route path={"/redefinir-senha"} component={RedefinirSenha} />
      <Route path={"/emails-autorizados"} component={EmailsAutorizados} />
      <Route path={"/alterar-senha"} component={AlterarSenha} />
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
