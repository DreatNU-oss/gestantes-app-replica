import { forwardRef } from "react";
import { IMaskInput } from "react-imask";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Componente de input de telefone com máscara brasileira
 * Aceita formatos: (11) 98765-4321 ou (11) 3456-7890
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = "", onChange, className, ...props }, ref) => {
    return (
      <IMaskInput
        mask="(00) 00000-0000"
        value={value}
        unmask={false} // Mantém a máscara no valor
        onAccept={(value: string) => {
          if (onChange) {
            onChange(value);
          }
        }}
        {...props}
        inputRef={ref}
        placeholder="(00) 00000-0000"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

/**
 * Valida se o telefone está no formato brasileiro correto
 * @param phone - Telefone com ou sem máscara
 * @returns true se válido, false caso contrário
 */
export function isValidBrazilianPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, "");
  
  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  // DDD deve estar entre 11 e 99
  const ddd = parseInt(digits.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  
  // Se for celular (11 dígitos), o primeiro dígito após o DDD deve ser 9
  if (digits.length === 11 && digits[2] !== "9") return false;
  
  return true;
}

/**
 * Formata telefone para o padrão brasileiro
 * @param phone - Telefone com ou sem máscara
 * @returns Telefone formatado: (11) 98765-4321
 */
export function formatBrazilianPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length === 11) {
    // Celular: (11) 98765-4321
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
  } else if (digits.length === 10) {
    // Fixo: (11) 3456-7890
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  
  return phone;
}

/**
 * Remove máscara do telefone, deixando apenas números
 * @param phone - Telefone com máscara
 * @returns Apenas dígitos
 */
export function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}
