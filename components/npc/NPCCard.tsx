import React, { useState } from 'react';
import {
  UserIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import type { EnhancedNPC, Location } from '@/types';
import { getRelationshipTypeDisplay } from '@/lib/npcUtils';

interface NPCCardProps {
  npc: EnhancedNPC;
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: () => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function NPCCard({
  npc,
  onEdit,
  onDelete,
  onSelect,
  showActions = true,
  compact = false,
  className = '',
}: NPCCardProps) {
  const { locations, npcs } = useAppStore();
  const [showDetails, setShowDetails] = useState(false);

  const location = locations.find(loc => loc.id === npc.locationId);
  const relatedNPCs = npcs.filter(n => 
    npc.relationships.some(rel => rel.targetNpcId === n.id)
  );

  // Get relationship type icon
  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'ally':
        return <div className="h-3 w-3 rounded-full bg-green-500" />;
      case 'enemy':
        return <XMarkIcon className="h-3 w-3 text-red-500" />;
      case 'romantic':
        return <HeartIcon className="h-3 w-3 text-pink-500" />;
      case 'family':
        return <HeartIcon className="h-3 w-3 text-blue-500" />;
      case 'business':
        return <div className="h-3 w-3 rounded-full bg-yellow-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      setShowDetails(!showDetails);
    }
  };

  if (compact) {
    return (
      <div
        className={`card hover:shadow-md transition-shadow cursor-pointer ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center space-x-3">
          {/* Portrait */}
          <div className="flex-shrink-0">
            {npc.portraitUrl ? (
              <img
                src={npc.portraitUrl}
                alt={npc.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{npc.name}</h3>
            <p className="text-sm text-gray-500 truncate">{npc.role}</p>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Edit NPC"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete NPC"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`card hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Portrait */}
          <div className="flex-shrink-0">
            {npc.portraitUrl ? (
              <img
                src={npc.portraitUrl}
                alt={npc.name}
                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{npc.name}</h3>
            <p className="text-sm font-medium text-gray-600">{npc.role}</p>
            {location && (
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {location.name}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={showDetails ? 'Hide details' : 'Show details'}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit NPC"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete NPC"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Personality */}
      {npc.personality && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Personality</h4>
          <p className="text-sm text-gray-600">{npc.personality}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-gray-900">
            {Object.values(npc.stats).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)}
          </div>
          <div className="text-xs text-gray-500">Total Stats</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-gray-900">
            {npc.relationships.length}
          </div>
          <div className="text-xs text-gray-500">Relationships</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-lg font-semibold text-gray-900">
            {npc.quests.length}
          </div>
          <div className="text-xs text-gray-500">Quests</div>
        </div>
      </div>

      {/* Relationships Preview */}
      {npc.relationships.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Relationships</h4>
          <div className="flex flex-wrap gap-2">
            {npc.relationships.slice(0, 3).map((relationship) => {
              const targetNPC = npcs.find(n => n.id === relationship.targetNpcId);
              if (!targetNPC) return null;

              return (
                <div
                  key={relationship.id}
                  className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1 text-xs"
                >
                  {getRelationshipIcon(relationship.type)}
                  <span className="text-gray-700">{targetNPC.name}</span>
                </div>
              );
            })}
            {npc.relationships.length > 3 && (
              <div className="bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-500">
                +{npc.relationships.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Stats</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(npc.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{stat}:</span>
                  <span className="font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          {npc.goals && npc.goals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Goals</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {npc.goals.map((goal, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {npc.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{npc.notes}</p>
            </div>
          )}

          {/* Backstory */}
          {npc.backstory && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Backstory</h4>
              <p className="text-sm text-gray-600">{npc.backstory}</p>
            </div>
          )}

          {/* Secrets */}
          {npc.secrets && npc.secrets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Secrets</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {npc.secrets.map((secret, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {secret}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
            {npc.createdAt && (
              <div>Created: {new Date(npc.createdAt).toLocaleDateString()}</div>
            )}
            {npc.updatedAt && (
              <div>Updated: {new Date(npc.updatedAt).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
