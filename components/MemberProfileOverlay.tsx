"use client";

import { useRouter } from "next/navigation";

interface MemberProfileOverlayProps {
  children: React.ReactNode;
}

export function MemberProfileOverlay({ children }: MemberProfileOverlayProps) {
  const router = useRouter();

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay message */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center border-2 border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Member Profile Required
          </h3>
          <p className="text-gray-600 text-lg mb-2">
            You need to create a member profile to access this content.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Complete your member profile to view routes, events, and participate in club activities.
          </p>
          <button
            onClick={() => router.push("/members")}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Member Profile
          </button>
        </div>
      </div>
    </div>
  );
}

