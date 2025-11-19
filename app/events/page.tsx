"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { PaidMemberOverlay } from "@/components/PaidMemberOverlay";
import { MemberProfileOverlay } from "@/components/MemberProfileOverlay";
import { useEventJoinLeave } from "@/hooks/useEventJoinLeave";

export default function Events() {
  const utils = trpc.useUtils();
  const { data: currentMember, isLoading: memberLoading } = trpc.members.getCurrentMember.useQuery();
  const { data: allEvents, isLoading: eventsLoading } = trpc.events.getAllEvents.useQuery();
  const { data: allRoutes, isLoading: routesLoading } = trpc.routes.getAllRoutes.useQuery();
  
  // Check if member is paid (admins are always allowed)
  const { currentUser, checkIsRegistered } = useEventJoinLeave();
  const isPaid = currentMember?.isPaid ?? false;
  const isAdmin = currentUser?.role === "admin";
  const showPaidOverlay = currentMember !== undefined && currentMember !== null && !isPaid && !isAdmin;
  const showMemberProfileOverlay = !memberLoading && currentMember === null;
  
  const createEvent = trpc.events.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully!");
      utils.events.getAllEvents.invalidate();
      utils.events.getUpcomingEvents.invalidate();
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        date: "",
        startTime: "",
        duration: "",
        routeId: "",
        meetingPoint: "",
        maxParticipants: "",
        difficulty: "moderate",
        eventType: "group_ride",
        stravaEventUrl: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event");
    },
  });
  
  const { joinEvent, leaveEvent } = useEventJoinLeave();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    createEvent.mutate({
      title: formData.title,
      description: formData.description || undefined,
      date: new Date(formData.date).getTime(),
      startTime: formData.startTime,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      routeId: formData.routeId || undefined,
      meetingPoint: formData.meetingPoint,
      maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      difficulty: formData.difficulty,
      eventType: formData.eventType,
      stravaEventUrl: formData.stravaEventUrl || undefined,
    });
  };


  if (eventsLoading || routesLoading || memberLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const eventsArray = Array.isArray(allEvents) ? allEvents : [];
  const upcomingEvents = eventsArray.filter(event => event.date >= Date.now());
  const pastEvents = eventsArray.filter(event => event.date < Date.now());

  const content = (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-2">Discover and join exciting cycling adventures</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Event</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  required
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="group_ride">Group Ride</option>
                  <option value="training">Training</option>
                  <option value="race">Race</option>
                  <option value="social">Social</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route
                </label>
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  required
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Point *
                </label>
                <input
                  type="text"
                  required
                  value={formData.meetingPoint}
                  onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strava Event URL
              </label>
              <input
                type="url"
                value={formData.stravaEventUrl}
                onChange={(e) => setFormData({ ...formData, stravaEventUrl: e.target.value })}
                placeholder="https://www.strava.com/clubs/..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createEvent.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {createEvent.isPending ? "Creating..." : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upcoming Events ({upcomingEvents.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    event.difficulty === "easy" ? "bg-green-100 text-green-800" :
                    event.difficulty === "moderate" ? "bg-yellow-100 text-yellow-800" :
                    event.difficulty === "hard" ? "bg-orange-100 text-orange-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {event.difficulty}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                )}
                
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(event.date).toLocaleDateString()} at {event.startTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.meetingPoint}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{event.participantCount} participants</span>
                    {event.maxParticipants && (
                      <span>/ {event.maxParticipants} max</span>
                    )}
                  </div>
                  {event.route && (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>{event.route.name} ({event.route.distance}km)</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full bg-blue-600 text-white text-center px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Event
                  </Link>
                  {currentUser && (
                    <>
                      {checkIsRegistered(event) ? (
                        <button
                          onClick={() => leaveEvent.mutate({ eventId: event.id })}
                          disabled={leaveEvent.isPending || joinEvent.isPending || new Date(event.date) < new Date()}
                          className="w-full bg-gray-600 text-white px-4 py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {leaveEvent.isPending ? "Leaving..." : "I can't make it"}
                        </button>
                      ) : (
                        <button
                          onClick={() => joinEvent.mutate({ eventId: event.id })}
                          disabled={joinEvent.isPending || leaveEvent.isPending || new Date(event.date) < new Date()}
                          className="w-full bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full bg-orange-600 text-white text-center px-4 py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
                    >
                      View on Strava
                    </a>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  Organized by {event.organizerName}
                </div>
              </div>
            ))}
          </div>
          
          {upcomingEvents.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No upcoming events scheduled</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to create an event!</p>
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Past Events ({pastEvents.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pastEvents.slice(0, 10).map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">{event.organizerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(event.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.participantCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.route ? `${event.route.name} (${event.route.distance}km)` : "No route"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            event.status === "completed" ? "bg-green-100 text-green-800" :
                            event.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/events/${event.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (showMemberProfileOverlay) {
    return <MemberProfileOverlay>{content}</MemberProfileOverlay>;
  }

  if (showPaidOverlay) {
    return <PaidMemberOverlay>{content}</PaidMemberOverlay>;
  }

  return content;
}
