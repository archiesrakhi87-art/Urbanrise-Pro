import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number | undefined;
    role: string | undefined;
  }
}
