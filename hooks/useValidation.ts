/**
 * Form Validation Hook
 * Provides real-time form validation with user feedback
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { validate, validateField, validateSafe, ValidationResult, ValidationError } from '../lib/validation';

export interface UseValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialData?: Partial<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
}

export interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  hasBeenSubmitted: boolean;
}

export interface UseValidationReturn<T> {
  // State
  data: Partial<T>;
  validation: ValidationState;
  
  // Actions
  setData: (data: Partial<T>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  clearAllErrors: () => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<ValidationResult<T>>;
  resetForm: (newData?: Partial<T>) => void;
  
  // Helpers
  getFieldError: (field: keyof T) => string | undefined;
  isFieldValid: (field: keyof T) => boolean;
  isFieldTouched: (field: keyof T) => boolean;
  shouldShowError: (field: keyof T) => boolean;
}

export function useValidation<T>({
  schema,
  initialData = {},
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  onValidationChange
}: UseValidationOptions<T>): UseValidationReturn<T> {
  const [data, setDataState] = useState<Partial<T>>(initialData);
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    isValidating: false,
    errors: {},
    touched: {},
    hasBeenSubmitted: false
  });

  // Debounced validation timer
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Memoized validation result
  const currentValidationResult = useMemo(() => {
    return validate(data, schema);
  }, [data, schema]);

  // Update validation state when data changes
  useEffect(() => {
    if (validateOnChange && Object.keys(validation.touched).length > 0) {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }

      const timer = setTimeout(() => {
        performValidation();
      }, debounceMs);

      setValidationTimer(timer);

      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
  }, [data, validateOnChange, debounceMs]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validation.isValid, Object.values(validation.errors).map(error => ({
      field: 'unknown',
      message: error
    })));
  }, [validation.isValid, validation.errors, onValidationChange]);

  const performValidation = useCallback(async (): Promise<ValidationResult<T>> => {
    setValidation(prev => ({ ...prev, isValidating: true }));

    const result = validate(data, schema);
    
    const newErrors: Record<string, string> = {};
    if (!result.success && result.errors) {
      result.errors.forEach(error => {
        newErrors[error.field] = error.message;
      });
    }

    setValidation(prev => ({
      ...prev,
      isValid: result.success,
      isValidating: false,
      errors: newErrors
    }));

    return result;
  }, [data, schema]);

  const setData = useCallback((newData: Partial<T>) => {
    setDataState(newData);
  }, []);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setDataState(prev => ({
      ...prev,
      [field]: value
    }));

    // Mark field as touched when value changes
    setValidation(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field as string]: true
      }
    }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T, touched = true) => {
    setValidation(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field as string]: touched
      }
    }));

    // Validate field on blur if enabled
    if (touched && validateOnBlur) {
      validateFieldInternal(field);
    }
  }, [validateOnBlur]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setValidation(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field as string]: error
      },
      isValid: false
    }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setValidation(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field as string];
      
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidation(prev => ({
      ...prev,
      errors: {},
      isValid: true
    }));
  }, []);

  const validateFieldInternal = useCallback(async (field: keyof T): Promise<boolean> => {
    const fieldValue = data[field];

    // For individual field validation, we'll validate the entire object
    // and extract the error for this specific field
    try {
      const result = validateSafe({ [field]: fieldValue }, z.object({ [field]: z.any() }));
      if (result.success) {
        clearFieldError(field);
        return true;
      } else {
        const fieldError = result.errors?.find(e => e.field === field as string);
        if (fieldError) {
          setFieldError(field, fieldError.message);
          return false;
        }
        return true;
      }
    } catch (error) {
      // Fallback: just clear any existing error
      clearFieldError(field);
      return true;
    }
  }, [data, setFieldError, clearFieldError]);

  const validateFormInternal = useCallback(async (): Promise<ValidationResult<T>> => {
    setValidation(prev => ({ 
      ...prev, 
      hasBeenSubmitted: true,
      isValidating: true 
    }));

    const result = await performValidation();

    // Mark all fields as touched on form submission
    const allFields = Object.keys(data);
    const touchedFields = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setValidation(prev => ({
      ...prev,
      touched: touchedFields,
      isValidating: false
    }));

    return result;
  }, [data, performValidation]);

  const resetForm = useCallback((newData?: Partial<T>) => {
    const resetData = newData || initialData;
    setDataState(resetData);
    setValidation({
      isValid: false,
      isValidating: false,
      errors: {},
      touched: {},
      hasBeenSubmitted: false
    });
  }, [initialData]);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return validation.errors[field as string];
  }, [validation.errors]);

  const isFieldValid = useCallback((field: keyof T): boolean => {
    return !validation.errors[field as string];
  }, [validation.errors]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return validation.touched[field as string] || false;
  }, [validation.touched]);

  const shouldShowError = useCallback((field: keyof T): boolean => {
    const fieldName = field as string;
    return (
      (validation.touched[fieldName] || validation.hasBeenSubmitted) &&
      !!validation.errors[fieldName]
    );
  }, [validation.touched, validation.hasBeenSubmitted, validation.errors]);

  return {
    // State
    data,
    validation,
    
    // Actions
    setData,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validateField: validateFieldInternal,
    validateForm: validateFormInternal,
    resetForm,
    
    // Helpers
    getFieldError,
    isFieldValid,
    isFieldTouched,
    shouldShowError
  };
}

// Hook for simple field validation
export function useFieldValidation<T>(
  value: T,
  schema: z.ZodSchema<T>,
  options: {
    validateOnChange?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { validateOnChange = true, debounceMs = 300 } = options;
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!validateOnChange) return;

    setIsValidating(true);
    const timer = setTimeout(() => {
      const fieldError = validateField(value, schema, 'field');
      setError(fieldError?.message || null);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, schema, validateOnChange, debounceMs]);

  const validateNow = useCallback(() => {
    const fieldError = validateField(value, schema, 'field');
    setError(fieldError?.message || null);
    return !fieldError;
  }, [value, schema]);

  return {
    error,
    isValid: !error,
    isValidating,
    validateNow
  };
}

// Hook for async validation (e.g., checking if email exists)
export function useAsyncValidation<T>(
  value: T,
  asyncValidator: (value: T) => Promise<string | null>,
  dependencies: any[] = [],
  options: {
    debounceMs?: number;
    enabled?: boolean;
  } = {}
) {
  const { debounceMs = 500, enabled = true } = options;
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    setIsValidating(true);
    const timer = setTimeout(async () => {
      try {
        const result = await asyncValidator(value);
        setError(result);
      } catch (err) {
        setError('Validation failed');
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, asyncValidator, enabled, debounceMs, ...dependencies]);

  return {
    error,
    isValid: !error,
    isValidating
  };
}

export default useValidation;
