import React, { useState } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import type { NPC, NPCRelationship } from '@/types';

interface NPCCreationFormProps {
  onSubmit: (npc: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<NPC>;
  className?: string;
}

export function NPCCreationForm({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  className = '' 
}: NPCCreationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    role: initialData.role || '',
    race: initialData.race || '',
    class: initialData.class || '',
    level: initialData.level || 1,
    personality: initialData.personality || '',
    appearance: initialData.appearance || '',
    background: initialData.background || '',
    motivations: initialData.motivations || '',
    secrets: initialData.secrets || '',
    relationships: initialData.relationships || [],
    stats: initialData.stats || {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    equipment: initialData.equipment || '',
    abilities: initialData.abilities || '',
    notes: initialData.notes || '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (formData.level < 1 || formData.level > 20) {
      newErrors.level = 'Level must be between 1 and 20';
    }

    // Validate stats
    Object.entries(formData.stats).forEach(([stat, value]) => {
      if (value < 1 || value > 20) {
        newErrors[`stats.${stat}`] = `${stat.charAt(0).toUpperCase() + stat.slice(1)} must be between 1 and 20`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const npc: Omit<NPC, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      role: formData.role.trim(),
      race: formData.race.trim(),
      class: formData.class.trim(),
      level: formData.level,
      personality: formData.personality.trim(),
      appearance: formData.appearance.trim(),
      background: formData.background.trim(),
      motivations: formData.motivations.trim(),
      secrets: formData.secrets.trim(),
      relationships: formData.relationships,
      stats: formData.stats,
      equipment: formData.equipment.trim(),
      abilities: formData.abilities.trim(),
      notes: formData.notes.trim(),
    };

    onSubmit(npc);
  };

  const updateStat = (stat: keyof typeof formData.stats, value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: Math.max(1, Math.min(20, value))
      }
    }));
  };

  const addRelationship = () => {
    setFormData(prev => ({
      ...prev,
      relationships: [...prev.relationships, {
        id: Date.now().toString(),
        targetNPCId: '',
        targetNPCName: '',
        relationshipType: 'ally',
        strength: 'strong',
        description: '',
        isMutual: false,
      }]
    }));
  };

  const updateRelationship = (index: number, field: keyof NPCRelationship, value: any) => {
    setFormData(prev => ({
      ...prev,
      relationships: prev.relationships.map((rel, i) => 
        i === index ? { ...rel, [field]: value } : rel
      )
    }));
  };

  const removeRelationship = (index: number) => {
    setFormData(prev => ({
      ...prev,
      relationships: prev.relationships.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <UserIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Create New NPC</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="NPC Name"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Merchant, Guard, Noble"
              />
              {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Race
              </label>
              <input
                type="text"
                value={formData.race}
                onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Human, Elf, Dwarf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Fighter, Wizard, Rogue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.level && <p className="text-sm text-red-600 mt-1">{errors.level}</p>}
            </div>
          </div>

          {/* Personality & Appearance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personality
              </label>
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the NPC's personality, quirks, and mannerisms..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appearance
              </label>
              <textarea
                value={formData.appearance}
                onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the NPC's physical appearance..."
              />
            </div>
          </div>

          {/* Background & Motivations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background
            </label>
            <textarea
              value={formData.background}
              onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the NPC's history and background..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivations
            </label>
            <textarea
              value={formData.motivations}
              onChange={(e) => setFormData(prev => ({ ...prev, motivations: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What drives this NPC? What are their goals?"
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
              {/* Stats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ability Scores
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(formData.stats).map(([stat, value]) => (
                    <div key={stat}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={value}
                        onChange={(e) => updateStat(stat as keyof typeof formData.stats, parseInt(e.target.value) || 10)}
                        className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[`stats.${stat}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`stats.${stat}`] && (
                        <p className="text-xs text-red-600 mt-1">{errors[`stats.${stat}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment & Abilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment
                  </label>
                  <textarea
                    value={formData.equipment}
                    onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="List the NPC's equipment and items..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Abilities
                  </label>
                  <textarea
                    value={formData.abilities}
                    onChange={(e) => setFormData(prev => ({ ...prev, abilities: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe any special abilities or spells..."
                  />
                </div>
              </div>

              {/* Secrets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secrets
                </label>
                <textarea
                  value={formData.secrets}
                  onChange={(e) => setFormData(prev => ({ ...prev, secrets: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any hidden information about this NPC..."
                />
              </div>

              {/* Relationships */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Relationships
                  </label>
                  <button
                    type="button"
                    onClick={addRelationship}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Relationship
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.relationships.map((relationship, index) => (
                    <div key={index} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Relationship {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeRelationship(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={relationship.targetNPCName}
                          onChange={(e) => updateRelationship(index, 'targetNPCName', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="NPC Name"
                        />
                        <select
                          value={relationship.relationshipType}
                          onChange={(e) => updateRelationship(index, 'relationshipType', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="ally">Ally</option>
                          <option value="enemy">Enemy</option>
                          <option value="friend">Friend</option>
                          <option value="family">Family</option>
                          <option value="mentor">Mentor</option>
                          <option value="student">Student</option>
                          <option value="rival">Rival</option>
                          <option value="lover">Lover</option>
                        </select>
                        <select
                          value={relationship.strength}
                          onChange={(e) => updateRelationship(index, 'strength', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="weak">Weak</option>
                          <option value="moderate">Moderate</option>
                          <option value="strong">Strong</option>
                        </select>
                        <input
                          type="text"
                          value={relationship.description}
                          onChange={(e) => updateRelationship(index, 'description', e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Description"
                        />
                      </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this NPC..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create NPC
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
