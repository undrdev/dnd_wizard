import React from 'react';
import {
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  MapIcon,
  PencilIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { useMap } from 'react-leaflet';
import { useMap as useMapHook } from '@/hooks/useMap';

interface QuickMapToolbarProps {
  className?: string;
}

export function QuickMapToolbar({ className = '' }: QuickMapToolbarProps) {
  const map = useMap(); // Leaflet map instance
  const {
    drawingMode,
    setDrawingMode
  } = useMapHook(); // Our custom hook

  const handleZoomIn = () => {
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut();
    }
  };

  const handleFitBounds = () => {
    if (map) {
      map.fitWorld();
    }
  };

  const quickTools = [
    { 
      mode: 'none', 
      icon: MapIcon, 
      label: 'Navigate', 
      action: () => setDrawingMode('none')
    },
    { 
      mode: 'line', 
      icon: PencilIcon, 
      label: 'Draw Line', 
      action: () => setDrawingMode('line')
    },
    { 
      mode: 'polygon', 
      icon: PaintBrushIcon, 
      label: 'Draw Area', 
      action: () => setDrawingMode('polygon')
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      <div className="flex items-center divide-x divide-gray-200">
        {/* Zoom Controls */}
        <div className="flex">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
            title="Zoom In"
          >
            <PlusIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <MinusIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleFitBounds}
            className="p-2 hover:bg-gray-100 transition-colors"
            title="Fit to World"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Quick Drawing Tools */}
        <div className="flex">
          {quickTools.map((tool) => (
            <button
              key={tool.mode}
              onClick={tool.action}
              className={`p-2 transition-colors ${
                drawingMode === tool.mode
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-600'
              } ${tool.mode === 'polygon' ? 'rounded-r-lg' : ''}`}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
