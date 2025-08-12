import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useAppStore } from '@/stores/useAppStore';
import { CampaignService } from '@/lib/firestore';
import { CampaignList } from '@/components/campaign/CampaignList';
import { CreateCampaignModal } from '@/components/campaign/CreateCampaignModal';
import { CampaignDashboard } from '@/components/campaign/CampaignDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Campaign } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading } = useAuthContext();
  const { 
    currentCampaign, 
    isLoading,
    setCampaigns, 
    setCurrentCampaign,
    setLoading,
    setError 
  } = useAppStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadUserCampaigns = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userCampaigns = await CampaignService.getUserCampaigns(user.uid);
      setCampaigns(userCampaigns);
      
      // If no current campaign is selected and there are campaigns, select the first one
      if (!currentCampaign && userCampaigns.length > 0) {
        setCurrentCampaign(userCampaigns[0]);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [user, currentCampaign, setCampaigns, setCurrentCampaign, setLoading, setError]);

  useEffect(() => {
    if (user && initialLoad) {
      loadUserCampaigns();
      setInitialLoad(false);
    }
  }, [user, initialLoad, loadUserCampaigns]);

  const handleSelectCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
  };

  const handleCreateSuccess = () => {
    // Campaign is already added to store in CreateCampaignModal
    setShowCreateModal(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome to DnD Wizard
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create and manage your tabletop RPG campaigns with the power of AI. 
              Generate NPCs, quests, and locations with intelligent assistance.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">🗺️</div>
                <h3 className="text-lg font-semibold mb-2">Interactive Maps</h3>
                <p className="text-gray-600">
                  Visualize your campaign world with interactive maps showing NPCs, quests, and locations.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
                <p className="text-gray-600">
                  Generate compelling NPCs, quests, and storylines with AI-powered creativity.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">☁️</div>
                <h3 className="text-lg font-semibold mb-2">Cloud Sync</h3>
                <p className="text-gray-600">
                  Access your campaigns from anywhere with secure cloud storage and sync.
                </p>
              </div>
            </div>

            <p className="text-gray-600">
              Sign in to get started with your first campaign.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentCampaign) {
    return (
      <div className="h-screen">
        <CampaignDashboard />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <CampaignList
          onCreateNew={() => setShowCreateModal(true)}
          onSelectCampaign={handleSelectCampaign}
        />
      )}

      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
