import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Dynamic doctor name in WhatsApp welcome message', () => {
  it('should use gestante.medicoNome instead of hardcoded Dr. André in CartaoPrenatal', () => {
    const content = readFileSync(
      resolve(__dirname, '../client/src/pages/CartaoPrenatal.tsx'),
      'utf-8'
    );
    // Should NOT have hardcoded "Dr. André" in the welcome message
    expect(content).not.toContain("Aqui é o Dr. André, da");
    // Should use dynamic medicoNome
    expect(content).toContain("gestante.medicoNome");
  });

  it('should include medicoNome in GestanteComCalculos type', () => {
    const schema = readFileSync(
      resolve(__dirname, '../drizzle/schema.ts'),
      'utf-8'
    );
    expect(schema).toContain("medicoNome?: string | null");
  });

  it('should fetch medicoNome in the gestantes.get procedure', () => {
    const routers = readFileSync(
      resolve(__dirname, './routers.ts'),
      'utf-8'
    );
    // Should look up medico name in the get procedure
    expect(routers).toContain("medicoNome");
    expect(routers).toContain("let medicoNome: string | null = null");
  });

  it('should fallback to André if medicoNome is not available', () => {
    const content = readFileSync(
      resolve(__dirname, '../client/src/pages/CartaoPrenatal.tsx'),
      'utf-8'
    );
    // Should have fallback
    expect(content).toContain("medicoNome || 'André'");
  });
});
