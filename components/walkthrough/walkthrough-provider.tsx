'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalkthroughStep } from './walkthrough-step';
import { WalkthroughOverlay } from './walkthrough-overlay';

export interface WalkthroughStepData {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  component?: string; // Component name for reference
  order: number;
}

export interface WalkthroughContextType {
  isActive: boolean;
  currentStep: number;
  steps: WalkthroughStepData[];
  startWalkthrough: () => void;
  stopWalkthrough: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  hasSeenWalkthrough: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

const DEFAULT_WALKTHROUGH_STEPS: WalkthroughStepData[] = [
  {
    id: 'welcome',
    title: 'Welcome to IPDR-Intel+',
    description: 'Your advanced digital forensics platform for telecom data analysis. Let\'s take a quick tour!',
    target: 'body',
    position: 'center',
    component: 'Welcome',
    order: 1
  },
  {
    id: 'create-case',
    title: 'Create Investigation Case',
    description: 'Start by creating a new investigation case. Click "New Case" to begin analyzing IPDR data.',
    target: '[data-walkthrough="create-case"]',
    position: 'bottom',
    component: 'CreateCaseDialog',
    order: 2
  },
  {
    id: 'upload-files',
    title: 'Upload IPDR Files',
    description: 'Drag and drop your Airtel IPDR files here. The system automatically detects the operator and processes the data.',
    target: '[data-walkthrough="upload-area"]',
    position: 'top',
    component: 'IPDRFileUpload',
    order: 3
  },
  {
    id: 'view-records',
    title: 'Analyze Records',
    description: 'View and filter all parsed IPDR records. Use the search and filter options to find specific patterns.',
    target: '[data-walkthrough="records-table"]',
    position: 'left',
    component: 'RecordsTable',
    order: 4
  },
  {
    id: 'anomaly-detection',
    title: 'Anomaly Detection',
    description: 'AI-powered anomaly detection identifies suspicious patterns like late-night activity, high data volumes, and communication bursts.',
    target: '[data-walkthrough="anomaly-detection"]',
    position: 'right',
    component: 'AnomalyDetection',
    order: 5
  },
  {
    id: 'generate-reports',
    title: 'Generate Reports',
            description: 'Create court-ready PDF reports with Section 63S compliance. Includes digital signatures and audit trails.',
    target: '[data-walkthrough="generate-reports"]',
    position: 'top',
    component: 'ReportGeneration',
    order: 6
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the navigation menu to switch between different investigation tools and features.',
    target: '[data-walkthrough="nav-menu"]',
    position: 'bottom',
    component: 'NavMenu',
    order: 7
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'ve completed the walkthrough. Start investigating with confidence!',
    target: 'body',
    position: 'center',
    component: 'Complete',
    order: 8
  }
];

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);
  const [steps] = useState<WalkthroughStepData[]>(DEFAULT_WALKTHROUGH_STEPS);

  useEffect(() => {
    // Check if user has seen walkthrough before
    const seen = localStorage.getItem('ipdr-intel-walkthrough-seen');
    if (seen) {
      setHasSeenWalkthrough(true);
    }
  }, []);

  const startWalkthrough = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const stopWalkthrough = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('ipdr-intel-walkthrough-seen', 'true');
    setHasSeenWalkthrough(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      stopWalkthrough();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  const value: WalkthroughContextType = {
    isActive,
    currentStep,
    steps,
    startWalkthrough,
    stopWalkthrough,
    nextStep,
    previousStep,
    goToStep,
    hasSeenWalkthrough
  };

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
      {isActive && (
        <WalkthroughOverlay
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={stopWalkthrough}
          stepData={steps[currentStep]}
        />
      )}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (context === undefined) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
}

// Hook to mark elements for walkthrough
export function useWalkthroughTarget(id: string) {
  return {
    'data-walkthrough': id
  };
}
