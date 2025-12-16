import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import GestantesLayout from '@/components/GestantesLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, CheckCircle, XCircle, RefreshCw, Search, Calendar } from 'lucide-react';

export default function LogsEmails() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [limite, setLimite] = useState<number>(100);

  // Buscar logs de e-mails
  const { data: logs, isLoading, refetch } = trpc.email.logs.useQuery({ limit: limite });

  // Mutation para processar lembretes
  const processarMutation = trpc.email.processarLembretes.useMutation({
    onSuccess: (resultado) => {
      alert(`Processamento concluído!\n\nProcessadas: ${resultado.processadas}\nEnviados: ${resultado.enviados}\nErros: ${resultado.erros}\n\nDetalhes:\n${resultado.detalhes.join('\n')}`);
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao processar lembretes: ${error.message}`);
    },
  });

  // Filtrar logs
  const logsFiltrados = logs?.filter(log => {
    if (filtroStatus !== 'todos' && log.status !== filtroStatus) return false;
    if (filtroTipo !== 'todos' && log.tipoLembrete !== filtroTipo) return false;
    return true;
  }) || [];

  // Obter tipos únicos de lembretes
  const tiposUnicos = Array.from(new Set(logs?.map(log => log.tipoLembrete) || []));

  // Formatar data
  const formatarData = (data: Date | string | null) => {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatar tipo de lembrete
  const formatarTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      'dtpa': 'Vacina dTpa',
      'bronquiolite': 'Vacina Bronquiolite',
      'morfo1tri': 'Morfológico 1º Tri',
      'morfo1tri_1sem': 'Morfológico 1º Tri',
      'morfo2tri': 'Morfológico 2º Tri',
      'morfo2tri_1sem': 'Morfológico 2º Tri (1 sem)',
      'morfo2tri_2sem': 'Morfológico 2º Tri (2 sem)',
    };
    return tipos[tipo] || tipo;
  };

  // Estatísticas
  const totalEnviados = logs?.filter(l => l.status === 'enviado').length || 0;
  const totalErros = logs?.filter(l => l.status === 'erro').length || 0;

  return (
    <GestantesLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Logs de E-mails</h1>
            <p className="text-muted-foreground">Visualize todos os e-mails enviados pelo sistema de lembretes</p>
          </div>
          <Button
            onClick={() => processarMutation.mutate()}
            disabled={processarMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {processarMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Processar Lembretes Agora
              </>
            )}
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de E-mails</p>
                  <p className="text-2xl font-bold">{logs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enviados com Sucesso</p>
                  <p className="text-2xl font-bold text-green-600">{totalEnviados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Erros de Envio</p>
                  <p className="text-2xl font-bold text-red-600">{totalErros}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="enviado">Enviados</SelectItem>
                    <SelectItem value="erro">Erros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Lembrete</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {tiposUnicos.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {formatarTipo(tipo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Limite de Registros</Label>
                <Select value={limite.toString()} onValueChange={(v) => setLimite(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={() => refetch()} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de E-mails</CardTitle>
            <CardDescription>
              Mostrando {logsFiltrados.length} de {logs?.length || 0} registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logsFiltrados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum e-mail encontrado</p>
                <p className="text-sm mt-2">Clique em "Processar Lembretes Agora" para verificar e enviar lembretes pendentes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Data/Hora</th>
                      <th className="text-left py-3 px-4 font-medium">Destinatário</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium">Assunto</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Erro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsFiltrados.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatarData(log.dataEnvio)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">{log.emailDestinatario}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{formatarTipo(log.tipoLembrete)}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm max-w-xs truncate block" title={log.assunto}>
                            {log.assunto}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'enviado' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enviado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              <XCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.mensagemErro ? (
                            <span className="text-sm text-red-600 max-w-xs truncate block" title={log.mensagemErro}>
                              {log.mensagemErro}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações sobre o sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Sobre o Sistema de Lembretes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>O sistema envia lembretes automáticos para gestantes com e-mail cadastrado nos seguintes momentos:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Vacina dTpa:</strong> 27 semanas de gestação</li>
                <li><strong>Vacina Bronquiolite:</strong> 32 semanas de gestação</li>
                <li><strong>Morfológico 1º Trimestre:</strong> 10 semanas de gestação</li>
                <li><strong>Morfológico 2º Trimestre:</strong> 18 semanas (2 semanas antes) e 19 semanas (1 semana antes)</li>
              </ul>
              <p className="mt-4">
                <strong>Requisitos:</strong> A gestante precisa ter e-mail cadastrado e DUM ou Ultrassom registrado para calcular a idade gestacional.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
