import { AlertTriangle, Calendar, Clock, Phone, Baby } from "lucide-react";
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
  igAtual: { semanas: number; dias: number; totalDias: number } | null;
  limiteDias: number;
  faixaIG: string;
}

export function AlertaConsultasAtrasadas() {
  const [, setLocation] = useLocation();
  const { setGestanteAtiva } = useGestanteAtiva();
  
  const { data: gestantesAtrasadas, isLoading } = trpc.gestantes.semConsultaRecente.useQuery();

  const formatarData = (date: Date | null): string => {
    if (!date) return "Nunca consultou";
    const d = new Date(date);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarIG = (ig: { semanas: number; dias: number } | null): string => {
    if (!ig) return "IG não informada";
    return `${ig.semanas}s ${ig.dias}d`;
  };

  const handleVerDetalhes = (gestante: GestanteAlerta['gestante']) => {
    setGestanteAtiva({
      id: gestante.id,
      nome: gestante.nome
    });
    setLocation("/agendamento");
  };

  // Função para determinar a cor do badge baseado na faixa de IG
  const getBadgeColor = (faixaIG: string): string => {
    switch (faixaIG) {
      case 'Após 36 semanas':
        return 'bg-red-100 text-red-800 border-red-300';
      case '34-36 semanas':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  // Função para determinar a cor do card baseado na urgência
  const getCardColor = (faixaIG: string): string => {
    switch (faixaIG) {
      case 'Após 36 semanas':
        return 'border-red-300 bg-red-50';
      case '34-36 semanas':
        return 'border-orange-300 bg-orange-50';
      default:
        return 'border-yellow-300 bg-yellow-50';
    }
  };

  if (isLoading) {
    return null;
  }

  if (!gestantesAtrasadas || gestantesAtrasadas.length === 0) {
    return null;
  }

  // Agrupar por faixa de IG para melhor visualização
  const gestantesPorFaixa = {
    'Após 36 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === 'Após 36 semanas'),
    '34-36 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === '34-36 semanas'),
    'Até 34 semanas': gestantesAtrasadas.filter((g: GestanteAlerta) => g.faixaIG === 'Até 34 semanas' || g.faixaIG === 'Sem IG'),
  };

  return (
    <Card className="border-orange-300 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Gestantes com Consulta Atrasada
          <Badge variant="destructive" className="ml-2">
            {gestantesAtrasadas.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-orange-700 mt-1">
          Limite dinâmico: até 34 sem (35 dias) | 34-36 sem (15 dias) | após 36 sem (8 dias)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gestantes após 36 semanas - URGENTE */}
          {gestantesPorFaixa['Após 36 semanas'].length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                Após 36 semanas - URGENTE (limite: 8 dias)
              </h4>
              {gestantesPorFaixa['Após 36 semanas'].map((item: GestanteAlerta) => (
                <div 
                  key={item.gestante.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.gestante.nome}</p>
                      <Badge variant="outline" className={getBadgeColor(item.faixaIG)}>
                        <Baby className="h-3 w-3 mr-1" />
                        {formatarIG(item.igAtual)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Última: {formatarData(item.ultimaConsulta)}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 font-medium">
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
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Agendar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Gestantes 34-36 semanas - ATENÇÃO */}
          {gestantesPorFaixa['34-36 semanas'].length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
                34-36 semanas - ATENÇÃO (limite: 15 dias)
              </h4>
              {gestantesPorFaixa['34-36 semanas'].map((item: GestanteAlerta) => (
                <div 
                  key={item.gestante.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.gestante.nome}</p>
                      <Badge variant="outline" className={getBadgeColor(item.faixaIG)}>
                        <Baby className="h-3 w-3 mr-1" />
                        {formatarIG(item.igAtual)}
                      </Badge>
                    </div>
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
            </div>
          )}

          {/* Gestantes até 34 semanas */}
          {gestantesPorFaixa['Até 34 semanas'].length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                Até 34 semanas (limite: 35 dias)
              </h4>
              {gestantesPorFaixa['Até 34 semanas'].slice(0, 5).map((item: GestanteAlerta) => (
                <div 
                  key={item.gestante.id} 
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{item.gestante.nome}</p>
                      <Badge variant="outline" className={getBadgeColor(item.faixaIG)}>
                        <Baby className="h-3 w-3 mr-1" />
                        {formatarIG(item.igAtual)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Última: {formatarData(item.ultimaConsulta)}
                      </span>
                      <span className="flex items-center gap-1 text-yellow-700 font-medium">
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
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    Agendar
                  </Button>
                </div>
              ))}
              
              {gestantesPorFaixa['Até 34 semanas'].length > 5 && (
                <p className="text-sm text-yellow-700 text-center pt-2">
                  E mais {gestantesPorFaixa['Até 34 semanas'].length - 5} gestante(s) nesta faixa...
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
