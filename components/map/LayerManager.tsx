import React, { useState } from 'react';
import { useMap } from '@/hooks/useMap';
import { DEFAULT_TERRAIN_LAYERS } from '@/lib/mapThemes';
import { PREDEFINED_BIOME_LAYERS } from './TerrainLayers';
import type { MapLayer } from '@/types';

interface LayerManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayerManager({ isOpen, onClose }: LayerManagerProps) {
  const { 
    layers, 
    toggleLayer, 
    setLayerOpacity, 
    addLayer, 
    removeLayer,
    currentTheme,
    setMapTheme 
  } = useMap();
  
  const [activeTab, setActiveTab] = useState<'terrain' | 'biomes' | 'annotations' | 'themes'>('terrain');

  if (!isOpen) return null;

  const terrainLayers = layers.filter(layer => layer.type === 'terrain');
  const biomeLayers = layers.filter(layer => layer.type === 'custom');
  const annotationLayers = layers.filter(layer => layer.type === 'annotations');

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Layer Manager</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'terrain', label: 'Terrain' },
          { id: 'biomes', label: 'Biomes' },
          { id: 'annotations', label: 'Annotations' },
          { id: 'themes', label: 'Themes' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'terrain' && (
          <TerrainLayersTab
            layers={terrainLayers}
            onToggleLayer={toggleLayer}
            onSetOpacity={setLayerOpacity}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
          />
        )}
        
        {activeTab === 'biomes' && (
          <BiomeLayersTab
            layers={biomeLayers}
            onToggleLayer={toggleLayer}
            onSetOpacity={setLayerOpacity}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
          />
        )}
        
        {activeTab === 'annotations' && (
          <AnnotationLayersTab
            layers={annotationLayers}
            onToggleLayer={toggleLayer}
            onSetOpacity={setLayerOpacity}
          />
        )}
        
        {activeTab === 'themes' && (
          <ThemesTab
            currentTheme={currentTheme}
            onSetTheme={setMapTheme}
          />
        )}
      </div>
    </div>
  );
}

interface LayerTabProps {
  layers: MapLayer[];
  onToggleLayer: (layerId: string) => void;
  onSetOpacity: (layerId: string, opacity: number) => void;
  onAddLayer?: (layer: MapLayer) => void;
  onRemoveLayer?: (layerId: string) => void;
}

function TerrainLayersTab({ layers, onToggleLayer, onSetOpacity, onAddLayer, onRemoveLayer }: LayerTabProps) {
  const availableLayers = DEFAULT_TERRAIN_LAYERS.filter(
    defaultLayer => !layers.some(layer => layer.id === defaultLayer.id)
  );

  return (
    <div className="space-y-4">
      {/* Active Layers */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Active Terrain Layers</h4>
        {layers.length === 0 ? (
          <p className="text-sm text-gray-500">No terrain layers active</p>
        ) : (
          <div className="space-y-2">
            {layers.map((layer) => (
              <LayerControl
                key={layer.id}
                layer={layer}
                onToggle={() => onToggleLayer(layer.id)}
                onOpacityChange={(opacity) => onSetOpacity(layer.id, opacity)}
                onRemove={onRemoveLayer ? () => onRemoveLayer(layer.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available Layers */}
      {availableLayers.length > 0 && onAddLayer && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Add Terrain Layer</h4>
          <div className="space-y-1">
            {availableLayers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onAddLayer(layer)}
                className="w-full text-left px-2 py-1 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
              >
                {layer.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BiomeLayersTab({ layers, onToggleLayer, onSetOpacity, onAddLayer, onRemoveLayer }: LayerTabProps) {
  const availableLayers = PREDEFINED_BIOME_LAYERS.filter(
    defaultLayer => !layers.some(layer => layer.id === defaultLayer.id)
  );

  return (
    <div className="space-y-4">
      {/* Active Layers */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Active Biome Layers</h4>
        {layers.length === 0 ? (
          <p className="text-sm text-gray-500">No biome layers active</p>
        ) : (
          <div className="space-y-2">
            {layers.map((layer) => (
              <LayerControl
                key={layer.id}
                layer={layer}
                onToggle={() => onToggleLayer(layer.id)}
                onOpacityChange={(opacity) => onSetOpacity(layer.id, opacity)}
                onRemove={onRemoveLayer ? () => onRemoveLayer(layer.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available Layers */}
      {availableLayers.length > 0 && onAddLayer && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Add Biome Layer</h4>
          <div className="space-y-1">
            {availableLayers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onAddLayer(layer)}
                className="w-full text-left px-2 py-1 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
              >
                {layer.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnotationLayersTab({ layers, onToggleLayer, onSetOpacity }: Omit<LayerTabProps, 'onAddLayer' | 'onRemoveLayer'>) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Annotation Layers</h4>
        {layers.length === 0 ? (
          <p className="text-sm text-gray-500">No annotation layers</p>
        ) : (
          <div className="space-y-2">
            {layers.map((layer) => (
              <LayerControl
                key={layer.id}
                layer={layer}
                onToggle={() => onToggleLayer(layer.id)}
                onOpacityChange={(opacity) => onSetOpacity(layer.id, opacity)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ThemesTabProps {
  currentTheme: any;
  onSetTheme: (themeId: string) => void;
}

function ThemesTab({ currentTheme, onSetTheme }: ThemesTabProps) {
  const themes = [
    { id: 'standard', name: 'Standard', description: 'Default OpenStreetMap style' },
    { id: 'fantasy', name: 'Fantasy', description: 'Fantasy-themed markers and colors' },
    { id: 'dark', name: 'Dark', description: 'Dark theme for night sessions' }
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-900">Map Themes</h4>
      {themes.map((theme) => (
        <div
          key={theme.id}
          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
            currentTheme?.id === theme.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSetTheme(theme.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-gray-900">{theme.name}</h5>
              <p className="text-xs text-gray-500">{theme.description}</p>
            </div>
            {currentTheme?.id === theme.id && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface LayerControlProps {
  layer: MapLayer;
  onToggle: () => void;
  onOpacityChange: (opacity: number) => void;
  onRemove?: () => void;
}

function LayerControl({ layer, onToggle, onOpacityChange, onRemove }: LayerControlProps) {
  return (
    <div className="p-2 border border-gray-200 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={onToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-900">{layer.name}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm"
            title="Remove layer"
          >
            ✕
          </button>
        )}
      </div>
      
      {layer.visible && (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layer.opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-8">
            {Math.round(layer.opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
