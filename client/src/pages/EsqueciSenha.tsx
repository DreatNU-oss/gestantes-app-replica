import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function EsqueciSenha() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const solicitarMutation = trpc.auth.solicitarRecuperacaoSenha.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSucesso(true);
      } else {
        setErro(data.error || "Erro ao solicitar recuperação");
      }
    },
    onError: (error) => {
      setErro(error.message || "Erro ao solicitar recuperação");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!email) {
      setErro("Preencha o email");
      return;
    }
    solicitarMutation.mutate({ email });
  };

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
            <CardTitle className="text-xl font-bold text-[#722F37]">Email Enviado!</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Se o email estiver cadastrado no sistema, você receberá um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center mb-4">
              Verifique sua caixa de entrada e spam. O link expira em 24 horas.
            </p>
            <Button onClick={() => setLocation("/login")} className="w-full bg-[#722F37] hover:bg-[#5a252c]">
              Voltar para Login
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
          <CardTitle className="text-2xl font-bold text-[#722F37]">Recuperar Senha</CardTitle>
          <CardDescription className="text-gray-600">
            Digite seu email para receber um link de recuperação
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
                  disabled={solicitarMutation.isPending}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
              disabled={solicitarMutation.isPending}
            >
              {solicitarMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                "Enviar Link de Recuperação"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLocation("/login")}
              className="w-full text-[#722F37] hover:bg-[#F5E6E0]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
