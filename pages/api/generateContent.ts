import type { NextApiRequest, NextApiResponse } from 'next';

interface GenerateContentRequest {
  prompt: string;
  model?: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string; // Allow API key to be passed from frontend
}

interface GenerateContentResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateContentResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { 
      prompt, 
      model = 'gpt-4-turbo', 
      systemMessage = 'You are a helpful assistant.',
      temperature = 0.8,
      maxTokens = 4000,
      apiKey: requestApiKey
    }: GenerateContentRequest = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required' 
      });
    }

    // Get API key from request body or environment variables
    const apiKey = requestApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not provided in request or environment');
      return res.status(500).json({ 
        success: false, 
        error: 'OpenAI API key not configured. Please add your API key in the AI settings.' 
      });
    }

    console.log('Making OpenAI API request with model:', model);

    // Make request to OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API Error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        body: errorText
      });
      
      return res.status(openaiResponse.status).json({ 
        success: false, 
        error: `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText} - ${errorText}` 
      });
    }

    const data = await openaiResponse.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'Invalid response from OpenAI API' 
      });
    }

    const content = data.choices[0].message.content;
    
    if (!content) {
      console.error('Empty content from OpenAI:', data);
      return res.status(500).json({ 
        success: false, 
        error: 'Empty response from OpenAI API' 
      });
    }

    console.log('OpenAI API request successful, content length:', content.length);

    return res.status(200).json({ 
      success: true, 
      content: content 
    });

  } catch (error) {
    console.error('API route error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}
