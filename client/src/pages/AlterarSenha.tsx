import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import GestantesLayout from "@/components/GestantesLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowLeft, Check, LogOut, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AlterarSenha() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const alterarSenhaMutation = trpc.auth.alterarSenha.useMutation({
    onSuccess: (data: { success: boolean; error?: string; sessionsInvalidated?: boolean }) => {
      if (data.success) {
        toast.success("Senha alterada com sucesso! Você será desconectado de todos os dispositivos.");
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
        // Redirecionar para login após alguns segundos (sessões foram invalidadas)
        setTimeout(() => {
          window.location.href = "/login";
        }, 2500);
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao alterar senha");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    alterarSenhaMutation.mutate({ senhaAtual, novaSenha });
  };

  // Verificar força da senha
  const getSenhaForca = (senha: string) => {
    if (senha.length === 0) return { texto: "", cor: "" };
    if (senha.length < 6) return { texto: "Muito fraca", cor: "text-red-500" };
    if (senha.length < 8) return { texto: "Fraca", cor: "text-orange-500" };
    if (!/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) return { texto: "Média", cor: "text-yellow-500" };
    if (senha.length >= 10 && /[!@#$%^&*]/.test(senha)) return { texto: "Muito forte", cor: "text-green-600" };
    return { texto: "Forte", cor: "text-green-500" };
  };

  const forcaSenha = getSenhaForca(novaSenha);

  return (
    <GestantesLayout>
      <div className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#722F37]/10 rounded-lg">
                <Lock className="h-6 w-6 text-[#722F37]" />
              </div>
              <div>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Altere sua senha de acesso ao sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Senha Atual */}
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="senhaAtual"
                    type={mostrarSenhaAtual ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="novaSenha"
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {forcaSenha.texto && (
                  <p className={`text-sm ${forcaSenha.cor}`}>
                    Força da senha: {forcaSenha.texto}
                  </p>
                )}
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmarSenha"
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarConfirmarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmarSenha && novaSenha && (
                  <p className={`text-sm ${confirmarSenha === novaSenha ? "text-green-500" : "text-red-500"}`}>
                    {confirmarSenha === novaSenha ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-4 w-4" /> Senhas coincidem
                      </span>
                    ) : (
                      "As senhas não coincidem"
                    )}
                  </p>
                )}
              </div>

              {/* Aviso sobre logout */}
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    <span>Ao alterar sua senha, você será desconectado de <strong>todos os dispositivos</strong> e precisará fazer login novamente.</span>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Dicas de Segurança */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Dicas para uma senha segura:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use pelo menos 8 caracteres</li>
                  <li>Inclua letras maiúsculas e minúsculas</li>
                  <li>Adicione números</li>
                  <li>Use caracteres especiais (!@#$%^&*)</li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c]"
                disabled={alterarSenhaMutation.isPending}
              >
                {alterarSenhaMutation.isPending ? (
                  "Alterando..."
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </GestantesLayout>
  );
}
