export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Begin GitHub OAuth from an event handler. The Worker creates and validates
// the one-time state cookie so the browser never receives a client secret.
export const startLogin = () => {
  window.location.href = "/api/auth/github";
};
