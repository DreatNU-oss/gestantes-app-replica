import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoWhatsAppProps {
  gestanteId: number;
}

export function HistoricoWhatsApp({ gestanteId }: HistoricoWhatsAppProps) {
  const { data: mensagens, isLoading } = trpc.whatsapp.listarMensagens.useQuery({
    gestanteId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Mensagens WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mensagens || mensagens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Mensagens WhatsApp
          </CardTitle>
          <CardDescription>
            Nenhuma mensagem enviada ainda
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enviado":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processando":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "erro":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enviado":
        return <Badge variant="default" className="bg-green-600">Enviado</Badge>;
      case "processando":
        return <Badge variant="default" className="bg-yellow-600">Processando</Badge>;
      case "erro":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Histórico de Mensagens WhatsApp
        </CardTitle>
        <CardDescription>
          {mensagens.length} {mensagens.length === 1 ? "mensagem enviada" : "mensagens enviadas"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(mensagem.status)}
                  <div>
                    <p className="font-medium text-sm">{mensagem.templateUsado}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mensagem.dataEnvio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(mensagem.status)}
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 rounded p-3 whitespace-pre-wrap">
                {mensagem.mensagem}
              </div>

              {mensagem.status === "erro" && mensagem.mensagemErro && (
                <div className="text-xs text-red-600 bg-red-50 rounded p-2">
                  <strong>Erro:</strong> {mensagem.mensagemErro}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Para: {mensagem.telefone}</span>
                {mensagem.helenaMessageId && (
                  <span className="font-mono">ID: {mensagem.helenaMessageId.substring(0, 8)}...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
