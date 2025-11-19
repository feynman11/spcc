"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <SessionProvider session={session}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
}

