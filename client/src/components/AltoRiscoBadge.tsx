import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface AltoRiscoBadgeProps {
  gestanteId: number;
}

export default function AltoRiscoBadge({ gestanteId }: AltoRiscoBadgeProps) {
  const { data: hasRisco, isLoading } = trpc.gestantes.hasAltoRisco.useQuery({ gestanteId });

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">...</span>;
  }

  if (!hasRisco) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Alto Risco
    </Badge>
  );
}
