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
  [key: string]: any;
}
