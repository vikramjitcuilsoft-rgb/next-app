"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import axios from "axios";
import {toast} from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";
import { apiPost } from "@/services/axios/axios-client";
import { ChangePasswordSchema } from "@/common/react-hooks/password-schema";
import { useRouter } from "next/navigation";

// ✅ Infer TypeScript type from Zod schema
type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>;

export default function ChangePassword() {
    const router = useRouter()
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // ✅ React Hook Form + Zod
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordSchema),
  });

    const mutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
        const payload = {
        old_password: data.old_password,
        new_password: data.password,
        };
        return await apiPost("/users/change-password", payload);
    },
    onSuccess: () => {
        toast.success("Password updated successfully 🎉");
        reset();
        router.push('/auth/login')
    },
    onError: (err: any) => {
        // Safely extract message text
        const errorMessage =
        err.response?.data?.message?.response?.message ||
        err.response?.data?.message?.message ||
        err.response?.data?.message ||
        "Something went wrong ❌";

        toast.error(errorMessage);
    },
    });


  const onSubmit = (data: ChangePasswordForm) => mutation.mutate(data);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-100"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">
          Change Password 🔐
        </h2>

        {/* Old Password */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Old Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword.old ? "text" : "password"}
              {...register("old_password")}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter old password"
            />
            {showPassword.old ? (
              <EyeOff
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, old: false }))
                }
              />
            ) : (
              <Eye
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, old: true }))
                }
              />
            )}
          </div>
          {errors.old_password && (
            <p className="text-red-500 text-xs mt-1">{errors.old_password.message}</p>
          )}
        </div>

        {/* New Password */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword.new ? "text" : "password"}
              {...register("password")}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter new password"
            />
            {showPassword.new ? (
              <EyeOff
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: false }))
                }
              />
            ) : (
              <Eye
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: true }))
                }
              />
            )}
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword.confirm ? "text" : "password"}
              {...register("confirm_password")}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Confirm new password"
            />
            {showPassword.confirm ? (
              <EyeOff
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, confirm: false }))
                }
              />
            ) : (
              <Eye
                size={18}
                className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, confirm: true }))
                }
              />
            )}
          </div>
          {errors.confirm_password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-md font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {mutation.isPending ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
