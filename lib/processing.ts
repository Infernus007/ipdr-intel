// Processing utilities for IPDR files (Airtel CSV/TSV)
'use client';

import { EvidenceFile, IPDRRecord, TelecomOperator } from './types';
import { globalCoC, getBrowserFingerprint, getCurrentLocation } from './chain-of-custody';

// Compute SHA-256 (hex) of ArrayBuffer
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256HexOfString(input: string): Promise<string> {
  const enc = new TextEncoder();
  return sha256Hex(enc.encode(input).buffer);
}

// Detect delimiter: tab or comma (fallback comma)
export function detectDelimiter(headerLine: string): ',' | '\t' {
  const tabCount = (headerLine.match(/\t/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

// Parse delimited text into array of objects keyed by header
export function parseDelimited(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const cols = raw.split(delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

// Parse JSON format IPDR data
export function parseJSON(text: string): Array<Record<string, string>> {
  try {
    const jsonData = JSON.parse(text);
    
    // Handle different JSON structures
    if (Array.isArray(jsonData)) {
      // Direct array of records
      return jsonData.map(record => {
        const normalizedRecord: Record<string, string> = {};
        Object.keys(record).forEach(key => {
          normalizedRecord[key] = String(record[key] || '');
        });
        return normalizedRecord;
      });
    } else if (jsonData.records && Array.isArray(jsonData.records)) {
      // Nested under 'records' key
      return jsonData.records.map((record: any) => {
        const normalizedRecord: Record<string, string> = {};
        Object.keys(record).forEach(key => {
          normalizedRecord[key] = String(record[key] || '');
        });
        return normalizedRecord;
      });
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      // Nested under 'data' key
      return jsonData.data.map((record: any) => {
        const normalizedRecord: Record<string, string> = {};
        Object.keys(record).forEach(key => {
          normalizedRecord[key] = String(record[key] || '');
        });
        return normalizedRecord;
      });
    } else if (jsonData.ipdr_records && Array.isArray(jsonData.ipdr_records)) {
      // Telecom-specific nested structure
      return jsonData.ipdr_records.map((record: any) => {
        const normalizedRecord: Record<string, string> = {};
        Object.keys(record).forEach(key => {
          normalizedRecord[key] = String(record[key] || '');
        });
        return normalizedRecord;
      });
    } else {
      // Single record object
      const normalizedRecord: Record<string, string> = {};
      Object.keys(jsonData).forEach(key => {
        normalizedRecord[key] = String(jsonData[key] || '');
      });
      return [normalizedRecord];
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Invalid JSON format. Please ensure the file contains valid JSON data.');
  }
}

// Detect file format and parse accordingly
export function parseFileContent(text: string, filename: string): Array<Record<string, string>> {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'json':
      return parseJSON(text);
    case 'csv':
    case 'tsv':
    case 'txt':
    default:
      return parseDelimited(text);
  }
}

// Normalize Airtel row to IPDRRecord (using IPs in aParty/bParty, ports in aPort/bPort)
export async function normalizeAirtelRows(
  rows: Array<Record<string, string>>,
  caseId: string,
  fileId: string,
  operator: TelecomOperator
): Promise<IPDRRecord[]> {
  const records: IPDRRecord[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    // Expected headers from sample
    const sourceIP = r['SourceIP'] || r['SrcIP'] || r['src_ip'] || '';
    const destIP = r['DestinationIP'] || r['DestIP'] || r['dst_ip'] || '';
    const sourcePort = r['SourcePort'] || r['SrcPort'] || r['src_port'] || '';
    const destPort = r['DestinationPort'] || r['DstPort'] || r['dst_port'] || '';
    const protocol = (r['Protocol'] || '').toUpperCase();
    const startStr = r['StartTime'] || r['Start'] || '';
    const endStr = r['EndTime'] || r['End'] || '';
    const bytesStr = r['Bytes'] || r['Octets'] || '0';

    // Parse dates as local then keep Date objects (store UTC internally by Date semantics)
    const start = new Date(startStr.replace(/\//g, '-'));
    const end = new Date(endStr.replace(/\//g, '-'));
    const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    const bytes = Number(bytesStr) || 0;

    // Row hash from canonical string
    const canonical = [
      sourceIP,
      sourcePort,
      destIP,
      destPort,
      protocol,
      start.toISOString(),
      end.toISOString(),
      String(bytes)
    ].join('|');
    const rawRowHash = await sha256HexOfString(canonical);

    records.push({
      id: `rec_${fileId}_${i}`,
      caseId,
      aParty: sourceIP,
      aPort: sourcePort || undefined,
      bParty: destIP,
      bPort: destPort || undefined,
      protocol,
      startTimestamp: start,
      endTimestamp: end,
      duration,
      bytesTransferred: bytes,
      sourceFileId: fileId,
      rawRowHash,
      operator
    });
  }
  return records;
}

async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  // Use native arrayBuffer if available
  // @ts-ignore
  if (typeof (blob as any).arrayBuffer === 'function') {
    // @ts-ignore
    return (blob as any).arrayBuffer();
  }
  // Fallback to FileReader (jsdom compatibility)
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
}

// Enhanced streaming processing for large files
export interface ProcessingProgress {
  processedBytes: number;
  totalBytes: number;
  processedRows: number;
  estimatedTimeRemaining: number;
  currentChunk: number;
  totalChunks: number;
  throughput: number; // MB/s
}

// Fast hash for large datasets (non-cryptographic but collision-resistant)
function fastHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Enhanced processing with streaming and progress callbacks
export async function processAirtelFile(
  file: File,
  caseId: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ evidence: Omit<EvidenceFile, 'status'>; records: IPDRRecord[] }>{
  const startTime = Date.now();
  const fileId = `file_${Date.now()}`;
  
  // Get browser environment data for Chain of Custody
  const deviceFingerprint = getBrowserFingerprint();
  const location = await getCurrentLocation();
  const ipAddress = 'demo_ip'; // In real implementation, get from server
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'Server';
  
  // Log file upload in Chain of Custody
  await globalCoC.addAuditEntry(
    'demo_user',
    'upload',
    fileId,
    {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      caseId,
      action: 'file_upload_initiated'
    },
    { ipAddress, userAgent, location, deviceFingerprint }
  );
  
  // For small files (< 50MB), use original method
  if (file.size < 50 * 1024 * 1024) {
    const arrayBuf = await blobToArrayBuffer(file);
    const sha256 = await sha256Hex(arrayBuf);
    const text = new TextDecoder().decode(arrayBuf);
    const rows = parseFileContent(text, file.name);
    const records = await normalizeAirtelRows(rows, caseId, fileId, 'airtel');
    
    // Log parsing completion
    await globalCoC.addAuditEntry(
      'system',
      'parse',
      fileId,
      {
        sha256Hash: sha256,
        recordsProcessed: records.length,
        processingTime: Date.now() - startTime,
        fileSize: file.size,
        action: 'file_parsing_completed'
      },
      { ipAddress, userAgent, location, deviceFingerprint }
    );
    
    const evidence = {
      id: fileId,
      caseId,
      filename: file.name,
      sha256,
      size: file.size,
      operator: 'airtel' as const,
      storageUri: `/evidence/${fileId}`,
      uploadedBy: 'demo_user',
      uploadedAt: new Date()
    };
    
    // Log evidence creation
    await globalCoC.addAuditEntry(
      'system',
      'upload',
      fileId,
      {
        evidenceId: fileId,
        sha256Hash: sha256,
        storageUri: evidence.storageUri,
        action: 'evidence_record_created'
      },
      { ipAddress, userAgent, location, deviceFingerprint }
    );
    
    return { evidence, records };
  }

  // For large files, use streaming processing
  return await processLargeAirtelFile(file, caseId, fileId, onProgress, {
    ipAddress, userAgent, location, deviceFingerprint
  });
}

async function processLargeAirtelFile(
  file: File,
  caseId: string,
  fileId: string,
  onProgress?: (progress: ProcessingProgress) => void,
  cocData?: { ipAddress: string; userAgent: string; location: string; deviceFingerprint: string }
): Promise<{ evidence: Omit<EvidenceFile, 'status'>; records: IPDRRecord[] }> {
  const startTime = Date.now();
  const chunkSize = 10 * 1024 * 1024; // 10MB chunks
  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / chunkSize);
  
  let processedBytes = 0;
  let processedRows = 0;
  let buffer = '';
  let headers: string[] = [];
  let delimiter: ',' | '\t' = ',';
  const allRecords: IPDRRecord[] = [];
  
  // Calculate hash while streaming
  const hashChunks: ArrayBuffer[] = [];
  
  const stream = file.stream();
  const reader = stream.getReader();
  let chunkIndex = 0;
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Process any remaining buffer
        if (buffer.trim()) {
          const records = await processTextChunk(
            buffer, headers, delimiter, caseId, fileId, 'airtel', processedRows
          );
          allRecords.push(...records);
          processedRows += records.length;
        }
        break;
      }
      
      // Store chunk for hash calculation
      hashChunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
      
      processedBytes += value.byteLength;
      const text = new TextDecoder().decode(value, { stream: true });
      
      // Handle first chunk to extract headers
      if (chunkIndex === 0) {
        const lines = text.split('\n');
        if (lines.length > 0) {
          headers = lines[0].split(detectDelimiter(lines[0])).map(h => h.trim());
          delimiter = detectDelimiter(lines[0]);
        }
      }
      
      // Process chunk with line boundary handling
      const fullText = buffer + text;
      const lines = fullText.split('\n');
      
      // Keep last incomplete line for next chunk
      buffer = lines.pop() || '';
      
      // Process complete lines (skip header for first chunk)
      const dataLines = chunkIndex === 0 ? lines.slice(1) : lines;
      
      if (dataLines.length > 0) {
        const records = await processTextChunk(
          dataLines.join('\n'), headers, delimiter, caseId, fileId, 'airtel', processedRows
        );
        allRecords.push(...records);
        processedRows += records.length;
      }
      
      chunkIndex++;
      
      // Report progress
      if (onProgress) {
        const elapsed = Date.now() - startTime;
        const throughput = (processedBytes / 1024 / 1024) / (elapsed / 1000); // MB/s
        const estimatedTotal = (totalBytes / processedBytes) * elapsed;
        const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);
        
        onProgress({
          processedBytes,
          totalBytes,
          processedRows,
          estimatedTimeRemaining: estimatedRemaining,
          currentChunk: chunkIndex,
          totalChunks,
          throughput
        });
      }
      
      // Yield control periodically to prevent UI blocking
      if (chunkIndex % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Calculate hash from all chunks
    const totalBuffer = new ArrayBuffer(hashChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
    const totalView = new Uint8Array(totalBuffer);
    let offset = 0;
    
    for (const chunk of hashChunks) {
      totalView.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    
    const sha256 = await sha256Hex(totalBuffer);
    
    // Log parsing completion for large files
    if (cocData) {
      await globalCoC.addAuditEntry(
        'system',
        'parse',
        fileId,
        {
          sha256Hash: sha256,
          recordsProcessed: allRecords.length,
          processingTime: Date.now() - startTime,
          fileSize: file.size,
          chunksProcessed: totalChunks,
          action: 'large_file_parsing_completed'
        },
        cocData
      );
    }

    const evidence = {
      id: fileId,
      caseId,
      filename: file.name,
      sha256,
      size: file.size,
      operator: 'airtel' as const,
      storageUri: `/evidence/${fileId}`,
      uploadedBy: 'demo_user',
      uploadedAt: new Date()
    };
    
    // Log evidence creation for large files
    if (cocData) {
      await globalCoC.addAuditEntry(
        'system',
        'upload',
        fileId,
        {
          evidenceId: fileId,
          sha256Hash: sha256,
          storageUri: evidence.storageUri,
          processingMethod: 'streaming',
          action: 'evidence_record_created'
        },
        cocData
      );
    }
    
    return { evidence, records: allRecords };
    
  } finally {
    reader.releaseLock();
  }
}

async function processTextChunk(
  text: string,
  headers: string[],
  delimiter: ',' | '\t',
  caseId: string,
  fileId: string,
  operator: TelecomOperator,
  startIndex: number
): Promise<IPDRRecord[]> {
  const lines = text.split('\n').filter(line => line.trim());
  const records: IPDRRecord[] = [];
  
  // Process in batches to avoid blocking
  const batchSize = 1000;
  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    
    for (let j = 0; j < batch.length; j++) {
      const line = batch[j];
      const cols = line.split(delimiter);
      const row: Record<string, string> = {};
      
      headers.forEach((header, idx) => {
        row[header] = (cols[idx] ?? '').trim();
      });
      
      const record = await createOptimizedRecord(row, caseId, fileId, operator, startIndex + i + j);
      if (record) {
        records.push(record);
      }
    }
    
    // Yield control between batches
    if (i % (batchSize * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return records;
}

async function createOptimizedRecord(
  row: Record<string, string>,
  caseId: string,
  fileId: string,
  operator: TelecomOperator,
  index: number
): Promise<IPDRRecord | null> {
  try {
    const sourceIP = row['SourceIP'] || row['SrcIP'] || row['src_ip'] || '';
    const destIP = row['DestinationIP'] || row['DestIP'] || row['dst_ip'] || '';
    const sourcePort = row['SourcePort'] || row['SrcPort'] || row['src_port'] || '';
    const destPort = row['DestinationPort'] || row['DstPort'] || row['dst_port'] || '';
    const protocol = (row['Protocol'] || '').toUpperCase();
    const startStr = row['StartTime'] || row['Start'] || '';
    const endStr = row['EndTime'] || row['End'] || '';
    const bytesStr = row['Bytes'] || row['Octets'] || '0';

    if (!sourceIP || !destIP) {
      return null; // Skip invalid records
    }

    // Optimized date parsing
    const start = new Date(startStr.replace(/\//g, '-'));
    const end = new Date(endStr.replace(/\//g, '-'));
    const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    const bytes = parseInt(bytesStr) || 0;

    // Use fast hash for large datasets instead of crypto hash
    const canonical = `${sourceIP}|${sourcePort}|${destIP}|${destPort}|${protocol}|${start.getTime()}|${end.getTime()}|${bytes}`;
    const rawRowHash = fastHash(canonical);

    return {
      id: `rec_${fileId}_${index}`,
      caseId,
      aParty: sourceIP,
      aPort: sourcePort || undefined,
      bParty: destIP,
      bPort: destPort || undefined,
      protocol,
      startTimestamp: start,
      endTimestamp: end,
      duration,
      bytesTransferred: bytes,
      sourceFileId: fileId,
      rawRowHash,
      operator
    };
  } catch (error) {
    console.warn('Failed to process record:', error);
    return null;
  }
}


