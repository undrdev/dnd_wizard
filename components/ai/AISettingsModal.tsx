import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useAIStore } from '@/stores/useAIStore';
import { aiService } from '@/lib/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { providers, currentProvider, setOpenAIConfig, setAnthropicConfig, setCurrentProvider, saveAPIKeysToFirebase } = useAIStore();
  
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>(currentProvider || 'openai');
  const [apiKey, setApiKey] = useState(
    selectedProvider === 'openai' 
      ? (providers.openai?.apiKey || '') 
      : (providers.anthropic?.apiKey || '')
  );
  const [model, setModel] = useState(
    selectedProvider === 'openai' 
      ? (providers.openai?.model || 'gpt-4o-mini') 
      : (providers.anthropic?.model || 'claude-3-haiku-20240307')
  );
  
  const [showApiKey, setShowApiKey] = useState(false);

  // Update API key and model when provider changes
  const handleProviderChange = (newProvider: 'openai' | 'anthropic') => {
    setSelectedProvider(newProvider);
    
    // Update API key field
    if (newProvider === 'openai') {
      setApiKey(providers.openai?.apiKey || '');
      setModel(providers.openai?.model || 'gpt-4o-mini');
    } else {
      setApiKey(providers.anthropic?.apiKey || '');
      setModel(providers.anthropic?.model || 'claude-3-haiku-20240307');
    }
  };

  const handleSave = async () => {
    // Save config for the selected provider
    if (selectedProvider === 'openai') {
      if (apiKey && model) {
        setOpenAIConfig({ apiKey, model });
      }
    } else {
      if (apiKey && model) {
        setAnthropicConfig({ apiKey, model });
      }
    }

    // Set current provider
    setCurrentProvider(selectedProvider);

    // Update AI service config
    const config: Record<string, { apiKey: string; model: string }> = {};
    if (selectedProvider === 'openai' && apiKey && model) {
      config.openai = { apiKey, model };
    } else if (selectedProvider === 'anthropic' && apiKey && model) {
      config.anthropic = { apiKey, model };
    }
    aiService.setConfig(config);

    // Save to Firebase
    try {
      const success = await saveAPIKeysToFirebase();
      if (success) {
        console.log('API keys saved to Firebase successfully');
      } else {
        console.warn('Failed to save API keys to Firebase');
      }
    } catch (error) {
      console.error('Error saving API keys to Firebase:', error);
    }

    onClose();
  };

  const openaiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (Latest & Most Capable)', group: 'Premium' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cost-Effective)', group: 'Standard' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Balanced)', group: 'Premium' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview (Latest Features)', group: 'Premium' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)', group: 'Budget' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K (Long Context)', group: 'Budget' },
  ];

  const anthropicModels = [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Most Intelligent)', group: 'Premium' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Balanced)', group: 'Standard' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast & Cost-Effective)', group: 'Budget' },
  ];

  const currentModels = selectedProvider === 'openai' ? openaiModels : anthropicModels;
  const apiKeyPlaceholder = selectedProvider === 'openai' ? 'sk-...' : 'sk-ant-...';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              AI Settings
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Provider Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Provider
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleProviderChange('openai')}
                  className={`flex-1 py-2 px-4 rounded-md border-2 transition-colors ${
                    selectedProvider === 'openai'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">OpenAI</div>
                </button>
                <button
                  onClick={() => handleProviderChange('anthropic')}
                  className={`flex-1 py-2 px-4 rounded-md border-2 transition-colors ${
                    selectedProvider === 'anthropic'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Anthropic</div>
                </button>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <div className="mt-1 relative">
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder={apiKeyPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
                Model
              </label>
              <select
                id="model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <optgroup label="Premium Models (Best Quality)">
                  {currentModels.filter(m => m.group === 'Premium').map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Standard Models (Good Balance)">
                  {currentModels.filter(m => m.group === 'Standard').map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Budget Models (Cost-Effective)">
                  {currentModels.filter(m => m.group === 'Budget').map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Model Selection Guide */}
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-green-800 mb-2">Model Selection Guide</h4>
              <div className="text-xs text-green-700 space-y-1">
                <p><strong>Premium:</strong> Best quality, higher cost - Use for complex creative tasks</p>
                <p><strong>Standard:</strong> Good balance of quality and cost - Recommended for most use cases</p>
                <p><strong>Budget:</strong> Cost-effective, good for simple tasks and testing</p>
              </div>
              
              {/* Pricing Links */}
              <div className="mt-3 pt-3 border-t border-green-200">
                <h5 className="text-xs font-medium text-green-800 mb-2">Current Pricing Information</h5>
                <div className="flex flex-col sm:flex-row gap-2 text-xs">
                  <a 
                    href="https://platform.openai.com/docs/pricing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>OpenAI Pricing</span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                  </a>
                  <a 
                    href="https://www.anthropic.com/pricing#api" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Anthropic Pricing</span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Privacy:</strong> API keys are encrypted and stored securely in Firebase. 
                They are only accessible to you and are used to make AI requests on your behalf.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Settings
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
