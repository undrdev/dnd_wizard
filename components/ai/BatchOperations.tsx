import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon, 
  StopIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import type { ParsedContent } from '@/lib/aiParsers';

interface BatchItem {
  id: string;
  type: 'npc' | 'quest' | 'location' | 'campaign';
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  result?: ParsedContent;
  error?: string;
}

interface BatchOperationsProps {
  onGenerateBatch: (items: Omit<BatchItem, 'id' | 'status' | 'result' | 'error'>[]) => Promise<void>;
  onAcceptItem: (itemId: string, content: ParsedContent) => void;
  onRejectItem: (itemId: string) => void;
  className?: string;
}

export function BatchOperations({ 
  onGenerateBatch, 
  onAcceptItem, 
  onRejectItem, 
  className = '' 
}: BatchOperationsProps) {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemType, setNewItemType] = useState<BatchItem['type']>('npc');
  const [newItemPrompt, setNewItemPrompt] = useState('');

  const addItem = () => {
    if (!newItemPrompt.trim()) return;

    const newItem: BatchItem = {
      id: Date.now().toString(),
      type: newItemType,
      prompt: newItemPrompt.trim(),
      status: 'pending',
    };

    setBatchItems(prev => [...prev, newItem]);
    setNewItemPrompt('');
    setShowAddForm(false);
  };

  const removeItem = (itemId: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCompleted = () => {
    setBatchItems(prev => prev.filter(item => item.status !== 'completed'));
  };

  const clearAll = () => {
    setBatchItems([]);
  };

  const startBatchGeneration = async () => {
    if (batchItems.length === 0) return;

    setIsGenerating(true);
    
    // Update all items to generating status
    setBatchItems(prev => prev.map(item => ({ ...item, status: 'generating' as const })));

    try {
      const itemsToGenerate = batchItems.map(({ id, ...item }) => item);
      await onGenerateBatch(itemsToGenerate);
      
      // Update items to completed status (this would be handled by the callback)
      setBatchItems(prev => prev.map(item => ({ ...item, status: 'completed' as const })));
    } catch (error) {
      // Update items to failed status
      setBatchItems(prev => prev.map(item => ({ 
        ...item, 
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Generation failed'
      })));
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'generating':
        return <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />;
      case 'completed':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XMarkIcon className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeIcon = (type: BatchItem['type']) => {
    const icons = {
      npc: '👤',
      quest: '📜',
      location: '🏰',
      campaign: '🎭',
    };
    return icons[type];
  };

  const getTypeColor = (type: BatchItem['type']) => {
    const colors = {
      npc: 'bg-blue-100 text-blue-800',
      quest: 'bg-purple-100 text-purple-800',
      location: 'bg-green-100 text-green-800',
      campaign: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type];
  };

  const pendingCount = batchItems.filter(item => item.status === 'pending').length;
  const generatingCount = batchItems.filter(item => item.status === 'generating').length;
  const completedCount = batchItems.filter(item => item.status === 'completed').length;
  const failedCount = batchItems.filter(item => item.status === 'failed').length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Batch Operations</h3>
          <p className="text-sm text-gray-500">Generate multiple items at once</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Item
          </button>
          <button
            onClick={startBatchGeneration}
            disabled={isGenerating || pendingCount === 0}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <StopIcon className="h-4 w-4 mr-1" />
                Generating...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-1" />
                Start Batch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {batchItems.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">Total: {batchItems.length}</span>
              {pendingCount > 0 && (
                <span className="text-gray-500">Pending: {pendingCount}</span>
              )}
              {generatingCount > 0 && (
                <span className="text-blue-600">Generating: {generatingCount}</span>
              )}
              {completedCount > 0 && (
                <span className="text-green-600">Completed: {completedCount}</span>
              )}
              {failedCount > 0 && (
                <span className="text-red-600">Failed: {failedCount}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearCompleted}
                disabled={completedCount === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Clear Completed
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as BatchItem['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="npc">NPC</option>
                <option value="quest">Quest</option>
                <option value="location">Location</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
              <textarea
                value={newItemPrompt}
                onChange={(e) => setNewItemPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the prompt for this item..."
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={addItem}
                disabled={!newItemPrompt.trim()}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="p-4">
        {batchItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No items in batch. Add some items to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batchItems.map(item => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(item.status)}
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(item.type)}`}>
                        {item.type.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-800 mb-2">{item.prompt}</p>
                    
                    {item.error && (
                      <p className="text-sm text-red-600 mb-2">Error: {item.error}</p>
                    )}

                    {item.result && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Content:</h4>
                        <div className="text-xs text-gray-600">
                          {item.result.npcs && item.result.npcs.length > 0 && (
                            <div>NPCs: {item.result.npcs.length}</div>
                          )}
                          {item.result.quests && item.result.quests.length > 0 && (
                            <div>Quests: {item.result.quests.length}</div>
                          )}
                          {item.result.locations && item.result.locations.length > 0 && (
                            <div>Locations: {item.result.locations.length}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 ml-4">
                    {item.status === 'completed' && item.result && (
                      <>
                        <button
                          onClick={() => onAcceptItem(item.id, item.result!)}
                          className="p-1 text-green-600 hover:text-green-700 rounded"
                          title="Accept item"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRejectItem(item.id)}
                          className="p-1 text-red-600 hover:text-red-700 rounded"
                          title="Reject item"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Remove item"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
