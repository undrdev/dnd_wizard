import { Request, Response } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export async function processCommand(req: Request, res: Response) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { command, campaignId, userId } = req.body;

    if (!command || !campaignId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user owns the campaign
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists || campaignDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Parse command and determine action
    const parsedCommand = parseCommand(command);
    
    // Execute command based on type
    let result;
    switch (parsedCommand.type) {
      case 'CREATE_NPC':
        result = await createNPC(campaignId, parsedCommand.data);
        break;
      case 'CREATE_QUEST':
        result = await createQuest(campaignId, parsedCommand.data);
        break;
      case 'CREATE_LOCATION':
        result = await createLocation(campaignId, parsedCommand.data);
        break;
      default:
        return res.status(400).json({ error: 'Unknown command type' });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing command:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

interface ParsedCommand {
  type: 'CREATE_NPC' | 'CREATE_QUEST' | 'CREATE_LOCATION';
  data: any;
}

function parseCommand(command: string): ParsedCommand {
  // Simple command parsing - in a real implementation, this would be more sophisticated
  // For now, return a placeholder structure
  return {
    type: 'CREATE_NPC',
    data: {
      name: 'Parsed from command',
      role: 'Generated',
      personality: 'Friendly',
    },
  };
}

async function createNPC(campaignId: string, data: any) {
  const npcData = {
    campaignId,
    name: data.name,
    role: data.role,
    personality: data.personality,
    locationId: data.locationId || '',
    stats: data.stats || {},
    quests: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('npcs').add(npcData);
  return { id: docRef.id, ...npcData };
}

async function createQuest(campaignId: string, data: any) {
  const questData = {
    campaignId,
    title: data.title,
    description: data.description,
    importance: data.importance || 'medium',
    status: 'active',
    startNpcId: data.startNpcId || '',
    involvedNpcIds: data.involvedNpcIds || [],
    locationIds: data.locationIds || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('quests').add(questData);
  return { id: docRef.id, ...questData };
}

async function createLocation(campaignId: string, data: any) {
  const locationData = {
    campaignId,
    name: data.name,
    type: data.type || 'landmark',
    coords: data.coords || { lat: 0, lng: 0 },
    description: data.description,
    npcs: [],
    quests: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('locations').add(locationData);
  return { id: docRef.id, ...locationData };
}
