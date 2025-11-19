import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function createContext() {
  const session = await auth();

  // Ensure userId is properly extracted from session
  let userId = session?.user?.id as string | undefined;
  let userRole = session?.user?.role as string | undefined;

  // Verify user exists in database if userId is present
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
      
      // If user doesn't exist, clear userId to prevent foreign key errors
      if (!user) {
        console.warn(`User ${userId} from session not found in database`);
        userId = undefined;
        userRole = undefined;
      } else {
        // Use role from database (source of truth)
        userRole = user.role;
      }
    } catch (error) {
      console.error("Error verifying user in context:", error);
      userId = undefined;
      userRole = undefined;
    }
  }

  return {
    prisma,
    session,
    userId,
    userRole,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

