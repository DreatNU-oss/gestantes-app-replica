import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function RedefinirSenha() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";
  
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const { data: validacao, isLoading: validando } = trpc.auth.validarTokenRecuperacao.useQuery(
    { token },
    { enabled: !!token }
  );

  const redefinirMutation = trpc.auth.redefinirSenha.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSucesso(true);
      } else {
        setErro(data.error || "Erro ao redefinir senha");
      }
    },
    onError: (error) => {
      setErro(error.message || "Erro ao redefinir senha");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }
    redefinirMutation.mutate({ token, novaSenha });
  };

  if (validando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardContent className="pt-8 pb-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#722F37]" />
            <p className="mt-4 text-gray-600">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || (validacao && !validacao.valido)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-[#722F37]">Link Inválido</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Este link de recuperação é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/esqueci-senha")} className="w-full bg-[#722F37] hover:bg-[#5a252c]">
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-[#722F37]">Senha Redefinida!</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sua senha foi alterada com sucesso. Você já pode fazer login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} className="w-full bg-[#722F37] hover:bg-[#5a252c]">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F5] to-[#F5E6E0] p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-[#722F37]">Criar Nova Senha</CardTitle>
          <CardDescription className="text-gray-600">
            {validacao?.email && <span>Email: <strong>{validacao.email}</strong></span>}
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
              <Label htmlFor="novaSenha" className="text-[#722F37]">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="••••••••"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                  disabled={redefinirMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-[#722F37]">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                  disabled={redefinirMutation.isPending}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
              disabled={redefinirMutation.isPending}
            >
              {redefinirMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
              ) : (
                "Salvar Nova Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
