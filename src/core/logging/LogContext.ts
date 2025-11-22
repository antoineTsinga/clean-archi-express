/**
 * Use to add metadata to logs
 */
export interface LogContext {
  //  “global” context / technic
  requestId?: number | string | object;
  context?: string; // ex: "UserService", "AuthController"
  path?: string;

  //  Business Context
  userId?: string;
  tenantId?: string;

  // extend attribute :
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
