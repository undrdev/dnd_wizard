import React, { useState } from 'react';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import type { Quest } from '@/types';

interface QuestCreationFormProps {
  onSubmit: (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<Quest>;
  className?: string;
}

export function QuestCreationForm({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  className = '' 
}: QuestCreationFormProps) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    type: initialData.type || 'main',
    importance: initialData.importance || 'medium',
    difficulty: initialData.difficulty || 'medium',
    level: initialData.level || 1,
    estimatedDuration: initialData.estimatedDuration || '',
    questGiver: initialData.questGiver || '',
    objectives: initialData.objectives || [''],
    rewards: initialData.rewards || '',
    requirements: initialData.requirements || '',
    consequences: initialData.consequences || '',
    locations: initialData.locations || [''],
    npcs: initialData.npcs || [''],
    items: initialData.items || [''],
    notes: initialData.notes || '',
    isCompleted: initialData.isCompleted || false,
    dependencies: initialData.dependencies || [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.level < 1 || formData.level > 20) {
      newErrors.level = 'Level must be between 1 and 20';
    }

    if (formData.objectives.length === 0 || formData.objectives.every(obj => !obj.trim())) {
      newErrors.objectives = 'At least one objective is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      importance: formData.importance,
      difficulty: formData.difficulty,
      level: formData.level,
      estimatedDuration: formData.estimatedDuration.trim(),
      questGiver: formData.questGiver.trim(),
      objectives: formData.objectives.filter(obj => obj.trim()),
      rewards: formData.rewards.trim(),
      requirements: formData.requirements.trim(),
      consequences: formData.consequences.trim(),
      locations: formData.locations.filter(loc => loc.trim()),
      npcs: formData.npcs.filter(npc => npc.trim()),
      items: formData.items.filter(item => item.trim()),
      notes: formData.notes.trim(),
      isCompleted: formData.isCompleted,
      dependencies: formData.dependencies,
    };

    onSubmit(quest);
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, '']
    }));
  };

  const updateObjective = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => i === index ? value : obj)
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, '']
    }));
  };

  const updateLocation = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => i === index ? value : loc)
    }));
  };

  const removeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const addNPC = () => {
    setFormData(prev => ({
      ...prev,
      npcs: [...prev.npcs, '']
    }));
  };

  const updateNPC = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      npcs: prev.npcs.map((npc, i) => i === index ? value : npc)
    }));
  };

  const removeNPC = (index: number) => {
    setFormData(prev => ({
      ...prev,
      npcs: prev.npcs.filter((_, i) => i !== index)
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, '']
    }));
  };

  const updateItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <ClipboardDocumentListIcon className="h-6 w-6 text-purple-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Create New Quest</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Quest Title"
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quest Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Quest['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="main">Main Quest</option>
                <option value="side">Side Quest</option>
                <option value="faction">Faction Quest</option>
                <option value="personal">Personal Quest</option>
                <option value="world">World Quest</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importance
              </label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData(prev => ({ ...prev, importance: e.target.value as Quest['importance'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as Quest['difficulty'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="deadly">Deadly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Level
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.level && <p className="text-sm text-red-600 mt-1">{errors.level}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 2-3 sessions, 1 day in-game"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the quest, its background, and what the players need to know..."
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Quest Giver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quest Giver
            </label>
            <input
              type="text"
              value={formData.questGiver}
              onChange={(e) => setFormData(prev => ({ ...prev, questGiver: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Who gives this quest?"
            />
          </div>

          {/* Objectives */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Objectives *
              </label>
              <button
                type="button"
                onClick={addObjective}
                className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Objective
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.objectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder={`Objective ${index + 1}`}
                  />
                  {formData.objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.objectives && <p className="text-sm text-red-600 mt-1">{errors.objectives}</p>}
          </div>

          {/* Rewards & Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rewards
              </label>
              <textarea
                value={formData.rewards}
                onChange={(e) => setFormData(prev => ({ ...prev, rewards: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="What do the players receive for completing this quest?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="What must the players have or do to start this quest?"
              />
            </div>
          </div>

          {/* Consequences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consequences
            </label>
            <textarea
              value={formData.consequences}
              onChange={(e) => setFormData(prev => ({ ...prev, consequences: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="What happens if the quest is completed or failed?"
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              {showAdvanced ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-6 border-t border-gray-200 pt-4">
              {/* Locations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Related Locations
                  </label>
                  <button
                    type="button"
                    onClick={addLocation}
                    className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Location
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.locations.map((location, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => updateLocation(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Location name"
                      />
                      <button
                        type="button"
                        onClick={() => removeLocation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* NPCs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Related NPCs
                  </label>
                  <button
                    type="button"
                    onClick={addNPC}
                    className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add NPC
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.npcs.map((npc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={npc}
                        onChange={(e) => updateNPC(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="NPC name"
                      />
                      <button
                        type="button"
                        onClick={() => removeNPC(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Related Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Item name"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Additional notes about this quest..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Create Quest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
