"use client";

import DashboardLayoutComponent from "@/components/DashboardLayout";
import { RouteProtection } from "@/components/RouteProtection";

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection requiredRole="member">
      <DashboardLayoutComponent>{children}</DashboardLayoutComponent>
    </RouteProtection>
  );
}

