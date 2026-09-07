export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Open the email-only resident threshold from an event handler.
export const startLogin = () => {
  window.location.href = "/sign-in";
};
