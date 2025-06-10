"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase-client";
import { TimeAttackSession } from "@/app/lib/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Medal } from "@/app/components/medals";

const GAME_DURATION = 120; // 2 minutes in seconds

// Helper function to calculate time left
function calculateTimeLeft(startTime: Date, endTime: Date): number {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationSeconds = Math.floor(durationMs / 1000);
  return Math.max(0, GAME_DURATION - durationSeconds);
}

export default function TimeAttackLeaderboard() {
  const [topScores, setTopScores] = useState<TimeAttackSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create the query for top 10 scores
    const q = query(
      collection(db, "timeAttackSessions"),
      orderBy("score", "desc"),
      limit(10)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const scores = snapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id } as TimeAttackSession)
        );
        setTopScores(scores);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    );

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (topScores.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          No players have joined the leaderboard yet.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 bg-muted/50 flex items-center justify-between rounded-t-md border border-b-0">
        <h2 className="text-xl font-semibold">Time Attack Champions</h2>
        <div className="text-sm text-muted-foreground">Live Updates</div>
      </div>
      <div className="space-y-2">
        {topScores.map((session, index) => {
          const timeLeft = calculateTimeLeft(
            session.startTime.toDate(),
            session.endTime.toDate()
          );
          const correctPuzzles = session.puzzleAttempts.filter(
            (a) => a.correct
          ).length;

          return (
            <div
              key={session.id}
              className="bg-white rounded-md border p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center justify-center w-12">
                    <Medal rank={index + 1} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarImage
                        src={session.playerPhotoURL || "/placeholder.svg"}
                        alt={session.playerName}
                      />
                      <AvatarFallback>
                        {session.playerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-lg">
                      {session.playerName}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto sm:ml-auto">
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-muted-foreground">
                      Time Left
                    </div>
                    <div className="font-medium">{timeLeft}s</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-muted-foreground">Puzzles</div>
                    <div className="font-medium">{correctPuzzles}</div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-muted-foreground">Score</div>
                    <div className="font-medium">
                      {session.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
