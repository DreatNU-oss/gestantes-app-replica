import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Verificar se já está rodando como PWA instalado
    const checkIfPWA = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    setIsPWA(checkIfPWA());

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Verificar se usuário já dispensou o banner antes
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    // Detectar quando o app foi instalado
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      console.log('[PWA] App instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt de instalação
    deferredPrompt.prompt();

    // Aguardar escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] Usuário aceitou a instalação');
    } else {
      console.log('[PWA] Usuário recusou a instalação');
    }

    // Limpar o prompt
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Salvar preferência para não mostrar novamente (por 7 dias)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed', expiryDate.toISOString());
  };

  // Não mostrar nada se:
  // 1. Já está rodando como PWA instalado
  // 2. Não há prompt disponível
  // 3. Usuário dispensou o banner
  if (isPWA || !deferredPrompt || !showInstallBanner) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm border-[#722F37] bg-white shadow-lg">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#722F37]/10">
          <Download className="h-5 w-5 text-[#722F37]" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#722F37]">Instalar App</h3>
              <p className="text-sm text-gray-600">
                Adicione à tela inicial para acesso rápido e experiência completa de aplicativo.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-600"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-[#722F37] hover:bg-[#5a2429]"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="border-gray-300"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
