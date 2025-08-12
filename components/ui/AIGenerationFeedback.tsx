import React, { useState } from 'react';
import { HandThumbUpIcon, HandThumbDownIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { aiUsageLogger } from '@/lib/aiUsageLogging';

interface AIGenerationFeedbackProps {
  logId: string;
  onFeedbackSubmitted?: (feedback: 'accepted' | 'rejected' | 'modified') => void;
  className?: string;
}

export function AIGenerationFeedback({ logId, onFeedbackSubmitted, className = '' }: AIGenerationFeedbackProps) {
  const [feedback, setFeedback] = useState<'accepted' | 'rejected' | 'modified' | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);

  const handleFeedback = async (type: 'accepted' | 'rejected' | 'modified') => {
    setFeedback(type);
    
    if (type === 'rejected' || type === 'modified') {
      setShowReasonInput(true);
    } else {
      await submitFeedback(type);
    }
  };

  const submitFeedback = async (type: 'accepted' | 'rejected' | 'modified') => {
    setIsSubmitting(true);
    try {
      await aiUsageLogger.updateUserFeedback(logId, type, reason || undefined);
      onFeedbackSubmitted?.(type);
      
      // Show success message
      setTimeout(() => {
        setFeedback(null);
        setReason('');
        setShowReasonInput(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReason = async () => {
    if (feedback) {
      await submitFeedback(feedback);
    }
  };

  const handleCancel = () => {
    setFeedback(null);
    setReason('');
    setShowReasonInput(false);
  };

  if (feedback === 'accepted') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-center text-green-600">
                      <HandThumbUpIcon className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Thank you for your feedback!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="text-center mb-3">
        <h4 className="text-sm font-medium text-gray-900 mb-1">How was this AI generation?</h4>
        <p className="text-xs text-gray-600">Your feedback helps improve our AI models</p>
      </div>

      {!showReasonInput ? (
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => handleFeedback('accepted')}
            disabled={isSubmitting}
            className="flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            <HandThumbUpIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Good</span>
          </button>
          
          <button
            onClick={() => handleFeedback('modified')}
            disabled={isSubmitting}
            className="flex items-center px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition-colors disabled:opacity-50"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Modified</span>
          </button>
          
          <button
            onClick={() => handleFeedback('rejected')}
            disabled={isSubmitting}
            className="flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            <HandThumbDownIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Poor</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {feedback === 'rejected' ? 'What was wrong?' : 'What did you change?'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={feedback === 'rejected' ? 'Describe what was wrong with the generation...' : 'Describe what you modified...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReason}
              disabled={isSubmitting}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function AIGenerationFeedbackCompact({ logId, onFeedbackSubmitted, className = '' }: AIGenerationFeedbackProps) {
  const [feedback, setFeedback] = useState<'accepted' | 'rejected' | 'modified' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (type: 'accepted' | 'rejected' | 'modified') => {
    setFeedback(type);
    setIsSubmitting(true);
    
    try {
      await aiUsageLogger.updateUserFeedback(logId, type);
      onFeedbackSubmitted?.(type);
      
      // Show success briefly
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedback === 'accepted') {
    return (
      <div className={`text-green-600 text-sm ${className}`}>
        <HandThumbUpIcon className="h-4 w-4 inline mr-1" />
        Thanks!
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-xs text-gray-500 mr-2">Helpful?</span>
      
      <button
        onClick={() => handleFeedback('accepted')}
        disabled={isSubmitting}
        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
        title="Good generation"
      >
        <HandThumbUpIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => handleFeedback('rejected')}
        disabled={isSubmitting}
        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
        title="Poor generation"
      >
        <HandThumbDownIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
