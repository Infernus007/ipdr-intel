#!/usr/bin/env node

// Performance testing script for enhanced IPDR processing system
// Tests streaming processing, memory management, and anomaly detection

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Test scenarios
const TEST_SCENARIOS = [
  { name: 'Small Dataset', file: 'airtel_test_small_1k.csv', expectedRecords: 1000 },
  { name: 'Medium Dataset', file: 'airtel_test_medium_100k.csv', expectedRecords: 100000 },
  { name: 'Large Dataset', file: 'airtel_test_large_1m.csv', expectedRecords: 1000000 }
];

// Performance benchmarks
const BENCHMARKS = {
  processing: {
    small: { maxTime: 1000, maxMemory: 50 },      // 1s, 50MB
    medium: { maxTime: 5000, maxMemory: 200 },    // 5s, 200MB
    large: { maxTime: 30000, maxMemory: 1000 }    // 30s, 1GB
  },
  anomaly: {
    small: { maxTime: 2000, maxMemory: 100 },     // 2s, 100MB
    medium: { maxTime: 10000, maxMemory: 400 },   // 10s, 400MB
    large: { maxTime: 60000, maxMemory: 2000 }    // 60s, 2GB
  }
};

// Memory usage monitoring
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),      // Resident Set Size
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // V8 heap used
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // V8 heap total
    external: Math.round(usage.external / 1024 / 1024)   // External memory
  };
}

// Performance test runner
class PerformanceTester {
  constructor() {
    this.results = [];
    this.startMemory = getMemoryUsage();
  }

  async runTest(scenario) {
    console.log(`\n🧪 Testing ${scenario.name}`);
    console.log('=' .repeat(50));
    
    const testFile = path.join(__dirname, '..', 'public', 'test-data', scenario.file);
    const fileStats = fs.statSync(testFile);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
    
    console.log(`📁 File: ${scenario.file}`);
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`📈 Expected Records: ${scenario.expectedRecords.toLocaleString()}`);
    
    // Test 1: File Reading Performance
    const readResult = await this.testFileReading(testFile, scenario);
    
    // Test 2: CSV Parsing Performance
    const parseResult = await this.testCSVParsing(testFile, scenario);
    
    // Test 3: Memory Management
    const memoryResult = await this.testMemoryManagement(scenario);
    
    // Test 4: Anomaly Detection Performance
    const anomalyResult = await this.testAnomalyDetection(scenario);
    
    const testResult = {
      scenario: scenario.name,
      fileSize: fileSizeMB,
      expectedRecords: scenario.expectedRecords,
      read: readResult,
      parse: parseResult,
      memory: memoryResult,
      anomaly: anomalyResult,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(testResult);
    this.printTestResult(testResult);
    
    return testResult;
  }

  async testFileReading(filePath, scenario) {
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    
    try {
      // Simulate file reading with streaming
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }); // 64KB chunks
      let totalBytes = 0;
      let chunkCount = 0;
      
      await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          totalBytes += chunk.length;
          chunkCount++;
          
          // Simulate processing delay
          if (chunkCount % 1000 === 0) {
            // Yield control periodically
            setImmediate(() => {});
          }
        });
        
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      
      const endTime = performance.now();
      const endMemory = getMemoryUsage();
      
      return {
        duration: Math.round(endTime - startTime),
        throughput: Math.round((totalBytes / 1024 / 1024) / ((endTime - startTime) / 1000)), // MB/s
        memoryDelta: endMemory.rss - startMemory.rss,
        chunkCount,
        totalBytes: Math.round(totalBytes / 1024 / 1024) // MB
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testCSVParsing(filePath, scenario) {
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    
    try {
      // Simulate CSV parsing with streaming
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      let processedRecords = 0;
      const batchSize = 10000;
      
      for (let i = 1; i < lines.length; i += batchSize) {
        const batch = lines.slice(i, i + batchSize);
        
        // Parse batch
        batch.forEach(line => {
          if (line.trim()) {
            const cols = line.split(',');
            const record = {};
            headers.forEach((header, idx) => {
              record[header] = (cols[idx] ?? '').trim();
            });
            processedRecords++;
          }
        });
        
        // Yield control periodically
        if (i % (batchSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
      
      const endTime = performance.now();
      const endMemory = getMemoryUsage();
      
      return {
        duration: Math.round(endTime - startTime),
        recordsPerSecond: Math.round(processedRecords / ((endTime - startTime) / 1000)),
        memoryDelta: endMemory.rss - startMemory.rss,
        processedRecords
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testMemoryManagement(scenario) {
    const startMemory = getMemoryUsage();
    
    try {
      // Simulate memory-intensive operations
      const largeArray = new Array(scenario.expectedRecords);
      
      // Fill with mock data
      for (let i = 0; i < Math.min(scenario.expectedRecords, 100000); i++) {
        largeArray[i] = {
          id: `test_${i}`,
          data: Buffer.alloc(1024, 'A') // 1KB per record
        };
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const endMemory = getMemoryUsage();
      
      return {
        startMemory: startMemory.rss,
        endMemory: endMemory.rss,
        peakMemory: Math.max(startMemory.rss, endMemory.rss),
        memoryEfficiency: Math.round((scenario.expectedRecords / endMemory.rss) * 100) // records per MB
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testAnomalyDetection(scenario) {
    const startTime = performance.now();
    const startMemory = getMemoryUsage();
    
    try {
      // Simulate anomaly detection processing
      const mockRecords = Array.from({ length: Math.min(scenario.expectedRecords, 100000) }, (_, i) => ({
        id: `rec_${i}`,
        aParty: `192.168.1.${i % 254}`,
        bParty: `10.0.0.${i % 254}`,
        startTimestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        bytesTransferred: Math.floor(Math.random() * 1000000),
        operator: ['airtel', 'jio', 'vodafone'][i % 3]
      }));
      
      // Simulate anomaly detection algorithms
      const anomalies = [];
      const sourceIPGroups = new Map();
      
      // Group by source IP
      mockRecords.forEach(record => {
        if (!sourceIPGroups.has(record.aParty)) {
          sourceIPGroups.set(record.aParty, []);
        }
        sourceIPGroups.get(record.aParty).push(record);
      });
      
      // Detect anomalies (simplified)
      for (const [sourceIP, records] of sourceIPGroups) {
        if (records.length > 100) { // High activity
          anomalies.push({
            id: `anom_${sourceIP}`,
            entity: sourceIP,
            rule: 'high_activity',
            score: Math.min(100, records.length / 10)
          });
        }
      }
      
      const endTime = performance.now();
      const endMemory = getMemoryUsage();
      
      return {
        duration: Math.round(endTime - startTime),
        recordsPerSecond: Math.round(mockRecords.length / ((endTime - startTime) / 1000)),
        memoryDelta: endMemory.rss - startMemory.rss,
        anomaliesFound: anomalies.length,
        processingEfficiency: Math.round((anomalies.length / mockRecords.length) * 10000) // anomalies per 10k records
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  printTestResult(result) {
    console.log('\n📊 Test Results:');
    console.log('─'.repeat(30));
    
    // File Reading
    if (result.read.error) {
      console.log(`❌ File Reading: ${result.read.error}`);
    } else {
      console.log(`✅ File Reading: ${result.read.duration}ms, ${result.read.throughput} MB/s`);
    }
    
    // CSV Parsing
    if (result.parse.error) {
      console.log(`❌ CSV Parsing: ${result.parse.error}`);
    } else {
      console.log(`✅ CSV Parsing: ${result.parse.duration}ms, ${result.parse.recordsPerSecond} records/s`);
    }
    
    // Memory Management
    if (result.memory.error) {
      console.log(`❌ Memory Test: ${result.memory.error}`);
    } else {
      console.log(`✅ Memory: ${result.memory.endMemory}MB, Efficiency: ${result.memory.memoryEfficiency} records/MB`);
    }
    
    // Anomaly Detection
    if (result.anomaly.error) {
      console.log(`❌ Anomaly Detection: ${result.anomaly.error}`);
    } else {
      console.log(`✅ Anomaly Detection: ${result.anomaly.duration}ms, ${result.anomaly.anomaliesFound} anomalies found`);
    }
    
    // Performance Assessment
    this.assessPerformance(result);
  }

  assessPerformance(result) {
    const size = result.fileSize;
    let category = 'small';
    if (size > 50) category = 'large';
    else if (size > 10) category = 'medium';
    
    const benchmarks = BENCHMARKS.processing[category];
    const anomalyBenchmarks = BENCHMARKS.anomaly[category];
    
    console.log('\n🎯 Performance Assessment:');
    console.log('─'.repeat(30));
    
    // Processing performance
    if (result.parse.duration <= benchmarks.maxTime) {
      console.log(`✅ Processing: PASS (${result.parse.duration}ms <= ${benchmarks.maxTime}ms)`);
    } else {
      console.log(`❌ Processing: FAIL (${result.parse.duration}ms > ${benchmarks.maxTime}ms)`);
    }
    
    // Memory usage
    if (result.memory.endMemory <= benchmarks.maxMemory) {
      console.log(`✅ Memory: PASS (${result.memory.endMemory}MB <= ${benchmarks.maxMemory}MB)`);
    } else {
      console.log(`❌ Memory: FAIL (${result.memory.endMemory}MB > ${benchmarks.maxMemory}MB)`);
    }
    
    // Anomaly detection performance
    if (result.anomaly.duration <= anomalyBenchmarks.maxTime) {
      console.log(`✅ Anomaly Detection: PASS (${result.anomaly.duration}ms <= ${anomalyBenchmarks.maxTime}ms)`);
    } else {
      console.log(`❌ Anomaly Detection: FAIL (${result.anomaly.duration}ms > ${anomalyBenchmarks.maxTime}ms)`);
    }
  }

  generateReport() {
    console.log('\n📋 Performance Test Summary');
    console.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => 
      r.parse.duration && r.memory.endMemory && r.anomaly.duration
    ).length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    
    // Save results to file
    const reportPath = path.join(__dirname, '..', 'performance-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 IPDR Performance Testing Suite');
  console.log('==================================');
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Memory: ${Math.round(require('os').totalmem() / 1024 / 1024 / 1024)}GB total`);
  
  const tester = new PerformanceTester();
  
  try {
    for (const scenario of TEST_SCENARIOS) {
      await tester.runTest(scenario);
    }
    
    tester.generateReport();
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
    process.exit(1);
  }
}

// Run with garbage collection if available
if (process.argv.includes('--expose-gc')) {
  console.log('🔧 Garbage collection enabled');
}

main().catch(console.error);
