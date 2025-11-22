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
      elevationAscent: route.elevationAscent ?? route.elevation,
      elevationDescent: route.elevationDescent ?? 0,
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
        elevationAscent: route.elevationAscent ?? route.elevation,
        elevationDescent: route.elevationDescent ?? 0,
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
        elevationAscent: route.elevationAscent ?? route.elevation,
        elevationDescent: route.elevationDescent ?? 0,
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
        elevationAscent: z.number().optional(),
        elevationDescent: z.number().optional(),
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
          elevationAscent: input.elevationAscent ?? input.elevation,
          elevationDescent: input.elevationDescent ?? 0,
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
      const bucketName = getBucketName();
      
      console.log(`[MinIO] Generating presigned URL for object '${input.objectName}' in bucket '${bucketName}'`);
      
      try {
        // Generate presigned URL (valid for 1 hour)
        const url = await minioClient.presignedGetObject(
          bucketName,
          input.objectName,
          3600
        );
        console.log(`[MinIO] Successfully generated presigned URL for object '${input.objectName}'`);
        return { url };
      } catch (error) {
        console.error(`[MinIO] Failed to generate presigned URL for object '${input.objectName}' in bucket '${bucketName}':`, error);
        throw error;
      }
    }),

  getGpxContent: publicProcedure
    .input(z.object({ objectName: z.string() }))
    .query(async ({ ctx, input }) => {
      const { minioClient, getBucketName } = await import("@/lib/minio");
      const bucketName = getBucketName();
      
      console.log(`[MinIO] Fetching object '${input.objectName}' from bucket '${bucketName}'`);
      
      try {
        // Fetch GPX file content from MinIO server-side
        const dataStream = await minioClient.getObject(
          bucketName,
          input.objectName
        );

        // Convert stream to string
        const chunks: Buffer[] = [];
        for await (const chunk of dataStream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const content = buffer.toString('utf-8');

        console.log(`[MinIO] Successfully fetched object '${input.objectName}' (${buffer.length} bytes)`);
        return { content };
      } catch (error) {
        console.error(`[MinIO] Failed to fetch object '${input.objectName}' from bucket '${bucketName}':`, error);
        throw error;
      }
    }),
});

