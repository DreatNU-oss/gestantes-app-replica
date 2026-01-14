import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Verificar se é o erro de removeChild causado por extensões do navegador
    if (error.message?.includes("removeChild") || error.message?.includes("insertBefore")) {
      // Este erro é geralmente causado por extensões do navegador (como Google Translate)
      // que modificam o DOM. Tentar recarregar automaticamente uma vez.
      const hasReloaded = sessionStorage.getItem("errorBoundaryReloaded");
      if (!hasReloaded) {
        sessionStorage.setItem("errorBoundaryReloaded", "true");
        window.location.reload();
        return { hasError: false, error: null };
      }
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Limpar flag de reload após 5 segundos para permitir novo reload se necessário
    setTimeout(() => {
      sessionStorage.removeItem("errorBoundaryReloaded");
    }, 5000);
  }

  render() {
    if (this.state.hasError) {
      const isExtensionError = this.state.error?.message?.includes("removeChild") || 
                               this.state.error?.message?.includes("insertBefore");
      
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">Ocorreu um erro inesperado.</h2>

            {isExtensionError && (
              <div className="p-4 w-full rounded bg-amber-50 border border-amber-200 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Possível causa:</strong> Este erro pode ser causado por extensões do navegador 
                  (como tradutores automáticos) ou pelo Google Translate. Tente:
                </p>
                <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                  <li>Desativar a tradução automática da página</li>
                  <li>Desativar extensões do navegador temporariamente</li>
                  <li>Abrir em uma janela anônima (Ctrl+Shift+N)</li>
                </ul>
              </div>
            )}

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem("errorBoundaryReloaded");
                window.location.reload();
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
