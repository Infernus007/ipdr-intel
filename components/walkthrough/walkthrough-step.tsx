'use client';

import React from 'react';

export interface WalkthroughStepProps {
  step: {
    id: string;
    title: string;
    description: string;
    target: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    component?: string;
    order: number;
  };
  isActive: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export function WalkthroughStep({ step, isActive, onNext, onPrevious, onSkip }: WalkthroughStepProps) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tour
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={onPrevious}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={onNext}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
