import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { IdiomPuzzle, TimeAttackSession, PlayerTimeAttackStats } from "./types";

// Calculate score based on response time and attempt number
export function calculateScore(
  responseTime: number,
  attemptNumber: number
): number {
  // Base score for correct answer
  const baseScore = 1000;

  // Time penalty: lose points for slower responses
  const timePenalty = Math.round(Math.min(responseTime * 50, 500)); // Max 500 points lost for time

  // Attempt penalty: lose points for multiple attempts
  const attemptPenalty = (attemptNumber - 1) * 250; // 250 points lost per attempt

  return Math.round(Math.max(baseScore - timePenalty - attemptPenalty, 100)); // Minimum 100 points
}

// Fetch random approved puzzles
export async function fetchRandomPuzzles(
  count: number,
  excludeIds: string[] = []
): Promise<IdiomPuzzle[]> {
  try {
    // Query approved puzzles that are available (have a date)
    const puzzlesRef = collection(db, "dailyPuzzles");
    const q = query(
      puzzlesRef,
      where("approved", "==", true),
      orderBy("availableDate")
    );

    const snapshot = await getDocs(q);
    const puzzles = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          availableDate: doc.id,
        } as IdiomPuzzle;
      })
      .filter((puzzle) => !excludeIds.includes(puzzle.id));

    if (puzzles.length === 0) {
      console.warn("No approved puzzles found or all puzzles have been used");
      return [];
    }

    // If we have fewer puzzles than requested, return all of them
    if (puzzles.length <= count) {
      return shuffleArray(puzzles);
    }

    // Otherwise return the requested number of shuffled puzzles
    return shuffleArray(puzzles).slice(0, count);
  } catch (error) {
    console.error("Error fetching random puzzles:", error);
    return [];
  }
}

// Save time attack session
export async function saveTimeAttackSession(
  session: Omit<TimeAttackSession, "id">
): Promise<string> {
  try {
    const sessionsRef = collection(db, "timeAttackSessions");
    const newSessionRef = doc(sessionsRef);

    await setDoc(newSessionRef, {
      ...session,
      id: newSessionRef.id,
    });

    // Update player stats
    await updatePlayerTimeAttackStats(session);

    return newSessionRef.id;
  } catch (error) {
    console.error("Error saving time attack session:", error);
    throw error;
  }
}

// Update player's time attack statistics
async function updatePlayerTimeAttackStats(
  session: Omit<TimeAttackSession, "id">
) {
  try {
    const statsRef = doc(
      db,
      "players",
      session.playerId,
      "stats",
      "timeAttack"
    );
    const statsDoc = await getDoc(statsRef);

    const correctAttempts = session.puzzleAttempts.filter(
      (attempt) => attempt.correct
    );
    const totalResponseTime = correctAttempts.reduce(
      (sum, attempt) => sum + attempt.responseTime,
      0
    );
    const averageResponseTime = correctAttempts.length
      ? totalResponseTime / correctAttempts.length
      : 0;

    if (!statsDoc.exists()) {
      // Create new stats document
      await setDoc(statsRef, {
        totalGames: 1,
        bestScore: session.score,
        averageScore: session.score,
        totalPuzzlesSolved: correctAttempts.length,
        averageResponseTime,
        lastPlayed: session.endTime,
      } as PlayerTimeAttackStats);
    } else {
      const currentStats = statsDoc.data() as PlayerTimeAttackStats;
      const newTotalGames = currentStats.totalGames + 1;

      await updateDoc(statsRef, {
        totalGames: newTotalGames,
        bestScore: Math.max(currentStats.bestScore, session.score),
        averageScore:
          (currentStats.averageScore * currentStats.totalGames +
            session.score) /
          newTotalGames,
        totalPuzzlesSolved:
          currentStats.totalPuzzlesSolved + correctAttempts.length,
        averageResponseTime:
          (currentStats.averageResponseTime * currentStats.totalPuzzlesSolved +
            totalResponseTime) /
          (currentStats.totalPuzzlesSolved + correctAttempts.length),
        lastPlayed: session.endTime,
      });
    }
  } catch (error) {
    console.error("Error updating player stats:", error);
    throw error;
  }
}

// Utility function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
