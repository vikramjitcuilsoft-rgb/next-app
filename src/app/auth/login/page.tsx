"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import loginSchema from "@/common/react-hooks/login-schema";
import { apiPost } from "@/services/axios/axios-client";



type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();

  // React Hook Form setup
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


const mutation = useMutation({
  mutationFn: async (data: LoginForm) => {
    const response = await apiPost("/users/login", data);
    return response;
  },
  onSuccess: (data : any) => {
    console.log('data login',data.data);
    
    toast.success("Login successful 🎉 Redirecting...");
    
    // Optionally store token (if your backend returns one)
    if (data?.data.access_token) {
      localStorage.setItem("token", data.data.access_token);
    }

    router.push("/dashboard");
  },
  onError: (err: any) => {
    toast.error(err.response?.data?.message || "Invalid credentials ❌");
  },
});


  const onSubmit = (data: LoginForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Welcome Back 👋
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-sm text-center mt-4">
            Don’t have an account?{" "}
            <a href="/auth/register" className="text-purple-600 hover:underline">
              Create one
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
