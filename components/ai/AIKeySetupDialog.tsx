import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, KeyIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAIStore } from '@/stores/useAIStore';
import { apiKeyStorage } from '@/lib/apiKeyStorage';

interface AIKeySetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export function AIKeySetupDialog({ isOpen, onClose, onSetupComplete }: AIKeySetupDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setOpenAIConfig, setAnthropicConfig, setCurrentProvider } = useAIStore();

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save to Firebase
      const success = await apiKeyStorage.saveAPIKeys({
        [selectedProvider]: {
          apiKey: apiKey.trim(),
          model: selectedProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-haiku-20240307'
        }
      });

      if (!success) {
        throw new Error('Failed to save API key to Firebase');
      }

      // Update local state
      if (selectedProvider === 'openai') {
        setOpenAIConfig({
          apiKey: apiKey.trim(),
          model: 'gpt-4o-mini'
        });
      } else {
        setAnthropicConfig({
          apiKey: apiKey.trim(),
          model: 'claude-3-haiku-20240307'
        });
      }

      setCurrentProvider(selectedProvider);
      onSetupComplete();
      onClose();
    } catch (err) {
      console.error('Error saving API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setApiKey('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <KeyIcon className="h-6 w-6 text-blue-600" />
              <Dialog.Title className="text-lg font-medium text-gray-900">
                AI Provider Setup
              </Dialog.Title>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                <p className="text-sm text-gray-600">
                  You need to configure an AI provider to use AI features.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as 'openai' | 'anthropic')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API key`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your API key is encrypted and stored securely in Firebase.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>How to get your API key:</strong>
                </p>
                {selectedProvider === 'openai' ? (
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Visit <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                    <li>• Sign in or create an account</li>
                    <li>• Click &quot;Create new secret key&quot;</li>
                    <li>• Copy the generated key</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a></li>
                    <li>• Sign in or create an account</li>
                    <li>• Go to API Keys section</li>
                    <li>• Create a new API key</li>
                  </ul>
                )}
              </div>

              {/* Pricing Information */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>Pricing Information:</strong>
                </p>
                <div className="text-sm text-green-700 mt-1 space-y-1">
                  <p>• API usage is charged per token (word/piece of text)</p>
                  <p>• Costs vary by model and provider</p>
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <a 
                      href="https://platform.openai.com/docs/pricing" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-xs"
                    >
                      <span>🔗</span>
                      <span className="ml-1">OpenAI Pricing</span>
                    </a>
                    <a 
                      href="https://www.anthropic.com/pricing#api" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-xs"
                    >
                      <span>🔗</span>
                      <span className="ml-1">Anthropic Pricing</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !apiKey.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
