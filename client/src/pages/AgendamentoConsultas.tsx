import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutocompleteSelect } from "@/components/AutocompleteSelect";
import { ArrowLeft, Calendar, Stethoscope, Activity, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AgendamentoConsultas() {
  const [, setLocation] = useLocation();
  const [gestanteSelecionada, setGestanteSelecionada] = useState<number | null>(null);
  const [dataPrimeiraConsulta, setDataPrimeiraConsulta] = useState("");
  const [consultasCalculadas, setConsultasCalculadas] = useState<any[]>([]);

  const { data: gestantes, isLoading: loadingGestantes } = trpc.gestantes.list.useQuery();
  const { data: agendamentos, refetch: refetchAgendamentos } = trpc.agendamentos.list.useQuery(
    { gestanteId: gestanteSelecionada! },
    { enabled: !!gestanteSelecionada }
  );

  const calcularMutation = trpc.agendamentos.calcular.useMutation({
    onSuccess: (data) => {
      setConsultasCalculadas(data.consultas);
      refetchAgendamentos();
    },
  });

  const updateStatusMutation = trpc.agendamentos.updateStatus.useMutation({
    onSuccess: () => {
      refetchAgendamentos();
    },
  });

  const gestante = gestantes?.find((g) => g.id === gestanteSelecionada);
  
  console.log('Gestante selecionada:', gestante);
  console.log('Gestante DUM:', gestante?.dum);
  console.log('Tipo de DUM:', typeof gestante?.dum);

  const handleCalcular = () => {
    console.log('handleCalcular called', { gestanteSelecionada, dataPrimeiraConsulta, gestante });
    if (!gestanteSelecionada || !dataPrimeiraConsulta || !gestante?.dum) {
      alert("Por favor, selecione uma gestante e a data da primeira consulta");
      return;
    }

    const dumStr = gestante.dum instanceof Date 
      ? gestante.dum.toISOString().split('T')[0] 
      : gestante.dum;
    
    console.log('Calling mutation with:', { gestanteId: gestanteSelecionada, dum: dumStr, dataPrimeiraConsulta });
    calcularMutation.mutate({
      gestanteId: gestanteSelecionada,
      dum: dumStr,
      dataPrimeiraConsulta,
    });
  };

  const handleMarcarRealizado = (id: number) => {
    updateStatusMutation.mutate({ id, status: "realizado" });
  };

  const getExameLabel = (exame: string) => {
    if (exame === "us_obstetrico") return "US Obstétrico";
    if (exame === "cardiotocografia") return "Cardiotocografia";
    return "Nenhum";
  };

  const getExameIcon = (exame: string) => {
    if (exame === "us_obstetrico") return <Stethoscope className="h-4 w-4" />;
    if (exame === "cardiotocografia") return <Activity className="h-4 w-4" />;
    return null;
  };

  const getStatusColor = (status: string) => {
    if (status === "realizado") return "text-green-600 bg-green-50";
    if (status === "cancelado") return "text-gray-600 bg-gray-50";
    if (status === "remarcado") return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Agendamento de Consultas</h1>
          <p className="text-muted-foreground">
            Calcule automaticamente as datas das consultas pré-natais
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Gestante e Data Inicial</CardTitle>
          <CardDescription>
            Escolha a gestante e a data desejada para a primeira consulta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gestante">Gestante</Label>
              <AutocompleteSelect
                options={gestantes?.filter((g) => g.dum).slice().sort((a: any, b: any) => a.nome.localeCompare(b.nome)) || []}
                value={gestanteSelecionada?.toString() || ""}
                onChange={(value) => setGestanteSelecionada(parseInt(value))}
                placeholder="Digite o nome da gestante..."
                labelKey="nome"
                valueKey="id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPrimeira">Data da Primeira Consulta</Label>
              <Input
                id="dataPrimeira"
                type="date"
                value={dataPrimeiraConsulta}
                onChange={(e) => setDataPrimeiraConsulta(e.target.value)}
              />
            </div>
          </div>

          {gestante && !gestante.dum && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta gestante não possui DUM cadastrada. Adicione a DUM antes de calcular os agendamentos.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => {
              console.log('Botão clicado!', { gestanteSelecionada, dataPrimeiraConsulta, gestante });
              handleCalcular();
            }}
            disabled={false}
            className="w-full md:w-auto"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {calcularMutation.isPending ? "Calculando..." : "Calcular Agendamentos"}
          </Button>
        </CardContent>
      </Card>

      {agendamentos && agendamentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Consultas Agendadas</CardTitle>
            <CardDescription>
              {gestante?.nome} - Total de {agendamentos.length} consultas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agendamentos.map((agendamento: any) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {agendamento.igSemanas}s
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatDate(agendamento.dataAgendada)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {agendamento.igSemanas} semanas e {agendamento.igDias} dias
                      </div>
                      {agendamento.exameComplementar !== "nenhum" && (
                        <div className="flex items-center gap-2 mt-1">
                          {getExameIcon(agendamento.exameComplementar)}
                          <span className="text-sm font-medium text-primary">
                            {getExameLabel(agendamento.exameComplementar)}
                          </span>
                        </div>
                      )}
                      {agendamento.observacoes && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{agendamento.observacoes}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        agendamento.status
                      )}`}
                    >
                      {agendamento.status === "agendado" && "Agendado"}
                      {agendamento.status === "realizado" && "Realizado"}
                      {agendamento.status === "cancelado" && "Cancelado"}
                      {agendamento.status === "remarcado" && "Remarcado"}
                    </span>

                    {agendamento.status === "agendado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarRealizado(agendamento.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        Marcar Realizado
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {consultasCalculadas.length > 0 && (!agendamentos || agendamentos.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Consultas Calculadas</CardTitle>
            <CardDescription>
              As consultas foram salvas no banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {consultasCalculadas.map((consulta, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-semibold">{formatDate(consulta.dataAgendada)}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {consulta.igSemanas}s {consulta.igDias}d
                    </span>
                  </div>
                  {consulta.exameComplementar !== "nenhum" && (
                    <span className="text-sm font-medium text-primary">
                      {getExameLabel(consulta.exameComplementar)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
