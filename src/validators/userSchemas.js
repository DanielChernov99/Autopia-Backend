import { z } from "zod";

const editableUserFields = {
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
};

export const userRegistrationSchema = z.object({
  ...editableUserFields,
  password: z.string().min(8),
});

export const userLoginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

export const userUpdateSchema = z
  .object(editableUserFields)
  .partial()
  .strict()
  .refine((update) => Object.keys(update).length > 0, {
    message: "At least one user field is required",
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must differ from the current password",
  });
