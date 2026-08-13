import { z } from "zod";

export const userRegistrationSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(3),
});
