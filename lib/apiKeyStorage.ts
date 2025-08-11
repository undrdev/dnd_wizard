import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface EncryptedAPIKeys {
  openai?: {
    apiKey: string;
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
}

class APIKeyStorageService {
  private readonly collectionName = 'userApiKeys';
  private readonly encryptionKey = 'dnd-wizard-encryption-key'; // In production, use a proper encryption key

  /**
   * Simple encryption (for demo purposes - in production use proper encryption)
   */
  private encrypt(text: string): string {
    if (typeof window === 'undefined') return text;
    
    try {
      // Simple base64 encoding with a salt (not secure for production)
      const salt = this.encryptionKey;
      const saltedText = salt + text + salt;
      return btoa(saltedText);
    } catch (error) {
      console.warn('Encryption failed, storing as plain text:', error);
      return text;
    }
  }

  /**
   * Simple decryption (for demo purposes - in production use proper decryption)
   */
  private decrypt(encryptedText: string): string {
    if (typeof window === 'undefined') return encryptedText;
    
    try {
      // Simple base64 decoding with salt removal
      const decoded = atob(encryptedText);
      const salt = this.encryptionKey;
      if (decoded.startsWith(salt) && decoded.endsWith(salt)) {
        return decoded.slice(salt.length, -salt.length);
      }
      return decoded;
    } catch (error) {
      console.warn('Decryption failed, returning as is:', error);
      return encryptedText;
    }
  }

  /**
   * Get the current user ID
   */
  private getCurrentUserId(): string | null {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  }

  /**
   * Save API keys to Firebase
   */
  async saveAPIKeys(apiKeys: EncryptedAPIKeys): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user found');
        return false;
      }

      // Encrypt the API keys
      const encryptedKeys: EncryptedAPIKeys = {};
      
      if (apiKeys.openai) {
        encryptedKeys.openai = {
          apiKey: this.encrypt(apiKeys.openai.apiKey),
          model: apiKeys.openai.model
        };
      }
      
      if (apiKeys.anthropic) {
        encryptedKeys.anthropic = {
          apiKey: this.encrypt(apiKeys.anthropic.apiKey),
          model: apiKeys.anthropic.model
        };
      }

      // Save to Firebase
      const docRef = doc(db, this.collectionName, userId);
      await setDoc(docRef, {
        ...encryptedKeys,
        updatedAt: new Date(),
        userId
      });

      console.log('API keys saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return false;
    }
  }

  /**
   * Load API keys from Firebase
   */
  async loadAPIKeys(): Promise<EncryptedAPIKeys | null> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user found');
        return null;
      }

      // Get from Firebase
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('No saved API keys found');
        return null;
      }

      const data = docSnap.data() as EncryptedAPIKeys;
      
      // Decrypt the API keys
      const decryptedKeys: EncryptedAPIKeys = {};
      
      if (data.openai) {
        decryptedKeys.openai = {
          apiKey: this.decrypt(data.openai.apiKey),
          model: data.openai.model
        };
      }
      
      if (data.anthropic) {
        decryptedKeys.anthropic = {
          apiKey: this.decrypt(data.anthropic.apiKey),
          model: data.anthropic.model
        };
      }

      console.log('API keys loaded successfully');
      return decryptedKeys;
    } catch (error) {
      console.error('Error loading API keys:', error);
      return null;
    }
  }

  /**
   * Delete API keys from Firebase
   */
  async deleteAPIKeys(): Promise<boolean> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.warn('No authenticated user found');
        return false;
      }

      const docRef = doc(db, this.collectionName, userId);
      await deleteDoc(docRef);

      console.log('API keys deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting API keys:', error);
      return false;
    }
  }

  /**
   * Check if API keys exist for current user
   */
  async hasAPIKeys(): Promise<boolean> {
    try {
      const keys = await this.loadAPIKeys();
      return !!(keys?.openai || keys?.anthropic);
    } catch (error) {
      console.error('Error checking API keys:', error);
      return false;
    }
  }
}

export const apiKeyStorage = new APIKeyStorageService();
