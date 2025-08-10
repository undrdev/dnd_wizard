import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/stores/useAppStore';
import { useMap as useMapHook } from '@/hooks/useMap';
import { 
  PencilIcon, 
  TrashIcon, 
  PaintBrushIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface DrawingToolsProps {
  className?: string;
}

export function ImprovedDrawingTools({ className = '' }: DrawingToolsProps) {
  const map = useMap();
  const { mapState } = useAppStore();
  const { 
    drawingMode, 
    setDrawingMode, 
    addAnnotation, 
    deleteAnnotation,
    clearAllAnnotations 
  } = useMapHook();
  
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillOpacity, setFillOpacity] = useState(0.3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<L.LatLng[]>([]);

  const colors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#84cc16', // Lime
  ];

  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawingMode === 'none') return;

      const point = e.latlng;

      if (drawingMode === 'line' || drawingMode === 'polygon') {
        if (!isDrawing) {
          // Start drawing
          setIsDrawing(true);
          setCurrentPath([point]);
        } else {
          // Continue drawing
          setCurrentPath(prev => [...prev, point]);
        }
      } else if (drawingMode === 'circle') {
        // Create circle at click point
        const annotation = {
          id: `circle_${Date.now()}`,
          campaignId: mapState.selectedLocation || 'default',
          type: 'circle' as const,
          coordinates: [point],
          style: {
            color: currentColor,
            fillColor: currentColor,
            weight: strokeWidth,
            opacity: 1,
            fillOpacity: fillOpacity,
          },
          label: 'Circle',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addAnnotation(annotation);
      } else if (drawingMode === 'text') {
        // Add text annotation
        const text = prompt('Enter text:');
        if (text) {
          const annotation = {
            id: `text_${Date.now()}`,
            campaignId: mapState.selectedLocation || 'default',
            type: 'text' as const,
            coordinates: [point],
            style: {
              color: currentColor,
              weight: strokeWidth,
              opacity: 1,
              fontSize: 14,
              fontFamily: 'Arial',
            },
            label: text,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          addAnnotation(annotation);
        }
      }
    };

    const handleMapDoubleClick = () => {
      if (isDrawing && currentPath.length > 1) {
        // Finish drawing
        const annotation = {
          id: `${drawingMode}_${Date.now()}`,
          campaignId: mapState.selectedLocation || 'default',
          type: drawingMode as 'line' | 'polygon',
          coordinates: currentPath,
          style: {
            color: currentColor,
            fillColor: currentColor,
            weight: strokeWidth,
            opacity: 1,
            fillOpacity: drawingMode === 'polygon' ? fillOpacity : 0,
          },
          label: `${drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addAnnotation(annotation);
        setIsDrawing(false);
        setCurrentPath([]);
      }
    };

    map.on('click', handleMapClick);
    map.on('dblclick', handleMapDoubleClick);

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleMapDoubleClick);
    };
  }, [map, drawingMode, isDrawing, currentPath, currentColor, strokeWidth, fillOpacity, addAnnotation, mapState.selectedLocation]);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all annotations?')) {
      clearAllAnnotations();
    }
  };

  const handleFinishDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      const annotation = {
        id: `${drawingMode}_${Date.now()}`,
        campaignId: mapState.selectedLocation || 'default',
        type: drawingMode as 'line' | 'polygon',
        coordinates: currentPath,
        style: {
          color: currentColor,
          fillColor: currentColor,
          weight: strokeWidth,
          opacity: 1,
          fillOpacity: drawingMode === 'polygon' ? fillOpacity : 0,
        },
        label: `${drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addAnnotation(annotation);
      setIsDrawing(false);
      setCurrentPath([]);
    }
  };

  return (
    <div className={className}>
      {/* Drawing Tools content - header removed since it's in the panel */}
      
      {/* Drawing Status */}
      {isDrawing && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-800">
              Drawing {drawingMode}... ({currentPath.length} points)
            </span>
            <button
              onClick={handleFinishDrawing}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Finish
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Double-click to finish drawing
          </p>
        </div>
      )}

      {/* Color Picker */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
        <div className="flex flex-wrap gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-6 h-6 rounded border-2 transition-all ${
                currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="mt-1 w-full h-8 rounded border border-gray-300"
        />
      </div>

      {/* Stroke Width */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Stroke Width: {strokeWidth}px
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Fill Opacity (for polygons and circles) */}
      {(drawingMode === 'polygon' || drawingMode === 'circle') && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Fill Opacity: {Math.round(fillOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={fillOpacity}
            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleClearAll}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          <TrashIcon className="h-4 w-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-3 p-2 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          {drawingMode === 'none' && 'Select a drawing tool to start'}
          {drawingMode === 'line' && 'Click to add points, double-click to finish'}
          {drawingMode === 'polygon' && 'Click to add points, double-click to finish'}
          {drawingMode === 'circle' && 'Click to place a circle'}
          {drawingMode === 'text' && 'Click to add text'}
        </p>
      </div>
    </div>
  );
}
