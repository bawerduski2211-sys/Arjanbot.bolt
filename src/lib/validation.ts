import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Enter your name').max(80, 'Name is too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const addBotSchema = z.object({
  platform: z.enum(['whatsapp', 'telegram']),
  botName: z
    .string()
    .min(1, 'Enter a bot name')
    .max(60, 'Bot name is too long'),
  apiToken: z
    .string()
    .min(1, 'Enter an API token')
    .max(500, 'Token is too long'),
  webhookUrl: z
    .string()
    .url('Enter a valid webhook URL')
    .optional()
    .or(z.literal('')),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AddBotInput = z.infer<typeof addBotSchema>;
