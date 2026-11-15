export { handleAuthCallback } from "./callback";
export type { AuthCallbackClient, AuthCallbackOptions } from "./callback";
export {
  AUTH_CONFIRM_TYPES,
  authConfirmForwardUrl,
  handleAuthConfirm,
  isAuthConfirmType,
  readAuthConfirmParams,
} from "./confirm";
export type {
  AuthConfirmClient,
  AuthConfirmOptions,
  AuthConfirmParams,
  AuthConfirmType,
} from "./confirm";
export { checkLegalAcceptance } from "./legal-gate";
export type { LegalGateClient, LegalGateOptions } from "./legal-gate";
