"use client";

import { useAuth } from "@/app/lib/auth-context";
import { PlayerStats } from "@/app/components/player-stats";
import Link from "next/link";

export default function StatsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading statistics...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-2xl font-bold">
          You need to be logged in to see this page
        </div>
        <Link
          href="/login?redirectTo=/stats"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Your Statistics</h1>
        <PlayerStats userId={user.uid} />
      </div>
    </main>
  );
}
