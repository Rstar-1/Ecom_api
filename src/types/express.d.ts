export interface AuthUser {
  /** MongoDB _id of the user */
  id: string;
  /** Human-readable user id (e.g. USER-001) */
  userId?: string;
  email?: string;
  /** Role name, lower-case (e.g. "admin", "customer") */
  role: string;
  roleId?: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
