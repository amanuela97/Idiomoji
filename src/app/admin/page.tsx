"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth-context";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
  getDocs,
  serverTimestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase-client";

type IdiomSubmission = {
  id: string;
  emoji: string;
  answer: string;
  hint: string;
  submittedBy?: string;
  createdAt: Timestamp;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
};

export default function AdminReview() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<IdiomSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<IdiomSubmission | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>(
    {}
  );
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    const submissionsRef = collection(db, "idiomSubmissions");
    const q = query(
      submissionsRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const submissions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IdiomSubmission[];
        setSubmissions(submissions);
        setLoadingSubmissions(false);
      },
      (err: Error) => {
        console.error("Error in submissions snapshot:", err);
        setError("Failed to load submissions");
        setLoadingSubmissions(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const checkDateAvailability = async (date: string): Promise<boolean> => {
    try {
      const docRef = doc(db, "dailyPuzzles", date);
      const docSnap = await getDoc(docRef);
      return !docSnap.exists();
    } catch (error) {
      console.error("Error checking date availability:", error);
      throw error;
    }
  };

  // Effect to handle approval when selectedSubmission changes
  useEffect(() => {
    const approveSubmission = async () => {
      if (!selectedSubmission || !isApproving) return;

      try {
        // Check if date is available
        const isDateAvailable = await checkDateAvailability(selectedDate);
        if (!isDateAvailable) {
          alert(
            `A puzzle is already scheduled for ${selectedDate}. Please choose a different date.`
          );
          setSelectedSubmission(null);
          setIsApproving(false);
          return;
        }

        // Add to dailyPuzzles collection using date as document ID
        const dailyPuzzleRef = doc(db, "dailyPuzzles", selectedDate);
        await setDoc(dailyPuzzleRef, {
          emoji: selectedSubmission.emoji,
          answer: selectedSubmission.answer,
          hint: selectedSubmission.hint,
          submittedBy: selectedSubmission.submittedBy,
          createdAt: serverTimestamp(),
          availableDate: selectedDate,
          approved: true,
        });

        // Update submission status
        const submissionRef = doc(
          db,
          "idiomSubmissions",
          selectedSubmission.id
        );
        await updateDoc(submissionRef, {
          status: "approved",
          availableDate: selectedDate,
        });

        // Clear selection and refresh
        setSelectedSubmission(null);
        setSelectedDate("");
        setIsApproving(false);
        fetchSubmissions();
      } catch (error) {
        console.error("Error approving submission:", error);
        setSelectedSubmission(null);
        setIsApproving(false);
        throw error;
      }
    };

    approveSubmission();
  }, [selectedSubmission, selectedDate, isApproving]);

  const handleReject = async () => {
    if (!selectedSubmission) return;

    try {
      const submissionRef = doc(db, "idiomSubmissions", selectedSubmission.id);
      await updateDoc(submissionRef, {
        status: "rejected",
      });

      // Clear selection and refresh
      setSelectedSubmission(null);
      setSelectedDate("");
      fetchSubmissions();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      throw error;
    }
  };

  const fetchSubmissions = async () => {
    try {
      const submissionsRef = collection(db, "idiomSubmissions");
      const q = query(
        submissionsRef,
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const submissions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as IdiomSubmission[];
      setSubmissions(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      throw error;
    }
  };

  const handleDateChange = (submissionId: string, date: string) => {
    setSelectedDates((prev) => ({
      ...prev,
      [submissionId]: date,
    }));
  };

  // Show error state
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Show loading state while fetching submissions
  if (loadingSubmissions) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading submissions...
      </div>
    );
  }

  // Only show access denied if user is not logged in
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Access denied
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Admin Review</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      {loadingSubmissions ? (
        <div>Loading submissions...</div>
      ) : submissions.length === 0 ? (
        <div>No pending submissions</div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold">Emoji</h3>
                  <p className="text-2xl">{submission.emoji}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Answer</h3>
                  <p>{submission.answer}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Hint</h3>
                  <p>{submission.hint}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Submitted By</h3>
                  <p>{submission.submittedBy || "Anonymous"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Available Date
                  </label>
                  <input
                    type="date"
                    value={selectedDates[submission.id] || ""}
                    onChange={(e) =>
                      handleDateChange(submission.id, e.target.value)
                    }
                    className="p-2 border rounded"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedDate(selectedDates[submission.id] || "");
                      setIsApproving(true);
                      setSelectedSubmission(submission);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    disabled={!selectedDates[submission.id]}
                  >
                    Approve
                  </button>

                  <div className="flex-1">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection"
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      handleReject();
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    disabled={!rejectionReason}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
