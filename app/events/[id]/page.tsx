"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RouteMap } from "@/components/RouteMap";
import { useEventJoinLeave } from "@/hooks/useEventJoinLeave";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);
  const { data: event, isLoading: eventLoading } = trpc.events.getEvent.useQuery(
    {
      eventId: id,
    },
    { enabled: !!id }
  );
  
  // Get route details if event has a route
  const { data: route } = trpc.routes.getRoute.useQuery(
    { routeId: event?.routeId || "" },
    { enabled: !!event?.routeId }
  );
  
  // Get GPX download URL if route has a GPX file
  const { data: gpxUrlData } = trpc.routes.getGpxDownloadUrl.useQuery(
    { objectName: route?.gpxObjectName || "" },
    { enabled: !!route?.gpxObjectName }
  );

  const { joinEvent, leaveEvent, currentUser, checkIsRegistered } = useEventJoinLeave(id);
  const isRegistered = checkIsRegistered(event);

  if (eventLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
        <button
          onClick={() => router.push("/events")}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/events")}
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
          Back to Events
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

      {/* Event Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex gap-2">
            <span
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
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
              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                event.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : event.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>

        {event.description && <p className="text-gray-600 mb-6">{event.description}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Date</div>
            <div className="text-lg font-semibold text-gray-900">
              {eventDate.toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Start Time</div>
            <div className="text-lg font-semibold text-gray-900">{event.startTime}</div>
          </div>
          {event.duration && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {Math.floor(event.duration / 60)}h {event.duration % 60}m
              </div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-500 mb-1">Type</div>
            <div className="text-lg font-semibold text-gray-900 capitalize">
              {event.eventType.replace("_", " ")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="font-medium text-gray-700">Meeting Point:</span>
            <span className="ml-2 text-gray-600">{event.meetingPoint}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Organizer:</span>
            <span className="ml-2 text-gray-600">{event.organizerName}</span>
          </div>
          {event.route && (
            <div>
              <span className="font-medium text-gray-700">Route:</span>
              <Link
                href={`/routes/${event.route.id}`}
                className="ml-2 text-red-600 hover:text-red-700 hover:underline"
              >
                {event.route.name} ({event.route.distance}km)
              </Link>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Participants:</span>
            <span className="ml-2 text-gray-600">
              {event.participantCount}
              {event.maxParticipants && ` / ${event.maxParticipants}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {currentUser && (
            <>
              {isRegistered ? (
                <button
                  onClick={() => leaveEvent.mutate({ eventId: id })}
                  disabled={leaveEvent.isPending || isPastEvent}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {leaveEvent.isPending ? "Leaving..." : "I can't make it"}
                </button>
              ) : (
                <button
                  onClick={() => joinEvent.mutate({ eventId: id })}
                  disabled={joinEvent.isPending || isPastEvent}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joinEvent.isPending ? "Joining..." : "Join Event"}
                </button>
              )}
            </>
          )}
          {event.stravaEventUrl && (
            <a
              href={event.stravaEventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium text-center inline-flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7.02 13.828h4.169" />
              </svg>
              View on Strava
            </a>
          )}
        </div>

        {event.weatherConditions && (
          <div className="mb-4">
            <span className="font-medium text-gray-700">Weather Conditions:</span>
            <span className="ml-2 text-gray-600">{event.weatherConditions}</span>
          </div>
        )}

        {event.notes && (
          <div className="mb-4">
            <span className="font-medium text-gray-700">Notes:</span>
            <p className="mt-1 text-gray-600">{event.notes}</p>
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Participants ({event.participantCount})
        </h2>
        {event.participants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{participant.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No participants yet</p>
        )}
      </div>

      {/* Route Map */}
      {event.route && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
            {route && (
              <p className="text-sm text-gray-500 mt-1">
              {route.name} • {route.distance}km • +{route.elevationAscent ?? route.elevation}m / -{route.elevationDescent ?? 0}m
            </p>
            )}
          </div>
          <div className="p-6">
            <RouteMap
              gpxObjectName={route?.gpxObjectName}
              routeName={route?.name}
              routeDistance={route?.distance}
              routeElevation={route?.elevation}
            />
          </div>
        </div>
      )}
    </div>
  );
}

