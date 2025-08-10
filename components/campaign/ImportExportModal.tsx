import React, { useState, useRef } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useImportExport } from '@/hooks/useImportExport';
import { useAppStore } from '@/stores/useAppStore';
import type { ImportOptions, ImportConflict } from '@/types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const { currentCampaign } = useAppStore();
  const {
    // Export state
    isExporting,
    exportProgress,
    exportError,
    exportCampaign,
    clearExportState,
    
    // Import state
    isImporting,
    importProgress,
    importResult,
    importError,
    importConflicts,
    importFromFile,
    resolveConflicts,
    clearImportState
  } = useImportExport();

  const [selectedTab, setSelectedTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Import form state
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    overwriteExisting: false,
    resolveConflicts: 'ask',
    importAIContext: true
  });

  const handleClose = () => {
    if (!isExporting && !isImporting) {
      clearExportState();
      clearImportState();
      onClose();
    }
  };

  const handleExport = async () => {
    if (!currentCampaign) return;
    await exportCampaign(currentCampaign.id);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await importFromFile(file, importOptions, currentCampaign?.id);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConflictResolution = async (conflicts: ImportConflict[]) => {
    await resolveConflicts(conflicts);
  };

  const tabs = [
    { name: 'Export', icon: ArrowDownTrayIcon },
    { name: 'Import', icon: ArrowUpTrayIcon }
  ];

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Campaign Import/Export
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isExporting || isImporting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </div>
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="mt-6">
                {/* Export Panel */}
                <Tab.Panel>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Export Campaign
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Export your entire campaign including NPCs, quests, locations, and AI context to a JSON file.
                      </p>
                    </div>

                    {exportError && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <XCircleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Export Failed</h3>
                            <p className="mt-1 text-sm text-red-700">{exportError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {exportProgress && (
                      <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">{exportProgress.message}</p>
                            <div className="mt-2 bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${exportProgress.progress}%` }}
                              />
                            </div>
                            {exportProgress.totalItems && (
                              <p className="mt-1 text-xs text-blue-600">
                                {exportProgress.processedItems || 0} of {exportProgress.totalItems} items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={handleExport}
                        disabled={!currentCampaign || isExporting}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting ? 'Exporting...' : 'Export Campaign'}
                      </button>
                    </div>
                  </div>
                </Tab.Panel>

                {/* Import Panel */}
                <Tab.Panel>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Import Campaign
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Import campaign data from a JSON file. You can import into the current campaign or create a new one.
                      </p>
                    </div>

                    {/* Import Options */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">Import Options</h4>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.overwriteExisting}
                          onChange={(e) => setImportOptions(prev => ({ 
                            ...prev, 
                            overwriteExisting: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Overwrite existing items with same ID
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.importAIContext}
                          onChange={(e) => setImportOptions(prev => ({ 
                            ...prev, 
                            importAIContext: e.target.checked 
                          }))}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Import AI conversation history
                        </span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Conflict Resolution
                        </label>
                        <select
                          value={importOptions.resolveConflicts}
                          onChange={(e) => setImportOptions(prev => ({ 
                            ...prev, 
                            resolveConflicts: e.target.value as ImportOptions['resolveConflicts']
                          }))}
                          className="input-primary"
                        >
                          <option value="ask">Ask me for each conflict</option>
                          <option value="skip">Skip conflicting items</option>
                          <option value="overwrite">Overwrite existing items</option>
                          <option value="rename">Rename imported items</option>
                        </select>
                      </div>
                    </div>

                    {importError && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <XCircleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Import Failed</h3>
                            <p className="mt-1 text-sm text-red-700">{importError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {importProgress && (
                      <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">{importProgress.message}</p>
                            <div className="mt-2 bg-blue-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress.progress}%` }}
                              />
                            </div>
                            {importProgress.totalItems && (
                              <p className="mt-1 text-xs text-blue-600">
                                {importProgress.processedItems || 0} of {importProgress.totalItems} items
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {importResult && importResult.success && (
                      <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Import Successful</h3>
                            <div className="mt-1 text-sm text-green-700">
                              <p>Imported: {importResult.imported.locations} locations, {importResult.imported.npcs} NPCs, {importResult.imported.quests} quests</p>
                              {importResult.errors.length > 0 && (
                                <p className="mt-1">With {importResult.errors.length} warnings</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conflict Resolution */}
                    {importConflicts.length > 0 && (
                      <ConflictResolutionPanel
                        conflicts={importConflicts}
                        onResolve={handleConflictResolution}
                        isResolving={isImporting}
                      />
                    )}

                    <div className="flex justify-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isImporting ? 'Importing...' : 'Select File to Import'}
                      </button>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

interface ConflictResolutionPanelProps {
  conflicts: ImportConflict[];
  onResolve: (conflicts: ImportConflict[]) => void;
  isResolving: boolean;
}

function ConflictResolutionPanel({ conflicts, onResolve, isResolving }: ConflictResolutionPanelProps) {
  const [resolvedConflicts, setResolvedConflicts] = useState<ImportConflict[]>(conflicts);

  const updateConflictAction = (index: number, action: ImportConflict['action']) => {
    setResolvedConflicts(prev =>
      prev.map((conflict, i) =>
        i === index ? { ...conflict, action } : conflict
      )
    );
  };

  const handleResolve = () => {
    onResolve(resolvedConflicts);
  };

  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Conflicts Detected ({conflicts.length})
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            The following items already exist. Choose how to handle each conflict:
          </p>

          <div className="mt-4 space-y-3">
            {resolvedConflicts.map((conflict, index) => (
              <div key={`${conflict.type}-${conflict.id}`} className="bg-white p-3 rounded border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)}: {conflict.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ID: {conflict.id}
                    </p>
                  </div>

                  <div className="ml-4">
                    <select
                      value={conflict.action}
                      onChange={(e) => updateConflictAction(index, e.target.value as ImportConflict['action'])}
                      className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="skip">Skip (keep existing)</option>
                      <option value="overwrite">Overwrite existing</option>
                      <option value="rename">Rename imported item</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResolving ? 'Resolving...' : 'Continue Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
