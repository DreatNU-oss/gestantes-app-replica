import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Gestante {
  id: number;
  nome: string;
  tipoPartoDesejado: string | null;
  dum?: string | Date | null;
  dataUltrassom?: string | Date | null;
  igUltrassomSemanas?: number | null;
  igUltrassomDias?: number | null;
  dataPartoProgramado?: string | Date | null;
  medicoId?: number | null;
}

interface Medico {
  id: number;
  nome: string;
}

interface AlertaParto {
  gestante: Gestante;
  dataParto: Date;
  diasRestantes: number;
  tipo: "programado" | "usg" | "dum";
  medico: Medico | undefined;
  posDataismo: boolean;
  diasPosDataismo: number;
}

export function AlertasPartosProximos({ 
  gestantes, 
  medicos = [],
  onRegistrarParto
}: { 
  gestantes: Gestante[];
  medicos?: Medico[];
  onRegistrarParto?: (gestanteId: number) => void;
}) {
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
    dpp.setDate(dpp.getDate() + diasRestantes + 1); // +1 para contar o dia do US
    return dpp;
  };

  const parseLocalDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) {
      // Se for Date object do banco, extrair apenas ano/mês/dia e criar nova data local
      const year = dateStr.getUTCFullYear();
      const month = dateStr.getUTCMonth();
      const day = dateStr.getUTCDate();
      return new Date(year, month, day, 12, 0, 0);
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const formatarDataSegura = (date: Date): string => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const obterDataParto = (gestante: Gestante): { data: Date; tipo: "programado" | "usg" | "dum" } | null => {
    // Prioridade 1: Parto Programado
    if (gestante.dataPartoProgramado) {
      const dataParsed = parseLocalDate(gestante.dataPartoProgramado as string);
      return { data: dataParsed, tipo: "programado" };
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

  const getCorDias = (diasRestantes: number, posDataismo: boolean): string => {
    if (posDataismo) return "bg-red-600 text-white";
    if (diasRestantes <= 0) return "bg-red-500 text-white";
    if (diasRestantes <= 5) return "bg-orange-500 text-white";
    if (diasRestantes <= 8) return "bg-green-500 text-white";
    if (diasRestantes <= 10) return "bg-green-600 text-white";
    if (diasRestantes <= 17) return "bg-green-700 text-white";
    return "bg-green-800 text-white";
  };

  const getCorFundoCard = (diasRestantes: number, posDataismo: boolean): string => {
    if (posDataismo) return "bg-red-50 border-red-400";
    if (diasRestantes <= 0) return "bg-red-50 border-red-300";
    if (diasRestantes <= 5) return "bg-orange-50 border-orange-300";
    if (diasRestantes <= 8) return "bg-green-50 border-green-300";
    if (diasRestantes <= 10) return "bg-emerald-50 border-emerald-300";
    if (diasRestantes <= 17) return "bg-teal-50 border-teal-300";
    return "bg-cyan-50 border-cyan-300";
  };

  const calcularIdadeGestacional = (gestante: Gestante): number | null => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Priorizar IG por US
    if (gestante.dataUltrassom && gestante.igUltrassomSemanas !== null) {
      const dataUS = new Date(gestante.dataUltrassom);
      dataUS.setHours(0, 0, 0, 0);
      // Correção: subtrair 1 dia para não contar o dia do ultrassom
      const diasDesdeUS = Math.floor((hoje.getTime() - dataUS.getTime()) / (1000 * 60 * 60 * 24));
      const diasGestacaoUS = (gestante.igUltrassomSemanas * 7) + (gestante.igUltrassomDias || 0);
      // Subtrair 1 dia do total para corrigir contagem inclusiva
      return diasGestacaoUS + diasDesdeUS - 1;
    }

    // Fallback para DUM
    if (gestante.dum) {
      const dum = new Date(gestante.dum);
      dum.setHours(0, 0, 0, 0);
      // Subtrair 1 dia para corrigir contagem inclusiva
      return Math.floor((hoje.getTime() - dum.getTime()) / (1000 * 60 * 60 * 24)) - 1;
    }

    return null;
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

      // Calcular IG atual para detectar pós-datismo
      const igAtualDias = calcularIdadeGestacional(gestante);
      const posDataismo = igAtualDias !== null && igAtualDias >= 280; // 40 semanas = 280 dias
      const diasPosDataismo = igAtualDias !== null ? Math.max(0, igAtualDias - 280) : 0;

      // Manter no alerta até que o parto seja registrado
      // Filtrar apenas se ainda não passou muito tempo (até 30 dias após a data prevista)
      if (diasRestantes < -30 || diasRestantes > 21) return null;

      const medico = medicos.find(m => m.id === gestante.medicoId);

      return {
        gestante,
        dataParto: resultado.data,
        diasRestantes,
        tipo: resultado.tipo,
        medico,
        posDataismo,
        diasPosDataismo,
      };
    })
    .filter((alerta): alerta is AlertaParto => alerta !== null)
    .sort((a, b) => {
      // Priorizar pós-datismo no topo
      if (a.posDataismo && !b.posDataismo) return -1;
      if (!a.posDataismo && b.posDataismo) return 1;
      return a.diasRestantes - b.diasRestantes;
    });

  if (alertas.length === 0) {
    return null;
  }

  const getTipoTexto = (tipo: "programado" | "usg" | "dum") => {
    switch (tipo) {
      case "programado":
        return "Programado";
      case "usg":
        return "DPP US";
      case "dum":
        return "DPP DUM";
    }
  };

  const getTipoPartoTexto = (tipo: string | null) => {
    if (!tipo) return "A Definir";
    switch (tipo) {
      case "normal":
        return "Normal";
      case "cesariana":
        return "Cesárea";
      default:
        return "A Definir";
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">Alertas de Partos Próximos</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          {alertas.length} {alertas.length === 1 ? "gestante com parto previsto" : "gestantes com parto previsto"} nos próximos 21 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {alertas.map((alerta) => (
            <div 
              key={alerta.gestante.id} 
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${getCorFundoCard(alerta.diasRestantes, alerta.posDataismo)}`}
            >
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">
                {alerta.gestante.nome}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatarDataSegura(alerta.dataParto)}
                </div>
                {alerta.medico && (
                  <span>Médico: {alerta.medico.nome}</span>
                )}
                <span>Tipo: {getTipoPartoTexto(alerta.gestante.tipoPartoDesejado)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getCorDias(alerta.diasRestantes, alerta.posDataismo)} font-semibold px-2 py-1 whitespace-nowrap`}>
                {alerta.posDataismo ? (
                  <span>Pós-datismo: {alerta.diasPosDataismo} {alerta.diasPosDataismo === 1 ? "dia" : "dias"}</span>
                ) : alerta.diasRestantes <= 0 && alerta.tipo === "programado" ? (
                  <span>{Math.abs(alerta.diasRestantes)} {Math.abs(alerta.diasRestantes) === 1 ? "dia" : "dias"} após programado</span>
                ) : alerta.diasRestantes === 0 ? (
                  <span>Hoje</span>
                ) : (
                  <span>{alerta.diasRestantes} {alerta.diasRestantes === 1 ? "dia" : "dias"}</span>
                )}
              </Badge>
              <Badge 
                variant="outline" 
                className={alerta.tipo === "programado" ? "bg-purple-100 text-purple-800 border-purple-300" : "bg-blue-100 text-blue-800 border-blue-300"}
              >
                {getTipoTexto(alerta.tipo)}
              </Badge>
              {onRegistrarParto && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  onClick={() => onRegistrarParto(alerta.gestante.id)}
                  title="Registrar Parto"
                >
                  <Baby className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
