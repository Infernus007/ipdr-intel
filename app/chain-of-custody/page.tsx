'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { CoCTimeline, CoCSummary } from '@/components/chain-of-custody/coc-timeline';
import { BSACertificateDisplay, BSACertificateGenerator } from '@/components/chain-of-custody/bsa-certificate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  FileCheck, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Scale,
  Eye,
  RefreshCw
} from 'lucide-react';
import { globalCoC, BSASection63Certificate, AuditLogEntry } from '@/lib/chain-of-custody';
import { toast } from 'sonner';

function ChainOfCustodyContent() {
  const { currentCase, evidenceFiles } = useAppStore();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  const [integrityStatus, setIntegrityStatus] = useState<'verified' | 'compromised' | 'unknown'>('unknown');
  const [certificates, setCertificates] = useState<BSASection63Certificate[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Load audit log
    const log = globalCoC.getFullAuditLog();
    setAuditLog(log);
    
    // Set first evidence file as selected if available
    if (evidenceFiles.length > 0 && !selectedEvidenceId) {
      setSelectedEvidenceId(evidenceFiles[0].id);
    }
  }, [evidenceFiles, selectedEvidenceId]);

  const verifyChainIntegrity = async () => {
    setIsVerifying(true);
    try {
      const verification = await globalCoC.verifyChainIntegrity();
      setIntegrityStatus(verification.isValid ? 'verified' : 'compromised');
      
      if (verification.isValid) {
        toast.success('Chain of Custody integrity verified successfully');
      } else {
        toast.error(`Chain integrity compromised: ${verification.errors.length} errors found`, {
          description: verification.errors[0]
        });
      }
    } catch (error) {
      console.error('Integrity verification failed:', error);
      toast.error('Failed to verify chain integrity');
      setIntegrityStatus('unknown');
    } finally {
      setIsVerifying(false);
    }
  };

  const exportAuditLog = async () => {
    try {
      const exportData = await globalCoC.exportAuditLog();
      
      // Create downloadable files
      const auditLogBlob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const verificationScriptBlob = new Blob([exportData.verificationScript], { 
        type: 'application/javascript' 
      });
      
      // Download audit log
      const auditUrl = URL.createObjectURL(auditLogBlob);
      const auditLink = document.createElement('a');
      auditLink.href = auditUrl;
      auditLink.download = `audit_log_${exportData.exportTimestamp.toISOString().split('T')[0]}.json`;
      auditLink.click();
      URL.revokeObjectURL(auditUrl);
      
      // Download verification script
      const scriptUrl = URL.createObjectURL(verificationScriptBlob);
      const scriptLink = document.createElement('a');
      scriptLink.href = scriptUrl;
      scriptLink.download = `verify_audit_log.js`;
      scriptLink.click();
      URL.revokeObjectURL(scriptUrl);
      
      toast.success('Audit log and verification script exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export audit log');
    }
  };

  const handleCertificateGenerated = (certificate: BSASection63Certificate) => {
    setCertificates(prev => [...prev, certificate]);
    toast.success('BSA Section 63 Certificate generated successfully', {
      description: `Certificate ID: ${certificate.certificateId}`
    });
  };

  const selectedEvidence = evidenceFiles.find(f => f.id === selectedEvidenceId);
  const relevantAuditLog = selectedEvidenceId 
    ? auditLog.filter(entry => entry.subject === selectedEvidenceId || entry.subject.includes(selectedEvidenceId))
    : auditLog;

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Case</h2>
            <p className="text-gray-600">Please create a case first to view Chain of Custody.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavMenu />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Chain of Custody</h1>
              <p className="text-gray-600">
                Complete audit trail and legal compliance for case: <strong>{currentCase.title}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={verifyChainIntegrity} disabled={isVerifying}>
                {isVerifying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify Integrity
              </Button>
              <Button variant="outline" onClick={exportAuditLog}>
                <Download className="h-4 w-4 mr-2" />
                Export Audit Log
              </Button>
            </div>
          </div>

          {/* Legal Compliance Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Scale className="h-4 w-4" />
              <span className="font-medium">Legal Compliance Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>BSA 2023 Section 63 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Telecommunications Act 2023</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>DPDP Act 2023 Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Selection */}
        {evidenceFiles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Select Evidence File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedEvidenceId === '' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEvidenceId('')}
                >
                  All Evidence
                </Button>
                {evidenceFiles.map((file) => (
                  <Button
                    key={file.id}
                    variant={selectedEvidenceId === file.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEvidenceId(file.id)}
                    className="font-mono"
                  >
                    {file.filename}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">Audit Timeline</TabsTrigger>
            <TabsTrigger value="certificates">BSA Certificates</TabsTrigger>
            <TabsTrigger value="integrity">Integrity Verification</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CoCSummary
                  totalEntries={relevantAuditLog.length}
                  firstEntry={relevantAuditLog[0]}
                  lastEntry={relevantAuditLog[relevantAuditLog.length - 1]}
                  integrityStatus={integrityStatus}
                />
              </div>
              <div className="lg:col-span-2">
                <CoCTimeline
                  auditLog={auditLog}
                  evidenceId={selectedEvidenceId || 'all'}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="grid gap-6">
              {/* Certificate Generation */}
              {selectedEvidence && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5" />
                      Generate Legal Certificate
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Generate BSA Section 63 compliant certificate for evidence: {selectedEvidence.filename}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <BSACertificateGenerator
                      caseId={currentCase.id}
                      evidenceId={selectedEvidence.id}
                      onCertificateGenerated={handleCertificateGenerated}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Generated Certificates */}
              {certificates.map((certificate) => (
                <BSACertificateDisplay
                  key={certificate.certificateId}
                  certificate={certificate}
                />
              ))}

              {certificates.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Certificates Generated</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate BSA Section 63 certificates for court admissibility
                    </p>
                    {!selectedEvidence && (
                      <p className="text-sm text-muted-foreground">
                        Select an evidence file above to generate a certificate
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="integrity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Chain Integrity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {integrityStatus === 'verified' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {integrityStatus === 'compromised' && (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    {integrityStatus === 'unknown' && (
                      <Eye className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      Integrity Status: {integrityStatus.charAt(0).toUpperCase() + integrityStatus.slice(1)}
                    </span>
                  </div>
                  <Badge variant={integrityStatus === 'verified' ? 'default' : 'destructive'}>
                    {auditLog.length} Entries
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Cryptographic Verification</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ SHA-256 hash chain validation</li>
                      <li>✓ Tamper-evident audit logging</li>
                      <li>✓ Chronological integrity check</li>
                      <li>✓ Digital signature verification</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Legal Compliance</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ BSA 2023 Section 63 requirements</li>
                      <li>✓ Unbroken chain of custody</li>
                      <li>✓ Expert certification ready</li>
                      <li>✓ Court admissibility standards</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={verifyChainIntegrity} disabled={isVerifying} className="w-full">
                  {isVerifying ? 'Verifying...' : 'Run Full Integrity Verification'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function ChainOfCustodyPage() {
  return (
    <DemoProvider>
      <ChainOfCustodyContent />
    </DemoProvider>
  );
}
