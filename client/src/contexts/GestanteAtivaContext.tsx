import React, { createContext, useContext, useState, useEffect } from 'react';

interface GestanteAtiva {
  id: number;
  nome: string;
}

interface GestanteAtivaContextType {
  gestanteAtiva: GestanteAtiva | null;
  setGestanteAtiva: (gestante: GestanteAtiva | null) => void;
  limparGestanteAtiva: () => void;
}

const GestanteAtivaContext = createContext<GestanteAtivaContextType | undefined>(undefined);

export function GestanteAtivaProvider({ children }: { children: React.ReactNode }) {
  const [gestanteAtiva, setGestanteAtivaState] = useState<GestanteAtiva | null>(() => {
    // Carregar do localStorage ao inicializar
    const saved = localStorage.getItem('gestanteAtiva');
    return saved ? JSON.parse(saved) : null;
  });

  const setGestanteAtiva = (gestante: GestanteAtiva | null) => {
    setGestanteAtivaState(gestante);
    if (gestante) {
      localStorage.setItem('gestanteAtiva', JSON.stringify(gestante));
    } else {
      localStorage.removeItem('gestanteAtiva');
    }
  };

  const limparGestanteAtiva = () => {
    setGestanteAtiva(null);
  };

  return (
    <GestanteAtivaContext.Provider value={{ gestanteAtiva, setGestanteAtiva, limparGestanteAtiva }}>
      {children}
    </GestanteAtivaContext.Provider>
  );
}

export function useGestanteAtiva() {
  const context = useContext(GestanteAtivaContext);
  if (context === undefined) {
    throw new Error('useGestanteAtiva must be used within a GestanteAtivaProvider');
  }
  return context;
}
