import React, { useState, useMemo } from 'react';
import { 
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useQuests } from '@/hooks/useQuests';
import type { EnhancedQuest } from '@/types';

interface QuestDependenciesProps {
  quest: EnhancedQuest;
  className?: string;
}

export function QuestDependencies({ quest, className = '' }: QuestDependenciesProps) {
  const { allQuests, validateDependencies } = useQuests();
  
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);

  // Get dependency quests
  const dependencyQuests = useMemo(() => {
    return quest.dependencies
      .map(depId => allQuests.find(q => q.id === depId))
      .filter(Boolean) as EnhancedQuest[];
  }, [quest.dependencies, allQuests]);

  // Get quests that depend on this quest
  const dependentQuests = useMemo(() => {
    return allQuests.filter(q => q.dependencies.includes(quest.id));
  }, [quest.id, allQuests]);

  // Validate current dependencies
  const validation = useMemo(() => {
    return validateDependencies(quest.id, quest.dependencies);
  }, [quest.id, quest.dependencies, validateDependencies]);

  const getQuestStatusIcon = (questStatus: string) => {
    switch (questStatus) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'active':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getQuestStatusColor = (questStatus: string) => {
    switch (questStatus) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-blue-200 bg-blue-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const canQuestStart = useMemo(() => {
    return dependencyQuests.every(dep => dep.status === 'completed');
  }, [dependencyQuests]);

  return (
    <div className={`${className}`}>
      {/* Validation Warnings */}
      {!validation.isValid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Circular Dependency Detected</h4>
              <p className="text-sm text-red-700 mt-1">
                The following quests create a circular dependency: {validation.circularDependencies.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quest Status */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Quest Status</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {getQuestStatusIcon(quest.status)}
            <span className="ml-2 text-sm font-medium capitalize">{quest.status}</span>
          </div>
          
          {quest.status === 'active' && (
            <div className="flex items-center">
              {canQuestStart ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-700">Can be started</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 mr-1" />
                  <span className="text-sm text-amber-700">Waiting for dependencies</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dependencies (Prerequisites) */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Prerequisites ({dependencyQuests.length})
        </h3>
        
        {dependencyQuests.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>This quest has no prerequisites</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dependencyQuests.map((depQuest) => (
              <div
                key={depQuest.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedQuest === depQuest.id
                    ? 'border-primary-500 bg-primary-50'
                    : getQuestStatusColor(depQuest.status)
                }`}
                onClick={() => setSelectedQuest(
                  selectedQuest === depQuest.id ? null : depQuest.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getQuestStatusIcon(depQuest.status)}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {depQuest.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {depQuest.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          depQuest.importance === 'high' ? 'bg-red-100 text-red-800' :
                          depQuest.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {depQuest.importance}
                        </span>
                        
                        <span className={`text-xs px-2 py-1 rounded ${
                          depQuest.status === 'completed' ? 'bg-green-100 text-green-800' :
                          depQuest.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {depQuest.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 mt-1" />
                </div>

                {/* Expanded Details */}
                {selectedQuest === depQuest.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <div className="font-medium">
                          {depQuest.milestones.filter(m => m.completed).length} / {depQuest.milestones.length} milestones
                        </div>
                      </div>
                      
                      {depQuest.completedAt && (
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="font-medium">
                            {depQuest.completedAt.toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dependent Quests */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dependent Quests ({dependentQuests.length})
        </h3>
        
        {dependentQuests.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No other quests depend on this one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dependentQuests.map((depQuest) => (
              <div
                key={depQuest.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedQuest === depQuest.id
                    ? 'border-primary-500 bg-primary-50'
                    : getQuestStatusColor(depQuest.status)
                }`}
                onClick={() => setSelectedQuest(
                  selectedQuest === depQuest.id ? null : depQuest.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 mt-1" />
                    {getQuestStatusIcon(depQuest.status)}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {depQuest.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {depQuest.description}
                      </p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          depQuest.importance === 'high' ? 'bg-red-100 text-red-800' :
                          depQuest.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {depQuest.importance}
                        </span>
                        
                        <span className={`text-xs px-2 py-1 rounded ${
                          depQuest.status === 'completed' ? 'bg-green-100 text-green-800' :
                          depQuest.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {depQuest.status}
                        </span>

                        {quest.status !== 'completed' && depQuest.status === 'active' && (
                          <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedQuest === depQuest.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <div className="font-medium">
                          {depQuest.milestones.filter(m => m.completed).length} / {depQuest.milestones.length} milestones
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Dependencies:</span>
                        <div className="font-medium">
                          {depQuest.dependencies.length} quest(s)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dependency Chain Summary */}
      {(dependencyQuests.length > 0 || dependentQuests.length > 0) && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Dependency Chain Summary</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>
              • This quest requires {dependencyQuests.length} prerequisite(s) to be completed
            </div>
            <div>
              • {dependentQuests.length} other quest(s) depend on this quest
            </div>
            {quest.status !== 'completed' && dependentQuests.length > 0 && (
              <div className="text-amber-700 mt-2">
                ⚠️ Completing this quest will unblock {dependentQuests.filter(q => q.status === 'active').length} active quest(s)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
