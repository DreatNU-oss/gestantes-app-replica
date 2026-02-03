import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const loginMutation = trpc.auth.loginComSenha.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        setErro(data.error || "Erro ao fazer login");
      }
    },
    onError: (error) => {
      setErro(error.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    
    if (!email || !senha) {
      setErro("Preencha todos os campos");
      return;
    }
    
    loginMutation.mutate({ email, senha });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-vertical.png" 
              alt="Mais Mulher - Clínica de Saúde Feminina"
              className="h-28 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#722F37]">
            APP Gestantes
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sistema de Gestão de Pré-Natal
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#722F37]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[#722F37]">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLocation("/esqueci-senha")}
                className="text-sm text-[#722F37] hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
