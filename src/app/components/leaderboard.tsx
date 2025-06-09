"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Medal } from "@/app/components/medals";
import { LeaderboardPlayer, subscribeToLeaderboard } from "@/app/lib/api";

type SortKey = "score" | "winRate" | "streak";

export function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToLeaderboard((updatedPlayers) => {
      setPlayers(updatedPlayers);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDirection("desc");
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    return (a[sortBy] - b[sortBy]) * modifier;
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (players.length === 0) {
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
      <div className="p-4 bg-muted/50 flex flex-wrap gap-2 items-center justify-between rounded-t-md border border-b-0">
        <h2 className="text-xl font-semibold">Top Players</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === "score" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("score")}
            className="flex items-center gap-1"
          >
            Total Score
            {sortBy === "score" &&
              (sortDirection === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              ))}
          </Button>
          <Button
            variant={sortBy === "winRate" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("winRate")}
            className="flex items-center gap-1"
          >
            Win Rate
            {sortBy === "winRate" &&
              (sortDirection === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              ))}
          </Button>
          <Button
            variant={sortBy === "streak" ? "default" : "outline"}
            size="sm"
            onClick={() => handleSort("streak")}
            className="flex items-center gap-1"
          >
            Streak
            {sortBy === "streak" &&
              (sortDirection === "asc" ? (
                <ArrowUpIcon className="h-4 w-4" />
              ) : (
                <ArrowDownIcon className="h-4 w-4" />
              ))}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className="bg-white rounded-md border p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12">
                <Medal rank={index + 1} />
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarImage
                    src={player.photoURL || "/placeholder.svg"}
                    alt={player.name}
                  />
                  <AvatarFallback>
                    {player.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium text-lg">{player.name}</div>
              </div>
              <div className="ml-auto grid grid-cols-3 gap-8">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Total Score
                  </div>
                  <div className="font-medium">
                    {formatNumber(player.score)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="font-medium">{player.winRate}%</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Current Streak
                  </div>
                  <div className="font-medium">
                    {player.streak > 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        <span className="text-orange-500">🔥</span>{" "}
                        {player.streak}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
