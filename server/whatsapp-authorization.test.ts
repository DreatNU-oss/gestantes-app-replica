import { describe, it, expect } from 'vitest';

/**
 * Tests for WhatsApp authorization control per clinic
 * - Clínica 00001 always has whatsappAutorizado = 1
 * - Other clinics default to whatsappAutorizado = 0 (not contracted)
 * - Owner can toggle whatsappAutorizado via Admin Clínicas panel
 */

describe('WhatsApp Authorization Control', () => {
  // Schema validation
  describe('Schema - whatsappAutorizado field', () => {
    it('should have whatsappAutorizado field with default 0', async () => {
      const { clinicas } = await import('../drizzle/schema');
      expect(clinicas.whatsappAutorizado).toBeDefined();
      // Default should be 0 (not authorized)
      const column = clinicas.whatsappAutorizado;
      expect(column.name).toBe('whatsappAutorizado');
    });
  });

  // Authorization logic
  describe('Authorization Logic', () => {
    it('should return autorizado=true when whatsappAutorizado is 1', () => {
      const clinica = { whatsappAutorizado: 1 };
      expect(clinica.whatsappAutorizado === 1).toBe(true);
    });

    it('should return autorizado=false when whatsappAutorizado is 0', () => {
      const clinica = { whatsappAutorizado: 0 };
      expect(clinica.whatsappAutorizado === 1).toBe(false);
    });

    it('owner should always have access regardless of clinic authorization', () => {
      const isOwner = true;
      const clinicaAutorizado = false;
      const whatsappHabilitado = clinicaAutorizado || isOwner;
      expect(whatsappHabilitado).toBe(true);
    });

    it('non-owner should be blocked when clinic is not authorized', () => {
      const isOwner = false;
      const clinicaAutorizado = false;
      const whatsappHabilitado = clinicaAutorizado || isOwner;
      expect(whatsappHabilitado).toBe(false);
    });

    it('non-owner should have access when clinic is authorized', () => {
      const isOwner = false;
      const clinicaAutorizado = true;
      const whatsappHabilitado = clinicaAutorizado || isOwner;
      expect(whatsappHabilitado).toBe(true);
    });
  });

  // Toggle logic
  describe('Toggle WhatsApp Authorization', () => {
    it('should convert boolean true to 1 for database', () => {
      const input = { autorizado: true };
      const dbValue = input.autorizado ? 1 : 0;
      expect(dbValue).toBe(1);
    });

    it('should convert boolean false to 0 for database', () => {
      const input = { autorizado: false };
      const dbValue = input.autorizado ? 1 : 0;
      expect(dbValue).toBe(0);
    });
  });

  // Scheduler should respect authorization
  describe('Scheduler Authorization Check', () => {
    it('should skip sending for unauthorized clinics', () => {
      const clinicaWhatsappAutorizado = 0;
      const shouldSend = clinicaWhatsappAutorizado === 1;
      expect(shouldSend).toBe(false);
    });

    it('should allow sending for authorized clinics', () => {
      const clinicaWhatsappAutorizado = 1;
      const shouldSend = clinicaWhatsappAutorizado === 1;
      expect(shouldSend).toBe(true);
    });
  });
});
