'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { CreateCaseDialog } from '@/components/cases/create-case-dialog';
import { IPDRFileUpload } from '@/components/upload/ipdr-file-upload';
import { WelcomeScreen } from '@/components/home/welcome-screen';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { useWalkthrough } from '@/components/walkthrough/walkthrough-provider';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileText, 
  BarChart3, 
  Network, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BookOpenIcon
} from 'lucide-react';

function HomeContent() {
  const { currentCase, cases, records, anomalies, evidenceFiles } = useAppStore();
  const [showUpload, setShowUpload] = useState(false);
  const { startWalkthrough, hasSeenWalkthrough } = useWalkthrough();

  // Show welcome screen if no case is active
  if (!currentCase) {
    return <WelcomeScreen />;
  }

  const stats = {
    totalCases: cases.length,
    totalRecords: records.length,
    totalAnomalies: anomalies.length,
    totalFiles: evidenceFiles.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavMenu />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">IPDR-Intel+</h1>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Investigation Dashboard</h2>
            <p className="text-gray-600">
              Active Case: <strong>{currentCase.title}</strong>
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
                <p className="text-sm text-gray-600">Active Cases</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Records Analyzed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnomalies}</p>
                <p className="text-sm text-gray-600">Anomalies Detected</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <Upload className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
                <p className="text-sm text-gray-600">Evidence Files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Case Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentCase.title}</h3>
              {currentCase.description && (
                <p className="text-gray-600 mb-3">{currentCase.description}</p>
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
            <div className="flex gap-2">
              <CreateCaseDialog />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{currentCase.evidenceFiles.length}</p>
              <p className="text-sm text-blue-800">Evidence Files</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{currentCase.recordCount.toLocaleString()}</p>
              <p className="text-sm text-green-800">Records Processed</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-orange-600">{currentCase.anomalyCount}</p>
              <p className="text-sm text-orange-800">Anomalies Found</p>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-6 w-6 text-gray-700" />
            <h3 className="text-xl font-semibold text-gray-900">Upload IPDR Files</h3>
          </div>
          <IPDRFileUpload caseId={currentCase.id} />
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
            <p className="text-sm text-gray-600">AI-powered anomaly detection and pattern analysis</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Network className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Network Graph</h4>
            <p className="text-sm text-gray-600">Interactive relationship mapping and visualization</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <FileText className="h-12 w-12 text-purple-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Legal Reports</h4>
            <p className="text-sm text-gray-600">Section 65B compliant reports with watermarks</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <Shield className="h-12 w-12 text-orange-500 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Audit Trail</h4>
            <p className="text-sm text-gray-600">Immutable evidence logging and chain of custody</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <DemoProvider>
      <HomeContent />
    </DemoProvider>
  );
}
