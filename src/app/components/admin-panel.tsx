"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase-client";
import { toast } from "sonner";

type IdiomSubmission = {
  id: string;
  emoji: string;
  answer: string;
  hint: string;
  submittedBy?: string;
};

export function AdminPanel() {
  const [submissions, setSubmissions] = useState<IdiomSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<IdiomSubmission | null>(null);
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>(
    {}
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const submissionsRef = collection(db, "idiomSubmissions");
        const q = query(submissionsRef, where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);

        const submissionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as IdiomSubmission[];

        setSubmissions(submissionsData);
        setError(null);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        setError("Failed to load submissions");
      } finally {
        setLoadingSubmissions(false);
      }
    }

    fetchSubmissions();
  }, []);

  const handleDateChange = (submissionId: string, date: string) => {
    setSelectedDates((prev) => ({
      ...prev,
      [submissionId]: date,
    }));
  };

  const handleApprove = async (submission: IdiomSubmission, date: string) => {
    try {
      // Add to dailyPuzzles collection using date as document ID
      const dailyPuzzleRef = doc(db, "dailyPuzzles", date);
      await setDoc(dailyPuzzleRef, {
        emoji: submission.emoji,
        answer: submission.answer.toLowerCase().trim(),
        hint: submission.hint,
        submittedBy: submission.submittedBy,
        createdAt: serverTimestamp(),
        availableDate: date,
        approved: true,
      });

      // Delete the submission from idiomSubmissions
      await deleteDoc(doc(db, "idiomSubmissions", submission.id));

      // Remove from local state
      setSubmissions((prev) => prev.filter((sub) => sub.id !== submission.id));

      toast.success("Puzzle approved successfully!");
    } catch (error) {
      console.error("Error approving submission:", error);
      toast.error("Failed to approve puzzle");
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason) return;

    try {
      // Delete the submission
      await deleteDoc(doc(db, "idiomSubmissions", selectedSubmission.id));

      // Remove from local state
      setSubmissions((prev) =>
        prev.filter((sub) => sub.id !== selectedSubmission.id)
      );

      toast.success("Submission rejected successfully");
      setRejectionReason("");
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission");
    }
  };

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
                    onClick={() =>
                      handleApprove(
                        submission,
                        selectedDates[submission.id] || ""
                      )
                    }
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
