import React from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useQuests } from '@/hooks/useQuests';
import type { EnhancedQuest, QuestTimelineEvent } from '@/types';

interface QuestTimelineProps {
  quest: EnhancedQuest;
  className?: string;
}

export function QuestTimeline({ quest, className = '' }: QuestTimelineProps) {
  const { getQuestTimeline } = useQuests();
  
  const timelineEvents = getQuestTimeline(quest.id);

  const getEventIcon = (type: QuestTimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return <PlusCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'milestone_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'status_changed':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-600" />;
      case 'dependency_added':
        return <ExclamationCircleIcon className="h-5 w-5 text-purple-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: QuestTimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'border-blue-200 bg-blue-50';
      case 'milestone_completed':
        return 'border-green-200 bg-green-50';
      case 'status_changed':
        return 'border-yellow-200 bg-yellow-50';
      case 'dependency_added':
        return 'border-purple-200 bg-purple-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(date);
    }
  };

  if (timelineEvents.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ClockIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
        <p className="text-gray-600">
          Timeline events will appear here as the quest progresses.
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== timelineEvents.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`p-4 rounded-lg border ${getEventColor(event.type)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                          
                          {/* Event Metadata */}
                          {event.metadata && (
                            <div className="mt-2 text-xs text-gray-500">
                              {event.type === 'milestone_completed' && event.metadata.milestoneId && (
                                <span>Milestone ID: {event.metadata.milestoneId}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <time
                            dateTime={event.timestamp.toISOString()}
                            className="text-xs text-gray-500 block"
                            title={formatDate(event.timestamp)}
                          >
                            {formatRelativeTime(event.timestamp)}
                          </time>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Quest Summary */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quest Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="font-medium">
              {quest.createdAt ? formatDate(quest.createdAt) : 'Unknown'}
            </div>
          </div>
          
          {quest.completedAt && (
            <div>
              <span className="text-gray-600">Completed:</span>
              <div className="font-medium">
                {formatDate(quest.completedAt)}
              </div>
            </div>
          )}
          
          <div>
            <span className="text-gray-600">Total Events:</span>
            <div className="font-medium">{timelineEvents.length}</div>
          </div>
          
          <div>
            <span className="text-gray-600">Milestones:</span>
            <div className="font-medium">
              {quest.milestones.filter(m => m.completed).length} / {quest.milestones.length}
            </div>
          </div>
        </div>

        {/* Duration */}
        {quest.createdAt && quest.completedAt && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="text-gray-600 text-sm">Duration:</span>
            <div className="font-medium text-sm">
              {(() => {
                const diffInDays = Math.floor(
                  (quest.completedAt.getTime() - quest.createdAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (diffInDays === 0) {
                  return 'Less than a day';
                } else if (diffInDays === 1) {
                  return '1 day';
                } else {
                  return `${diffInDays} days`;
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Standalone Timeline View Component
interface QuestTimelineViewProps {
  questId: string;
}

export function QuestTimelineView({ questId }: QuestTimelineViewProps) {
  const { getQuest } = useQuests();
  
  const quest = getQuest(questId);

  if (!quest) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Quest Not Found</h3>
        <p className="text-gray-600">
          The requested quest could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Quest Timeline: {quest.title}
        </h1>
        <p className="text-gray-600">{quest.description}</p>
        
        <div className="flex items-center space-x-4 mt-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            quest.importance === 'high' ? 'bg-red-100 text-red-800' :
            quest.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {quest.importance} importance
          </span>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            quest.status === 'active' ? 'bg-blue-100 text-blue-800' :
            quest.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {quest.status}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <QuestTimeline quest={quest} />
    </div>
  );
}
