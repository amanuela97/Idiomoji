"use client";

import { Leaderboard } from "@/app/components/leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Idiomoji Leaderboard</h1>
      <Leaderboard />
    </div>
  );
}
