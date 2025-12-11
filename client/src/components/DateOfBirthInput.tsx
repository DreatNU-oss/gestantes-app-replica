import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar, AlertCircle } from "lucide-react";

interface DateOfBirthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  showAge?: boolean;
  minAge?: number;
  maxAge?: number;
}

/**
 * Componente de input de data de nascimento com cálculo automático de idade
 * Valida idade mínima e máxima e mostra a idade calculada
 */
export const DateOfBirthInput = forwardRef<HTMLInputElement, DateOfBirthInputProps>(
  ({ 
    value = "", 
    onChange, 
    className, 
    showAge = true,
    minAge = 10,
    maxAge = 60,
    ...props 
  }, ref) => {
    const [age, setAge] = useState<number | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isTouched, setIsTouched] = useState(false);

    useEffect(() => {
      if (value && isTouched) {
        const calculatedAge = calculateAge(value);
        setAge(calculatedAge);
        
        if (calculatedAge !== null) {
          setIsValid(calculatedAge >= minAge && calculatedAge <= maxAge);
        } else {
          setIsValid(null);
        }
      } else if (!value) {
        setAge(null);
        setIsValid(null);
      }
    }, [value, isTouched, minAge, maxAge]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      }
    };

    const handleBlur = () => {
      setIsTouched(true);
      if (value) {
        const calculatedAge = calculateAge(value);
        setAge(calculatedAge);
        
        if (calculatedAge !== null) {
          setIsValid(calculatedAge >= minAge && calculatedAge <= maxAge);
        }
      }
    };

    const getValidationColor = () => {
      if (!isTouched || !value) return "";
      if (isValid === true) return "border-green-500 focus-visible:ring-green-500";
      if (isValid === false) return "border-red-500 focus-visible:ring-red-500";
      return "";
    };

    const getErrorMessage = () => {
      if (!isTouched || !value || isValid !== false || age === null) return null;
      
      if (age < minAge) {
        return `Idade mínima: ${minAge} anos (idade atual: ${age} anos)`;
      }
      if (age > maxAge) {
        return `Idade máxima: ${maxAge} anos (idade atual: ${age} anos)`;
      }
      return null;
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <Input
            ref={ref}
            type="date"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "pl-10",
              getValidationColor(),
              className
            )}
            {...props}
          />
        </div>
        
        {showAge && age !== null && (
          <div className={cn(
            "text-sm flex items-center gap-1",
            isValid === true && "text-green-600",
            isValid === false && "text-red-600",
            isValid === null && "text-muted-foreground"
          )}>
            {isValid === false && <AlertCircle className="h-3 w-3" />}
            <span>Idade: {age} anos</span>
          </div>
        )}
        
        {getErrorMessage() && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {getErrorMessage()}
          </p>
        )}
      </div>
    );
  }
);

DateOfBirthInput.displayName = "DateOfBirthInput";

/**
 * Calcula a idade em anos a partir de uma data de nascimento
 * @param dateOfBirth - Data de nascimento no formato YYYY-MM-DD
 * @returns Idade em anos ou null se a data for inválida
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    
    // Verifica se a data é válida
    if (isNaN(birth.getTime())) return null;
    
    // Verifica se a data não é futura
    if (birth > today) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Ajusta se ainda não fez aniversário este ano
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

/**
 * Valida se a idade está dentro de um intervalo permitido
 * @param dateOfBirth - Data de nascimento no formato YYYY-MM-DD
 * @param minAge - Idade mínima permitida
 * @param maxAge - Idade máxima permitida
 * @returns true se válido, false caso contrário
 */
export function isValidAge(
  dateOfBirth: string | null | undefined,
  minAge: number = 10,
  maxAge: number = 60
): boolean {
  const age = calculateAge(dateOfBirth);
  if (age === null) return false;
  return age >= minAge && age <= maxAge;
}
