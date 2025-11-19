import { router } from "../trpc";
import { eventsRouter } from "./events";
import { membersRouter } from "./members";
import { routesRouter } from "./routes";

export const appRouter = router({
  events: eventsRouter,
  members: membersRouter,
  routes: routesRouter,
});

export type AppRouter = typeof appRouter;

