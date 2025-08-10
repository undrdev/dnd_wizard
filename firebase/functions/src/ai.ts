import { Request, Response } from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Simple placeholder functions for AI parsing
function parseCommand(command: string, context?: any) {
  return {
    type: 'CREATE_NPC',
    parameters: { name: 'Generated NPC', role: 'Villager' },
    confidence: 0.8,
    originalText: command,
    context: context
  };
}

function parseAIResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch {
    return {
      message: response,
      npcs: [],
      quests: [],
      locations: []
    };
  }
}

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

    // Parse the command for better understanding
    const parsedCommand = parseCommand(prompt, context);

    // Generate content based on provider with enhanced context
    let result;
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAIEnhanced(prompt, context, parsedCommand);
        break;
      case 'anthropic':
        result = await generateWithAnthropicEnhanced(prompt, context, parsedCommand);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported AI provider' });
    }

    // Parse and validate the AI response
    const parsedResult = parseAIResponse(result);

    // Update AI context memory with both user prompt and AI response
    await updateAIContext(campaignId, prompt, parsedResult);

    return res.status(200).json({
      success: true,
      data: parsedResult,
      command: parsedCommand, // Include parsed command for debugging
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

async function generateWithOpenAIEnhanced(prompt: string, context: any, command: any): Promise<any> {
  // This would use the same enhanced system prompt logic as the client-side AI service
  // For now, delegate to the existing function but with enhanced prompting
  const enhancedPrompt = buildEnhancedPrompt(prompt, context, command);
  const result = await generateWithOpenAI(enhancedPrompt, context);

  // Return structured object instead of string
  return {
    message: result,
    npcs: [],
    quests: [],
    locations: []
  };
}

async function generateWithAnthropicEnhanced(prompt: string, context: any, command: any): Promise<any> {
  // This would use the same enhanced system prompt logic as the client-side AI service
  // For now, delegate to the existing function but with enhanced prompting
  const enhancedPrompt = buildEnhancedPrompt(prompt, context, command);
  const result = await generateWithAnthropic(enhancedPrompt, context);

  // Return structured object instead of string
  return {
    message: result,
    npcs: [],
    quests: [],
    locations: []
  };
}

function buildEnhancedPrompt(prompt: string, context: any, command: any): string {
  let enhancedPrompt = `COMMAND TYPE: ${command.type}
CONFIDENCE: ${(command.confidence * 100).toFixed(0)}%
PARAMETERS: ${JSON.stringify(command.parameters)}

ORIGINAL REQUEST: ${prompt}

CONTEXT SUMMARY:
- Campaign: ${context.campaign?.title || 'Unknown'}
- Locations: ${context.locations?.length || 0}
- NPCs: ${context.npcs?.length || 0}
- Quests: ${context.quests?.length || 0}

Please respond with structured JSON containing the requested content that fits seamlessly with the existing campaign elements.`;

  return enhancedPrompt;
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
