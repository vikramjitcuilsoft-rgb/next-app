"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md"
      >
        <Clock className="w-16 h-16 text-purple-500 mx-auto animate-pulse" />
        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-3">
          🚧 Page Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The dashboard page you're looking for doesn't exist or isn't ready yet.
        </p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
        >
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}