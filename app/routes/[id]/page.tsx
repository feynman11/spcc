"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { RouteMap } from "@/components/RouteMap";
import { ElevationProfile } from "@/components/ElevationProfile";
import Link from "next/link";
import { toast } from "sonner";

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [hoveredCoordinate, setHoveredCoordinate] = useState<[number, number] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    distance: "",
    elevation: "",
    elevationAscent: "",
    elevationDescent: "",
    difficulty: "moderate" as "easy" | "moderate" | "hard" | "expert",
    startLocation: "",
    endLocation: "",
    routeType: "road" as "road" | "mountain" | "gravel" | "mixed",
    tags: [] as string[],
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  const utils = trpc.useUtils();
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();
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

  const deleteRoute = trpc.routes.deleteRoute.useMutation({
    onSuccess: () => {
      toast.success("Route deleted successfully");
      router.push("/routes");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete route");
    },
  });

  const updateRoute = trpc.routes.updateRoute.useMutation({
    onSuccess: () => {
      toast.success("Route updated successfully");
      utils.routes.getRoute.invalidate({ routeId: id });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update route");
    },
  });

  const canEdit = route && currentUser && (route.uploadedBy === currentUser.id || currentUser.role === "admin");
  const canDelete = route && currentUser && (route.uploadedBy === currentUser.id || currentUser.role === "admin");

  // Initialize edit form when route loads or editing starts
  useEffect(() => {
    if (route && isEditing) {
      setEditFormData({
        name: route.name,
        description: route.description || "",
        distance: route.distance.toString(),
        elevation: route.elevation.toString(),
        elevationAscent: (route.elevationAscent ?? route.elevation).toString(),
        elevationDescent: (route.elevationDescent ?? 0).toString(),
        difficulty: route.difficulty,
        startLocation: route.startLocation,
        endLocation: route.endLocation || "",
        routeType: route.routeType,
        tags: route.tags || [],
      });
    }
  }, [route, isEditing]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoute.mutate({
      routeId: id,
      name: editFormData.name,
      description: editFormData.description || undefined,
      distance: parseFloat(editFormData.distance),
      elevation: parseFloat(editFormData.elevation),
      elevationAscent: parseFloat(editFormData.elevationAscent),
      elevationDescent: parseFloat(editFormData.elevationDescent),
      difficulty: editFormData.difficulty,
      startLocation: editFormData.startLocation,
      endLocation: editFormData.endLocation || undefined,
      routeType: editFormData.routeType,
      tags: editFormData.tags,
    });
  };

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
              {isEditing ? "Cancel Edit" : "Edit Route"}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this route? This action cannot be undone.")) {
                  deleteRoute.mutate({ routeId: id });
                }
              }}
              disabled={deleteRoute.isPending}
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
              {deleteRoute.isPending ? "Deleting..." : "Delete Route"}
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

      {/* Route Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit Route</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editFormData.distance}
                  onChange={(e) => setEditFormData({ ...editFormData, distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Type *</label>
                <select
                  required
                  value={editFormData.routeType}
                  onChange={(e) => setEditFormData({ ...editFormData, routeType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="road">Road</option>
                  <option value="mountain">Mountain</option>
                  <option value="gravel">Gravel</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Elevation (m) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editFormData.elevation}
                  onChange={(e) => setEditFormData({ ...editFormData, elevation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Elevation Ascent (m) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editFormData.elevationAscent}
                  onChange={(e) => setEditFormData({ ...editFormData, elevationAscent: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Elevation Descent (m) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editFormData.elevationDescent}
                  onChange={(e) => setEditFormData({ ...editFormData, elevationDescent: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Location *</label>
                <input
                  type="text"
                  required
                  value={editFormData.startLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, startLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Location</label>
                <input
                  type="text"
                  value={editFormData.endLocation}
                  onChange={(e) => setEditFormData({ ...editFormData, endLocation: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={editFormData.tags.join(", ")}
                onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value.split(",").map(t => t.trim()).filter(t => t) })}
                placeholder="e.g., scenic, challenging, popular"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={updateRoute.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {updateRoute.isPending ? "Saving..." : "Save Changes"}
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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{route.distance}km</div>
            <div className="text-sm text-gray-500">Distance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">+{route.elevationAscent ?? route.elevation}m</div>
            <div className="text-sm text-gray-500">Ascent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">-{route.elevationDescent ?? 0}m</div>
            <div className="text-sm text-gray-500">Descent</div>
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
          </>
        )}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
        </div>
        <div className="p-6">
          <RouteMap
            gpxObjectName={route?.gpxObjectName}
            routeName={route?.name}
            routeDistance={route?.distance}
            routeElevation={route?.elevation}
            hoveredCoordinate={hoveredCoordinate}
          />
        </div>
      </div>

      {/* Elevation Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Elevation Profile</h3>
        </div>
        <div className="p-6">
          <ElevationProfile
            gpxObjectName={route?.gpxObjectName}
            onHover={(coordinate) => setHoveredCoordinate(coordinate)}
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

