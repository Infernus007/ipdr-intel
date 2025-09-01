// Mock Data Generator for IPDR-Intel+ Demo
import { 
  Case, 
  EvidenceFile, 
  IPDRRecord, 
  Anomaly, 
  WatchlistItem, 
  TelecomOperator,
  GraphData,
  GraphNode,
  GraphEdge,
  DemoStats
} from './types';

// Demo phone numbers for consistency
const DEMO_PHONES = [
  '+919876543210',
  '+919876543211',
  '+919876543212',
  '+919876543213',
  '+919876543214',
  '+919876543215',
  '+919876543216',
  '+919876543217',
  '+919876543218',
  '+919876543219'
];

const DEMO_IPS = [
  '192.168.1.100',
  '10.0.0.50',
  '172.16.0.25',
  '203.194.44.10',
  '157.240.22.35'
];

export function generateDemoCase(): Case {
  const caseId = `case_${Date.now()}`;
  return {
    id: caseId,
    title: 'Operation Digital Trail',
    description: 'Investigation into suspicious communication patterns involving multiple telecom operators',
    status: 'active',
    createdBy: 'Detective Sarah Johnson',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    evidenceFiles: [],
    recordCount: 0,
    anomalyCount: 0
  };
}

export function generateDemoEvidenceFiles(caseId: string): EvidenceFile[] {
  const operators: TelecomOperator[] = ['airtel', 'jio', 'vodafone'];
  const files: EvidenceFile[] = [];
  
  operators.forEach((operator, index) => {
    const fileId = `file_${caseId}_${operator}`;
    files.push({
      id: fileId,
      caseId,
      filename: `${operator}_ipdr_data_${new Date().toISOString().split('T')[0]}.csv`,
      sha256: generateMockHash(),
      size: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
      operator,
      storageUri: `/evidence/${fileId}`,
      uploadedBy: 'Detective Sarah Johnson',
      uploadedAt: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000),
      status: 'completed',
      recordCount: Math.floor(Math.random() * 10000) + 5000,
      errorCount: Math.floor(Math.random() * 50)
    });
  });
  
  return files;
}

export function generateDemoRecords(caseId: string, fileIds: string[], count: number = 1000): IPDRRecord[] {
  const records: IPDRRecord[] = [];
  const protocols = ['HTTP', 'HTTPS', 'TCP', 'UDP', 'FTP', 'SMTP', 'DNS'];
  const operators: TelecomOperator[] = ['airtel', 'jio', 'vodafone', 'bsnl'];
  
  for (let i = 0; i < count; i++) {
    const fileId = fileIds[Math.floor(Math.random() * fileIds.length)];
    const aParty = DEMO_PHONES[Math.floor(Math.random() * DEMO_PHONES.length)];
    const bParty = DEMO_PHONES[Math.floor(Math.random() * DEMO_PHONES.length)];
    
    // Ensure A and B parties are different
    const finalBParty = aParty === bParty ? DEMO_PHONES[(DEMO_PHONES.indexOf(aParty) + 1) % DEMO_PHONES.length] : bParty;
    
    const startTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const duration = Math.floor(Math.random() * 3600) + 10; // 10 seconds to 1 hour
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    records.push({
      id: `record_${i}_${Date.now()}`,
      caseId,
      aParty,
      aPort: Math.random() > 0.5 ? Math.floor(Math.random() * 65535).toString() : undefined,
      bParty: finalBParty,
      bPort: Math.random() > 0.5 ? Math.floor(Math.random() * 65535).toString() : undefined,
      protocol: protocols[Math.floor(Math.random() * protocols.length)],
      startTimestamp: startTime,
      endTimestamp: endTime,
      duration,
      bytesTransferred: Math.floor(Math.random() * 10000000) + 1024,
      sourceFileId: fileId,
      rawRowHash: generateMockHash(),
      operator: operators[Math.floor(Math.random() * operators.length)]
    });
  }
  
  return records;
}

export function generateDemoAnomalies(caseId: string, records: IPDRRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const rules = [
    'unusual_volume',
    'time_pattern',
    'multiple_operators',
    'burst_communication',
    'watchlist_match'
  ];
  
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
  
  // Generate 20-50 anomalies
  const anomalyCount = Math.floor(Math.random() * 30) + 20;
  
  for (let i = 0; i < anomalyCount; i++) {
    const record = records[Math.floor(Math.random() * records.length)];
    const rule = rules[Math.floor(Math.random() * rules.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    anomalies.push({
      id: `anomaly_${i}_${Date.now()}`,
      caseId,
      entity: record.aParty,
      entityType: 'phone',
      rule,
      score: Math.random() * 100,
      reason: generateAnomalyReason(rule),
      timestamp: new Date(record.startTimestamp.getTime() + Math.random() * 3600000),
      severity
    });
  }
  
  return anomalies;
}

export function generateDemoWatchlist(caseId: string): WatchlistItem[] {
  return [
    {
      id: `watchlist_1_${Date.now()}`,
      caseId,
      label: 'Suspect Primary',
      numberOrPrefix: '+919876543210',
      type: 'phone',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: `watchlist_2_${Date.now()}`,
      caseId,
      label: 'Known Associate',
      numberOrPrefix: '+919876543215',
      type: 'phone',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: `watchlist_3_${Date.now()}`,
      caseId,
      label: 'Suspicious IP Range',
      numberOrPrefix: '203.194.44',
      type: 'prefix',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];
}

export function generateGraphData(records: IPDRRecord[]): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  
  // Create nodes from unique parties
  records.forEach(record => {
    if (!nodeMap.has(record.aParty)) {
      nodeMap.set(record.aParty, {
        id: record.aParty,
        label: record.aParty,
        type: 'phone',
        metadata: { operator: record.operator },
        size: 1,
        color: getOperatorColor(record.operator)
      });
    }
    
    if (!nodeMap.has(record.bParty)) {
      nodeMap.set(record.bParty, {
        id: record.bParty,
        label: record.bParty,
        type: 'phone',
        metadata: { operator: record.operator },
        size: 1,
        color: getOperatorColor(record.operator)
      });
    }
  });
  
  // Create edges from records
  const edgeMap = new Map<string, GraphEdge>();
  
  records.forEach(record => {
    const edgeKey = `${record.aParty}-${record.bParty}`;
    const reverseKey = `${record.bParty}-${record.aParty}`;
    
    if (edgeMap.has(edgeKey)) {
      edgeMap.get(edgeKey)!.weight += 1;
    } else if (edgeMap.has(reverseKey)) {
      edgeMap.get(reverseKey)!.weight += 1;
    } else {
      edgeMap.set(edgeKey, {
        id: `edge_${edgeKey}_${Date.now()}`,
        source: record.aParty,
        target: record.bParty,
        weight: 1,
        type: getConnectionType(record.protocol),
        timestamp: record.startTimestamp,
        duration: record.duration,
        bytes: record.bytesTransferred
      });
    }
  });
  
  // Update node sizes based on connection count
  nodeMap.forEach(node => {
    let connectionCount = 0;
    edgeMap.forEach(edge => {
      if (edge.source === node.id || edge.target === node.id) {
        connectionCount += edge.weight;
      }
    });
    node.size = Math.max(5, Math.min(50, connectionCount * 2));
  });
  
  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values())
  };
}

export function generateDemoStats(): DemoStats {
  return {
    casesAnalyzed: 47,
    recordsParsed: 2847593,
    anomaliesDetected: 1247,
    operatorsSupported: 4,
    uptime: '99.8%'
  };
}

// Helper functions
function generateMockHash(): string {
  return Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateAnomalyReason(rule: string): string {
  const reasons = {
    unusual_volume: 'Data usage 847% above normal baseline for this user',
    time_pattern: 'Active communication between 2:00 AM - 4:00 AM (unusual for this profile)',
    multiple_operators: 'Same number active on 3 different operators simultaneously',
    burst_communication: '47 connections in 2-minute window (normal: 3-5 per hour)',
    watchlist_match: 'Number matches entry #3 in active watchlist'
  };
  
  return reasons[rule as keyof typeof reasons] || 'Anomalous pattern detected';
}

function getOperatorColor(operator: TelecomOperator): string {
  const colors = {
    airtel: '#E31E24',
    jio: '#0066CC',
    vodafone: '#E60000',
    bsnl: '#FF6600'
  };
  return colors[operator];
}

function getConnectionType(protocol: string): 'call' | 'sms' | 'data' {
  if (protocol.includes('HTTP') || protocol.includes('TCP') || protocol.includes('UDP')) {
    return 'data';
  }
  if (protocol.includes('SMS') || protocol.includes('SMTP')) {
    return 'sms';
  }
  return 'call';
}

// Main demo data generator
export function generateFullDemoData() {
  const demoCase = generateDemoCase();
  const evidenceFiles = generateDemoEvidenceFiles(demoCase.id);
  const records = generateDemoRecords(demoCase.id, evidenceFiles.map(f => f.id), 1500);
  const anomalies = generateDemoAnomalies(demoCase.id, records);
  const watchlist = generateDemoWatchlist(demoCase.id);
  const graphData = generateGraphData(records);
  const stats = generateDemoStats();
  
  return {
    case: demoCase,
    evidenceFiles,
    records,
    anomalies,
    watchlist,
    graphData,
    stats
  };
}
