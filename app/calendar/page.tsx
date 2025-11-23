"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import Link from "next/link";
import { usePageViewTracking } from "@/lib/analytics";

export default function Calendar() {
  usePageViewTracking();
  const { data: allEvents, isLoading: eventsLoading } = trpc.events.getAllEvents.useQuery();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  if (eventsLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Get events for current month
  const eventsArray = Array.isArray(allEvents) ? allEvents : [];
  const monthEvents = eventsArray.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });
  
  // Group events by day
  const eventsByDay: { [key: number]: typeof eventsArray } = {};
  monthEvents.forEach(event => {
    const day = new Date(event.date).getDate();
    if (!eventsByDay[day]) {
      eventsByDay[day] = [];
    }
    eventsByDay[day].push(event);
  });
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setCurrentDate(newDate);
  };
  
  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar</h2>
        <p className="text-gray-600">View club events and rides by month</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-24 p-2 border border-gray-100 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday(day || 0) ? 'bg-red-50 border-red-200' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(day) ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    
                    {eventsByDay[day] && (
                      <div className="space-y-1">
                        {eventsByDay[day].slice(0, 3).map((event, eventIndex) => (
                          <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className={`block text-xs p-1 rounded truncate hover:opacity-80 transition-opacity ${
                              event.difficulty === "easy" ? "bg-green-100 text-green-800" :
                              event.difficulty === "moderate" ? "bg-yellow-100 text-yellow-800" :
                              event.difficulty === "hard" ? "bg-orange-100 text-orange-800" :
                              "bg-red-100 text-red-800"
                            }`}
                            title={`${event.title} at ${event.startTime}`}
                          >
                            {event.startTime} {event.title}
                          </Link>
                        ))}
                        {eventsByDay[day].length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{eventsByDay[day].length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events List for Current Month */}
      {monthEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Events in {monthNames[currentMonth]} {currentYear} ({monthEvents.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {monthEvents
                .sort((a, b) => a.date - b.date)
                .map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.difficulty === "easy" ? "bg-green-100 text-green-800" :
                          event.difficulty === "moderate" ? "bg-yellow-100 text-yellow-800" :
                          event.difficulty === "hard" ? "bg-orange-100 text-orange-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {event.difficulty}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          event.eventType === "group_ride" ? "bg-blue-100 text-blue-800" :
                          event.eventType === "training" ? "bg-purple-100 text-purple-800" :
                          event.eventType === "race" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {event.eventType.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(event.date).toLocaleDateString()} at {event.startTime}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{event.meetingPoint}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{event.participantCount} participants</span>
                        </div>
                      </div>
                      
                      {event.route && (
                        <div className="mt-2 text-sm text-blue-600">
                          Route: {event.route.name} ({event.route.distance}km)
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Organized by {event.organizerName}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {monthEvents.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No events scheduled for {monthNames[currentMonth]} {currentYear}</p>
        </div>
      )}
    </div>
  );
}
