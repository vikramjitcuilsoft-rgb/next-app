"use client";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6">
        Create Account
      </h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-medium"
        >
          Create Account
        </button>
      </form>

      <p className="text-sm text-center mt-4">
        Already have an account?{" "}
        <a href="/auth/login" className="text-purple-600 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
