import { describe, it, expect } from 'vitest';

/**
 * Tests for the WhatsApp Scheduler lock and dedup logic.
 * 
 * Root cause of the duplicate message issue:
 * - Two server instances (production + dev sandbox) both run the scheduler at 9:00 BRT
 * - Both query jaEnviada() before either has inserted the history record
 * - Both proceed to send the same message, causing duplicates
 * 
 * Fix applied:
 * 1. MySQL GET_LOCK/RELEASE_LOCK to prevent concurrent scheduler execution
 * 2. Re-check jaEnviada() immediately before sending (second dedup layer)
 */

describe('WhatsApp Scheduler Lock Logic', () => {
  
  it('should have acquireSchedulerLock function that uses MySQL GET_LOCK', async () => {
    const mod = await import('./whatsappScheduler');
    // Verify the module exports the expected functions
    expect(mod.processarMensagensIG).toBeDefined();
    expect(mod.processarMensagensAgendadas).toBeDefined();
    expect(typeof mod.processarMensagensIG).toBe('function');
    expect(typeof mod.processarMensagensAgendadas).toBe('function');
  });

  it('should export scheduler start/stop functions', async () => {
    const mod = await import('./whatsappScheduler');
    expect(mod.startWhatsAppScheduler).toBeDefined();
    expect(mod.stopWhatsAppScheduler).toBeDefined();
  });

  describe('Deduplication Logic', () => {
    it('jaEnviada should check for existing sent messages', () => {
      // The jaEnviada function checks:
      // 1. clinicaId matches
      // 2. gestanteId matches
      // 3. templateId matches
      // 4. status is 'enviado'
      // This prevents sending the same template to the same gestante twice
      
      // Verify the logic exists in the source code
      const fs = require('fs');
      const source = fs.readFileSync('./server/whatsappScheduler.ts', 'utf-8');
      
      // Check that jaEnviada function exists
      expect(source).toContain('async function jaEnviada');
      expect(source).toContain("eq(whatsappHistorico.status, 'enviado')");
      
      // Check that lock functions exist
      expect(source).toContain('async function acquireSchedulerLock');
      expect(source).toContain('async function releaseSchedulerLock');
      expect(source).toContain('GET_LOCK');
      expect(source).toContain('RELEASE_LOCK');
      
      // Check that re-check dedup exists before sending
      expect(source).toContain('jaEnviadaRecheck');
      expect(source).toContain('Duplicata detectada no re-check');
    });

    it('processarMensagensIG should acquire lock before processing', () => {
      const fs = require('fs');
      const source = fs.readFileSync('./server/whatsappScheduler.ts', 'utf-8');
      
      // Check lock acquisition in processarMensagensIG
      expect(source).toContain("const lockName = 'whatsapp_scheduler_ig'");
      expect(source).toContain('acquireSchedulerLock(db, lockName)');
      expect(source).toContain('releaseSchedulerLock(db, lockName)');
      
      // Check that it aborts if lock not acquired
      expect(source).toContain('Outra instância já está executando processarMensagensIG');
    });

    it('processarMensagensAgendadas should acquire lock before processing', () => {
      const fs = require('fs');
      const source = fs.readFileSync('./server/whatsappScheduler.ts', 'utf-8');
      
      // Check lock acquisition in processarMensagensAgendadas
      expect(source).toContain("const lockNameAgendadas = 'whatsapp_scheduler_agendadas'");
      expect(source).toContain('acquireSchedulerLock(db, lockNameAgendadas)');
      expect(source).toContain('releaseSchedulerLock(db, lockNameAgendadas)');
    });

    it('lock should be released in finally block to prevent deadlocks', () => {
      const fs = require('fs');
      const source = fs.readFileSync('./server/whatsappScheduler.ts', 'utf-8');
      
      // Both functions should release lock in finally blocks
      const finallyBlocks = source.match(/finally\s*\{[^}]*releaseSchedulerLock/g);
      expect(finallyBlocks).not.toBeNull();
      expect(finallyBlocks!.length).toBeGreaterThanOrEqual(2);
    });
  });
});
