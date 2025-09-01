'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { Button } from '@/components/ui/button';
import { generateSecurePDFReport, downloadPDF } from '@/lib/pdf-generator';
import { generateReportFilename } from '@/utils/formatters';
import { toast } from 'sonner';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';
import { 
  FileText, 
  Download, 
  Shield, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  BarChart3,
  Users
} from 'lucide-react';

function ReportsContent() {
  const { currentCase, records, anomalies, evidenceFiles } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const walkthroughTarget = useWalkthroughTarget('generate-reports');

  const generateReport = async () => {
    if (!currentCase) {
      toast.error('No active case selected');
      return;
    }

    setIsGenerating(true);
    toast.info('Generating secure PDF report...');

    try {
      const reportData = {
        case: currentCase,
        records,
        anomalies,
        evidenceFiles
      };

      const pdfBlob = await generateSecurePDFReport(reportData);
      const filename = generateReportFilename(currentCase.title, 'pdf');
      
      downloadPDF(pdfBlob, filename);
      
      toast.success('Report generated successfully!', {
        description: 'Secure PDF with Section 65B certificate downloaded'
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Failed to generate report', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Case</h2>
            <p className="text-gray-600">Please create a case first to generate reports.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investigation Reports</h1>
          <p className="text-gray-600">Generate secure, court-ready PDF reports with Section 65B compliance</p>
        </div>

        {/* Case Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentCase.title}</h2>
              {currentCase.description && (
                <p className="text-gray-600 mb-4">{currentCase.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Created {new Date(currentCase.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {currentCase.status === 'active' ? 'Active' : currentCase.status}
                </div>
              </div>
            </div>
            <Button 
              onClick={generateReport}
              disabled={isGenerating}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              {...walkthroughTarget}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Secure Report
                </>
              )}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{evidenceFiles.length}</p>
                  <p className="text-sm text-blue-800">Evidence Files</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{records.length.toLocaleString()}</p>
                  <p className="text-sm text-green-800">Records Analyzed</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{anomalies.length}</p>
                  <p className="text-sm text-orange-800">Anomalies Found</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(records.map(r => r.aParty)).size}
                  </p>
                  <p className="text-sm text-purple-800">Unique Entities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legal Compliance */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Legal Compliance</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Section 65B Certificate</h4>
                  <p className="text-sm text-gray-600">
                    Includes mandatory certificate under Section 65B of the Indian Evidence Act, 1872
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Digital Signature</h4>
                  <p className="text-sm text-gray-600">
                    Cryptographic hash signature for document integrity verification
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Tamper-Proof Watermark</h4>
                  <p className="text-sm text-gray-600">
                    Confidential watermark on every page to prevent unauthorized modifications
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Contents */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Report Contents</h3>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                • Case summary with investigation details
              </div>
              <div className="text-sm text-gray-700">
                • Evidence files with SHA-256 integrity hashes
              </div>
              <div className="text-sm text-gray-700">
                • Key findings and statistical analysis
              </div>
              <div className="text-sm text-gray-700">
                • Detected anomalies with severity ratings
              </div>
              <div className="text-sm text-gray-700">
                • Complete audit trail of all actions
              </div>
              <div className="text-sm text-gray-700">
                • Protocol and traffic pattern analysis
              </div>
              <div className="text-sm text-gray-700">
                • Digital forensics certification
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-8">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Security Notice</h4>
              <p className="text-sm text-amber-700 mt-1">
                This report contains sensitive investigative data. Handle according to your organization's 
                data protection policies. The generated PDF includes cryptographic signatures for 
                integrity verification and is admissible in Indian courts under Section 65B.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <DemoProvider>
      <ReportsContent />
    </DemoProvider>
  );
}
