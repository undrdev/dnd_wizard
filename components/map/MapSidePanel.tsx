import React, { useState } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  MapIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ImprovedDrawingTools } from './ImprovedDrawingTools';
import { EnhancedMapControls } from './EnhancedMapControls';
import { useMobile } from '@/hooks/useMobile';

interface MapSidePanelProps {
  className?: string;
}

type PanelTab = 'drawing' | 'controls' | 'layers';

export function MapSidePanel({ className = '' }: MapSidePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('drawing');
  const { isMobile } = useMobile();

  const tabs = [
    { id: 'drawing' as PanelTab, label: 'Drawing', icon: PaintBrushIcon },
    { id: 'controls' as PanelTab, label: 'Controls', icon: Cog6ToothIcon },
    { id: 'layers' as PanelTab, label: 'Layers', icon: EyeIcon },
  ];

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const selectTab = (tab: PanelTab) => {
    setActiveTab(tab);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full z-[1000] flex ${className}`}>
      {/* Panel Content */}
      <div 
        className={`bg-white shadow-xl border-l border-gray-200 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isMobile ? 'w-80' : 'w-96'}`}
        style={{ height: '100vh' }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {!isMobile && <span>{tab.label}</span>}
              </button>
            ))}
          </div>
          <button
            onClick={togglePanel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'drawing' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Drawing Tools</h3>
              <ImprovedDrawingTools className="" />
            </div>
          )}
          
          {activeTab === 'controls' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Map Controls</h3>
              <EnhancedMapControls className="" />
            </div>
          )}
          
          {activeTab === 'layers' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Map Layers</h3>
              <div className="text-sm text-gray-600">
                Layer management controls will be integrated here.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button (when panel is closed) */}
      {!isOpen && (
        <div className="flex flex-col bg-white shadow-lg border-l border-gray-200 rounded-l-lg">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                index === 0 ? 'rounded-tl-lg' : ''
              } ${index === tabs.length - 1 ? 'rounded-bl-lg' : ''} border-b border-gray-200 last:border-b-0`}
              title={tab.label}
            >
              <tab.icon className="h-5 w-5" />
            </button>
          ))}
          
          {/* Expand button */}
          <button
            onClick={togglePanel}
            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border-t border-gray-200 rounded-bl-lg"
            title="Open Panel"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* Mobile-specific adjustments */
export function MobileMapSidePanel({ className = '' }: MapSidePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('drawing');

  const tabs = [
    { id: 'drawing' as PanelTab, label: 'Draw', icon: PaintBrushIcon },
    { id: 'controls' as PanelTab, label: 'Controls', icon: Cog6ToothIcon },
    { id: 'layers' as PanelTab, label: 'Layers', icon: EyeIcon },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[1000] ${className}`}>
      {/* Mobile Panel Content */}
      <div 
        className={`bg-white shadow-xl border-t border-gray-200 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh' }}
      >
        {/* Mobile Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-5 w-5 rotate-90" />
          </button>
        </div>

        {/* Mobile Panel Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(70vh - 80px)' }}>
          {activeTab === 'drawing' && <ImprovedDrawingTools className="" />}
          {activeTab === 'controls' && <EnhancedMapControls className="" />}
          {activeTab === 'layers' && (
            <div className="text-sm text-gray-600">
              Layer management controls will be integrated here.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Toggle Button (when panel is closed) */}
      {!isOpen && (
        <div className="flex justify-center bg-white shadow-lg border-t border-gray-200 rounded-t-lg mx-4 mb-4">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsOpen(true);
                }}
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
                title={tab.label}
              >
                <tab.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
