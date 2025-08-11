import { Request, Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export async function getCampaignData(req: Request, res: Response) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { campaignId, userId } = req.query;

    if (!campaignId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify user owns the campaign
    const campaignDoc = await db.collection('campaigns').doc(campaignId as string).get();
    if (!campaignDoc.exists || campaignDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get all campaign data
    const [locations, npcs, quests] = await Promise.all([
      db.collection('locations').where('campaignId', '==', campaignId).get(),
      db.collection('npcs').where('campaignId', '==', campaignId).get(),
      db.collection('quests').where('campaignId', '==', campaignId).get(),
    ]);

    const campaignData = {
      campaign: { id: campaignDoc.id, ...campaignDoc.data() },
      locations: locations.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      npcs: npcs.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      quests: quests.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    };

    return res.status(200).json({
      success: true,
      data: campaignData,
    });
  } catch (error) {
    console.error('Error getting campaign data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function saveMapState(req: Request, res: Response) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { campaignId, userId, mapState } = req.body;

    if (!campaignId || !userId || !mapState) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user owns the campaign
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists || campaignDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update campaign with map state
    await db.collection('campaigns').doc(campaignId).update({
      mapState,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: 'Map state saved successfully',
    });
  } catch (error) {
    console.error('Error saving map state:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
