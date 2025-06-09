"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { submitIdiomPuzzle } from "@/app/lib/api";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiObject {
  native: string;
  id: string;
  name: string;
  unified: string;
  keywords: string[];
}

export default function SubmitPuzzle() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [emoji, setEmoji] = useState("");
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await submitIdiomPuzzle(
        emoji.trim(),
        answer.trim(),
        hint.trim(),
        user?.uid
      );
      setSuccess(true);
      setEmoji("");
      setAnswer("");
      setHint("");
    } catch (err) {
      setError("Failed to submit puzzle. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const addEmoji = (selectedEmoji: EmojiObject) => {
    setEmoji((prev) => prev + selectedEmoji.native);
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Submit an Idiom Puzzle
      </h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-8">
        <h2 className="font-semibold mb-2">Guidelines for Submission:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Use emojis that clearly represent the idiom</li>
          <li>Keep it family-friendly and appropriate</li>
          <li>Provide a clear and helpful hint</li>
          <li>Make sure the idiom is well-known and commonly used</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="emoji"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Emoji Sequence
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g., 🐘🚪"
              className="flex-1 p-2 border rounded"
              required
            />
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              😊
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute z-10 mt-1">
              <div
                className="fixed inset-0"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="relative">
                <Picker
                  data={data}
                  onEmojiSelect={addEmoji}
                  theme="light"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="answer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Answer (Idiom)
          </label>
          <input
            type="text"
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="e.g., elephant in the room"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label
            htmlFor="hint"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Hint
          </label>
          <textarea
            id="hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g., A big issue that people are ignoring"
            className="w-full p-2 border rounded h-24"
            required
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {success && (
          <div className="text-green-500 text-sm">
            Puzzle submitted successfully! It will be reviewed by our team.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 px-4 rounded text-white transition-colors ${
            submitting ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Puzzle"}
        </button>
      </form>

      {!user && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg text-center">
          <p className="mb-2">Want to track your submissions?</p>
          <a href="/login" className="text-blue-500 hover:underline">
            Log in now!
          </a>
        </div>
      )}
    </div>
  );
}
