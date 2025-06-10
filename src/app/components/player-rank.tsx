import { PlayerStats } from "@/app/lib/types";
import { Badge } from "@/app/components/ui/badge";
import { Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface PlayerRankProps {
  stats: PlayerStats;
  showIcon?: boolean;
  className?: string;
}

function getRankTitle(stats: PlayerStats): string {
  const { totalGames, totalWins, totalScore, maxStreak, currentStreak } = stats;
  const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  if (totalGames === 0) return "🐣 New Player";
  if (totalScore < 100) return "🧩 Beginner";
  if (totalScore >= 100 && winRate >= 40) return "🎯 Intermediate";
  if (totalScore >= 250 && winRate >= 60 && maxStreak >= 3)
    return "💡 Pro Solver";
  if (totalScore >= 500 && winRate >= 80 && maxStreak >= 5)
    return "🧠 Idiom Master";
  if (
    totalScore >= 1000 &&
    winRate >= 90 &&
    maxStreak >= 10 &&
    currentStreak >= 5
  )
    return "👑 Legendary";
  return "🧩 Beginner";
}

function getRankColor(rank: string): string {
  switch (rank) {
    case "🐣 New Player":
      return "bg-gray-500 hover:bg-gray-600";
    case "🧩 Beginner":
      return "bg-green-500 hover:bg-green-600";
    case "🎯 Intermediate":
      return "bg-blue-500 hover:bg-blue-600";
    case "💡 Pro Solver":
      return "bg-purple-500 hover:bg-purple-600";
    case "🧠 Idiom Master":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "👑 Legendary":
      return "bg-red-500 hover:bg-red-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
}

function getRankCriteria(rank: string): string {
  switch (rank) {
    case "🐣 New Player":
      return "Play your first game to rank up!";
    case "🧩 Beginner":
      return "Score 100+ points with 40% win rate to rank up";
    case "🎯 Intermediate":
      return "Score 250+ points with 60% win rate and 3+ streak to rank up";
    case "💡 Pro Solver":
      return "Score 500+ points with 80% win rate and 5+ streak to rank up";
    case "🧠 Idiom Master":
      return "Score 1000+ points with 90% win rate, 10+ max streak and 5+ current streak to rank up";
    case "👑 Legendary":
      return "You've reached the highest rank!";
    default:
      return "Keep playing to rank up!";
  }
}

export function PlayerRank({
  stats,
  showIcon = true,
  className = "",
}: PlayerRankProps) {
  const rank = getRankTitle(stats);
  const rankColor = getRankColor(rank);
  const criteria = getRankCriteria(rank);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge className={`${rankColor} ${className}`}>
            {showIcon && <Trophy className="w-3 h-3 mr-1" />}
            {rank}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{criteria}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
