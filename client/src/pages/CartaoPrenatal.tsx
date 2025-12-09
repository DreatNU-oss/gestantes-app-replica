import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function CartaoPrenatal() {
  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">CartaoPrenatal</h2>
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Esta funcionalidade será implementada em breve</p>
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
