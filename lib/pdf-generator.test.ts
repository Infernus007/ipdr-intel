import { describe, it, expect, vi } from 'vitest';
import { generateSecurePDFReport } from './pdf-generator';
import { Case, IPDRRecord, Anomaly, EvidenceFile } from './types';

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockPDF = {
    internal: {
      pageSize: {
        width: 210,
        height: 297
      }
    },
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' }))
  };
  
  return {
    default: vi.fn(() => mockPDF)
  };
});

const mockCase: Case = {
  id: 'case1',
  title: 'Test Investigation',
  description: 'Test case description',
  status: 'active',
  createdBy: 'Detective Test',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
  evidenceFiles: [],
  recordCount: 2,
  anomalyCount: 1
};

const mockRecords: IPDRRecord[] = [
  {
    id: 'rec1',
    caseId: 'case1',
    aParty: '10.10.10.2',
    aPort: '5050',
    bParty: '142.250.183.14',
    bPort: '443',
    protocol: 'TCP',
    startTimestamp: new Date('2025-08-20T10:00:05'),
    endTimestamp: new Date('2025-08-20T10:00:15'),
    duration: 10,
    bytesTransferred: 2048,
    sourceFileId: 'file1',
    rawRowHash: 'hash1',
    operator: 'airtel'
  }
];

const mockAnomalies: Anomaly[] = [
  {
    id: 'anom1',
    caseId: 'case1',
    entity: '10.10.10.2',
    entityType: 'ip',
    rule: 'unusual_volume',
    score: 85.5,
    reason: 'High data volume detected',
    timestamp: new Date('2025-08-20T10:00:00'),
    severity: 'high'
  }
];

const mockEvidenceFiles: EvidenceFile[] = [
  {
    id: 'file1',
    caseId: 'case1',
    filename: 'airtel_data.csv',
    sha256: 'abc123def456',
    size: 1048576,
    operator: 'airtel',
    storageUri: '/evidence/file1',
    uploadedBy: 'investigator',
    uploadedAt: new Date('2025-08-20'),
    status: 'completed',
    recordCount: 1,
    errorCount: 0
  }
];

describe('PDF Generator', () => {
  it('generates PDF report successfully', async () => {
    const reportData = {
      case: mockCase,
      records: mockRecords,
      anomalies: mockAnomalies,
      evidenceFiles: mockEvidenceFiles
    };

    const result = await generateSecurePDFReport(reportData);
    
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });

  it('handles empty data gracefully', async () => {
    const reportData = {
      case: mockCase,
      records: [],
      anomalies: [],
      evidenceFiles: []
    };

    const result = await generateSecurePDFReport(reportData);
    
    expect(result).toBeInstanceOf(Blob);
  });

  it('includes all required sections', async () => {
    const mockJsPDF = await import('jspdf');
    const mockInstance = new mockJsPDF.default();
    
    const reportData = {
      case: mockCase,
      records: mockRecords,
      anomalies: mockAnomalies,
      evidenceFiles: mockEvidenceFiles
    };

    await generateSecurePDFReport(reportData);

    // Verify that text method was called with expected content
    expect(mockInstance.text).toHaveBeenCalledWith(
      expect.stringContaining('IPDR-Intel+ Investigation Report'),
      expect.any(Number),
      expect.any(Number)
    );
    
    expect(mockInstance.text).toHaveBeenCalledWith(
      expect.stringContaining('Section 63S Certificate'),
      expect.any(Number),
      expect.any(Number)
    );
    
    expect(mockInstance.text).toHaveBeenCalledWith(
      expect.stringContaining('Case Summary'),
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('includes watermark on pages', async () => {
    const mockJsPDF = await import('jspdf');
    const mockInstance = new mockJsPDF.default();
    
    const reportData = {
      case: mockCase,
      records: mockRecords,
      anomalies: mockAnomalies,
      evidenceFiles: mockEvidenceFiles
    };

    await generateSecurePDFReport(reportData);

    // Verify watermark was added
    expect(mockInstance.text).toHaveBeenCalledWith(
      'CONFIDENTIAL',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({
        angle: 45,
        align: 'center'
      })
    );
  });

  it('generates unique report signature', async () => {
    const mockJsPDF = await import('jspdf');
    const mockInstance = new mockJsPDF.default();
    
    const reportData = {
      case: mockCase,
      records: mockRecords,
      anomalies: mockAnomalies,
      evidenceFiles: mockEvidenceFiles
    };

    await generateSecurePDFReport(reportData);

    // Check that a hash-like signature was generated
    const textCalls = (mockInstance.text as any).mock.calls;
    const signatureCalls = textCalls.filter((call: any) => 
      typeof call[0] === 'string' && 
      call[0].length === 64 && 
      /^[a-f0-9]+$/.test(call[0])
    );
    
    expect(signatureCalls.length).toBeGreaterThan(0);
  });
});
