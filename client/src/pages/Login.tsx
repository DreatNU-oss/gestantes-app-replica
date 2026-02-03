import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle, User, CheckCircle2, ShieldAlert, Clock } from "lucide-react";

type LoginStep = 'email' | 'login' | 'primeiro-acesso';

export default function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [bloqueado, setBloqueado] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const [tentativasRestantes, setTentativasRestantes] = useState<number | null>(null);

  // Query para verificar status do email
  const statusQuery = trpc.auth.verificarStatusEmail.useQuery(
    { email },
    { 
      enabled: false, // Não executa automaticamente
      retry: false 
    }
  );

  const loginMutation = trpc.auth.loginComSenha.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        setErro(data.error || "Erro ao fazer login");
        // Verificar se conta foi bloqueada
        if (data.locked) {
          setBloqueado(true);
          setMinutosRestantes(data.minutesRemaining || 15);
        }
        // Mostrar tentativas restantes
        if (data.attemptsRemaining !== undefined) {
          setTentativasRestantes(data.attemptsRemaining);
        }
      }
    },
    onError: (error) => {
      setErro(error.message || "Erro ao fazer login");
    },
  });

  const criarUsuarioMutation = trpc.auth.criarUsuarioComSenha.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSucesso("Conta criada com sucesso! Redirecionando...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setErro(data.error || "Erro ao criar conta");
      }
    },
    onError: (error) => {
      setErro(error.message || "Erro ao criar conta");
    },
  });

  const handleVerificarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    
    if (!email) {
      setErro("Digite seu email");
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErro("Digite um email válido");
      return;
    }

    try {
      const result = await statusQuery.refetch();
      
      if (!result.data?.isAuthorized) {
        setErro("Este email não está autorizado a acessar o sistema. Solicite permissão ao administrador.");
        return;
      }

      // Verificar se conta está bloqueada
      if (result.data.locked) {
        setBloqueado(true);
        setMinutosRestantes(result.data.minutesRemaining || 15);
        setErro(`Conta bloqueada temporariamente. Tente novamente em ${result.data.minutesRemaining} minuto(s).`);
        return;
      }

      if (result.data.hasPassword) {
        // Usuário já tem senha - ir para login normal
        setStep('login');
      } else {
        // Primeiro acesso - ir para criação de senha
        if (result.data.userName) {
          setNome(result.data.userName);
        }
        setStep('primeiro-acesso');
      }
    } catch (error) {
      setErro("Erro ao verificar email. Tente novamente.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    
    if (!senha) {
      setErro("Digite sua senha");
      return;
    }
    
    loginMutation.mutate({ email, senha });
  };

  const handleCriarConta = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    
    if (!senha || !confirmarSenha) {
      setErro("Preencha todos os campos de senha");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      return;
    }
    
    criarUsuarioMutation.mutate({ email, senha, nome: nome || undefined });
  };

  const handleVoltar = () => {
    setStep('email');
    setSenha("");
    setConfirmarSenha("");
    setErro("");
    setSucesso("");
    setBloqueado(false);
    setMinutosRestantes(0);
    setTentativasRestantes(null);
  };

  const isLoading = statusQuery.isFetching || loginMutation.isPending || criarUsuarioMutation.isPending;

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
            {step === 'email' && "Sistema de Gestão de Pré-Natal"}
            {step === 'login' && "Digite sua senha para entrar"}
            {step === 'primeiro-acesso' && "Crie sua senha de acesso"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Mensagem de conta bloqueada */}
          {bloqueado && (
            <Alert variant="destructive" className="bg-orange-50 border-orange-300 mb-4">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Conta bloqueada por {minutosRestantes} minuto(s) após múltiplas tentativas incorretas.</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mensagens de erro e sucesso */}
          {erro && !bloqueado && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {erro}
                {tentativasRestantes !== null && tentativasRestantes > 0 && (
                  <span className="block mt-1 text-xs">
                    Atenção: {tentativasRestantes} tentativa(s) restante(s) antes do bloqueio.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {sucesso && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{sucesso}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Verificar Email */}
          {step === 'email' && (
            <form onSubmit={handleVerificarEmail} className="space-y-4">
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
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </form>
          )}

          {/* Step 2: Login com senha */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#722F37]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    className="pl-10 border-[#E8D5D0] bg-gray-50"
                    disabled
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
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/esqueci-senha")}
                  className="text-[#722F37] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Primeiro acesso - criar senha */}
          {step === 'primeiro-acesso' && (
            <form onSubmit={handleCriarConta} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Primeiro acesso!</strong> Crie uma senha para acessar o sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#722F37]">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    className="pl-10 border-[#E8D5D0] bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-[#722F37]">Nome (opcional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-[#722F37]">Criar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha" className="text-[#722F37]">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="pl-10 border-[#E8D5D0] focus:border-[#722F37] focus:ring-[#722F37]"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta e Entrar"
                )}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Voltar
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
