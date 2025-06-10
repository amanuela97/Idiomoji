import { signInWithPopup, AuthError, User } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase-client";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  FirestoreError,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { IdiomPuzzle, PlayerStats } from "./types";

export const signInWithGoogle = async () => {
  try {
    // Configure auth settings for popup
    auth.settings.appVerificationDisabledForTesting = true;

    // Set popup configuration
    const provider = googleProvider;
    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    return user;
  } catch (error) {
    console.error("Google Sign-in error:", error);
    // Handle specific Firebase Auth errors
    if (error instanceof Error) {
      const authError = error as AuthError;
      if (authError.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in cancelled by user");
      } else if (authError.code === "auth/popup-blocked") {
        throw new Error(
          "Popup was blocked by the browser. Please allow popups and try again."
        );
      }
    }
    throw error;
  }
};

// Get today's puzzle
export const getDailyPuzzle = async (): Promise<IdiomPuzzle | null> => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    console.log("Fetching puzzle for date:", today);

    // Get puzzle directly using date as document ID
    const docRef = doc(db, "dailyPuzzles", today);
    const puzzleSnap = await getDoc(docRef);

    if (!puzzleSnap.exists()) {
      console.log("No puzzle found for date:", today);
      return null;
    }

    return { id: puzzleSnap.id, ...puzzleSnap.data() } as IdiomPuzzle;
  } catch (error) {
    console.error("Error fetching daily puzzle:", error);
    throw error;
  }
};

// Save or update player stats
export const savePlayerStats = async (
  uid: string,
  stats: PlayerStats
): Promise<void> => {
  try {
    const playerRef = doc(db, "players", uid);
    await setDoc(playerRef, stats, { merge: true });
  } catch (error) {
    console.error("Error saving player stats:", error);
    throw error;
  }
};

// Get player stats
export const getPlayerStats = async (
  uid: string
): Promise<PlayerStats | null> => {
  try {
    // Verify the current user matches the requested uid
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== uid) {
      console.log("Auth state mismatch, skipping stats fetch");
      return null;
    }

    const playerRef = doc(db, "players", uid);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) {
      return null;
    }

    const data = playerDoc.data();
    // Handle both old (nested) and new (flat) data structure
    return data as PlayerStats;
  } catch (error) {
    if (error instanceof FirestoreError && error.code === "permission-denied") {
      console.log(
        "Permission denied for stats fetch, likely due to auth state change"
      );
      return null;
    }
    console.error("Error fetching player stats:", error);
    throw error;
  }
};

// Submit a new idiom puzzle
export const submitIdiomPuzzle = async (
  emoji: string,
  answer: string,
  hint: string,
  uid?: string
): Promise<void> => {
  try {
    const submissionRef = collection(db, "idiomSubmissions");
    await setDoc(doc(submissionRef), {
      emoji,
      answer,
      hint,
      submittedBy: uid,
      createdAt: serverTimestamp(),
      status: "pending",
    });
  } catch (error) {
    console.error("Error submitting idiom puzzle:", error);
    throw error;
  }
};

export type LeaderboardPlayer = {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  score: number;
  winRate: number;
  streak: number;
};

// Calculate win rate and other stats from PlayerStats
function calculatePlayerStats(stats: PlayerStats): {
  score: number;
  winRate: number;
  streak: number;
} {
  const totalGames = stats.totalGames || 0;
  const totalWins = stats.totalWins || 0;
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return {
    score: stats.totalScore || 0,
    winRate,
    streak: stats.currentStreak || 0,
  };
}

// Subscribe to leaderboard updates
export function subscribeToLeaderboard(
  callback: (players: LeaderboardPlayer[]) => void
) {
  const playersRef = collection(db, "players");

  // Create a real-time listener
  const unsubscribe = onSnapshot(
    playersRef,
    (snapshot) => {
      const players: LeaderboardPlayer[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Handle both old (nested) and new (flat) data structure
        const playerData = data.stats || data;
        const stats = calculatePlayerStats(playerData);
        players.push({
          id: doc.id,
          name: playerData.name || "Anonymous",
          email: playerData.email || "",
          photoURL: playerData.photoURL || "",
          ...stats,
        });
      });

      callback(players);
    },
    (error) => {
      console.error("Error fetching leaderboard:", error);
    }
  );

  return unsubscribe;
}

// Initialize or update user profile in Firestore
export const initializeUserProfile = async (user: User) => {
  try {
    const userRef = doc(db, "players", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create new user profile
      const initialStats: PlayerStats = {
        name: user.displayName || "Anonymous",
        email: user.email || "",
        photoURL: user.photoURL || "",
        totalGames: 0,
        totalWins: 0,
        totalScore: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastPlayed: "",
        history: [],
      };

      await setDoc(userRef, initialStats);
      return initialStats;
    } else {
      // Update existing user's display info
      const updateData = {
        name: user.displayName || "Anonymous",
        email: user.email || "",
        photoURL: user.photoURL || "",
      };

      await updateDoc(userRef, updateData);
      return { ...userSnap.data(), ...updateData } as PlayerStats;
    }
  } catch (error) {
    console.error("Error initializing user profile:", error);
    throw error;
  }
};
