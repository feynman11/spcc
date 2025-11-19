"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: currentUser, isLoading: userLoading } = trpc.members.getCurrentUser.useQuery(
    undefined,
    { enabled: status === "authenticated" }
  );

  // Redirect authenticated users to appropriate pages
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

  // Show loading state for authenticated users while checking
  if (status === "loading" || (status === "authenticated" && userLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If authenticated, don't show home page (redirect will happen)
  if (status === "authenticated") {
    return null;
  }

  // Public home page
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <img
              src="/spcc_logo.jpg"
              alt="South Peaks Cycling Club Logo"
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const svg = e.currentTarget.nextElementSibling as HTMLElement;
                if (svg) svg.classList.remove("hidden");
              }}
            />
            <svg
              className="w-16 h-16 text-red-600 hidden"
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
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-8">
          Welcome to South Peaks Cycling Club
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-700 text-center max-w-3xl mx-auto leading-relaxed mb-12">
          Based in the heart of Borrowash, Derbyshire, we're a passionate community of cyclists
          exploring the beautiful Peak District and surrounding countryside. Whether you're a
          beginner looking to build confidence or an experienced rider seeking new challenges, SPCC
          welcomes cyclists of all abilities.
        </p>

        {/* Connect With Us Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">
            Connect With Us
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
            {/* Strava Button */}
            <a
              href="https://www.strava.com/clubs/451869"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold hover:from-orange-600 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 min-w-[240px]"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7.02 13.828h4.169" />
              </svg>
              <span>Join our Strava Club</span>
            </a>

            {/* Instagram Button */}
            <a
              href="https://www.instagram.com/southpeakscc/#"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-pink-600 text-white font-semibold hover:from-orange-600 hover:via-pink-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 min-w-[240px]"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Follow us on Instagram</span>
            </a>
          </div>
        </div>

        {/* Members Area Link */}
        <div className="text-center">
          <Link
            href="/signin"
            className="inline-block px-8 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl text-lg"
          >
            Members Area
          </Link>
        </div>
      </div>
    </main>
  );
}
