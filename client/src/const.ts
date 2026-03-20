export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Manus OAuth login is DISABLED for this application.
 * All authentication goes through the custom password-based login at /login.
 * This function is kept for compatibility but always returns /login.
 */
export const getLoginUrl = () => {
  return "/login";
};
