import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Gestante {
  id: number;
  nome: string;
  tipoPartoDesejado: string | null;
  dum?: string | Date | null;
  dataUltrassom?: string | Date | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
  dataPartoProgramado?: string | Date | null;
}

interface AlertaParto {
  gestante: Gestante;
  dataParto: Date;
  diasRestantes: number;
  tipo: "programado" | "usg" | "dum";
  urgencia: "alta" | "media" | "baixa";
}

export function AlertasPartosProximos({ gestantes }: { gestantes: Gestante[] }) {
  const calcularDPP = (gestante: Gestante): Date | null => {
    if (!gestante.dum) return null;
    const dum = new Date(gestante.dum);
    const dpp = new Date(dum);
    dpp.setDate(dpp.getDate() + 280); // 40 semanas
    return dpp;
  };

  const calcularDPPUltrassom = (gestante: Gestante): Date | null => {
    if (!gestante.dataUltrassom || gestante.igUltrassomSemanas === null) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const diasGestacao = (gestante.igUltrassomSemanas! * 7) + (gestante.igUltrassomDias || 0);
    const diasRestantes = 280 - diasGestacao;
    const dpp = new Date(dataUS);
    dpp.setDate(dpp.getDate() + diasRestantes);
    return dpp;
  };

  const obterDataParto = (gestante: Gestante): { data: Date; tipo: "programado" | "usg" | "dum" } | null => {
    // Prioridade 1: Parto Programado
    if (gestante.dataPartoProgramado) {
      return { data: new Date(gestante.dataPartoProgramado), tipo: "programado" };
    }

    // Prioridade 2: DPP por Ultrassom
    const dppUS = calcularDPPUltrassom(gestante);
    if (dppUS) {
      return { data: dppUS, tipo: "usg" };
    }

    // Prioridade 3: DPP por DUM
    const dppDUM = calcularDPP(gestante);
    if (dppDUM) {
      return { data: dppDUM, tipo: "dum" };
    }

    return null;
  };

  const obterUrgencia = (diasRestantes: number): "alta" | "media" | "baixa" => {
    if (diasRestantes <= 7) return "alta";
    if (diasRestantes <= 14) return "media";
    return "baixa";
  };

  const alertas: AlertaParto[] = gestantes
    .map((gestante) => {
      const resultado = obterDataParto(gestante);
      if (!resultado) return null;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataParto = new Date(resultado.data);
      dataParto.setHours(0, 0, 0, 0);
      
      const diasRestantes = Math.ceil((dataParto.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      // Filtrar apenas partos nos próximos 21 dias
      if (diasRestantes < 0 || diasRestantes > 21) return null;

      return {
        gestante,
        dataParto: resultado.data,
        diasRestantes,
        tipo: resultado.tipo,
        urgencia: obterUrgencia(diasRestantes),
      };
    })
    .filter((alerta): alerta is AlertaParto => alerta !== null)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  if (alertas.length === 0) {
    return null;
  }

  const getCorUrgencia = (urgencia: "alta" | "media" | "baixa") => {
    switch (urgencia) {
      case "alta":
        return "bg-red-50 border-red-200";
      case "media":
        return "bg-yellow-50 border-yellow-200";
      case "baixa":
        return "bg-green-50 border-green-200";
    }
  };

  const getCorBadge = (urgencia: "alta" | "media" | "baixa") => {
    switch (urgencia) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-300";
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "baixa":
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const getTipoTexto = (tipo: "programado" | "usg" | "dum") => {
    switch (tipo) {
      case "programado":
        return "Parto Programado";
      case "usg":
        return "DPP (Ultrassom)";
      case "dum":
        return "DPP (DUM)";
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-orange-900">Partos Próximos (21 dias)</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          {alertas.length} {alertas.length === 1 ? "gestante com parto previsto" : "gestantes com partos previstos"} nos próximos 21 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.map((alerta) => (
          <Alert key={alerta.gestante.id} className={`${getCorUrgencia(alerta.urgencia)} border`}>
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-foreground mb-1">
                    {alerta.gestante.nome}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {alerta.dataParto.toLocaleDateString("pt-BR")}
                    </div>
                    <Badge variant="outline" className={getCorBadge(alerta.urgencia)}>
                      <Clock className="h-3 w-3 mr-1" />
                      {alerta.diasRestantes} {alerta.diasRestantes === 1 ? "dia" : "dias"}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                      {getTipoTexto(alerta.tipo)}
                    </Badge>
                    {alerta.gestante.tipoPartoDesejado && alerta.gestante.tipoPartoDesejado !== "a_definir" && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
                        {alerta.gestante.tipoPartoDesejado === "cesariana" ? "Cesariana" : "Normal"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
