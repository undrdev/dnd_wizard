/**
 * Backup and Recovery System
 * Provides automatic backup, data recovery, and version management
 */

import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from './firebase';

export interface BackupMetadata {
  id: string;
  campaignId: string;
  userId: string;
  timestamp: Date;
  type: 'manual' | 'automatic' | 'scheduled';
  size: number;
  version: string;
  description?: string;
  checksum: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  campaign: any;
  npcs: any[];
  locations: any[];
  quests: any[];
  settings: any;
}

export interface RecoveryOptions {
  includeNPCs?: boolean;
  includeLocations?: boolean;
  includeQuests?: boolean;
  includeSettings?: boolean;
  overwriteExisting?: boolean;
  createNewCampaign?: boolean;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // in minutes
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

class BackupService {
  private readonly defaultConfig: BackupConfig = {
    autoBackupEnabled: true,
    autoBackupInterval: 60, // 1 hour
    maxBackups: 10,
    compressionEnabled: true,
    encryptionEnabled: false
  };

  private autoBackupTimer: NodeJS.Timeout | null = null;
  private config: BackupConfig = { ...this.defaultConfig };

  /**
   * Initialize backup service with configuration
   */
  initialize(config: Partial<BackupConfig> = {}): void {
    this.config = { ...this.defaultConfig, ...config };
    
    if (this.config.autoBackupEnabled) {
      this.startAutoBackup();
    }
  }

  /**
   * Create a manual backup of campaign data
   */
  async createBackup(
    campaignId: string,
    userId: string,
    description?: string
  ): Promise<BackupMetadata> {
    try {
      // Collect all campaign data
      const backupData = await this.collectCampaignData(campaignId);
      
      // Create metadata
      const metadata: BackupMetadata = {
        id: crypto.randomUUID(),
        campaignId,
        userId,
        timestamp: new Date(),
        type: 'manual',
        size: this.calculateDataSize(backupData),
        version: '1.0.0',
        description,
        checksum: await this.calculateChecksum(backupData)
      };

      // Prepare backup data
      const backup: BackupData = {
        metadata,
        ...backupData
      };

      // Compress if enabled
      let finalData = backup;
      if (this.config.compressionEnabled) {
        finalData = await this.compressData(backup);
      }

      // Encrypt if enabled
      if (this.config.encryptionEnabled) {
        finalData = await this.encryptData(finalData);
      }

      // Store backup
      await this.storeBackup(metadata.id, finalData);

      // Clean up old backups
      await this.cleanupOldBackups(campaignId, userId);

      return metadata;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restore data from a backup
   */
  async restoreFromBackup(
    backupId: string,
    options: RecoveryOptions = {}
  ): Promise<void> {
    try {
      // Retrieve backup data
      const backupData = await this.retrieveBackup(backupId);
      
      if (!backupData) {
        throw new Error('Backup not found');
      }

      // Decrypt if needed
      let processedData = backupData;
      if (this.config.encryptionEnabled) {
        processedData = await this.decryptData(processedData);
      }

      // Decompress if needed
      if (this.config.compressionEnabled) {
        processedData = await this.decompressData(processedData);
      }

      // Verify data integrity
      const isValid = await this.verifyBackupIntegrity(processedData);
      if (!isValid) {
        throw new Error('Backup data is corrupted');
      }

      // Restore data based on options
      await this.performRestore(processedData, options);

    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw new Error('Failed to restore from backup');
    }
  }

  /**
   * List available backups for a campaign
   */
  async listBackups(campaignId: string, userId: string): Promise<BackupMetadata[]> {
    try {
      const backupsRef = collection(db, 'backups');
      const q = query(
        backupsRef,
        where('campaignId', '==', campaignId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(this.config.maxBackups)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BackupMetadata));
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'backups', backupId));
      await deleteDoc(doc(db, 'backup_data', backupId));
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(campaignId: string, userId: string): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup: Date | null;
    oldestBackup: Date | null;
  }> {
    const backups = await this.listBackups(campaignId, userId);
    
    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      lastBackup: backups.length > 0 ? backups[0].timestamp : null,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null
    };
  }

  /**
   * Start automatic backup process
   */
  startAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
    }

    this.autoBackupTimer = setInterval(() => {
      this.performAutoBackup();
    }, this.config.autoBackupInterval * 60 * 1000);
  }

  /**
   * Stop automatic backup process
   */
  stopAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  /**
   * Update backup configuration
   */
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.autoBackupEnabled) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }

  private async collectCampaignData(campaignId: string): Promise<{
    campaign: any;
    npcs: any[];
    locations: any[];
    quests: any[];
    settings: any;
  }> {
    // Collect campaign data from Firestore
    const [campaign, npcs, locations, quests, settings] = await Promise.all([
      this.getCampaignData(campaignId),
      this.getNPCsData(campaignId),
      this.getLocationsData(campaignId),
      this.getQuestsData(campaignId),
      this.getSettingsData(campaignId)
    ]);

    return { campaign, npcs, locations, quests, settings };
  }

  private async getCampaignData(campaignId: string): Promise<any> {
    // Implementation to get campaign data
    return {};
  }

  private async getNPCsData(campaignId: string): Promise<any[]> {
    // Implementation to get NPCs data
    return [];
  }

  private async getLocationsData(campaignId: string): Promise<any[]> {
    // Implementation to get locations data
    return [];
  }

  private async getQuestsData(campaignId: string): Promise<any[]> {
    // Implementation to get quests data
    return [];
  }

  private async getSettingsData(campaignId: string): Promise<any> {
    // Implementation to get settings data
    return {};
  }

  private calculateDataSize(data: any): number {
    return JSON.stringify(data).length;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Fallback simple checksum
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private async compressData(data: any): Promise<any> {
    // Simple compression simulation - in production, use a real compression library
    const jsonString = JSON.stringify(data);
    return {
      compressed: true,
      data: btoa(jsonString), // Base64 encoding as simple "compression"
      originalSize: jsonString.length
    };
  }

  private async decompressData(data: any): Promise<any> {
    if (data.compressed) {
      const jsonString = atob(data.data);
      return JSON.parse(jsonString);
    }
    return data;
  }

  private async encryptData(data: any): Promise<any> {
    // Encryption placeholder - in production, implement proper encryption
    return {
      encrypted: true,
      data: btoa(JSON.stringify(data))
    };
  }

  private async decryptData(data: any): Promise<any> {
    if (data.encrypted) {
      const jsonString = atob(data.data);
      return JSON.parse(jsonString);
    }
    return data;
  }

  private async storeBackup(backupId: string, data: any): Promise<void> {
    // Store metadata
    await setDoc(doc(db, 'backups', backupId), data.metadata);
    
    // Store backup data separately
    await setDoc(doc(db, 'backup_data', backupId), {
      data: data
    });
  }

  private async retrieveBackup(backupId: string): Promise<any> {
    // Retrieve backup data
    const backupDoc = await getDocs(query(
      collection(db, 'backup_data'),
      where('__name__', '==', backupId)
    ));
    
    if (backupDoc.empty) {
      return null;
    }
    
    return backupDoc.docs[0].data().data;
  }

  private async verifyBackupIntegrity(backupData: BackupData): Promise<boolean> {
    try {
      const calculatedChecksum = await this.calculateChecksum({
        campaign: backupData.campaign,
        npcs: backupData.npcs,
        locations: backupData.locations,
        quests: backupData.quests,
        settings: backupData.settings
      });
      
      return calculatedChecksum === backupData.metadata.checksum;
    } catch (error) {
      return false;
    }
  }

  private async performRestore(backupData: BackupData, options: RecoveryOptions): Promise<void> {
    const { campaignId } = backupData.metadata;
    
    // Restore campaign data
    if (backupData.campaign) {
      await this.restoreCampaignData(campaignId, backupData.campaign, options);
    }
    
    // Restore NPCs
    if (options.includeNPCs !== false && backupData.npcs) {
      await this.restoreNPCsData(campaignId, backupData.npcs, options);
    }
    
    // Restore locations
    if (options.includeLocations !== false && backupData.locations) {
      await this.restoreLocationsData(campaignId, backupData.locations, options);
    }
    
    // Restore quests
    if (options.includeQuests !== false && backupData.quests) {
      await this.restoreQuestsData(campaignId, backupData.quests, options);
    }
    
    // Restore settings
    if (options.includeSettings !== false && backupData.settings) {
      await this.restoreSettingsData(campaignId, backupData.settings, options);
    }
  }

  private async restoreCampaignData(campaignId: string, data: any, options: RecoveryOptions): Promise<void> {
    // Implementation to restore campaign data
  }

  private async restoreNPCsData(campaignId: string, data: any[], options: RecoveryOptions): Promise<void> {
    // Implementation to restore NPCs data
  }

  private async restoreLocationsData(campaignId: string, data: any[], options: RecoveryOptions): Promise<void> {
    // Implementation to restore locations data
  }

  private async restoreQuestsData(campaignId: string, data: any[], options: RecoveryOptions): Promise<void> {
    // Implementation to restore quests data
  }

  private async restoreSettingsData(campaignId: string, data: any, options: RecoveryOptions): Promise<void> {
    // Implementation to restore settings data
  }

  private async cleanupOldBackups(campaignId: string, userId: string): Promise<void> {
    const backups = await this.listBackups(campaignId, userId);
    
    if (backups.length > this.config.maxBackups) {
      const backupsToDelete = backups.slice(this.config.maxBackups);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }

  private async performAutoBackup(): Promise<void> {
    // Implementation for automatic backup
    // This would need to get current campaign context
    console.log('Performing automatic backup...');
  }
}

// Export singleton instance
export const backupService = new BackupService();

// Convenience functions
export const createBackup = (campaignId: string, userId: string, description?: string) =>
  backupService.createBackup(campaignId, userId, description);

export const restoreFromBackup = (backupId: string, options?: RecoveryOptions) =>
  backupService.restoreFromBackup(backupId, options);

export const listBackups = (campaignId: string, userId: string) =>
  backupService.listBackups(campaignId, userId);

export default backupService;
