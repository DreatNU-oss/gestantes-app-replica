import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import MarcosImportantes from "./pages/MarcosImportantes";
import PrevisaoPartos from "./pages/PrevisaoPartos";
import ExamesLaboratoriais from "./pages/ExamesLaboratoriais";
import CartaoPrenatal from "./pages/CartaoPrenatal";
import Estatisticas from "./pages/Estatisticas";
import GerenciarPlanos from "./pages/GerenciarPlanos";
import GerenciarMedicos from "./pages/GerenciarMedicos";
import AgendamentoConsultas from "./pages/AgendamentoConsultas";
import GerenciarEmails from "./pages/GerenciarEmails";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/marcos"} component={MarcosImportantes} />
      <Route path={"/previsao-partos"} component={PrevisaoPartos} />
      <Route path={"/exames"} component={ExamesLaboratoriais} />
      <Route path={"/cartao-prenatal"} component={CartaoPrenatal} />
      <Route path={"/estatisticas"} component={Estatisticas} />
      <Route path={"/gerenciar-planos"} component={GerenciarPlanos} />
      <Route path={"/gerenciar-medicos"} component={GerenciarMedicos} />
      <Route path={"/agendamento-consultas"} component={AgendamentoConsultas} />
      <Route path={"/gerenciar-emails"} component={GerenciarEmails} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
