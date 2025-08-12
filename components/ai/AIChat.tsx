import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, CogIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useAIStore } from '@/stores/useAIStore';
import { useAI } from '@/hooks/useAI';
import { useToast } from '@/components/ui/Toast';
import { AISettingsModal } from './AISettingsModal';
import { AIContentPreview } from './AIContentPreview';
import { AIKeySetupDialog } from './AIKeySetupDialog';
import type { AIMessage } from '@/types';

export function AIChat() {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedKeys = useRef(false);

  const { getCurrentCampaignData } = useAppStore();
  const { hasValidProvider, conversationHistory, currentProvider, loadAPIKeysFromFirebase, isLoadingKeys } = useAIStore();
  const { addToast } = useToast();
  const {
    isGenerating,
    previewContent,
    error,
    showKeySetupDialog,
    processCommand,
    acceptPreviewContent,
    rejectPreviewContent,
    generateSuggestions,
    clearError,
    onKeySetupComplete
  } = useAI();

  const { campaign } = getCurrentCampaignData();

  useEffect(() => {
    console.log('🔍 AIChat: Conversation history updated, length:', conversationHistory.length);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  useEffect(() => {
    console.log('🔍 AIChat: Component mounted');
    console.log('🔍 AIChat: Has loaded keys:', hasLoadedKeys.current);
    console.log('🔍 AIChat: Is loading keys:', isLoadingKeys);
    
    // Load API keys from Firebase on mount (only once)
    if (!hasLoadedKeys.current) {
      console.log('🔍 AIChat: Loading API keys from Firebase');
      hasLoadedKeys.current = true;
      loadAPIKeysFromFirebase();
    }
  }, [loadAPIKeysFromFirebase]);

  useEffect(() => {
    if (error) {
      console.log('🔍 AIChat: Error detected:', error);
      
      // Show error toast
      addToast({
        type: 'error',
        title: 'AI Error',
        message: error,
        duration: 8000,
        action: {
          label: 'Dismiss',
          onClick: () => clearError()
        }
      });
      
      // Auto-clear error after 8 seconds
      const timer = setTimeout(() => {
        console.log('🔍 AIChat: Auto-clearing error');
        clearError();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 AIChat: Form submitted');
    console.log('🔍 AIChat: Message:', message);
    console.log('🔍 AIChat: Is generating:', isGenerating);
    console.log('🔍 AIChat: Has valid provider:', hasValidProvider());
    
    if (!message.trim() || isGenerating || !hasValidProvider()) {
      console.log('❌ AIChat: Form submission blocked');
      return;
    }

    const command = message.trim();
    console.log('🔍 AIChat: Processing command:', command);
    setMessage('');

    try {
      console.log('🔍 AIChat: Calling processCommand');
      await processCommand(command);
      console.log('✅ AIChat: Command processed successfully');
      
      // Show success toast for successful commands
      addToast({
        type: 'success',
        title: 'Command Processed',
        message: 'Your AI command has been processed successfully.',
        duration: 3000
      });
    } catch (error) {
      console.error('❌ AIChat: Error processing command:', error);
    }
  };

  const handleSuggestionClick = async (type: 'npc' | 'quest' | 'location' | 'general') => {
    if (isGenerating) return;

    try {
      setShowSuggestions(true);
      const newSuggestions = await generateSuggestions(type);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleAcceptContent = async () => {
    try {
      await acceptPreviewContent();
    } catch (error) {
      console.error('Failed to accept content:', error);
    }
  };

  const quickActions = [
    {
      label: 'Create NPC',
      prompt: 'Create a new interesting NPC for this campaign',
      icon: '👤',
      type: 'npc' as const
    },
    {
      label: 'Generate Quest',
      prompt: 'Create a new quest that fits the campaign theme',
      icon: '📜',
      type: 'quest' as const
    },
    {
      label: 'Add Location',
      prompt: 'Create a new location for the campaign world',
      icon: '🏰',
      type: 'location' as const
    },
    {
      label: 'Get Suggestions',
      prompt: 'Give me some creative suggestions for this campaign',
      icon: '💡',
      type: 'general' as const
    },
  ];

  const handleQuickAction = (prompt: string) => {
    console.log('🔍 AIChat: Quick action selected:', prompt);
    setMessage(prompt);
  };

  if (isLoadingKeys) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">
          <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Loading AI Configuration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Loading your saved AI settings...
          </p>
          <button
            onClick={() => {
              // Force stop loading if it takes too long
              hasLoadedKeys.current = false;
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Skip loading
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidProvider()) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">
          <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            AI Assistant Not Configured
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure an AI provider to start using the AI assistant.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Configure AI
        </button>
        <AISettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
        >
          <CogIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content Preview */}
      {previewContent && (
        <div className="mx-4 mt-4">
          <AIContentPreview
            content={previewContent}
            onAccept={handleAcceptContent}
            onReject={rejectPreviewContent}
            isLoading={isGenerating}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🤖</span>
              </div>
              <p className="text-gray-600">
                Hi! I'm your AI campaign assistant. Ask me to create NPCs, quests, locations, or anything else for your campaign!
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-6">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary-600 rounded-full"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me to create something for your campaign..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!message.trim() || isGenerating}
            className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-2">
          Using {currentProvider?.toUpperCase()} • {campaign ? `Campaign: ${campaign.title}` : 'No campaign selected'}
        </p>
      </div>

      <AISettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <AIKeySetupDialog
        isOpen={showKeySetupDialog}
        onClose={() => {
          // The dialog will be closed by the useAI hook when setup is complete
        }}
        onSetupComplete={onKeySetupComplete}
      />
    </div>
  );
}
