"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { SignOutButton } from "@/components/SignOutButton";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = trpc.members.getCurrentMember.useQuery();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const navigation = [
    { id: "dashboard", name: "Dashboard", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z", path: "/dashboard" },
    { id: "events", name: "Events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", path: "/events" },
    { id: "routes", name: "Routes", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7", path: "/routes" },
    { id: "calendar", name: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", path: "/calendar" },
    { id: "members", name: "Members", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", path: "/members" },
  ];

  const activeTab = navigation.find((nav) => pathname?.startsWith(nav.path))?.id || "dashboard";
  const currentIndex = navigation.findIndex((nav) => nav.id === activeTab);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current || !startY.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const diffX = Math.abs(currentX - startX.current);
    const diffY = Math.abs(currentY - startY.current);

    if (diffX > diffY && diffX > 10) {
      isDragging.current = true;
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current || !startX.current) return;

    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        const nextIndex = Math.min(currentIndex + 1, navigation.length - 1);
        if (nextIndex !== currentIndex) {
          router.push(navigation[nextIndex].path);
        }
      } else {
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
          router.push(navigation[prevIndex].path);
        }
      }
    }

    startX.current = 0;
    startY.current = 0;
    isDragging.current = false;
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="/spcc_logo.jpg"
                alt="South Peaks Cycle Club Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const svg = e.currentTarget.nextElementSibling as HTMLElement;
                  if (svg) svg.classList.remove("hidden");
                }}
              />
              <svg
                className="w-full h-full text-red-600 hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">South Peaks</h1>
              <p className="text-xs text-gray-500">Cycle Club</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-red-50 text-red-700 border border-red-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.firstName?.charAt(0) ||
                    session?.user?.email?.charAt(0) ||
                    "U"}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user
                    ? `${user.firstName} ${user.lastName}`
                    : session?.user?.email || "User"}
                </p>
                <p className="text-xs text-gray-500">Member</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-100 lg:hidden">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <img
                  src="/spcc_logo.jpg"
                  alt="South Peaks Cycle Club Logo"
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const svg = e.currentTarget.nextElementSibling as HTMLElement;
                    if (svg) svg.classList.remove("hidden");
                  }}
                />
                <svg
                  className="w-5 h-5 text-red-600 hidden"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="ml-2 font-bold text-gray-900">South Peaks</span>
            </div>

            {/* Page indicators */}
            <div className="hidden sm:flex items-center space-x-2">
              {navigation.map((item) => (
                <div
                  key={item.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeTab === item.id ? "bg-red-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile page indicators */}
          <div className="flex sm:hidden justify-center pb-3">
            <div className="flex items-center space-x-2">
              {navigation.map((item) => (
                <div
                  key={item.id}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeTab === item.id ? "bg-red-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        {/* Page content with swipe support */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>

          {/* Swipe hint for mobile */}
          <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-full pointer-events-none opacity-50">
            Swipe left/right to navigate
          </div>
        </main>
      </div>
    </div>
  );
}

