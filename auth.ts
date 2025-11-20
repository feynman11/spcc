import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true, // Required for running in containers
  providers: [
    Google,
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // If signing in with OAuth (Google), create or update user in database
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user for OAuth
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
              },
            });
          } else {
            // Update existing user with OAuth info if needed
            await prisma.user.update({
              where: { email: user.email },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Error creating/updating user:", error);
          return false;
        }
      }
      
      // For credentials login, ensure user exists in database
      if (account?.provider === "credentials" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // This shouldn't happen for credentials, but ensure user exists
            console.warn(`User ${user.email} authenticated but not found in database`);
            return false;
          }
        } catch (error) {
          console.error("Error verifying user:", error);
          return false;
        }
      }
      
      return true;
    },
    async session({ session, token }) {
      // Verify user still exists before allowing session
      if (!token.sub) {
        // Token was invalidated (user deleted), don't set user id/role
        return session;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, role: true },
        });
        
        if (!dbUser) {
          // User was deleted, don't set user id/role (session will be invalid)
          return session;
        }
        
        if (session.user) {
          session.user.id = token.sub;
          session.user.role = dbUser.role;
        }
      } catch (error) {
        console.error("Error verifying user in session callback:", error);
        // On error, don't set user id/role
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // On initial sign in, set the user ID and role, and update lastLogin
      if (user) {
        // For credentials login, fetch user from database to get role and update lastLogin
        if (account?.provider === "credentials") {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { id: true, role: true },
            });
            if (dbUser) {
              token.sub = dbUser.id;
              token.role = dbUser.role;
              // Update lastLogin
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { lastLogin: new Date() },
              });
            }
          } catch (error) {
            console.error("Error fetching user from database:", error);
          }
        }
        
        // For OAuth users, fetch user ID and role from database and update lastLogin
        if (account?.provider === "google" && user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { id: true, role: true },
            });
            if (dbUser) {
              token.sub = dbUser.id;
              token.role = dbUser.role;
              // Update lastLogin
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { lastLogin: new Date() },
              });
            } else {
              console.error(`User ${user.email} not found in database after OAuth login`);
            }
          } catch (error) {
            console.error("Error fetching user from database:", error);
          }
        }
      }
      
      // On subsequent requests, verify the user still exists and refresh role
      if (token.sub && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { id: true, role: true },
          });
          if (!dbUser) {
            // User was deleted, clear the token
            token.sub = undefined;
            token.role = undefined;
            console.warn(`User ${token.sub} not found in database, clearing token`);
          } else {
            // Refresh role in case it changed
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error verifying user in database:", error);
        }
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
});

