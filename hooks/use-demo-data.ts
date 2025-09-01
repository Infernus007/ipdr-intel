// Custom hook for demo data management
'use client';

import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { generateFullDemoData } from '@/lib/mock-data';

export function useDemoData() {
  const store = useAppStore();
  
  const initializeDemoData = useCallback(() => {
    console.log('Initializing demo data...');
    console.log('Current store state:', {
      cases: store.cases.length,
      records: store.records.length,
      evidenceFiles: store.evidenceFiles.length
    });
    
    // Only initialize if no data exists
    if (store.cases.length === 0) {
      console.log('No cases found, generating demo data...');
      const demoData = generateFullDemoData();
      
      console.log('Demo data generated:', {
        case: demoData.case,
        records: demoData.records.length,
        evidenceFiles: demoData.evidenceFiles.length,
        anomalies: demoData.anomalies.length,
        graphData: demoData.graphData
      });
      
      // Set the demo case as current
      store.setCurrentCase(demoData.case);
      store.addCase(demoData.case);
      
      // Add evidence files
      demoData.evidenceFiles.forEach(file => {
        store.addEvidenceFile(file);
      });
      
      // Add records
      store.setRecords(demoData.records);
      
      // Add anomalies
      store.setAnomalies(demoData.anomalies);
      
      // Add watchlist items
      demoData.watchlist.forEach(item => {
        store.addWatchlistItem(item);
      });
      
      // Set graph data
      store.setGraphData(demoData.graphData);
      
      // Update analytics
      store.updateAnalytics({
        totalRecords: demoData.records.length,
        totalCases: 1,
        totalAnomalies: demoData.anomalies.length,
        operatorBreakdown: calculateOperatorBreakdown(demoData.records),
        timelineData: generateTimelineData(demoData.records)
      });
      
      console.log('Demo data initialized successfully:', {
        records: demoData.records.length,
        anomalies: demoData.anomalies.length,
        files: demoData.evidenceFiles.length
      });
    } else {
      console.log('Demo data already exists, skipping initialization');
    }
  }, [store]);
  
  const resetDemoData = useCallback(() => {
    store.reset();
    setTimeout(initializeDemoData, 100);
  }, [store, initializeDemoData]);
  
  return {
    initializeDemoData,
    resetDemoData,
    isInitialized: store.cases.length > 0
  };
}

// Helper functions
function calculateOperatorBreakdown(records: any[]) {
  const breakdown = {
    airtel: 0,
    jio: 0,
    vodafone: 0,
    bsnl: 0
  };
  
  records.forEach(record => {
    if (record.operator in breakdown) {
      breakdown[record.operator as keyof typeof breakdown]++;
    }
  });
  
  return breakdown;
}

function generateTimelineData(records: any[]) {
  const timelineMap = new Map();
  
  records.forEach(record => {
    const date = new Date(record.startTimestamp).toISOString().split('T')[0];
    
    if (!timelineMap.has(date)) {
      timelineMap.set(date, { date, records: 0, anomalies: 0 });
    }
    
    timelineMap.get(date).records++;
  });
  
  return Array.from(timelineMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30); // Last 30 days
}
