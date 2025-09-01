// State Management for IPDR-Intel+ Demo
'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Case, 
  EvidenceFile, 
  IPDRRecord, 
  Anomaly, 
  FilterState, 
  AnalyticsState, 
  GraphData,
  WatchlistItem,
  TelecomOperator 
} from './types';

// Enhanced pagination and memory management for large datasets
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasMore: boolean;
}

interface MemoryState {
  maxRecordsInMemory: number;
  virtualizedRecords: IPDRRecord[];
  recordIndexMap: Map<string, number>; // Fast lookup for record IDs
  lastAccessed: Map<string, number>; // LRU cache tracking
}

// Main Application Store
interface AppStore {
  // Current state
  currentCase: Case | null;
  cases: Case[];
  evidenceFiles: EvidenceFile[];
  records: IPDRRecord[];
  anomalies: Anomaly[];
  watchlist: WatchlistItem[];
  
  // Enhanced state for large datasets
  pagination: PaginationState;
  memory: MemoryState;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  analytics: AnalyticsState;
  graphData: GraphData;
  
  // Actions
  setCurrentCase: (caseItem: Case | null) => void;
  addCase: (caseItem: Case) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
  
  addEvidenceFile: (file: EvidenceFile) => void;
  updateEvidenceFile: (id: string, updates: Partial<EvidenceFile>) => void;
  attachFileToCase: (caseId: string, file: EvidenceFile) => void;
  
  setRecords: (records: IPDRRecord[]) => void;
  addRecords: (records: IPDRRecord[]) => void;
  
  // Enhanced actions for large datasets
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getRecordsForPage: (page: number, size: number) => IPDRRecord[];
  getFilteredRecords: (filters: FilterState) => IPDRRecord[];
  optimizeMemory: () => void;
  clearMemoryCache: () => void;
  
  setAnomalies: (anomalies: Anomaly[]) => void;
  addAnomaly: (anomaly: Anomaly) => void;
  
  addWatchlistItem: (item: WatchlistItem) => void;
  removeWatchlistItem: (id: string) => void;
  
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  updateAnalytics: (analytics: Partial<AnalyticsState>) => void;
  setGraphData: (data: GraphData) => void;
  
  // Demo actions
  simulateFileUpload: (filename: string, operator: TelecomOperator) => Promise<void>;
  simulateParsing: (fileId: string) => Promise<void>;
  generateMockData: () => void;
  reset: () => void;
}

const initialFilters: FilterState = {
  dateRange: {
    start: null,
    end: null
  },
  operators: [],
  parties: [],
  protocols: [],
  searchTerm: ''
};

const initialAnalytics: AnalyticsState = {
  totalRecords: 0,
  totalCases: 0,
  totalAnomalies: 0,
  operatorBreakdown: {
    airtel: 0,
    jio: 0,
    vodafone: 0,
    bsnl: 0
  },
  timelineData: []
};

const initialGraphData: GraphData = {
  nodes: [],
  edges: []
};

const initialPagination: PaginationState = {
  currentPage: 1,
  pageSize: 100,
  totalPages: 1,
  totalRecords: 0,
  hasMore: false
};

const initialMemory: MemoryState = {
  maxRecordsInMemory: 10000, // Keep max 10k records in memory
  virtualizedRecords: [],
  recordIndexMap: new Map(),
  lastAccessed: new Map()
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentCase: null,
        cases: [],
        evidenceFiles: [],
        records: [],
        anomalies: [],
        watchlist: [],
        
        // Enhanced state
        pagination: initialPagination,
        memory: initialMemory,
        
        isLoading: false,
        error: null,
        filters: initialFilters,
        analytics: initialAnalytics,
        graphData: initialGraphData,
        
        // Actions
        setCurrentCase: (caseItem) => set({ currentCase: caseItem }),
        
        addCase: (caseItem) => set((state) => ({ 
          cases: [...state.cases, caseItem] 
        })),
        
        updateCase: (id, updates) => set((state) => ({
          cases: state.cases.map(c => c.id === id ? { ...c, ...updates } : c),
          currentCase: state.currentCase?.id === id 
            ? { ...state.currentCase, ...updates } 
            : state.currentCase
        })),
        
        addEvidenceFile: (file) => set((state) => ({
          evidenceFiles: [...state.evidenceFiles, file]
        })),

        attachFileToCase: (caseId, file) => set((state) => ({
          cases: state.cases.map(c => c.id === caseId ? {
            ...c,
            evidenceFiles: [...c.evidenceFiles, file]
          } : c),
          currentCase: state.currentCase?.id === caseId ? {
            ...state.currentCase,
            evidenceFiles: [...state.currentCase.evidenceFiles, file]
          } : state.currentCase
        })),
        
        updateEvidenceFile: (id, updates) => set((state) => ({
          evidenceFiles: state.evidenceFiles.map(f => 
            f.id === id ? { ...f, ...updates } : f
          )
        })),
        
        setRecords: (records) => set((state) => {
          // Update pagination and memory state
          const totalRecords = records.length;
          const totalPages = Math.ceil(totalRecords / state.pagination.pageSize);
          
          return {
            records,
            pagination: {
              ...state.pagination,
              totalRecords,
              totalPages,
              hasMore: totalPages > 1
            },
            memory: {
              ...state.memory,
              virtualizedRecords: records.slice(0, state.memory.maxRecordsInMemory),
              recordIndexMap: new Map(records.map((record, index) => [record.id, index]))
            }
          };
        }),
        
        addRecords: (newRecords) => set((state) => {
          const updatedRecords = [...state.records, ...newRecords];
          const totalRecords = updatedRecords.length;
          const totalPages = Math.ceil(totalRecords / state.pagination.pageSize);
          
          // Update memory state with new records
          const newVirtualizedRecords = updatedRecords.slice(0, state.memory.maxRecordsInMemory);
          const newRecordIndexMap = new Map(updatedRecords.map((record, index) => [record.id, index]));
          
          return {
            records: updatedRecords,
            pagination: {
              ...state.pagination,
              totalRecords,
              totalPages,
              hasMore: totalPages > 1
            },
            memory: {
              ...state.memory,
              virtualizedRecords: newVirtualizedRecords,
              recordIndexMap: newRecordIndexMap
            },
            // Update currentCase counters
            cases: state.cases.map(c => c.id === (state.currentCase?.id || '') ? {
              ...c,
              recordCount: c.recordCount + newRecords.length
            } : c),
            currentCase: state.currentCase ? {
              ...state.currentCase,
              recordCount: state.currentCase.recordCount + newRecords.length
            } : state.currentCase
          };
        }),
        
        setAnomalies: (anomalies) => set({ anomalies }),
        
        addAnomaly: (anomaly) => set((state) => ({
          anomalies: [...state.anomalies, anomaly]
        })),
        
        addWatchlistItem: (item) => set((state) => ({
          watchlist: [...state.watchlist, item]
        })),
        
        removeWatchlistItem: (id) => set((state) => ({
          watchlist: state.watchlist.filter(item => item.id !== id)
        })),
        
        setFilters: (newFilters) => set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),
        
        resetFilters: () => set({ filters: initialFilters }),
        
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        
        updateAnalytics: (newAnalytics) => set((state) => ({
          analytics: { ...state.analytics, ...newAnalytics }
        })),
        
        setGraphData: (data) => set({ graphData: data }),
        
        // Enhanced actions for large datasets
        setPage: (page) => set((state) => ({
          pagination: {
            ...state.pagination,
            currentPage: Math.max(1, Math.min(page, state.pagination.totalPages))
          }
        })),
        
        setPageSize: (size) => set((state) => {
          const newPageSize = Math.max(10, Math.min(size, 1000)); // Min 10, Max 1000
          const totalPages = Math.ceil(state.pagination.totalRecords / newPageSize);
          
          return {
            pagination: {
              ...state.pagination,
              pageSize: newPageSize,
              totalPages,
              currentPage: 1, // Reset to first page
              hasMore: totalPages > 1
            }
          };
        }),
        
        getRecordsForPage: (page, size) => {
          const state = get();
          const startIndex = (page - 1) * size;
          const endIndex = startIndex + size;
          return state.records.slice(startIndex, endIndex);
        },
        
        getFilteredRecords: (filters) => {
          const state = get();
          let filtered = state.records;
          
          // Apply search filter
          if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(record => 
              record.aParty.toLowerCase().includes(searchLower) ||
              record.bParty.toLowerCase().includes(searchLower) ||
              record.protocol.toLowerCase().includes(searchLower)
            );
          }
          
          // Apply operator filter
          if (filters.operators.length > 0) {
            filtered = filtered.filter(record => 
              filters.operators.includes(record.operator)
            );
          }
          
          // Apply protocol filter
          if (filters.protocols.length > 0) {
            filtered = filtered.filter(record => 
              filters.protocols.includes(record.protocol)
            );
          }
          
          // Apply date range filter
          if (filters.dateRange.start || filters.dateRange.end) {
            filtered = filtered.filter(record => {
              const recordDate = record.startTimestamp;
              if (filters.dateRange.start && recordDate < filters.dateRange.start) return false;
              if (filters.dateRange.end && recordDate > filters.dateRange.end) return false;
              return true;
            });
          }
          
          return filtered;
        },
        
        optimizeMemory: () => set((state) => {
          // LRU cache optimization - keep only recently accessed records
          const sortedRecords = state.records
            .map((record, index) => ({ record, index, lastAccessed: state.memory.lastAccessed.get(record.id) || 0 }))
            .sort((a, b) => b.lastAccessed - a.lastAccessed)
            .slice(0, state.memory.maxRecordsInMemory);
          
          const optimizedRecords = sortedRecords.map(item => item.record);
          const newRecordIndexMap = new Map(sortedRecords.map((item, newIndex) => [item.record.id, newIndex]));
          
          return {
            memory: {
              ...state.memory,
              virtualizedRecords: optimizedRecords,
              recordIndexMap: newRecordIndexMap
            }
          };
        }),
        
        clearMemoryCache: () => set((state) => ({
          memory: {
            ...state.memory,
            virtualizedRecords: state.records.slice(0, state.memory.maxRecordsInMemory),
            recordIndexMap: new Map(state.records.map((record, index) => [record.id, index])),
            lastAccessed: new Map()
          }
        })),
        
        // Demo simulation methods
        simulateFileUpload: async (filename, operator) => {
          const fileId = `file_${Date.now()}`;
          const caseId = get().currentCase?.id || 'demo_case';
          
          const file: EvidenceFile = {
            id: fileId,
            caseId,
            filename,
            sha256: `sha256_${Math.random().toString(36).substr(2, 16)}`,
            size: Math.floor(Math.random() * 10000000) + 1000000,
            operator,
            storageUri: `/evidence/${fileId}`,
            uploadedBy: 'demo_user',
            uploadedAt: new Date(),
            status: 'uploading'
          };
          
          get().addEvidenceFile(file);
          
          // Simulate upload progress
          setTimeout(() => {
            get().updateEvidenceFile(fileId, { status: 'parsing' });
          }, 1000);
          
          setTimeout(() => {
            const recordCount = Math.floor(Math.random() * 5000) + 1000;
            get().updateEvidenceFile(fileId, { 
              status: 'completed',
              recordCount,
              errorCount: Math.floor(Math.random() * 10)
            });
          }, 3000);
        },
        
        simulateParsing: async (fileId) => {
          set({ isLoading: true });
          
          // Simulate parsing delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Generate mock records for this file
          const mockRecords = generateMockRecords(fileId, 100);
          get().addRecords(mockRecords);
          
          set({ isLoading: false });
        },
        
        generateMockData: () => {
          // This will be implemented with mock data generation
          console.log('Generating mock data...');
        },
        
        reset: () => set({
          currentCase: null,
          cases: [],
          evidenceFiles: [],
          records: [],
          anomalies: [],
          watchlist: [],
          pagination: initialPagination,
          memory: initialMemory,
          isLoading: false,
          error: null,
          filters: initialFilters,
          analytics: initialAnalytics,
          graphData: initialGraphData
        })
      }),
      {
        name: 'ipdr-intel-store',
        partialize: (state) => ({
          cases: state.cases,
          currentCase: state.currentCase,
          watchlist: state.watchlist
        })
      }
    ),
    { name: 'ipdr-intel-store' }
  )
);

// Helper function to generate mock records
function generateMockRecords(fileId: string, count: number): IPDRRecord[] {
  const records: IPDRRecord[] = [];
  const operators: TelecomOperator[] = ['airtel', 'jio', 'vodafone', 'bsnl'];
  const protocols = ['HTTP', 'HTTPS', 'TCP', 'UDP', 'FTP'];
  
  for (let i = 0; i < count; i++) {
    const startTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 3600); // 0-1 hour
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    records.push({
      id: `record_${fileId}_${i}`,
      caseId: 'demo_case',
      aParty: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      bParty: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      startTimestamp: startTime,
      endTimestamp: endTime,
      duration,
      bytesTransferred: Math.floor(Math.random() * 1000000),
      sourceFileId: fileId,
      rawRowHash: `hash_${Math.random().toString(36).substr(2, 16)}`,
      operator: operators[Math.floor(Math.random() * operators.length)]
    });
  }
  
  return records;
}

// Separate store for UI state that doesn't need persistence
interface UIStore {
  sidebarOpen: boolean;
  currentView: 'dashboard' | 'cases' | 'upload' | 'analytics' | 'graph' | 'reports';
  darkMode: boolean;
  
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: UIStore['currentView']) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      currentView: 'dashboard',
      darkMode: false,
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setCurrentView: (view) => set({ currentView: view }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode }))
    }),
    { name: 'ui-store' }
  )
);
