import { z } from 'zod';

const updateStatus = z.object({
     body: z.object({
          status: z.enum(['active', 'blocked'], {
               errorMap: () => {
                    return {
                         message: 'Invalid status. Valid values are "active" or "blocked".',
                    };
               },
          }),
     }),
});

export const userManagementsValidations = {
     updateStatus,
};
