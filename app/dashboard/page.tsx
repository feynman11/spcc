"use client";

import { trpc } from "@/lib/trpc/client";
import { RouteProtection } from "@/components/RouteProtection";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminStats } from "@/components/AdminStats";
import { usePageViewTracking } from "@/lib/analytics";
import { useClubConfig } from "@/lib/config/useClubConfig";

function DashboardContent() {
  usePageViewTracking();
  const router = useRouter();
  const clubConfig = useClubConfig();
  const { data: currentMember, isLoading: memberLoading } = trpc.members.getCurrentMember.useQuery();
  const { data: upcomingEvents, isLoading: eventsLoading } = trpc.events.getUpcomingEvents.useQuery();
  const { data: allRoutes, isLoading: routesLoading } = trpc.routes.getAllRoutes.useQuery();
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();
  const isAdmin = currentUser?.role === "admin";

  // Show loading spinner only when queries are actually loading
  if (memberLoading || eventsLoading || routesLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: clubConfig.colors.primary }}
        ></div>
      </div>
    );
  }

  // Show message if member profile doesn't exist
  if (!currentMember) {
    return (
      <div className="space-y-8">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to {clubConfig.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Complete your member profile to access all club features and participate in events.
          </p>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: clubConfig.colors.primaryLight }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: clubConfig.colors.primary }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: clubConfig.colors.primaryHover }}
              >
                Create Your Member Profile
              </h3>
              <p
                className="mb-4"
                style={{ color: clubConfig.colors.primaryHover }}
              >
                Join the community! Complete your member profile to access all club features, 
                participate in events, and connect with fellow cyclists.
              </p>
              <button
                onClick={() => router.push("/members")}
                className="text-white px-6 py-3 rounded-xl transition-colors font-medium inline-flex items-center"
                style={{ backgroundColor: clubConfig.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = clubConfig.colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = clubConfig.colors.primary;
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Member Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRoutes = allRoutes?.length || 0;
  const totalEvents = upcomingEvents?.length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome back, {currentMember.firstName}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Ready for your next adventure? Here's what's happening at {clubConfig.shortName}.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: clubConfig.colors.primaryLight }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: clubConfig.colors.primary }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Upcoming Events
              </p>
              <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Available Routes
              </p>
              <p className="text-3xl font-bold text-gray-900">{totalRoutes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Membership
              </p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {currentMember?.membershipType || "Not Set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">
              Upcoming Events
            </h3>
          </div>
          <div className="p-6">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(event.date).toLocaleDateString()} at{" "}
                        {event.startTime}
                      </p>
                      {event.route && (
                        <p
                          className="text-sm font-medium"
                          style={{ color: clubConfig.colors.primary }}
                        >
                          {event.route.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {event.participantCount} riders
                      </p>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          event.difficulty === "easy"
                            ? "bg-green-100 text-green-800"
                            : event.difficulty === "moderate"
                            ? "bg-yellow-100 text-yellow-800"
                            : event.difficulty === "hard"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.difficulty}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No upcoming events scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Popular Routes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">
              Popular Routes
            </h3>
          </div>
          <div className="p-6">
            {allRoutes && allRoutes.length > 0 ? (
              <div className="space-y-4">
                {allRoutes
                  .sort((a, b) => b.eventCount - a.eventCount)
                  .slice(0, 5)
                  .map((route) => (
                    <Link
                      key={route.id}
                      href={`/routes/${route.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {route.name}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {route.distance}km • +{route.elevationAscent ?? route.elevation}m / -{route.elevationDescent ?? 0}m
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: clubConfig.colors.primary }}
                        >
                          {route.startLocation}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {route.eventCount} events
                        </p>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            route.difficulty === "easy"
                              ? "bg-green-100 text-green-800"
                              : route.difficulty === "moderate"
                              ? "bg-yellow-100 text-yellow-800"
                              : route.difficulty === "hard"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {route.difficulty}
                        </span>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No routes available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Stats Section */}
      {isAdmin && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <AdminStats />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <RouteProtection requiredRole="member">
      <DashboardContent />
    </RouteProtection>
  );
}

