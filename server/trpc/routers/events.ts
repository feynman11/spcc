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
        repeatInterval: z.union([z.literal(1), z.literal(2), z.literal(4), z.literal(8)]).optional(),
        numberOfRecurrences: z.number().optional(),
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

      // Determine if we need to create recurring events
      const shouldRepeat = input.repeatInterval && input.numberOfRecurrences && input.numberOfRecurrences > 1;
      const repeatIntervalWeeks = shouldRepeat ? input.repeatInterval! : 0;
      const numberOfEvents = shouldRepeat ? input.numberOfRecurrences! : 1;

      const baseDate = new Date(input.date);
      const createdEventIds: string[] = [];

      // Create all events (single or recurring)
      for (let i = 0; i < numberOfEvents; i++) {
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + (i * repeatIntervalWeeks * 7));

        const event = await ctx.prisma.event.create({
          data: {
            title: input.title,
            description: input.description,
            date: eventDate,
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

        createdEventIds.push(event.id);
      }

      // Increment route event count if route is selected
      if (input.routeId) {
        await ctx.prisma.route.update({
          where: { id: input.routeId },
          data: {
            eventCount: {
              increment: numberOfEvents,
            },
          },
        });
      }

      return shouldRepeat 
        ? { eventIds: createdEventIds, count: numberOfEvents }
        : createdEventIds[0];
    }),

  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.number().optional(),
        startTime: z.string().optional(),
        duration: z.number().optional(),
        routeId: z.string().nullable().optional(),
        meetingPoint: z.string().optional(),
        maxParticipants: z.number().nullable().optional(),
        difficulty: difficultyEnum.optional(),
        eventType: eventTypeEnum.optional(),
        stravaEventUrl: z.string().nullable().optional(),
        status: eventStatusEnum.optional(),
        weatherConditions: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found in session",
        });
      }

      // Get the event to check ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          route: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check if user is the organizer or an admin
      const isOrganizer = event.organizer === ctx.userId;
      const isAdmin = ctx.userRole === "admin";

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit events you organized, or you must be an admin",
        });
      }

      // Handle route change - update event counts
      const oldRouteId = event.routeId;
      const newRouteId = input.routeId !== undefined ? input.routeId : oldRouteId;

      if (oldRouteId !== newRouteId) {
        // Decrement old route event count
        if (oldRouteId) {
          await ctx.prisma.route.update({
            where: { id: oldRouteId },
            data: {
              eventCount: {
                decrement: 1,
              },
            },
          });
        }
        // Increment new route event count
        if (newRouteId) {
          await ctx.prisma.route.update({
            where: { id: newRouteId },
            data: {
              eventCount: {
                increment: 1,
              },
            },
          });
        }
      }

      // Build update data object with only provided fields
      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.date !== undefined) updateData.date = new Date(input.date);
      if (input.startTime !== undefined) updateData.startTime = input.startTime;
      if (input.duration !== undefined) updateData.duration = input.duration;
      if (input.routeId !== undefined) updateData.routeId = input.routeId;
      if (input.meetingPoint !== undefined) updateData.meetingPoint = input.meetingPoint;
      if (input.maxParticipants !== undefined) updateData.maxParticipants = input.maxParticipants;
      if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
      if (input.eventType !== undefined) updateData.eventType = input.eventType;
      if (input.stravaEventUrl !== undefined) updateData.stravaEventUrl = input.stravaEventUrl;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.weatherConditions !== undefined) updateData.weatherConditions = input.weatherConditions;
      if (input.notes !== undefined) updateData.notes = input.notes;

      // Update the event
      const updatedEvent = await ctx.prisma.event.update({
        where: { id: input.eventId },
        data: updateData,
      });

      return updatedEvent.id;
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

  deleteEvent: protectedProcedure
    .input(z.object({ 
      eventId: z.string(),
      deleteFutureEvents: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID not found in session",
        });
      }

      // Get the event to check ownership
      const event = await ctx.prisma.event.findUnique({
        where: { id: input.eventId },
        include: {
          route: true,
        },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Check if user is the organizer or an admin
      const isOrganizer = event.organizer === ctx.userId;
      const isAdmin = ctx.userRole === "admin";

      if (!isOrganizer && !isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete events you organized, or you must be an admin",
        });
      }

      let eventsToDelete = [event];
      let routeIdsToUpdate = new Set<string>();

      // If deleteFutureEvents is true, find all related recurring events
      if (input.deleteFutureEvents) {
        const relatedEvents = await ctx.prisma.event.findMany({
          where: {
            title: event.title,
            organizer: event.organizer,
            startTime: event.startTime,
            meetingPoint: event.meetingPoint,
            routeId: event.routeId,
            date: {
              gt: event.date,
            },
            status: {
              not: "cancelled", // Don't delete already cancelled events
            },
          },
          include: {
            route: true,
          },
        });

        eventsToDelete = [event, ...relatedEvents];
      }

      // Collect route IDs that need event count updates
      eventsToDelete.forEach((e) => {
        if (e.routeId) {
          routeIdsToUpdate.add(e.routeId);
        }
      });

      // Delete all events
      const eventIds = eventsToDelete.map((e) => e.id);
      await ctx.prisma.event.deleteMany({
        where: {
          id: {
            in: eventIds,
          },
        },
      });

      // Decrement route event counts
      for (const routeId of routeIdsToUpdate) {
        await ctx.prisma.route.update({
          where: { id: routeId },
          data: {
            eventCount: {
              decrement: eventsToDelete.filter((e) => e.routeId === routeId).length,
            },
          },
        });
      }

      return { 
        success: true, 
        deletedCount: eventsToDelete.length,
      };
    }),
});

