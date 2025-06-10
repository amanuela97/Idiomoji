"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import {
  Calendar,
  Trophy,
  Target,
  Flame,
  Award,
  Star,
  Clock,
  HelpCircle,
  Loader2,
  Badge,
} from "lucide-react";
import { StatsChart } from "@/app/components/stats-chart";
import { db } from "@/app/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { PlayerStats as PlayerStatsType } from "@/app/lib/types";
import { PlayerRank } from "@/app/components/player-rank";

interface PlayerStatsProps {
  userId: string;
}

export function PlayerStats({ userId }: PlayerStatsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [playerData, setPlayerData] = useState<PlayerStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        setLoading(true);
        setError(null);

        const playerRef = doc(db, "players", userId);
        const playerSnap = await getDoc(playerRef);

        if (!playerSnap.exists()) {
          setError("Player data not found");
          return;
        }

        const data = playerSnap.data();
        // Handle both old (nested) and new (flat) data structure
        const playerData = data.stats || data;
        // Ensure required fields have default values
        setPlayerData({
          ...playerData,
          history: playerData.history || [],
          totalGames: playerData.totalGames || 0,
          totalWins: playerData.totalWins || 0,
          totalScore: playerData.totalScore || 0,
          currentStreak: playerData.currentStreak || 0,
          maxStreak: playerData.maxStreak || 0,
          lastPlayed:
            playerData.lastPlayed || new Date().toISOString().split("T")[0],
        });
      } catch (err) {
        console.error("Error fetching player data:", err);
        setError("Failed to load player data");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || "Failed to load player data"}</p>
      </div>
    );
  }

  const { name, photoURL, history } = playerData;

  // Calculate win rate
  const winRate =
    playerData.totalGames > 0
      ? Math.round((playerData.totalWins / playerData.totalGames) * 100)
      : 0;

  // Calculate average score
  const avgScore =
    playerData.totalGames > 0
      ? Math.round(playerData.totalScore / playerData.totalGames)
      : 0;

  // Calculate average attempts
  const avgAttempts =
    history.length > 0
      ? (
          history.reduce((sum, game) => sum + game.attempts, 0) / history.length
        ).toFixed(1)
      : "0.0";

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Get the start date (either from first game or current date for new players)
  const startDate =
    history.length > 0
      ? history[history.length - 1].date
      : new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Player Profile Card */}
      <Card className="border-0 shadow-md bg-white/80 backdrop-blur overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-purple-400 to-pink-400"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              <AvatarImage
                src={photoURL || "/placeholder.svg"}
                alt={name || "User"}
              />
              <AvatarFallback>
                {name
                  ? name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mt-2 sm:mt-0 sm:pb-2">
              <h2 className="text-2xl font-bold">{name}</h2>
              <p className="text-gray-500 text-sm">
                {history.length > 0
                  ? `Playing since ${formatDate(startDate)}`
                  : "New Player"}
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-2 mt-2 sm:mt-0 sm:pb-2">
              <PlayerRank stats={playerData} />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Game History</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="ranking">Ranking System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <Flame className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-3xl font-bold">
                  {playerData.currentStreak}
                </div>
                <p className="text-sm text-gray-500">Current Streak</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-3xl font-bold">{winRate}%</div>
                <p className="text-sm text-gray-500">Win Rate</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold">{avgScore}</div>
                <p className="text-sm text-gray-500">Avg Score</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Award className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold">
                  {playerData.totalGames}
                </div>
                <p className="text-sm text-gray-500">Games Played</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsChart history={history} />
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Game Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-purple-500" />
                      <span>Total Wins</span>
                    </div>
                    <span className="font-semibold">
                      {playerData.totalWins}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Max Streak</span>
                    </div>
                    <span className="font-semibold">
                      {playerData.maxStreak}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Total Score</span>
                    </div>
                    <span className="font-semibold">
                      {playerData.totalScore}
                    </span>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Avg Attempts</span>
                    </div>
                    <span className="font-semibold">{avgAttempts}</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-gray-500" />
                      <span>Hint Usage</span>
                    </div>
                    <span className="font-semibold">
                      {history.length > 0
                        ? Math.round(
                            (history.filter(
                              (game) => game.usedHint || game.usedPatternHint
                            ).length /
                              history.length) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.slice(0, 5).map((game, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          game.won
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {game.won ? "✓" : "✗"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {game.won ? "Victory!" : "Missed it"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(game.date)} • Score: {game.score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Game History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((game, i) => (
                  <div
                    key={i}
                    className="flex items-center p-3 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        game.won
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {game.won ? "✓" : "✗"}
                    </div>
                    <div className="ml-4 flex-grow">
                      <div className="font-medium">{formatDate(game.date)}</div>
                      <div className="text-sm text-gray-500">
                        {game.attempts} attempt{game.attempts !== 1 ? "s" : ""}
                        {(game.usedHint || game.usedPatternHint) &&
                          " • Used hint"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{game.score}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/50 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">First Game</div>
                    <div className="text-sm text-gray-500">
                      Completed your first game
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/50 flex items-center gap-4 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">On Fire</div>
                    <div className="text-sm text-gray-500">
                      Reach a 5-day streak
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/50 flex items-center gap-4 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Perfect Score</div>
                    <div className="text-sm text-gray-500">
                      Get 100% on 5 games in a row
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/50 flex items-center gap-4 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Sharpshooter</div>
                    <div className="text-sm text-gray-500">
                      Solve 10 puzzles on first attempt
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking System Tab */}
        <TabsContent value="ranking">
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Ranking System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-600">
                  Your rank is determined by your total score, win rate, and
                  streak performance. Progress through the ranks by improving
                  your game stats!
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-4 px-4 text-left font-semibold">
                          Rank
                        </th>
                        <th className="py-4 px-4 text-left font-semibold">
                          Requirements
                        </th>
                        <th className="py-4 px-4 text-left font-semibold">
                          Your Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-500">🐣 New Player</Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          No games played yet
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalGames === 0
                            ? "Current Rank"
                            : "✓ Completed"}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">🧩 Beginner</Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          Play at least one game
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalGames >= 1 &&
                          playerData.totalScore < 100
                            ? "Current Rank"
                            : playerData.totalGames >= 1
                            ? "✓ Completed"
                            : `${playerData.totalGames}/1 games`}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-500">
                              🎯 Intermediate
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          Score 100+ points with 40% or higher win rate
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalScore >= 100 && winRate >= 40
                            ? "Current Rank"
                            : `${playerData.totalScore}/100 points, ${winRate}/40% wins`}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-500">
                              💡 Pro Solver
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          Score 250+ points with 60% win rate and 3+ streak
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalScore >= 250 &&
                          winRate >= 60 &&
                          playerData.maxStreak >= 3
                            ? "Current Rank"
                            : `${playerData.totalScore}/250 points, ${winRate}/60% wins, ${playerData.maxStreak}/3 streak`}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">
                              🧠 Idiom Master
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          Score 500+ points with 80% win rate and 5+ streak
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalScore >= 500 &&
                          winRate >= 80 &&
                          playerData.maxStreak >= 5
                            ? "Current Rank"
                            : `${playerData.totalScore}/500 points, ${winRate}/80% wins, ${playerData.maxStreak}/5 streak`}
                        </td>
                      </tr>
                      <tr className="hover:bg-white/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500">👑 Legendary</Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          Score 1000+ points with 90% win rate, 10+ max streak
                          and 5+ current streak
                        </td>
                        <td className="py-4 px-4">
                          {playerData.totalScore >= 1000 &&
                          winRate >= 90 &&
                          playerData.maxStreak >= 10 &&
                          playerData.currentStreak >= 5
                            ? "Current Rank"
                            : `${playerData.totalScore}/1000 points, ${winRate}/90% wins, ${playerData.maxStreak}/10 streak, ${playerData.currentStreak}/5 current`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Tips to Rank Up:</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    <li>Solve puzzles consistently to maintain your streak</li>
                    <li>
                      Try to solve puzzles in fewer attempts for higher scores
                    </li>
                    <li>
                      Use hints strategically - they reduce your score but can
                      help maintain streaks
                    </li>
                    <li>Practice daily to improve your win rate</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
