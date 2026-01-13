import { getDb } from "./db";
import { gestantes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { gerarPDFCartaoPrenatal } from "./pdf";
import { writeFileSync } from "fs";
import { storagePut } from "./storage";

/**
 * Gera PDF do cartão pré-natal usando Puppeteer e faz upload no S3
 * Retorna { pdfUrl, pdfKey }
 */
export async function gerarEUploadPdfCartao(gestanteId: number): Promise<{ pdfUrl: string; pdfKey: string }> {
  console.log('[PDF] Iniciando geração de PDF com Puppeteer para gestanteId:', gestanteId);
  writeFileSync('/tmp/pdf_inicio.txt', `Iniciando PDF para gestante ${gestanteId} em ${new Date().toISOString()}`);
  
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  // Buscar dados da gestante para o nome do arquivo
  const gestanteResult = await db.select().from(gestantes).where(eq(gestantes.id, gestanteId));
  if (gestanteResult.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Gestante não encontrada" });
  }
  const gestante = gestanteResult[0];

  // Gerar PDF usando Puppeteer (sem cabeçalhos/rodapés do navegador)
  const pdfBuffer = await gerarPDFCartaoPrenatal(gestanteId);
  
  // Fazer upload para S3
  const timestamp = Date.now();
  const nomeArquivo = `cartao-prenatal-${gestante.nome.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.pdf`;
  const pdfKey = `cartoes-prenatal/${nomeArquivo}`;
  
  const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');
  
  console.log('[PDF] PDF gerado e enviado para S3:', pdfUrl);
  writeFileSync('/tmp/pdf_sucesso.txt', `PDF gerado com sucesso: ${pdfUrl}`);
  
  return { pdfUrl, pdfKey };
}
