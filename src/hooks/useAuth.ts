"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth(redirectToLogin: boolean = true) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthenticated(false);
      if (redirectToLogin) router.push("/auth/login");
    } else {
      setAuthenticated(true);
    }

    setLoading(false);
  }, [redirectToLogin, router]);

  return { authenticated, loading };
}
