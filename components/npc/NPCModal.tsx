import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useNPCs } from '@/hooks/useNPCs';
import { PortraitUpload } from './PortraitUpload';
import { NPCRelationships } from './NPCRelationships';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { EnhancedNPC, Location } from '@/types';
import { generateNPCStats } from '@/lib/npcUtils';

interface NPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  npc?: EnhancedNPC | null;
  mode: 'create' | 'edit';
}

interface NPCFormData {
  name: string;
  role: string;
  locationId: string;
  personality: string;
  notes: string;
  backstory: string;
  goals: string[];
  secrets: string[];
  portraitUrl?: string;
  stats: Record<string, any>;
}

export function NPCModal({ isOpen, onClose, npc, mode }: NPCModalProps) {
  const { locations } = useAppStore();
  const { 
    npcs, 
    createNPC, 
    updateNPC, 
    addRelationship, 
    updateRelationship, 
    removeRelationship,
    isCreating, 
    isUpdating 
  } = useNPCs();

  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'relationships'>('basic');
  const [formData, setFormData] = useState<NPCFormData>({
    name: '',
    role: '',
    locationId: '',
    personality: '',
    notes: '',
    backstory: '',
    goals: [],
    secrets: [],
    portraitUrl: '',
    stats: generateNPCStats(''),
  });

  const [goalInput, setGoalInput] = useState('');
  const [secretInput, setSecretInput] = useState('');

  // Initialize form data when NPC changes
  useEffect(() => {
    if (mode === 'edit' && npc) {
      setFormData({
        name: npc.name,
        role: npc.role,
        locationId: npc.locationId,
        personality: npc.personality,
        notes: npc.notes || '',
        backstory: npc.backstory || '',
        goals: npc.goals || [],
        secrets: npc.secrets || [],
        portraitUrl: npc.portraitUrl || '',
        stats: npc.stats || generateNPCStats(npc.role),
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        role: '',
        locationId: '',
        personality: '',
        notes: '',
        backstory: '',
        goals: [],
        secrets: [],
        portraitUrl: '',
        stats: generateNPCStats(''),
      });
    }
  }, [mode, npc]);

  // Update stats when role changes
  useEffect(() => {
    if (mode === 'create' && formData.role) {
      setFormData(prev => ({
        ...prev,
        stats: generateNPCStats(formData.role),
      }));
    }
  }, [formData.role, mode]);

  const handleInputChange = (field: keyof NPCFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: value },
    }));
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, goalInput.trim()],
      }));
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const addSecret = () => {
    if (secretInput.trim()) {
      setFormData(prev => ({
        ...prev,
        secrets: [...prev.secrets, secretInput.trim()],
      }));
      setSecretInput('');
    }
  };

  const removeSecret = (index: number) => {
    setFormData(prev => ({
      ...prev,
      secrets: prev.secrets.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const npcData = {
      ...formData,
      portraitUrl: formData.portraitUrl || undefined,
    };

    let success = false;
    if (mode === 'create') {
      const npcId = await createNPC(npcData);
      success = !!npcId;
    } else if (mode === 'edit' && npc) {
      success = await updateNPC(npc.id, npcData);
    }

    if (success) {
      onClose();
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-6 w-6 text-gray-400" />
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {mode === 'create' ? 'Create New NPC' : `Edit ${npc?.name || 'NPC'}`}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['basic', 'details', 'relationships'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="input-primary"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role *
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="input-primary"
                        placeholder="e.g., Merchant, Guard, Noble"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <select
                        value={formData.locationId}
                        onChange={(e) => handleInputChange('locationId', e.target.value)}
                        className="input-primary"
                        required
                        disabled={isLoading}
                      >
                        <option value="">Select a location...</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name} ({location.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Portrait Upload */}
                    <div>
                      <PortraitUpload
                        currentPortraitUrl={formData.portraitUrl}
                        onPortraitChange={(url) => handleInputChange('portraitUrl', url || '')}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Personality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personality
                    </label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) => handleInputChange('personality', e.target.value)}
                      className="input-primary"
                      rows={3}
                      placeholder="Describe the NPC's personality traits..."
                      disabled={isLoading}
                    />
                  </div>

                  {/* Stats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Stats
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(formData.stats).map(([stat, value]) => (
                        <div key={stat}>
                          <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                            {stat}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={value}
                            onChange={(e) => handleStatChange(stat, parseInt(e.target.value) || 1)}
                            className="input-primary text-sm"
                            disabled={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="input-primary"
                      rows={4}
                      placeholder="General notes about this NPC..."
                      disabled={isLoading}
                    />
                  </div>

                  {/* Backstory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Backstory
                    </label>
                    <textarea
                      value={formData.backstory}
                      onChange={(e) => handleInputChange('backstory', e.target.value)}
                      className="input-primary"
                      rows={4}
                      placeholder="The NPC's background and history..."
                      disabled={isLoading}
                    />
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goals
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={goalInput}
                          onChange={(e) => setGoalInput(e.target.value)}
                          className="input-primary flex-1"
                          placeholder="Add a goal..."
                          disabled={isLoading}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                        />
                        <button
                          type="button"
                          onClick={addGoal}
                          className="btn-secondary"
                          disabled={isLoading || !goalInput.trim()}
                        >
                          Add
                        </button>
                      </div>
                      {formData.goals.length > 0 && (
                        <div className="space-y-1">
                          {formData.goals.map((goal, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{goal}</span>
                              <button
                                type="button"
                                onClick={() => removeGoal(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                                disabled={isLoading}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secrets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secrets
                    </label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={secretInput}
                          onChange={(e) => setSecretInput(e.target.value)}
                          className="input-primary flex-1"
                          placeholder="Add a secret..."
                          disabled={isLoading}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecret())}
                        />
                        <button
                          type="button"
                          onClick={addSecret}
                          className="btn-secondary"
                          disabled={isLoading || !secretInput.trim()}
                        >
                          Add
                        </button>
                      </div>
                      {formData.secrets.length > 0 && (
                        <div className="space-y-1">
                          {formData.secrets.map((secret, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{secret}</span>
                              <button
                                type="button"
                                onClick={() => removeSecret(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                                disabled={isLoading}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Relationships Tab */}
              {activeTab === 'relationships' && mode === 'edit' && npc && (
                <NPCRelationships
                  npc={npc}
                  allNPCs={npcs}
                  onAddRelationship={(rel) => addRelationship(npc.id, rel)}
                  onUpdateRelationship={(relId, data) => updateRelationship(npc.id, relId, data)}
                  onRemoveRelationship={(relId) => removeRelationship(npc.id, relId)}
                  disabled={isLoading}
                />
              )}

              {activeTab === 'relationships' && mode === 'create' && (
                <div className="text-center py-8 text-gray-500">
                  <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Save the NPC first to manage relationships</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary flex items-center"
              disabled={isLoading || !formData.name || !formData.role || !formData.locationId}
            >
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {mode === 'create' ? 'Create NPC' : 'Save Changes'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
