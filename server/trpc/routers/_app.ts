import { router } from "../trpc";
import { eventsRouter } from "./events";
import { membersRouter } from "./members";
import { routesRouter } from "./routes";
import { statsRouter } from "./stats";

export const appRouter = router({
  events: eventsRouter,
  members: membersRouter,
  routes: routesRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;

