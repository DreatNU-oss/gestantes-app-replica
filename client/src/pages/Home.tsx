import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Calendar, Calculator } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100">
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img src="/logo-vertical.png" alt="Mais Mulher - Clínica de Saúde Feminina" className="h-32 w-auto" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              APP Gestantes
            </h1>
            <p className="text-xl text-muted-foreground">
              Sistema completo para acompanhamento e gestão de gestantes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Calendar className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Cálculo por DUM</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Calcule automaticamente a idade gestacional baseada na Data da Última Menstruação
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Cálculo por Ultrassom</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Determine a idade gestacional com base nos dados do primeiro ultrassom
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Baby className="w-8 h-8 text-primary mb-2" />
                <CardTitle className="text-lg">Gestão Completa</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Cadastre, acompanhe e gerencie todas as suas pacientes gestantes em um só lugar
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => setLocation("/login")}>
              Entrar no Sistema
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              Faça login para começar a usar o sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
