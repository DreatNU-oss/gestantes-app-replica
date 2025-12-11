import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Mail } from "lucide-react";

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  showValidation?: boolean;
}

/**
 * Componente de input de e-mail com validação visual em tempo real
 * Mostra ícone de check (verde) para e-mails válidos e X (vermelho) para inválidos
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ value = "", onChange, className, showValidation = true, ...props }, ref) => {
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isTouched, setIsTouched] = useState(false);

    useEffect(() => {
      if (value && isTouched) {
        setIsValid(isValidEmail(value));
      } else if (!value) {
        setIsValid(null);
      }
    }, [value, isTouched]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      }
    };

    const handleBlur = () => {
      setIsTouched(true);
      if (value) {
        setIsValid(isValidEmail(value));
      }
    };

    const getValidationIcon = () => {
      if (!showValidation || !isTouched || !value) return null;

      if (isValid === true) {
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      } else if (isValid === false) {
        return <XCircle className="h-5 w-5 text-red-600" />;
      }
      return null;
    };

    const getValidationColor = () => {
      if (!isTouched || !value) return "";
      if (isValid === true) return "border-green-500 focus-visible:ring-green-500";
      if (isValid === false) return "border-red-500 focus-visible:ring-red-500";
      return "";
    };

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Mail className="h-4 w-4" />
        </div>
        <Input
          ref={ref}
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="exemplo@email.com"
          className={cn(
            "pl-10 pr-10",
            getValidationColor(),
            className
          )}
          {...props}
        />
        {showValidation && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
        {isTouched && value && isValid === false && (
          <p className="text-xs text-red-600 mt-1">
            Por favor, insira um e-mail válido
          </p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

/**
 * Valida se o e-mail está em formato válido
 * @param email - E-mail a ser validado
 * @returns true se válido, false caso contrário
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  // Regex padrão para validação de e-mail (RFC 5322 simplificado)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email.trim());
}

/**
 * Normaliza e-mail para lowercase e remove espaços
 * @param email - E-mail a ser normalizado
 * @returns E-mail normalizado
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}
