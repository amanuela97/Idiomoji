"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { getDailyPuzzle, savePlayerStats, getPlayerStats } from "@/app/lib/api";
import { IdiomPuzzle, DailyStats, PlayerStats } from "@/app/lib/types";
import { toast } from "sonner";
import {
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  XIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";
import { FirebaseError } from "firebase/app";
import { FirestoreError } from "firebase/firestore";

const MAX_ATTEMPTS = 5;
const HINT_PENALTY = 20;
const PATTERN_HINT_PENALTY = 10;
const LETTER_REVEAL_DELAY = 50; // ms between each letter reveal

const SCORE_MAP = {
  1: 100,
  2: 75,
  3: 50,
  4: 25,
  5: 10,
};

export default function DailyGame() {
  const { user, loading: authLoading } = useAuth();
  const [puzzle, setPuzzle] = useState<IdiomPuzzle | null>(null);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showPatternHint, setShowPatternHint] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  const checkPreviousGame = useCallback(async () => {
    if (authLoading) return; // Don't proceed if auth is still loading

    const today = new Date().toISOString().split("T")[0];

    try {
      if (user) {
        // If user is logged in, try to load their game state from Firebase first
        const stats = await getPlayerStats(user.uid);
        setPlayerStats(stats);
        if (stats && stats.lastPlayed === today) {
          const todayStats = stats.history.find((stat) => stat.date === today);
          if (todayStats) {
            // User has played today, reconstruct their game state
            setAttempts(todayStats.attemptValues || []); // Use actual attempts from stats
            setShowHint(todayStats.usedHint);
            setShowPatternHint(todayStats.usedPatternHint);
            setGameOver(true);
            setWon(todayStats.won);
            setScore(todayStats.score);
            return; // Return early to prevent loading from localStorage
          }
        }
      }

      // Only check localStorage if we haven't loaded state from Firebase
      const lastGame = localStorage.getItem("lastPlayed");
      if (lastGame === today) {
        // Player already played today, load their previous game state
        const savedState = JSON.parse(
          localStorage.getItem("currentGame") || "{}"
        );
        if (savedState.attempts) {
          setAttempts(savedState.attempts);
          setShowHint(savedState.showHint || false);
          setShowPatternHint(savedState.showPatternHint || false);
          setGameOver(savedState.gameOver || false);
          setWon(savedState.won || false);
          setScore(savedState.score || 0);
        }
      }
    } catch (err) {
      if (err instanceof FirestoreError && err.code === "permission-denied") {
        // Clear local storage if Firebase denies permission
        localStorage.removeItem("currentGame");
        localStorage.removeItem("lastPlayed");
        localStorage.removeItem("playerStats");
        // Reset game state
        setAttempts([]);
        setShowHint(false);
        setShowPatternHint(false);
        setGameOver(false);
        setWon(false);
        setScore(0);
      } else {
        console.error("Error checking previous game:", err);
        setError("Failed to load game state");
      }
    }
  }, [user, authLoading]);

  const loadDailyPuzzle = useCallback(async () => {
    if (authLoading) return; // Don't proceed if auth is still loading

    try {
      const dailyPuzzle = await getDailyPuzzle();
      if (!dailyPuzzle) {
        setError("No puzzle available for today");
        return;
      }
      setPuzzle(dailyPuzzle);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        setError("Please log in to play");
      } else {
        setError("Failed to load puzzle");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading]);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    // Initialize game state
    if (!isInitialized) {
      loadDailyPuzzle();
      checkPreviousGame();
      setIsInitialized(true);
    }
  }, [authLoading, isInitialized, loadDailyPuzzle, checkPreviousGame]);

  // Clear game state when user changes
  useEffect(() => {
    if (!user) {
      // Clear localStorage when logging out
      localStorage.removeItem("currentGame");
      localStorage.removeItem("lastPlayed");
      localStorage.removeItem("playerStats");
    }
  }, [user]);

  const saveGameState = (gameState: {
    attempts: string[];
    showHint: boolean;
    showPatternHint: boolean;
    gameOver: boolean;
    won: boolean;
    score: number;
  }) => {
    localStorage.setItem("currentGame", JSON.stringify(gameState));
    localStorage.setItem("lastPlayed", new Date().toISOString().split("T")[0]);
  };

  const handleGuess = () => {
    if (!puzzle || gameOver || !guess.trim()) return;

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedAnswer = puzzle.answer.toLowerCase().trim();
    const isCorrect = normalizedGuess === normalizedAnswer;

    const newAttempts = [...attempts, guess];
    setAttempts(newAttempts);
    setGuess("");

    if (isCorrect) {
      const attemptNumber = newAttempts.length;
      const baseScore = SCORE_MAP[attemptNumber as keyof typeof SCORE_MAP] || 0;
      const finalScore =
        baseScore -
        (showHint ? HINT_PENALTY : 0) -
        (showPatternHint ? PATTERN_HINT_PENALTY : 0);

      setScore(finalScore);
      setWon(true);
      setGameOver(true);
      updateStats(true, attemptNumber, showHint, showPatternHint, finalScore);
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      updateStats(false, MAX_ATTEMPTS, false, false, 0);
    }

    saveGameState({
      attempts: newAttempts,
      showHint,
      showPatternHint,
      gameOver: newAttempts.length >= MAX_ATTEMPTS || isCorrect,
      won: isCorrect,
      score: isCorrect ? score : 0,
    });
  };

  const generateLetterPattern = (answer: string) => {
    return answer
      .split("")
      .map((char) => (char === " " ? " " : /[a-zA-Z]/.test(char) ? "_" : char))
      .join("");
  };

  const updateStats = async (
    didWin: boolean,
    attemptCount: number,
    usedHint: boolean,
    usedPatternHint: boolean,
    finalScore: number
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const dailyStats: DailyStats = {
      date: today,
      attempts: attemptCount,
      usedHint,
      usedPatternHint,
      won: didWin,
      score: finalScore,
      attemptValues: attempts, // Store the actual attempt values
    };

    // Update local storage stats
    const storedStats = localStorage.getItem("playerStats");
    let stats: PlayerStats;

    if (storedStats) {
      stats = JSON.parse(storedStats);
      // Check if we already have an entry for today
      const todayEntry = stats.history.find((entry) => entry.date === today);
      if (!todayEntry) {
        stats.totalGames += 1;
        if (didWin) {
          stats.totalWins += 1;
          stats.currentStreak += 1;
          stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        } else {
          stats.currentStreak = 0;
        }
        stats.totalScore += finalScore;
        stats.lastPlayed = today;
        stats.history.push(dailyStats);
      }

      // Update user info in case it changed
      if (user) {
        stats.name = user.displayName || "Anonymous";
        stats.email = user.email || "";
        stats.photoURL = user.photoURL || "";
      }
    } else {
      if (!user) {
        // For non-logged in users
        stats = {
          name: "Anonymous",
          email: "",
          photoURL: "",
          totalGames: 1,
          totalWins: didWin ? 1 : 0,
          totalScore: finalScore,
          currentStreak: didWin ? 1 : 0,
          maxStreak: didWin ? 1 : 0,
          lastPlayed: today,
          history: [dailyStats],
        };
      } else {
        // For logged in users
        stats = {
          name: user.displayName || "Anonymous",
          email: user.email || "",
          photoURL: user.photoURL || "",
          totalGames: 1,
          totalWins: didWin ? 1 : 0,
          totalScore: finalScore,
          currentStreak: didWin ? 1 : 0,
          maxStreak: didWin ? 1 : 0,
          lastPlayed: today,
          history: [dailyStats],
        };
      }
    }

    localStorage.setItem("playerStats", JSON.stringify(stats));

    // If user is logged in, sync with Firebase
    if (user) {
      try {
        await savePlayerStats(user.uid, stats);
      } catch (err) {
        console.error("Failed to sync stats with server:", err);
      }
    }
  };

  const generateShareText = () => {
    if (!puzzle) return "";

    const today = new Date().toISOString().split("T")[0];
    const emojiGrid = attempts.map(() => (won ? "🟩" : "⬛")).join("");

    return `Idiomoji - ${today}\n${emojiGrid}\n${
      won
        ? `Solved in ${attempts.length + 1} ${
            attempts.length + 1 === 1 ? "try" : "tries"
          } (${score} points)!`
        : "Try again tomorrow!"
    }`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    if (!shareText) return;

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Results copied to clipboard!", {
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy results:", err);
      toast.error("Failed to copy results", {
        duration: 2000,
      });
    }
  };

  const calculateWinRate = () => {
    if (!playerStats?.totalGames) return 0;
    return Math.round((playerStats.totalWins / playerStats.totalGames) * 100);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading puzzle...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  if (!puzzle)
    return (
      <div className="flex justify-center items-center min-h-screen">
        No puzzle available
      </div>
    );

  const remainingAttempts = MAX_ATTEMPTS - attempts.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Game Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Daily Idiomoji</h1>
        <div className="text-lg mb-4">
          Attempts left: {Array(remainingAttempts).fill("🟩").join("")}
          {Array(attempts.length).fill("⬜").join("")} ({remainingAttempts}/
          {MAX_ATTEMPTS})
        </div>
      </div>

      {/* Emoji Display */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">{puzzle.emoji}</div>
      </div>

      {/* Hint Section */}
      <div className="space-y-4 mb-8">
        {!showHint && !gameOver && (
          <button
            onClick={() => setShowHint(true)}
            className="w-full py-2 px-4 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors cursor-pointer"
          >
            💡 Need a hint? (-20 points)
          </button>
        )}
        {showHint && !gameOver && (
          <div className="p-4 bg-yellow-100 rounded">
            <p className="text-center">Hint: {puzzle.hint}</p>
          </div>
        )}

        {!showPatternHint && !gameOver && (
          <button
            onClick={() => setShowPatternHint(true)}
            className="w-full py-2 px-4 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors cursor-pointer"
          >
            🔍 Show letter pattern (-10 points)
          </button>
        )}
        {showPatternHint && !gameOver && (
          <div className="p-4 bg-orange-100 rounded font-mono text-center text-xl tracking-wider">
            {generateLetterPattern(puzzle.answer)}
          </div>
        )}
      </div>

      {/* Game Input */}
      {!gameOver && (
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGuess()}
              placeholder="Type your guess..."
              className="flex-1 p-2 border rounded"
              disabled={gameOver}
            />
            <button
              onClick={handleGuess}
              className="py-2 px-6 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={gameOver}
            >
              Guess
            </button>
          </div>
        </div>
      )}

      {/* Previous Attempts */}
      {attempts?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Previous Attempts:</h2>
          <div className="space-y-2">
            {attempts.map((attempt, index) => (
              <div
                key={index}
                className="p-2 bg-gray-100 rounded flex justify-between items-center"
              >
                <span>{attempt}</span>
                <span className="text-sm text-gray-500">#{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Over State */}
      {gameOver && (
        <div className="text-center space-y-6">
          {won ? (
            <>
              <div className="text-green-500 text-2xl">
                🎉 Congratulations! You got it in {attempts.length + 1}{" "}
                attempts! (+{score} points)
              </div>
              <div className="mt-4">
                <RevealAnswer answer={puzzle.answer} />
              </div>
            </>
          ) : (
            <>
              <div className="text-red-500 text-2xl">😢 Game Over!</div>
              <div className="text-gray-700">The answer was:</div>
              <RevealAnswer answer={puzzle.answer} />
            </>
          )}

          {/* Game Stats */}
          <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Today&apos;s Game</h3>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span>💡 Hint Used:</span>
                <span
                  className={showHint ? "text-yellow-600" : "text-green-600"}
                >
                  {showHint ? "Yes (-20 pts)" : "No"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>🔍 Pattern Hint:</span>
                <span
                  className={
                    showPatternHint ? "text-orange-600" : "text-green-600"
                  }
                >
                  {showPatternHint ? "Yes (-10 pts)" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          {user && (
            <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                📈 Player Statistics
              </h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span>Total Games:</span>
                  <span className="font-medium">
                    {playerStats?.totalGames || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Wins:</span>
                  <span className="font-medium">
                    {playerStats?.totalWins || 0} ({calculateWinRate()}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Streak:</span>
                  <span className="font-medium">
                    {playerStats?.currentStreak || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Max Streak:</span>
                  <span className="font-medium">
                    {playerStats?.maxStreak || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Score:</span>
                  <span className="font-medium">
                    {playerStats?.totalScore || 0} pts
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="text-gray-700">Share your result:</div>
            <div className="flex justify-center gap-4">
              <TwitterShareButton
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={generateShareText()}
                className="hover:opacity-80 transition-opacity"
              >
                <XIcon size={40} round />
              </TwitterShareButton>

              <WhatsappShareButton
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={generateShareText()}
                className="hover:opacity-80 transition-opacity"
              >
                <WhatsappIcon size={40} round />
              </WhatsappShareButton>

              <TelegramShareButton
                url={typeof window !== "undefined" ? window.location.href : ""}
                title={generateShareText()}
                className="hover:opacity-80 transition-opacity"
              >
                <TelegramIcon size={40} round />
              </TelegramShareButton>

              <button
                onClick={handleShare}
                className="flex items-center justify-center w-10 h-10 cursor-pointer bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                title="Copy to clipboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
              </button>
            </div>
          </div>

          {!user && (
            <div className="mt-4 p-4 bg-blue-100 rounded">
              <p>Want to save your stats and track your progress?</p>
              <a href="/login" className="text-blue-500 hover:underline">
                Log in now!
              </a>
            </div>
          )}
        </div>
      )}

      {/* Next Puzzle Countdown */}
      {gameOver && (
        <div className="mt-8 text-center">
          <NextPuzzleCountdown />
        </div>
      )}
    </div>
  );
}

function NextPuzzleCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      // Get tomorrow's date in UTC
      const tomorrow = new Date(now.toISOString().split("T")[0]);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  return <div>Next puzzle in: {timeLeft}</div>;
}

function RevealAnswer({ answer }: { answer: string }) {
  const [revealedLetters, setRevealedLetters] = useState<boolean[]>([]);

  useEffect(() => {
    const letterCount = answer.length;

    // Start with all letters hidden
    setRevealedLetters(new Array(letterCount).fill(false));

    // Reveal letters one by one
    for (let i = 0; i < letterCount; i++) {
      setTimeout(() => {
        setRevealedLetters((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * LETTER_REVEAL_DELAY);
    }
  }, [answer]);

  return (
    <div className="font-mono text-xl tracking-wider">
      {answer.split("").map((char, index) => (
        <span
          key={index}
          className="relative inline-block w-[1ch] text-center"
          style={{ marginRight: char === " " ? "0.5ch" : "0" }}
        >
          {/* Base layer with dash */}
          <span className="text-gray-400">
            {char === " " ? "\u00A0" : /[a-zA-Z]/.test(char) ? "_" : char}
          </span>

          {/* Overlay with actual letter */}
          <span
            className={`absolute left-0 top-0 w-full transition-all duration-300 ${
              revealedLetters[index]
                ? "opacity-100 transform-none"
                : "opacity-0 -translate-y-2"
            }`}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        </span>
      ))}
    </div>
  );
}
