import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useQuests } from '@/hooks/useQuests';
import type { EnhancedQuest, EnhancedQuestFormData, QuestMilestone, NPC, EnhancedLocation, Quest } from '@/types';

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest?: EnhancedQuest;
  mode: 'create' | 'edit';
}

export function QuestModal({ isOpen, onClose, quest, mode }: QuestModalProps) {
  const { npcs, locations, currentCampaign } = useAppStore();
  const { createQuest, updateQuest, getAvailableQuestDependencies, createMilestone } = useQuests();

  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'dependencies' | 'rewards'>('basic');
  const [formData, setFormData] = useState<EnhancedQuestFormData>({
    title: '',
    description: '',
    importance: 'medium',
    status: 'active',
    startNpcId: '',
    involvedNpcIds: [],
    locationIds: [],
    dependencies: [],
    milestones: [],
    xpReward: 0,
    goldReward: 0,
    itemRewards: [],
    rewards: '',
    notes: '',
    playerNotes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when quest changes
  useEffect(() => {
    if (quest && mode === 'edit') {
      setFormData({
        title: quest.title,
        description: quest.description,
        importance: quest.importance,
        status: quest.status,
        startNpcId: quest.startNpcId,
        involvedNpcIds: quest.involvedNpcIds,
        locationIds: quest.locationIds,
        dependencies: quest.dependencies || [],
        milestones: quest.milestones || [],
        xpReward: quest.xpReward || 0,
        goldReward: quest.goldReward || 0,
        itemRewards: quest.itemRewards || [],
        rewards: quest.rewards || '',
        notes: quest.notes || '',
        playerNotes: quest.playerNotes || '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        title: '',
        description: '',
        importance: 'medium',
        status: 'active',
        startNpcId: '',
        involvedNpcIds: [],
        locationIds: [],
        dependencies: [],
        milestones: [],
        xpReward: 0,
        goldReward: 0,
        itemRewards: [],
        rewards: '',
        notes: '',
        playerNotes: '',
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [quest, mode, isOpen]);

  const campaignNpcs = npcs.filter(npc => npc.campaignId === currentCampaign?.id);
  const campaignLocations = locations.filter(loc => loc.campaignId === currentCampaign?.id);
  const availableQuestDependencies = getAvailableQuestDependencies(quest?.id);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.startNpcId) {
      newErrors.startNpcId = 'Start NPC is required';
    }

    if (formData.locationIds.length === 0) {
      newErrors.locationIds = 'At least one location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createQuest(formData);
      } else if (quest) {
        await updateQuest(quest.id, formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving quest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMilestone = () => {
    const newMilestone = createMilestone(`Milestone ${formData.milestones.length + 1}`);
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone],
    }));
  };

  const updateMilestone = (index: number, updates: Partial<Omit<QuestMilestone, 'id'>>) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) =>
        i === index ? { ...milestone, ...updates } : milestone
      ),
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const tabs = [
    { id: 'basic' as const, name: 'Basic Info' },
    { id: 'details' as const, name: 'Details' },
    { id: 'dependencies' as const, name: 'Dependencies' },
    { id: 'rewards' as const, name: 'Rewards' },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Quest' : 'Edit Quest'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <BasicInfoTab
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  npcs={campaignNpcs}
                  locations={campaignLocations}
                />
              )}

              {activeTab === 'details' && (
                <DetailsTab
                  formData={formData}
                  setFormData={setFormData}
                  addMilestone={addMilestone}
                  updateMilestone={updateMilestone}
                  removeMilestone={removeMilestone}
                />
              )}

              {activeTab === 'dependencies' && (
                <DependenciesTab
                  formData={formData}
                  setFormData={setFormData}
                  availableQuests={availableQuestDependencies}
                />
              )}

              {activeTab === 'rewards' && (
                <RewardsTab
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Quest' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Basic Info Tab Component
interface BasicInfoTabProps {
  formData: EnhancedQuestFormData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuestFormData>>;
  errors: Record<string, string>;
  npcs: NPC[];
  locations: EnhancedLocation[];
}

function BasicInfoTab({ formData, setFormData, errors, npcs, locations }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Quest Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter quest title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Describe the quest"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="importance" className="block text-sm font-medium text-gray-700 mb-1">
            Importance
          </label>
          <select
            id="importance"
            value={formData.importance}
            onChange={(e) => setFormData(prev => ({ ...prev, importance: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="startNpcId" className="block text-sm font-medium text-gray-700 mb-1">
          Quest Giver *
        </label>
        <select
          id="startNpcId"
          value={formData.startNpcId}
          onChange={(e) => setFormData(prev => ({ ...prev, startNpcId: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.startNpcId ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select quest giver</option>
          {npcs.map((npc) => (
            <option key={npc.id} value={npc.id}>
              {npc.name} ({npc.role})
            </option>
          ))}
        </select>
        {errors.startNpcId && <p className="mt-1 text-sm text-red-600">{errors.startNpcId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Involved NPCs
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
          {npcs.map((npc) => (
            <label key={npc.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.involvedNpcIds.includes(npc.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      involvedNpcIds: [...prev.involvedNpcIds, npc.id],
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      involvedNpcIds: prev.involvedNpcIds.filter(id => id !== npc.id),
                    }));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{npc.name} ({npc.role})</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quest Locations *
        </label>
        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
          {locations.map((location) => (
            <label key={location.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.locationIds.includes(location.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      locationIds: [...prev.locationIds, location.id],
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      locationIds: prev.locationIds.filter(id => id !== location.id),
                    }));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{location.name} ({location.type})</span>
            </label>
          ))}
        </div>
        {errors.locationIds && <p className="mt-1 text-sm text-red-600">{errors.locationIds}</p>}
      </div>
    </div>
  );
}

// Details Tab Component
interface DetailsTabProps {
  formData: EnhancedQuestFormData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuestFormData>>;
  addMilestone: () => void;
  updateMilestone: (index: number, updates: Partial<Omit<QuestMilestone, 'id'>>) => void;
  removeMilestone: (index: number) => void;
}

function DetailsTab({ formData, setFormData, addMilestone, updateMilestone, removeMilestone }: DetailsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          DM Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Private notes for the DM"
        />
      </div>

      <div>
        <label htmlFor="playerNotes" className="block text-sm font-medium text-gray-700 mb-1">
          Player Notes
        </label>
        <textarea
          id="playerNotes"
          rows={3}
          value={formData.playerNotes}
          onChange={(e) => setFormData(prev => ({ ...prev, playerNotes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Notes visible to players"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Quest Milestones
          </label>
          <button
            type="button"
            onClick={addMilestone}
            className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add Milestone
          </button>
        </div>

        <div className="space-y-3">
          {formData.milestones.map((milestone, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-start justify-between mb-2">
                <input
                  type="text"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, { title: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Milestone title"
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={milestone.description}
                onChange={(e) => updateMilestone(index, { description: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Milestone description"
              />
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={milestone.completed}
                  onChange={(e) => updateMilestone(index, {
                    completed: e.target.checked,
                    completedAt: e.target.checked ? new Date() : undefined,
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Completed</span>
              </label>
            </div>
          ))}
          {formData.milestones.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No milestones yet. Click "Add Milestone" to create one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Dependencies Tab Component
interface DependenciesTabProps {
  formData: EnhancedQuestFormData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuestFormData>>;
  availableQuests: Quest[];
}

function DependenciesTab({ formData, setFormData, availableQuests }: DependenciesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quest Dependencies
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Select quests that must be completed before this quest can be started.
        </p>

        <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-3">
          {availableQuests.map((quest) => (
            <label key={quest.id} className="flex items-start">
              <input
                type="checkbox"
                checked={formData.dependencies.includes(quest.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData(prev => ({
                      ...prev,
                      dependencies: [...prev.dependencies, quest.id],
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      dependencies: prev.dependencies.filter(id => id !== quest.id),
                    }));
                  }
                }}
                className="mr-3 mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{quest.title}</div>
                <div className="text-xs text-gray-500">{quest.description}</div>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    quest.importance === 'high' ? 'bg-red-100 text-red-800' :
                    quest.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {quest.importance}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    quest.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    quest.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quest.status}
                  </span>
                </div>
              </div>
            </label>
          ))}
          {availableQuests.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No other quests available for dependencies.
            </p>
          )}
        </div>

        {formData.dependencies.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Dependencies:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {formData.dependencies.map(depId => {
                const quest = availableQuests.find(q => q.id === depId);
                return quest ? (
                  <li key={depId}>• {quest.title}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Rewards Tab Component
interface RewardsTabProps {
  formData: EnhancedQuestFormData;
  setFormData: React.Dispatch<React.SetStateAction<EnhancedQuestFormData>>;
}

function RewardsTab({ formData, setFormData }: RewardsTabProps) {
  const addItemReward = () => {
    setFormData(prev => ({
      ...prev,
      itemRewards: [...prev.itemRewards, ''],
    }));
  };

  const updateItemReward = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      itemRewards: prev.itemRewards.map((item, i) => i === index ? value : item),
    }));
  };

  const removeItemReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itemRewards: prev.itemRewards.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="xpReward" className="block text-sm font-medium text-gray-700 mb-1">
            XP Reward
          </label>
          <input
            type="number"
            id="xpReward"
            min="0"
            value={formData.xpReward}
            onChange={(e) => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="goldReward" className="block text-sm font-medium text-gray-700 mb-1">
            Gold Reward
          </label>
          <input
            type="number"
            id="goldReward"
            min="0"
            value={formData.goldReward}
            onChange={(e) => setFormData(prev => ({ ...prev, goldReward: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Item Rewards
          </label>
          <button
            type="button"
            onClick={addItemReward}
            className="px-3 py-1 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Add Item
          </button>
        </div>

        <div className="space-y-2">
          {formData.itemRewards.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateItemReward(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Item name or description"
              />
              <button
                type="button"
                onClick={() => removeItemReward(index)}
                className="text-red-600 hover:text-red-800 focus:outline-none"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          {formData.itemRewards.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No item rewards yet. Click "Add Item" to add one.
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="rewards" className="block text-sm font-medium text-gray-700 mb-1">
          Other Rewards
        </label>
        <textarea
          id="rewards"
          rows={3}
          value={formData.rewards}
          onChange={(e) => setFormData(prev => ({ ...prev, rewards: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Describe any other rewards (reputation, story progression, etc.)"
        />
      </div>
    </div>
  );
}
