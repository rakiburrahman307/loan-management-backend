import { z } from 'zod';
import { passwordSchema } from '../../../utils/passwordValidator';

const createVerifyEmailZodSchema = z.object({
     body: z.object({
          email: z.string({ required_error: 'Email is required' }),
          oneTimeCode: z.number({ required_error: 'One time code is required' }),
     }),
});

const createLoginZodSchema = z.object({
     body: z.object({
          email: z.string({ required_error: 'Email is required' }),
          password: z.string({ required_error: 'Password is required' }),
     }),
});

const createForgetPasswordZodSchema = z.object({
     body: z.object({
          email: z.string({ required_error: 'Email is required' }),
     }),
});

const createResetPasswordZodSchema = z.object({
     body: z.object({
          newPassword: passwordSchema,
          confirmPassword: passwordSchema,
     }),
});

const createChangePasswordZodSchema = z.object({
     body: z.object({
          currentPassword: z.string({
               required_error: 'Current Password is required',
          }),
          newPassword: passwordSchema,
          confirmPassword: passwordSchema,
     }),
});

export const AuthValidation = {
     createVerifyEmailZodSchema,
     createForgetPasswordZodSchema,
     createLoginZodSchema,
     createResetPasswordZodSchema,
     createChangePasswordZodSchema,
};
