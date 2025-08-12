import React, { useState } from 'react';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import type { ParsedContent } from '@/lib/aiParsers';

interface ContentVersion {
  id: string;
  content: ParsedContent;
  timestamp: Date;
  accepted: boolean;
  feedback?: string;
}

interface ContentComparisonProps {
  versions: ContentVersion[];
  onSelectVersion: (version: ContentVersion) => void;
  onAcceptVersion: (versionId: string) => void;
  onRejectVersion: (versionId: string) => void;
  className?: string;
}

export function ContentComparison({ 
  versions, 
  onSelectVersion, 
  onAcceptVersion, 
  onRejectVersion, 
  className = '' 
}: ContentComparisonProps) {
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  const [compareMode, setCompareMode] = useState(false);

  const currentVersion = versions[selectedVersionIndex];
  const hasMultipleVersions = versions.length > 1;

  const handlePrevious = () => {
    setSelectedVersionIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setSelectedVersionIndex(prev => Math.min(versions.length - 1, prev + 1));
  };

  const handleCopyContent = async (content: ParsedContent) => {
    try {
      const contentText = JSON.stringify(content, null, 2);
      await navigator.clipboard.writeText(contentText);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const renderContentSummary = (content: ParsedContent) => {
    const summary = [];
    if (content.npcs?.length) summary.push(`${content.npcs.length} NPCs`);
    if (content.quests?.length) summary.push(`${content.quests.length} Quests`);
    if (content.locations?.length) summary.push(`${content.locations.length} Locations`);
    if (content.suggestions?.length) summary.push(`${content.suggestions.length} Suggestions`);
    
    return summary.join(', ') || 'No structured content';
  };

  const renderContentDetails = (content: ParsedContent) => {
    return (
      <div className="space-y-4">
        {/* NPCs */}
        {content.npcs && content.npcs.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">NPCs ({content.npcs.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {content.npcs.map((npc, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded border">
                  <div className="font-medium text-sm">{npc.name || 'Unnamed NPC'}</div>
                  <div className="text-xs text-gray-600">{npc.role || 'No role'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quests */}
        {content.quests && content.quests.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Quests ({content.quests.length})</h4>
            <div className="space-y-2">
              {content.quests.map((quest, index) => (
                <div key={index} className="p-2 bg-purple-50 rounded border">
                  <div className="font-medium text-sm">{quest.title || 'Untitled Quest'}</div>
                  <div className="text-xs text-gray-600">{quest.description || 'No description'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations */}
        {content.locations && content.locations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Locations ({content.locations.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {content.locations.map((location, index) => (
                <div key={index} className="p-2 bg-green-50 rounded border">
                  <div className="font-medium text-sm">{location.name || 'Unnamed Location'}</div>
                  <div className="text-xs text-gray-600">{location.description || 'No description'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {content.suggestions && content.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Suggestions ({content.suggestions.length})</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {content.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">Content Comparison</h3>
          {hasMultipleVersions && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={selectedVersionIndex === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600">
                {selectedVersionIndex + 1} of {versions.length}
              </span>
              <button
                onClick={handleNext}
                disabled={selectedVersionIndex === versions.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleCopyContent(currentVersion.content)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            title="Copy content"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Version Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Version {selectedVersionIndex + 1}
            </p>
            <p className="text-xs text-gray-500">
              {currentVersion.timestamp.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {currentVersion.accepted && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckIcon className="h-3 w-3 mr-1" />
                Accepted
              </span>
            )}
            {currentVersion.feedback && (
              <span className="text-xs text-gray-500">
                Feedback: {currentVersion.feedback}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Summary */}
      <div className="p-4">
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Content Summary</h4>
          <p className="text-sm text-gray-600">
            {renderContentSummary(currentVersion.content)}
          </p>
        </div>

        {/* Detailed Content */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-4">
            {renderContentDetails(currentVersion.content)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => onRejectVersion(currentVersion.id)}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <XMarkIcon className="h-4 w-4 inline mr-1" />
            Reject
          </button>
          <button
            onClick={() => onAcceptVersion(currentVersion.id)}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <CheckIcon className="h-4 w-4 inline mr-1" />
            Accept
          </button>
        </div>
        
        <button
          onClick={() => onSelectVersion(currentVersion)}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Use This Version
        </button>
      </div>
    </div>
  );
}
