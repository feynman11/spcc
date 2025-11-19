import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

// User procedure: requires authentication (any logged-in user)
export const userProcedure = t.procedure.use(isAuthenticated);

// Member procedure: requires member role or higher
const isMember = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (!ctx.userRole || (ctx.userRole !== "member" && ctx.userRole !== "admin")) {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Your account needs to be approved by an admin" 
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
      userRole: ctx.userRole as string,
    },
  });
});

export const memberProcedure = t.procedure.use(isMember);

// Admin procedure: requires admin role
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  if (ctx.userRole !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Admin access required" 
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId as string,
      userRole: ctx.userRole as string,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);

