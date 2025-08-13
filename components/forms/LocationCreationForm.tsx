import React, { useState } from 'react';
import { 
  MapPinIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import type { EnhancedLocation, LocationClimate, LocationEconomy } from '@/types';

interface LocationCreationFormProps {
  onSubmit: (location: Omit<EnhancedLocation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<EnhancedLocation>;
  className?: string;
}

export function LocationCreationForm({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  className = '' 
}: LocationCreationFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    type: initialData.type || 'landmark',
    description: initialData.description || '',
    coords: initialData.coords || { lat: 0, lng: 0 },
    parentLocationId: initialData.parentLocationId || '',
    hierarchyLevel: initialData.hierarchyLevel || 0,
    images: initialData.images || [],
    detailedDescription: initialData.detailedDescription || '',
    geography: initialData.geography || '',
    architecture: initialData.architecture || '',
    politics: initialData.politics || '',
    economy: initialData.economy || {
      type: 'trade',
      description: '',
      majorIndustries: [],
      resources: [],
    },
    culture: initialData.culture || '',
    climate: initialData.climate || {
      type: 'temperate',
      description: '',
      seasonalChanges: '',
      hazards: [],
    },
    history: initialData.history || '',
    legends: initialData.legends || [],
    rumors: initialData.rumors || [],
    secrets: initialData.secrets || [],
    notableFeatures: initialData.notableFeatures || [],
    magicalProperties: initialData.magicalProperties || [],
    size: initialData.size || 'medium',
    population: initialData.population || '',
    subLocations: initialData.subLocations || [],
    notes: initialData.notes || '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.hierarchyLevel < 0) {
      newErrors.hierarchyLevel = 'Hierarchy level must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const location: Omit<EnhancedLocation, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      type: formData.type,
      description: formData.description.trim(),
      coords: formData.coords,
      parentLocationId: formData.parentLocationId,
      hierarchyLevel: formData.hierarchyLevel,
      images: formData.images,
      detailedDescription: formData.detailedDescription.trim(),
      geography: formData.geography.trim(),
      architecture: formData.architecture.trim(),
      politics: formData.politics.trim(),
      economy: formData.economy,
      culture: formData.culture.trim(),
      climate: formData.climate,
      history: formData.history.trim(),
      legends: formData.legends.filter(legend => legend.trim()),
      rumors: formData.rumors.filter(rumor => rumor.trim()),
      secrets: formData.secrets.filter(secret => secret.trim()),
      notableFeatures: formData.notableFeatures.filter(feature => feature.trim()),
      magicalProperties: formData.magicalProperties.filter(property => property.trim()),
      size: formData.size,
      population: formData.population.trim(),
      subLocations: formData.subLocations,
      notes: formData.notes.trim(),
    };

    onSubmit(location);
  };

  const addLegend = () => {
    setFormData(prev => ({
      ...prev,
      legends: [...prev.legends, '']
    }));
  };

  const updateLegend = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      legends: prev.legends.map((legend, i) => i === index ? value : legend)
    }));
  };

  const removeLegend = (index: number) => {
    setFormData(prev => ({
      ...prev,
      legends: prev.legends.filter((_, i) => i !== index)
    }));
  };

  const addRumor = () => {
    setFormData(prev => ({
      ...prev,
      rumors: [...prev.rumors, '']
    }));
  };

  const updateRumor = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      rumors: prev.rumors.map((rumor, i) => i === index ? value : rumor)
    }));
  };

  const removeRumor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rumors: prev.rumors.filter((_, i) => i !== index)
    }));
  };

  const addSecret = () => {
    setFormData(prev => ({
      ...prev,
      secrets: [...prev.secrets, '']
    }));
  };

  const updateSecret = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      secrets: prev.secrets.map((secret, i) => i === index ? value : secret)
    }));
  };

  const removeSecret = (index: number) => {
    setFormData(prev => ({
      ...prev,
      secrets: prev.secrets.filter((_, i) => i !== index)
    }));
  };

  const addNotableFeature = () => {
    setFormData(prev => ({
      ...prev,
      notableFeatures: [...prev.notableFeatures, '']
    }));
  };

  const updateNotableFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      notableFeatures: prev.notableFeatures.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeNotableFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notableFeatures: prev.notableFeatures.filter((_, i) => i !== index)
    }));
  };

  const addMagicalProperty = () => {
    setFormData(prev => ({
      ...prev,
      magicalProperties: [...prev.magicalProperties, '']
    }));
  };

  const updateMagicalProperty = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      magicalProperties: prev.magicalProperties.map((property, i) => i === index ? value : property)
    }));
  };

  const removeMagicalProperty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      magicalProperties: prev.magicalProperties.filter((_, i) => i !== index)
    }));
  };

  const addIndustry = () => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        majorIndustries: [...prev.economy.majorIndustries, '']
      }
    }));
  };

  const updateIndustry = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        majorIndustries: prev.economy.majorIndustries.map((industry, i) => i === index ? value : industry)
      }
    }));
  };

  const removeIndustry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        majorIndustries: prev.economy.majorIndustries.filter((_, i) => i !== index)
      }
    }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        resources: [...prev.economy.resources, '']
      }
    }));
  };

  const updateResource = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        resources: prev.economy.resources.map((resource, i) => i === index ? value : resource)
      }
    }));
  };

  const removeResource = (index: number) => {
    setFormData(prev => ({
      ...prev,
      economy: {
        ...prev.economy,
        resources: prev.economy.resources.filter((_, i) => i !== index)
      }
    }));
  };

  const addHazard = () => {
    setFormData(prev => ({
      ...prev,
      climate: {
        ...prev.climate,
        hazards: [...prev.climate.hazards, '']
      }
    }));
  };

  const updateHazard = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      climate: {
        ...prev.climate,
        hazards: prev.climate.hazards.map((hazard, i) => i === index ? value : hazard)
      }
    }));
  };

  const removeHazard = (index: number) => {
    setFormData(prev => ({
      ...prev,
      climate: {
        ...prev.climate,
        hazards: prev.climate.hazards.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <MapPinIcon className="h-6 w-6 text-green-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Create New Location</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Location Name"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EnhancedLocation['type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="continent">Continent</option>
                <option value="region">Region</option>
                <option value="country">Country</option>
                <option value="kingdom">Kingdom</option>
                <option value="province">Province</option>
                <option value="state">State</option>
                <option value="city">City</option>
                <option value="town">Town</option>
                <option value="village">Village</option>
                <option value="district">District</option>
                <option value="neighborhood">Neighborhood</option>
                <option value="building">Building</option>
                <option value="establishment">Establishment</option>
                <option value="temple">Temple</option>
                <option value="ruins">Ruins</option>
                <option value="monument">Monument</option>
                <option value="bridge">Bridge</option>
                <option value="crossroads">Crossroads</option>
                <option value="river">River</option>
                <option value="lake">Lake</option>
                <option value="ocean">Ocean</option>
                <option value="mountain">Mountain</option>
                <option value="forest">Forest</option>
                <option value="desert">Desert</option>
                <option value="dungeon">Dungeon</option>
                <option value="wilderness">Wilderness</option>
                <option value="structure">Structure</option>
                <option value="landmark">Landmark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value as EnhancedLocation['size'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="tiny">Tiny</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="huge">Huge</option>
                <option value="massive">Massive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Population
              </label>
              <input
                type="text"
                value={formData.population}
                onChange={(e) => setFormData(prev => ({ ...prev, population: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 1,000 people, 500 families"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hierarchy Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.hierarchyLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, hierarchyLevel: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.hierarchyLevel ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hierarchyLevel && <p className="text-sm text-red-600 mt-1">{errors.hierarchyLevel}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinates (Latitude)
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.coords.lat}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  coords: { ...prev.coords, lat: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coordinates (Longitude)
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.coords.lng}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  coords: { ...prev.coords, lng: parseFloat(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.000000"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the location, its appearance, and key features..."
            />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description
            </label>
            <textarea
              value={formData.detailedDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, detailedDescription: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Provide a more detailed description of the location..."
            />
          </div>

          {/* Geography & Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geography
              </label>
              <textarea
                value={formData.geography}
                onChange={(e) => setFormData(prev => ({ ...prev, geography: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the geographical features..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Architecture
              </label>
              <textarea
                value={formData.architecture}
                onChange={(e) => setFormData(prev => ({ ...prev, architecture: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the architectural style and structures..."
              />
            </div>
          </div>

          {/* Politics & Culture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Politics
              </label>
              <textarea
                value={formData.politics}
                onChange={(e) => setFormData(prev => ({ ...prev, politics: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the political structure and governance..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Culture
              </label>
              <textarea
                value={formData.culture}
                onChange={(e) => setFormData(prev => ({ ...prev, culture: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe the local culture and customs..."
              />
            </div>
          </div>

          {/* History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              History
            </label>
            <textarea
              value={formData.history}
              onChange={(e) => setFormData(prev => ({ ...prev, history: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe the history and significant events..."
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              {showAdvanced ? <EyeSlashIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-6 border-t border-gray-200 pt-4">
              {/* Climate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Climate</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={formData.climate.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        climate: { ...prev.climate, type: e.target.value as LocationClimate['type'] }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="arctic">Arctic</option>
                      <option value="subarctic">Subarctic</option>
                      <option value="temperate">Temperate</option>
                      <option value="subtropical">Subtropical</option>
                      <option value="tropical">Tropical</option>
                      <option value="desert">Desert</option>
                      <option value="alpine">Alpine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={formData.climate.description}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        climate: { ...prev.climate, description: e.target.value }
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Describe the climate..."
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seasonal Changes</label>
                  <textarea
                    value={formData.climate.seasonalChanges}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      climate: { ...prev.climate, seasonalChanges: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe seasonal changes..."
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-gray-600">Climate Hazards</label>
                    <button
                      type="button"
                      onClick={addHazard}
                      className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add Hazard
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.climate.hazards.map((hazard, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={hazard}
                          onChange={(e) => updateHazard(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Climate hazard"
                        />
                        <button
                          type="button"
                          onClick={() => removeHazard(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Economy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Economy</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={formData.economy.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        economy: { ...prev.economy, type: e.target.value as LocationEconomy['type'] }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="trade">Trade</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="mining">Mining</option>
                      <option value="fishing">Fishing</option>
                      <option value="crafting">Crafting</option>
                      <option value="services">Services</option>
                      <option value="tourism">Tourism</option>
                      <option value="military">Military</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={formData.economy.description}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        economy: { ...prev.economy, description: e.target.value }
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Describe the economy..."
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">Major Industries</label>
                      <button
                        type="button"
                        onClick={addIndustry}
                        className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.economy.majorIndustries.map((industry, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={industry}
                            onChange={(e) => updateIndustry(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Industry"
                          />
                          <button
                            type="button"
                            onClick={() => removeIndustry(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">Resources</label>
                      <button
                        type="button"
                        onClick={addResource}
                        className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.economy.resources.map((resource, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={resource}
                            onChange={(e) => updateResource(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Resource"
                          />
                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legends */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Legends</label>
                  <button
                    type="button"
                    onClick={addLegend}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Legend
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.legends.map((legend, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <textarea
                        value={legend}
                        onChange={(e) => updateLegend(index, e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Legend or myth about this location..."
                      />
                      <button
                        type="button"
                        onClick={() => removeLegend(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rumors */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Rumors</label>
                  <button
                    type="button"
                    onClick={addRumor}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Rumor
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.rumors.map((rumor, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={rumor}
                        onChange={(e) => updateRumor(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Rumor about this location..."
                      />
                      <button
                        type="button"
                        onClick={() => removeRumor(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secrets */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Secrets</label>
                  <button
                    type="button"
                    onClick={addSecret}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Secret
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.secrets.map((secret, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <textarea
                        value={secret}
                        onChange={(e) => updateSecret(index, e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Hidden secret about this location..."
                      />
                      <button
                        type="button"
                        onClick={() => removeSecret(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notable Features */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Notable Features</label>
                  <button
                    type="button"
                    onClick={addNotableFeature}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Feature
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.notableFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateNotableFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Notable feature of this location..."
                      />
                      <button
                        type="button"
                        onClick={() => removeNotableFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Magical Properties */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Magical Properties</label>
                  <button
                    type="button"
                    onClick={addMagicalProperty}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Add Property
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.magicalProperties.map((property, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <textarea
                        value={property}
                        onChange={(e) => updateMagicalProperty(index, e.target.value)}
                        rows={2}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Magical property or effect..."
                      />
                      <button
                        type="button"
                        onClick={() => removeMagicalProperty(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Additional notes about this location..."
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Create Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
