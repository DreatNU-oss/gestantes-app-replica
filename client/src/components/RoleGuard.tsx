import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { toast } from "sonner";

type UserRole = "superadmin" | "admin" | "obstetra" | "secretaria";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Componente que protege rotas baseado no role do usuário.
 * Se o usuário não tem o role necessário, redireciona para /dashboard com um toast.
 */
export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const userRole = (user as any)?.role as UserRole | undefined;

  useEffect(() => {
    if (loading) return;
    if (!user) return; // Auth redirect handled elsewhere
    if (userRole && !allowedRoles.includes(userRole)) {
      toast.error("Você não tem permissão para acessar esta página.");
      setLocation("/dashboard");
    }
  }, [loading, user, userRole, allowedRoles, setLocation]);

  if (loading) return null;
  if (!user) return null;
  if (userRole && !allowedRoles.includes(userRole)) return null;

  return <>{children}</>;
}
