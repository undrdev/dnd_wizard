import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAIStore } from '@/stores/useAIStore';
import { aiService } from '@/lib/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { providers, currentProvider, setOpenAIConfig, setAnthropicConfig, setCurrentProvider, saveAPIKeysToFirebase } = useAIStore();
  
  const [openaiApiKey, setOpenaiApiKey] = useState(providers.openai?.apiKey || '');
  const [openaiModel, setOpenaiModel] = useState(providers.openai?.model || 'gpt-4o-mini');
  const [anthropicApiKey, setAnthropicApiKey] = useState(providers.anthropic?.apiKey || '');
  const [anthropicModel, setAnthropicModel] = useState(providers.anthropic?.model || 'claude-3-haiku-20240307');
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>(currentProvider || 'openai');
  
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const handleSave = async () => {
    // Save OpenAI config if provided
    if (openaiApiKey && openaiModel) {
      setOpenAIConfig({ apiKey: openaiApiKey, model: openaiModel });
    }

    // Save Anthropic config if provided
    if (anthropicApiKey && anthropicModel) {
      setAnthropicConfig({ apiKey: anthropicApiKey, model: anthropicModel });
    }

    // Set current provider
    setCurrentProvider(selectedProvider);

    // Update AI service config
    const config: any = {};
    if (openaiApiKey && openaiModel) {
      config.openai = { apiKey: openaiApiKey, model: openaiModel };
    }
    if (anthropicApiKey && anthropicModel) {
      config.anthropic = { apiKey: anthropicApiKey, model: anthropicModel };
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
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                AI Provider
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="openai"
                    checked={selectedProvider === 'openai'}
                    onChange={(e) => setSelectedProvider(e.target.value as 'openai')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">OpenAI</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="anthropic"
                    checked={selectedProvider === 'anthropic'}
                    onChange={(e) => setSelectedProvider(e.target.value as 'anthropic')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Anthropic</span>
                </label>
              </div>
            </div>

            {/* OpenAI Configuration */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">OpenAI Configuration</h3>
              
              <div>
                <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="mt-1 relative">
                  <input
                    id="openai-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showOpenaiKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="openai-model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <select
                  id="openai-model"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <optgroup label="Premium Models (Best Quality)">
                    {openaiModels.filter(m => m.group === 'Premium').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard Models (Good Balance)">
                    {openaiModels.filter(m => m.group === 'Standard').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Budget Models (Cost-Effective)">
                    {openaiModels.filter(m => m.group === 'Budget').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Anthropic Configuration */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Anthropic Configuration</h3>
              
              <div>
                <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="mt-1 relative">
                  <input
                    id="anthropic-key"
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showAnthropicKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="anthropic-model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <select
                  id="anthropic-model"
                  value={anthropicModel}
                  onChange={(e) => setAnthropicModel(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <optgroup label="Premium Models (Best Quality)">
                    {anthropicModels.filter(m => m.group === 'Premium').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard Models (Good Balance)">
                    {anthropicModels.filter(m => m.group === 'Standard').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Budget Models (Cost-Effective)">
                    {anthropicModels.filter(m => m.group === 'Budget').map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
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
                    <span>🔗</span>
                    <span className="ml-1">OpenAI Pricing</span>
                    <span className="ml-1 text-gray-500">(opens in new tab)</span>
                  </a>
                  <a 
                    href="https://www.anthropic.com/pricing#api" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>🔗</span>
                    <span className="ml-1">Anthropic Pricing</span>
                    <span className="ml-1 text-gray-500">(opens in new tab)</span>
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
