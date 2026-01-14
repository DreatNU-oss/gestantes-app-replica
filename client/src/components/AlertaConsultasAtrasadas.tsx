import { AlertTriangle, Calendar, Clock, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useGestanteAtiva } from "@/contexts/GestanteAtivaContext";

interface GestanteAlerta {
  gestante: {
    id: number;
    nome: string;
    telefone?: string | null;
  };
  ultimaConsulta: Date | null;
  diasSemConsulta: number;
}

export function AlertaConsultasAtrasadas() {
  const [, setLocation] = useLocation();
  const { setGestanteAtiva } = useGestanteAtiva();
  
  const { data: gestantesAtrasadas, isLoading } = trpc.gestantes.semConsultaRecente.useQuery({ 
    diasLimite: 35 
  });

  const formatarData = (date: Date | null): string => {
    if (!date) return "Nunca consultou";
    const d = new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const handleVerDetalhes = (gestante: GestanteAlerta['gestante']) => {
    setGestanteAtiva({
      id: gestante.id,
      nome: gestante.nome
    });
    setLocation("/agendamento");
  };

  if (isLoading) {
    return null;
  }

  if (!gestantesAtrasadas || gestantesAtrasadas.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Gestantes sem Consulta há mais de 35 dias
          <Badge variant="destructive" className="ml-2">
            {gestantesAtrasadas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {gestantesAtrasadas.slice(0, 5).map((item: GestanteAlerta) => (
            <div 
              key={item.gestante.id} 
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.gestante.nome}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Última: {formatarData(item.ultimaConsulta)}
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {item.diasSemConsulta === Infinity ? "Sem consultas" : `${item.diasSemConsulta} dias`}
                  </span>
                  {item.gestante.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {item.gestante.telefone}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleVerDetalhes(item.gestante)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Agendar
              </Button>
            </div>
          ))}
          
          {gestantesAtrasadas.length > 5 && (
            <p className="text-sm text-orange-700 text-center pt-2">
              E mais {gestantesAtrasadas.length - 5} gestante(s) com consultas atrasadas...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
