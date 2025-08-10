import { 
  CampaignService, 
  LocationService, 
  NPCService, 
  QuestService, 
  AIContextService 
} from './firestore';
import type {
  Campaign,
  Location,
  NPC,
  Quest,
  AIContextMemory,
  CampaignExport,
  ExportProgress,
  ImportProgress,
  ImportResult,
  ImportConflict,
  ImportOptions
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Export version for compatibility checking
export const EXPORT_VERSION = '1.0.0';

/**
 * Generate a simple checksum for data integrity verification
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Export campaign data to JSON format
 */
export class CampaignExporter {
  private onProgress?: (progress: ExportProgress) => void;

  constructor(onProgress?: (progress: ExportProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(stage: ExportProgress['stage'], progress: number, message: string, totalItems?: number, processedItems?: number) {
    this.onProgress?.({
      stage,
      progress,
      message,
      totalItems,
      processedItems
    });
  }

  async exportCampaign(campaignId: string): Promise<CampaignExport> {
    try {
      this.updateProgress('gathering', 10, 'Gathering campaign data...');

      // Fetch all campaign data in parallel
      const [campaign, locations, npcs, quests, aiContext] = await Promise.all([
        CampaignService.getCampaign(campaignId),
        LocationService.getCampaignLocations(campaignId),
        NPCService.getCampaignNPCs(campaignId),
        QuestService.getCampaignQuests(campaignId),
        AIContextService.getAIContext(campaignId)
      ]);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      this.updateProgress('processing', 50, 'Processing campaign data...');

      const totalItems = 1 + locations.length + npcs.length + quests.length + (aiContext ? 1 : 0);

      // Create export data structure
      const exportData: Omit<CampaignExport, 'metadata'> = {
        version: EXPORT_VERSION,
        exportedAt: new Date(),
        campaign,
        locations,
        npcs,
        quests,
        aiContext: aiContext || {
          campaignId,
          tokens: [],
          lastUpdated: new Date(),
          conversationHistory: []
        }
      };

      this.updateProgress('generating', 80, 'Generating export file...');

      // Generate checksum for data integrity
      const checksum = generateChecksum(exportData);

      const finalExport: CampaignExport = {
        ...exportData,
        metadata: {
          totalItems,
          checksum
        }
      };

      this.updateProgress('complete', 100, 'Export complete!', totalItems, totalItems);

      return finalExport;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(`Failed to export campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download export data as JSON file
   */
  static downloadExport(exportData: CampaignExport, filename?: string) {
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${exportData.campaign.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Import campaign data from JSON format
 */
export class CampaignImporter {
  private onProgress?: (progress: ImportProgress) => void;

  constructor(onProgress?: (progress: ImportProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(stage: ImportProgress['stage'], progress: number, message: string, totalItems?: number, processedItems?: number) {
    this.onProgress?.({
      stage,
      progress,
      message,
      totalItems,
      processedItems
    });
  }

  /**
   * Validate import file structure and data integrity
   */
  async validateImportData(data: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!data.version) errors.push('Missing version field');
    if (!data.exportedAt) errors.push('Missing exportedAt field');
    if (!data.campaign) errors.push('Missing campaign data');
    if (!data.locations) errors.push('Missing locations data');
    if (!data.npcs) errors.push('Missing NPCs data');
    if (!data.quests) errors.push('Missing quests data');
    if (!data.metadata) errors.push('Missing metadata');

    // Version compatibility check
    if (data.version && data.version !== EXPORT_VERSION) {
      errors.push(`Unsupported export version: ${data.version}. Expected: ${EXPORT_VERSION}`);
    }

    // Data integrity check
    if (data.metadata?.checksum) {
      const { metadata, ...dataWithoutMetadata } = data;
      const calculatedChecksum = generateChecksum(dataWithoutMetadata);
      if (calculatedChecksum !== data.metadata.checksum) {
        errors.push('Data integrity check failed - file may be corrupted');
      }
    }

    // Basic structure validation
    if (data.campaign && !data.campaign.id) errors.push('Campaign missing ID');
    if (data.locations && !Array.isArray(data.locations)) errors.push('Locations must be an array');
    if (data.npcs && !Array.isArray(data.npcs)) errors.push('NPCs must be an array');
    if (data.quests && !Array.isArray(data.quests)) errors.push('Quests must be an array');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for conflicts with existing data
   */
  async checkConflicts(importData: CampaignExport, targetCampaignId?: string): Promise<ImportConflict[]> {
    const conflicts: ImportConflict[] = [];

    // If importing to existing campaign, check for ID conflicts
    if (targetCampaignId) {
      const [existingLocations, existingNPCs, existingQuests] = await Promise.all([
        LocationService.getCampaignLocations(targetCampaignId),
        NPCService.getCampaignNPCs(targetCampaignId),
        QuestService.getCampaignQuests(targetCampaignId)
      ]);

      // Check location conflicts
      for (const location of importData.locations) {
        const existing = existingLocations.find(l => l.id === location.id || l.name === location.name);
        if (existing) {
          conflicts.push({
            type: 'location',
            id: location.id,
            name: location.name,
            action: 'skip',
            existingItem: existing,
            newItem: location
          });
        }
      }

      // Check NPC conflicts
      for (const npc of importData.npcs) {
        const existing = existingNPCs.find(n => n.id === npc.id || n.name === npc.name);
        if (existing) {
          conflicts.push({
            type: 'npc',
            id: npc.id,
            name: npc.name,
            action: 'skip',
            existingItem: existing,
            newItem: npc
          });
        }
      }

      // Check quest conflicts
      for (const quest of importData.quests) {
        const existing = existingQuests.find(q => q.id === quest.id || q.title === quest.title);
        if (existing) {
          conflicts.push({
            type: 'quest',
            id: quest.id,
            name: quest.title,
            action: 'skip',
            existingItem: existing,
            newItem: quest
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Import campaign data with conflict resolution
   */
  async importCampaign(
    importData: CampaignExport,
    options: ImportOptions,
    userId: string,
    targetCampaignId?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: {
        campaign: false,
        locations: 0,
        npcs: 0,
        quests: 0,
        aiContext: false
      },
      conflicts: [],
      errors: []
    };

    try {
      this.updateProgress('validating', 10, 'Validating import data...');

      // Validate data
      const validation = await this.validateImportData(importData);
      if (!validation.valid) {
        result.errors = validation.errors;
        return result;
      }

      this.updateProgress('processing', 20, 'Processing import data...');

      // Check for conflicts
      const conflicts = await this.checkConflicts(importData, targetCampaignId);
      result.conflicts = conflicts;

      if (conflicts.length > 0 && options.resolveConflicts === 'ask') {
        this.updateProgress('resolving-conflicts', 30, 'Conflicts detected - user input required');
        return result; // Return early for user to resolve conflicts
      }

      this.updateProgress('importing', 40, 'Importing campaign data...');

      const totalItems = 1 + importData.locations.length + importData.npcs.length + importData.quests.length;
      let processedItems = 0;

      // Import campaign (create new or update existing)
      let campaignId = targetCampaignId;
      if (!campaignId) {
        // Create new campaign
        const newCampaignData = {
          ...importData.campaign,
          id: undefined, // Let Firestore generate new ID
          ownerId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        campaignId = await CampaignService.createCampaign(newCampaignData);
        result.imported.campaign = true;
      }

      processedItems++;
      this.updateProgress('importing', 40 + (processedItems / totalItems) * 40,
        `Imported campaign`, totalItems, processedItems);

      // Import locations
      for (const location of importData.locations) {
        try {
          const shouldSkip = conflicts.some(c =>
            c.type === 'location' && c.id === location.id && c.action === 'skip'
          );

          if (shouldSkip && options.resolveConflicts === 'skip') {
            continue;
          }

          const locationData = {
            ...location,
            campaignId: campaignId!,
            id: options.overwriteExisting ? location.id : undefined
          };

          if (options.overwriteExisting && conflicts.some(c => c.type === 'location' && c.id === location.id)) {
            await LocationService.updateLocation(location.id, locationData);
          } else {
            await LocationService.createLocation(locationData);
          }

          result.imported.locations++;
        } catch (error) {
          result.errors.push(`Failed to import location ${location.name}: ${error}`);
        }

        processedItems++;
        this.updateProgress('importing', 40 + (processedItems / totalItems) * 40,
          `Imported ${result.imported.locations} locations`, totalItems, processedItems);
      }

      // Import NPCs
      for (const npc of importData.npcs) {
        try {
          const shouldSkip = conflicts.some(c =>
            c.type === 'npc' && c.id === npc.id && c.action === 'skip'
          );

          if (shouldSkip && options.resolveConflicts === 'skip') {
            continue;
          }

          const npcData = {
            ...npc,
            campaignId: campaignId!,
            id: options.overwriteExisting ? npc.id : undefined
          };

          if (options.overwriteExisting && conflicts.some(c => c.type === 'npc' && c.id === npc.id)) {
            await NPCService.updateNPC(npc.id, npcData);
          } else {
            await NPCService.createNPC(npcData);
          }

          result.imported.npcs++;
        } catch (error) {
          result.errors.push(`Failed to import NPC ${npc.name}: ${error}`);
        }

        processedItems++;
        this.updateProgress('importing', 40 + (processedItems / totalItems) * 40,
          `Imported ${result.imported.npcs} NPCs`, totalItems, processedItems);
      }

      // Import quests
      for (const quest of importData.quests) {
        try {
          const shouldSkip = conflicts.some(c =>
            c.type === 'quest' && c.id === quest.id && c.action === 'skip'
          );

          if (shouldSkip && options.resolveConflicts === 'skip') {
            continue;
          }

          const questData = {
            ...quest,
            campaignId: campaignId!,
            id: options.overwriteExisting ? quest.id : undefined
          };

          if (options.overwriteExisting && conflicts.some(c => c.type === 'quest' && c.id === quest.id)) {
            await QuestService.updateQuest(quest.id, questData);
          } else {
            await QuestService.createQuest(questData);
          }

          result.imported.quests++;
        } catch (error) {
          result.errors.push(`Failed to import quest ${quest.title}: ${error}`);
        }

        processedItems++;
        this.updateProgress('importing', 40 + (processedItems / totalItems) * 40,
          `Imported ${result.imported.quests} quests`, totalItems, processedItems);
      }

      // Import AI context if requested
      if (options.importAIContext && importData.aiContext) {
        try {
          const aiContextData = {
            ...importData.aiContext,
            campaignId: campaignId!
          };
          await AIContextService.updateAIContext(campaignId!, aiContextData);
          result.imported.aiContext = true;
        } catch (error) {
          result.errors.push(`Failed to import AI context: ${error}`);
        }
      }

      this.updateProgress('complete', 100, 'Import complete!', totalItems, processedItems);
      result.success = true;

    } catch (error) {
      console.error('Import error:', error);
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Parse JSON file content
   */
  static async parseImportFile(file: File): Promise<CampaignExport> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file format'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }
}
