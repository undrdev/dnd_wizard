import React from 'react';
import type { SkeletonConfig } from '@/types';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

// Base skeleton component
export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  animation = 'pulse',
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  }[animation];

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${animationClass} ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}

// Text skeleton for single lines
export function TextSkeleton({
  lines = 1,
  className = '',
  width = '100%',
}: {
  lines?: number;
  className?: string;
  width?: string | string[];
}) {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width);

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={widths[index] || '100%'}
          height="1rem"
        />
      ))}
    </div>
  );
}

// Card skeleton for campaign/location/NPC cards
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Skeleton width="3rem" height="3rem" borderRadius="50%" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1.25rem" />
            <Skeleton width="40%" height="1rem" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="80%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
        </div>
        
        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton width="5rem" height="2rem" borderRadius="0.375rem" />
          <Skeleton width="4rem" height="1.5rem" borderRadius="0.375rem" />
        </div>
      </div>
    </div>
  );
}

// Table skeleton for data tables
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} width="80%" height="1.25rem" />
        ))}
      </div>
      
      {/* Table Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                width={colIndex === 0 ? '90%' : '70%'}
                height="1rem"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// List skeleton for simple lists
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className = '',
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          {showAvatar && (
            <Skeleton width="2.5rem" height="2.5rem" borderRadius="50%" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="50%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton for forms
export function FormSkeleton({
  fields = 4,
  className = '',
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="30%" height="1rem" />
          <Skeleton width="100%" height="2.5rem" borderRadius="0.375rem" />
        </div>
      ))}
      
      {/* Form buttons */}
      <div className="flex space-x-3 pt-4">
        <Skeleton width="5rem" height="2.5rem" borderRadius="0.375rem" />
        <Skeleton width="4rem" height="2.5rem" borderRadius="0.375rem" />
      </div>
    </div>
  );
}

// Map skeleton for map loading
export function MapSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto">
            <Skeleton width="100%" height="100%" borderRadius="50%" />
          </div>
          <div className="space-y-2">
            <Skeleton width="8rem" height="1rem" />
            <Skeleton width="6rem" height="0.875rem" />
          </div>
        </div>
      </div>
      
      {/* Map controls skeleton */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton width="2.5rem" height="2.5rem" borderRadius="0.375rem" />
        <Skeleton width="2.5rem" height="2.5rem" borderRadius="0.375rem" />
        <Skeleton width="2.5rem" height="2.5rem" borderRadius="0.375rem" />
      </div>
      
      {/* Map legend skeleton */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg space-y-2">
          <Skeleton width="4rem" height="0.875rem" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton width="1rem" height="1rem" borderRadius="50%" />
                <Skeleton width="3rem" height="0.75rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Campaign dashboard skeleton
export function CampaignDashboardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <Skeleton width="40%" height="2rem" />
        <Skeleton width="60%" height="1rem" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton width="3rem" height="3rem" borderRadius="0.5rem" />
                <Skeleton width="2rem" height="1rem" />
              </div>
              <Skeleton width="60%" height="1.25rem" />
              <Skeleton width="40%" height="0.875rem" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="space-y-4">
          <Skeleton width="30%" height="1.25rem" />
          <ListSkeleton items={5} showAvatar />
        </div>
        
        {/* Quick actions */}
        <div className="space-y-4">
          <Skeleton width="25%" height="1.25rem" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="space-y-2">
                  <Skeleton width="2rem" height="2rem" borderRadius="0.375rem" />
                  <Skeleton width="80%" height="1rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic configurable skeleton
export function ConfigurableSkeleton({
  config,
  className = '',
}: {
  config: SkeletonConfig;
  className?: string;
}) {
  const { rows, columns = 1, height = '1rem', width = '100%', borderRadius = '0.25rem', animation = 'pulse' } = config;

  if (columns === 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton
            key={index}
            width={width}
            height={height}
            borderRadius={borderRadius}
            animation={animation}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              width={width}
              height={height}
              borderRadius={borderRadius}
              animation={animation}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
