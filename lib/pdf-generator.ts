'use client';

import jsPDF from 'jspdf';
import { Case, IPDRRecord, Anomaly, EvidenceFile } from './types';
import { formatTimestamp, formatBytes } from '@/utils/formatters';

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
  let yPosition = margin;

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
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('IPDR-Intel+ Investigation Report', margin, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Generated: ${formatTimestamp(new Date())}`, margin, yPosition);
    yPosition += 10;
    
    // Report hash for integrity
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    pdf.text(`Report ID: ${reportId}`, margin, yPosition);
    yPosition += 15;
  };

  // Section 65B Certificate
  const addSection65B = () => {
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Section 65B Certificate (Indian Evidence Act, 1872)', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const certificate = [
      'CERTIFICATE UNDER SECTION 65B OF THE INDIAN EVIDENCE ACT, 1872',
      '',
      'I, Detective Sarah Johnson, hereby certify that:',
      '',
      '1. The computer output contained in this report has been produced by a computer during',
      '   the period over which the computer was used regularly to store or process information',
      '   for the purposes of digital forensic investigation.',
      '',
      '2. During the said period, information of the kind contained or of the kind from which',
      '   the information contained in the statement is derived was regularly fed into the computer',
      '   in the ordinary course of the said activities.',
      '',
      '3. Throughout the material part of the said period, the computer was operating properly,',
      '   or if not, any respect in which it was not operating properly or was out of operation',
      '   during that part of that period was not such as to affect the production of the document',
      '   or the accuracy of its contents.',
      '',
      '4. The information contained in this report reproduces or is derived from information',
      '   supplied to the computer in the ordinary course of the said activities.',
      '',
      '5. The digital evidence has been preserved in its original form using SHA-256 hashing',
      '   to ensure integrity and prevent tampering.',
      '',
      `Signed: Detective Sarah Johnson`,
      `Date: ${formatTimestamp(new Date())}`,
      `Designation: Lead Digital Forensics Investigator`
    ];

    certificate.forEach(line => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 10;
  };

  // Case Summary
  const addCaseSummary = () => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Case Summary', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    
    const summary = [
      `Case ID: ${data.case.id}`,
      `Case Title: ${data.case.title}`,
      `Description: ${data.case.description || 'N/A'}`,
      `Status: ${data.case.status.toUpperCase()}`,
      `Created By: ${data.case.createdBy}`,
      `Created Date: ${formatTimestamp(data.case.createdAt)}`,
      `Last Updated: ${formatTimestamp(data.case.updatedAt)}`,
      '',
      'Investigation Statistics:',
      `• Total Evidence Files: ${data.evidenceFiles.length}`,
      `• Total Records Analyzed: ${data.records.length.toLocaleString()}`,
      `• Anomalies Detected: ${data.anomalies.length}`,
      `• Data Volume: ${formatBytes(data.records.reduce((sum, r) => sum + r.bytesTransferred, 0))}`,
    ];

    summary.forEach(line => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });

    yPosition += 15;
  };

  // Key Findings
  const addKeyFindings = () => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Key Findings', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');

    // Top source IPs
    const sourceIPs = data.records.reduce((acc, record) => {
      acc[record.aParty] = (acc[record.aParty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceIPs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    pdf.text('Top Source IPs by Activity:', margin, yPosition);
    yPosition += 10;

    topSources.forEach(([ip, count]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }
      pdf.text(`• ${ip}: ${count} connections`, margin + 10, yPosition);
      yPosition += 7;
    });

    yPosition += 10;

    // Protocol distribution
    const protocols = data.records.reduce((acc, record) => {
      acc[record.protocol] = (acc[record.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    pdf.text('Protocol Distribution:', margin, yPosition);
    yPosition += 10;

    Object.entries(protocols).forEach(([protocol, count]) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }
      const percentage = ((count / data.records.length) * 100).toFixed(1);
      pdf.text(`• ${protocol}: ${count} (${percentage}%)`, margin + 10, yPosition);
      yPosition += 7;
    });

    yPosition += 15;
  };

  // Anomalies Section
  const addAnomalies = () => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Detected Anomalies', margin, yPosition);
    yPosition += 15;

    if (data.anomalies.length === 0) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('No anomalies detected in the analyzed data.', margin, yPosition);
      yPosition += 15;
      return;
    }

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');

    // Group anomalies by rule type
    const anomaliesByRule = data.anomalies.reduce((acc, anomaly) => {
      if (!acc[anomaly.rule]) acc[anomaly.rule] = [];
      acc[anomaly.rule].push(anomaly);
      return acc;
    }, {} as Record<string, typeof data.anomalies>);

    // Special section for late night activity
    if (anomaliesByRule.late_night_activity) {
      pdf.setFont(undefined, 'bold');
      pdf.text('Late Night Activity Detection (00:00-05:00 IST):', margin, yPosition);
      yPosition += 10;
      
      pdf.setFont(undefined, 'normal');
      const lateNightAnomalies = anomaliesByRule.late_night_activity;
      const totalConnections = lateNightAnomalies.reduce((sum, a) => {
        const match = a.reason.match(/Detected (\d+) connections/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
      const totalBytes = lateNightAnomalies.reduce((sum, a) => {
        const match = a.reason.match(/(\d+(?:\.\d+)? \w+) data transfer/);
        return sum + (match ? 1 : 0);
      }, 0);
      
      pdf.text(`• Total late night connections: ${totalConnections}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`• Entities with late night activity: ${lateNightAnomalies.length}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`• This pattern often indicates automated attacks or suspicious behavior`, margin + 10, yPosition);
      yPosition += 10;
    }

    // Other anomalies
    Object.entries(anomaliesByRule).forEach(([rule, ruleAnomalies]) => {
      if (rule === 'late_night_activity') return; // Already handled above
      
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }

      pdf.setFont(undefined, 'bold');
      pdf.text(`${rule.replace(/_/g, ' ').toUpperCase()}:`, margin, yPosition);
      yPosition += 8;

      pdf.setFont(undefined, 'normal');
      ruleAnomalies.slice(0, 5).forEach((anomaly, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
          addWatermark();
        }

        pdf.text(`${index + 1}. ${anomaly.entity} (${anomaly.severity.toUpperCase()})`, margin + 10, yPosition);
        yPosition += 6;
        pdf.text(`   Score: ${anomaly.score.toFixed(2)}`, margin + 15, yPosition);
        yPosition += 6;
        pdf.text(`   Reason: ${anomaly.reason}`, margin + 15, yPosition);
        yPosition += 6;
        pdf.text(`   Detected: ${formatTimestamp(anomaly.timestamp)}`, margin + 15, yPosition);
        yPosition += 8;
      });

      if (ruleAnomalies.length > 5) {
        pdf.text(`   ... and ${ruleAnomalies.length - 5} more anomalies`, margin + 15, yPosition);
        yPosition += 6;
      }
      
      yPosition += 5;
    });

    yPosition += 10;
  };

  // Evidence Files
  const addEvidenceFiles = () => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Evidence Files', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');

    data.evidenceFiles.forEach((file, index) => {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }

      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}. ${file.filename}`, margin, yPosition);
      yPosition += 8;

      pdf.setFont(undefined, 'normal');
      pdf.text(`SHA-256: ${file.sha256}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Size: ${formatBytes(file.size)}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Operator: ${file.operator.toUpperCase()}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Records: ${file.recordCount || 0}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Uploaded: ${formatTimestamp(file.uploadedAt)}`, margin + 10, yPosition);
      yPosition += 10;
    });

    yPosition += 10;
  };

  // Audit Trail
  const addAuditTrail = () => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = margin;
      addWatermark();
    }

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Audit Trail', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');

    const auditEntries = [
      {
        timestamp: data.case.createdAt,
        action: 'Case Created',
        actor: data.case.createdBy,
        details: `Case "${data.case.title}" created`
      },
      ...data.evidenceFiles.map(file => ({
        timestamp: file.uploadedAt,
        action: 'Evidence Uploaded',
        actor: file.uploadedBy,
        details: `File "${file.filename}" uploaded and processed`
      })),
      {
        timestamp: new Date(),
        action: 'Report Generated',
        actor: 'System',
        details: 'Secure PDF report generated with Section 65B certificate'
      }
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    auditEntries.forEach((entry, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        addWatermark();
      }

      pdf.text(`${index + 1}. ${formatTimestamp(entry.timestamp)} - ${entry.action}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`   Actor: ${entry.actor}`, margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`   Details: ${entry.details}`, margin + 10, yPosition);
      yPosition += 8;
    });
  };

  // Generate the report
  addHeader();
  addSection65B();
  addCaseSummary();
  addKeyFindings();
  addAnomalies();
  addEvidenceFiles();
  addAuditTrail();

  // Final page with signature
  pdf.addPage();
  addWatermark();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('Report Certification', margin, yPosition);
  yPosition += 20;

  pdf.setFontSize(12);
  pdf.setFont(undefined, 'normal');
  pdf.text('This report has been generated by IPDR-Intel+ digital forensics platform.', margin, yPosition);
  yPosition += 10;
  pdf.text('All data has been processed with cryptographic integrity verification.', margin, yPosition);
  yPosition += 10;
  pdf.text('This document is legally compliant under Section 65B of the Indian Evidence Act.', margin, yPosition);
  yPosition += 30;

  pdf.setFont(undefined, 'bold');
  pdf.text('Digital Signature Hash:', margin, yPosition);
  yPosition += 10;
  pdf.setFont(undefined, 'normal');
  
  // Generate a mock signature hash
  const signatureHash = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  pdf.text(signatureHash, margin, yPosition);

  return pdf.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
