'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  FileText, 
  Download, 
  Printer,
  CheckCircle,
  Lock,
  User,
  Calendar,
  Hash,
  Fingerprint,
  Award,
  Scale
} from 'lucide-react';
import { BSASection63Certificate, globalCoC } from '@/lib/chain-of-custody';

interface BSACertificateProps {
  certificate: BSASection63Certificate;
  className?: string;
}

export function BSACertificateDisplay({ certificate, className }: BSACertificateProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    }).format(date);
  };

  const printCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>BSA Section 63 Certificate - ${certificate.certificateId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .section { margin: 20px 0; }
              .field { margin: 10px 0; }
              .label { font-weight: bold; display: inline-block; width: 200px; }
              .value { display: inline-block; }
              .signature { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px; }
              .footer { margin-top: 50px; font-size: 12px; color: #666; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>BHARATIYA SAKSHYA ADHINIYAM (BSA) 2023</h1>
              <h2>SECTION 63 CERTIFICATE</h2>
              <h3>Electronic Evidence Certification</h3>
            </div>
            
            <div class="section">
              <h3>Certificate Details</h3>
              <div class="field"><span class="label">Certificate ID:</span><span class="value">${certificate.certificateId}</span></div>
              <div class="field"><span class="label">Case ID:</span><span class="value">${certificate.caseId}</span></div>
              <div class="field"><span class="label">Evidence ID:</span><span class="value">${certificate.evidenceId}</span></div>
              <div class="field"><span class="label">Generation Date:</span><span class="value">${formatDate(certificate.generationTimestamp)}</span></div>
            </div>

            <div class="section">
              <h3>Device & System Details</h3>
              <div class="field"><span class="label">Computer System:</span><span class="value">${certificate.deviceDetails.computerSystem}</span></div>
              <div class="field"><span class="label">Operating System:</span><span class="value">${certificate.deviceDetails.operatingSystem}</span></div>
              <div class="field"><span class="label">Software Version:</span><span class="value">${certificate.deviceDetails.softwareVersion}</span></div>
              <div class="field"><span class="label">Hardware Specs:</span><span class="value">${certificate.deviceDetails.hardwareSpecs}</span></div>
            </div>

            <div class="section">
              <h3>Production & Processing Details</h3>
              <div class="field"><span class="label">Methodology:</span><span class="value">${certificate.productionDetails.methodology}</span></div>
              <div class="field"><span class="label">Processing Steps:</span></div>
              <ul>${certificate.productionDetails.processingSteps.map(step => `<li>${step}</li>`).join('')}</ul>
              <div class="field"><span class="label">Tools Used:</span></div>
              <ul>${certificate.productionDetails.toolsUsed.map(tool => `<li>${tool}</li>`).join('')}</ul>
            </div>

            <div class="section">
              <h3>Integrity Verification</h3>
              <div class="field"><span class="label">Hash Algorithm:</span><span class="value">${certificate.integrityDetails.hashAlgorithm}</span></div>
              <div class="field"><span class="label">Original Hash:</span><span class="value">${certificate.integrityDetails.originalHash}</span></div>
              <div class="field"><span class="label">Current Hash:</span><span class="value">${certificate.integrityDetails.currentHash}</span></div>
              <div class="field"><span class="label">Verification Status:</span><span class="value">${certificate.integrityDetails.integrityStatus ? 'VERIFIED' : 'FAILED'}</span></div>
              <div class="field"><span class="label">Verification Time:</span><span class="value">${formatDate(certificate.integrityDetails.verificationTimestamp)}</span></div>
            </div>

            <div class="section">
              <h3>Expert Certification</h3>
              <div class="field"><span class="label">Expert Name:</span><span class="value">${certificate.expertDetails.name}</span></div>
              <div class="field"><span class="label">Designation:</span><span class="value">${certificate.expertDetails.designation}</span></div>
              <div class="field"><span class="label">Organization:</span><span class="value">${certificate.expertDetails.organization}</span></div>
              <div class="field"><span class="label">Experience:</span><span class="value">${certificate.expertDetails.experience}</span></div>
              <div class="field"><span class="label">Qualifications:</span></div>
              <ul>${certificate.expertDetails.qualifications.map(qual => `<li>${qual}</li>`).join('')}</ul>
            </div>

            <div class="signature">
              <div class="field"><span class="label">Digital Signature:</span><span class="value" style="font-family: monospace; font-size: 10px;">${certificate.digitalSignature}</span></div>
              <div class="field"><span class="label">Certificate Hash:</span><span class="value" style="font-family: monospace; font-size: 10px;">${certificate.certificateHash}</span></div>
            </div>

            <div class="footer">
              <p><strong>Legal Notice:</strong> This certificate is generated in compliance with Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63. 
              The electronic evidence described herein has been processed and verified using cryptographically secure methods. 
              Any tampering with this evidence would be detectable through hash verification.</p>
              <p><strong>Generated by:</strong> IPDR-Intel+ Digital Forensics Platform</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            BSA Section 63 Certificate
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={printCertificate}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {certificate.certificateId}
          </Badge>
          <Badge variant={certificate.integrityDetails.integrityStatus ? "default" : "destructive"}>
            {certificate.integrityDetails.integrityStatus ? "Verified" : "Failed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Certificate Overview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Award className="h-4 w-4" />
            <span className="font-medium">Legal Certification</span>
          </div>
          <p className="text-sm text-blue-700">
            This certificate complies with <strong>Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63</strong> 
            requirements for electronic evidence admissibility in Indian courts.
          </p>
        </div>

        {/* Case Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Case Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Case ID:</span>
                <span className="font-mono">{certificate.caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evidence ID:</span>
                <span className="font-mono">{certificate.evidenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span>{formatDate(certificate.generationTimestamp)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Integrity Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Algorithm:</span>
                <span className="font-mono">{certificate.integrityDetails.hashAlgorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1">
                  {certificate.integrityDetails.integrityStatus ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <Lock className="h-3 w-3 text-red-500" />
                  )}
                  <span className={certificate.integrityDetails.integrityStatus ? "text-green-600" : "text-red-600"}>
                    {certificate.integrityDetails.integrityStatus ? "Verified" : "Compromised"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified:</span>
                <span>{formatDate(certificate.integrityDetails.verificationTimestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expert Details */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Certifying Expert
          </h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{certificate.expertDetails.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation:</span>
                  <span>{certificate.expertDetails.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization:</span>
                  <span>{certificate.expertDetails.organization}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience:</span>
                  <span>{certificate.expertDetails.experience}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Qualifications:</span>
                  <ul className="mt-1 space-y-1">
                    {certificate.expertDetails.qualifications.map((qual, index) => (
                      <li key={index} className="text-xs bg-background px-2 py-1 rounded">
                        {qual}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Processing Methodology</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm">{certificate.productionDetails.methodology}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Processing Steps:</h5>
                <ul className="space-y-1">
                  {certificate.productionDetails.processingSteps.map((step, index) => (
                    <li key={index} className="text-xs bg-background px-2 py-1 rounded">
                      {index + 1}. {step}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Tools Used:</h5>
                <ul className="space-y-1">
                  {certificate.productionDetails.toolsUsed.map((tool, index) => (
                    <li key={index} className="text-xs bg-background px-2 py-1 rounded">
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Digital Signature & Hash
          </h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Certificate Hash</Label>
              <div className="font-mono text-xs bg-background p-2 rounded border break-all">
                {certificate.certificateHash}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Digital Signature</Label>
              <div className="font-mono text-xs bg-background p-2 rounded border break-all">
                {certificate.digitalSignature}
              </div>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <Scale className="h-4 w-4" />
            <span className="font-medium">Legal Notice</span>
          </div>
          <p className="text-sm text-yellow-700">
            This certificate is generated in compliance with <strong>Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63</strong>. 
            The electronic evidence described herein has been processed and verified using cryptographically secure methods. 
            Any tampering with this evidence would be detectable through hash verification.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Certificate Generation Dialog
interface BSACertificateGeneratorProps {
  caseId: string;
  evidenceId: string;
  onCertificateGenerated: (certificate: BSASection63Certificate) => void;
}

export function BSACertificateGenerator({ 
  caseId, 
  evidenceId, 
  onCertificateGenerated 
}: BSACertificateGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expertDetails, setExpertDetails] = useState({
    name: '',
    designation: '',
    organization: '',
    experience: '',
    qualifications: [''],
    contactInfo: ''
  });

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    try {
      const certificate = await globalCoC.generateBSASection63Certificate(
        caseId,
        evidenceId,
        {
          ...expertDetails,
          qualifications: expertDetails.qualifications.filter(q => q.trim() !== '')
        }
      );
      
      onCertificateGenerated(certificate);
      setIsOpen(false);
    } catch (error) {
      console.error('Certificate generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addQualification = () => {
    setExpertDetails(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const updateQualification = (index: number, value: string) => {
    setExpertDetails(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((q, i) => i === index ? value : q)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Award className="h-4 w-4 mr-2" />
          Generate BSA Section 63 Certificate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Generate BSA Section 63 Certificate
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Expert Name *</Label>
              <Input
                id="name"
                value={expertDetails.name}
                onChange={(e) => setExpertDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                value={expertDetails.designation}
                onChange={(e) => setExpertDetails(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Senior Digital Forensics Expert"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="organization">Organization *</Label>
            <Input
              id="organization"
              value={expertDetails.organization}
              onChange={(e) => setExpertDetails(prev => ({ ...prev, organization: e.target.value }))}
              placeholder="Cybersecurity Department, XYZ Agency"
            />
          </div>

          <div>
            <Label htmlFor="experience">Experience *</Label>
            <Input
              id="experience"
              value={expertDetails.experience}
              onChange={(e) => setExpertDetails(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="15+ years in digital forensics and cybersecurity"
            />
          </div>

          <div>
            <Label htmlFor="contactInfo">Contact Information *</Label>
            <Input
              id="contactInfo"
              value={expertDetails.contactInfo}
              onChange={(e) => setExpertDetails(prev => ({ ...prev, contactInfo: e.target.value }))}
              placeholder="expert@organization.gov.in, +91-XXXXXXXXXX"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Qualifications *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQualification}>
                Add Qualification
              </Button>
            </div>
            {expertDetails.qualifications.map((qual, index) => (
              <Input
                key={index}
                value={qual}
                onChange={(e) => updateQualification(index, e.target.value)}
                placeholder="Ph.D. in Computer Science, CISSP Certified, etc."
                className="mb-2"
              />
            ))}
          </div>

          <Button 
            onClick={handleGenerateCertificate} 
            disabled={isGenerating || !expertDetails.name || !expertDetails.designation}
            className="w-full"
          >
            {isGenerating ? 'Generating Certificate...' : 'Generate Certificate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
