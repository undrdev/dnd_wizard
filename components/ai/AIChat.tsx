import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, CogIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useAIStore } from '@/stores/useAIStore';
import { aiService, AIUtils } from '@/lib/ai';
import { AISettingsModal } from './AISettingsModal';
import type { AIMessage } from '@/types';

export function AIChat() {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { getCurrentCampaignData, addNPC, addQuest, addLocation } = useAppStore();
  const { hasValidProvider, currentProvider } = useAIStore();

  const { campaign, locations, npcs, quests } = getCurrentCampaignData();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isGenerating || !hasValidProvider()) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsGenerating(true);

    try {
      const context = campaign ? AIUtils.formatCampaignContext(campaign, locations, npcs, quests) : undefined;
      
      const response = await aiService.processCommand({
        command: userMessage.content,
        campaignId: campaign?.id || '',
        context,
      });

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.success ? 
          (response.data?.message || 'Content generated successfully!') : 
          (response.error || 'An error occurred'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Process generated content
      if (response.success && response.data) {
        if (response.data.npcs && response.data.npcs.length > 0) {
          response.data.npcs.forEach((npc: any) => {
            // Add generated NPC to store
            // Note: In a real implementation, you'd save to Firestore here
            console.log('Generated NPC:', npc);
          });
        }

        if (response.data.quests && response.data.quests.length > 0) {
          response.data.quests.forEach((quest: any) => {
            // Add generated quest to store
            console.log('Generated Quest:', quest);
          });
        }

        if (response.data.locations && response.data.locations.length > 0) {
          response.data.locations.forEach((location: any) => {
            // Add generated location to store
            console.log('Generated Location:', location);
          });
        }
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const quickActions = [
    { label: 'Create NPC', prompt: 'Create a new interesting NPC for this campaign' },
    { label: 'Generate Quest', prompt: 'Create a new quest that fits the campaign theme' },
    { label: 'Add Location', prompt: 'Create a new location for the campaign world' },
    { label: 'Random Encounter', prompt: 'Generate a random encounter for the party' },
  ];

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
  };

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
        <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
        >
          <CogIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
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
          messages.map((msg, index) => (
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
    </div>
  );
}
