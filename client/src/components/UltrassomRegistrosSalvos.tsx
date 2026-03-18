import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UltrassomRegistrosSalvosProps {
  registros: any[];
  editingId: number | null;
  tipoUltrassom: string;
  tipoLabel: string;
  onEditar: (us: any) => void;
  onNovo: () => void;
  onApagar: (tipoUltrassom: string, usId: number) => void;
  isDeleting?: boolean;
}

export function UltrassomRegistrosSalvos({
  registros,
  editingId,
  tipoUltrassom,
  tipoLabel,
  onEditar,
  onNovo,
  onApagar,
  isDeleting,
}: UltrassomRegistrosSalvosProps) {
  if (registros.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">
          {registros.length} registro{registros.length > 1 ? 's' : ''} salvo{registros.length > 1 ? 's' : ''}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onNovo}
          className={!editingId ? 'border-green-500 text-green-700 bg-green-50' : ''}
        >
          <Plus className="mr-1 h-3 w-3" />
          Novo {tipoLabel}
        </Button>
      </div>
      <div className="space-y-2">
        {registros.map((us: any) => (
          <div
            key={us.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              editingId === us.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {editingId === us.id && (
                <Badge variant="default" className="text-xs">Editando</Badge>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {us.dataExame
                    ? new Date(us.dataExame + 'T12:00:00').toLocaleDateString('pt-BR')
                    : 'Sem data'}
                </span>
              </div>
              {us.idadeGestacional && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>IG: {us.idadeGestacional}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {editingId !== us.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditar(us)}
                  className="h-8 px-2"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar {tipoLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Os dados deste ultrassom de{' '}
                      {us.dataExame
                        ? new Date(us.dataExame + 'T12:00:00').toLocaleDateString('pt-BR')
                        : 'sem data'}{' '}
                      serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => onApagar(tipoUltrassom, us.id)}
                    >
                      Apagar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
