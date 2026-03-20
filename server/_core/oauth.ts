import type { Express, Request, Response } from "express";

/**
 * OAuth Manus login is DISABLED for this application.
 * All users must authenticate via the custom password-based login system at /login.
 * This route is kept only to return a clear 403 error if someone attempts to use it,
 * preventing any accidental OAuth session creation.
 */
export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    console.warn("[OAuth] Blocked OAuth callback attempt — Manus OAuth login is disabled.");
    res.status(403).json({
      error: "OAuth login is disabled. Please use the standard login page at /login.",
    });
  });
}
