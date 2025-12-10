import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GerenciarEmails() {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const processarLembretesMutation = trpc.email.processarLembretes.useMutation();
  const { data: logs, refetch: refetchLogs } = trpc.email.logs.useQuery({ limit: 20 });
  const { data: config } = trpc.email.obterConfig.useQuery();

  const handleProcessarLembretes = async () => {
    setProcessando(true);
    setResultado(null);
    
    try {
      const res = await processarLembretesMutation.mutateAsync();
      setResultado(res);
      refetchLogs();
    } catch (error: any) {
      setResultado({
        processadas: 0,
        enviados: 0,
        erros: 1,
        detalhes: [`❌ Erro: ${error.message}`],
      });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar E-mails</h1>
            <p className="text-muted-foreground">Envio automático de lembretes para gestantes</p>
          </div>
        </div>

        {/* Configuração Atual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuração de E-mail
            </CardTitle>
            <CardDescription>Credenciais configuradas para envio</CardDescription>
          </CardHeader>
          <CardContent>
            {config?.emailUser ? (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>E-mail configurado: <strong>{config.emailUser}</strong></span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>Nenhum e-mail configurado</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processar Lembretes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Processar Lembretes
            </CardTitle>
            <CardDescription>
              Verifica todas as gestantes e envia lembretes de vacinas e exames conforme idade gestacional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
              <p><strong>Lembretes automáticos:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Vacina dTpa: exatamente com 27 semanas</li>
                <li>Vacina Bronquiolite: com 32 semanas</li>
                <li>Morfológico 1º Tri: com 10 semanas (1 semana antes)</li>
                <li>Morfológico 2º Tri: com 18 e 19 semanas (2 e 1 semana antes)</li>
              </ul>
            </div>

            <Button 
              onClick={handleProcessarLembretes} 
              disabled={processando || !config?.emailUser}
              className="w-full"
            >
              {processando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Processar Lembretes Agora
                </>
              )}
            </Button>

            {!config?.emailUser && (
              <Alert>
                <AlertDescription>
                  Configure as credenciais de e-mail antes de processar lembretes.
                </AlertDescription>
              </Alert>
            )}

            {resultado && (
              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle className="text-lg">Resultado do Processamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold">{resultado.processadas}</div>
                      <div className="text-xs text-muted-foreground">Processadas</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{resultado.enviados}</div>
                      <div className="text-xs text-muted-foreground">Enviados</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{resultado.erros}</div>
                      <div className="text-xs text-muted-foreground">Erros</div>
                    </div>
                  </div>

                  <div className="bg-background p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Detalhes:</p>
                    <div className="text-xs font-mono space-y-1 max-h-64 overflow-y-auto">
                      {resultado.detalhes.map((detalhe: string, idx: number) => (
                        <div key={idx}>{detalhe}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Histórico de E-mails */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de E-mails Enviados</CardTitle>
            <CardDescription>Últimos 20 e-mails processados</CardDescription>
          </CardHeader>
          <CardContent>
            {!logs || logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum e-mail enviado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log: any) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {log.status === 'enviado' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{log.assunto}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.dataEnvio).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Para: {log.emailDestinatario}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {log.tipoLembrete}</p>
                      {log.mensagemErro && (
                        <p className="text-xs text-red-600 mt-1">Erro: {log.mensagemErro}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
