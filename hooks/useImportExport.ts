import { useState, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { CampaignExporter, CampaignImporter } from '@/lib/importExport';
import type {
  CampaignExport,
  ExportProgress,
  ImportProgress,
  ImportResult,
  ImportConflict,
  ImportOptions
} from '@/types';

interface UseImportExportReturn {
  // Export state
  isExporting: boolean;
  exportProgress: ExportProgress | null;
  exportError: string | null;
  
  // Import state
  isImporting: boolean;
  importProgress: ImportProgress | null;
  importResult: ImportResult | null;
  importError: string | null;
  importConflicts: ImportConflict[];
  
  // Actions
  exportCampaign: (campaignId: string) => Promise<void>;
  importFromFile: (file: File, options: ImportOptions, targetCampaignId?: string) => Promise<void>;
  resolveConflicts: (conflicts: ImportConflict[]) => Promise<void>;
  clearImportState: () => void;
  clearExportState: () => void;
}

export function useImportExport(): UseImportExportReturn {
  const { user, currentCampaign, refreshCampaignData } = useAppStore();
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importConflicts, setImportConflicts] = useState<ImportConflict[]>([]);
  
  // Stored import data for conflict resolution
  const [pendingImportData, setPendingImportData] = useState<{
    data: CampaignExport;
    options: ImportOptions;
    targetCampaignId?: string;
  } | null>(null);

  /**
   * Export campaign to JSON file
   */
  const exportCampaign = useCallback(async (campaignId: string) => {
    if (!user) {
      setExportError('User not authenticated');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportProgress(null);

    try {
      const exporter = new CampaignExporter((progress) => {
        setExportProgress(progress);
      });

      const exportData = await exporter.exportCampaign(campaignId);
      
      // Download the file
      CampaignExporter.downloadExport(exportData);
      
      // Clear progress after a short delay to show completion
      setTimeout(() => {
        setExportProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [user]);

  /**
   * Import campaign from JSON file
   */
  const importFromFile = useCallback(async (
    file: File, 
    options: ImportOptions, 
    targetCampaignId?: string
  ) => {
    if (!user) {
      setImportError('User not authenticated');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportProgress(null);
    setImportResult(null);
    setImportConflicts([]);

    try {
      // Parse the file
      setImportProgress({
        stage: 'validating',
        progress: 10,
        message: 'Reading import file...'
      });

      const importData = await CampaignImporter.parseImportFile(file);

      // Create importer and start import process
      const importer = new CampaignImporter((progress) => {
        setImportProgress(progress);
      });

      const result = await importer.importCampaign(
        importData,
        options,
        user.uid,
        targetCampaignId
      );

      setImportResult(result);

      // If there are conflicts that need user resolution
      if (result.conflicts.length > 0 && options.resolveConflicts === 'ask') {
        setImportConflicts(result.conflicts);
        setPendingImportData({ data: importData, options, targetCampaignId });
      } else {
        // Import completed, refresh campaign data if successful
        if (result.success && (targetCampaignId === currentCampaign?.id || !targetCampaignId)) {
          await refreshCampaignData();
        }
        
        // Clear progress after showing completion
        setTimeout(() => {
          setImportProgress(null);
        }, 2000);
      }

    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [user, currentCampaign?.id, refreshCampaignData]);

  /**
   * Resolve conflicts and continue import
   */
  const resolveConflicts = useCallback(async (resolvedConflicts: ImportConflict[]) => {
    if (!pendingImportData || !user) {
      setImportError('No pending import data or user not authenticated');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Update the import options based on resolved conflicts
      const updatedOptions: ImportOptions = {
        ...pendingImportData.options,
        resolveConflicts: 'skip' // Use the resolved conflicts
      };

      // Update conflicts with user decisions
      setImportConflicts(resolvedConflicts);

      const importer = new CampaignImporter((progress) => {
        setImportProgress(progress);
      });

      const result = await importer.importCampaign(
        pendingImportData.data,
        updatedOptions,
        user.uid,
        pendingImportData.targetCampaignId
      );

      setImportResult(result);

      // Refresh campaign data if successful
      if (result.success && (pendingImportData.targetCampaignId === currentCampaign?.id || !pendingImportData.targetCampaignId)) {
        await refreshCampaignData();
      }

      // Clear pending data
      setPendingImportData(null);
      
      // Clear progress after showing completion
      setTimeout(() => {
        setImportProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Conflict resolution failed:', error);
      setImportError(error instanceof Error ? error.message : 'Conflict resolution failed');
    } finally {
      setIsImporting(false);
    }
  }, [pendingImportData, user, currentCampaign?.id, refreshCampaignData]);

  /**
   * Clear import state
   */
  const clearImportState = useCallback(() => {
    setIsImporting(false);
    setImportProgress(null);
    setImportResult(null);
    setImportError(null);
    setImportConflicts([]);
    setPendingImportData(null);
  }, []);

  /**
   * Clear export state
   */
  const clearExportState = useCallback(() => {
    setIsExporting(false);
    setExportProgress(null);
    setExportError(null);
  }, []);

  return {
    // Export state
    isExporting,
    exportProgress,
    exportError,
    
    // Import state
    isImporting,
    importProgress,
    importResult,
    importError,
    importConflicts,
    
    // Actions
    exportCampaign,
    importFromFile,
    resolveConflicts,
    clearImportState,
    clearExportState
  };
}
