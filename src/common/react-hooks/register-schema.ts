import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string()
});

export default registerSchema