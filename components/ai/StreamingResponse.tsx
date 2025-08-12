import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon, PencilIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface StreamingResponseProps {
  content: string;
  isStreaming: boolean;
  onComplete?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: (content: string) => void;
  className?: string;
}

export function StreamingResponse({ 
  content, 
  isStreaming, 
  onComplete, 
  onAccept, 
  onReject, 
  onEdit, 
  className = '' 
}: StreamingResponseProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Simulate streaming effect
  useEffect(() => {
    if (isStreaming && content) {
      const targetLength = content.length;
      let currentLength = displayedContent.length;
      
      const streamInterval = setInterval(() => {
        if (currentLength < targetLength) {
          currentLength = Math.min(currentLength + 3, targetLength);
          setDisplayedContent(content.substring(0, currentLength));
        } else {
          clearInterval(streamInterval);
          onComplete?.();
        }
      }, 50);

      return () => clearInterval(streamInterval);
    } else if (!isStreaming) {
      setDisplayedContent(content);
    }
  }, [content, isStreaming, displayedContent.length, onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    if (isStreaming) {
      const cursorInterval = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500);
      return () => clearInterval(cursorInterval);
    } else {
      setCursorVisible(false);
    }
  }, [isStreaming]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedContent]);

  const handleEdit = () => {
    setEditContent(displayedContent);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit?.(editContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {isStreaming ? 'AI is responding...' : 'Response complete'}
          </span>
        </div>
        
        {!isStreaming && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Edit response"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Copy response"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={8}
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div 
            ref={contentRef}
            className="max-h-64 overflow-y-auto text-sm text-gray-800 leading-relaxed"
          >
            <div className="whitespace-pre-wrap">
              {displayedContent}
              {isStreaming && cursorVisible && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isStreaming && !isEditing && (
        <div className="flex items-center justify-between p-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {displayedContent.length} characters
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onReject}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4 inline mr-1" />
              Reject
            </button>
            <button
              onClick={onAccept}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <CheckIcon className="h-4 w-4 inline mr-1" />
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
