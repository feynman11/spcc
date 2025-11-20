import { z } from "zod";
import { router, protectedProcedure, publicProcedure, memberProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const difficultyEnum = z.enum(["easy", "moderate", "hard", "expert"]);
const routeTypeEnum = z.enum(["road", "mountain", "gravel", "mixed"]);

export const routesRouter = router({
  getAllRoutes: publicProcedure.query(async ({ ctx }) => {
    const routes = await ctx.prisma.route.findMany({
      include: {
        user: {
          include: {
            member: true,
          },
        },
      },
      orderBy: { uploadDate: "desc" },
    });

    return routes.map((route) => ({
      id: route.id,
      name: route.name,
      description: route.description,
      distance: route.distance,
      elevation: route.elevation,
      difficulty: route.difficulty,
      gpxObjectName: route.gpxFileUrl, // This now stores the MinIO object name
      gpxFileName: route.gpxFileName,
      uploadedBy: route.uploadedBy,
      uploadDate: route.uploadDate.getTime(),
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      routeType: route.routeType,
      tags: route.tags,
      eventCount: route.eventCount,
      uploaderName: route.user.member
        ? `${route.user.member.firstName} ${route.user.member.lastName}`
        : route.user.email || "Unknown",
    }));
  }),

  getRoute: publicProcedure
    .input(z.object({ routeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const route = await ctx.prisma.route.findUnique({
        where: { id: input.routeId },
        include: {
          user: {
            include: {
              member: true,
            },
          },
        },
      });

      if (!route) return null;

      return {
        id: route.id,
        name: route.name,
        description: route.description,
        distance: route.distance,
        elevation: route.elevation,
        difficulty: route.difficulty,
        gpxObjectName: route.gpxFileUrl, // This now stores the MinIO object name
        gpxFileName: route.gpxFileName,
        uploadedBy: route.uploadedBy,
        uploadDate: route.uploadDate.getTime(),
        startLocation: route.startLocation,
        endLocation: route.endLocation,
        routeType: route.routeType,
        tags: route.tags,
        eventCount: route.eventCount,
        uploaderName: route.user.member
          ? `${route.user.member.firstName} ${route.user.member.lastName}`
          : route.user.email || "Unknown",
      };
    }),

  searchRoutes: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        difficulty: difficultyEnum.optional(),
        routeType: routeTypeEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.difficulty) {
        where.difficulty = input.difficulty;
      }

      if (input.routeType) {
        where.routeType = input.routeType;
      }

      if (input.searchTerm) {
        where.name = {
          contains: input.searchTerm,
          mode: "insensitive",
        };
      }

      const routes = await ctx.prisma.route.findMany({
        where,
        include: {
          user: {
            include: {
              member: true,
            },
          },
        },
        orderBy: { uploadDate: "desc" },
      });

      return routes.map((route) => ({
        id: route.id,
        name: route.name,
        description: route.description,
        distance: route.distance,
        elevation: route.elevation,
        difficulty: route.difficulty,
        gpxObjectName: route.gpxFileUrl, // This now stores the MinIO object name
        gpxFileName: route.gpxFileName,
        uploadedBy: route.uploadedBy,
        uploadDate: route.uploadDate.getTime(),
        startLocation: route.startLocation,
        endLocation: route.endLocation,
        routeType: route.routeType,
        tags: route.tags,
        eventCount: route.eventCount,
        uploaderName: route.user.member
          ? `${route.user.member.firstName} ${route.user.member.lastName}`
          : route.user.email || "Unknown",
      }));
    }),

  createRoute: memberProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        distance: z.number(),
        elevation: z.number(),
        difficulty: difficultyEnum,
        gpxObjectName: z.string().optional(), // MinIO object name
        gpxFileName: z.string().optional(),
        startLocation: z.string(),
        endLocation: z.string().optional(),
        routeType: routeTypeEnum,
        tags: z.array(z.string()).optional(),
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

      const route = await ctx.prisma.route.create({
        data: {
          name: input.name,
          description: input.description,
          distance: input.distance,
          elevation: input.elevation,
          difficulty: input.difficulty,
          gpxFileUrl: input.gpxObjectName, // Store MinIO object name in gpxFileUrl field
          gpxFileName: input.gpxFileName,
          uploadedBy: ctx.userId,
          startLocation: input.startLocation,
          endLocation: input.endLocation,
          routeType: input.routeType,
          tags: input.tags || [],
          eventCount: 0,
        },
      });

      return route.id;
    }),

  getGpxDownloadUrl: publicProcedure
    .input(z.object({ objectName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { minioClient, getBucketName } = await import("@/lib/minio");
      
      // Generate presigned URL (valid for 1 hour)
      const url = await minioClient.presignedGetObject(
        getBucketName(),
        input.objectName,
        3600
      );

      return { url };
    }),
});

