"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RouteMap } from "@/components/RouteMap";
import { useEventJoinLeave } from "@/hooks/useEventJoinLeave";
import { toast } from "sonner";
import { DeleteEventDialog } from "@/components/DeleteEventDialog";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    duration: "",
    routeId: "",
    meetingPoint: "",
    maxParticipants: "",
    difficulty: "moderate" as "easy" | "moderate" | "hard" | "expert",
    eventType: "group_ride" as "group_ride" | "training" | "race" | "social",
    stravaEventUrl: "",
    status: "scheduled" as "scheduled" | "cancelled" | "completed",
    weatherConditions: "",
    notes: "",
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);
  const utils = trpc.useUtils();
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();
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

  const { data: allRoutes } = trpc.routes.getAllRoutes.useQuery();
  const { joinEvent, leaveEvent, currentUser: eventUser, checkIsRegistered } = useEventJoinLeave(id);
  const isRegistered = checkIsRegistered(event);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteEvent = trpc.events.deleteEvent.useMutation({
    onSuccess: (result) => {
      const deletedCount = result.deletedCount || 1;
      if (deletedCount > 1) {
        toast.success(`${deletedCount} events deleted successfully`);
      } else {
        toast.success("Event deleted successfully");
      }
      router.push("/events");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
      setDeleteDialogOpen(false);
    },
  });

  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated successfully");
      utils.events.getEvent.invalidate({ eventId: id });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  const canEdit = event && currentUser && (event.organizer === currentUser.id || currentUser.role === "admin");
  const canDelete = event && currentUser && (event.organizer === currentUser.id || currentUser.role === "admin");

  // Initialize edit form when event loads or editing starts
  useEffect(() => {
    if (event && isEditing) {
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toISOString().split('T')[0];
      setEditFormData({
        title: event.title,
        description: event.description || "",
        date: dateStr,
        startTime: event.startTime,
        duration: event.duration?.toString() || "",
        routeId: event.routeId || "",
        meetingPoint: event.meetingPoint,
        maxParticipants: event.maxParticipants?.toString() || "",
        difficulty: event.difficulty,
        eventType: event.eventType,
        stravaEventUrl: event.stravaEventUrl || "",
        status: event.status,
        weatherConditions: event.weatherConditions || "",
        notes: event.notes || "",
      });
    }
  }, [event, isEditing]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent.mutate({
      eventId: id,
      title: editFormData.title,
      description: editFormData.description || undefined,
      date: new Date(editFormData.date).getTime(),
      startTime: editFormData.startTime,
      duration: editFormData.duration ? parseInt(editFormData.duration) : undefined,
      routeId: editFormData.routeId || null,
      meetingPoint: editFormData.meetingPoint,
      maxParticipants: editFormData.maxParticipants ? parseInt(editFormData.maxParticipants) : null,
      difficulty: editFormData.difficulty,
      eventType: editFormData.eventType,
      stravaEventUrl: editFormData.stravaEventUrl || null,
      status: editFormData.status,
      weatherConditions: editFormData.weatherConditions || null,
      notes: editFormData.notes || null,
    });
  };

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
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              {isEditing ? "Cancel Edit" : "Edit Event"}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => {
                setDeleteDialogOpen(true);
              }}
              disabled={deleteEvent.isPending}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {deleteEvent.isPending ? "Deleting..." : "Delete Event"}
            </button>
          )}
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
      </div>

      {/* Event Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                <select
                  required
                  value={editFormData.eventType}
                  onChange={(e) => setEditFormData({ ...editFormData, eventType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="group_ride">Group Ride</option>
                  <option value="training">Training</option>
                  <option value="race">Race</option>
                  <option value="social">Social</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                <input
                  type="time"
                  required
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                <select
                  required
                  value={editFormData.difficulty}
                  onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                <select
                  value={editFormData.routeId}
                  onChange={(e) => setEditFormData({ ...editFormData, routeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">No specific route</option>
                  {allRoutes?.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name} ({route.distance}km, {route.difficulty})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  required
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Point *</label>
                <input
                  type="text"
                  required
                  value={editFormData.meetingPoint}
                  onChange={(e) => setEditFormData({ ...editFormData, meetingPoint: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                <input
                  type="number"
                  value={editFormData.maxParticipants}
                  onChange={(e) => setEditFormData({ ...editFormData, maxParticipants: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strava Event URL</label>
                <input
                  type="url"
                  value={editFormData.stravaEventUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, stravaEventUrl: e.target.value })}
                  placeholder="https://www.strava.com/clubs/..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weather Conditions</label>
                <input
                  type="text"
                  value={editFormData.weatherConditions}
                  onChange={(e) => setEditFormData({ ...editFormData, weatherConditions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={updateEvent.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {updateEvent.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
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
          {eventUser && (
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
          </>
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
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${deleteDialogOpen ? 'relative z-0' : ''}`}>
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
            {route && (
              <p className="text-sm text-gray-500 mt-1">
              {route.name} • {route.distance}km • +{route.elevationAscent ?? route.elevation}m / -{route.elevationDescent ?? 0}m
            </p>
            )}
          </div>
          <div className={`p-6 ${deleteDialogOpen ? 'relative z-0' : ''}`}>
            <RouteMap
              gpxObjectName={route?.gpxObjectName}
              routeName={route?.name}
              routeDistance={route?.distance}
              routeElevation={route?.elevation}
            />
          </div>
        </div>
      )}

      {/* Delete Event Dialog */}
      {event && (
        <DeleteEventDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={(deleteFutureEvents) => {
            deleteEvent.mutate({
              eventId: id,
              deleteFutureEvents,
            });
          }}
          eventTitle={event.title}
          eventDate={eventDate}
          isPending={deleteEvent.isPending}
        />
      )}
    </div>
  );
}

