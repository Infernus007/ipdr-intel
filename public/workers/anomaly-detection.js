// Web Worker for anomaly detection - handles large datasets without blocking UI
// This worker runs in a separate thread to process millions of records efficiently

// Import anomaly detection logic (simplified for worker context)
const ANOMALY_RULES = {
  late_night_activity: {
    id: 'late_night_activity',
    name: 'Late Night Activity',
    severity: 'medium'
  },
  high_volume: {
    id: 'high_volume',
    name: 'High Data Volume',
    severity: 'high'
  },
  burst_communication: {
    id: 'burst_communication',
    name: 'Communication Burst',
    severity: 'medium'
  },
  cross_operator: {
    id: 'cross_operator',
    name: 'Cross-Operator Activity',
    severity: 'high'
  }
};

// Optimized anomaly detection algorithms for Web Worker
function detectLateNightAnomalies(records, timeRange = { startHour: 0, endHour: 5 }) {
  const anomalies = [];
  const sourceIPGroups = new Map();
  
  // Group records by source IP using Map for better performance
  records.forEach(record => {
    if (!sourceIPGroups.has(record.aParty)) {
      sourceIPGroups.set(record.aParty, []);
    }
    sourceIPGroups.get(record.aParty).push(record);
  });
  
  // Process each source IP
  for (const [sourceIP, ipRecords] of sourceIPGroups) {
    const lateNightRecords = ipRecords.filter(record => {
      const timestamp = new Date(record.startTimestamp);
      const hour = timestamp.getHours();
      return hour >= timeRange.startHour && hour < timeRange.endHour;
    });
    
    if (lateNightRecords.length > 0) {
      const totalBytes = lateNightRecords.reduce((sum, r) => sum + (r.bytesTransferred || 0), 0);
      const connections = lateNightRecords.length;
      
      let score = 50; // Base score
      if (connections > 5) score += 20;
      if (totalBytes > 1000000) score += 20;
      if (connections > 10) score += 10;
      
      const severity = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      
      anomalies.push({
        id: `anom_${sourceIP}_${Date.now()}`,
        caseId: records[0]?.caseId || 'unknown',
        entity: sourceIP,
        entityType: 'ip',
        rule: 'late_night_activity',
        score,
        reason: `Detected ${connections} connections between ${timeRange.startHour}:00-${timeRange.startHour}:00 with ${formatBytes(totalBytes)} data transfer`,
        timestamp: new Date().toISOString(),
        severity
      });
    }
  }
  
  return anomalies;
}

function detectHighVolumeAnomalies(records) {
  const anomalies = [];
  const sourceIPGroups = new Map();
  
  // Group by source IP
  records.forEach(record => {
    if (!sourceIPGroups.has(record.aParty)) {
      sourceIPGroups.set(record.aParty, []);
    }
    sourceIPGroups.get(record.aParty).push(record);
  });
  
  // Process each source IP
  for (const [sourceIP, ipRecords] of sourceIPGroups) {
    const hourlyGroups = new Map();
    
    // Group by hour
    ipRecords.forEach(record => {
      const hour = new Date(record.startTimestamp).getHours();
      if (!hourlyGroups.has(hour)) {
        hourlyGroups.set(hour, []);
      }
      hourlyGroups.get(hour).push(record);
    });
    
    // Check each hour for high volume
    for (const [hour, hourRecords] of hourlyGroups) {
      const totalBytes = hourRecords.reduce((sum, r) => sum + (r.bytesTransferred || 0), 0);
      const threshold = 1000000; // 1MB
      
      if (totalBytes > threshold) {
        const score = Math.min(100, (totalBytes / threshold) * 50);
        const severity = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
        
        anomalies.push({
          id: `anom_${sourceIP}_${hour}_${Date.now()}`,
          caseId: records[0]?.caseId || 'unknown',
          entity: sourceIP,
          entityType: 'ip',
          rule: 'high_volume',
          score,
          reason: `High data volume: ${formatBytes(totalBytes)} in hour ${hour}:00`,
          timestamp: new Date().toISOString(),
          severity
        });
      }
    }
  }
  
  return anomalies;
}

function detectBurstAnomalies(records) {
  const anomalies = [];
  const sourceIPGroups = new Map();
  
  // Group by source IP
  records.forEach(record => {
    if (!sourceIPGroups.has(record.aParty)) {
      sourceIPGroups.set(record.aParty, []);
    }
    sourceIPGroups.get(record.aParty).push(record);
  });
  
  // Process each source IP
  for (const [sourceIP, ipRecords] of sourceIPGroups) {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    
    for (let i = 0; i < ipRecords.length; i++) {
      const windowStart = new Date(ipRecords[i].startTimestamp).getTime();
      const windowEnd = windowStart + timeWindow;
      
      const recordsInWindow = ipRecords.filter(r => {
        const recordTime = new Date(r.startTimestamp).getTime();
        return recordTime >= windowStart && recordTime < windowEnd;
      });
      
      if (recordsInWindow.length >= 10) {
        const score = Math.min(100, (recordsInWindow.length / 10) * 60);
        const severity = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
        
        anomalies.push({
          id: `anom_${sourceIP}_burst_${Date.now()}`,
          caseId: records[0]?.caseId || 'unknown',
          entity: sourceIP,
          entityType: 'ip',
          rule: 'burst_communication',
          score,
          reason: `Communication burst: ${recordsInWindow.length} connections in 5-minute window`,
          timestamp: new Date().toISOString(),
          severity
        });
        break; // Only report one burst per IP
      }
    }
  }
  
  return anomalies;
}

function detectCrossOperatorAnomalies(records) {
  const anomalies = [];
  const entityGroups = new Map();
  
  // Group by entity (IP)
  records.forEach(record => {
    const entity = record.aParty;
    if (!entityGroups.has(entity)) {
      entityGroups.set(entity, new Set());
    }
    entityGroups.get(entity).add(record.operator);
  });
  
  // Check for cross-operator activity
  for (const [entity, operators] of entityGroups) {
    if (operators.size >= 2) {
      const score = Math.min(100, operators.size * 30);
      const severity = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
      
      anomalies.push({
        id: `anom_${entity}_crossop_${Date.now()}`,
        caseId: records[0]?.caseId || 'unknown',
        entity,
        entityType: 'ip',
        rule: 'cross_operator',
        score,
        reason: `Entity active across ${operators.size} operators: ${Array.from(operators).join(', ')}`,
        timestamp: new Date().toISOString(),
        severity
      });
    }
  }
  
  return anomalies;
}

// Helper function for formatting bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Main anomaly detection function
function runAnomalyDetection(records, rules) {
  const allAnomalies = [];
  
  // Process records in chunks to prevent memory issues
  const chunkSize = 50000;
  let processedRecords = 0;
  
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    processedRecords += chunk.length;
    
    // Run detection on chunk
    if (rules.late_night_activity?.enabled) {
      allAnomalies.push(...detectLateNightAnomalies(chunk, rules.late_night_activity.config));
    }
    
    if (rules.high_volume?.enabled) {
      allAnomalies.push(...detectHighVolumeAnomalies(chunk));
    }
    
    if (rules.burst_communication?.enabled) {
      allAnomalies.push(...detectBurstAnomalies(chunk));
    }
    
    if (rules.cross_operator?.enabled) {
      allAnomalies.push(...detectCrossOperatorAnomalies(chunk));
    }
    
    // Report progress every 100k records
    if (processedRecords % 100000 === 0) {
      self.postMessage({
        type: 'progress',
        processedRecords,
        totalRecords: records.length,
        anomaliesFound: allAnomalies.length
      });
    }
  }
  
  return allAnomalies;
}

// Worker message handler
self.onmessage = function(event) {
  const { id, type, records, rules } = event.data;
  
  try {
    if (type === 'detect_anomalies') {
      const anomalies = runAnomalyDetection(records, rules);
      
      self.postMessage({
        id,
        type: 'result',
        data: anomalies
      });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      error: error.message
    });
  }
};

// Handle worker errors
self.onerror = function(error) {
  self.postMessage({
    type: 'error',
    error: error.message
  });
};
