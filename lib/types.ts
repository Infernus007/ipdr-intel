// Core Types for IPDR-Intel+ Demo
export type TelecomOperator = 'airtel' | 'jio' | 'vodafone' | 'bsnl';

export interface IPDRRecord {
  id: string;
  caseId: string;
  aParty: string;
  aPort?: string;
  bParty: string;
  bPort?: string;
  protocol: string;
  startTimestamp: Date;
  endTimestamp: Date;
  duration: number; // in seconds
  bytesTransferred: number;
  sourceFileId: string;
  rawRowHash: string;
  operator: TelecomOperator;
}

export interface EvidenceFile {
  id: string;
  caseId: string;
  filename: string;
  sha256: string;
  size: number;
  operator: TelecomOperator;
  storageUri: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'uploading' | 'parsing' | 'completed' | 'error';
  recordCount?: number;
  errorCount?: number;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  evidenceFiles: EvidenceFile[];
  recordCount: number;
  anomalyCount: number;
}

export interface WatchlistItem {
  id: string;
  caseId: string;
  label: string;
  numberOrPrefix: string;
  type: 'phone' | 'ip' | 'prefix';
  createdAt: Date;
}

export interface Anomaly {
  id: string;
  caseId: string;
  entity: string;
  entityType: 'phone' | 'ip' | 'pattern';
  rule: string;
  score: number;
  reason: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Correlation {
  id: string;
  leftCaseId: string;
  rightCaseId: string;
  entity: string;
  entityType: 'phone' | 'ip';
  overlapCount: number;
  details: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  caseId: string;
  actor: string;
  action: string;
  subject: string;
  metadata: Record<string, any>;
  timestamp: Date;
  entryHash: string;
  prevEntryHash?: string;
}

export interface ExportRecord {
  id: string;
  caseId: string;
  type: 'pdf' | 'csv' | 'json';
  filters: Record<string, any>;
  filePath: string;
  sha256: string;
  createdBy: string;
  createdAt: Date;
}

// Graph/Network Analysis Types
export interface GraphNode {
  id: string;
  label: string;
  type: 'phone' | 'ip' | 'device';
  metadata: Record<string, any>;
  size: number;
  color: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  type: 'call' | 'sms' | 'data';
  timestamp: Date;
  duration?: number;
  bytes?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// UI State Types
export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  operators: TelecomOperator[];
  parties: string[];
  protocols: string[];
  searchTerm: string;
}

export interface AnalyticsState {
  totalRecords: number;
  totalCases: number;
  totalAnomalies: number;
  operatorBreakdown: Record<TelecomOperator, number>;
  timelineData: Array<{
    date: string;
    records: number;
    anomalies: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Demo-specific types for mock data
export interface DemoStats {
  casesAnalyzed: number;
  recordsParsed: number;
  anomaliesDetected: number;
  operatorsSupported: number;
  uptime: string;
}
