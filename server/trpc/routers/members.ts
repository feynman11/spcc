import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure, memberProcedure, userProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const membershipTypeEnum = z.enum(["full", "social", "junior"]);

// Helper function to update isActive based on lastLogin
// Active means logged in within the last month (30 days)
async function updateMemberActiveStatus(prisma: any, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLogin: true },
  });

  if (!user) return;

  const member = await prisma.member.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!member) return;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const isActive = user.lastLogin ? user.lastLogin >= oneMonthAgo : false;

  await prisma.member.update({
    where: { id: member.id },
    data: { isActive },
  });
}

export const membersRouter = router({
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.userId },
      include: {
        member: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      member: user.member,
    };
  }),

  getCurrentMember: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return null;

    // Update isActive based on lastLogin before returning
    await updateMemberActiveStatus(ctx.prisma, ctx.userId);

    const member = await ctx.prisma.member.findUnique({
      where: { userId: ctx.userId },
    });

    return member;
  }),

  getAllUsers: memberProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      include: {
        member: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate isActive based on lastLogin (within last month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Update isActive for all members based on their lastLogin (in background)
    const updatePromises = users
      .filter(u => u.member && u.lastLogin !== null)
      .map(async (user) => {
        if (!user.member) return;
        const isActive = user.lastLogin ? user.lastLogin >= oneMonthAgo : false;
        if (user.member.isActive !== isActive) {
          await ctx.prisma.member.update({
            where: { id: user.member.id },
            data: { isActive },
          });
        }
      });
    
    // Don't await - let it run in background
    Promise.all(updatePromises).catch(console.error);

    // Group users by role
    const grouped = {
      public: users.filter(u => u.role === "public"),
      user: users.filter(u => u.role === "user"),
      member: users.filter(u => u.role === "member"),
      admin: users.filter(u => u.role === "admin"),
    };

    return {
      all: users.map(u => {
        // Calculate isActive based on lastLogin
        const calculatedIsActive = u.member && u.lastLogin 
          ? u.lastLogin >= oneMonthAgo 
          : (u.member?.isActive ?? false);
        
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
          member: u.member ? {
            ...u.member,
            isActive: calculatedIsActive,
          } : null,
        };
      }),
      grouped,
    };
  }),

  getAllMembers: memberProcedure.query(async ({ ctx }) => {
    const members = await ctx.prisma.member.findMany({
      orderBy: { joinDate: "desc" },
    });
    return members;
  }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.role === "member" || user.role === "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already approved",
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: "member" },
      });

      return updatedUser;
    }),

  createMember: userProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        membershipType: membershipTypeEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if member already exists
      const existingMember = await ctx.prisma.member.findUnique({
        where: { userId: ctx.userId! },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Member profile already exists",
        });
      }

      const member = await ctx.prisma.member.create({
        data: {
          userId: ctx.userId!,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          emergencyContact: input.emergencyContact,
          emergencyPhone: input.emergencyPhone,
          membershipType: input.membershipType,
          isActive: true,
        },
      });

      return member.id;
    }),

  updateMember: userProcedure
    .input(
      z.object({
        memberId: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        membershipType: membershipTypeEnum.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { memberId, ...updates } = input;

      const member = await ctx.prisma.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this member",
        });
      }

      const updatedMember = await ctx.prisma.member.update({
        where: { id: memberId },
        data: updates,
      });

      return updatedMember.id;
    }),

  togglePaidStatus: adminProcedure
    .input(z.object({ memberId: z.string(), isPaid: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.member.findUnique({
        where: { id: input.memberId },
      });

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      const updatedMember = await ctx.prisma.member.update({
        where: { id: input.memberId },
        data: { isPaid: input.isPaid },
      });

      return updatedMember;
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from deleting themselves
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      const userToDelete = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          uploadedRoutes: true,
        },
      });

      if (!userToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Reassign all routes created by this user to the admin who is deleting them
      if (userToDelete.uploadedRoutes.length > 0) {
        await ctx.prisma.route.updateMany({
          where: { uploadedBy: input.userId },
          data: { uploadedBy: ctx.userId },
        });
      }

      // Explicitly delete all sessions for this user to force immediate logout
      // (This will also happen via cascade, but doing it explicitly ensures it happens first)
      await ctx.prisma.session.deleteMany({
        where: { userId: input.userId },
      });

      // Delete the user (this will cascade delete member profile, accounts, etc.)
      await ctx.prisma.user.delete({
        where: { id: input.userId },
      });

      return { success: true, routesReassigned: userToDelete.uploadedRoutes.length };
    }),
});

