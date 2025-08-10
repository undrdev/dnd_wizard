import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useNPCs } from '@/hooks/useNPCs';
import { NPCCard } from './NPCCard';
import { NPCModal } from './NPCModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { EnhancedNPC, NPCRelationship } from '@/types';
import type { NPCFilterCriteria, NPCSortBy } from '@/lib/npcUtils';

interface NPCListProps {
  className?: string;
}

export function NPCList({ className = '' }: NPCListProps) {
  const { locations, selectNPC } = useAppStore();
  const {
    filteredNPCs,
    searchTerm,
    setSearchTerm,
    filterCriteria,
    setFilterCriteria,
    sortBy,
    setSortBy,
    sortAscending,
    setSortAscending,
    deleteNPC,
    bulkDeleteNPCs,
    clearFilters,
    isLoading,
    isDeleting,
  } = useNPCs();

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingNPC, setEditingNPC] = useState<EnhancedNPC | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNPCs, setSelectedNPCs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle NPC selection
  const handleNPCSelect = (npc: EnhancedNPC) => {
    selectNPC(npc.id);
  };

  // Handle NPC edit
  const handleNPCEdit = (npc: EnhancedNPC) => {
    setEditingNPC(npc);
    setShowModal(true);
  };

  // Handle NPC delete
  const handleNPCDelete = async (npc: EnhancedNPC) => {
    if (window.confirm(`Are you sure you want to delete ${npc.name}?`)) {
      await deleteNPC(npc.id);
    }
  };

  // Handle bulk selection
  const handleBulkSelect = (npcId: string, selected: boolean) => {
    const newSelected = new Set(selectedNPCs);
    if (selected) {
      newSelected.add(npcId);
    } else {
      newSelected.delete(npcId);
    }
    setSelectedNPCs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedNPCs.size === filteredNPCs.length) {
      setSelectedNPCs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedNPCs(new Set(filteredNPCs.map(npc => npc.id)));
      setShowBulkActions(true);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedNPCs.size} NPCs?`)) {
      await bulkDeleteNPCs(Array.from(selectedNPCs));
      setSelectedNPCs(new Set());
      setShowBulkActions(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setEditingNPC(null);
  };

  // Handle sort change
  const handleSortChange = (newSortBy: NPCSortBy) => {
    if (sortBy === newSortBy) {
      setSortAscending(!sortAscending);
    } else {
      setSortBy(newSortBy);
      setSortAscending(true);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">
            NPCs ({filteredNPCs.length})
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Add NPC Button */}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add NPC
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NPCs by name, role, personality..."
            className="input-primary pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary ${showFilters ? 'bg-primary-50 text-primary-600' : ''}`}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortAscending ? 'asc' : 'desc'}`}
              onChange={(e) => {
                const [newSortBy, direction] = e.target.value.split('-');
                setSortBy(newSortBy as NPCSortBy);
                setSortAscending(direction === 'asc');
              }}
              className="input-primary text-sm"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="role-asc">Role (A-Z)</option>
              <option value="role-desc">Role (Z-A)</option>
              <option value="location-asc">Location (A-Z)</option>
              <option value="location-desc">Location (Z-A)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>

            {/* Clear Filters */}
            {(searchTerm || Object.keys(filterCriteria).length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedNPCs.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="btn-secondary text-red-600 hover:bg-red-50"
                disabled={isDeleting}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={filterCriteria.locationId || ''}
                  onChange={(e) => setFilterCriteria({ ...filterCriteria, locationId: e.target.value || undefined })}
                  className="input-primary"
                >
                  <option value="">All locations</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Relationship Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has Relationship Type
                </label>
                <select
                  value={filterCriteria.relationshipType || ''}
                  onChange={(e) => setFilterCriteria({ ...filterCriteria, relationshipType: e.target.value as NPCRelationship['type'] || undefined })}
                  className="input-primary"
                >
                  <option value="">Any</option>
                  <option value="ally">Ally</option>
                  <option value="enemy">Enemy</option>
                  <option value="neutral">Neutral</option>
                  <option value="romantic">Romantic</option>
                  <option value="family">Family</option>
                  <option value="business">Business</option>
                </select>
              </div>

              {/* Other Filters */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Other Filters
                </label>
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterCriteria.hasPortrait === true}
                      onChange={(e) => setFilterCriteria({ ...filterCriteria, hasPortrait: e.target.checked ? true : undefined })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has portrait</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterCriteria.hasRelationships === true}
                      onChange={(e) => setFilterCriteria({ ...filterCriteria, hasRelationships: e.target.checked ? true : undefined })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has relationships</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Selection Header */}
      {filteredNPCs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={selectedNPCs.size === filteredNPCs.length && filteredNPCs.length > 0}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-600">Select all</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* NPC List */}
      {!isLoading && (
        <>
          {filteredNPCs.length > 0 ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {filteredNPCs.map((npc) => (
                <div key={npc.id} className="relative">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedNPCs.has(npc.id)}
                      onChange={(e) => handleBulkSelect(npc.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </div>

                  <NPCCard
                    npc={npc}
                    onEdit={() => handleNPCEdit(npc)}
                    onDelete={() => handleNPCDelete(npc)}
                    onSelect={() => handleNPCSelect(npc)}
                    compact={viewMode === 'list'}
                    className="ml-6"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No NPCs found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || Object.keys(filterCriteria).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first NPC'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Create NPC
              </button>
            </div>
          )}
        </>
      )}

      {/* NPC Modal */}
      <NPCModal
        isOpen={showModal}
        onClose={handleModalClose}
        npc={editingNPC}
        mode={editingNPC ? 'edit' : 'create'}
      />
    </div>
  );
}
