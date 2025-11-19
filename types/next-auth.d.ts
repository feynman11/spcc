import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role?: string;
  }
}

