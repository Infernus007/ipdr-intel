// Constants for IPDR-Intel+ Demo
import { TelecomOperator } from './types';

export const TELECOM_OPERATORS: Record<TelecomOperator, { name: string; color: string; formats: string[] }> = {
  airtel: {
    name: 'Bharti Airtel',
    color: '#E31E24',
    formats: ['CSV', 'Excel']
  },
  jio: {
    name: 'Reliance Jio',
    color: '#0066CC',
    formats: ['CSV', 'XML']
  },
  vodafone: {
    name: 'Vodafone Idea',
    color: '#E60000',
    formats: ['CSV', 'TXT']
  },
  bsnl: {
    name: 'BSNL',
    color: '#FF6600',
    formats: ['CSV', 'DAT']
  }
};

export const SUPPORTED_FILE_TYPES = [
  '.csv',
  '.xlsx',
  '.xls',
  '.txt',
  '.dat',
  '.xml',
  '.zip'
];

export const MAX_FILE_SIZE_MB = 100;

export const PROTOCOLS = [
  'HTTP',
  'HTTPS',
  'FTP',
  'SMTP',
  'POP3',
  'IMAP',
  'DNS',
  'TCP',
  'UDP',
  'ICMP'
];

export const ANOMALY_RULES = [
  {
    id: 'unusual_volume',
    name: 'Unusual Data Volume',
    description: 'Detects abnormally high data usage patterns',
    severity: 'medium' as const
  },
  {
    id: 'time_pattern',
    name: 'Unusual Time Pattern',
    description: 'Activity outside normal hours',
    severity: 'low' as const
  },
  {
    id: 'multiple_operators',
    name: 'Cross-Operator Activity',
    description: 'Same number active across multiple operators',
    severity: 'high' as const
  },
  {
    id: 'burst_communication',
    name: 'Communication Burst',
    description: 'High frequency communication in short time',
    severity: 'medium' as const
  },
  {
    id: 'watchlist_match',
    name: 'Watchlist Match',
    description: 'Number matches watchlist entry',
    severity: 'critical' as const
  }
];

export const DEMO_CONFIG = {
  autoParseDelay: 2000, // 2 seconds
  animationDuration: 300,
  maxRecordsDisplay: 1000,
  refreshInterval: 5000,
  chartUpdateInterval: 1000
};

export const LEGAL_COMPLIANCE = {
  section65B: {
    enabled: true,
    certificateRequired: true,
    watermarkRequired: true
  },
  auditTrail: {
    enabled: true,
    hashChaining: true,
    immutable: true
  },
  evidenceIntegrity: {
    sha256Required: true,
    tamperDetection: true,
    chainOfCustody: true
  }
};

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  success: '#22C55E'
};

export const DEMO_FEATURES = [
  {
    id: 'upload',
    name: 'File Upload & Parsing',
    description: 'Multi-operator IPDR file processing',
    icon: 'Upload',
    status: 'active'
  },
  {
    id: 'analytics',
    name: 'Smart Analytics',
    description: 'AI-powered anomaly detection',
    icon: 'BarChart3',
    status: 'active'
  },
  {
    id: 'graph',
    name: 'Network Analysis',
    description: 'Interactive relationship mapping',
    icon: 'Network',
    status: 'active'
  },
  {
    id: 'reports',
    name: 'Legal Reports',
    description: 'Section 65B compliant exports',
    icon: 'FileText',
    status: 'active'
  },
  {
    id: 'audit',
    name: 'Audit Trail',
    description: 'Immutable evidence logging',
    icon: 'Shield',
    status: 'active'
  }
] as const;
