import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../trpc";

export const statsRouter = router({
  // Track a page view (public procedure - can be called by anyone)
  trackPageView: publicProcedure
    .input(
      z.object({
        path: z.string(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pageView.create({
        data: {
          path: input.path,
          userId: input.userId || null,
          timestamp: new Date(),
        },
      });
    }),

  // Get active user counts (admin only)
  getActiveUsers: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    
    // Daily: last 24 hours
    const oneDayAgo = new Date(now);
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    // Weekly: last 7 days
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Monthly: last 30 days
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const [daily, weekly, monthly] = await Promise.all([
      // Daily active users
      ctx.prisma.user.count({
        where: {
          lastLogin: {
            gte: oneDayAgo,
          },
        },
      }),
      // Weekly active users
      ctx.prisma.user.count({
        where: {
          lastLogin: {
            gte: oneWeekAgo,
          },
        },
      }),
      // Monthly active users
      ctx.prisma.user.count({
        where: {
          lastLogin: {
            gte: oneMonthAgo,
          },
        },
      }),
    ]);

    return {
      daily,
      weekly,
      monthly,
    };
  }),

  // Get page view counts grouped by path (admin only)
  getPageViews: adminProcedure
    .input(
      z
        .object({
          days: z.number().optional().default(30), // Default to last 30 days
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const days = input?.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get page views grouped by path
      const pageViews = await ctx.prisma.pageView.groupBy({
        by: ["path"],
        where: {
          timestamp: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      });

      return pageViews.map((pv) => ({
        path: pv.path,
        count: pv._count.id,
      }));
    }),
});

