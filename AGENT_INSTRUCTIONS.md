# Remote Agent Implementation Instructions

## Overview
6 remote agents will implement user stories in parallel. Each agent has a specific functional area to avoid merge conflicts.

## General Instructions for All Agents

### Branch Naming Convention
- Create branch: `feature/agent-{number}-{feature-name}`
- Example: `feature/agent-1-import-export`

### Development Workflow
1. Create and checkout your branch
2. Implement your assigned features
3. Test thoroughly (unit tests + manual testing)
4. Create detailed PR with notes
5. Include screenshots/demos where applicable

### Code Standards
- Follow existing TypeScript/React patterns
- Use existing UI components and styling
- Maintain type safety
- Add proper error handling
- Include loading states
- Follow accessibility guidelines

### Testing Requirements
- Test all happy path scenarios
- Test error conditions
- Test edge cases (empty data, large datasets)
- Verify mobile responsiveness
- Test with different user permissions

---

## AGENT 1: Import/Export System
**Branch:** `feature/agent-1-import-export`
**User Stories:** US-009, US-010

### Deliverables
1. **Export Campaign to JSON** (US-009)
   - Complete campaign data export including AI context
   - Downloadable JSON file with proper formatting
   - Export progress indicator for large campaigns

2. **Import Campaign from JSON** (US-010)
   - File upload and validation
   - Data restoration with conflict resolution
   - Progress indicator and error handling

### Files to Create/Modify
- `lib/importExport.ts` - Core import/export logic
- `components/campaign/ImportExportModal.tsx` - UI for import/export
- `hooks/useImportExport.ts` - Custom hook for import/export operations
- `types/index.ts` - Add import/export types (if needed)

### Implementation Details
```typescript
// Export format structure
interface CampaignExport {
  version: string;
  exportedAt: Date;
  campaign: Campaign;
  locations: Location[];
  npcs: NPC[];
  quests: Quest[];
  aiContext: AIContextMemory;
  metadata: {
    totalItems: number;
    checksum: string;
  };
}
```

### Acceptance Criteria
- [ ] Export creates valid JSON with all campaign data
- [ ] Import validates JSON structure before processing
- [ ] Import handles duplicate IDs and conflicts
- [ ] Progress indicators for large operations
- [ ] Error messages for invalid files
- [ ] Exported campaigns can be fully restored

---

## AGENT 2: NPC Management Enhancement
**Branch:** `feature/agent-2-npc-management`

### Deliverables
1. **Detailed NPC Forms**
   - Create/edit NPC modal with all fields
   - Portrait upload and management
   - Stats editor with validation

2. **NPC Relationship Tracking**
   - Relationship types (ally, enemy, neutral, etc.)
   - Visual relationship indicators
   - Relationship history

3. **Enhanced NPC Display**
   - Detailed NPC cards
   - Search and filter functionality
   - Bulk operations

### Files to Create/Modify
- `components/npc/NPCModal.tsx` - Create/edit NPC modal
- `components/npc/NPCCard.tsx` - Enhanced NPC display card
- `components/npc/NPCList.tsx` - Enhanced NPC list with search/filter
- `components/npc/NPCRelationships.tsx` - Relationship management
- `components/npc/PortraitUpload.tsx` - Portrait upload component
- `hooks/useNPCs.ts` - NPC management hook
- `lib/npcUtils.ts` - NPC utility functions

### Implementation Details
```typescript
// Enhanced NPC interface
interface EnhancedNPC extends NPC {
  relationships: NPCRelationship[];
  notes: string;
  backstory: string;
  goals: string[];
  secrets: string[];
  portraitUrl?: string;
}

interface NPCRelationship {
  targetNpcId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'romantic' | 'family' | 'business';
  strength: number; // 1-10
  description: string;
}
```

### Acceptance Criteria
- [ ] Create new NPCs with all fields
- [ ] Edit existing NPCs
- [ ] Upload and manage portraits
- [ ] Define relationships between NPCs
- [ ] Search NPCs by name, role, location
- [ ] Filter NPCs by various criteria
- [ ] Bulk delete/edit operations

---

## AGENT 3: Quest Management Enhancement
**Branch:** `feature/agent-3-quest-management`

### Deliverables
1. **Detailed Quest Forms**
   - Create/edit quest modal with all fields
   - Quest dependency management
   - Reward and XP tracking

2. **Quest Progress Tracking**
   - Progress indicators and milestones
   - Quest completion workflows
   - Quest history and notes

3. **Enhanced Quest Display**
   - Detailed quest cards
   - Quest timeline view
   - Search and filter functionality

### Files to Create/Modify
- `components/quest/QuestModal.tsx` - Create/edit quest modal
- `components/quest/QuestCard.tsx` - Enhanced quest display
- `components/quest/QuestList.tsx` - Enhanced quest list
- `components/quest/QuestTimeline.tsx` - Quest timeline view
- `components/quest/QuestDependencies.tsx` - Dependency management
- `hooks/useQuests.ts` - Quest management hook
- `lib/questUtils.ts` - Quest utility functions

### Implementation Details
```typescript
// Enhanced Quest interface
interface EnhancedQuest extends Quest {
  dependencies: string[]; // Quest IDs that must be completed first
  milestones: QuestMilestone[];
  xpReward: number;
  goldReward: number;
  itemRewards: string[];
  completedAt?: Date;
  notes: string;
  playerNotes: string;
}

interface QuestMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
}
```

### Acceptance Criteria
- [ ] Create new quests with dependencies
- [ ] Edit existing quests
- [ ] Track quest progress and milestones
- [ ] Mark quests as completed
- [ ] View quest timeline and history
- [ ] Search quests by title, description, status
- [ ] Filter quests by importance, status, NPCs
- [ ] Manage quest rewards and XP

---

## AGENT 4: Location Management Enhancement
**Branch:** `feature/agent-4-location-management`

### Deliverables
1. **Detailed Location Forms**
   - Create/edit location modal with rich descriptions
   - Image upload and gallery
   - Sub-location management

2. **Location Hierarchy**
   - Parent-child location relationships
   - Nested location display
   - Location navigation

3. **Enhanced Location Display**
   - Detailed location cards
   - Image galleries
   - Search and filter functionality

### Files to Create/Modify
- `components/location/LocationModal.tsx` - Create/edit location modal
- `components/location/LocationCard.tsx` - Enhanced location display
- `components/location/LocationList.tsx` - Enhanced location list
- `components/location/LocationHierarchy.tsx` - Hierarchical view
- `components/location/ImageGallery.tsx` - Location image gallery
- `hooks/useLocations.ts` - Location management hook
- `lib/locationUtils.ts` - Location utility functions

### Implementation Details
```typescript
// Enhanced Location interface
interface EnhancedLocation extends Location {
  parentLocationId?: string;
  subLocations: string[]; // Child location IDs
  images: LocationImage[];
  detailedDescription: string;
  history: string;
  rumors: string[];
  secrets: string[];
  climate: string;
  population?: number;
  government?: string;
  economy?: string;
}

interface LocationImage {
  id: string;
  url: string;
  caption: string;
  isPrimary: boolean;
}
```

### Acceptance Criteria
- [ ] Create new locations with rich details
- [ ] Edit existing locations
- [ ] Upload and manage location images
- [ ] Create sub-locations and hierarchies
- [ ] Navigate location hierarchies
- [ ] Search locations by name, type, description
- [ ] Filter locations by type, parent location
- [ ] View location image galleries

---

## AGENT 5: AI Integration Completion
**Branch:** `feature/agent-5-ai-integration`
**User Stories:** US-007, US-008

### Deliverables
1. **Complete AI Command Processing** (US-007)
   - Natural language command parsing
   - Structured content generation
   - Real-time content creation and map updates

2. **AI Context Management** (US-008)
   - Persistent conversation history
   - Context-aware responses
   - Memory management and optimization

3. **Advanced AI Features**
   - Content suggestions and recommendations
   - Automated world building assistance
   - Smart content linking

### Files to Create/Modify
- `lib/ai.ts` - Enhanced AI service with better parsing
- `firebase/functions/src/ai.ts` - Complete AI processing functions
- `components/ai/AIChat.tsx` - Enhanced chat with better UX
- `components/ai/AIContentPreview.tsx` - Preview generated content
- `lib/aiParsers.ts` - Command parsing utilities
- `hooks/useAI.ts` - AI interaction hook

### Implementation Details
```typescript
// Enhanced AI command processing
interface AICommand {
  type: 'CREATE_NPC' | 'CREATE_QUEST' | 'CREATE_LOCATION' | 'MODIFY' | 'SUGGEST';
  target?: string; // ID of target entity
  parameters: Record<string, any>;
  context: CampaignContext;
}

interface AIResponse {
  success: boolean;
  content: GeneratedContent;
  suggestions: string[];
  followUpQuestions: string[];
}
```

### Acceptance Criteria
- [ ] Parse natural language commands accurately
- [ ] Generate NPCs, quests, locations from AI responses
- [ ] Maintain conversation context across sessions
- [ ] Provide intelligent suggestions
- [ ] Handle AI errors gracefully
- [ ] Preview generated content before adding
- [ ] Link generated content automatically

---

## AGENT 6: Map Enhancements
**Branch:** `feature/agent-6-map-enhancements`
**User Stories:** Enhanced US-004, US-005, US-006

### Deliverables
1. **Advanced Map Features**
   - Terrain and biome layers
   - Custom map tiles and overlays
   - Drawing tools for custom annotations

2. **Enhanced Interactions**
   - Improved marker clustering
   - Advanced filtering and layer management
   - Measurement tools

3. **Map Customization**
   - Custom marker styles
   - Map themes and styling
   - Export map as image

### Files to Create/Modify
- `components/map/TerrainLayers.tsx` - Terrain and biome overlays
- `components/map/DrawingTools.tsx` - Map drawing and annotation tools
- `components/map/MapControls.tsx` - Enhanced map controls
- `components/map/LayerManager.tsx` - Layer visibility management
- `components/map/CustomMarkers.tsx` - Custom marker components
- `lib/mapUtils.ts` - Map utility functions
- `hooks/useMap.ts` - Map interaction hook

### Implementation Details
```typescript
// Enhanced map features
interface MapLayer {
  id: string;
  name: string;
  type: 'terrain' | 'political' | 'custom' | 'annotations';
  visible: boolean;
  opacity: number;
  data: any;
}

interface MapAnnotation {
  id: string;
  type: 'line' | 'polygon' | 'circle' | 'text';
  coordinates: LatLng[];
  style: AnnotationStyle;
  label?: string;
}
```

### Acceptance Criteria
- [ ] Add terrain and biome layers
- [ ] Implement drawing tools for annotations
- [ ] Enhanced marker clustering and filtering
- [ ] Layer management with visibility controls
- [ ] Custom marker styles for different content types
- [ ] Map export functionality
- [ ] Measurement tools for distances
- [ ] Improved mobile map interactions

---

## Pull Request Template

When creating your PR, use this template:

```markdown
## Agent {Number}: {Feature Name}

### User Stories Implemented
- [ ] US-XXX: Description
- [ ] US-XXX: Description

### Changes Made
- **New Files:**
  - `path/to/file.tsx` - Description
  - `path/to/file.ts` - Description

- **Modified Files:**
  - `path/to/file.tsx` - Changes made
  - `path/to/file.ts` - Changes made

### Features Implemented
1. **Feature 1:** Description and functionality
2. **Feature 2:** Description and functionality
3. **Feature 3:** Description and functionality

### Testing Completed
- [ ] Unit tests for new functions
- [ ] Integration tests for components
- [ ] Manual testing of all features
- [ ] Mobile responsiveness testing
- [ ] Error handling testing

### Screenshots/Demos
[Include screenshots or GIFs demonstrating the new features]

### Notes for Reviewers
- Any special considerations
- Known limitations or future improvements
- Dependencies or integration notes

### Deployment Notes
- Any environment variables needed
- Database migrations required
- Special deployment steps
```

## Coordination Notes

- **No merge conflicts:** Each agent works in different file areas
- **Shared types:** Coordinate any type changes in team chat
- **Testing:** Test your features with existing skeleton data
- **Documentation:** Update relevant documentation files
- **Integration:** Ensure your features work with existing components

Start your branches and begin implementation! 🚀
