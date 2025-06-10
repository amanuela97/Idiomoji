"use client";

import { signInWithGoogle, initializeUserProfile } from "@/app/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Suspense } from "react";

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      const idToken = await user.getIdToken();

      // Send the ID token to the server
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.status !== 200) {
        throw new Error(data.error || "Failed to create session");
      }

      // Initialize or update user profile in Firestore
      await initializeUserProfile(user);

      toast.success("Successfully signed in!", {
        duration: 1000,
      });

      // Let the middleware handle the redirect
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the page to let middleware handle redirect with new cookie
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Welcome to Idiomoji</h2>
          <p className="text-gray-600">
            Sign in to play and track your progress
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 cursor-pointer bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Image
              src="/google.webp"
              alt="Google"
              className="w-5 h-5"
              width={20}
              height={20}
            />
          )}
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-sm text-gray-500 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-2xl font-bold">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
