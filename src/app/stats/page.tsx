"use client";

import { useAuth } from "@/app/lib/auth-context";
import { PlayerStats } from "@/app/components/player-stats";

export default function StatsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading statistics...
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
