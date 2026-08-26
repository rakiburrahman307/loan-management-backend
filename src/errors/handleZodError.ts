import { ZodError, ZodIssue } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleZodError = (err: ZodError): TGenericErrorResponse => {
     const errorSources: TErrorSources = err.errors.map((error: ZodIssue) => {
          return {
               path: error?.path[error?.path.length - 1],
               message: error?.message,
          };
     });
     return {
          statusCode: 400,
          message: 'Validation Error',
          errorSources,
     };
};
export default handleZodError;
