import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type AppRouter } from "@/server/trpc/routers/_app";
import superjson from "superjson";

export const trpcServer = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/trpc`
        : "http://localhost:3000/api/trpc",
      transformer: superjson,
    }),
  ],
});

