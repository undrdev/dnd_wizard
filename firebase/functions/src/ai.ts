import { Request, Response } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export async function generateContent(req: Request, res: Response) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, campaignId, userId, provider = 'openai' } = req.body;

    if (!prompt || !campaignId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user owns the campaign
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    if (!campaignDoc.exists || campaignDoc.data()?.ownerId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get campaign context
    const context = await getCampaignContext(campaignId);
    
    // Generate content based on provider
    let result;
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(prompt, context);
        break;
      case 'anthropic':
        result = await generateWithAnthropic(prompt, context);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported AI provider' });
    }

    // Update AI context memory
    await updateAIContext(campaignId, prompt, result);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getCampaignContext(campaignId: string) {
  const [campaign, locations, npcs, quests, aiContext] = await Promise.all([
    db.collection('campaigns').doc(campaignId).get(),
    db.collection('locations').where('campaignId', '==', campaignId).get(),
    db.collection('npcs').where('campaignId', '==', campaignId).get(),
    db.collection('quests').where('campaignId', '==', campaignId).get(),
    db.collection('aiContext').doc(campaignId).get(),
  ]);

  return {
    campaign: campaign.data(),
    locations: locations.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    npcs: npcs.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    quests: quests.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    aiContext: aiContext.exists ? aiContext.data() : null,
  };
}

async function generateWithOpenAI(prompt: string, context: any) {
  // Placeholder for OpenAI integration
  // In a real implementation, this would use the OpenAI SDK
  return {
    message: `AI response to: ${prompt}`,
    npcs: [],
    quests: [],
    locations: [],
  };
}

async function generateWithAnthropic(prompt: string, context: any) {
  // Placeholder for Anthropic integration
  // In a real implementation, this would use the Anthropic SDK
  return {
    message: `AI response to: ${prompt}`,
    npcs: [],
    quests: [],
    locations: [],
  };
}

async function updateAIContext(campaignId: string, userMessage: string, aiResponse: any) {
  const contextRef = db.collection('aiContext').doc(campaignId);
  const contextDoc = await contextRef.get();

  const newMessage = {
    role: 'user',
    content: userMessage,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  const newResponse = {
    role: 'assistant',
    content: JSON.stringify(aiResponse),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (contextDoc.exists) {
    await contextRef.update({
      tokens: admin.firestore.FieldValue.arrayUnion(userMessage),
      conversationHistory: admin.firestore.FieldValue.arrayUnion(newMessage, newResponse),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await contextRef.set({
      campaignId,
      tokens: [userMessage],
      conversationHistory: [newMessage, newResponse],
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
