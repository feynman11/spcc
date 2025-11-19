"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

type Role = "public" | "user" | "member" | "admin";

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredRole?: Role;
  fallback?: React.ReactNode;
}

export function RouteProtection({ 
  children, 
  requiredRole = "user",
  fallback 
}: RouteProtectionProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = trpc.members.getCurrentUser.useQuery();

  useEffect(() => {
    if (status === "loading" || userLoading) return;

    // Public routes don't need authentication
    if (requiredRole === "public") {
      return;
    }

    // Check if user is authenticated
    if (status === "unauthenticated" || !session) {
      router.push("/");
      return;
    }

    // If we have a session but no currentUser, the user was likely deleted
    // Sign them out immediately
    if (status === "authenticated" && session && !currentUser && !userLoading) {
      signOut({ callbackUrl: "/" });
      return;
    }

    // Check role-based access
    if (currentUser) {
      const userRole = currentUser.role as Role;
      const roleHierarchy: Record<Role, number> = {
        public: 0,
        user: 1,
        member: 2,
        admin: 3,
      };

      const userRoleLevel = roleHierarchy[userRole] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        // User doesn't have required role, redirect to home
        router.push("/");
        return;
      }
    }
  }, [status, session, currentUser, requiredRole, router, userLoading]);

  // Show loading state
  if (status === "loading" || userLoading) {
    return (
      fallback || (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )
    );
  }

  // Check if user is authenticated for non-public routes
  if (requiredRole !== "public" && (status === "unauthenticated" || !session)) {
    return null; // Will redirect
  }

  // Check role-based access
  if (currentUser && requiredRole !== "public") {
    const userRole = currentUser.role as Role;
    const roleHierarchy: Record<Role, number> = {
      public: 0,
      user: 1,
      member: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}

