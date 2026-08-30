import { string, z } from 'zod';
import { passwordSchema } from '../../../utils/passwordValidator';

export const createUserZodSchema = z.object({
     body: z.object({
          name: z
               .string({ required_error: 'Name is required' })
               .min(2, 'Name must be at least 2 characters long'),
          email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
          password: passwordSchema,
          phone: string().default('').optional(),
          profile: z.string().optional(),
     }),
});

const createBusinessUserZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }),
          phone: z.string({ required_error: 'Contact is required' }),
          email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
          password: passwordSchema,
          profile: z.string().optional(),
     }),
});

const updateUserZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
          contact: z.string().nullable().optional(),
          phone: z.string().nullable().optional(),
          address: z.string().nullable().optional(),
          email: z.string().email('Invalid email address').optional(),
          password: passwordSchema.optional(),
          image: z.string().nullable().optional(),
     }),
});

export const UserValidation = {
     createUserZodSchema,
     updateUserZodSchema,
     createBusinessUserZodSchema,
};
