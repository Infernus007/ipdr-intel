// Demo Data Provider Component
'use client';

import { useEffect } from 'react';
import { useDemoData } from '@/hooks/use-demo-data';
import { WalkthroughProvider } from '@/components/walkthrough/walkthrough-provider';

interface DemoProviderProps {
  children: React.ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const { initializeDemoData, isInitialized } = useDemoData();
  
  useEffect(() => {
    // Initialize demo data on app start
    if (!isInitialized) {
      initializeDemoData();
    }
  }, [initializeDemoData, isInitialized]);
  
  return (
    <WalkthroughProvider>
      {children}
    </WalkthroughProvider>
  );
}
