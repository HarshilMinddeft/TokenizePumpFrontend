import { useCallback, useState } from 'react';

/**
 * Runs a Zod schema against a values object and keeps a `{ field: message }`
 * error map for rendering inline, first-issue-per-field. Framework-agnostic
 * with respect to form state — pass whatever values object the caller is
 * already managing (useState, multiple fields, files, ...); this hook only
 * owns validation and its resulting errors.
 *
 * @param {import('zod').ZodSchema} schema
 */
export const useZodForm = (schema) => {
  const [errors, setErrors] = useState({});

  const validate = useCallback(
    (values) => {
      const result = schema.safeParse(values);
      if (result.success) {
        setErrors({});
        return { success: true, data: result.data };
      }

      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return { success: false, errors: fieldErrors };
    },
    [schema]
  );

  const clearError = useCallback((field) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { errors, validate, clearError };
};
