"use client";

import { useAuth } from "@/hooks/useAuth";
import React from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth(true);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Checking authentication...
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
