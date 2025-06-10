"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { AdminPanel } from "@/app/components/admin-panel";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          throw new Error("Failed to verify admin status");
        }

        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } catch (error) {
        console.error("Failed to verify admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    }

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirectTo=/admin");
    }
    if (!loading && !isChecking && !isAdmin) {
      router.replace("/");
    }
  }, [user, loading, router, isChecking, isAdmin]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading admin panel...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Not authorized</div>
      </div>
    );
  }

  return <AdminPanel />;
}
