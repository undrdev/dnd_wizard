import type { Campaign, Location, NPC, Quest } from '@/types';

// Enhanced AI command processing interfaces
export interface AICommand {
  type: 'CREATE_NPC' | 'CREATE_QUEST' | 'CREATE_LOCATION' | 'MODIFY' | 'SUGGEST' | 'UNKNOWN';
  target?: string; // ID of target entity
  parameters: Record<string, any>;
  confidence: number; // 0-1 confidence score
  originalText: string;
}

export interface CampaignContext {
  campaign: Campaign;
  locations: Location[];
  npcs: NPC[];
  quests: Quest[];
}

export interface ParsedContent {
  npcs?: Partial<NPC>[];
  quests?: Partial<Quest>[];
  locations?: Partial<Location>[];
  suggestions?: string[];
  followUpQuestions?: string[];
}

// Command patterns for natural language parsing
const COMMAND_PATTERNS = {
  CREATE_NPC: [
    /create\s+(?:an?\s+)?npc/i,
    /(?:make|generate|add)\s+(?:an?\s+)?(?:new\s+)?(?:character|npc)/i,
    /(?:i\s+)?(?:want|need)\s+(?:an?\s+)?(?:new\s+)?(?:character|npc)/i,
    /(?:character|npc)\s+(?:named|called)/i,
  ],
  CREATE_QUEST: [
    /create\s+(?:a\s+)?.*?quest/i,
    /(?:make|generate|add)\s+(?:a\s+)?(?:new\s+)?.*?quest/i,
    /(?:i\s+)?(?:want|need)\s+(?:a\s+)?(?:new\s+)?.*?quest/i,
    /quest\s+(?:about|involving|for|called|named)/i,
  ],
  CREATE_LOCATION: [
    /create\s+(?:a\s+)?location/i,
    /(?:make|generate|add)\s+(?:a\s+)?(?:new\s+)?(?:location|place)/i,
    /(?:i\s+)?(?:want|need)\s+(?:a\s+)?(?:new\s+)?(?:location|place)/i,
    /(?:location|place)\s+(?:called|named)/i,
  ],
  MODIFY: [
    /(?:update|modify|change|edit)\s+/i,
    /(?:make\s+)?(?:changes?\s+to|modifications?\s+to)/i,
  ],
  SUGGEST: [
    /suggest/i,
    /(?:give\s+me\s+)?(?:ideas?|suggestions?)/i,
    /what\s+(?:about|if)/i,
    /(?:help\s+me\s+)?(?:think\s+of|come\s+up\s+with)/i,
  ],
};

// Entity extraction patterns
const ENTITY_PATTERNS = {
  name: /(?:named|called)\s+["']?([^"'\n,]+?)["']?(?:\s+(?:who|that|in|at|with)|$)/i,
  role: /(?:role|job|profession|class|is\s+a)\s+["']?([^"'\n,]+?)["']?(?:\s+(?:who|that|in|at|with)|$)/i,
  location: /(?:in|at|from)\s+(?:the\s+)?["']?([^"'\n,]+?)["']?(?:\s+(?:who|that|with)|$)/i,
  personality: /(?:personality|character|nature)(?:\s+is|\s+of)?\s+["']?([^"'\n,]+?)["']?(?:\s+(?:who|that|in|at|with)|$)/i,
  importance: /(?:importance|priority)(?:\s+is|\s+of)?\s+(low|medium|high)/i,
  type: /(?:type|kind)(?:\s+is|\s+of)?\s+(city|village|landmark|dungeon)/i,
  title: /(?:quest|mission|task)(?:\s+(?:called|named|about|titled))?\s+["']?([^"'\n,]+?)["']?(?:\s+(?:that|with|involving)|$)/i,
};

/**
 * Parse natural language command into structured AI command
 */
export function parseCommand(text: string, context?: CampaignContext): AICommand {
  const normalizedText = text.trim().toLowerCase();
  
  // Determine command type
  const commandType = determineCommandType(normalizedText);
  
  // Extract parameters based on command type
  const parameters = extractParameters(text, commandType, context);
  
  // Calculate confidence score
  const confidence = calculateConfidence(normalizedText, commandType, parameters);
  
  return {
    type: commandType,
    parameters,
    confidence,
    originalText: text,
  };
}

/**
 * Determine the type of command from natural language
 */
function determineCommandType(text: string): AICommand['type'] {
  for (const [type, patterns] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type as AICommand['type'];
      }
    }
  }
  return 'UNKNOWN';
}

/**
 * Extract parameters from command text
 */
function extractParameters(
  text: string, 
  commandType: AICommand['type'], 
  context?: CampaignContext
): Record<string, any> {
  const parameters: Record<string, any> = {};
  
  // Extract common entities
  for (const [key, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const match = text.match(pattern);
    if (match) {
      parameters[key] = match[1].trim();
    }
  }
  
  // Command-specific parameter extraction
  switch (commandType) {
    case 'CREATE_NPC':
      return extractNPCParameters(text, parameters, context);
    case 'CREATE_QUEST':
      return extractQuestParameters(text, parameters, context);
    case 'CREATE_LOCATION':
      return extractLocationParameters(text, parameters, context);
    case 'MODIFY':
      return extractModifyParameters(text, parameters, context);
    case 'SUGGEST':
      return extractSuggestParameters(text, parameters, context);
    default:
      return parameters;
  }
}

/**
 * Extract NPC-specific parameters
 */
function extractNPCParameters(
  text: string, 
  baseParams: Record<string, any>, 
  context?: CampaignContext
): Record<string, any> {
  const params = { ...baseParams };
  
  // Try to match with existing locations
  if (params.location && context?.locations) {
    const matchedLocation = context.locations.find(loc => 
      loc.name.toLowerCase().includes(params.location.toLowerCase()) ||
      params.location.toLowerCase().includes(loc.name.toLowerCase())
    );
    if (matchedLocation) {
      params.locationId = matchedLocation.id;
    }
  }
  
  // Extract stats if mentioned
  const statsMatch = text.match(/(?:stats?|abilities?).*?(\d+)/i);
  if (statsMatch) {
    params.stats = { level: parseInt(statsMatch[1]) };
  }
  
  return params;
}

/**
 * Extract Quest-specific parameters
 */
function extractQuestParameters(
  text: string,
  baseParams: Record<string, any>,
  context?: CampaignContext
): Record<string, any> {
  const params = { ...baseParams };

  // Extract quest title - try multiple patterns
  if (!params.title) {
    // Try the title pattern first
    const titleMatch = text.match(ENTITY_PATTERNS.title);
    if (titleMatch) {
      params.title = titleMatch[1].trim();
    } else if (params.name) {
      // Use name as title if found
      params.title = params.name;
      delete params.name;
    } else {
      // Try other patterns for quest titles
      const altTitleMatch = text.match(/(?:quest|mission|task)\s+(?:about|involving|for|called|named)\s+["']?([^"'\n]+?)["']?/i);
      if (altTitleMatch) {
        params.title = altTitleMatch[1].trim();
      }
    }
  }

  // Extract involved NPCs
  if (context?.npcs) {
    const involvedNpcs = context.npcs.filter(npc =>
      text.toLowerCase().includes(npc.name.toLowerCase())
    );
    if (involvedNpcs.length > 0) {
      params.involvedNpcIds = involvedNpcs.map(npc => npc.id);
      params.startNpcId = involvedNpcs[0].id;
    }
  }

  return params;
}

/**
 * Extract Location-specific parameters
 */
function extractLocationParameters(
  text: string, 
  baseParams: Record<string, any>, 
  context?: CampaignContext
): Record<string, any> {
  const params = { ...baseParams };
  
  // Extract coordinates if mentioned
  const coordsMatch = text.match(/(?:at|coordinates?)\s*\(?(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)\)?/i);
  if (coordsMatch) {
    params.coords = {
      lat: parseFloat(coordsMatch[1]),
      lng: parseFloat(coordsMatch[2])
    };
  }
  
  return params;
}

/**
 * Extract modification parameters
 */
function extractModifyParameters(
  text: string, 
  baseParams: Record<string, any>, 
  context?: CampaignContext
): Record<string, any> {
  const params = { ...baseParams };
  
  // Try to identify target entity
  if (context) {
    // Check for NPC names
    const mentionedNpc = context.npcs.find(npc => 
      text.toLowerCase().includes(npc.name.toLowerCase())
    );
    if (mentionedNpc) {
      params.targetType = 'npc';
      params.targetId = mentionedNpc.id;
    }
    
    // Check for quest titles
    const mentionedQuest = context.quests.find(quest => 
      text.toLowerCase().includes(quest.title.toLowerCase())
    );
    if (mentionedQuest) {
      params.targetType = 'quest';
      params.targetId = mentionedQuest.id;
    }
    
    // Check for location names
    const mentionedLocation = context.locations.find(loc => 
      text.toLowerCase().includes(loc.name.toLowerCase())
    );
    if (mentionedLocation) {
      params.targetType = 'location';
      params.targetId = mentionedLocation.id;
    }
  }
  
  return params;
}

/**
 * Extract suggestion parameters
 */
function extractSuggestParameters(
  text: string,
  baseParams: Record<string, any>,
  context?: CampaignContext
): Record<string, any> {
  const params = { ...baseParams };

  // Determine what type of suggestions are needed - check for specific mentions first
  if (/\b(?:npc|character)s?\b/i.test(text)) {
    params.suggestionType = 'npc';
  } else if (/\bquests?\b/i.test(text)) {
    params.suggestionType = 'quest';
  } else if (/\b(?:location|place)s?\b/i.test(text)) {
    params.suggestionType = 'location';
  } else {
    params.suggestionType = 'general';
  }

  return params;
}

/**
 * Calculate confidence score for parsed command
 */
function calculateConfidence(
  text: string, 
  commandType: AICommand['type'], 
  parameters: Record<string, any>
): number {
  let confidence = 0;
  
  // Base confidence from command type detection
  if (commandType !== 'UNKNOWN') {
    confidence += 0.4;
  }
  
  // Boost confidence based on extracted parameters
  const paramCount = Object.keys(parameters).length;
  confidence += Math.min(paramCount * 0.1, 0.4);
  
  // Boost confidence for specific entity mentions
  if (parameters.name || parameters.title) confidence += 0.2;
  
  return Math.min(confidence, 1.0);
}

/**
 * Parse AI response content into structured format
 */
export function parseAIResponse(content: string): ParsedContent {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    // Fallback to text parsing
    return parseTextResponse(content);
  }
}

/**
 * Parse text response when JSON parsing fails
 */
function parseTextResponse(content: string): ParsedContent {
  const result: ParsedContent = {};
  
  // Extract NPCs from text
  const npcMatches = content.match(/NPC:?\s*([^\n]+)/gi);
  if (npcMatches) {
    result.npcs = npcMatches.map(match => {
      const name = match.replace(/NPC:?\s*/i, '').trim();
      return { name, role: 'Generated Character', personality: 'Friendly' };
    });
  }
  
  // Extract quests from text
  const questMatches = content.match(/Quest:?\s*([^\n]+)/gi);
  if (questMatches) {
    result.quests = questMatches.map(match => {
      const title = match.replace(/Quest:?\s*/i, '').trim();
      return { title, description: 'Generated quest', importance: 'medium' as const };
    });
  }
  
  // Extract locations from text
  const locationMatches = content.match(/Location:?\s*([^\n]+)/gi);
  if (locationMatches) {
    result.locations = locationMatches.map(match => {
      const name = match.replace(/Location:?\s*/i, '').trim();
      return { name, type: 'landmark' as const, description: 'Generated location' };
    });
  }
  
  return result;
}
