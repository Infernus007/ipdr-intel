import { describe, it, expect, beforeEach } from 'vitest';
import { ChainOfCustodyManager, getBrowserFingerprint, getCurrentLocation } from './chain-of-custody';

describe('Chain of Custody System', () => {
  let cocManager: ChainOfCustodyManager;

  beforeEach(() => {
    cocManager = new ChainOfCustodyManager();
  });

  describe('ChainOfCustodyManager', () => {
    it('should initialize with genesis entry', () => {
      const auditLog = cocManager.getFullAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].action).toBe('upload');
      expect(auditLog[0].subject).toBe('coc_system_init');
      expect(auditLog[0].previousHash).toBe('0');
    });

    it('should add audit entries with proper hash chaining', async () => {
      await cocManager.addAuditEntry('test_user', 'upload', 'file_123', {
        filename: 'test.csv',
        fileSize: 1024
      });

      const auditLog = cocManager.getFullAuditLog();
      expect(auditLog).toHaveLength(2);
      
      const newEntry = auditLog[1];
      expect(newEntry.actor).toBe('test_user');
      expect(newEntry.action).toBe('upload');
      expect(newEntry.subject).toBe('file_123');
      expect(newEntry.previousHash).toBe(auditLog[0].currentHash);
      expect(newEntry.currentHash).toBeTruthy();
      expect(newEntry.currentHash).not.toBe(newEntry.previousHash);
    });

    it('should verify chain integrity correctly', async () => {
      // Add multiple entries
      await cocManager.addAuditEntry('user1', 'upload', 'file1', { test: 'data1' });
      await cocManager.addAuditEntry('user2', 'parse', 'file1', { test: 'data2' });
      await cocManager.addAuditEntry('user3', 'analyze', 'file1', { test: 'data3' });

      const verification = await cocManager.verifyChainIntegrity();
      expect(verification.isValid).toBe(true);
      expect(verification.errors).toHaveLength(0);
    });

    it('should detect integrity violations', async () => {
      await cocManager.addAuditEntry('user1', 'upload', 'file1', { test: 'data1' });
      
      // Manually corrupt the audit log
      const auditLog = cocManager.getFullAuditLog();
      auditLog[1].currentHash = 'corrupted_hash';

      const verification = await cocManager.verifyChainIntegrity();
      expect(verification.isValid).toBe(false);
      expect(verification.errors.length).toBeGreaterThan(0);
    });

    it('should filter audit trail by subject', async () => {
      await cocManager.addAuditEntry('user1', 'upload', 'file1', {});
      await cocManager.addAuditEntry('user1', 'upload', 'file2', {});
      await cocManager.addAuditEntry('user1', 'parse', 'file1', {});

      const file1Trail = cocManager.getAuditTrail('file1');
      expect(file1Trail).toHaveLength(2);
      expect(file1Trail.every(entry => entry.subject === 'file1')).toBe(true);
    });

    it('should export audit log with verification script', async () => {
      await cocManager.addAuditEntry('user1', 'upload', 'file1', {});
      await cocManager.addAuditEntry('user1', 'parse', 'file1', {});

      const exportData = await cocManager.exportAuditLog();
      
      expect(exportData.auditLog).toHaveLength(3); // Including genesis
      expect(exportData.headHash).toBeTruthy();
      expect(exportData.verificationScript).toContain('verifyChainOfCustody');
      expect(exportData.exportTimestamp).toBeInstanceOf(Date);
      expect(exportData.exportHash).toBeTruthy();
    });

    it('should generate BSA Section 63 certificate', async () => {
      const expertDetails = {
        name: 'Dr. Test Expert',
        designation: 'Senior Digital Forensics Expert',
        organization: 'Test Agency',
        experience: '10+ years',
        qualifications: ['Ph.D. Computer Science', 'CISSP Certified'],
        contactInfo: 'test@agency.gov'
      };

      const certificate = await cocManager.generateBSASection63Certificate(
        'case_123',
        'evidence_456',
        expertDetails
      );

      expect(certificate.certificateId).toBeTruthy();
      expect(certificate.caseId).toBe('case_123');
      expect(certificate.evidenceId).toBe('evidence_456');
      expect(certificate.expertDetails.name).toBe('Dr. Test Expert');
      expect(certificate.deviceDetails).toBeTruthy();
      expect(certificate.productionDetails).toBeTruthy();
      expect(certificate.integrityDetails).toBeTruthy();
      expect(certificate.chainOfCustody).toBeTruthy();
      expect(certificate.digitalSignature).toBeTruthy();
      expect(certificate.certificateHash).toBeTruthy();

      // Verify certificate generation was logged
      const auditLog = cocManager.getFullAuditLog();
      const certEntry = auditLog.find(entry => 
        entry.metadata.action === 'bsa_section63_certificate_generated'
      );
      expect(certEntry).toBeTruthy();
      expect(certEntry?.metadata.certificateId).toBe(certificate.certificateId);
    });
  });

  describe('Browser Fingerprinting', () => {
    it('should generate browser fingerprint safely', () => {
      const fingerprint = getBrowserFingerprint();
      expect(fingerprint).toBeTruthy();
      expect(typeof fingerprint).toBe('string');
      
      // Should be base64 encoded JSON
      const decoded = JSON.parse(atob(fingerprint));
      expect(decoded).toHaveProperty('userAgent');
      expect(decoded).toHaveProperty('platform');
      expect(decoded).toHaveProperty('canvas');
      expect(decoded).toHaveProperty('timezone');
    });

    it('should handle server environment', () => {
      // Mock server environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      const fingerprint = getBrowserFingerprint();
      expect(fingerprint).toBe('server_environment');
      
      // Restore
      global.window = originalWindow;
    });
  });

  describe('Location Services', () => {
    it('should handle location request gracefully', async () => {
      const location = await getCurrentLocation();
      expect(typeof location).toBe('string');
      // In test environment, should return 'Unknown' or 'Location access denied'
      expect(['Unknown', 'Location access denied'].includes(location)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should maintain chain integrity through multiple operations', async () => {
      // Simulate a complete IPDR processing workflow
      const fileId = 'test_file_001';
      const caseId = 'case_001';
      
      // File upload
      await cocManager.addAuditEntry('user1', 'upload', fileId, {
        filename: 'airtel_data.csv',
        fileSize: 1024000,
        mimeType: 'text/csv'
      });
      
      // File parsing
      await cocManager.addAuditEntry('system', 'parse', fileId, {
        recordsProcessed: 5000,
        sha256Hash: 'abc123...xyz789',
        processingTime: 1500
      });
      
      // Analysis
      await cocManager.addAuditEntry('system', 'analyze', fileId, {
        anomaliesFound: 12,
        analysisType: 'late_night_activity'
      });
      
      // Report generation
      await cocManager.addAuditEntry('user1', 'export', caseId, {
        reportType: 'pdf',
        evidenceFiles: 1,
        recordsIncluded: 5000
      });
      
      // Verify entire chain
      const verification = await cocManager.verifyChainIntegrity();
      expect(verification.isValid).toBe(true);
      
      // Check audit trail for file
      const fileTrail = cocManager.getAuditTrail(fileId);
      expect(fileTrail).toHaveLength(3); // upload, parse, analyze
      
      // Verify chronological order
      for (let i = 1; i < fileTrail.length; i++) {
        expect(fileTrail[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          fileTrail[i-1].timestamp.getTime()
        );
      }
    });

    it('should handle sequential operations maintaining integrity', async () => {
      // Simulate sequential audit entries (proper way to maintain chain integrity)
      for (let i = 0; i < 10; i++) {
        await cocManager.addAuditEntry(`user${i}`, 'view', `file${i}`, { 
          sequential: true,
          index: i 
        });
      }
      
      const auditLog = cocManager.getFullAuditLog();
      expect(auditLog).toHaveLength(11); // 10 + genesis
      
      // Verify chain integrity with sequential operations
      const verification = await cocManager.verifyChainIntegrity();
      expect(verification.isValid).toBe(true);
    });
  });
});
