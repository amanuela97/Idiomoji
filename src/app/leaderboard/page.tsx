"use client";

import TimeAttackLeaderboard from "../time-attack/leaderboard";
import { Leaderboard as DailyLeaderboard } from "@/app/components/leaderboard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Leaderboard</h1>

      <Tabs defaultValue="daily" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="daily">Daily Challenge</TabsTrigger>
          <TabsTrigger value="timeAttack">Time Attack</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyLeaderboard />
        </TabsContent>

        <TabsContent value="timeAttack">
          <TimeAttackLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
