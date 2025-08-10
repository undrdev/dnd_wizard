import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Campaign,
  Location,
  NPC,
  Quest,
  AIContextMemory,
  CreateCampaignData,
  CreateLocationData,
  CreateNPCData,
  CreateQuestData,
} from '@/types';

// Collection names
export const COLLECTIONS = {
  CAMPAIGNS: 'campaigns',
  LOCATIONS: 'locations',
  NPCS: 'npcs',
  QUESTS: 'quests',
  AI_CONTEXT: 'aiContext',
} as const;

// Generic Firestore operations
export class FirestoreService {
  // Generic get document
  static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  // Generic get collection with optional constraints
  static async getCollection<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Generic add document
  static async addDocument<T extends DocumentData>(
    collectionName: string,
    data: T
  ): Promise<string> {
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  // Generic update document
  static async updateDocument(
    collectionName: string,
    docId: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  // Generic delete document
  static async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Campaign operations
export class CampaignService extends FirestoreService {
  static async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.getDocument<Campaign>(COLLECTIONS.CAMPAIGNS, campaignId);
  }

  static async getUserCampaigns(userId: string): Promise<Campaign[]> {
    return this.getCollection<Campaign>(COLLECTIONS.CAMPAIGNS, [
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc'),
    ]);
  }

  static async createCampaign(data: CreateCampaignData): Promise<string> {
    return this.addDocument(COLLECTIONS.CAMPAIGNS, data);
  }

  static async updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<void> {
    return this.updateDocument(COLLECTIONS.CAMPAIGNS, campaignId, data);
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    return this.deleteDocument(COLLECTIONS.CAMPAIGNS, campaignId);
  }
}

// Location operations
export class LocationService extends FirestoreService {
  static async getLocation(locationId: string): Promise<Location | null> {
    return this.getDocument<Location>(COLLECTIONS.LOCATIONS, locationId);
  }

  static async getCampaignLocations(campaignId: string): Promise<Location[]> {
    return this.getCollection<Location>(COLLECTIONS.LOCATIONS, [
      where('campaignId', '==', campaignId),
    ]);
  }

  static async createLocation(data: CreateLocationData): Promise<string> {
    return this.addDocument(COLLECTIONS.LOCATIONS, data);
  }

  static async updateLocation(locationId: string, data: Partial<Location>): Promise<void> {
    return this.updateDocument(COLLECTIONS.LOCATIONS, locationId, data);
  }

  static async deleteLocation(locationId: string): Promise<void> {
    return this.deleteDocument(COLLECTIONS.LOCATIONS, locationId);
  }
}

// NPC operations
export class NPCService extends FirestoreService {
  static async getNPC(npcId: string): Promise<NPC | null> {
    return this.getDocument<NPC>(COLLECTIONS.NPCS, npcId);
  }

  static async getCampaignNPCs(campaignId: string): Promise<NPC[]> {
    return this.getCollection<NPC>(COLLECTIONS.NPCS, [
      where('campaignId', '==', campaignId),
    ]);
  }

  static async createNPC(data: CreateNPCData): Promise<string> {
    return this.addDocument(COLLECTIONS.NPCS, data);
  }

  static async updateNPC(npcId: string, data: Partial<NPC>): Promise<void> {
    return this.updateDocument(COLLECTIONS.NPCS, npcId, data);
  }

  static async deleteNPC(npcId: string): Promise<void> {
    return this.deleteDocument(COLLECTIONS.NPCS, npcId);
  }
}

// Quest operations
export class QuestService extends FirestoreService {
  static async getQuest(questId: string): Promise<Quest | null> {
    return this.getDocument<Quest>(COLLECTIONS.QUESTS, questId);
  }

  static async getCampaignQuests(campaignId: string): Promise<Quest[]> {
    return this.getCollection<Quest>(COLLECTIONS.QUESTS, [
      where('campaignId', '==', campaignId),
    ]);
  }

  static async createQuest(data: CreateQuestData): Promise<string> {
    return this.addDocument(COLLECTIONS.QUESTS, data);
  }

  static async updateQuest(questId: string, data: Partial<Quest>): Promise<void> {
    return this.updateDocument(COLLECTIONS.QUESTS, questId, data);
  }

  static async deleteQuest(questId: string): Promise<void> {
    return this.deleteDocument(COLLECTIONS.QUESTS, questId);
  }
}

// AI Context operations
export class AIContextService extends FirestoreService {
  static async getAIContext(campaignId: string): Promise<AIContextMemory | null> {
    return this.getDocument<AIContextMemory>(COLLECTIONS.AI_CONTEXT, campaignId);
  }

  static async updateAIContext(campaignId: string, data: Partial<AIContextMemory>): Promise<void> {
    return this.updateDocument(COLLECTIONS.AI_CONTEXT, campaignId, data);
  }

  static async createAIContext(data: AIContextMemory): Promise<string> {
    return this.addDocument(COLLECTIONS.AI_CONTEXT, data);
  }
}
