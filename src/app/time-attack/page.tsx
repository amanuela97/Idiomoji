"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/app/lib/auth-context";
import {
  fetchRandomPuzzles,
  calculateScore,
  saveTimeAttackSession,
  generateLetterHints,
} from "@/app/lib/time-attack";
import { IdiomPuzzle, TimeAttackSession, PuzzleAttempt } from "@/app/lib/types";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const GAME_DURATION = 120; // 2 minutes in seconds
const MAX_ATTEMPTS = 3;
const INITIAL_PUZZLE_COUNT = 15;

export default function TimeAttackGame() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [puzzles, setPuzzles] = useState<IdiomPuzzle[]>([]);
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [currentAttempt, setCurrentAttempt] = useState<string>("");
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [puzzleStartTime, setPuzzleStartTime] = useState<Date | null>(null);
  const [puzzleAttempts, setPuzzleAttempts] = useState<PuzzleAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const isEndingGame = useRef(false);
  const usedPuzzleIds = useRef<Set<string>>(new Set());
  const timerStartRef = useRef<number>(0);
  const requestAnimationFrameRef = useRef<number | null>(null);
  const [usedHint, setUsedHint] = useState<boolean>(false);

  // Define endGame first since it's used in the timer effect
  const endGame = useCallback(async () => {
    if (!user || !gameStartTime || isEndingGame.current) return;

    isEndingGame.current = true;
    setIsGameActive(false);
    setIsGameOver(true);
    const endTime = new Date();

    // Small delay to ensure the last attempt state updates are processed
    await new Promise((resolve) => setTimeout(resolve, 100));

    const session: Omit<TimeAttackSession, "id"> = {
      playerId: user.uid,
      playerName: user.displayName || "Anonymous",
      playerPhotoURL: user.photoURL || undefined,
      startTime: Timestamp.fromDate(gameStartTime),
      endTime: Timestamp.fromDate(endTime),
      score: sessionScore,
      puzzleAttempts,
    };

    try {
      await saveTimeAttackSession(session);
      toast.success("Game session saved!", { duration: 1000 });
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save game session");
    }
  }, [user, gameStartTime, sessionScore, puzzleAttempts]);

  // Start game
  const startGame = useCallback(() => {
    if (!user) {
      toast.error("Please log in to play Time Attack mode");
      return;
    }
    if (puzzles.length === 0) {
      toast.error("No puzzles available. Please try again.");
      return;
    }
    setIsGameActive(true);
    setIsGameOver(false);
    const now = Date.now();
    setGameStartTime(new Date(now));
    setPuzzleStartTime(new Date(now));
    timerStartRef.current = now;
    setTimeLeft(GAME_DURATION);
    setCurrentPuzzleIndex(0);
    setSessionScore(0);
    setPuzzleAttempts([]);
    setAttemptCount(0);
    isEndingGame.current = false;
  }, [user, puzzles.length]);

  // Handle game timer using requestAnimationFrame
  useEffect(() => {
    if (!isGameActive) {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
      return;
    }

    let frameId: number;

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - timerStartRef.current) / 1000);
      const newTimeLeft = Math.max(0, GAME_DURATION - elapsedSeconds);

      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        // Save the current attempt if there is one
        if (currentAttempt.trim() && puzzleStartTime) {
          const currentPuzzle = puzzles[currentPuzzleIndex];
          if (currentPuzzle) {
            const isCorrect =
              currentAttempt.toLowerCase().trim() ===
              currentPuzzle.answer.toLowerCase().trim();
            const responseTime = (now - puzzleStartTime.getTime()) / 1000;
            const lastAttempt: PuzzleAttempt = {
              puzzleId: currentPuzzle.id,
              answeredAt: Timestamp.now(),
              correct: isCorrect,
              responseTime,
              scoreAwarded: isCorrect
                ? calculateScore(responseTime, attemptCount + 1, usedHint)
                : 0,
              attemptNumber: attemptCount + 1,
              usedHint,
            };
            setPuzzleAttempts((prev) => [...prev, lastAttempt]);
            if (isCorrect) {
              setSessionScore((prev) => prev + lastAttempt.scoreAwarded);
            }
          }
        }
        endGame();
        return;
      }

      frameId = requestAnimationFrame(updateTimer);
      requestAnimationFrameRef.current = frameId;
    };

    frameId = requestAnimationFrame(updateTimer);
    requestAnimationFrameRef.current = frameId;

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    isGameActive,
    currentAttempt,
    puzzleStartTime,
    puzzles,
    currentPuzzleIndex,
    attemptCount,
    endGame,
    usedHint,
  ]);

  // Load initial puzzles
  const loadPuzzles = useCallback(async () => {
    try {
      setLoading(true);
      usedPuzzleIds.current.clear(); // Reset used puzzles on new game
      const loadedPuzzles = await fetchRandomPuzzles(
        INITIAL_PUZZLE_COUNT,
        Array.from(usedPuzzleIds.current)
      );
      console.log("Loaded puzzles:", loadedPuzzles);
      if (loadedPuzzles.length === 0) {
        toast.error("No puzzles available. Please try again later.");
      } else {
        // Add loaded puzzle IDs to used set
        loadedPuzzles.forEach((puzzle) => usedPuzzleIds.current.add(puzzle.id));
      }
      setPuzzles(loadedPuzzles);
    } catch (error) {
      console.error("Error loading puzzles:", error);
      toast.error("Failed to load puzzles");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more puzzles if needed
  useEffect(() => {
    if (currentPuzzleIndex >= puzzles.length - 5 && isGameActive) {
      const loadMorePuzzles = async () => {
        try {
          const morePuzzles = await fetchRandomPuzzles(
            10,
            Array.from(usedPuzzleIds.current)
          );
          console.log(
            "Loading more puzzles, excluding:",
            Array.from(usedPuzzleIds.current),
            "Got puzzles:",
            morePuzzles.length
          );

          if (morePuzzles.length > 0) {
            // Add new puzzle IDs to used set
            morePuzzles.forEach((puzzle) =>
              usedPuzzleIds.current.add(puzzle.id)
            );
            setPuzzles((prev) => [...prev, ...morePuzzles]);
          } else {
            // Only end the game if we're actually out of puzzles AND we've used the last puzzle
            if (currentPuzzleIndex >= puzzles.length) {
              toast.success(
                "Congratulations! You've solved all available puzzles!"
              );
              endGame();
            }
          }
        } catch (error) {
          console.error("Error loading more puzzles:", error);
        }
      };
      loadMorePuzzles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzleIndex, puzzles.length, isGameActive]);

  // Initial puzzle load
  useEffect(() => {
    loadPuzzles();
  }, [loadPuzzles]);

  // Reset hint states when moving to next puzzle
  const resetHintStates = useCallback(() => {
    setUsedHint(false);
  }, []);

  // Show hint
  const showHint = useCallback(() => {
    if (!usedHint && puzzles[currentPuzzleIndex]) {
      setUsedHint(true);
    }
  }, [usedHint, puzzles, currentPuzzleIndex]);

  const checkAnswer = useCallback(() => {
    if (!puzzleStartTime || !puzzles[currentPuzzleIndex]) return;

    // Prevent empty submissions
    if (!currentAttempt.trim()) {
      toast.error("Please enter an answer", { duration: 500 });
      return;
    }

    const currentPuzzle = puzzles[currentPuzzleIndex];
    const isCorrect =
      currentAttempt.toLowerCase().trim() ===
      currentPuzzle.answer.toLowerCase().trim();
    const responseTime =
      (new Date().getTime() - puzzleStartTime.getTime()) / 1000;

    const attempt: PuzzleAttempt = {
      puzzleId: currentPuzzle.id,
      answeredAt: Timestamp.now(),
      correct: isCorrect,
      responseTime,
      scoreAwarded: isCorrect
        ? calculateScore(responseTime, attemptCount + 1, usedHint)
        : 0,
      attemptNumber: attemptCount + 1,
      usedHint,
    };

    setPuzzleAttempts((prev) => [...prev, attempt]);

    if (isCorrect) {
      toast.success("Correct!", {
        duration: 500,
      });
      setSessionScore((prev) => prev + attempt.scoreAwarded);
      setCurrentPuzzleIndex((prev) => prev + 1);
      setAttemptCount(0);
      setPuzzleStartTime(new Date());
      resetHintStates();
    } else {
      toast.error("Try again!", { duration: 500 });
      if (attemptCount + 1 >= MAX_ATTEMPTS) {
        endGame();
      } else {
        setAttemptCount((prev) => prev + 1);
      }
    }

    setCurrentAttempt("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    puzzleStartTime,
    puzzles,
    currentPuzzleIndex,
    currentAttempt,
    attemptCount,
    usedHint,
    resetHintStates,
  ]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-2xl mb-4">Loading time attack puzzles...</div>
        <div className="text-gray-600">
          Please wait while we prepare your game
        </div>
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">Time Attack Mode</h1>
        <p className="text-lg mb-8 text-center text-red-600">
          No puzzles are currently available. Please try again later.
        </p>
        <button
          onClick={loadPuzzles}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-8"
        >
          Retry Loading Puzzles
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">Time Attack Mode</h1>
        <p className="text-lg mb-8 text-center">
          Challenge yourself to solve as many idioms as you can in 2 minutes!
        </p>
        <button
          onClick={() => router.push("/login")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Log in to Play
        </button>
      </div>
    );
  }

  if (isGameOver) {
    const correctPuzzles = puzzleAttempts.filter((a) => a.correct).length;
    const timeSpent = gameStartTime
      ? Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000)
      : GAME_DURATION;
    const timeRemaining = Math.max(0, GAME_DURATION - timeSpent);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-6">Game Over!</h2>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">
                {sessionScore.toLocaleString()}
              </div>
              <div className="text-gray-600">Final Score</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {correctPuzzles}
                </div>
                <div className="text-sm text-gray-600">Puzzles Solved</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {timeRemaining}s
                </div>
                <div className="text-sm text-gray-600">Time Remaining</div>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                View Leaderboard
              </button>

              <button
                onClick={() => {
                  loadPuzzles();
                  setCurrentPuzzleIndex(0);
                  startGame();
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isGameActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-4">Time Attack Mode</h1>
        <p className="text-lg mb-8 text-center">
          Solve as many idioms as you can in 2 minutes! You have 3 attempts per
          puzzle.
        </p>
        <button
          onClick={startGame}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Start Game
        </button>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentPuzzleIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold">Score: {sessionScore}</div>
          <div className="text-2xl font-bold">Time: {timeLeft}s</div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-6xl text-center mb-4">{currentPuzzle.emoji}</div>
          <div className="text-xl text-center mb-4 font-mono tracking-wider text-gray-500">
            {generateLetterHints(currentPuzzle.answer)}
          </div>

          {/* Hint Section */}
          <div className="mb-6">
            {!usedHint ? (
              <button
                onClick={showHint}
                className="w-full py-2 px-4 rounded flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
              >
                <span role="img" aria-label="light bulb" className="text-xl">
                  💡
                </span>
                <span>Show Hint (-200pts)</span>
              </button>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-fade-in">
                <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                  <span role="img" aria-label="light bulb" className="text-xl">
                    💡
                  </span>
                  <span>Hint</span>
                </div>
                <p className="text-yellow-700">{currentPuzzle.hint}</p>
              </div>
            )}
          </div>

          <input
            type="text"
            value={currentAttempt}
            onChange={(e) => setCurrentAttempt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentAttempt.trim()) {
                checkAnswer();
              }
            }}
            placeholder="Type your answer..."
            className="w-full p-2 border rounded mb-4"
            autoFocus
          />
          <div className="text-center text-gray-600">
            Attempt {attemptCount + 1} of {MAX_ATTEMPTS}
          </div>
        </div>

        <button
          onClick={checkAnswer}
          disabled={!currentAttempt.trim()}
          className={`w-full font-bold py-2 px-4 rounded ${
            currentAttempt.trim()
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}
