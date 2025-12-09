import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function MarcosImportantes() {
  return (
    <GestantesLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Marcos Importantes</h2>
          <p className="text-muted-foreground">Em desenvolvimento</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
