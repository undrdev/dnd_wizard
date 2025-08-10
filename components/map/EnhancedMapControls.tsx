import React, { useState } from 'react';
import { 
  PencilIcon, 
  MapIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline';
import { useMap } from '@/hooks/useMap';
import { useMobile } from '@/hooks/useMobile';

interface EnhancedMapControlsProps {
  className?: string;
}

export function EnhancedMapControls({ className = '' }: EnhancedMapControlsProps) {
  const { 
    drawingMode, 
    setDrawingMode, 
    layers, 
    toggleLayer, 
    setLayerOpacity,
    currentTheme,
    setMapTheme,
    clusteringEnabled,
    toggleClustering,
    mapRef
  } = useMap();
  
  const { isMobile } = useMobile();
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);

  const drawingTools = [
    { mode: 'none', icon: MapIcon, label: 'Navigate', color: 'text-blue-600' },
    { mode: 'line', icon: PencilIcon, label: 'Draw Line', color: 'text-green-600' },
    { mode: 'polygon', icon: PaintBrushIcon, label: 'Draw Area', color: 'text-purple-600' },
    { mode: 'circle', icon: ArrowsPointingOutIcon, label: 'Draw Circle', color: 'text-orange-600' },
    { mode: 'text', icon: PencilIcon, label: 'Add Text', color: 'text-red-600' },
  ];

  const handleZoomIn = () => {
    if (mapRef) {
      mapRef.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef) {
      mapRef.zoomOut();
    }
  };

  const handleFitBounds = () => {
    if (mapRef) {
      mapRef.fitWorld();
    }
  };

  return (
    <div className={className}>
      {/* Main Controls */}
      <div className="space-y-2">
        {/* Zoom Controls */}
        <div className="flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom In"
          >
            <PlusIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom Out"
          >
            <MinusIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handleFitBounds}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Fit to World"
          >
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="border-t border-gray-200 pt-2">
          {/* Drawing Tools */}
          <div className="space-y-1">
            {drawingTools.map((tool) => (
              <button
                key={tool.mode}
                onClick={() => setDrawingMode(tool.mode as any)}
                className={`w-full p-2 rounded-md transition-colors flex items-center justify-center ${
                  drawingMode === tool.mode
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
                title={tool.label}
              >
                <tool.icon 
                  className={`h-5 w-5 ${
                    drawingMode === tool.mode ? 'text-blue-600' : tool.color
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-2">
          {/* Layer Controls */}
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className={`w-full p-2 rounded-md transition-colors flex items-center justify-center ${
              showLayerPanel ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
            }`}
            title="Layers"
          >
            <RectangleStackIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Theme Controls */}
          <button
            onClick={() => setShowThemePanel(!showThemePanel)}
            className={`w-full p-2 rounded-md transition-colors flex items-center justify-center ${
              showThemePanel ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
            }`}
            title="Themes"
          >
            <Cog6ToothIcon className="h-5 w-5 text-gray-600" />
          </button>

          {/* Clustering Toggle */}
          <button
            onClick={toggleClustering}
            className={`w-full p-2 rounded-md transition-colors flex items-center justify-center ${
              clusteringEnabled ? 'bg-green-100 border border-green-300' : 'hover:bg-gray-100'
            }`}
            title={clusteringEnabled ? 'Disable Clustering' : 'Enable Clustering'}
          >
            <ArrowsPointingOutIcon 
              className={`h-5 w-5 ${
                clusteringEnabled ? 'text-green-600' : 'text-gray-600'
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="border-t border-gray-200 pt-3 mt-3 bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Map Layers</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className="flex items-center"
                  >
                    {layer.visible ? (
                      <EyeIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <span className="text-xs text-gray-700 truncate max-w-20">
                    {layer.name}
                  </span>
                </div>
                {layer.visible && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theme Panel */}
      {showThemePanel && (
        <div className="border-t border-gray-200 pt-3 mt-3 bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Map Themes</h4>
          <div className="space-y-1">
            {['standard', 'fantasy', 'dark'].map((themeId) => (
              <button
                key={themeId}
                onClick={() => setMapTheme(themeId)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  currentTheme?.id === themeId
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {themeId.charAt(0).toUpperCase() + themeId.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
