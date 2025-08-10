import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, HeartIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { EnhancedNPC, NPCRelationship } from '@/types';
import {
  getRelationshipTypeDisplay,
  getRelationshipStrengthDisplay,
  createRelationship,
} from '@/lib/npcUtils';

interface NPCRelationshipsProps {
  npc: EnhancedNPC;
  allNPCs: EnhancedNPC[];
  onAddRelationship: (relationship: Omit<NPCRelationship, 'id' | 'createdAt'>) => void;
  onUpdateRelationship: (relationshipId: string, data: Partial<NPCRelationship>) => void;
  onRemoveRelationship: (relationshipId: string) => void;
  disabled?: boolean;
}

interface RelationshipFormData {
  targetNpcId: string;
  type: NPCRelationship['type'];
  strength: number;
  description: string;
}

export function NPCRelationships({
  npc,
  allNPCs,
  onAddRelationship,
  onUpdateRelationship,
  onRemoveRelationship,
  disabled = false,
}: NPCRelationshipsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<string | null>(null);
  const [formData, setFormData] = useState<RelationshipFormData>({
    targetNpcId: '',
    type: 'neutral',
    strength: 5,
    description: '',
  });

  // Available NPCs (excluding current NPC and already related NPCs)
  const availableNPCs = allNPCs.filter(n => 
    n.id !== npc.id && 
    !npc.relationships.some(rel => rel.targetNpcId === n.id)
  );

  // Get relationship type icon
  const getRelationshipIcon = (type: NPCRelationship['type']) => {
    switch (type) {
      case 'ally':
        return <div className="h-4 w-4 rounded-full bg-green-500" />;
      case 'enemy':
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
      case 'romantic':
        return <HeartIcon className="h-4 w-4 text-pink-500" />;
      case 'family':
        return <HeartIcon className="h-4 w-4 text-blue-500" />;
      case 'business':
        return <div className="h-4 w-4 rounded-full bg-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  // Get strength color
  const getStrengthColor = (strength: number) => {
    if (strength >= 8) return 'text-green-600';
    if (strength >= 6) return 'text-blue-600';
    if (strength >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.targetNpcId || !formData.description.trim()) {
      return;
    }

    if (editingRelationship) {
      onUpdateRelationship(editingRelationship, formData);
      setEditingRelationship(null);
    } else {
      onAddRelationship(formData);
      setShowAddForm(false);
    }

    setFormData({
      targetNpcId: '',
      type: 'neutral',
      strength: 5,
      description: '',
    });
  };

  // Start editing a relationship
  const startEdit = (relationship: NPCRelationship) => {
    setFormData({
      targetNpcId: relationship.targetNpcId,
      type: relationship.type,
      strength: relationship.strength,
      description: relationship.description,
    });
    setEditingRelationship(relationship.id);
    setShowAddForm(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingRelationship(null);
    setFormData({
      targetNpcId: '',
      type: 'neutral',
      strength: 5,
      description: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Relationships</h3>
        {!disabled && !showAddForm && availableNPCs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn-secondary text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Relationship
          </button>
        )}
      </div>

      {/* Existing Relationships */}
      {npc.relationships.length > 0 ? (
        <div className="space-y-3">
          {npc.relationships.map((relationship) => {
            const targetNPC = allNPCs.find(n => n.id === relationship.targetNpcId);
            if (!targetNPC) return null;

            return (
              <div
                key={relationship.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getRelationshipIcon(relationship.type)}
                      <span className="font-medium text-gray-900">
                        {targetNPC.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({getRelationshipTypeDisplay(relationship.type)})
                      </span>
                    </div>
                    
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Strength: </span>
                      <span className={`text-sm font-medium ${getStrengthColor(relationship.strength)}`}>
                        {relationship.strength}/10 ({getRelationshipStrengthDisplay(relationship.strength)})
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700">{relationship.description}</p>
                  </div>

                  {!disabled && (
                    <div className="flex space-x-1 ml-4">
                      <button
                        type="button"
                        onClick={() => startEdit(relationship)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit relationship"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveRelationship(relationship.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove relationship"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <HeartIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No relationships defined yet</p>
        </div>
      )}

      {/* Add/Edit Relationship Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">
            {editingRelationship ? 'Edit Relationship' : 'Add New Relationship'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target NPC Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NPC
              </label>
              <select
                value={formData.targetNpcId}
                onChange={(e) => setFormData(prev => ({ ...prev, targetNpcId: e.target.value }))}
                className="input-primary"
                required
                disabled={!!editingRelationship}
              >
                <option value="">Select an NPC...</option>
                {(editingRelationship ? allNPCs : availableNPCs).map(targetNPC => (
                  <option key={targetNPC.id} value={targetNPC.id}>
                    {targetNPC.name} ({targetNPC.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as NPCRelationship['type'] }))}
                className="input-primary"
                required
              >
                <option value="ally">Ally</option>
                <option value="enemy">Enemy</option>
                <option value="neutral">Neutral</option>
                <option value="romantic">Romantic</option>
                <option value="family">Family</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* Relationship Strength */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strength ({formData.strength}/10 - {getRelationshipStrengthDisplay(formData.strength)})
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.strength}
                onChange={(e) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-primary"
                rows={3}
                placeholder="Describe the relationship between these NPCs..."
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                className="btn-primary"
                disabled={!formData.targetNpcId || !formData.description.trim()}
              >
                {editingRelationship ? 'Update' : 'Add'} Relationship
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
