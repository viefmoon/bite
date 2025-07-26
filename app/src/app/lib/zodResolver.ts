import type { FieldErrors, FieldValues, ResolverResult } from 'react-hook-form';
import type { ZodSchema, ZodError } from 'zod';

export function zodResolver<T extends FieldValues>(schema: ZodSchema<T>) {
  return async (data: T): Promise<ResolverResult<T>> => {
    try {
      const validatedData = await schema.parseAsync(data);
      return {
        values: validatedData,
        errors: {},
      };
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as ZodError;
        const fieldErrors: FieldErrors<T> = {};

        zodError.errors.forEach((err) => {
          const path = err.path.join('.');
          if (path) {
            (fieldErrors as any)[path] = {
              type: err.code,
              message: err.message,
            };
          }
        });

        return {
          values: {} as T,
          errors: fieldErrors,
        };
      }
      throw error;
    }
  };
}
