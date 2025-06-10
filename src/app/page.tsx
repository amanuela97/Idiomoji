"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Trophy, Clock, Calendar, Users, Play, BarChart3 } from "lucide-react";
import { getDailyPuzzle } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [todaysPuzzle, setTodaysPuzzle] = useState<string>("🎲");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTodaysPuzzle = async () => {
      try {
        const puzzle = await getDailyPuzzle();
        if (puzzle) {
          setTodaysPuzzle(puzzle.emoji);
        }
      } catch (error) {
        console.error("Error fetching daily puzzle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaysPuzzle();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Simple Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4">
          🤔 Idiomoji
        </h1>
        <p className="text-xl text-gray-600">
          Guess the idiom from the emojis!
        </p>
      </div>

      {/* Today's Puzzle Preview */}
      <Card className="mb-12 bg-white/80 backdrop-blur border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="text-sm text-gray-500 mb-2">
            {"Today's Daily Challenge"}
          </div>
          <div className="text-6xl mb-4 font-mono">
            {isLoading ? "..." : todaysPuzzle}
          </div>
          <div className="text-gray-600 mb-4">Can you guess this idiom?</div>
          <Button
            size="lg"
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-8 cursor-pointer"
            onClick={() => router.push("/daily")}
          >
            <Play className="mr-2 h-5 w-5" />
            Play Now
          </Button>
        </CardContent>
      </Card>

      {/* Game Modes - Simple Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <button
          className="group relative text-left p-6 rounded-2xl bg-white/60 hover:bg-white/80 transition-all hover:scale-105 hover:shadow-lg border-0 min-h-[140px]"
          onMouseEnter={() => setHoveredMode("daily")}
          onMouseLeave={() => setHoveredMode(null)}
          onClick={() => router.push("/daily")}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Daily Challenge</h3>
              <p className="text-sm text-gray-600">One puzzle per day</p>
            </div>
          </div>
          <div className="h-[40px]">
            {hoveredMode === "daily" && (
              <div className="text-sm text-gray-600 animate-in slide-in-from-top-1">
                Everyone gets the same puzzle. Share your results!
              </div>
            )}
          </div>
        </button>

        <button
          className="group relative text-left p-6 rounded-2xl bg-white/60 hover:bg-white/80 transition-all hover:scale-105 hover:shadow-lg border-0 min-h-[140px]"
          onMouseEnter={() => setHoveredMode("time")}
          onMouseLeave={() => setHoveredMode(null)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Time Attack</h3>
              <p className="text-sm text-gray-600">2 minutes, max points</p>
            </div>
          </div>
          <div className="h-[40px]">
            {hoveredMode === "time" && (
              <div className="text-sm text-gray-600 animate-in slide-in-from-top-1">
                Solve as many as you can before time runs out!
              </div>
            )}
          </div>
        </button>

        <button
          className="group relative text-left p-6 rounded-2xl bg-white/60 hover:bg-white/80 transition-all hover:scale-105 hover:shadow-lg border-0 min-h-[140px]"
          onMouseEnter={() => setHoveredMode("duel")}
          onMouseLeave={() => setHoveredMode(null)}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Multiplayer Duel</h3>
              <p className="text-sm text-gray-600">Race other players</p>
            </div>
          </div>
          <div className="h-[40px]">
            {hoveredMode === "duel" && (
              <div className="text-sm text-gray-600 animate-in slide-in-from-top-1">
                First to guess correctly wins the round!
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Quick Examples */}
      <Card className="mb-8 bg-white/60 backdrop-blur border-0">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-center">Quick Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-white/50">
              <div className="text-2xl mb-2">❄️🪓</div>
              <div className="text-sm text-gray-600">{"Break the ice"}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/50">
              <div className="text-2xl mb-2">🍰🎂</div>
              <div className="text-sm text-gray-600">{"Piece of cake"}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/50">
              <div className="text-2xl mb-2">🌧️🐱🐶</div>
              <div className="text-sm text-gray-600">
                {"Raining cats and dogs"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Footer Links */}
      <div className="flex justify-center gap-6 text-sm">
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Trophy className="h-4 w-4" />
          Leaderboard
        </Link>
        <Link
          href="/stats"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          My Stats
        </Link>
      </div>
    </div>
  );
}
