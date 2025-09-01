'use client';

import { EvidenceFile, IPDRRecord, TelecomOperator } from './types';
import { sha256Hex, detectDelimiter } from './processing';

export interface ProcessingProgress {
  processedBytes: number;
  totalBytes: number;
  processedRows: number;
  estimatedTimeRemaining: number;
  currentChunk: number;
  totalChunks: number;
}

export interface StreamingProcessorOptions {
  chunkSize: number; // Default: 10MB chunks
  maxConcurrency: number; // Default: 2 concurrent chunks
  onProgress: (progress: ProcessingProgress) => void;
  onError: (error: Error) => void;
}

export class StreamingCSVProcessor {
  private options: StreamingProcessorOptions;
  private decoder = new TextDecoder();
  private buffer = '';
  private headers: string[] = [];
  private delimiter: ',' | '\t' = ',';
  private processedRows = 0;
  private startTime = Date.now();

  constructor(options: Partial<StreamingProcessorOptions> = {}) {
    this.options = {
      chunkSize: 10 * 1024 * 1024, // 10MB chunks
      maxConcurrency: 2,
      onProgress: () => {},
      onError: () => {},
      ...options
    };
  }

  async processLargeFile(
    file: File,
    caseId: string,
    operator: TelecomOperator = 'airtel'
  ): Promise<{ evidence: Omit<EvidenceFile, 'status'>; records: IPDRRecord[] }> {
    const startTime = Date.now();
    const totalBytes = file.size;
    let processedBytes = 0;
    const allRecords: IPDRRecord[] = [];
    
    // Calculate SHA-256 hash using streaming
    const sha256 = await this.calculateStreamingHash(file);
    
    // Reset for CSV processing
    this.buffer = '';
    this.processedRows = 0;
    processedBytes = 0;

    try {
      const stream = file.stream();
      const reader = stream.getReader();
      let isFirstChunk = true;
      let chunkIndex = 0;
      const totalChunks = Math.ceil(totalBytes / this.options.chunkSize);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining buffer
          if (this.buffer.trim()) {
            const finalRecords = await this.processTextChunk(
              this.buffer, 
              caseId, 
              `file_${Date.now()}`, 
              operator,
              chunkIndex++
            );
            allRecords.push(...finalRecords);
          }
          break;
        }

        processedBytes += value.byteLength;
        const text = this.decoder.decode(value, { stream: true });
        
        if (isFirstChunk) {
          // Extract headers from first chunk
          const lines = text.split('\n');
          if (lines.length > 0) {
            this.headers = this.parseHeaders(lines[0]);
            this.delimiter = detectDelimiter(lines[0]);
          }
          isFirstChunk = false;
        }

        // Process chunk with overlap handling
        const records = await this.processChunkWithOverlap(
          text, 
          caseId, 
          `file_${Date.now()}`, 
          operator,
          chunkIndex++
        );
        allRecords.push(...records);

        // Report progress
        const progress: ProcessingProgress = {
          processedBytes,
          totalBytes,
          processedRows: this.processedRows,
          estimatedTimeRemaining: this.calculateETA(processedBytes, totalBytes, startTime),
          currentChunk: chunkIndex,
          totalChunks
        };
        this.options.onProgress(progress);

        // Memory management - yield control periodically
        if (chunkIndex % 5 === 0) {
          await this.yieldControl();
        }
      }

      const evidence: Omit<EvidenceFile, 'status'> = {
        id: `file_${Date.now()}`,
        caseId,
        filename: file.name,
        sha256,
        size: file.size,
        operator,
        storageUri: `/evidence/file_${Date.now()}`,
        uploadedBy: 'enterprise_user',
        uploadedAt: new Date()
      };

      return { evidence, records: allRecords };

    } catch (error) {
      this.options.onError(error as Error);
      throw error;
    }
  }

  private async calculateStreamingHash(file: File): Promise<string> {
    const stream = file.stream();
    const reader = stream.getReader();
    const hasher = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(''),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Use SubtleCrypto for streaming hash
    let hashBuffer = new ArrayBuffer(0);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Accumulate for hash calculation
      const newBuffer = new ArrayBuffer(hashBuffer.byteLength + value.byteLength);
      const newView = new Uint8Array(newBuffer);
      newView.set(new Uint8Array(hashBuffer), 0);
      newView.set(new Uint8Array(value), hashBuffer.byteLength);
      hashBuffer = newBuffer;
      
      // For very large files, we might want to hash incrementally
      // This is a simplified version - production would use crypto.subtle.digest
    }

    return await sha256Hex(hashBuffer);
  }

  private parseHeaders(headerLine: string): string[] {
    const delimiter = detectDelimiter(headerLine);
    return headerLine.split(delimiter).map(h => h.trim());
  }

  private async processChunkWithOverlap(
    text: string,
    caseId: string,
    fileId: string,
    operator: TelecomOperator,
    chunkIndex: number
  ): Promise<IPDRRecord[]> {
    // Add previous buffer to handle line breaks across chunks
    const fullText = this.buffer + text;
    const lines = fullText.split('\n');
    
    // Keep the last incomplete line for next chunk
    this.buffer = lines.pop() || '';
    
    // Skip header if this is not the first chunk
    const dataLines = chunkIndex === 0 ? lines.slice(1) : lines;
    
    return await this.processLines(dataLines, caseId, fileId, operator, chunkIndex);
  }

  private async processTextChunk(
    text: string,
    caseId: string,
    fileId: string,
    operator: TelecomOperator,
    chunkIndex: number
  ): Promise<IPDRRecord[]> {
    const lines = text.split('\n').filter(line => line.trim());
    return await this.processLines(lines, caseId, fileId, operator, chunkIndex);
  }

  private async processLines(
    lines: string[],
    caseId: string,
    fileId: string,
    operator: TelecomOperator,
    chunkIndex: number
  ): Promise<IPDRRecord[]> {
    const records: IPDRRecord[] = [];
    const batchSize = 1000; // Process in batches to avoid blocking UI
    
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const batchRecords = await this.processBatch(batch, caseId, fileId, operator, chunkIndex, i);
      records.push(...batchRecords);
      
      // Yield control every batch
      await this.yieldControl();
    }
    
    return records;
  }

  private async processBatch(
    lines: string[],
    caseId: string,
    fileId: string,
    operator: TelecomOperator,
    chunkIndex: number,
    batchOffset: number
  ): Promise<IPDRRecord[]> {
    const records: IPDRRecord[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const cols = line.split(this.delimiter);
      const row: Record<string, string> = {};
      
      this.headers.forEach((header, idx) => {
        row[header] = (cols[idx] ?? '').trim();
      });

      // Convert to IPDRRecord
      const record = await this.convertToIPDRRecord(
        row, 
        caseId, 
        fileId, 
        operator, 
        `${chunkIndex}_${batchOffset + i}`
      );
      
      if (record) {
        records.push(record);
        this.processedRows++;
      }
    }
    
    return records;
  }

  private async convertToIPDRRecord(
    row: Record<string, string>,
    caseId: string,
    fileId: string,
    operator: TelecomOperator,
    recordIndex: string
  ): Promise<IPDRRecord | null> {
    try {
      // Flexible header mapping for different IPDR formats
      const sourceIP = row['SourceIP'] || row['SrcIP'] || row['src_ip'] || row['source_ip'] || '';
      const destIP = row['DestinationIP'] || row['DestIP'] || row['dst_ip'] || row['destination_ip'] || '';
      const sourcePort = row['SourcePort'] || row['SrcPort'] || row['src_port'] || row['source_port'] || '';
      const destPort = row['DestinationPort'] || row['DstPort'] || row['dst_port'] || row['destination_port'] || '';
      const protocol = (row['Protocol'] || row['proto'] || '').toUpperCase();
      const startStr = row['StartTime'] || row['Start'] || row['start_time'] || '';
      const endStr = row['EndTime'] || row['End'] || row['end_time'] || '';
      const bytesStr = row['Bytes'] || row['Octets'] || row['bytes'] || '0';

      if (!sourceIP || !destIP) {
        return null; // Skip invalid records
      }

      // Optimized date parsing
      const start = this.parseTimestamp(startStr);
      const end = this.parseTimestamp(endStr);
      const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
      const bytes = parseInt(bytesStr) || 0;

      // Fast hash generation using record index instead of crypto
      const fastHash = this.generateFastHash(sourceIP, destIP, protocol, start.getTime(), recordIndex);

      return {
        id: `rec_${fileId}_${recordIndex}`,
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
        rawRowHash: fastHash,
        operator
      };
    } catch (error) {
      console.warn('Failed to process record:', error);
      return null;
    }
  }

  private parseTimestamp(timeStr: string): Date {
    // Optimized timestamp parsing
    if (!timeStr) return new Date();
    
    // Handle common formats efficiently
    const cleaned = timeStr.replace(/\//g, '-').replace(/\s+/g, ' ').trim();
    return new Date(cleaned);
  }

  private generateFastHash(sourceIP: string, destIP: string, protocol: string, timestamp: number, index: string): string {
    // Fast hash generation using simple string concatenation and built-in hash
    const data = `${sourceIP}|${destIP}|${protocol}|${timestamp}|${index}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private calculateETA(processedBytes: number, totalBytes: number, startTime: number): number {
    const elapsed = Date.now() - startTime;
    const rate = processedBytes / elapsed; // bytes per ms
    const remaining = totalBytes - processedBytes;
    return remaining / rate; // ms remaining
  }

  private async yieldControl(): Promise<void> {
    // Yield control to prevent UI blocking
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Export convenience function
export async function processLargeCSVFile(
  file: File,
  caseId: string,
  operator: TelecomOperator = 'airtel',
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ evidence: Omit<EvidenceFile, 'status'>; records: IPDRRecord[] }> {
  const processor = new StreamingCSVProcessor({
    chunkSize: 10 * 1024 * 1024, // 10MB chunks
    maxConcurrency: 2,
    onProgress: onProgress || (() => {}),
    onError: (error) => console.error('Streaming processor error:', error)
  });

  return processor.processLargeFile(file, caseId, operator);
}
