#!/usr/bin/env node

// Enterprise-grade test data generator for IPDR files
// Generates realistic Airtel CSV files with various sizes for performance testing

const { faker } = require('@faker-js/faker');
const fs = require('fs');
const path = require('path');

// Configuration for different test scenarios
const TEST_SCENARIOS = {
  small: { records: 1000, filename: 'airtel_test_small_1k.csv' },
  medium: { records: 100000, filename: 'airtel_test_medium_100k.csv' },
  large: { records: 1000000, filename: 'airtel_test_large_1m.csv' },
  xlarge: { records: 5000000, filename: 'airtel_test_xlarge_5m.csv' },
  enterprise: { records: 10000000, filename: 'airtel_test_enterprise_10m.csv' }
};

// Realistic IP ranges and protocols for IPDR data
const COMMON_IPS = {
  google: ['142.250.183.14', '172.217.14.206', '216.58.194.174'],
  cloudflare: ['1.1.1.1', '1.0.0.1'],
  dns: ['8.8.8.8', '8.8.4.4'],
  microsoft: ['13.107.21.200', '40.126.35.166'],
  whatsapp: ['185.60.216.35', '31.13.82.51'],
  facebook: ['157.240.22.35', '31.13.82.1'],
  youtube: ['142.250.183.110', '172.217.14.174'],
  netflix: ['52.84.124.102', '54.230.137.123'],
  amazon: ['176.32.103.205', '54.230.254.132']
};

const PROTOCOLS = ['TCP', 'UDP', 'HTTP', 'HTTPS'];
const COMMON_PORTS = {
  TCP: [80, 443, 8080, 22, 21, 25, 110, 143, 993, 995],
  UDP: [53, 67, 68, 123, 161, 162, 514],
  HTTP: [80, 8080, 3000, 8000],
  HTTPS: [443, 8443]
};

// Generate realistic subscriber IDs
function generateSubscriberID() {
  const prefixes = ['SUB', 'AIR', 'USR', 'MOB'];
  const prefix = faker.helpers.arrayElement(prefixes);
  const number = faker.string.numeric(6);
  return `${prefix}${number}`;
}

// Generate realistic source IP (subscriber's IP)
function generateSourceIP() {
  // Private IP ranges for subscribers
  const ranges = [
    () => `10.${faker.number.int({ min: 1, max: 255 })}.${faker.number.int({ min: 1, max: 255 })}.${faker.number.int({ min: 2, max: 254 })}`,
    () => `172.${faker.number.int({ min: 16, max: 31 })}.${faker.number.int({ min: 1, max: 255 })}.${faker.number.int({ min: 2, max: 254 })}`,
    () => `192.168.${faker.number.int({ min: 1, max: 255 })}.${faker.number.int({ min: 2, max: 254 })}`,
  ];
  return faker.helpers.arrayElement(ranges)();
}

// Generate realistic destination IP
function generateDestinationIP() {
  // 70% chance of common services, 30% random public IPs
  if (faker.datatype.boolean(0.7)) {
    const service = faker.helpers.objectKey(COMMON_IPS);
    return faker.helpers.arrayElement(COMMON_IPS[service]);
  } else {
    // Generate random public IP
    return faker.internet.ipv4();
  }
}

// Generate realistic port based on protocol
function generatePort(protocol, isSource = false) {
  if (isSource && faker.datatype.boolean(0.8)) {
    // Source ports are usually ephemeral (high numbers)
    return faker.number.int({ min: 1024, max: 65535 });
  }
  
  if (COMMON_PORTS[protocol]) {
    return faker.helpers.arrayElement(COMMON_PORTS[protocol]);
  }
  return faker.number.int({ min: 1, max: 65535 });
}

// Generate realistic data transfer amounts
function generateBytes() {
  // Weighted distribution for realistic traffic patterns
  const patterns = [
    { weight: 0.4, min: 64, max: 1500 },      // Small packets (DNS, ACK, etc.)
    { weight: 0.3, min: 1500, max: 65536 },   // Medium transfers
    { weight: 0.2, min: 65536, max: 1048576 }, // Large transfers (1MB)
    { weight: 0.1, min: 1048576, max: 104857600 } // Very large transfers (100MB)
  ];
  
  const rand = Math.random();
  let cumulativeWeight = 0;
  
  for (const pattern of patterns) {
    cumulativeWeight += pattern.weight;
    if (rand <= cumulativeWeight) {
      return faker.number.int({ min: pattern.min, max: pattern.max });
    }
  }
  
  return faker.number.int({ min: 64, max: 1500 }); // Fallback
}

// Generate realistic time patterns
function generateTimeRange() {
  const baseDate = faker.date.between({
    from: '2025-01-01T00:00:00.000Z',
    to: '2025-01-31T23:59:59.000Z'
  });
  
  const startTime = new Date(baseDate);
  
  // Duration patterns: mostly short connections, some long ones
  let durationSeconds;
  if (faker.datatype.boolean(0.7)) {
    // Short connections (0-60 seconds)
    durationSeconds = faker.number.int({ min: 1, max: 60 });
  } else if (faker.datatype.boolean(0.8)) {
    // Medium connections (1-30 minutes)
    durationSeconds = faker.number.int({ min: 60, max: 1800 });
  } else {
    // Long connections (30 minutes - 4 hours)
    durationSeconds = faker.number.int({ min: 1800, max: 14400 });
  }
  
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
  
  return {
    start: startTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
    end: endTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
  };
}

// Generate anomaly patterns for testing
function generateAnomalyRecord(subscriberId, recordIndex) {
  const protocol = faker.helpers.arrayElement(PROTOCOLS);
  const sourceIP = generateSourceIP();
  const destIP = generateDestinationIP();
  const sourcePort = generatePort(protocol, true);
  const destPort = generatePort(protocol, false);
  
  // Create late night activity (00:00-05:00 IST)
  const lateNightHour = faker.number.int({ min: 0, max: 4 });
  const minute = faker.number.int({ min: 0, max: 59 });
  const second = faker.number.int({ min: 0, max: 59 });
  
  const startTime = new Date(2025, 0, faker.number.int({ min: 1, max: 31 }), lateNightHour, minute, second);
  const durationSeconds = faker.number.int({ min: 300, max: 3600 }); // 5-60 minutes
  const endTime = new Date(startTime.getTime() + durationSeconds * 1000);
  
  // High data transfer for anomalies
  const bytes = faker.number.int({ min: 10485760, max: 104857600 }); // 10MB - 100MB
  
  return {
    SubscriberID: subscriberId,
    SourceIP: sourceIP,
    SourcePort: sourcePort,
    DestinationIP: destIP,
    DestinationPort: destPort,
    Protocol: protocol,
    StartTime: startTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
    EndTime: endTime.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ''),
    Bytes: bytes
  };
}

// Generate a single IPDR record
function generateIPDRRecord(subscriberId = null) {
  const protocol = faker.helpers.arrayElement(PROTOCOLS);
  const sourceIP = generateSourceIP();
  const destIP = generateDestinationIP();
  const sourcePort = generatePort(protocol, true);
  const destPort = generatePort(protocol, false);
  const timeRange = generateTimeRange();
  const bytes = generateBytes();
  
  return {
    SubscriberID: subscriberId || generateSubscriberID(),
    SourceIP: sourceIP,
    SourcePort: sourcePort,
    DestinationIP: destIP,
    DestinationPort: destPort,
    Protocol: protocol,
    StartTime: timeRange.start,
    EndTime: timeRange.end,
    Bytes: bytes
  };
}

// Generate CSV content with streaming write for large files
async function generateCSV(recordCount, filename) {
  console.log(`Generating ${filename} with ${recordCount.toLocaleString()} records...`);
  
  const outputPath = path.join(__dirname, '..', 'public', 'test-data', filename);
  const outputDir = path.dirname(outputPath);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const stream = fs.createWriteStream(outputPath);
  
  // Write CSV header
  const headers = ['SubscriberID', 'SourceIP', 'SourcePort', 'DestinationIP', 'DestinationPort', 'Protocol', 'StartTime', 'EndTime', 'Bytes'];
  stream.write(headers.join(',') + '\n');
  
  const startTime = Date.now();
  let processed = 0;
  const batchSize = 10000;
  
  // Generate subscriber pool for realistic patterns
  const subscriberPool = Array.from({ length: Math.min(1000, Math.ceil(recordCount / 100)) }, 
    () => generateSubscriberID()
  );
  
  // Add some anomaly patterns (5% of records)
  const anomalyCount = Math.floor(recordCount * 0.05);
  const anomalySubscribers = faker.helpers.arrayElements(subscriberPool, Math.min(50, subscriberPool.length));
  
  for (let i = 0; i < recordCount; i++) {
    let record;
    
    // Generate anomaly record
    if (i < anomalyCount && faker.datatype.boolean(0.3)) {
      const subscriber = faker.helpers.arrayElement(anomalySubscribers);
      record = generateAnomalyRecord(subscriber, i);
    } else {
      // Normal record with subscriber from pool (80% chance) or new subscriber (20% chance)
      const subscriber = faker.datatype.boolean(0.8) 
        ? faker.helpers.arrayElement(subscriberPool)
        : generateSubscriberID();
      record = generateIPDRRecord(subscriber);
    }
    
    // Write record to stream
    const line = headers.map(header => record[header]).join(',') + '\n';
    stream.write(line);
    
    processed++;
    
    // Progress reporting
    if (processed % batchSize === 0) {
      const elapsed = Date.now() - startTime;
      const rate = processed / (elapsed / 1000);
      const eta = (recordCount - processed) / rate;
      
      console.log(`Progress: ${processed.toLocaleString()}/${recordCount.toLocaleString()} (${(processed/recordCount*100).toFixed(1)}%) - ${rate.toFixed(0)} records/sec - ETA: ${Math.round(eta)}s`);
    }
    
    // Yield control periodically to prevent blocking
    if (processed % (batchSize * 5) === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  stream.end();
  
  return new Promise((resolve) => {
    stream.on('finish', () => {
      const elapsed = Date.now() - startTime;
      const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
      
      console.log(`✅ Generated ${filename}`);
      console.log(`   Records: ${recordCount.toLocaleString()}`);
      console.log(`   File size: ${fileSizeMB} MB`);
      console.log(`   Time taken: ${(elapsed / 1000).toFixed(2)}s`);
      console.log(`   Average rate: ${(recordCount / (elapsed / 1000)).toFixed(0)} records/sec`);
      console.log('');
      
      resolve();
    });
  });
}

// Main execution
async function main() {
  const scenario = process.argv[2] || 'small';
  
  if (!TEST_SCENARIOS[scenario]) {
    console.error(`Invalid scenario: ${scenario}`);
    console.error(`Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
    process.exit(1);
  }
  
  const config = TEST_SCENARIOS[scenario];
  
  console.log('🚀 IPDR Test Data Generator');
  console.log('===========================');
  console.log(`Scenario: ${scenario}`);
  console.log(`Records: ${config.records.toLocaleString()}`);
  console.log(`Output: ${config.filename}`);
  console.log('');
  
  try {
    await generateCSV(config.records, config.filename);
    console.log('🎉 Generation completed successfully!');
    console.log(`📁 File saved to: public/test-data/${config.filename}`);
  } catch (error) {
    console.error('❌ Generation failed:', error);
    process.exit(1);
  }
}

// Generate all scenarios if 'all' is specified
async function generateAll() {
  console.log('🚀 Generating all test scenarios...');
  
  for (const [scenario, config] of Object.entries(TEST_SCENARIOS)) {
    await generateCSV(config.records, config.filename);
  }
  
  console.log('🎉 All scenarios generated successfully!');
}

if (process.argv[2] === 'all') {
  generateAll().catch(console.error);
} else {
  main().catch(console.error);
}
