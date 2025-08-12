import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { LocationService, NPCService, QuestService } from '@/lib/firestore';
import { CampaignSidebar } from './CampaignSidebar';
import { ImportExportModal } from './ImportExportModal';
import { LocationBrowser } from '@/components/location/LocationBrowser';
import { PricingInfo } from '@/components/ui/PricingInfo';
import { migrateLocations } from '@/lib/locationMigration';
import { CloudArrowUpIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';


export function CampaignDashboard() {
  const {
    currentCampaign,
    user,
    loadCampaignData,
    setLoading,
    setError,
    isLoading,
  } = useAppStore();


  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadCampaignDataFromFirestore = useCallback(async () => {
    if (!currentCampaign || !user) return;

    setLoading(true);
    try {
      const [rawLocations, npcs, quests] = await Promise.all([
        LocationService.getCampaignLocations(currentCampaign.id),
        NPCService.getCampaignNPCs(currentCampaign.id),
        QuestService.getCampaignQuests(currentCampaign.id),
      ]);

      // Migrate locations to enhanced format
      const locations = migrateLocations(rawLocations);

      loadCampaignData({
        campaign: currentCampaign,
        locations,
        npcs,
        quests,
      });
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [currentCampaign, user, setLoading, loadCampaignData, setError]);

  useEffect(() => {
    if (currentCampaign && user) {
      loadCampaignDataFromFirestore();
    }
  }, [currentCampaign, user, loadCampaignDataFromFirestore]);

  if (!currentCampaign) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Campaign Selected
          </h2>
          <p className="text-gray-600">
            Please select or create a campaign to get started.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-white shadow-lg z-10`}
      >
        <CampaignSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentCampaign.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentCampaign.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <CampaignActions />
            </div>
          </div>
          
          {/* Pricing Info */}
          <div className="mt-4">
            <PricingInfo variant="compact" />
          </div>
        </div>

        {/* Location Browser area */}
        <div className="flex-1">
          <LocationBrowser className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

function CampaignActions() {
  const { currentCampaign } = useAppStore();
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const handleSaveToCloud = async () => {
    if (!currentCampaign) return;
    
    setIsSaving(true);
    try {
      // This would trigger a save operation
      console.log('Save to cloud functionality not yet implemented');
    } catch (error) {
      console.error('Error saving to cloud:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!currentCampaign) return;
    
    setIsLoadingCloud(true);
    try {
      // This would trigger a load operation
      console.log('Load from cloud functionality not yet implemented');
    } catch (error) {
      console.error('Error loading from cloud:', error);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleLoadFromCloud}
          disabled={isLoadingCloud}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <CloudArrowDownIcon className="w-4 h-4 mr-2" />
          {isLoadingCloud ? 'Loading...' : 'Load from Cloud'}
        </button>

        <button
          onClick={handleSaveToCloud}
          disabled={isSaving}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save to Cloud'}
        </button>

        <button
          onClick={() => setShowImportExportModal(true)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          📤 Import/Export
        </button>
      </div>

      <ImportExportModal
        isOpen={showImportExportModal}
        onClose={() => setShowImportExportModal(false)}
      />
    </>
  );
}
