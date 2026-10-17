import type { AccountKind } from "./account-kind";

/**
 * Base interface for authentication parameters
 */
export interface BaseAuthenticationParams {
  /** URL of the PRONOTE instance */
  url: string;
  /** Account type (student, parent, etc.) */
  kind: AccountKind;
  /** Username for authentication */
  username: string;
  /** Device UUID for identification */
  deviceUUID: string;
  /** Navigator identifier (optional) */
  navigatorIdentifier?: string;
}

/**
 * Parameters for password-based authentication
 */
export interface PasswordAuthenticationParams extends BaseAuthenticationParams {
  /** Password for authentication */
  password: string;
  /** Token should not be present */
  token?: never;
  /**
   * Log in through an ENT (CAS): `username` and `password` are then the `e` and `f` values of the
   * PRONOTE page reached after the ENT login (in its `Start({...})` call), not the user's credentials.
   */
  useCAS?: boolean;
}

/**
 * Parameters for token-based authentication
 */
export interface TokenAuthenticationParams extends BaseAuthenticationParams {
  /** Token for authentication */
  token: string;
  /** Password should not be present */
  password?: never;
}

/**
 * Combined type for all authentication methods
 */
export type AuthenticationParams = PasswordAuthenticationParams | TokenAuthenticationParams;
