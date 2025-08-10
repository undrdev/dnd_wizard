import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useQuests } from '@/hooks/useQuests';
import type { EnhancedQuest, QuestProgress } from '@/types';

interface QuestCardProps {
  quest: EnhancedQuest;
  progress: QuestProgress;
  onEdit: (quest: EnhancedQuest) => void;
  onDelete: (questId: string) => void;
  compact?: boolean;
}

export function QuestCard({ quest, progress, onEdit, onDelete, compact = false }: QuestCardProps) {
  const { npcs, locations, selectQuest, getSelectedQuest } = useAppStore();
  const { completeQuest, completeMilestone, canStartQuest } = useQuests();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const selectedQuest = getSelectedQuest();
  const isSelected = selectedQuest?.id === quest.id;
  const canStart = canStartQuest(quest.id);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const startNpc = npcs.find(npc => npc.id === quest.startNpcId);
  const involvedNpcs = npcs.filter(npc => quest.involvedNpcIds.includes(npc.id));
  const questLocations = locations.filter(loc => quest.locationIds.includes(loc.id));

  const handleCompleteQuest = async () => {
    setIsCompleting(true);
    try {
      await completeQuest(quest.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    await completeMilestone(quest.id, milestoneId);
  };

  if (compact) {
    return (
      <div
        onClick={() => selectQuest(quest.id)}
        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
          isSelected
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 flex-1 truncate">
            {quest.title}
          </h4>
          <div className="flex items-center space-x-1 ml-2">
            <span className={`text-xs px-2 py-1 rounded border ${getImportanceColor(quest.importance)}`}>
              {quest.importance}
            </span>
            <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(quest.status)}`}>
              {quest.status}
            </span>
          </div>
        </div>

        {quest.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {quest.description}
          </p>
        )}

        {/* Progress Bar */}
        {progress.totalMilestones > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress.completedMilestones}/{progress.totalMilestones}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Warning if dependencies not met */}
        {!canStart && quest.status === 'active' && (
          <div className="flex items-center text-xs text-amber-600 mt-1">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            <span>Dependencies not met</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm transition-all duration-200 ${
      isSelected ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:shadow-md'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {quest.title}
              </h3>
              <div className="flex items-center space-x-1">
                <span className={`text-xs px-2 py-1 rounded border ${getImportanceColor(quest.importance)}`}>
                  {quest.importance}
                </span>
                <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(quest.status)}`}>
                  {quest.status}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">
              {quest.description}
            </p>

            {/* Progress */}
            {progress.totalMilestones > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress: {progress.completedMilestones}/{progress.totalMilestones} milestones</span>
                  <span>{Math.round(progress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Warnings */}
            {!canStart && quest.status === 'active' && (
              <div className="flex items-center text-sm text-amber-600 mt-2">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <span>Dependencies not satisfied</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {quest.status === 'active' && progress.canComplete && (
              <button
                onClick={handleCompleteQuest}
                disabled={isCompleting}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                title="Complete Quest"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => onEdit(quest)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              title="Edit Quest"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(quest.id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Quest"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Quest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NPCs */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">NPCs</h4>
              <div className="space-y-1">
                {startNpc && (
                  <div className="text-sm">
                    <span className="font-medium text-primary-600">Quest Giver:</span> {startNpc.name}
                  </div>
                )}
                {involvedNpcs.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Involved:</span>{' '}
                    {involvedNpcs.map(npc => npc.name).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Locations */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Locations</h4>
              <div className="text-sm text-gray-600">
                {questLocations.map(loc => loc.name).join(', ') || 'No locations specified'}
              </div>
            </div>
          </div>

          {/* Milestones */}
          {quest.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Milestones</h4>
              <div className="space-y-2">
                {quest.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex items-start space-x-3 p-2 rounded border ${
                        milestone.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => !milestone.completed && handleCompleteMilestone(milestone.id)}
                        disabled={milestone.completed}
                        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          milestone.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {milestone.completed && <CheckIcon className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          milestone.completed ? 'text-green-800 line-through' : 'text-gray-900'
                        }`}>
                          {milestone.title}
                        </div>
                        {milestone.description && (
                          <div className={`text-xs mt-1 ${
                            milestone.completed ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            {milestone.description}
                          </div>
                        )}
                        {milestone.completed && milestone.completedAt && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Completed {milestone.completedAt.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Rewards */}
          {(quest.xpReward > 0 || quest.goldReward > 0 || quest.itemRewards.length > 0 || quest.rewards) && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Rewards</h4>
              <div className="text-sm text-gray-600 space-y-1">
                {quest.xpReward > 0 && <div>XP: {quest.xpReward}</div>}
                {quest.goldReward > 0 && <div>Gold: {quest.goldReward}</div>}
                {quest.itemRewards.length > 0 && (
                  <div>Items: {quest.itemRewards.join(', ')}</div>
                )}
                {quest.rewards && <div>Other: {quest.rewards}</div>}
              </div>
            </div>
          )}

          {/* Notes */}
          {(quest.notes || quest.playerNotes) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quest.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">DM Notes</h4>
                  <p className="text-sm text-gray-600">{quest.notes}</p>
                </div>
              )}
              {quest.playerNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Player Notes</h4>
                  <p className="text-sm text-gray-600">{quest.playerNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
