import { z } from "zod";
import { router, protectedProcedure, publicProcedure, memberProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const difficultyEnum = z.enum(["easy", "moderate", "hard", "expert"]);
const eventTypeEnum = z.enum(["group_ride", "training", "race", "social"]);
const eventStatusEnum = z.enum(["scheduled", "cancelled", "completed"]);

export const eventsRouter = router({
  getAllEvents: publicProcedure.query(async ({ ctx }) => {
    const events = await ctx.prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        route: true,
        organizerUser: {
          include: {
            member: true,
          },
        },
        participants: {
          include: {
            member: true,
          },
        },
        waitingList: {
          include: {
            member: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.getTime(),
      startTime: event.startTime,
      duration: event.duration,
      routeId: event.routeId,
      meetingPoint: event.meetingPoint,
      maxParticipants: event.maxParticipants,
      difficulty: event.difficulty,
      eventType: event.eventType,
      stravaEventUrl: event.stravaEventUrl,
      organizer: event.organizer,
      status: event.status,
      weatherConditions: event.weatherConditions,
      notes: event.notes,
      organizerName: event.organizerUser.member
        ? `${event.organizerUser.member.firstName} ${event.organizerUser.member.lastName}`
        : event.organizerUser.email || "Unknown",
      route: event.route
        ? {
            id: event.route.id,
            name: event.route.name,
            distance: event.route.distance,
            difficulty: event.route.difficulty,
          }
        : null,
      participants: event.participants.map((user) => ({
        userId: user.id,
        name: user.member
          ? `${user.member.firstName} ${user.member.lastName}`
          : user.email || "Unknown",
      })),
      waitingList: event.waitingList.map((user) => ({
        userId: user.id,
        name: user.member
          ? `${user.member.firstName} ${user.member.lastName}`
          : user.email || "Unknown",
      })),
      participantCount: event.participants.length,
      waitingListCount: event.waitingList.length,
    }));
  }),

  getUpcomingEvents: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const events = await ctx.prisma.event.findMany({
      where: {
        date: {
          gte: now,
        },
      },
      orderBy: { date: "asc" },
      take: 10,
      include: {
        route: true,
        organizerUser: {
          include: {
            member: true,
          },
        },
        participants: {
          include: {
            member: true,
          },
        },
        waitingList: {
          include: {
            member: true,
          },
        },
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date.getTime(),
      startTime: event.startTime,
      duration: event.duration,
      routeId: event.routeId,
      meetingPoint: event.meetingPoint,
      maxParticipants: event.maxParticipants,
      difficulty: event.difficulty,
      eventType: event.eventType,
      stravaEventUrl: event.stravaEventUrl,
      organizer: event.organizer,
      status: event.status,
      organizerName: event.organizerUser.member
        ? `${event.organizerUser.member.firstName} ${event.organizerUser.member.lastName}`
        : event.organizerUser.email || "Unknown",
      route: event.route
        ? {
            id: event.route.id,
            name: event.route.name,
            distance: event.route.distance,
            difficulty: event.route.difficulty,
          }
        : null,
      participants: event.participants.map((user) => ({
        userId: user.id,
        name: user.member
          ? `${user.member.firstName} ${user.member.lastName}`
          : user.email || "Unknown",
      })),
      waitingList: event.waitingList.map((user) => ({
        userId: user.id,
        name: user.member
          ? `${user.member.firstName} ${user.member.lastName}`
          : user.email || "Unknown",
      })),
      participantCount: event.participants.length,
      waitingListCount: event.waitingList.length,
    }));
  }),

  getEventsByRoute: publicProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.prisma.event.findMany({
        where: {
          routeId: input.routeId,
        },
        orderBy: { date: "asc" },
        include: {
          organizerUser: {
            include: {
              member: true,
            },
          },
          participants: true,
          waitingList: true,
        },
      });

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.getTime(),
        startTime: event.startTime,
        duration: event.duration,
        routeId: event.routeId,
        meetingPoint: event.meetingPoint,
        maxParticipants: event.maxParticipants,
        difficulty: event.difficulty,
        eventType: event.eventType,
        stravaEventUrl: event.stravaEventUrl,
        organizer: event.organizer,
        status: event.status,
        weatherConditions: event.weatherConditions,
        notes: event.notes,
        organizerName: event.organizerUser.member
          ? `${event.organizerUser.member.firstName} ${event.organizerUser.member.lastName}`
          : event.organizerUser.email || "Unknown",
        participantCount: event.participants.length,
        waitingListCount: event.waitingList.length,
      }));
    }),

  getEvent: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          route: true,
          organizerUser: {
            include: {
              member: true,
            },
          },
          participants: {
            include: {
              member: true,
            },
          },
          waitingList: {
            include: {
              member: true,
            },
          },
        },
      });

      if (!event) return null;

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.getTime(),
        startTime: event.startTime,
        duration: event.duration,
        routeId: event.routeId,
        meetingPoint: event.meetingPoint,
        maxParticipants: event.maxParticipants,
        difficulty: event.difficulty,
        eventType: event.eventType,
        stravaEventUrl: event.stravaEventUrl,
        organizer: event.organizer,
        status: event.status,
        weatherConditions: event.weatherConditions,
        notes: event.notes,
        organizerName: event.organizerUser.member
          ? `${event.organizerUser.member.firstName} ${event.organizerUser.member.lastName}`
          : event.organizerUser.email || "Unknown",
        route: event.route,
        participants: event.participants.map((user) => ({
          userId: user.id,
          name: user.member
            ? `${user.member.firstName} ${user.member.lastName}`
            : user.email || "Unknown",
        })),
        waitingList: event.waitingList.map((user) => ({
          userId: user.id,
          name: user.member
            ? `${user.member.firstName} ${user.member.lastName}`
            : user.email || "Unknown",
        })),
        participantCount: event.participants.length,
        waitingListCount: event.waitingList.length,
      };
    }),

  createEvent: memberProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.number(),
        startTime: z.string(),
        duration: z.number().optional(),
        routeId: z.string().optional(),
        meetingPoint: z.string(),
        maxParticipants: z.number().optional(),
        difficulty: difficultyEnum,
        eventType: eventTypeEnum,
        stravaEventUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found in session",
        });
      }

      // Verify user exists in database
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found in database",
        });
      }

      const event = await ctx.prisma.event.create({
        data: {
          title: input.title,
          description: input.description,
          date: new Date(input.date),
          startTime: input.startTime,
          duration: input.duration,
          routeId: input.routeId,
          meetingPoint: input.meetingPoint,
          maxParticipants: input.maxParticipants,
          difficulty: input.difficulty,
          eventType: input.eventType,
          stravaEventUrl: input.stravaEventUrl,
          organizer: ctx.userId,
          status: "scheduled",
        },
      });

      // Increment route event count if route is selected
      if (input.routeId) {
        await ctx.prisma.route.update({
          where: { id: input.routeId },
          data: {
            eventCount: {
              increment: 1,
            },
          },
        });
      }

      return event.id;
    }),

  joinEvent: memberProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          participants: true,
          waitingList: true,
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      // Check if user is already registered
      const isParticipant = event.participants.some((p) => p.id === ctx.userId);
      const isWaiting = event.waitingList.some((p) => p.id === ctx.userId);

      if (isParticipant || isWaiting) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already registered for this event",
        });
      }

      // Check if event is full
      if (
        event.maxParticipants &&
        event.participants.length >= event.maxParticipants
      ) {
        // Add to waiting list
        await ctx.prisma.event.update({
          where: { id: input.eventId },
          data: {
            waitingList: {
              connect: { id: ctx.userId! },
            },
          },
        });
      } else {
        // Add to participants
        await ctx.prisma.event.update({
          where: { id: input.eventId },
          data: {
            participants: {
              connect: { id: ctx.userId! },
            },
          },
        });
      }

      // Record participation (use upsert to handle case where record might already exist)
      await ctx.prisma.eventParticipation.upsert({
        where: {
          eventId_userId: {
            eventId: input.eventId,
            userId: ctx.userId!,
          },
        },
        update: {
          status: "registered",
        },
        create: {
          eventId: input.eventId,
          userId: ctx.userId!,
          status: "registered",
        },
      });

      return input.eventId;
    }),

  leaveEvent: memberProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          participants: true,
          waitingList: true,
        },
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const isParticipant = event.participants.some((p) => p.id === ctx.userId);
      const isWaiting = event.waitingList.some((p) => p.id === ctx.userId);

      if (!isParticipant && !isWaiting) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not registered for this event",
        });
      }

      // Remove from participants or waiting list
      const updateData: any = {};
      if (isParticipant) {
        updateData.participants = {
          disconnect: { id: ctx.userId! },
        };
      }
      if (isWaiting) {
        updateData.waitingList = {
          disconnect: { id: ctx.userId! },
        };
      }

      // If removed from participants and there's a waiting list, move first person from waiting list
      if (isParticipant && event.waitingList.length > 0) {
        const nextParticipant = event.waitingList[0];
        updateData.participants = {
          connect: [{ id: nextParticipant.id }],
        };
        updateData.waitingList = {
          disconnect: { id: nextParticipant.id },
        };
      }

      await ctx.prisma.event.update({
        where: { id: input.eventId },
        data: updateData,
      });

      // Delete participation record
      await ctx.prisma.eventParticipation.deleteMany({
        where: {
          eventId: input.eventId,
          userId: ctx.userId!,
        },
      });

      return input.eventId;
    }),
});

