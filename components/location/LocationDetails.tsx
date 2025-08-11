import React, { useState } from 'react';
import { 
  UsersIcon,
  MapPinIcon,
  BookOpenIcon,
  EyeIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { EnhancedLocation, NPC } from '@/types';

interface LocationDetailsProps {
  location: EnhancedLocation;
  npcs: NPC[];
  subLocations: EnhancedLocation[];
  onNavigateToSubLocation: (locationId: string) => void;
}

export function LocationDetails({ 
  location, 
  npcs, 
  subLocations, 
  onNavigateToSubLocation 
}: LocationDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'geography' | 'politics' | 'economy' | 'culture' | 'npcs' | 'history'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpenIcon },
    { id: 'geography', label: 'Geography', icon: GlobeAltIcon },
    { id: 'politics', label: 'Politics', icon: BuildingOfficeIcon },
    { id: 'economy', label: 'Economy', icon: CurrencyDollarIcon },
    { id: 'culture', label: 'Culture', icon: UserGroupIcon },
    { id: 'npcs', label: 'NPCs', icon: UsersIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
  ];

  const formatPopulation = (pop?: number) => {
    if (!pop || pop === 0) return 'Unknown';
    if (pop < 1000) return pop.toString();
    if (pop < 1000000) return `${(pop / 1000).toFixed(1)}K`;
    return `${(pop / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{location.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="capitalize">{location.type}</span>
              {location.population !== undefined && location.population > 0 && (
                <span>Population: {formatPopulation(location.population)}</span>
              )}
              <span className="capitalize">Size: {location.size}</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mt-4">{location.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'npcs' && npcs.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                  {npcs.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <UsersIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">{npcs.length}</div>
                <div className="text-sm text-gray-500">NPCs</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <MapPinIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">{subLocations.length}</div>
                <div className="text-sm text-gray-500">Sub-locations</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <SparklesIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">{location.notableFeatures?.length || 0}</div>
                <div className="text-sm text-gray-500">Notable Features</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <div className="text-lg font-semibold text-gray-900">{location.secrets?.length || 0}</div>
                <div className="text-sm text-gray-500">Secrets</div>
              </div>
            </div>

            {/* Detailed Description */}
            {location.detailedDescription && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Description</h3>
                <p className="text-gray-700 leading-relaxed">{location.detailedDescription}</p>
              </div>
            )}

            {/* Notable Features */}
            {location.notableFeatures && location.notableFeatures.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notable Features</h3>
                <ul className="space-y-2">
                  {location.notableFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <SparklesIcon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sub-locations */}
            {subLocations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sub-locations</h3>
                <div className="grid gap-3">
                  {subLocations.map((subLocation) => (
                    <button
                      key={subLocation.id}
                      onClick={() => onNavigateToSubLocation(subLocation.id)}
                      className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{subLocation.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{subLocation.type}</p>
                        </div>
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'geography' && location.geography && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Terrain & Climate</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Terrain: </span>
                    <span className="text-gray-600">{location.geography.terrain}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Climate Zone: </span>
                    <span className="text-gray-600">{location.geography.climateZone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Weather: </span>
                    <span className="text-gray-600">{location.geography.weatherPatterns}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Natural Features</h3>
                <ul className="space-y-1">
                  {location.geography.naturalFeatures.map((feature, index) => (
                    <li key={index} className="text-gray-600">• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            {location.geography.flora.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Flora & Fauna</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Flora</h4>
                    <ul className="space-y-1">
                      {location.geography.flora.map((plant, index) => (
                        <li key={index} className="text-gray-600">• {plant}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Fauna</h4>
                    <ul className="space-y-1">
                      {location.geography.fauna.map((animal, index) => (
                        <li key={index} className="text-gray-600">• {animal}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'politics' && location.politics && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Government</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Type: </span>
                  <span className="text-gray-600">{location.politics.governmentType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status: </span>
                  <span className="text-gray-600">{location.politics.politicalStatus}</span>
                </div>
              </div>
            </div>

            {location.politics.rulers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rulers</h3>
                <ul className="space-y-1">
                  {location.politics.rulers.map((ruler, index) => (
                    <li key={index} className="text-gray-600">• {ruler}</li>
                  ))}
                </ul>
              </div>
            )}

            {location.politics.laws.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Laws & Regulations</h3>
                <ul className="space-y-1">
                  {location.politics.laws.map((law, index) => (
                    <li key={index} className="text-gray-600">• {law}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'economy' && location.economy && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Economic Overview</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Status: </span>
                  <span className="text-gray-600">{location.economy.economicStatus}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Currency: </span>
                  <span className="text-gray-600">{location.economy.currency}</span>
                </div>
              </div>
            </div>

            {location.economy.tradeGoods.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Trade Goods</h3>
                <div className="flex flex-wrap gap-2">
                  {location.economy.tradeGoods.map((good, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {good}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {location.economy.industries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Industries</h3>
                <ul className="space-y-1">
                  {location.economy.industries.map((industry, index) => (
                    <li key={index} className="text-gray-600">• {industry}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'culture' && location.culture && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Demographics</h3>
              <ul className="space-y-1">
                {location.culture.demographics.map((demo, index) => (
                  <li key={index} className="text-gray-600">• {demo}</li>
                ))}
              </ul>
            </div>

            {location.culture.languages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {location.culture.languages.map((language, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {location.culture.customs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customs & Traditions</h3>
                <ul className="space-y-1">
                  {location.culture.customs.map((custom, index) => (
                    <li key={index} className="text-gray-600">• {custom}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'npcs' && (
          <div className="space-y-4">
            {npcs.length > 0 ? (
              npcs.map((npc) => (
                <div key={npc.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{npc.name}</h4>
                      <p className="text-sm text-gray-600">{npc.role}</p>
                      <p className="text-sm text-gray-500 mt-1">{npc.personality}</p>
                    </div>
                    {npc.portraitUrl && (
                      <img 
                        src={npc.portraitUrl} 
                        alt={npc.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No NPCs in this location</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {location.history && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">History</h3>
                <p className="text-gray-700 leading-relaxed">{location.history}</p>
              </div>
            )}

            {location.legends && location.legends.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Legends</h3>
                <ul className="space-y-2">
                  {location.legends.map((legend, index) => (
                    <li key={index} className="text-gray-700">• {legend}</li>
                  ))}
                </ul>
              </div>
            )}

            {location.rumors && location.rumors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rumors</h3>
                <ul className="space-y-2">
                  {location.rumors.map((rumor, index) => (
                    <li key={index} className="text-gray-700">• {rumor}</li>
                  ))}
                </ul>
              </div>
            )}

            {location.secrets && location.secrets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Secrets</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {location.secrets.map((secret, index) => (
                      <li key={index} className="text-red-800">• {secret}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
