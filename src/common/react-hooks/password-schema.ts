import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    old_password: z.string().min(6, "Old password must be at least 6 characters"),
    password: z.string().min(6, "New password must be at least 6 characters"),
    confirm_password: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

export type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>;
