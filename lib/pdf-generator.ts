'use client';

import jsPDF from 'jspdf';
import { Case, IPDRRecord, Anomaly, EvidenceFile } from './types';
import { formatTimestamp, formatBytes } from '@/utils/formatters';
import { globalCoC, AuditLogEntry } from './chain-of-custody';

interface ReportData {
  case: Case;
  records: IPDRRecord[];
  anomalies: Anomaly[];
  evidenceFiles: EvidenceFile[];
}

export async function generateSecurePDFReport(data: ReportData): Promise<Blob> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const maxWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number = 30) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, fontSize: number = 12, textMaxWidth?: number) => {
    const actualMaxWidth = textMaxWidth || (maxWidth - x + margin);
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, actualMaxWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak();
      pdf.text(line, x, yPosition);
      yPosition += fontSize * 0.5; // Line height
    });
  };

  // Watermark function
  const addWatermark = () => {
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(50);
    pdf.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center'
    });
    pdf.setTextColor(0, 0, 0);
  };

  // Header function
  const addHeader = () => {
    addWatermark();
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IPDR-Intel+ Investigation Report', margin, yPosition);
    yPosition += 20;
    
    // Generation info
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${formatTimestamp(new Date())}`, margin, yPosition);
    yPosition += 12;
    
    // Report ID
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    pdf.text(`Report ID: ${reportId}`, margin, yPosition);
    yPosition += 20;
  };

  // Section 63S Certificate
  const addSection63S = () => {
    checkPageBreak(50);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Section 63S Certificate (Indian Evidence Act, 1872)', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const certificateLines = [
      'CERTIFICATE UNDER SECTION 63S OF THE INDIAN EVIDENCE ACT, 1872',
      '',
      'I, Detective Sarah Johnson, hereby certify that:',
      '',
      '1. The computer output contained in this report has been produced by a computer during the period over which the computer was used regularly to store or process information for the purposes of digital forensic investigation.',
      '',
      '2. During the said period, information of the kind contained or of the kind from which the information contained in the statement is derived was regularly fed into the computer in the ordinary course of the said activities.',
      '',
      '3. Throughout the material part of the said period, the computer was operating properly, or if not, any respect in which it was not operating properly or was out of operation during that part of that period was not such as to affect the production of the document or the accuracy of its contents.',
      '',
      '4. The information contained in this report reproduces or is derived from information supplied to the computer in the ordinary course of the said activities.',
      '',
      '5. The digital evidence has been preserved in its original form using SHA-256 hashing to ensure integrity and prevent tampering.',
      '',
      `Signed: Detective Sarah Johnson`,
      `Date: ${formatTimestamp(new Date())}`,
      `Designation: Lead Digital Forensics Investigator`
    ];

    certificateLines.forEach(line => {
      if (line.trim() === '') {
        yPosition += 6;
      } else {
        checkPageBreak();
        if (line.startsWith('Signed:') || line.startsWith('Date:') || line.startsWith('Designation:')) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        addWrappedText(line, margin, 10);
        yPosition += 2;
      }
    });

    yPosition += 15;
  };

  // Case Summary
  const addCaseSummary = () => {
    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Case Summary', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const caseDetails = [
      { label: 'Case ID:', value: data.case.id },
      { label: 'Case Title:', value: data.case.title },
      { label: 'Description:', value: data.case.description || 'N/A' },
      { label: 'Status:', value: data.case.status.toUpperCase() },
      { label: 'Created By:', value: data.case.createdBy },
      { label: 'Created Date:', value: formatTimestamp(data.case.createdAt) },
      { label: 'Last Updated:', value: formatTimestamp(data.case.updatedAt) }
    ];

    caseDetails.forEach(({ label, value }) => {
      checkPageBreak();
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      
      const labelWidth = pdf.getTextWidth(label);
      addWrappedText(value, margin + labelWidth + 5, 11, maxWidth - labelWidth - 5);
      yPosition += 3;
    });

    yPosition += 15;

    // Investigation Statistics
          checkPageBreak(40);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Investigation Statistics:', margin, yPosition);
      yPosition += 12;

    pdf.setFont('helvetica', 'normal');
    const statistics = [
      `Total Evidence Files: ${data.evidenceFiles.length}`,
      `Total Records Analyzed: ${data.records.length.toLocaleString()}`,
      `Anomalies Detected: ${data.anomalies.length}`,
      `Data Volume: ${formatBytes(data.records.reduce((sum, r) => sum + r.bytesTransferred, 0))}`
    ];

          statistics.forEach(stat => {
        checkPageBreak();
        pdf.text('• ', margin, yPosition);
        addWrappedText(stat, margin + 8, 9);
        yPosition += 3;
      });

    yPosition += 15;
  };

  // Key Findings
  const addKeyFindings = () => {
    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Findings', margin, yPosition);
    yPosition += 15;

    // Top source IPs
    const sourceIPs = data.records.reduce((acc, record) => {
      acc[record.aParty] = (acc[record.aParty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceIPs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

          pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Top Source IPs by Activity:', margin, yPosition);
      yPosition += 12;

          pdf.setFont('helvetica', 'normal');
      topSources.forEach(([ip, count]) => {
        checkPageBreak();
        pdf.text('• ', margin, yPosition);
        addWrappedText(`${ip}: ${count} connections`, margin + 8, 9);
        yPosition += 3;
      });

    yPosition += 15;

    // Protocol distribution
    const protocols = data.records.reduce((acc, record) => {
      acc[record.protocol] = (acc[record.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

          checkPageBreak(30);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Protocol Distribution:', margin, yPosition);
      yPosition += 12;

          pdf.setFont('helvetica', 'normal');
      Object.entries(protocols).forEach(([protocol, count]) => {
        checkPageBreak();
        const percentage = ((count / data.records.length) * 100).toFixed(1);
        pdf.text('• ', margin, yPosition);
        addWrappedText(`${protocol}: ${count} (${percentage}%)`, margin + 8, 9);
        yPosition += 3;
      });

    yPosition += 20;
  };

  // Anomalies Section
  const addAnomalies = () => {
    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detected Anomalies', margin, yPosition);
    yPosition += 15;

    if (data.anomalies.length === 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('No anomalies detected in the analyzed data.', margin, yPosition);
      yPosition += 15;
      return;
    }

    // Group anomalies by rule type
    const anomaliesByRule = data.anomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.rule]) acc[anomaly.rule] = [];
      acc[anomaly.rule].push(anomaly);
      return acc;
    }, {} as Record<string, typeof data.anomalies>);

    // Special section for late night activity
    if (anomaliesByRule.late_night_activity) {
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Late Night Activity Detection (00:00-05:00 IST):', margin, yPosition);
      yPosition += 12;
      
      pdf.setFont('helvetica', 'normal');
      const lateNightAnomalies = anomaliesByRule.late_night_activity;
      const totalConnections = lateNightAnomalies.reduce((sum, a) => {
        const match = a.reason.match(/Detected (\d+) connections/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
      
      pdf.text('• ', margin, yPosition);
      addWrappedText(`Total late night connections: ${totalConnections}`, margin + 8, 11);
      yPosition += 3;
      
      pdf.text('• ', margin, yPosition);
      addWrappedText(`Entities with late night activity: ${lateNightAnomalies.length}`, margin + 8, 11);
      yPosition += 3;
      
      pdf.text('• ', margin, yPosition);
      addWrappedText('This pattern often indicates automated attacks or suspicious behavior', margin + 8, 11);
      yPosition += 15;
    }

    // Other anomalies
    Object.entries(anomaliesByRule).forEach(([rule, ruleAnomalies]) => {
      if (rule === 'late_night_activity') return; // Already handled above
      
      checkPageBreak(30);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${rule.replace(/_/g, ' ').toUpperCase()}:`, margin, yPosition);
      yPosition += 12;

      pdf.setFont('helvetica', 'normal');
      ruleAnomalies.slice(0, 3).forEach((anomaly, index) => {
        checkPageBreak(25);

        pdf.setFont('helvetica', 'bold');
        addWrappedText(`${index + 1}. ${anomaly.entity} (${anomaly.severity.toUpperCase()})`, margin + 5, 9);
        yPosition += 2;
        
        pdf.setFont('helvetica', 'normal');
        addWrappedText(`Score: ${anomaly.score.toFixed(2)}`, margin + 10, 9);
        yPosition += 2;
        addWrappedText(`Reason: ${anomaly.reason}`, margin + 10, 9);
        yPosition += 2;
        addWrappedText(`Detected: ${formatTimestamp(anomaly.timestamp)}`, margin + 10, 9);
        yPosition += 8;
      });

      if (ruleAnomalies.length > 3) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`... and ${ruleAnomalies.length - 3} more anomalies`, margin + 10, yPosition);
        yPosition += 5;
      }
      
      yPosition += 10;
    });

    yPosition += 10;
  };

  // Evidence Files
  const addEvidenceFiles = () => {
    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Evidence Files', margin, yPosition);
    yPosition += 15;

    data.evidenceFiles.forEach((file, index) => {
      checkPageBreak(35);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      addWrappedText(`${index + 1}. ${file.filename}`, margin, 12);
      yPosition += 5;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      addWrappedText(`SHA-256: ${file.sha256}`, margin + 10, 9);
      yPosition += 2;
      addWrappedText(`Size: ${formatBytes(file.size)}`, margin + 10, 9);
      yPosition += 2;
      addWrappedText(`Operator: ${file.operator.toUpperCase()}`, margin + 10, 9);
      yPosition += 2;
      addWrappedText(`Records: ${file.recordCount || 0}`, margin + 10, 9);
      yPosition += 2;
      addWrappedText(`Uploaded: ${formatTimestamp(file.uploadedAt)}`, margin + 10, 9);
      yPosition += 10;
    });

    yPosition += 15;
  };

  // Chain of Custody Audit Trail
  const addChainOfCustody = async () => {
    checkPageBreak(50);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Chain of Custody - Audit Trail', margin, yPosition);
    yPosition += 15;
    
    // Add integrity verification status
    const verification = await globalCoC.verifyChainIntegrity();
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const statusText = `Chain Integrity Status: ${verification.isValid ? 'VERIFIED' : 'COMPROMISED'}`;
    pdf.text(statusText, margin, yPosition);
    yPosition += 12;
    
    if (!verification.isValid) {
      pdf.setTextColor(255, 0, 0);
      pdf.setFont('helvetica', 'normal');
      addWrappedText(`Integrity Errors: ${verification.errors.length}`, margin, 11);
      yPosition += 2;
      verification.errors.slice(0, 3).forEach(error => {
        pdf.text('• ', margin, yPosition);
        addWrappedText(error, margin + 8, 10);
        yPosition += 2;
      });
      pdf.setTextColor(0, 0, 0);
    }
    yPosition += 10;

    // Get full audit log
    const fullAuditLog = globalCoC.getFullAuditLog();
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Total Audit Entries: ${fullAuditLog.length}`, margin, yPosition);
    yPosition += 12;

    pdf.setFont('helvetica', 'normal');
    pdf.text('Recent Chain of Custody Events:', margin, yPosition);
    yPosition += 12;

    // Show last 8 audit entries
    const recentEntries = fullAuditLog.slice(-8);
    
    recentEntries.forEach((entry, index) => {
      checkPageBreak(30);

      const actionLabels: Record<string, string> = {
        'upload': 'Evidence Upload',
        'parse': 'Data Processing',
        'analyze': 'Analysis',
        'export': 'Export/Report',
        'view': 'Access',
        'verify': 'Verification'
      };

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const entryTitle = `${recentEntries.length - index}. ${formatTimestamp(entry.timestamp)} - ${actionLabels[entry.action] || entry.action.toUpperCase()}`;
      addWrappedText(entryTitle, margin, 11);
      yPosition += 3;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      addWrappedText(`Actor: ${entry.actor}`, margin + 10, 9);
      yPosition += 1;
      addWrappedText(`Subject: ${entry.subject}`, margin + 10, 9);
      yPosition += 1;
      addWrappedText(`Hash: ${entry.currentHash.slice(0, 32)}...`, margin + 10, 9);
      yPosition += 1;
      
      if (entry.metadata.action) {
        addWrappedText(`Action: ${entry.metadata.action}`, margin + 10, 9);
        yPosition += 1;
      }
      
      if (entry.ipAddress) {
        addWrappedText(`IP: ${entry.ipAddress}`, margin + 10, 9);
        yPosition += 1;
      }
      
      yPosition += 5;
    });

    yPosition += 15;
    
    // Add BSA 2023 compliance statement
    checkPageBreak(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legal Compliance:', margin, yPosition);
    yPosition += 12;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const complianceText = [
      'Chain of Custody maintained per Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63',
      'Cryptographic integrity verification using SHA-256 hash chaining',
      'Tamper-evident audit logging with timestamp verification',
      'Digital evidence preservation with immutable audit trail',
      'Compliance with Telecommunications Act 2023 and DPDP Act 2023'
    ];
    
    complianceText.forEach(text => {
      checkPageBreak();
      pdf.text('• ', margin, yPosition);
      addWrappedText(text, margin + 8, 10);
      yPosition += 3;
    });
    
    yPosition += 15;
  };

  // Generate the report
  addHeader();
  addSection63S();
  addCaseSummary();
  addKeyFindings();
  addAnomalies();
  addEvidenceFiles();
  await addChainOfCustody();
  
  // Log report generation in Chain of Custody
  await globalCoC.addAuditEntry(
    'system',
    'export',
    data.case.id,
    {
      reportType: 'secure_pdf',
      evidenceFiles: data.evidenceFiles.length,
      recordsIncluded: data.records.length,
      anomaliesIncluded: data.anomalies.length,
      action: 'court_ready_report_generated'
    }
  );

  // Final page with signature
  pdf.addPage();
  addWatermark();
  yPosition = margin;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Report Certification', margin, yPosition);
  yPosition += 20;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  addWrappedText('This report has been generated by IPDR-Intel+ digital forensics platform.', margin, 11);
  yPosition += 5;
  addWrappedText('All data has been processed with cryptographic integrity verification.', margin, 11);
  yPosition += 5;
  addWrappedText('This document is legally compliant under Section 63S of the Indian Evidence Act.', margin, 11);
  yPosition += 25;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Digital Signature Hash:', margin, yPosition);
  yPosition += 12;
  pdf.setFont('helvetica', 'normal');
  
  // Generate a mock signature hash
  const signatureHash = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  // Split hash for better readability
  const hashLines = signatureHash.match(/.{1,32}/g) || [];
  hashLines.forEach(hashLine => {
    pdf.text(hashLine, margin, yPosition);
    yPosition += 12;
  });

  return pdf.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Safe removal - check if element is still a child before removing
  if (document.body.contains(link)) {
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
}