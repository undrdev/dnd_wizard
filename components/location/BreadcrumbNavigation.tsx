import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { EnhancedLocation } from '@/types';

interface BreadcrumbNavigationProps {
  currentLocation: EnhancedLocation | null;
  locations: EnhancedLocation[];
  onNavigate: (locationId: string) => void;
  onNavigateHome: () => void;
}

export function BreadcrumbNavigation({ 
  currentLocation, 
  locations, 
  onNavigate, 
  onNavigateHome 
}: BreadcrumbNavigationProps) {
  // Build breadcrumb path
  const buildBreadcrumbPath = (location: EnhancedLocation | null): EnhancedLocation[] => {
    if (!location) return [];
    
    const path: EnhancedLocation[] = [location];
    let current = location;
    
    while (current.parentLocationId) {
      const parent = locations.find(loc => loc.id === current.parentLocationId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    
    return path;
  };

  const breadcrumbPath = buildBreadcrumbPath(currentLocation);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {/* Home */}
      <button
        onClick={onNavigateHome}
        className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
        <span>World</span>
      </button>

      {/* Breadcrumb path */}
      {breadcrumbPath.map((location, index) => (
        <React.Fragment key={location.id}>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <button
            onClick={() => onNavigate(location.id)}
            className={`hover:text-blue-600 transition-colors truncate max-w-32 ${
              index === breadcrumbPath.length - 1 
                ? 'text-gray-900 font-medium' 
                : 'text-gray-600'
            }`}
            title={location.name}
          >
            {location.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
