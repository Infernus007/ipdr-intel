'use client';

import { IPDRRecord, Anomaly } from './types';

// Enhanced anomaly detection with Web Worker support and optimized algorithms
export interface AnomalyDetectionProgress {
  processedRecords: number;
  totalRecords: number;
  currentRule: string;
  anomaliesFound: number;
  estimatedTimeRemaining: number;
  throughput: number; // records per second
}

export interface TimeRange {
  startHour: number;
  endHour: number;
  timezone: string;
}

export interface AnomalyRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  config: Record<string, any>;
}

export const DEFAULT_ANOMALY_RULES: AnomalyRule[] = [
  {
    id: 'late_night_activity',
    name: 'Late Night Activity',
    description: 'Detects communication activity during unusual hours (default: 00:00-05:00 IST)',
    severity: 'medium',
    enabled: true,
    config: {
      startHour: 0,
      endHour: 5,
      timezone: 'Asia/Kolkata'
    }
  },
  {
    id: 'high_volume',
    name: 'High Data Volume',
    description: 'Detects unusually high data transfer patterns',
    severity: 'high',
    enabled: true,
    config: {
      threshold: 1000000, // 1MB
      timeWindow: 3600 // 1 hour
    }
  },
  {
    id: 'burst_communication',
    name: 'Communication Burst',
    description: 'Detects high-frequency communication in short time windows',
    severity: 'medium',
    enabled: true,
    config: {
      minConnections: 10,
      timeWindow: 300 // 5 minutes
    }
  },
  {
    id: 'cross_operator',
    name: 'Cross-Operator Activity',
    description: 'Detects same entity active across multiple operators',
    severity: 'high',
    enabled: true,
    config: {
      minOperators: 2
    }
  }
];

export async function detectLateNightAnomalies(
  records: IPDRRecord[],
  timeRange: TimeRange = { startHour: 0, endHour: 5, timezone: 'Asia/Kolkata' },
  onProgress?: (progress: AnomalyDetectionProgress) => void
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const caseId = records[0]?.caseId || 'unknown';
  const startTime = Date.now();
  const totalRecords = records.length;

  // Optimized grouping using Map for better performance
  const sourceIPGroups = new Map<string, IPDRRecord[]>();
  
  // Process records in batches to prevent UI blocking
  const batchSize = 10000;
  let processedRecords = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    // Group records by source IP
    batch.forEach(record => {
      if (!sourceIPGroups.has(record.aParty)) {
        sourceIPGroups.set(record.aParty, []);
      }
      sourceIPGroups.get(record.aParty)!.push(record);
    });
    
    processedRecords += batch.length;
    
    // Report progress
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      const throughput = processedRecords / (elapsed / 1000);
      const estimatedTotal = (totalRecords / processedRecords) * elapsed;
      const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);
      
      onProgress({
        processedRecords,
        totalRecords,
        currentRule: 'late_night_activity',
        anomaliesFound: anomalies.length,
        estimatedTimeRemaining: estimatedRemaining,
        throughput
      });
    }
    
    // Yield control periodically
    if (i % (batchSize * 5) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // Process grouped records
  for (const [sourceIP, ipRecords] of sourceIPGroups) {
    const lateNightRecords = ipRecords.filter(record => {
      const istTime = new Date(record.startTimestamp.toLocaleString('en-US', { timeZone: timeRange.timezone }));
      const hour = istTime.getHours();
      return hour >= timeRange.startHour && hour < timeRange.endHour;
    });

    if (lateNightRecords.length > 0) {
      const totalBytes = lateNightRecords.reduce((sum, r) => sum + r.bytesTransferred, 0);
      const connections = lateNightRecords.length;
      
      // Calculate anomaly score based on activity level
      let score = 50; // Base score
      if (connections > 5) score += 20;
      if (totalBytes > 1000000) score += 20; // 1MB
      if (connections > 10) score += 10;

      const severity: Anomaly['severity'] = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

      anomalies.push({
        id: `anom_${sourceIP}_${Date.now()}`,
        caseId,
        entity: sourceIP,
        entityType: 'ip',
        rule: 'late_night_activity',
        score,
        reason: `Detected ${connections} connections between ${timeRange.startHour}:00-${timeRange.endHour}:00 IST with ${formatBytes(totalBytes)} data transfer`,
        timestamp: new Date(),
        severity
      });
    }
  }

  return anomalies;
}

export function detectHighVolumeAnomalies(records: IPDRRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const caseId = records[0]?.caseId || 'unknown';

  // Group by source IP and time windows
  const sourceIPGroups = records.reduce((acc, record) => {
    if (!acc[record.aParty]) {
      acc[record.aParty] = [];
    }
    acc[record.aParty].push(record);
    return acc;
  }, {} as Record<string, IPDRRecord[]>);

  Object.entries(sourceIPGroups).forEach(([sourceIP, ipRecords]) => {
    // Group by hour
    const hourlyGroups = ipRecords.reduce((acc, record) => {
      const hour = new Date(record.startTimestamp).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(record);
      return acc;
    }, {} as Record<number, IPDRRecord[]>);

    Object.entries(hourlyGroups).forEach(([hour, hourRecords]) => {
      const totalBytes = hourRecords.reduce((sum, r) => sum + r.bytesTransferred, 0);
      const threshold = 1000000; // 1MB

      if (totalBytes > threshold) {
        const score = Math.min(100, (totalBytes / threshold) * 50);
        const severity: Anomaly['severity'] = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

        anomalies.push({
          id: `anom_${sourceIP}_${hour}_${Date.now()}`,
          caseId,
          entity: sourceIP,
          entityType: 'ip',
          rule: 'high_volume',
          score,
          reason: `High data volume: ${formatBytes(totalBytes)} in hour ${hour}:00`,
          timestamp: new Date(),
          severity
        });
      }
    });
  });

  return anomalies;
}

export function detectBurstAnomalies(records: IPDRRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const caseId = records[0]?.caseId || 'unknown';

  // Group by source IP
  const sourceIPGroups = records.reduce((acc, record) => {
    if (!acc[record.aParty]) {
      acc[record.aParty] = [];
    }
    acc[record.aParty].push(record);
    return acc;
  }, {} as Record<string, IPDRRecord[]>);

  Object.entries(sourceIPGroups).forEach(([sourceIP, ipRecords]) => {
    // Check for bursts in 5-minute windows
    const timeWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    for (let i = 0; i < ipRecords.length; i++) {
      const windowStart = ipRecords[i].startTimestamp.getTime();
      const windowEnd = windowStart + timeWindow;
      
      const recordsInWindow = ipRecords.filter(r => 
        r.startTimestamp.getTime() >= windowStart && 
        r.startTimestamp.getTime() < windowEnd
      );

      if (recordsInWindow.length >= 10) {
        const score = Math.min(100, (recordsInWindow.length / 10) * 60);
        const severity: Anomaly['severity'] = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

        anomalies.push({
          id: `anom_${sourceIP}_burst_${Date.now()}`,
          caseId,
          entity: sourceIP,
          entityType: 'ip',
          rule: 'burst_communication',
          score,
          reason: `Communication burst: ${recordsInWindow.length} connections in 5-minute window`,
          timestamp: new Date(),
          severity
        });
        break; // Only report one burst per IP
      }
    }
  });

  return anomalies;
}

export function detectCrossOperatorAnomalies(records: IPDRRecord[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const caseId = records[0]?.caseId || 'unknown';

  // Group by entity (IP or phone number)
  const entityGroups = records.reduce((acc, record) => {
    const entity = record.aParty;
    if (!acc[entity]) {
      acc[entity] = new Set();
    }
    acc[entity].add(record.operator);
    return acc;
  }, {} as Record<string, Set<string>>);

  Object.entries(entityGroups).forEach(([entity, operators]) => {
    if (operators.size >= 2) {
      const score = Math.min(100, operators.size * 30);
      const severity: Anomaly['severity'] = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

      anomalies.push({
        id: `anom_${entity}_crossop_${Date.now()}`,
        caseId,
        entity,
        entityType: 'ip',
        rule: 'cross_operator',
        score,
        reason: `Entity active across ${operators.size} operators: ${Array.from(operators).join(', ')}`,
        timestamp: new Date(),
        severity
      });
    }
  });

  return anomalies;
}

export async function runAllAnomalyDetection(
  records: IPDRRecord[], 
  customRules?: Partial<AnomalyRule>[],
  onProgress?: (progress: AnomalyDetectionProgress) => void
): Promise<Anomaly[]> {
  let allAnomalies: Anomaly[] = [];

  // Merge custom rules with defaults
  const rules = DEFAULT_ANOMALY_RULES.map(rule => {
    const customRule = customRules?.find(cr => cr.id === rule.id);
    return { ...rule, ...customRule };
  });

  // Run enabled rules with progress tracking
  for (const rule of rules) {
    if (!rule.enabled) continue;

    try {
      switch (rule.id) {
        case 'late_night_activity':
          const lateNightAnomalies = await detectLateNightAnomalies(records, rule.config as TimeRange, onProgress);
          allAnomalies.push(...lateNightAnomalies);
          break;
        case 'high_volume':
          const highVolumeAnomalies = detectHighVolumeAnomalies(records);
          allAnomalies.push(...highVolumeAnomalies);
          break;
        case 'burst_communication':
          const burstAnomalies = detectBurstAnomalies(records);
          allAnomalies.push(...burstAnomalies);
          break;
        case 'cross_operator':
          const crossOpAnomalies = detectCrossOperatorAnomalies(records);
          allAnomalies.push(...crossOpAnomalies);
          break;
      }
    } catch (error) {
      console.error(`Error running rule ${rule.id}:`, error);
    }
  }

  return allAnomalies;
}

// Web Worker-based anomaly detection for very large datasets
export class AnomalyDetectionWorker {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingMessages = new Map<number, { resolve: Function; reject: Function }>();

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      this.worker = new Worker('/workers/anomaly-detection.js');
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  async detectAnomalies(
    records: IPDRRecord[], 
    rules: AnomalyRule[],
    onProgress?: (progress: AnomalyDetectionProgress) => void
  ): Promise<Anomaly[]> {
    if (!this.worker) {
      // Fallback to main thread if Web Workers not available
      return runAllAnomalyDetection(records, rules, onProgress);
    }

    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId;
      this.pendingMessages.set(messageId, { resolve, reject });

      this.worker!.postMessage({
        id: messageId,
        type: 'detect_anomalies',
        records: records.map(r => ({
          ...r,
          startTimestamp: r.startTimestamp.toISOString(),
          endTimestamp: r.endTimestamp.toISOString()
        })),
        rules
      });
    });
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { id, type, data, error } = event.data;
    const pending = this.pendingMessages.get(id);
    
    if (!pending) return;

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(data);
    }

    this.pendingMessages.delete(id);
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Factory function for creating anomaly detection workers
export function createAnomalyDetectionWorker(): AnomalyDetectionWorker {
  return new AnomalyDetectionWorker();
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
