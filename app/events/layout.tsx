"use client";

import DashboardLayoutComponent from "@/components/DashboardLayout";
import { RouteProtection } from "@/components/RouteProtection";

export default function EventsLayout({
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

