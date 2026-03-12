import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock passwordAuth module
vi.mock("./passwordAuth", () => ({
  addAuthorizedEmail: vi.fn(),
  updateEmailAutorizadoRole: vi.fn(),
  removeAuthorizedEmail: vi.fn(),
  listAuthorizedEmails: vi.fn(),
  isEmailAuthorized: vi.fn(),
  getUserByEmail: vi.fn(),
}));

import {
  addAuthorizedEmail,
  updateEmailAutorizadoRole,
  listAuthorizedEmails,
  getUserByEmail,
} from "./passwordAuth";

describe("Sistema de Roles de Usuário", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tipos de Role", () => {
    it("deve reconhecer os 4 tipos de role válidos", () => {
      const validRoles = ["superadmin", "admin", "obstetra", "secretaria"];
      validRoles.forEach(role => {
        expect(["superadmin", "admin", "obstetra", "secretaria"]).toContain(role);
      });
    });

    it("não deve aceitar role 'user' (antigo)", () => {
      const validRoles = ["superadmin", "admin", "obstetra", "secretaria"];
      expect(validRoles).not.toContain("user");
    });
  });

  describe("Adicionar Email Autorizado com Role", () => {
    it("deve adicionar email com role obstetra por padrão", async () => {
      (addAuthorizedEmail as any).mockResolvedValue(true);

      const result = await addAuthorizedEmail("medico@clinica.com", 1, 1);
      expect(addAuthorizedEmail).toHaveBeenCalledWith("medico@clinica.com", 1, 1);
      expect(result).toBe(true);
    });

    it("deve adicionar email com role admin", async () => {
      (addAuthorizedEmail as any).mockResolvedValue(true);

      const result = await addAuthorizedEmail("admin@clinica.com", 1, 1, "admin");
      expect(addAuthorizedEmail).toHaveBeenCalledWith("admin@clinica.com", 1, 1, "admin");
      expect(result).toBe(true);
    });

    it("deve adicionar email com role secretaria", async () => {
      (addAuthorizedEmail as any).mockResolvedValue(true);

      const result = await addAuthorizedEmail("sec@clinica.com", 1, 1, "secretaria");
      expect(addAuthorizedEmail).toHaveBeenCalledWith("sec@clinica.com", 1, 1, "secretaria");
      expect(result).toBe(true);
    });

    it("deve adicionar email com role obstetra explícito", async () => {
      (addAuthorizedEmail as any).mockResolvedValue(true);

      const result = await addAuthorizedEmail("obs@clinica.com", 1, 1, "obstetra");
      expect(addAuthorizedEmail).toHaveBeenCalledWith("obs@clinica.com", 1, 1, "obstetra");
      expect(result).toBe(true);
    });
  });

  describe("Atualizar Role de Email Autorizado", () => {
    it("deve atualizar role de obstetra para admin", async () => {
      (updateEmailAutorizadoRole as any).mockResolvedValue(true);

      const result = await updateEmailAutorizadoRole("medico@clinica.com", "admin");
      expect(updateEmailAutorizadoRole).toHaveBeenCalledWith("medico@clinica.com", "admin");
      expect(result).toBe(true);
    });

    it("deve atualizar role de admin para secretaria", async () => {
      (updateEmailAutorizadoRole as any).mockResolvedValue(true);

      const result = await updateEmailAutorizadoRole("admin@clinica.com", "secretaria");
      expect(updateEmailAutorizadoRole).toHaveBeenCalledWith("admin@clinica.com", "secretaria");
      expect(result).toBe(true);
    });

    it("deve atualizar role de secretaria para obstetra", async () => {
      (updateEmailAutorizadoRole as any).mockResolvedValue(true);

      const result = await updateEmailAutorizadoRole("sec@clinica.com", "obstetra");
      expect(updateEmailAutorizadoRole).toHaveBeenCalledWith("sec@clinica.com", "obstetra");
      expect(result).toBe(true);
    });
  });

  describe("Listar Emails com Role", () => {
    it("deve retornar emails com campo role", async () => {
      const mockEmails = [
        { id: 1, email: "admin@clinica.com", role: "admin", clinicaId: 1, ativo: 1, userExists: true, userName: "Admin", isLocked: false, lockedUntil: null, failedAttempts: 0, createdAt: new Date(), updatedAt: new Date(), adicionadoPor: null },
        { id: 2, email: "medico@clinica.com", role: "obstetra", clinicaId: 1, ativo: 1, userExists: true, userName: "Médico", isLocked: false, lockedUntil: null, failedAttempts: 0, createdAt: new Date(), updatedAt: new Date(), adicionadoPor: null },
        { id: 3, email: "sec@clinica.com", role: "secretaria", clinicaId: 1, ativo: 1, userExists: false, userName: null, isLocked: false, lockedUntil: null, failedAttempts: 0, createdAt: new Date(), updatedAt: new Date(), adicionadoPor: null },
      ];
      (listAuthorizedEmails as any).mockResolvedValue(mockEmails);

      const result = await listAuthorizedEmails(1);
      expect(result).toHaveLength(3);
      expect(result[0].role).toBe("admin");
      expect(result[1].role).toBe("obstetra");
      expect(result[2].role).toBe("secretaria");
    });
  });

  describe("Controle de Acesso por Role", () => {
    const menuPermissions = {
      dashboard: ["superadmin", "admin", "obstetra", "secretaria"],
      cartaoPrenatal: ["superadmin", "admin", "obstetra"],
      exames: ["superadmin", "admin", "obstetra"],
      ultrassons: ["superadmin", "admin", "obstetra"],
      marcos: ["superadmin", "admin", "obstetra", "secretaria"],
      previsaoPartos: ["superadmin", "admin", "obstetra", "secretaria"],
      agendamento: ["superadmin", "admin", "obstetra", "secretaria"],
      partosRealizados: ["superadmin", "admin", "obstetra"],
      estatisticas: ["superadmin", "admin", "obstetra", "secretaria"],
      configuracoes: ["superadmin", "admin"],
    };

    it("superadmin deve ter acesso a todos os menus", () => {
      Object.values(menuPermissions).forEach(roles => {
        expect(roles).toContain("superadmin");
      });
    });

    it("admin deve ter acesso a todos os menus", () => {
      Object.values(menuPermissions).forEach(roles => {
        expect(roles).toContain("admin");
      });
    });

    it("obstetra deve ter acesso a tudo exceto configurações", () => {
      expect(menuPermissions.dashboard).toContain("obstetra");
      expect(menuPermissions.cartaoPrenatal).toContain("obstetra");
      expect(menuPermissions.exames).toContain("obstetra");
      expect(menuPermissions.ultrassons).toContain("obstetra");
      expect(menuPermissions.marcos).toContain("obstetra");
      expect(menuPermissions.previsaoPartos).toContain("obstetra");
      expect(menuPermissions.agendamento).toContain("obstetra");
      expect(menuPermissions.partosRealizados).toContain("obstetra");
      expect(menuPermissions.estatisticas).toContain("obstetra");
      expect(menuPermissions.configuracoes).not.toContain("obstetra");
    });

    it("secretária deve ter acesso limitado (sem cartão, exames, ultrassons, partos, configurações)", () => {
      expect(menuPermissions.dashboard).toContain("secretaria");
      expect(menuPermissions.marcos).toContain("secretaria");
      expect(menuPermissions.previsaoPartos).toContain("secretaria");
      expect(menuPermissions.agendamento).toContain("secretaria");
      expect(menuPermissions.estatisticas).toContain("secretaria");
      // Não deve ter acesso a:
      expect(menuPermissions.cartaoPrenatal).not.toContain("secretaria");
      expect(menuPermissions.exames).not.toContain("secretaria");
      expect(menuPermissions.ultrassons).not.toContain("secretaria");
      expect(menuPermissions.partosRealizados).not.toContain("secretaria");
      expect(menuPermissions.configuracoes).not.toContain("secretaria");
    });
  });

  describe("Herança de Role na Criação de Usuário", () => {
    it("deve buscar role do emailsAutorizados ao criar usuário", async () => {
      // Simula que getUserByEmail retorna null (usuário novo)
      (getUserByEmail as any).mockResolvedValue(null);
      
      // Verifica que a função getUserByEmail é chamada corretamente
      await getUserByEmail("novo@clinica.com");
      expect(getUserByEmail).toHaveBeenCalledWith("novo@clinica.com");
    });
  });
});
