import GestantesLayout from "@/components/GestantesLayout";
import { GraficoDistribuicaoPartos } from "@/components/GraficoDistribuicaoPartos";
import { GraficoMorfologicos } from "@/components/GraficoMorfologicos";
import { GraficoTiposPartosDesejados } from "@/components/GraficoTiposPartosDesejados";
import { GraficoConvenios } from "@/components/GraficoConvenios";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Estatisticas() {
  const { data: gestantes, isLoading } = trpc.gestantes.list.useQuery();
  const [, setLocation] = useLocation();

  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estatísticas</h1>
            <p className="text-muted-foreground mt-1">
              Visualize dados e estatísticas do pré-natal
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        ) : (
          <>
            <GraficoDistribuicaoPartos gestantes={gestantes || []} />
            <GraficoMorfologicos gestantes={gestantes || []} />
            <GraficoTiposPartosDesejados />
            <GraficoConvenios />
          </>
        )}
      </div>
    </GestantesLayout>
  );
}
