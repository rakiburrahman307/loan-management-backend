import { z } from 'zod';

export const passwordSchema = z
     .string({ required_error: 'Password is required' })
     .min(8, 'Password must be at least 8 characters long')
     .refine((value) => /[a-z]/.test(value), {
          message: 'Password must contain at least one lowercase letter',
     })
     .refine((value) => /[A-Z]/.test(value), {
          message: 'Password must contain at least one uppercase letter',
     })
     .refine((value) => /\d/.test(value), {
          message: 'Password must contain at least one number',
     })
     .refine((value) => /[@$!%*?&#]/.test(value), {
          message: 'Password must contain at least one special character (@$!%*?&#)',
     });
