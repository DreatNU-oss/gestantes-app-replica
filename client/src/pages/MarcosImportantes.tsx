import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Calendar, Baby, Syringe, Activity, CheckCircle2 } from "lucide-react";

type MetodoCalculo = "dum" | "ultrassom";

export default function MarcosImportantes() {
  const [gestanteSelecionada, setGestanteSelecionada] = useState<string>("");
  const [metodo, setMetodo] = useState<MetodoCalculo>("ultrassom");

  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery();

  const gestante = gestantes?.find((g) => g.id.toString() === gestanteSelecionada);

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatIG = (ig: { semanas: number; dias: number } | null) => {
    if (!ig) return "-";
    return `${ig.semanas}s ${ig.dias}d`;
  };

  // Calcula data para uma semana específica pela DUM
  const calcularDataPorDUM = (semanas: number, dias: number = 0) => {
    if (!gestante?.dum) return null;
    const dum = new Date(gestante.dum);
    const totalDias = semanas * 7 + dias;
    const dataAlvo = new Date(dum);
    dataAlvo.setDate(dataAlvo.getDate() + totalDias);
    return dataAlvo;
  };

  // Calcula data para uma semana específica pelo Ultrassom
  const calcularDataPorUS = (semanas: number, dias: number = 0) => {
    if (!gestante?.dataUltrassom || gestante?.igUltrassomSemanas === null || gestante?.igUltrassomDias === null) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
    const diasDesdeUS = semanas * 7 + dias - igUltrassomDias;
    const dataAlvo = new Date(dataUS);
    dataAlvo.setDate(dataAlvo.getDate() + diasDesdeUS);
    return dataAlvo;
  };

  // Calcula DPP pelo ultrassom
  const calcularDppUS = () => {
    if (gestante?.igUltrassomSemanas === null || gestante?.igUltrassomDias === null || !gestante?.dataUltrassom) return null;
    const dataUS = new Date(gestante.dataUltrassom);
    const igUltrassomDias = (gestante.igUltrassomSemanas * 7) + gestante.igUltrassomDias;
    const diasRestantes = 280 - igUltrassomDias;
    const dpp = new Date(dataUS);
    dpp.setDate(dpp.getDate() + diasRestantes);
    return dpp;
  };

  const calcularData = (semanas: number, dias: number = 0) => {
    return metodo === "dum" ? calcularDataPorDUM(semanas, dias) : calcularDataPorUS(semanas, dias);
  };

  const marcos = [
    {
      titulo: "Data da Concepção",
      descricao: "2 semanas de idade gestacional",
      icon: Baby,
      semanas: 2,
      dias: 0,
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      titulo: "Morfológico de Primeiro Trimestre",
      descricao: "Período ideal: 11 semanas e 5 dias a 13 semanas e 3 dias",
      icon: Activity,
      semanas: [11, 13],
      dias: [5, 3],
      color: "bg-blue-100 text-blue-700 border-blue-300",
      isRange: true,
    },
    {
      titulo: "13 Semanas de Gestação",
      descricao: "Fim do primeiro trimestre",
      icon: CheckCircle2,
      semanas: 13,
      dias: 0,
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      titulo: "Morfológico de Segundo Trimestre",
      descricao: "Período ideal: 20 semanas a 24 semanas e 6 dias",
      icon: Activity,
      semanas: [20, 24],
      dias: [0, 6],
      color: "bg-blue-100 text-blue-700 border-blue-300",
      isRange: true,
    },
    {
      titulo: "Vacina dTpa",
      descricao: "Recomendada entre 27 e 36 semanas",
      icon: Syringe,
      semanas: 27,
      dias: 0,
      color: "bg-amber-100 text-amber-700 border-amber-300",
    },
    {
      titulo: "Data Provável do Parto",
      descricao: "40 semanas de gestação",
      icon: Calendar,
      semanas: 40,
      dias: 0,
      color: "bg-rose-100 text-rose-700 border-rose-300",
    },
  ];

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Marcos Importantes</h2>
          <p className="text-muted-foreground">
            Visualize as datas importantes da gestação
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Gestante e Método de Cálculo</CardTitle>
            <CardDescription>
              Escolha a gestante e o método para calcular as datas dos marcos importantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gestante">Gestante</Label>
                <Select value={gestanteSelecionada} onValueChange={setGestanteSelecionada}>
                  <SelectTrigger id="gestante">
                    <SelectValue placeholder="Selecione uma gestante..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gestantes?.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Método de Cálculo</Label>
                <RadioGroup value={metodo} onValueChange={(v: MetodoCalculo) => setMetodo(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dum" id="dum" />
                    <Label htmlFor="dum" className="font-normal cursor-pointer">
                      DUM (Data da Última Menstruação)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ultrassom" id="ultrassom" />
                    <Label htmlFor="ultrassom" className="font-normal cursor-pointer">
                      Ultrassom
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {gestante && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Idade Gestacional (DUM)</p>
                  <p className="text-lg font-semibold">{formatIG(gestante.calculado?.igDUM)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idade Gestacional (US)</p>
                  <p className="text-lg font-semibold">{formatIG(gestante.calculado?.igUS)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DPP pela DUM</p>
                  <p className="text-lg font-semibold">
                    {gestante.calculado?.dpp ? new Date(gestante.calculado.dpp).toLocaleDateString('pt-BR') : "-"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {gestante && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marcos.map((marco, idx) => {
              const Icon = marco.icon;
              let dataInicio = null;
              let dataFim = null;

              if (marco.isRange && Array.isArray(marco.semanas) && Array.isArray(marco.dias)) {
                dataInicio = calcularData(marco.semanas[0], marco.dias[0]);
                dataFim = calcularData(marco.semanas[1], marco.dias[1]);
              } else if (typeof marco.semanas === 'number' && typeof marco.dias === 'number') {
                dataInicio = calcularData(marco.semanas, marco.dias);
              }

              return (
                <Card key={idx} className={`border-2 ${marco.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Icon className="h-6 w-6" />
                      <Badge variant="outline" className={marco.color}>
                        {marco.isRange && Array.isArray(marco.semanas)
                          ? `${marco.semanas[0]}s${marco.dias[0]}d - ${marco.semanas[1]}s${marco.dias[1]}d`
                          : `${marco.semanas}s${marco.dias}d`}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{marco.titulo}</CardTitle>
                    <CardDescription className="text-xs">{marco.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {marco.isRange ? (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Início:</span>
                          <span className="text-sm font-medium">{dataInicio ? dataInicio.toLocaleDateString('pt-BR') : "-"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Fim:</span>
                          <span className="text-sm font-medium">{dataFim ? dataFim.toLocaleDateString('pt-BR') : "-"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {dataInicio ? formatDate(dataInicio) : "-"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!gestante && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Selecione uma gestante para visualizar os marcos importantes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </GestantesLayout>
  );
}
