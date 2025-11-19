"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { RouteMap } from "@/components/RouteMap";
import Link from "next/link";

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  const { data: route, isLoading: routeLoading } = trpc.routes.getRoute.useQuery(
    {
      routeId: id,
    },
    { enabled: !!id }
  );
  const { data: gpxUrlData } = trpc.routes.getGpxDownloadUrl.useQuery(
    { objectName: route?.gpxObjectName || "" },
    { enabled: !!route?.gpxObjectName }
  );
  const { data: routeEvents, isLoading: eventsLoading } = trpc.events.getEventsByRoute.useQuery(
    { routeId: id },
    { enabled: !!id }
  );

  // Separate events into upcoming and past
  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!routeEvents) return { upcomingEvents: [], pastEvents: [] };
    
    const now = Date.now();
    const upcoming: typeof routeEvents = [];
    const past: typeof routeEvents = [];
    
    routeEvents.forEach((event) => {
      if (event.date >= now) {
        upcoming.push(event);
      } else {
        past.push(event);
      }
    });
    
    // Sort upcoming by date ascending, past by date descending
    upcoming.sort((a, b) => a.date - b.date);
    past.sort((a, b) => b.date - a.date);
    
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [routeEvents]);

  if (routeLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Route not found</h2>
        <button
          onClick={() => router.push("/routes")}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Back to Routes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/routes")}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Routes
        </button>
        {gpxUrlData?.url && (
          <button
            onClick={() => window.open(gpxUrlData.url, "_blank")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download GPX
          </button>
        )}
      </div>

      {/* Route Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{route.name}</h1>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
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

        {route.description && <p className="text-gray-600 mb-6">{route.description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{route.distance}km</div>
            <div className="text-sm text-gray-500">Distance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{route.elevation}m</div>
            <div className="text-sm text-gray-500">Elevation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 capitalize">{route.routeType}</div>
            <div className="text-sm text-gray-500">Type</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{route.eventCount}</div>
            <div className="text-sm text-gray-500">Events</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Start:</span>
            <span className="ml-2 text-gray-600">{route.startLocation}</span>
          </div>
          {route.endLocation && (
            <div>
              <span className="font-medium text-gray-700">End:</span>
              <span className="ml-2 text-gray-600">{route.endLocation}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Added by:</span>
            <span className="ml-2 text-gray-600">{route.uploaderName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Upload date:</span>
            <span className="ml-2 text-gray-600">
              {new Date(route.uploadDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {route.tags && route.tags.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-gray-700 block mb-2">Tags:</span>
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        </div>
        <div className="p-6">
          <RouteMap
            gpxUrl={gpxUrlData?.url}
            routeName={route?.name}
            routeDistance={route?.distance}
            routeElevation={route?.elevation}
          />
        </div>
      </div>

      {/* Events Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Events on this Route</h3>
        </div>
        <div className="p-6">
          {eventsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events scheduled for this route yet.</p>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Upcoming Events</h4>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => {
                      const eventDate = new Date(event.date);
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-1">{event.title}</h5>
                              {event.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {eventDate.toLocaleDateString()} at {event.startTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {event.meetingPoint}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  {event.participantCount} {event.participantCount === 1 ? "participant" : "participants"}
                                  {event.maxParticipants && ` / ${event.maxParticipants} max`}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-2">
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
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  event.status === "scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : event.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {event.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Past Events</h4>
                  <div className="space-y-4">
                    {pastEvents.map((event) => {
                      const eventDate = new Date(event.date);
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all opacity-75"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-1">{event.title}</h5>
                              {event.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {eventDate.toLocaleDateString()} at {event.startTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                  {event.participantCount} {event.participantCount === 1 ? "participant" : "participants"}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-2">
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
                              <span
                                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  event.status === "completed"
                                    ? "bg-gray-100 text-gray-800"
                                    : event.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {event.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

