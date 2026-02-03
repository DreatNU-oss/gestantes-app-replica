import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { users, emailsAutorizados } from '../drizzle/schema';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function isEmailAuthorized(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(emailsAutorizados)
    .where(and(
      eq(emailsAutorizados.email, email.toLowerCase()),
      eq(emailsAutorizados.ativo, 1)
    ))
    .limit(1);
  return result.length > 0;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] || null;
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const token = generateResetToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await db
    .update(users)
    .set({ passwordResetToken: token, passwordResetExpires: expires })
    .where(eq(users.id, user.id));
  
  return token;
}

export async function validateResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);
  
  const user = result[0];
  if (!user || !user.passwordResetExpires) return null;
  if (new Date() > user.passwordResetExpires) return null;
  return user;
}

export async function setPassword(userId: number, newPassword: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const hash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: hash, passwordResetToken: null, passwordResetExpires: null })
    .where(eq(users.id, userId));
}

export async function loginWithPassword(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  const isAuthorized = await isEmailAuthorized(email);
  if (!isAuthorized) {
    return { success: false, error: 'Este email não está autorizado a acessar o sistema. Solicite permissão ao administrador.' };
  }
  
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Email ou senha incorretos.' };
  }
  
  if (!user.passwordHash) {
    return { success: false, error: 'Você ainda não definiu uma senha. Use "Esqueci minha senha" para criar sua senha.' };
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Email ou senha incorretos.' };
  }
  
  const db2 = await getDb();
  if (db2) await db2.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  
  return { success: true, user };
}

export async function listAuthorizedEmails() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailsAutorizados).orderBy(emailsAutorizados.email);
}

export async function addAuthorizedEmail(email: string, addedBy?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.insert(emailsAutorizados).values({
      email: email.toLowerCase(),
      adicionadoPor: addedBy || null,
      ativo: 1,
    });
    return true;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      await db.update(emailsAutorizados).set({ ativo: 1 }).where(eq(emailsAutorizados.email, email.toLowerCase()));
      return true;
    }
    throw error;
  }
}

export async function removeAuthorizedEmail(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(emailsAutorizados).set({ ativo: 0 }).where(eq(emailsAutorizados.email, email.toLowerCase()));
  return true;
}
