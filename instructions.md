create a reusable component for showing the players rank in player-stats.tsx: Here is how you should implement it.

Here’s a tiered system you could implement:
| **Rank** | **Criteria (example)** |
| --------------- | ------------------------------------------------------------------------------- |
| 🐣 New Player | `totalGames === 0` |
| 🧩 Beginner | `totalGames >= 1 && totalScore < 100` |
| 🎯 Intermediate | `totalScore >= 100 && winRate >= 40%` |
| 💡 Pro Solver | `totalScore >= 250 && winRate >= 60% && maxStreak >= 3` |
| 🧠 Idiom Master | `totalScore >= 500 && winRate >= 80% && maxStreak >= 5` |
| 👑 Legendary | `totalScore >= 1000 && winRate >= 90% && maxStreak >= 10 && currentStreak >= 5` |

function getRankTitle(stats) {
const { totalGames, totalWins, totalScore, maxStreak, currentStreak } = stats;
const winRate = totalGames > 0 ? (totalWins / totalGames) \* 100 : 0;

if (totalGames === 0) return "🐣 New Player";
if (totalScore < 100) return "🧩 Beginner";
if (totalScore >= 100 && winRate >= 40) return "🎯 Intermediate";
if (totalScore >= 250 && winRate >= 60 && maxStreak >= 3) return "💡 Pro Solver";
if (totalScore >= 500 && winRate >= 80 && maxStreak >= 5) return "🧠 Idiom Master";
if (totalScore >= 1000 && winRate >= 90 && maxStreak >= 10 && currentStreak >= 5)
return "👑 Legendary";
return "🧩 Beginner";
}
