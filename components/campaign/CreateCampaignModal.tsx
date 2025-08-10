import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { useAIStore } from '@/stores/useAIStore';
import { CampaignService } from '@/lib/firestore';
import type { CampaignFormData, CreateCampaignData } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const { user, addCampaign, setCurrentCampaign, setLoading, setError } = useAppStore();
  const { hasValidProvider, isGenerating } = useAIStore();
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    concept: '',
    generateWithAI: false,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CampaignFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    if (formData.generateWithAI && !hasValidProvider()) {
      setError('Please configure an AI provider first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const campaignData: CreateCampaignData = {
        ownerId: user.uid,
        title: formData.title,
        description: formData.description,
        mapSeed: uuidv4(), // Generate a unique map seed
      };

      if (formData.generateWithAI) {
        // TODO: Integrate with AI service to generate campaign content
        // For now, just create the basic campaign
        campaignData.description = formData.concept 
          ? `${formData.description}\n\nConcept: ${formData.concept}`
          : formData.description;
      }

      const campaignId = await CampaignService.createCampaign(campaignData);
      
      const newCampaign = {
        id: campaignId,
        ...campaignData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addCampaign(newCampaign);
      setCurrentCampaign(newCampaign);
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        concept: '',
        generateWithAI: false,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Create New Campaign
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Campaign Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter campaign title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your campaign"
              />
            </div>

            <div className="flex items-center">
              <input
                id="generateWithAI"
                type="checkbox"
                checked={formData.generateWithAI}
                onChange={(e) => handleInputChange('generateWithAI', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="generateWithAI" className="ml-2 block text-sm text-gray-900">
                <span className="flex items-center">
                  <SparklesIcon className="h-4 w-4 mr-1 text-primary-500" />
                  Generate with AI
                </span>
              </label>
            </div>

            {!hasValidProvider() && formData.generateWithAI && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  Please configure an AI provider in settings to use AI generation.
                </p>
              </div>
            )}

            {formData.generateWithAI && (
              <div>
                <label htmlFor="concept" className="block text-sm font-medium text-gray-700">
                  Campaign Concept (Optional)
                </label>
                <textarea
                  id="concept"
                  rows={2}
                  value={formData.concept}
                  onChange={(e) => handleInputChange('concept', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Provide a concept for AI to expand upon (e.g., 'A steampunk adventure in a floating city')"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty for AI to generate a completely original concept
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (formData.generateWithAI && !hasValidProvider())}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    {formData.generateWithAI ? 'Generating...' : 'Creating...'}
                  </span>
                ) : (
                  'Create Campaign'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
