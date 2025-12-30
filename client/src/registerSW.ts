// Registro do Service Worker para PWA

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Nova versão disponível! Recarregue a página para atualizar.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Erro ao registrar Service Worker:', error);
        });
    });
  } else {
    console.log('[PWA] Service Worker não é suportado neste navegador.');
  }
}

// Detectar se o app está sendo executado como PWA instalado
export function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Mostrar prompt de instalação
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir o prompt automático
    e.preventDefault();
    // Salvar o evento para usar depois
    deferredPrompt = e;
    console.log('[PWA] Prompt de instalação disponível');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalado com sucesso!');
    deferredPrompt = null;
  });
}

export function showInstallPrompt() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] Usuário aceitou a instalação');
      } else {
        console.log('[PWA] Usuário recusou a instalação');
      }
      deferredPrompt = null;
    });
  }
}

export function canInstallPWA(): boolean {
  return deferredPrompt !== null;
}
