"use client";

import DashboardLayoutComponent from "@/components/DashboardLayout";
import { RouteProtection } from "@/components/RouteProtection";

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection requiredRole="user">
      <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
    </RouteProtection>
  );
}

