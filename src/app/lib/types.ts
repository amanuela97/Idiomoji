import { Timestamp } from "firebase/firestore";

export type IdiomPuzzle = {
  id: string;
  emoji: string; // "🐘🚪"
  answer: string; // "elephant in the room"
  hint: string; // "A big issue that people are ignoring"
  approved: boolean;
  submittedBy?: string; // uid (optional)
  createdAt: Timestamp;
  availableDate: string; // YYYY-MM-DD
};

export type TimeAttackSession = {
  id: string;
  playerId: string;
  playerName: string;
  playerPhotoURL?: string;
  startTime: Timestamp;
  endTime: Timestamp;
  score: number;
  puzzleAttempts: PuzzleAttempt[];
};

export type PuzzleAttempt = {
  puzzleId: string;
  answeredAt: Timestamp;
  correct: boolean;
  responseTime: number; // seconds
  scoreAwarded: number;
  attemptNumber: number;
};

// Add PlayerTimeAttackStats to track player's time attack performance
export type PlayerTimeAttackStats = {
  totalGames: number;
  bestScore: number;
  averageScore: number;
  totalPuzzlesSolved: number;
  averageResponseTime: number;
  lastPlayed: Timestamp;
};

export type DailyStats = {
  date: string; // YYYY-MM-DD
  attempts: number;
  usedHint: boolean;
  usedPatternHint: boolean;
  won: boolean;
  score: number;
  attemptValues: string[];
};

export type PlayerStats = {
  name: string;
  email: string;
  photoURL: string;
  totalGames: number;
  totalWins: number;
  totalScore: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayed: string; // YYYY-MM-DD
  history: DailyStats[];
};
