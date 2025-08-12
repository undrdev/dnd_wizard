import React, { useState } from 'react';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '@/stores/useAppStore';
import { CampaignService } from '@/lib/firestore';
import { FullCampaignGenerator } from './FullCampaignGenerator';
import type { Campaign } from '@/types';

interface CampaignListProps {
  onCreateNew: () => void;
  onSelectCampaign: (campaign: Campaign) => void;
}

export function CampaignList({ onCreateNew, onSelectCampaign }: CampaignListProps) {
  const { campaigns, currentCampaign, user, deleteCampaign, setError } = useAppStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFullGenerator, setShowFullGenerator] = useState(false);

  const handleDeleteCampaign = async (campaignId: string, campaignTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(campaignId);
    try {
      await CampaignService.deleteCampaign(campaignId);
      deleteCampaign(campaignId);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setError('Failed to delete campaign');
    } finally {
      setDeletingId(null);
    }
  };



  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your campaigns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Campaigns</h2>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first campaign.
          </p>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={onCreateNew}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Campaign
            </button>
            <button
              onClick={() => setShowFullGenerator(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate Full Campaign
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isSelected={currentCampaign?.id === campaign.id}
              isDeleting={deletingId === campaign.id}
              onSelect={() => onSelectCampaign(campaign)}
              onDelete={() => handleDeleteCampaign(campaign.id, campaign.title)}
            />
          ))}
        </div>
      )}

      {/* Full Campaign Generator Modal */}
      <FullCampaignGenerator
        isOpen={showFullGenerator}
        onClose={() => setShowFullGenerator(false)}
      />
    </div>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function CampaignCard({ campaign, isSelected, isDeleting, onSelect, onDelete }: CampaignCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {campaign.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {campaign.description}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Delete campaign"
            >
              {isDeleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>Created {formatDate(campaign.createdAt)}</span>
          <span>Updated {formatDate(campaign.updatedAt)}</span>
        </div>

        {campaign.mapSeed && (
          <div className="mt-2 text-xs text-gray-400">
            Map Seed: {campaign.mapSeed.substring(0, 20)}...
          </div>
        )}
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
