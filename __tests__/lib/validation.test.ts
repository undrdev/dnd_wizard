/**
 * Tests for Validation System
 */

import { z } from 'zod';
import { 
  validate, 
  validateSafe, 
  validateField, 
  validateBulk,
  schemas 
} from '../../lib/validation';

describe('Validation System', () => {
  describe('validate function', () => {
    const testSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be positive')
    });

    it('should validate correct data successfully', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const result = validate(validData, testSchema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: -5
      };

      const result = validate(invalidData, testSchema);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBe(3);
      
      const errorFields = result.errors!.map(e => e.field);
      expect(errorFields).toContain('name');
      expect(errorFields).toContain('email');
      expect(errorFields).toContain('age');
    });

    it('should handle partial validation', () => {
      const partialData = {
        name: 'John Doe'
        // Missing email and age
      };

      const result = validate(partialData, testSchema);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBe(2); // Missing email and age
    });
  });

  describe('validateSafe function', () => {
    const testSchema = z.string().email();

    it('should not throw on invalid data', () => {
      const invalidEmail = 'not-an-email';

      expect(() => {
        const result = validateSafe(invalidEmail, testSchema);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      }).not.toThrow();
    });

    it('should return success for valid data', () => {
      const validEmail = 'test@example.com';

      const result = validateSafe(validEmail, testSchema);

      expect(result.success).toBe(true);
      expect(result.data).toBe(validEmail);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('validateField function', () => {
    const emailSchema = z.string().email('Invalid email format');

    it('should return null for valid field', () => {
      const result = validateField('test@example.com', emailSchema, 'email');
      expect(result).toBeNull();
    });

    it('should return error for invalid field', () => {
      const result = validateField('invalid-email', emailSchema, 'email');
      
      expect(result).not.toBeNull();
      expect(result!.field).toBe('email');
      expect(result!.message).toBe('Invalid email format');
    });
  });

  describe('validateBulk function', () => {
    const itemSchema = z.object({
      id: z.string().uuid(),
      name: z.string().min(1)
    });

    it('should separate valid and invalid items', () => {
      const items = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Valid Item' },
        { id: 'invalid-uuid', name: 'Invalid Item' },
        { id: '123e4567-e89b-12d3-a456-426614174001', name: '' }, // Invalid name
        { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Another Valid Item' }
      ];

      const result = validateBulk(items, itemSchema);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      
      expect(result.invalid[0].index).toBe(1);
      expect(result.invalid[1].index).toBe(2);
    });
  });

  describe('Campaign schemas', () => {
    it('should validate campaign creation data', () => {
      const validCampaign = {
        name: 'Test Campaign',
        description: 'A test campaign',
        setting: 'Fantasy',
        playerCount: 4,
        isPublic: false
      };

      const result = validate(validCampaign, schemas.campaign.create);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validCampaign);
    });

    it('should reject invalid campaign data', () => {
      const invalidCampaign = {
        name: '', // Empty name
        setting: 'Fantasy',
        playerCount: 0, // Invalid player count
        isPublic: false
      };

      const result = validate(invalidCampaign, schemas.campaign.create);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'name')).toBe(true);
      expect(result.errors!.some(e => e.field === 'playerCount')).toBe(true);
    });
  });

  describe('NPC schemas', () => {
    it('should validate NPC creation data', () => {
      const validNPC = {
        name: 'Test NPC',
        role: 'Merchant',
        description: 'A friendly merchant',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
        campaignId: '123e4567-e89b-12d3-a456-426614174001',
        level: 5,
        race: 'Human',
        class: 'Fighter',
        alignment: 'LG' as const,
        isImportant: true,
        isAlive: true
      };

      const result = validate(validNPC, schemas.npc.create);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validNPC);
    });

    it('should reject NPC with invalid stats', () => {
      const invalidNPC = {
        name: 'Test NPC',
        role: 'Merchant',
        locationId: '123e4567-e89b-12d3-a456-426614174000',
        campaignId: '123e4567-e89b-12d3-a456-426614174001',
        stats: {
          strength: 50, // Invalid - too high
          dexterity: -5 // Invalid - too low
        }
      };

      const result = validate(invalidNPC, schemas.npc.create);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Location schemas', () => {
    it('should validate location creation data', () => {
      const validLocation = {
        name: 'Test City',
        type: 'city' as const,
        description: 'A bustling city',
        coords: { lat: 40.7128, lng: -74.0060 },
        campaignId: '123e4567-e89b-12d3-a456-426614174000',
        size: 'large' as const,
        population: 100000,
        isSecret: false,
        isDestroyed: false
      };

      const result = validate(validLocation, schemas.location.create);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validLocation);
    });

    it('should reject location with invalid coordinates', () => {
      const invalidLocation = {
        name: 'Test Location',
        type: 'city' as const,
        coords: { lat: 100, lng: -200 }, // Invalid coordinates
        campaignId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = validate(invalidLocation, schemas.location.create);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field.includes('coords'))).toBe(true);
    });
  });

  describe('Quest schemas', () => {
    it('should validate quest creation data', () => {
      const validQuest = {
        title: 'Test Quest',
        description: 'A test quest description',
        campaignId: '123e4567-e89b-12d3-a456-426614174000',
        startNpcId: '123e4567-e89b-12d3-a456-426614174001',
        locationIds: ['123e4567-e89b-12d3-a456-426614174002'],
        type: 'main' as const,
        status: 'not_started' as const,
        priority: 'high' as const,
        isSecret: false,
        isRepeatable: false
      };

      const result = validate(validQuest, schemas.quest.create);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...validQuest,
        dependsOnQuestIds: [] // Default value added by schema
      });
    });

    it('should reject quest without required fields', () => {
      const invalidQuest = {
        title: '', // Empty title
        description: 'A test quest',
        campaignId: '123e4567-e89b-12d3-a456-426614174000',
        startNpcId: '123e4567-e89b-12d3-a456-426614174001',
        locationIds: [] // Empty locations array
      };

      const result = validate(invalidQuest, schemas.quest.create);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'title')).toBe(true);
      expect(result.errors!.some(e => e.field === 'locationIds')).toBe(true);
    });
  });

  describe('User schemas', () => {
    it('should validate user sign up data', () => {
      const validSignUp = {
        email: 'test@example.com',
        password: 'securepassword123',
        confirmPassword: 'securepassword123',
        displayName: 'Test User'
      };

      const result = validate(validSignUp, schemas.user.signUp);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validSignUp);
    });

    it('should reject sign up with mismatched passwords', () => {
      const invalidSignUp = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
        displayName: 'Test User'
      };

      const result = validate(invalidSignUp, schemas.user.signUp);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'confirmPassword')).toBe(true);
    });

    it('should reject weak passwords', () => {
      const weakPasswordSignUp = {
        email: 'test@example.com',
        password: '123', // Too short
        confirmPassword: '123',
        displayName: 'Test User'
      };

      const result = validate(weakPasswordSignUp, schemas.user.signUp);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.field === 'password')).toBe(true);
    });
  });

  describe('File schemas', () => {
    it('should validate image file upload', () => {
      // Mock File object
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      const validImageUpload = {
        file: mockFile,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png']
      };

      const result = validate(validImageUpload, schemas.file.image);

      expect(result.success).toBe(true);
    });
  });
});
