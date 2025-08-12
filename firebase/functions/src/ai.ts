import { Request, Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { parseOpenAIError, parseAnthropicError, parseNetworkError, type AIError } from '../../../lib/aiErrorHandling';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// Simple placeholder functions for AI parsing
function parseCommand(command: string, context?: unknown) {
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
  console.log('🔍 Firebase Function: generateContent called');
  console.log('🔍 Firebase Function: Method:', req.method);
  console.log('🔍 Firebase Function: Headers:', req.headers);
  
  try {
    if (req.method !== 'POST') {
      console.log('❌ Firebase Function: Method not allowed');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      prompt, 
      campaignId, 
      userId, 
      provider = 'openai',
      apiKey,
      model,
      systemMessage,
      temperature = 0.7,
      maxTokens = 2000
    } = req.body;
    
    console.log('🔍 Firebase Function: Request body:', {
      prompt: prompt ? prompt.substring(0, 100) + '...' : 'undefined',
      campaignId,
      userId,
      provider,
      model,
      hasApiKey: !!apiKey,
      temperature,
      maxTokens
    });

    if (!prompt) {
      console.log('❌ Firebase Function: Missing prompt');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If campaignId and userId are provided, verify ownership and get context
    let context = null;
    if (campaignId && userId) {
      console.log('🔍 Firebase Function: Verifying campaign ownership');
      const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
      if (!campaignDoc.exists || campaignDoc.data()?.ownerId !== userId) {
        console.log('❌ Firebase Function: Unauthorized campaign access');
        return res.status(403).json({ error: 'Unauthorized' });
      }
      console.log('✅ Firebase Function: Campaign ownership verified');
      context = await getCampaignContext(campaignId);
    }

    // Parse the command for better understanding
    const parsedCommand = parseCommand(prompt, context);
    console.log('🔍 Firebase Function: Parsed command:', parsedCommand);

    // Generate content based on provider with API key from request
    console.log('🔍 Firebase Function: Generating content with provider:', provider);
    let result;
    switch (provider) {
      case 'openai':
        console.log('🔍 Firebase Function: Using OpenAI');
        result = await generateWithOpenAIDirect(prompt, apiKey, model, systemMessage, temperature, maxTokens);
        break;
      case 'anthropic':
        console.log('🔍 Firebase Function: Using Anthropic');
        result = await generateWithAnthropicDirect(prompt, apiKey, model, systemMessage, temperature, maxTokens);
        break;
      default:
        console.log('❌ Firebase Function: Unsupported provider:', provider);
        return res.status(400).json({ error: 'Unsupported AI provider' });
    }

    console.log('🔍 Firebase Function: AI result received:', result ? result.substring(0, 100) + '...' : 'undefined');
    
    // Parse and validate the AI response
    const parsedResult = parseAIResponse(result);
    console.log('🔍 Firebase Function: Parsed result:', parsedResult);

    // Update AI context memory if campaign context is available
    if (campaignId) {
      console.log('🔍 Firebase Function: Updating AI context');
      await updateAIContext(campaignId, prompt, parsedResult);
    }

    console.log('✅ Firebase Function: Successfully returning response');
    return res.status(200).json({
      success: true,
      data: parsedResult,
      command: parsedCommand,
    });
  } catch (error) {
    console.error('❌ Firebase Function: Error generating content:', error);
    console.error('❌ Firebase Function: Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Try to parse AI error
    let aiError: AIError | null = null;
    
    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        aiError = JSON.parse(error.message);
      } catch {
        // Not a JSON error, continue
      }
    }
    
    if (aiError && aiError.type) {
      return res.status(200).json({
        success: false,
        error: aiError,
        message: aiError.userMessage
      });
    }
    
    // Fallback to generic error
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.'
    });
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



async function generateWithOpenAIDirect(
  prompt: string, 
  apiKey: string, 
  model: string, 
  systemMessage: string, 
  temperature: number, 
  maxTokens: number
) {
  console.log('🔍 Firebase Function: generateWithOpenAIDirect called');
  console.log('🔍 Firebase Function: Model:', model);
  console.log('🔍 Firebase Function: Has API key:', !!apiKey);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      }),
    });

    console.log('🔍 Firebase Function: OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firebase Function: OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      const aiError = parseOpenAIError({
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        provider: 'openai'
      });
      
      throw new Error(JSON.stringify(aiError));
    }

    const data = await response.json();
    console.log('🔍 Firebase Function: OpenAI API response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Firebase Function: Invalid OpenAI response structure');
      throw new Error('Invalid response from OpenAI API');
    }

    console.log('✅ Firebase Function: Successfully got OpenAI response');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    
    // If it's already a parsed AI error, re-throw it
    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        const aiError = JSON.parse(error.message);
        if (aiError.type) {
          throw error; // Re-throw the parsed error
        }
      } catch {
        // Not a JSON error, continue to network error parsing
      }
    }
    
    // Parse network errors
    const aiError = parseNetworkError(error instanceof Error ? error : new Error(String(error)));
    throw new Error(JSON.stringify(aiError));
  }
}



async function generateWithAnthropicDirect(
  prompt: string, 
  apiKey: string, 
  model: string, 
  systemMessage: string, 
  temperature: number, 
  maxTokens: number
) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        system: systemMessage,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      const aiError = parseAnthropicError({
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        provider: 'anthropic'
      });
      
      throw new Error(JSON.stringify(aiError));
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response from Anthropic API');
    }

    return data.content[0].text;
  } catch (error) {
    console.error('Anthropic generation error:', error);
    
    // If it's already a parsed AI error, re-throw it
    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        const aiError = JSON.parse(error.message);
        if (aiError.type) {
          throw error; // Re-throw the parsed error
        }
      } catch {
        // Not a JSON error, continue to network error parsing
      }
    }
    
    // Parse network errors
    const aiError = parseNetworkError(error instanceof Error ? error : new Error(String(error)));
    throw new Error(JSON.stringify(aiError));
  }
}





async function updateAIContext(campaignId: string, userMessage: string, aiResponse: unknown) {
  const contextRef = db.collection('aiContext').doc(campaignId);
  const contextDoc = await contextRef.get();

  const newMessage = {
    role: 'user',
    content: userMessage,
    timestamp: FieldValue.serverTimestamp(),
  };

  const newResponse = {
    role: 'assistant',
    content: JSON.stringify(aiResponse),
    timestamp: FieldValue.serverTimestamp(),
  };

  if (contextDoc.exists) {
    await contextRef.update({
      tokens: FieldValue.arrayUnion(userMessage),
      conversationHistory: FieldValue.arrayUnion(newMessage, newResponse),
      lastUpdated: FieldValue.serverTimestamp(),
    });
  } else {
    await contextRef.set({
      campaignId,
      tokens: [userMessage],
      conversationHistory: [newMessage, newResponse],
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }
}
