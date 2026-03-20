import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, Search, Users, Clock, TrendingUp, UserX, Building2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

function formatarData(isoString: string | null): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  const [buscaComAcesso, setBuscaComAcesso] = useState("");
  const [buscaSemAcesso, setBuscaSemAcesso] = useState("");
  const [clinicaIdSelecionada, setClinicaIdSelecionada] = useState<number | undefined>(undefined);

  // Buscar lista de clínicas
  const { data: clinicas } = trpc.adminClinicas.listar.useQuery();

  const queryInput = clinicaIdSelecionada ? { clinicaId: clinicaIdSelecionada } : undefined;

  const { data: resumo, isLoading: loadingResumo } = trpc.appAcesso.resumo.useQuery(queryInput);
  const { data: gestantesComAcesso, isLoading: loadingComAcesso } = trpc.appAcesso.listarGestantesComAcesso.useQuery(queryInput);
  const { data: gestantesSemAcesso, isLoading: loadingSemAcesso } = trpc.appAcesso.listarGestantesSemAcesso.useQuery(queryInput);

  // Ordenar gestantes com acesso alfabeticamente e filtrar por busca
  const comAcessoFiltradas = useMemo(() => {
    if (!gestantesComAcesso) return [];
    const sorted = [...gestantesComAcesso].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (!buscaComAcesso.trim()) return sorted;
    const buscaLower = buscaComAcesso.toLowerCase();
    return sorted.filter(
      (g) =>
        g.nome.toLowerCase().includes(buscaLower) ||
        g.email.toLowerCase().includes(buscaLower) ||
        g.telefone.toLowerCase().includes(buscaLower)
    );
  }, [gestantesComAcesso, buscaComAcesso]);

  // Filtrar gestantes sem acesso por busca (já vêm ordenadas do backend)
  const semAcessoFiltradas = useMemo(() => {
    if (!gestantesSemAcesso) return [];
    if (!buscaSemAcesso.trim()) return gestantesSemAcesso;
    const buscaLower = buscaSemAcesso.toLowerCase();
    return gestantesSemAcesso.filter(
      (g) =>
        g.nome.toLowerCase().includes(buscaLower) ||
        g.email.toLowerCase().includes(buscaLower) ||
        g.telefone.toLowerCase().includes(buscaLower)
    );
  }, [gestantesSemAcesso, buscaSemAcesso]);

  const clinicaSelecionadaNome = clinicas?.find((c: { id: number; nome: string }) => c.id === clinicaIdSelecionada)?.nome;
  const totalAtivas = resumo?.totalGestantesAtivas ?? 0;
  const totalComAcesso = resumo?.totalComAcesso ?? 0;
  const percentual = totalAtivas > 0 ? Math.round((totalComAcesso / totalAtivas) * 100) : 0;

  const [, setLocation] = useLocation();

  return (
    <GestantesLayout>
      <div className="p-6 space-y-6">
        {/* Botão Voltar */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
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

          {/* Seletor de Clínica */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select
              value={clinicaIdSelecionada ? String(clinicaIdSelecionada) : "todas"}
              onValueChange={(val) => {
                setBuscaComAcesso("");
                setBuscaSemAcesso("");
                setClinicaIdSelecionada(val === "todas" ? undefined : Number(val));
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecionar clínica..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as clínicas</SelectItem>
                {clinicas?.map((c: { id: number; nome: string }) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resumo Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total com acesso</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : totalComAcesso}
                  </p>
                  {!loadingResumo && totalAtivas > 0 && (
                    <p className="text-xs text-muted-foreground">{percentual}% das ativas</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-900/30">
                  <UserX className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sem acesso</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : Math.max(0, totalAtivas - totalComAcesso)}
                  </p>
                  {!loadingResumo && totalAtivas > 0 && (
                    <p className="text-xs text-muted-foreground">{100 - percentual}% das ativas</p>
                  )}
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
                  <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
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
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">
                    {loadingResumo ? "..." : (resumo?.acessosHoje ?? 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {clinicaSelecionadaNome && (
          <p className="text-sm text-muted-foreground -mt-2">
            Exibindo dados de: <span className="font-medium text-foreground">{clinicaSelecionadaNome}</span>
          </p>
        )}

        {/* Lista 1: Gestantes COM acesso */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Gestantes que acessaram o app
                {gestantesComAcesso && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({comAcessoFiltradas.length}{buscaComAcesso ? ` de ${gestantesComAcesso.length}` : ""})
                  </span>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={buscaComAcesso}
                  onChange={(e) => setBuscaComAcesso(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingComAcesso ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : comAcessoFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {buscaComAcesso ? "Nenhuma gestante encontrada." : "Nenhuma gestante acessou o app ainda."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground w-8">#</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Telefone</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">1º Acesso</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Último acesso</th>
                      <th className="text-center px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Sessões</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comAcessoFiltradas.map((g, idx) => {
                      const status = statusAcesso(g.ultimoAcesso);
                      return (
                        <tr
                          key={g.gestanteId}
                          className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-4 py-2 font-medium">{g.nome}</td>
                          <td className="px-4 py-2 text-muted-foreground hidden lg:table-cell">
                            {g.telefone || <span className="italic text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground hidden sm:table-cell">
                            {formatarData(g.primeiraSessao)}
                          </td>
                          <td className="px-4 py-2">
                            <span>{formatarData(g.ultimoAcesso)}</span>
                            {g.ultimoAcesso && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({tempoRelativo(g.ultimoAcesso)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center hidden sm:table-cell">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {g.totalSessoes}
                            </span>
                          </td>
                          <td className="px-4 py-2">
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

        {/* Lista 2: Gestantes SEM acesso */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                Gestantes que ainda não acessaram o app
                {gestantesSemAcesso && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({semAcessoFiltradas.length}{buscaSemAcesso ? ` de ${gestantesSemAcesso.length}` : ""})
                  </span>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={buscaSemAcesso}
                  onChange={(e) => setBuscaSemAcesso(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingSemAcesso ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : semAcessoFiltradas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {buscaSemAcesso ? "Nenhuma gestante encontrada." : "Todas as gestantes já acessaram o app! 🎉"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground w-8">#</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nome</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Telefone</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semAcessoFiltradas.map((g, idx) => (
                      <tr
                        key={g.id}
                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium">{g.nome}</td>
                        <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">
                          {g.email || <span className="italic text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground hidden lg:table-cell">
                          {g.telefone || <span className="italic text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            <UserX className="h-3 w-3 mr-1" />
                            Não acessou
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
