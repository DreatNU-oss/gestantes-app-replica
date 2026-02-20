import GestantesLayout from "@/components/GestantesLayout";
import { GraficoDistribuicaoPartos } from "@/components/GraficoDistribuicaoPartos";
import { GraficoMorfologicos } from "@/components/GraficoMorfologicos";
import { GraficoTiposPartosDesejados } from "@/components/GraficoTiposPartosDesejados";
import { GraficoConvenios } from "@/components/GraficoConvenios";
import { GraficoMotivosCesarea } from "@/components/GraficoMotivosCesarea";
import { GraficoAbortamentos } from "@/components/GraficoAbortamentos";
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
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
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
            <GraficoMotivosCesarea />
            <GraficoConvenios />
            <GraficoAbortamentos />
          </>
        )}
      </div>
    </GestantesLayout>
  );
}
