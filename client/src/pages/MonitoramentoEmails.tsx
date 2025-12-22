import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';

export default function MonitoramentoEmails() {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoLembrete, setTipoLembrete] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<'enviado' | 'erro' | 'todos'>('todos');

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = trpc.email.estatisticas.useQuery({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  });

  // Buscar histórico
  const { data: historico, isLoading: loadingHistorico } = trpc.email.historico.useQuery({
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
    tipoLembrete: tipoLembrete === 'todos' ? undefined : tipoLembrete,
    status: statusFiltro === 'todos' ? undefined : statusFiltro,
    limit: 50,
  });

  // Buscar próximos lembretes
  const { data: proximosLembretes, isLoading: loadingProximos } = trpc.email.proximosLembretes.useQuery();

  const formatarData = (data: Date | string | null) => {
    if (!data) return '-';
    const d = typeof data === 'string' ? new Date(data) : data;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarTipoLembrete = (tipo: string) => {
    const tipos: Record<string, string> = {
      'dtpa': 'Vacina dTpa',
      'bronquiolite': 'Vacina Bronquiolite',
      'morfo1tri_1sem': 'Morfológico 1º Tri',
      'morfo2tri_2sem': 'Morfológico 2º Tri (2 sem)',
      'morfo2tri_1sem': 'Morfológico 2º Tri (1 sem)',
      'codigo_acesso': 'Código de Acesso',
    };
    return tipos[tipo] || tipo;
  };

  const limparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setTipoLembrete('todos');
    setStatusFiltro('todos');
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monitoramento de E-mails</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe o histórico de envios, estatísticas e próximos lembretes programados
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Total de E-mails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingStats ? '...' : stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {loadingStats ? '...' : stats?.enviados || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {loadingStats ? '...' : stats?.erros || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {loadingStats ? '...' : `${stats?.taxaSucesso || 0}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Tipo */}
      {stats && stats.porTipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas por Tipo de Lembrete</CardTitle>
            <CardDescription>Distribuição de envios por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.porTipo.map((tipo) => (
                <div key={tipo.tipo} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{formatarTipoLembrete(tipo.tipo)}</p>
                    <p className="text-sm text-muted-foreground">
                      {tipo.total} total • {tipo.enviados} enviados • {tipo.erros} erros
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {tipo.total > 0 ? Math.round((tipo.enviados / tipo.total) * 100) : 0}% sucesso
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Lembretes Programados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Próximos Lembretes Programados
          </CardTitle>
          <CardDescription>
            Gestantes que receberão lembretes nos próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProximos ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : proximosLembretes && proximosLembretes.length > 0 ? (
            <div className="space-y-2">
              {proximosLembretes.map((lembrete, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{lembrete.gestanteNome}</p>
                    <p className="text-sm text-muted-foreground">{lembrete.descricao}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">IG Atual: {lembrete.igAtual}</p>
                      <p className="text-xs text-muted-foreground">Alvo: {lembrete.igAlvo}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lembrete.diasRestantes} dias
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum lembrete programado para os próximos dias
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>Filtre e visualize o histórico completo de e-mails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label>Tipo de Lembrete</Label>
              <Select value={tipoLembrete} onValueChange={setTipoLembrete}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="dtpa">Vacina dTpa</SelectItem>
                  <SelectItem value="bronquiolite">Vacina Bronquiolite</SelectItem>
                  <SelectItem value="morfo1tri_1sem">Morfológico 1º Tri</SelectItem>
                  <SelectItem value="morfo2tri_2sem">Morfológico 2º Tri (2 sem)</SelectItem>
                  <SelectItem value="morfo2tri_1sem">Morfológico 2º Tri (1 sem)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as 'enviado' | 'erro' | 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="outline" onClick={limparFiltros}>
            Limpar Filtros
          </Button>

          {/* Tabela de Histórico */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Gestante</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">E-mail</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loadingHistorico ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Carregando histórico...
                      </td>
                    </tr>
                  ) : historico && historico.length > 0 ? (
                    historico.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{formatarData(log.dataEnvio)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{log.gestanteNome || '-'}</td>
                        <td className="px-4 py-3 text-sm">{formatarTipoLembrete(log.tipoLembrete)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{log.emailDestinatario}</td>
                        <td className="px-4 py-3">
                          {log.status === 'enviado' ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Enviado
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Erro
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum e-mail encontrado com os filtros selecionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
