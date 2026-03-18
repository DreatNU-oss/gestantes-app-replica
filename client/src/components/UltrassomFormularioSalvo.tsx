import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TextareaComAutocomplete } from '@/components/TextareaComAutocomplete';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Trash2, Calendar, Clock } from 'lucide-react';
import { normalizarIdadeGestacional } from '@shared/igNormalization';
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

interface FieldConfig {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date' | 'textarea';
  required?: boolean;
  autocompleteType?: string;
  rows?: number;
  colSpan?: number; // 1, 2, or 3 (within a grid)
}

interface UltrassomFormularioSalvoProps {
  registro: any;
  tipoUltrassom: string;
  tipoLabel: string;
  fields: FieldConfig[];
  gridCols?: number;
  onSalvar: (tipoUltrassom: string, dados: any) => Promise<void>;
  onApagar: (tipoUltrassom: string, usId: number) => void;
  isSaving: boolean;
  isDeleting: boolean;
  index: number; // For display numbering
}

export function UltrassomFormularioSalvo({
  registro,
  tipoUltrassom,
  tipoLabel,
  fields,
  onSalvar,
  onApagar,
  isSaving,
  isDeleting,
  index,
}: UltrassomFormularioSalvoProps) {
  // Local state for this specific record's form data
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data from the registro
  useEffect(() => {
    const dados = registro.dados || {};
    const initial: Record<string, string> = {};
    fields.forEach(f => {
      if (f.key === 'dataExame') {
        initial[f.key] = registro.dataExame || '';
      } else if (f.key === 'idadeGestacional') {
        initial[f.key] = registro.idadeGestacional || '';
      } else {
        initial[f.key] = dados[f.key] || '';
      }
    });
    setFormData(initial);
    setIsDirty(false);
  }, [registro.id]);

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSalvar = async () => {
    await onSalvar(tipoUltrassom, { ...formData, _editingId: registro.id });
    setIsDirty(false);
  };

  const dataFormatada = registro.dataExame
    ? new Date(registro.dataExame + 'T12:00:00').toLocaleDateString('pt-BR')
    : 'Sem data';

  // Group fields into rows based on their position
  const renderFields = () => {
    const rows: FieldConfig[][] = [];
    let currentRow: FieldConfig[] = [];
    let currentColCount = 0;

    fields.forEach(field => {
      const span = field.colSpan || 1;
      if (currentColCount + span > 3) {
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [field];
        currentColCount = span;
      } else {
        currentRow.push(field);
        currentColCount += span;
      }
    });
    if (currentRow.length > 0) rows.push(currentRow);

    return rows.map((row, rowIdx) => {
      const totalSpan = row.reduce((sum, f) => sum + (f.colSpan || 1), 0);
      const gridClass = totalSpan === 1 ? '' : totalSpan === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4';

      return (
        <div key={rowIdx} className={gridClass}>
          {row.map(field => (
            <div key={field.key} className={field.colSpan === 3 ? 'col-span-3' : field.colSpan === 2 ? 'col-span-2' : ''}>
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'textarea' ? (
                <TextareaComAutocomplete
                  placeholder={field.placeholder || ''}
                  value={formData[field.key] || ''}
                  onChange={(val) => updateField(field.key, val)}
                  tipo={field.autocompleteType as any || ''}
                  rows={field.rows || 3}
                />
              ) : (
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder || ''}
                  value={formData[field.key] || ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  onBlur={field.key === 'idadeGestacional' ? (e) => {
                    const normalizado = normalizarIdadeGestacional(e.target.value);
                    if (normalizado !== e.target.value) updateField(field.key, normalizado);
                  } : undefined}
                />
              )}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      {/* Header with date, IG, and index */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-medium">
            #{index}
          </Badge>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{dataFormatada}</span>
          </div>
          {registro.idadeGestacional && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>IG: {registro.idadeGestacional}</span>
            </div>
          )}
          {isDirty && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              Modificado
            </Badge>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Apagar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar {tipoLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Os dados deste ultrassom de{' '}
                {dataFormatada} serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => onApagar(tipoUltrassom, registro.id)}
              >
                Apagar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      {/* Form fields */}
      {renderFields()}

      {/* Save button */}
      {isDirty && (
        <Button
          onClick={handleSalvar}
          disabled={isSaving}
          size="sm"
          variant="outline"
          className="border-primary text-primary"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Salvando...' : `Atualizar ${tipoLabel}`}
        </Button>
      )}
    </div>
  );
}
