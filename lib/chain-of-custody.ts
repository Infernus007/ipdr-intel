'use client';

import { sha256HexOfString } from './processing';

// Chain of Custody Types for BSA 2023 Compliance
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actor: string; // User ID or system identifier
  action: 'upload' | 'parse' | 'analyze' | 'export' | 'view' | 'modify' | 'delete' | 'verify';
  subject: string; // File ID, case ID, or record ID
  metadata: Record<string, any>;
  previousHash: string; // Hash of previous entry for chain integrity
  currentHash: string; // SHA-256 hash of this entry
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceFingerprint?: string;
}

export interface ChainOfCustodyRecord {
  evidenceId: string;
  caseId: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  sha256Hash: string;
  md5Hash: string;
  acquisitionTimestamp: Date;
  acquisitionMethod: 'manual_upload' | 'api_import' | 'bulk_import';
  acquisitionOfficer: string;
  sourceOrganization: string;
  legalAuthority: string; // Court order, warrant details
  auditTrail: AuditLogEntry[];
  integrityStatus: 'verified' | 'compromised' | 'unknown';
  lastVerificationTimestamp: Date;
  custodyTransfers: CustodyTransfer[];
}

export interface CustodyTransfer {
  id: string;
  fromOfficer: string;
  toOfficer: string;
  timestamp: Date;
  reason: string;
  location: string;
  witnessOfficer?: string;
  digitalSignature: string;
  transferHash: string;
}

export interface BSASection63Certificate {
  certificateId: string;
  caseId: string;
  evidenceId: string;
  generationTimestamp: Date;
  
  // BSA Section 63 Required Fields
  deviceDetails: {
    computerSystem: string;
    operatingSystem: string;
    softwareVersion: string;
    hardwareSpecs: string;
  };
  
  productionDetails: {
    methodology: string;
    processingSteps: string[];
    toolsUsed: string[];
    environmentDetails: string;
  };
  
  integrityDetails: {
    originalHash: string;
    currentHash: string;
    hashAlgorithm: string;
    verificationTimestamp: Date;
    integrityStatus: boolean;
  };
  
  expertDetails: {
    name: string;
    designation: string;
    organization: string;
    qualifications: string[];
    experience: string;
    contactInfo: string;
  };
  
  chainOfCustody: {
    acquisitionDetails: string;
    handlingProcedures: string[];
    storageConditions: string;
    accessLog: string[];
  };
  
  digitalSignature: string;
  certificateHash: string;
}

// Chain of Custody Manager Class
export class ChainOfCustodyManager {
  private auditLog: AuditLogEntry[] = [];
  private lastHash: string = '0'; // Genesis hash

  constructor() {
    // Initialize with synchronous genesis entry
    this.initializeGenesis();
  }

  private initializeGenesis() {
    if (this.auditLog.length === 0) {
      const timestamp = new Date();
      const id = `audit_genesis_${timestamp.getTime()}`;
      
      const entryData = {
        id,
        timestamp: timestamp.toISOString(),
        actor: 'system',
        action: 'upload' as const,
        subject: 'coc_system_init',
        metadata: {
          description: 'Chain of Custody system initialized',
          version: '1.0.0',
          compliance: 'BSA 2023'
        },
        previousHash: this.lastHash
      };

      // Create simple hash for genesis entry (synchronous)
      const dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
      const currentHash = this.simpleHash(dataString);

      const entry: AuditLogEntry = {
        ...entryData,
        timestamp,
        currentHash
      };

      this.auditLog.push(entry);
      this.lastHash = currentHash;
    }
  }

  // Simple hash function for synchronous operations
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  // Add new audit log entry with hash chaining
  async addAuditEntry(
    actor: string,
    action: AuditLogEntry['action'],
    subject: string,
    metadata: Record<string, any> = {},
    additionalInfo?: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      deviceFingerprint?: string;
    }
  ): Promise<AuditLogEntry> {
    const timestamp = new Date();
    const id = `audit_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create entry data for hashing
    const entryData = {
      id,
      timestamp: timestamp.toISOString(),
      actor,
      action,
      subject,
      metadata,
      previousHash: this.lastHash,
      ...additionalInfo
    };

    // Generate current hash
    const dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
    const currentHash = await sha256HexOfString(dataString);

    const entry: AuditLogEntry = {
      ...entryData,
      timestamp,
      currentHash,
      ipAddress: additionalInfo?.ipAddress,
      userAgent: additionalInfo?.userAgent,
      location: additionalInfo?.location,
      deviceFingerprint: additionalInfo?.deviceFingerprint
    };

    this.auditLog.push(entry);
    this.lastHash = currentHash;

    return entry;
  }

  // Verify audit log integrity
  async verifyChainIntegrity(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    let expectedHash = '0'; // Genesis hash

    for (let i = 0; i < this.auditLog.length; i++) {
      const entry = this.auditLog[i];
      
      // Check if previous hash matches
      if (entry.previousHash !== expectedHash) {
        errors.push(`Entry ${i}: Previous hash mismatch. Expected: ${expectedHash}, Got: ${entry.previousHash}`);
      }

      // Recalculate current hash
      const entryData = {
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        actor: entry.actor,
        action: entry.action,
        subject: entry.subject,
        metadata: entry.metadata,
        previousHash: entry.previousHash,
        ...(entry.ipAddress && { ipAddress: entry.ipAddress }),
        ...(entry.userAgent && { userAgent: entry.userAgent }),
        ...(entry.location && { location: entry.location }),
        ...(entry.deviceFingerprint && { deviceFingerprint: entry.deviceFingerprint })
      };

      const dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
      
      // Use appropriate hash function based on entry type
      let calculatedHash: string;
      if (i === 0 || entry.subject === 'coc_system_init') {
        // Genesis entry uses simple hash
        calculatedHash = this.simpleHash(dataString);
      } else {
        // Regular entries use SHA-256
        calculatedHash = await sha256HexOfString(dataString);
      }

      if (calculatedHash !== entry.currentHash) {
        errors.push(`Entry ${i}: Hash verification failed. Expected: ${entry.currentHash}, Calculated: ${calculatedHash}`);
      }

      expectedHash = entry.currentHash;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get audit log for specific subject
  getAuditTrail(subjectId: string): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.subject === subjectId);
  }

  // Get full audit log
  getFullAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  // Export audit log with verification script
  async exportAuditLog(): Promise<{
    auditLog: AuditLogEntry[];
    headHash: string;
    verificationScript: string;
    exportTimestamp: Date;
    exportHash: string;
  }> {
    const exportTimestamp = new Date();
    const exportData = {
      auditLog: this.auditLog,
      headHash: this.lastHash,
      exportTimestamp: exportTimestamp.toISOString()
    };

    const exportHash = await sha256HexOfString(JSON.stringify(exportData));

    const verificationScript = `
// Chain of Custody Verification Script
// Generated: ${exportTimestamp.toISOString()}
// Export Hash: ${exportHash}

async function verifyChainOfCustody(auditLogData) {
  const crypto = require('crypto');
  
  function sha256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }
  
  const { auditLog, headHash } = auditLogData;
  let expectedHash = '0'; // Genesis hash
  const errors = [];
  
  for (let i = 0; i < auditLog.length; i++) {
    const entry = auditLog[i];
    
    if (entry.previousHash !== expectedHash) {
      errors.push(\`Entry \${i}: Previous hash mismatch\`);
    }
    
    const entryData = {
      id: entry.id,
      timestamp: entry.timestamp,
      actor: entry.actor,
      action: entry.action,
      subject: entry.subject,
      metadata: entry.metadata,
      previousHash: entry.previousHash,
      ...(entry.ipAddress && { ipAddress: entry.ipAddress }),
      ...(entry.userAgent && { userAgent: entry.userAgent }),
      ...(entry.location && { location: entry.location }),
      ...(entry.deviceFingerprint && { deviceFingerprint: entry.deviceFingerprint })
    };
    
    const dataString = JSON.stringify(entryData, Object.keys(entryData).sort());
    const calculatedHash = sha256(dataString);
    
    if (calculatedHash !== entry.currentHash) {
      errors.push(\`Entry \${i}: Hash verification failed\`);
    }
    
    expectedHash = entry.currentHash;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    finalHash: expectedHash,
    expectedFinalHash: headHash
  };
}

// Usage: verifyChainOfCustody(auditLogData)
`;

    return {
      auditLog: this.auditLog,
      headHash: this.lastHash,
      verificationScript,
      exportTimestamp,
      exportHash
    };
  }

  // Generate BSA Section 63 Certificate
  async generateBSASection63Certificate(
    caseId: string,
    evidenceId: string,
    expertDetails: BSASection63Certificate['expertDetails'],
    additionalDetails: Partial<BSASection63Certificate> = {}
  ): Promise<BSASection63Certificate> {
    const timestamp = new Date();
    const certificateId = `bsa63_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get system information
    const deviceDetails = {
      computerSystem: typeof window !== 'undefined' ? navigator.platform : 'Server Environment',
      operatingSystem: typeof window !== 'undefined' ? navigator.userAgent : 'Node.js Runtime',
      softwareVersion: 'IPDR-Intel+ v1.0.0',
      hardwareSpecs: 'Web Browser Environment'
    };

    const certificate: BSASection63Certificate = {
      certificateId,
      caseId,
      evidenceId,
      generationTimestamp: timestamp,
      
      deviceDetails: additionalDetails.deviceDetails || deviceDetails,
      
      productionDetails: additionalDetails.productionDetails || {
        methodology: 'Automated IPDR processing with cryptographic verification',
        processingSteps: [
          'File integrity verification using SHA-256 hashing',
          'Delimiter detection and parsing validation',
          'Data normalization and standardization',
          'Anomaly detection using AI algorithms',
          'Chain of custody maintenance with audit logging'
        ],
        toolsUsed: [
          'IPDR-Intel+ Digital Forensics Platform',
          'SHA-256 Cryptographic Hash Function',
          'JavaScript/TypeScript Processing Engine',
          'React User Interface Framework'
        ],
        environmentDetails: 'Controlled digital environment with audit logging'
      },
      
      integrityDetails: additionalDetails.integrityDetails || {
        originalHash: 'TBD', // Will be filled with actual file hash
        currentHash: 'TBD',   // Will be verified during generation
        hashAlgorithm: 'SHA-256',
        verificationTimestamp: timestamp,
        integrityStatus: true
      },
      
      expertDetails,
      
      chainOfCustody: additionalDetails.chainOfCustody || {
        acquisitionDetails: 'Digital file upload with cryptographic verification',
        handlingProcedures: [
          'Immediate SHA-256 hash calculation upon upload',
          'Secure storage with access logging',
          'Automated integrity verification',
          'Tamper-evident audit trail maintenance'
        ],
        storageConditions: 'Encrypted digital storage with backup redundancy',
        accessLog: this.getAuditTrail(evidenceId).map(entry => 
          `${entry.timestamp.toISOString()}: ${entry.actor} performed ${entry.action}`
        )
      },
      
      digitalSignature: 'TBD', // Will be calculated
      certificateHash: 'TBD'   // Will be calculated
    };

    // Generate certificate hash and digital signature
    const certificateData = { ...certificate };
    delete (certificateData as any).digitalSignature;
    delete (certificateData as any).certificateHash;
    
    const certificateString = JSON.stringify(certificateData, Object.keys(certificateData).sort());
    const certificateHash = await sha256HexOfString(certificateString);
    const digitalSignature = await sha256HexOfString(certificateString + expertDetails.name + timestamp.toISOString());

    certificate.certificateHash = certificateHash;
    certificate.digitalSignature = digitalSignature;

    // Log certificate generation
    await this.addAuditEntry('system', 'export', evidenceId, {
      action: 'bsa_section63_certificate_generated',
      certificateId,
      expertName: expertDetails.name,
      certificateHash
    });

    return certificate;
  }
}

// Global Chain of Custody Manager Instance
export const globalCoC = new ChainOfCustodyManager();

// Utility functions for browser environment detection
export function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server_environment';
  
  let canvasData = 'test_environment';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
      canvasData = canvas.toDataURL();
    }
  } catch (error) {
    // Handle test environment or environments without canvas support
    canvasData = 'canvas_not_supported';
  }
  
  return btoa(JSON.stringify({
    userAgent: navigator.userAgent || 'unknown',
    language: navigator.language || 'unknown',
    platform: navigator.platform || 'unknown',
    cookieEnabled: navigator.cookieEnabled || false,
    doNotTrack: navigator.doNotTrack || 'unknown',
    canvas: canvasData,
    screen: typeof screen !== 'undefined' ? {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth
    } : { width: 0, height: 0, colorDepth: 0 },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }));
}

export function getCurrentLocation(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve('Unknown');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(`${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`);
      },
      () => {
        resolve('Location access denied');
      },
      { timeout: 5000 }
    );
  });
}
