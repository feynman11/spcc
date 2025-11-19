"use client";

import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function WelcomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: currentUser, isLoading: userLoading } = trpc.members.getCurrentUser.useQuery();

  // Redirect if user is already approved
  useEffect(() => {
    if (!userLoading && currentUser) {
      if (currentUser.role === "member" || currentUser.role === "admin") {
        router.push("/dashboard");
      }
    }
  }, [currentUser, userLoading, router]);

  if (status === "loading" || userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Logo */}
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <img
              src="/spcc_logo.jpg"
              alt="South Peaks Cycle Club Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const svg = e.currentTarget.nextElementSibling as HTMLElement;
                if (svg) svg.classList.remove("hidden");
              }}
            />
            <svg
              className="w-12 h-12 text-red-600 hidden"
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

          {/* Club Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            South Peaks Cycle Club
          </h1>

          {/* Welcome Message */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Thank you for signing up!
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your account has been created successfully. We'll review your application and approve your account soon.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              You'll receive a notification once your account has been approved and you can access all club features.
            </p>
          </div>

          {/* Sign Out Option */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                // Sign out and redirect to home
                window.location.href = "/api/auth/signout";
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

