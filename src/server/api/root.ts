import { checkInRouter } from "~/server/api/routers/check-in";
import { habitRouter } from "~/server/api/routers/habit";
import { healthRouter } from "~/server/api/routers/health";
import { periodRouter } from "~/server/api/routers/period";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  habit: habitRouter,
  checkIn: checkInRouter,
  period: periodRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
