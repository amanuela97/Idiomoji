"use client";

import { useAuth } from "@/app/lib/auth-context";
import { AdminPanel } from "@/app/components/admin-panel";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading admin panel...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Not authorized</div>
      </div>
    );
  }

  return <AdminPanel />;
}
