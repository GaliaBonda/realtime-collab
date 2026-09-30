import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      color: string;
    };
  }

  interface User {
    color?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    color?: string;
  }
}
