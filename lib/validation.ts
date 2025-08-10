/**
 * Comprehensive Validation System
 * Provides validation utilities and schemas using Zod
 */

import { z } from 'zod';

// Base validation schemas
export const baseSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(2000, 'Description is too long'),
  url: z.string().url('Invalid URL format').optional(),
  coordinates: z.object({
    lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180')
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  date: z.date().or(z.string().datetime()),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().min(0, 'Must be zero or positive')
};

// Campaign validation schemas
export const campaignSchemas = {
  create: z.object({
    name: baseSchemas.name,
    description: baseSchemas.description.optional(),
    setting: z.string().min(1, 'Setting is required'),
    playerCount: z.number().min(1, 'At least 1 player required').max(20, 'Maximum 20 players allowed'),
    isPublic: z.boolean().default(false)
  }),
  
  update: z.object({
    name: baseSchemas.name.optional(),
    description: baseSchemas.description.optional(),
    setting: z.string().min(1, 'Setting is required').optional(),
    playerCount: z.number().min(1, 'At least 1 player required').max(20, 'Maximum 20 players allowed').optional(),
    isPublic: z.boolean().optional()
  })
};

// NPC validation schemas
export const npcSchemas = {
  create: z.object({
    name: baseSchemas.name,
    role: z.string().min(1, 'Role is required'),
    description: baseSchemas.description.optional(),
    locationId: baseSchemas.id,
    campaignId: baseSchemas.id,
    personality: z.string().max(500, 'Personality description is too long').optional(),
    appearance: z.string().max(500, 'Appearance description is too long').optional(),
    backstory: z.string().max(1000, 'Backstory is too long').optional(),
    level: z.number().min(1, 'Level must be at least 1').max(20, 'Level cannot exceed 20').optional(),
    race: z.string().max(50, 'Race name is too long').optional(),
    class: z.string().max(50, 'Class name is too long').optional(),
    alignment: z.enum(['LG', 'LN', 'LE', 'NG', 'N', 'NE', 'CG', 'CN', 'CE']).optional(),
    stats: z.object({
      strength: z.number().min(1).max(30).optional(),
      dexterity: z.number().min(1).max(30).optional(),
      constitution: z.number().min(1).max(30).optional(),
      intelligence: z.number().min(1).max(30).optional(),
      wisdom: z.number().min(1).max(30).optional(),
      charisma: z.number().min(1).max(30).optional()
    }).optional(),
    isImportant: z.boolean().default(false),
    isAlive: z.boolean().default(true),
    portraitUrl: baseSchemas.url
  }),
  
  update: z.object({
    name: baseSchemas.name.optional(),
    role: z.string().min(1, 'Role is required').optional(),
    description: baseSchemas.description.optional(),
    locationId: baseSchemas.id.optional(),
    personality: z.string().max(500, 'Personality description is too long').optional(),
    appearance: z.string().max(500, 'Appearance description is too long').optional(),
    backstory: z.string().max(1000, 'Backstory is too long').optional(),
    level: z.number().min(1, 'Level must be at least 1').max(20, 'Level cannot exceed 20').optional(),
    race: z.string().max(50, 'Race name is too long').optional(),
    class: z.string().max(50, 'Class name is too long').optional(),
    alignment: z.enum(['LG', 'LN', 'LE', 'NG', 'N', 'NE', 'CG', 'CN', 'CE']).optional(),
    stats: z.object({
      strength: z.number().min(1).max(30).optional(),
      dexterity: z.number().min(1).max(30).optional(),
      constitution: z.number().min(1).max(30).optional(),
      intelligence: z.number().min(1).max(30).optional(),
      wisdom: z.number().min(1).max(30).optional(),
      charisma: z.number().min(1).max(30).optional()
    }).optional(),
    isImportant: z.boolean().optional(),
    isAlive: z.boolean().optional(),
    portraitUrl: baseSchemas.url
  })
};

// Location validation schemas
export const locationSchemas = {
  create: z.object({
    name: baseSchemas.name,
    type: z.enum(['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other']),
    description: baseSchemas.description.optional(),
    coords: baseSchemas.coordinates,
    campaignId: baseSchemas.id,
    parentLocationId: baseSchemas.id.optional(),
    size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']).default('medium'),
    population: baseSchemas.nonNegativeNumber.optional(),
    government: z.string().max(100, 'Government description is too long').optional(),
    economy: z.string().max(200, 'Economy description is too long').optional(),
    culture: z.string().max(200, 'Culture description is too long').optional(),
    climate: z.string().max(100, 'Climate description is too long').optional(),
    isSecret: z.boolean().default(false),
    isDestroyed: z.boolean().default(false)
  }),
  
  update: z.object({
    name: baseSchemas.name.optional(),
    type: z.enum(['city', 'town', 'village', 'dungeon', 'wilderness', 'landmark', 'other']).optional(),
    description: baseSchemas.description.optional(),
    coords: baseSchemas.coordinates.optional(),
    parentLocationId: baseSchemas.id.optional(),
    size: z.enum(['tiny', 'small', 'medium', 'large', 'huge']).optional(),
    population: baseSchemas.nonNegativeNumber.optional(),
    government: z.string().max(100, 'Government description is too long').optional(),
    economy: z.string().max(200, 'Economy description is too long').optional(),
    culture: z.string().max(200, 'Culture description is too long').optional(),
    climate: z.string().max(100, 'Climate description is too long').optional(),
    isSecret: z.boolean().optional(),
    isDestroyed: z.boolean().optional()
  })
};

// Quest validation schemas
export const questSchemas = {
  create: z.object({
    title: baseSchemas.name,
    description: baseSchemas.description,
    campaignId: baseSchemas.id,
    startNpcId: baseSchemas.id,
    locationIds: z.array(baseSchemas.id).min(1, 'At least one location is required'),
    dependsOnQuestIds: z.array(baseSchemas.id).default([]),
    type: z.enum(['main', 'side', 'personal', 'faction']).default('side'),
    status: z.enum(['not_started', 'available', 'in_progress', 'completed', 'failed', 'abandoned']).default('not_started'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    estimatedDuration: z.string().max(50, 'Duration description is too long').optional(),
    rewards: z.object({
      experience: baseSchemas.nonNegativeNumber.optional(),
      gold: baseSchemas.nonNegativeNumber.optional(),
      items: z.array(z.string()).default([]),
      reputation: z.string().max(100, 'Reputation description is too long').optional()
    }).optional(),
    isSecret: z.boolean().default(false),
    isRepeatable: z.boolean().default(false)
  }),
  
  update: z.object({
    title: baseSchemas.name.optional(),
    description: baseSchemas.description.optional(),
    startNpcId: baseSchemas.id.optional(),
    locationIds: z.array(baseSchemas.id).min(1, 'At least one location is required').optional(),
    dependsOnQuestIds: z.array(baseSchemas.id).optional(),
    type: z.enum(['main', 'side', 'personal', 'faction']).optional(),
    status: z.enum(['not_started', 'available', 'in_progress', 'completed', 'failed', 'abandoned']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    estimatedDuration: z.string().max(50, 'Duration description is too long').optional(),
    rewards: z.object({
      experience: baseSchemas.nonNegativeNumber.optional(),
      gold: baseSchemas.nonNegativeNumber.optional(),
      items: z.array(z.string()).optional(),
      reputation: z.string().max(100, 'Reputation description is too long').optional()
    }).optional(),
    isSecret: z.boolean().optional(),
    isRepeatable: z.boolean().optional()
  })
};

// User validation schemas
export const userSchemas = {
  signUp: z.object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: z.string(),
    displayName: z.string().min(1, 'Display name is required').max(50, 'Display name is too long').optional()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  signIn: z.object({
    email: baseSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),
  
  updateProfile: z.object({
    displayName: z.string().min(1, 'Display name is required').max(50, 'Display name is too long').optional(),
    email: baseSchemas.email.optional(),
    phoneNumber: baseSchemas.phoneNumber,
    bio: z.string().max(500, 'Bio is too long').optional()
  })
};

// File upload validation schemas
export const fileSchemas = {
  image: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
    allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
  }).refine((data) => data.file.size <= data.maxSize, {
    message: 'File size too large'
  }).refine((data) => data.allowedTypes.includes(data.file.type), {
    message: 'Invalid file type'
  }),
  
  document: z.object({
    file: z.instanceof(File),
    maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
    allowedTypes: z.array(z.string()).default(['application/pdf', 'text/plain', 'application/json'])
  }).refine((data) => data.file.size <= data.maxSize, {
    message: 'File size too large'
  }).refine((data) => data.allowedTypes.includes(data.file.type), {
    message: 'Invalid file type'
  })
};

// Validation result interface
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Main validation function
export function validate<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = (error.issues || []).map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      return {
        success: false,
        errors
      };
    }

    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}

// Safe validation function that doesn't throw
export function validateSafe<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  const errors: ValidationError[] = (result.error.issues || []).map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code
  }));

  return {
    success: false,
    errors
  };
}

// Partial validation for form fields
export function validateField<T>(
  value: unknown,
  schema: z.ZodSchema<T>,
  fieldName: string
): ValidationError | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0];
      return {
        field: fieldName,
        message: firstError?.message || 'Validation failed',
        code: firstError?.code
      };
    }

    return {
      field: fieldName,
      message: 'Validation failed'
    };
  }
}

// Bulk validation for arrays
export function validateBulk<T>(
  items: unknown[],
  schema: z.ZodSchema<T>
): { valid: T[]; invalid: { index: number; errors: ValidationError[] }[] } {
  const valid: T[] = [];
  const invalid: { index: number; errors: ValidationError[] }[] = [];
  
  items.forEach((item, index) => {
    const result = validateSafe(item, schema);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        index,
        errors: result.errors || []
      });
    }
  });
  
  return { valid, invalid };
}

// Export all schemas for easy access
export const schemas = {
  base: baseSchemas,
  campaign: campaignSchemas,
  npc: npcSchemas,
  location: locationSchemas,
  quest: questSchemas,
  user: userSchemas,
  file: fileSchemas
};

export default schemas;
