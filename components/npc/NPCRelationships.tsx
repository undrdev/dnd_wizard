import React, { useState } from 'react';
import { PlusIcon, HeartIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRelationshipStore } from '@/stores/useRelationshipStore';
import type { EnhancedNPC, NPCRelationship, RelationshipType } from '@/types';
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
  fromNpcId: string;
  toNpcId: string;
  relationshipType: RelationshipType;
  strength: 'weak' | 'moderate' | 'strong' | 'intense';
  description: string;
  isPublic: boolean;
  updatedAt: Date;
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
    fromNpcId: npc.id,
    toNpcId: '',
    relationshipType: 'neutral',
    strength: 'moderate',
    description: '',
    isPublic: true,
    updatedAt: new Date(),
  });

  const { getRelationshipsByNPC } = useRelationshipStore();
  
  // Available NPCs (excluding current NPC and already related NPCs)
  const currentRelationships = getRelationshipsByNPC(npc.id);
  const relatedNPCIds = currentRelationships.map(rel => 
    rel.fromNpcId === npc.id ? rel.toNpcId : rel.fromNpcId
  );
  const availableNPCs = allNPCs.filter(n => n.id !== npc.id && !relatedNPCIds.includes(n.id));

  // Get relationship type icon
  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case 'friend':
      case 'close_friend':
      case 'political_ally':
        return <div className="h-4 w-4 rounded-full bg-green-500" />;
      case 'enemy':
      case 'rival':
      case 'nemesis':
      case 'political_enemy':
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
      case 'romantic_interest':
      case 'ex_lover':
      case 'spouse':
        return <HeartIcon className="h-4 w-4 text-pink-500" />;
      case 'family':
      case 'parent':
      case 'child':
      case 'sibling':
        return <HeartIcon className="h-4 w-4 text-blue-500" />;
      case 'business_partner':
      case 'employer':
      case 'employee':
        return <div className="h-4 w-4 rounded-full bg-yellow-500" />;
      case 'mentor':
      case 'student':
        return <div className="h-4 w-4 rounded-full bg-purple-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  // Get strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'intense': return 'text-green-600';
      case 'strong': return 'text-blue-600';
      case 'moderate': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.toNpcId || !formData.description.trim()) {
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
      fromNpcId: npc.id,
      toNpcId: '',
      relationshipType: 'neutral',
      strength: 'moderate',
      description: '',
      isPublic: true,
      updatedAt: new Date(),
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingRelationship(null);
    setFormData({
      fromNpcId: npc.id,
      toNpcId: '',
      relationshipType: 'neutral',
      strength: 'moderate',
      description: '',
      isPublic: true,
      updatedAt: new Date(),
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
      {currentRelationships.length > 0 ? (
        <div className="space-y-3">
          {currentRelationships.map((relationship) => {
            const targetNPC = allNPCs.find(n => n.id === (relationship.fromNpcId === npc.id ? relationship.toNpcId : relationship.fromNpcId));
            if (!targetNPC) return null;
            
            return (
              <div key={relationship.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRelationshipIcon(relationship.relationshipType)}
                      <span className="font-medium text-gray-900">{targetNPC.name}</span>
                      <span className="text-sm text-gray-500">({targetNPC.role})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {getRelationshipTypeDisplay(relationship.relationshipType)} - {getRelationshipStrengthDisplay(relationship.strength)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingRelationship(relationship.id);
                        setFormData({
                          fromNpcId: npc.id,
                          toNpcId: targetNPC.id,
                          relationshipType: relationship.relationshipType,
                          strength: relationship.strength,
                          description: relationship.description,
                          isPublic: relationship.isPublic,
                          updatedAt: new Date(),
                        });
                        setShowAddForm(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Relationship"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onRemoveRelationship(relationship.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove Relationship"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {relationship.description && (
                  <p className="mt-2 text-sm text-gray-600">{relationship.description}</p>
                )}
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
                value={formData.toNpcId}
                onChange={(e) => setFormData(prev => ({ ...prev, toNpcId: e.target.value }))}
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
                value={formData.relationshipType}
                onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value as RelationshipType }))}
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
                Strength
              </label>
              <select
                value={formData.strength}
                onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weak">Weak</option>
                <option value="moderate">Moderate</option>
                <option value="strong">Strong</option>
                <option value="intense">Intense</option>
              </select>
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
                disabled={!formData.toNpcId || !formData.description.trim()}
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
