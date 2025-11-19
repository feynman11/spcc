"use client";

import { useSession } from "next-auth/react";
import { SignInForm } from "@/components/SignInForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = trpc.members.getCurrentUser.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  useEffect(() => {
    if (status === "authenticated" && !userLoading) {
      if (currentUser) {
        // Redirect based on user role
        if (currentUser.role === "member" || currentUser.role === "admin") {
          router.push("/dashboard");
        } else {
          // Users with "user" role should go to welcome page
          router.push("/welcome");
        }
      } else if (session) {
        // If we have a session but no user data yet, wait a bit
        return;
      }
    }
  }, [status, router, currentUser, userLoading, session]);

  if (status === "loading" || (status === "authenticated" && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img
              src="/spcc_logo.jpg"
              alt="South Peaks Cycle Club Logo"
              className="w-12 h-12"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const svg = e.currentTarget.nextElementSibling as HTMLElement;
                if (svg) svg.classList.remove("hidden");
              }}
            />
            <svg
              className="w-8 h-8 text-red-600 hidden"
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            South Peaks Cycle Club
          </h1>
          <p className="text-gray-600">
            Join our community of passionate cyclists
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}

