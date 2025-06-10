You are tasked with implementing the Time Attack mode for the Idiomoji game using Next.js 15, TypeScript, Tailwind, and Firebase. Follow these steps:

1. Create (if not already available) a new Firestore collection called 'timeAttackSessions' with documents conforming to the TimeAttackSession type. This type should include fields for player ID, session start and end times, total score, and an array of PuzzleAttempt details.

2. below is an example of the types needed to be created in /libs/types.ts:
   export type TimeAttackSession = {
   id: string;
   playerId: string;
   startTime: Date;
   endTime: Date;
   score: number;
   puzzleAttempts: PuzzleAttempt[];
   };

export type PuzzleAttempt = {
puzzleId: string;
answeredAt: Date;
correct: boolean;
responseTime: number; // seconds
scoreAwarded: number;
};

3. In the Next.js project, create a new page at 'app/time-attack/page.tsx'. This page should:
   - Initialize a 2-minute countdown timer using a combination of useState and useEffect.
   - Lazy Load a set of approved idioms (from an existing pool, such as dailyPuzzles collection but properly randomized).
   - Maybe you could use a method where you lazy fetch 15 randomized puzzles and then fetch 15 more if the user gets first 10 correct.
   - Display each idiom puzzle along with an input field for guesses similar to the /daily page.
   - Keep presenting the user a new puzzle either until the 2 minutes timer runs out or the users loses by using all attempts (max should be 3 attempts).
   - Check the user answer and award points based on how quickly the answer is submitted.
   - Record each puzzle attempt with its puzzle ID, response time, correctness, and points awarded.
   - When time expires, compile the session data and update Firestore in the 'timeAttackSessions' collection
   - Update the players collection with aggregated values such as totalTimeAttackGames, bestTimeAttackScore, etc for global leaderboard.
   - Consider using a composite index in Firestore based on the score field for fast queries.
