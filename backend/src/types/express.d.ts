// Purpose: Extends Express Request type declaration to include authenticated user identity.
// Imported by: TypeScript compiler via tsconfig.json

export interface AuthenticatedUser {
  id: string;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
