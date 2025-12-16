import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { uploadLaudoRouter } from "../uploadLaudo";
import { processarLembretes } from "../lembretes";
import gestanteApiRouter from "../gestanteApi";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Upload de laudos
  app.use(uploadLaudoRouter);
  
  // API REST para App da Gestante (Mobile)
  app.use('/api/gestante', gestanteApiRouter);
  
  // Endpoint para processamento automático de lembretes (chamado por cron/scheduler)
  app.get('/api/cron/processar-lembretes', async (req, res) => {
    try {
      // Verificar token de autorização para segurança
      const authHeader = req.headers.authorization;
      const cronSecret = process.env.CRON_SECRET || 'manus-cron-secret-2024';
      
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.log('[Cron] Tentativa de acesso não autorizada ao endpoint de lembretes');
        return res.status(401).json({ error: 'Não autorizado' });
      }
      
      console.log('[Cron] Iniciando processamento automático de lembretes...');
      const resultado = await processarLembretes();
      console.log(`[Cron] Processamento concluído: ${resultado.enviados} enviados, ${resultado.erros} erros`);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        ...resultado
      });
    } catch (error: any) {
      console.error('[Cron] Erro ao processar lembretes:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
