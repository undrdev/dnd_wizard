import React, { useState } from 'react';
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
  const {
    drawingMode,
    setDrawingMode,
    clearAllAnnotations
  } = useMapHook();
  
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillOpacity, setFillOpacity] = useState(0.3);

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



  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all annotations?')) {
      clearAllAnnotations();
    }
  };



  return (
    <div className={className}>
      {/* Drawing Tools content - header removed since it's in the panel */}
      
      {/* Drawing Instructions */}
      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          Current mode: <strong>{drawingMode === 'none' ? 'Navigate' : drawingMode}</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          {drawingMode === 'none' && 'Select a drawing tool to start'}
          {drawingMode === 'line' && 'Click to add points, double-click to finish'}
          {drawingMode === 'polygon' && 'Click to add points, double-click to finish'}
          {drawingMode === 'circle' && 'Click to place a circle'}
          {drawingMode === 'text' && 'Click to add text'}
        </p>
      </div>

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
