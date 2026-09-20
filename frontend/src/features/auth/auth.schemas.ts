import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const registerFormSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(2, 'First name must be at least 2 characters'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(2, 'Last name must be at least 2 characters'),
    phone: z
      .string()
      .trim()
      .regex(/^(\+\d{1,3}[- ]?)?\d{10}$/, 'Invalid phone number format (e.g. 10 digits)')
      .optional()
      .nullable()
      .or(z.literal('')),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      ),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Please confirm your password'),
    role: z.enum(['SUPER_ADMIN', 'PROPERTY_ADMIN', 'MANAGER', 'OWNER', 'TENANT']).default('TENANT'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      ),
    confirmNewPassword: z
      .string({ required_error: 'Please confirm your new password' })
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export const forgotPasswordFormSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .trim()
    .toLowerCase(),
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string({ required_error: 'Reset token is required' }).min(1, 'Reset token is required'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      ),
    confirmNewPassword: z
      .string({ required_error: 'Please confirm your new password' })
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

