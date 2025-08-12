import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface PricingInfoProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function PricingInfo({ variant = 'detailed', className = '' }: PricingInfoProps) {
  if (variant === 'compact') {
    return (
      <div className={`text-xs text-gray-600 ${className}`}>
        <span>Pricing: </span>
        <a 
          href="https://platform.openai.com/docs/pricing" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
        >
          OpenAI
        </a>
        <span> • </span>
        <a 
          href="https://www.anthropic.com/pricing#api" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline"
        >
          Anthropic
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start">
        <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 mb-2">
            AI Service Pricing
          </p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• API usage is charged per token (word/piece of text)</p>
            <p>• Costs vary by model and provider</p>
            <p>• Pricing is subject to change by providers</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <a 
              href="https://platform.openai.com/docs/pricing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-xs"
            >
              <span>🔗</span>
              <span className="ml-1">OpenAI Pricing</span>
              <span className="ml-1 text-gray-500">(opens in new tab)</span>
            </a>
            <a 
              href="https://www.anthropic.com/pricing#api" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-xs"
            >
              <span>🔗</span>
              <span className="ml-1">Anthropic Pricing</span>
              <span className="ml-1 text-gray-500">(opens in new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
