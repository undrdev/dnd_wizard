import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useQuests } from '@/hooks/useQuests';
import { QuestCard } from './QuestCard';
import { QuestModal } from './QuestModal';
import type { EnhancedQuest, QuestFilters } from '@/types';

interface QuestListProps {
  compact?: boolean;
}

export function QuestList({ compact = false }: QuestListProps) {
  const { npcs, locations } = useAppStore();
  const { 
    quests, 
    questProgress, 
    searchOptions, 
    updateSearchOptions, 
    clearSearch,
    deleteQuest,
  } = useQuests();

  const [showModal, setShowModal] = useState(false);
  const [editingQuest, setEditingQuest] = useState<EnhancedQuest | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<QuestFilters>({});

  const handleCreateQuest = () => {
    setEditingQuest(undefined);
    setShowModal(true);
  };

  const handleEditQuest = (quest: EnhancedQuest) => {
    setEditingQuest(quest);
    setShowModal(true);
  };

  const handleDeleteQuest = async (questId: string) => {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      await deleteQuest(questId);
    }
  };

  const handleSearchChange = (query: string) => {
    updateSearchOptions({ query });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateSearchOptions({ sortBy: sortBy as any, sortOrder });
  };

  const handleFilterChange = (newFilters: Partial<QuestFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateSearchOptions({ filters: updatedFilters });
  };

  const clearAllFilters = () => {
    setFilters({});
    clearSearch();
    setShowFilters(false);
  };

  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null;
  }).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Quests ({quests.length})
          </h2>
          <button
            onClick={handleCreateQuest}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            New Quest
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchOptions.query || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Search quests..."
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'text-primary-700 bg-primary-50 border-primary-300'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {(searchOptions.query || activeFilterCount > 0) && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-2 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={`${searchOptions.sortBy}-${searchOptions.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleSortChange(sortBy, sortOrder as 'asc' | 'desc');
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="importance-desc">Importance High-Low</option>
              <option value="importance-asc">Importance Low-High</option>
              <option value="status-asc">Status</option>
              <option value="progress-desc">Progress High-Low</option>
              <option value="progress-asc">Progress Low-High</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-1">
                  {['active', 'completed', 'failed'].map((status) => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status as any) || false}
                        onChange={(e) => {
                          const currentStatus = filters.status || [];
                          if (e.target.checked) {
                            handleFilterChange({ status: [...currentStatus, status as any] });
                          } else {
                            handleFilterChange({ status: currentStatus.filter(s => s !== status) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Importance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Importance</label>
                <div className="space-y-1">
                  {['high', 'medium', 'low'].map((importance) => (
                    <label key={importance} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.importance?.includes(importance as any) || false}
                        onChange={(e) => {
                          const currentImportance = filters.importance || [];
                          if (e.target.checked) {
                            handleFilterChange({ importance: [...currentImportance, importance as any] });
                          } else {
                            handleFilterChange({ importance: currentImportance.filter(i => i !== importance) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{importance}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Other</label>
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasRewards || false}
                      onChange={(e) => handleFilterChange({ hasRewards: e.target.checked || undefined })}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Rewards</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasDependencies || false}
                      onChange={(e) => handleFilterChange({ hasDependencies: e.target.checked || undefined })}
                      className="mr-2"
                    />
                    <span className="text-sm">Has Dependencies</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quest List */}
      <div className="flex-1 overflow-y-auto p-4">
        {quests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <AdjustmentsHorizontalIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quests found</h3>
            <p className="text-gray-600 mb-4">
              {searchOptions.query || activeFilterCount > 0
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first quest'
              }
            </p>
            {!searchOptions.query && activeFilterCount === 0 && (
              <button
                onClick={handleCreateQuest}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Quest
              </button>
            )}
          </div>
        ) : (
          <div className={`space-y-${compact ? '2' : '4'}`}>
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={questProgress[quest.id]}
                onEdit={handleEditQuest}
                onDelete={handleDeleteQuest}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quest Modal */}
      <QuestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        quest={editingQuest}
        mode={editingQuest ? 'edit' : 'create'}
      />
    </div>
  );
}
