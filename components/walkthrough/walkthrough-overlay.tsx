'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalkthroughStepData } from './walkthrough-provider';
import { ChevronLeft, ChevronRight, X, Play, SkipForward } from 'lucide-react';

interface WalkthroughOverlayProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  stepData: WalkthroughStepData;
}

export function WalkthroughOverlay({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  stepData
}: WalkthroughOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find target element
    const target = document.querySelector(stepData.target) as HTMLElement;
    setTargetElement(target);

    if (target && target !== document.body) {
      const rect = target.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });

      // Scroll to target if needed
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [stepData.target]);

  const getTooltipPosition = () => {
    if (!targetElement || stepData.target === 'body') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (stepData.position) {
      case 'top':
        top = rect.top - tooltipHeight - 20;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + 20;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - 20;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + 20;
        break;
      case 'center':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
    }

    // Ensure tooltip stays within viewport
    if (left < 20) left = 20;
    if (left + tooltipWidth > window.innerWidth - 20) left = window.innerWidth - tooltipWidth - 20;
    if (top < 20) top = 20;
    if (top + tooltipHeight > window.innerHeight - 20) top = window.innerHeight - tooltipHeight - 20;

    return { top: `${top}px`, left: `${left}px` };
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight overlay for target element */}
      {targetElement && stepData.target !== 'body' && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 rounded-lg pointer-events-none"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
            zIndex: 51
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={overlayRef}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 p-6 max-w-sm"
        style={tooltipStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Play className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {stepData.title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {stepData.description}
          </p>
          {stepData.component && (
            <div className="mt-3 text-xs text-gray-400">
              Component: {stepData.component}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevious}
              disabled={currentStep === 0}
              className="text-gray-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
            
            <Button
              onClick={onNext}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
