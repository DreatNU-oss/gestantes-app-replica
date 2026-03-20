import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Search, Users, Clock, TrendingUp } from "lucide-react";

function formatarDataHora(isoString: string | null): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tempoRelativo(isoString: string | null): string {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutos = Math.floor(diff / 60000);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 30) return `há ${Math.floor(dias / 7)} sem`;
  return `há ${Math.floor(dias / 30)} meses`;
}

function statusAcesso(ultimoAcesso: string | null): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!ultimoAcesso) return { label: "Sem acesso", variant: "outline" };
  const diff = Date.now() - new Date(ultimoAcesso).getTime();
  const dias = diff / (1000 * 60 * 60 * 24);
  if (dias < 1) return { label: "Hoje", variant: "default" };
  if (dias < 7) return { label: "Esta semana", variant: "default" };
  if (dias < 30) return { label: "Este mês", variant: "secondary" };
  return { label: "Inativo", variant: "outline" };
}

export default function AcessoApp() {
  const [busca, setBusca] = useState("");

  const { data: resumo, isLoading: loadingResumo } = trpc.appAcesso.resumo.useQuery();
  const { data: gestantes, isLoading: loadingLista } = trpc.appAcesso.listarGestantesComAcesso.useQuery();

  const gestantesFiltradas = useMemo(() => {
    if (!gestantes) return [];
    if (!busca.trim()) return gestantes;
    const buscaLower = busca.toLowerCase();
    return gestantes.filter(
      (g) =>
        g.nome.toLowerCase().includes(buscaLower) ||
        g.email.toLowerCase().includes(buscaLower) ||
        g.telefone.toLowerCase().includes(buscaLower)
    );
  }, [gestantes, busca]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Acesso ao App</h1>
            <p className="text-sm text-muted-foreground">
              Gestantes que fizeram download e acessaram o aplicativo mobile
            </p>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total com acesso</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : (resumo?.totalComAcesso ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : (resumo?.acessosUltimos7Dias ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : (resumo?.acessosHoje ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de gestantes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <CardTitle className="text-base">
                Gestantes com acesso ao app
                {gestantes && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({gestantesFiltradas.length} de {gestantes.length})
                  </span>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLista ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando...
              </div>
            ) : gestantesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {busca ? "Nenhuma gestante encontrada para esta busca." : "Nenhuma gestante acessou o app ainda."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Telefone</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Último acesso</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Primeiro acesso</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Sessões</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gestantesFiltradas.map((g, idx) => {
                      const status = statusAcesso(g.ultimoAcesso);
                      return (
                        <tr
                          key={g.gestanteId}
                          className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-4 py-3 font-medium">{g.nome}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {g.email || <span className="text-muted-foreground/50 italic">—</span>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                            {g.telefone || <span className="text-muted-foreground/50 italic">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-foreground">{formatarDataHora(g.ultimoAcesso)}</span>
                            {g.ultimoAcesso && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({tempoRelativo(g.ultimoAcesso)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {formatarDataHora(g.primeiraSessao)}
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {g.totalSessoes}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
