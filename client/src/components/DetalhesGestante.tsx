import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";

interface DetalhesGestanteProps {
  gestanteId: number;
  onClose: () => void;
  onEdit: () => void;
}

export default function DetalhesGestante({
  gestanteId,
  onClose,
  onEdit,
}: DetalhesGestanteProps) {
  const { data: gestante, isLoading } = trpc.gestantes.get.useQuery({ id: gestanteId });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!gestante) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Gestante não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">{gestante.nome}</h2>
            <p className="text-muted-foreground">Detalhes da gestante</p>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Nome:</span>
              <p className="text-foreground">{gestante.nome}</p>
            </div>
            {gestante.calculado?.idade && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Idade:</span>
                <p className="text-foreground">{gestante.calculado.idade} anos</p>
              </div>
            )}
            {gestante.telefone && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Telefone:</span>
                <p className="text-foreground">{gestante.telefone}</p>
              </div>
            )}
            {gestante.email && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">E-mail:</span>
                <p className="text-foreground">{gestante.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idade Gestacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gestante.calculado?.igDUM && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">IG pela DUM:</span>
                <p className="text-foreground text-lg font-semibold">
                  {gestante.calculado.igDUM.semanas}s{gestante.calculado.igDUM.dias}d
                </p>
              </div>
            )}
            {gestante.calculado?.igUS && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">IG pelo Ultrassom:</span>
                <p className="text-foreground text-lg font-semibold">
                  {gestante.calculado.igUS.semanas}s{gestante.calculado.igUS.dias}d
                </p>
              </div>
            )}
            {gestante.calculado?.dpp && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Data Provável do Parto:</span>
                <p className="text-foreground text-lg font-semibold">
                  {new Date(gestante.calculado.dpp).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>História Obstétrica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-5 gap-2">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Gesta</span>
                <p className="text-foreground font-semibold">{gestante.gesta || "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Para</span>
                <p className="text-foreground font-semibold">{gestante.para || "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Normais</span>
                <p className="text-foreground font-semibold">{gestante.partosNormais || "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Cesáreas</span>
                <p className="text-foreground font-semibold">{gestante.cesareas || "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Abortos</span>
                <p className="text-foreground font-semibold">{gestante.abortos || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados Administrativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {gestante.carteirinhaUnimed && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Carteirinha:</span>
                <p className="text-foreground">{gestante.carteirinhaUnimed}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-muted-foreground">Tipo de Parto:</span>
              <p className="text-foreground capitalize">
                {gestante.tipoPartoDesejado === "a_definir" ? "A definir" : gestante.tipoPartoDesejado}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
