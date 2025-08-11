import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useLocations } from '@/hooks/useLocations';
import type { EnhancedLocation, EnhancedLocationFormData } from '@/types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: EnhancedLocation;
  initialCoords?: { lat: number; lng: number };
  parentLocationId?: string;
}

export function LocationModal({ 
  isOpen, 
  onClose, 
  location, 
  initialCoords,
  parentLocationId 
}: LocationModalProps) {
  const { 
    createLocation, 
    updateLocation, 
    isCreating, 
    isUpdating,
    locations,
    getLocationBreadcrumbPath 
  } = useLocations();

  const [formData, setFormData] = useState<EnhancedLocationFormData>({
    name: '',
    type: 'landmark',
    coords: { lat: 0, lng: 0 },
    description: '',
    detailedDescription: '',
    history: '',
    rumors: [],
    secrets: [],
    climate: '',
    population: undefined,
    government: '',
    economy: '',
    parentLocationId: parentLocationId,
  });

  const [newRumor, setNewRumor] = useState('');
  const [newSecret, setNewSecret] = useState('');

  const isEditing = !!location;
  const isLoading = isCreating || isUpdating;

  // Initialize form data
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        coords: location.coords,
        description: location.description,
        detailedDescription: location.detailedDescription,
        history: location.history,
        rumors: [...location.rumors],
        secrets: [...location.secrets],
        climate: typeof location.climate === 'string' ? location.climate : location.climate?.temperatureRange || '',
        population: location.population,
        government: typeof location.politics?.governmentType === 'string' ? location.politics.governmentType : '',
        economy: typeof location.economy?.economicStatus === 'string' ? location.economy.economicStatus : '',
        parentLocationId: location.parentLocationId,
      });
    } else {
      setFormData({
        name: '',
        type: 'landmark',
        coords: initialCoords || { lat: 0, lng: 0 },
        description: '',
        detailedDescription: '',
        history: '',
        rumors: [],
        secrets: [],
        climate: '',
        population: undefined,
        government: '',
        economy: '',
        parentLocationId: parentLocationId,
      });
    }
  }, [location, initialCoords, parentLocationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let success = false;

      // Convert form data to enhanced location format
      const enhancedData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        history: formData.history,
        rumors: formData.rumors,
        secrets: formData.secrets,
        population: formData.population,
        parentLocationId: formData.parentLocationId,
        // Convert simple strings to complex objects
        climate: {
          temperatureRange: formData.climate,
          seasons: ['Spring', 'Summer', 'Autumn', 'Winter'],
          precipitation: 'Regular',
          weatherEvents: []
        },
        politics: {
          governmentType: formData.government || '',
          rulers: [],
          laws: [],
          conflicts: [],
          alliances: [],
          politicalStatus: 'Stable'
        },
        economy: {
          economicStatus: formData.economy || '',
          tradeGoods: [],
          currency: 'Gold pieces',
          markets: [],
          guilds: [],
          industries: []
        },
        geography: {
          terrain: 'Mixed',
          topography: 'Varied',
          naturalFeatures: [],
          climateZone: formData.climate,
          flora: [],
          fauna: [],
          naturalResources: [],
          weatherPatterns: 'Seasonal',
          naturalDisasters: []
        },
        architecture: {
          buildingStyles: [],
          materials: [],
          cityLayout: 'Organic',
          fortifications: 'Basic',
          notableBuildings: []
        },
        culture: {
          demographics: [],
          languages: ['Common'],
          customs: [],
          festivals: [],
          religions: [],
          socialStructure: 'Traditional'
        },
        legends: [],
        notableFeatures: [],
        magicalProperties: [],
        size: 'medium' as const,
        hierarchyLevel: 3
      };

      if (isEditing && location) {
        success = await updateLocation(location.id, enhancedData);
      } else {
        const createData = {
          ...enhancedData,
          coords: formData.coords,
          campaignId: '', // This will be set in the hook
          npcs: [],
          quests: [],
          subLocations: [],
          images: [],
        };
        success = await createLocation(createData);
      }
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleInputChange = (field: keyof EnhancedLocationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRumor = () => {
    if (newRumor.trim()) {
      setFormData(prev => ({
        ...prev,
        rumors: [...prev.rumors, newRumor.trim()]
      }));
      setNewRumor('');
    }
  };

  const removeRumor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rumors: prev.rumors.filter((_, i) => i !== index)
    }));
  };

  const addSecret = () => {
    if (newSecret.trim()) {
      setFormData(prev => ({
        ...prev,
        secrets: [...prev.secrets, newSecret.trim()]
      }));
      setNewSecret('');
    }
  };

  const removeSecret = (index: number) => {
    setFormData(prev => ({
      ...prev,
      secrets: prev.secrets.filter((_, i) => i !== index)
    }));
  };

  // Get available parent locations (exclude self and descendants)
  const availableParentLocations = locations.filter(loc => {
    if (isEditing && location) {
      // Exclude self
      if (loc.id === location.id) return false;
      // Exclude descendants to prevent circular references
      const breadcrumb = getLocationBreadcrumbPath(loc.id);
      return !breadcrumb.some(ancestor => ancestor.id === location.id);
    }
    return true;
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {isEditing ? 'Edit Location' : 'Create New Location'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => handleInputChange('type', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="city">City</option>
                          <option value="village">Village</option>
                          <option value="landmark">Landmark</option>
                          <option value="dungeon">Dungeon</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Parent Location
                        </label>
                        <select
                          value={formData.parentLocationId || ''}
                          onChange={(e) => handleInputChange('parentLocationId', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (Root Location)</option>
                          {availableParentLocations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude *
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.coords.lat}
                            onChange={(e) => handleInputChange('coords', {
                              ...formData.coords,
                              lat: parseFloat(e.target.value) || 0
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude *
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.coords.lng}
                            onChange={(e) => handleInputChange('coords', {
                              ...formData.coords,
                              lng: parseFloat(e.target.value) || 0
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900">Additional Details</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Climate
                        </label>
                        <input
                          type="text"
                          value={formData.climate}
                          onChange={(e) => handleInputChange('climate', e.target.value)}
                          placeholder="e.g., Temperate, Tropical, Arctic"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Population
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.population || ''}
                          onChange={(e) => handleInputChange('population', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Government
                        </label>
                        <input
                          type="text"
                          value={formData.government}
                          onChange={(e) => handleInputChange('government', e.target.value)}
                          placeholder="e.g., Monarchy, Republic, Council"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Economy
                        </label>
                        <input
                          type="text"
                          value={formData.economy}
                          onChange={(e) => handleInputChange('economy', e.target.value)}
                          placeholder="e.g., Trade, Agriculture, Mining"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brief Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="A short description visible on the map..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        value={formData.detailedDescription}
                        onChange={(e) => handleInputChange('detailedDescription', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="A detailed description of the location..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        History
                      </label>
                      <textarea
                        value={formData.history}
                        onChange={(e) => handleInputChange('history', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Historical background of the location..."
                      />
                    </div>
                  </div>

                  {/* Rumors and Secrets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rumors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rumors
                      </label>
                      <div className="space-y-2">
                        {formData.rumors.map((rumor, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="flex-1 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                              {rumor}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRumor(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newRumor}
                            onChange={(e) => setNewRumor(e.target.value)}
                            placeholder="Add a rumor..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRumor())}
                          />
                          <button
                            type="button"
                            onClick={addRumor}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Secrets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secrets
                      </label>
                      <div className="space-y-2">
                        {formData.secrets.map((secret, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="flex-1 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                              {secret}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSecret(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newSecret}
                            onChange={(e) => setNewSecret(e.target.value)}
                            placeholder="Add a secret..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecret())}
                          />
                          <button
                            type="button"
                            onClick={addSecret}
                            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
