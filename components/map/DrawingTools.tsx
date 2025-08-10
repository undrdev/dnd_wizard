import React, { useState, useEffect } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import { useMap } from '@/hooks/useMap';
import type { DrawingMode, AnnotationStyle } from '@/types';

interface DrawingToolsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DrawingTools({ isOpen, onClose }: DrawingToolsProps) {
  const { 
    drawingMode, 
    setDrawingMode, 
    addAnnotation,
    measurementMode,
    startMeasurement,
    finishMeasurement,
    currentMeasurement 
  } = useMap();
  
  const [currentStyle, setCurrentStyle] = useState<AnnotationStyle>({
    color: '#3b82f6',
    fillColor: '#3b82f6',
    weight: 3,
    opacity: 0.8,
    fillOpacity: 0.2
  });

  const map = useLeafletMap();

  useEffect(() => {
    if (!map) return;

    let drawingLayer: L.Layer | null = null;
    let isDrawing = false;
    let currentPoints: L.LatLng[] = [];

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (drawingMode === 'none') return;

      const point = e.latlng;
      currentPoints.push(point);

      if (drawingMode === 'text') {
        // Handle text annotation
        const text = prompt('Enter text for annotation:');
        if (text) {
          addAnnotation({
            type: 'text',
            coordinates: [{ lat: point.lat, lng: point.lng }],
            style: { ...currentStyle, fontSize: 14, fontFamily: 'Arial' },
            label: text
          });
        }
        setDrawingMode('none');
        return;
      }

      if (drawingMode === 'circle') {
        if (!isDrawing) {
          // Start drawing circle
          isDrawing = true;
          drawingLayer = L.circle([point.lat, point.lng], { radius: 1000, ...currentStyle });
          map.addLayer(drawingLayer);
        } else {
          // Finish circle
          if (drawingLayer && drawingLayer instanceof L.Circle) {
            const center = drawingLayer.getLatLng();
            const radius = center.distanceTo(point);
            drawingLayer.setRadius(radius);
            
            // Save annotation
            addAnnotation({
              type: 'circle',
              coordinates: [{ lat: center.lat, lng: center.lng }],
              style: currentStyle,
              description: `Circle with radius ${Math.round(radius)}m`
            });
          }
          
          finishDrawing();
        }
        return;
      }

      if (drawingMode === 'line' || drawingMode === 'polygon') {
        if (!isDrawing) {
          // Start drawing
          isDrawing = true;
          if (drawingMode === 'line') {
            drawingLayer = L.polyline([[point.lat, point.lng]], currentStyle);
          } else {
            drawingLayer = L.polygon([[point.lat, point.lng]], currentStyle);
          }
          map.addLayer(drawingLayer);
        } else {
          // Add point to existing shape
          if (drawingLayer && (drawingLayer instanceof L.Polyline)) {
            drawingLayer.addLatLng(point);
          }
        }
      }

      if (drawingMode === 'rectangle') {
        if (!isDrawing) {
          // Start rectangle
          isDrawing = true;
          drawingLayer = L.rectangle([[point.lat, point.lng], [point.lat, point.lng]], currentStyle);
          map.addLayer(drawingLayer);
        } else {
          // Finish rectangle
          if (drawingLayer && drawingLayer instanceof L.Rectangle) {
            const bounds = L.latLngBounds(currentPoints[0], point);
            drawingLayer.setBounds(bounds);
            
            // Save annotation
            addAnnotation({
              type: 'rectangle',
              coordinates: [
                { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
                { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng }
              ],
              style: currentStyle
            });
          }
          
          finishDrawing();
        }
        return;
      }
    };

    const handleDoubleClick = () => {
      if ((drawingMode === 'line' || drawingMode === 'polygon') && isDrawing && drawingLayer) {
        // Finish line or polygon
        const coordinates = currentPoints.map(p => ({ lat: p.lat, lng: p.lng }));
        
        addAnnotation({
          type: drawingMode,
          coordinates,
          style: currentStyle
        });
        
        finishDrawing();
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawing || !drawingLayer) return;

      if (drawingMode === 'circle' && drawingLayer instanceof L.Circle) {
        const center = drawingLayer.getLatLng();
        const radius = center.distanceTo(e.latlng);
        drawingLayer.setRadius(radius);
      } else if (drawingMode === 'rectangle' && drawingLayer instanceof L.Rectangle && currentPoints.length > 0) {
        const bounds = L.latLngBounds(currentPoints[0], e.latlng);
        drawingLayer.setBounds(bounds);
      }
    };

    const finishDrawing = () => {
      isDrawing = false;
      currentPoints = [];
      if (drawingLayer) {
        map.removeLayer(drawingLayer);
        drawingLayer = null;
      }
      setDrawingMode('none');
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishDrawing();
      }
    };

    if (drawingMode !== 'none') {
      map.on('click', handleMapClick);
      map.on('dblclick', handleDoubleClick);
      map.on('mousemove', handleMouseMove);
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      map.off('click', handleMapClick);
      map.off('dblclick', handleDoubleClick);
      map.off('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      
      if (drawingLayer) {
        map.removeLayer(drawingLayer);
      }
    };
  }, [map, drawingMode, currentStyle, addAnnotation, setDrawingMode]);

  if (!isOpen) return null;

  const tools = [
    { mode: 'line' as DrawingMode, icon: '📏', label: 'Line', description: 'Draw lines and paths' },
    { mode: 'polygon' as DrawingMode, icon: '⬟', label: 'Polygon', description: 'Draw areas and regions' },
    { mode: 'circle' as DrawingMode, icon: '⭕', label: 'Circle', description: 'Draw circular areas' },
    { mode: 'rectangle' as DrawingMode, icon: '⬜', label: 'Rectangle', description: 'Draw rectangular areas' },
    { mode: 'text' as DrawingMode, icon: '📝', label: 'Text', description: 'Add text annotations' }
  ];

  return (
    <div className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Drawing Tools</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Tools */}
      <div className="p-4 space-y-4">
        {/* Drawing Tools */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Drawing Tools</h4>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <button
                key={tool.mode}
                onClick={() => setDrawingMode(tool.mode)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  drawingMode === tool.mode
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                title={tool.description}
              >
                <div className="text-lg mb-1">{tool.icon}</div>
                <div className="text-xs font-medium">{tool.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Measurement Tools */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Measurement</h4>
          <div className="space-y-2">
            <button
              onClick={startMeasurement}
              className={`w-full p-2 border rounded text-sm ${
                measurementMode
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              📐 Start Measurement
            </button>
            
            {measurementMode && (
              <button
                onClick={finishMeasurement}
                className="w-full p-2 border border-red-200 bg-red-50 text-red-700 rounded text-sm hover:bg-red-100"
              >
                ✅ Finish Measurement
              </button>
            )}
            
            {currentMeasurement && (
              <div className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">
                  {currentMeasurement.type === 'distance' ? 'Distance' : 'Area'}:
                </div>
                <div className="text-gray-600">
                  {currentMeasurement.value.toFixed(2)} {currentMeasurement.unit}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style Controls */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Style</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <input
                type="color"
                value={currentStyle.color}
                onChange={(e) => setCurrentStyle({ ...currentStyle, color: e.target.value, fillColor: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Line Width</label>
              <input
                type="range"
                min="1"
                max="10"
                value={currentStyle.weight}
                onChange={(e) => setCurrentStyle({ ...currentStyle, weight: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{currentStyle.weight}px</div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentStyle.opacity}
                onChange={(e) => setCurrentStyle({ ...currentStyle, opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{Math.round(currentStyle.opacity * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Clear Tools */}
        <div>
          <button
            onClick={() => setDrawingMode('none')}
            className="w-full p-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            🚫 Cancel Drawing
          </button>
        </div>

        {/* Instructions */}
        {drawingMode !== 'none' && (
          <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
            <div className="font-medium mb-1">Instructions:</div>
            {drawingMode === 'line' && "Click to add points, double-click to finish"}
            {drawingMode === 'polygon' && "Click to add points, double-click to finish"}
            {drawingMode === 'circle' && "Click center, then click edge to set radius"}
            {drawingMode === 'rectangle' && "Click one corner, then click opposite corner"}
            {drawingMode === 'text' && "Click where you want to place text"}
            <div className="mt-1">Press ESC to cancel</div>
          </div>
        )}
      </div>
    </div>
  );
}
