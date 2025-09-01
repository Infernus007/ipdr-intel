'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { RecordsTable } from '@/components/records/records-table';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { Button } from '@/components/ui/button';
import { IPDRRecord } from '@/lib/types';
import { FileText, Download, Filter } from 'lucide-react';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

function RecordsContent() {
  const { currentCase, records } = useAppStore();
  const [selectedRecords, setSelectedRecords] = useState<IPDRRecord[]>([]);
  const walkthroughTarget = useWalkthroughTarget('records-table');

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Case</h2>
            <p className="text-gray-600">Please create a case first to view records.</p>
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
              <h1 className="text-3xl font-bold text-gray-900">IPDR Records</h1>
              <p className="text-gray-600 mt-1">Case: {currentCase.title}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" disabled={selectedRecords.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected ({selectedRecords.length})
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-blue-600">{records.length.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">
                {new Set(records.map(r => r.aParty)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Source IPs</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(records.map(r => r.protocol)).size}
              </div>
              <div className="text-sm text-gray-600">Protocols</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-orange-600">
                {records.reduce((sum, r) => sum + r.bytesTransferred, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Bytes</div>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border p-6" {...walkthroughTarget}>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter & Search Records</h2>
          </div>
          
          <RecordsTable 
            records={records} 
            onSelectionChange={setSelectedRecords}
          />
        </div>
      </main>
    </div>
  );
}

export default function RecordsPage() {
  return (
    <DemoProvider>
      <RecordsContent />
    </DemoProvider>
  );
}
