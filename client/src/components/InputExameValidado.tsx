import { Input } from "@/components/ui/input";
import { validarResultado, type TipoAlerta } from "@/data/valoresReferencia";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InputExameValidadoProps {
  nomeExame: string;
  trimestre: 1 | 2 | 3;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Componente de Input com validação visual de resultados de exames
 * Exibe cores e ícones baseados nos valores de referência
 */
export function InputExameValidado({
  nomeExame,
  trimestre,
  value,
  onChange,
  placeholder = "Resultado",
  className = "",
  onKeyDown
}: InputExameValidadoProps) {
  // Validar o resultado atual
  const validacao = validarResultado(nomeExame, value, trimestre);

  // Definir cores e ícones baseados no tipo de alerta
  const getEstiloAlerta = (tipo: TipoAlerta) => {
    switch (tipo) {
      case 'critico':
        return {
          borderColor: 'border-red-500 focus:border-red-600',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          iconBg: 'bg-red-100'
        };
      case 'anormal':
        return {
          borderColor: 'border-orange-500 focus:border-orange-600',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
          iconBg: 'bg-orange-100'
        };
      case 'atencao':
        return {
          borderColor: 'border-yellow-500 focus:border-yellow-600',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          icon: <Info className="h-4 w-4 text-yellow-500" />,
          iconBg: 'bg-yellow-100'
        };
      case 'normal':
      default:
        return {
          borderColor: value && value.trim() !== '' && value !== '-' 
            ? 'border-green-500 focus:border-green-600' 
            : 'border-gray-300',
          bgColor: value && value.trim() !== '' && value !== '-' 
            ? 'bg-green-50' 
            : 'bg-white',
          textColor: 'text-gray-900',
          icon: value && value.trim() !== '' && value !== '-' 
            ? <CheckCircle className="h-4 w-4 text-green-500" /> 
            : null,
          iconBg: 'bg-green-100'
        };
    }
  };

  const estilo = getEstiloAlerta(validacao.tipo);
  const temAlerta = validacao.tipo !== 'normal';

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        data-field-type="resultado"
        data-trimestre={trimestre}
        className={`
          ${className}
          ${estilo.borderColor}
          ${estilo.bgColor}
          ${estilo.textColor}
          ${temAlerta ? 'pr-10' : ''}
          transition-colors duration-200
        `}
      />
      
      {/* Ícone de alerta/validação */}
      {estilo.icon && (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div 
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2 
                  ${estilo.iconBg} 
                  rounded-full p-1 cursor-help
                `}
              >
                {estilo.icon}
              </div>
            </TooltipTrigger>
            {validacao.mensagem && (
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">{validacao.mensagem}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
