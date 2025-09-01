'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { RecordsTable } from '@/components/records/records-table';
import { AdvancedSearch, AdvancedSearchFilters } from '@/components/search/advanced-search';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { Button } from '@/components/ui/button';
import { IPDRRecord } from '@/lib/types';
import { FileText, Download, Filter, Search } from 'lucide-react';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

function RecordsContent() {
  const { currentCase, records, getAdvancedFilteredRecords } = useAppStore();
  const [selectedRecords, setSelectedRecords] = useState<IPDRRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<IPDRRecord[]>(records);
  const [isSearching, setIsSearching] = useState(false);
  const walkthroughTarget = useWalkthroughTarget('records-table');

  const handleAdvancedSearch = async (filters: AdvancedSearchFilters) => {
    setIsSearching(true);
    try {
      // Simulate processing delay for large datasets
      await new Promise(resolve => setTimeout(resolve, 500));
      const filtered = getAdvancedFilteredRecords(filters);
      setFilteredRecords(filtered);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setFilteredRecords(records);
  };

  // Update filtered records when records change
  useMemo(() => {
    setFilteredRecords(records);
  }, [records]);

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
              <div className="text-2xl font-bold text-blue-600">{filteredRecords.length.toLocaleString()}</div>
              <div className="text-sm text-gray-600">
                {filteredRecords.length === records.length ? 'Total Records' : `Filtered Records (${records.length.toLocaleString()} total)`}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-green-600">
                {new Set(filteredRecords.map(r => r.aParty)).size}
              </div>
              <div className="text-sm text-gray-600">Unique Source IPs</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(filteredRecords.map(r => r.protocol)).size}
              </div>
              <div className="text-sm text-gray-600">Protocols</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="text-2xl font-bold text-orange-600">
                {filteredRecords.reduce((sum, r) => sum + r.bytesTransferred, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Bytes</div>
            </div>
          </div>
        </div>

        {/* Advanced Search */}
        <div className="mb-6">
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            onClear={handleClearSearch}
            totalRecords={records.length}
            filteredCount={filteredRecords.length}
            isLoading={isSearching}
          />
        </div>

        {/* Sample Data Section - Show when no records */}
        {records.length === 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">No records found</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Upload IPDR files or download sample data to get started with the analysis.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    <a href="/test-data/airtel_test_small_1k.csv" download>
                      <Download className="h-4 w-4 mr-2" />
                      Small Sample (1K records)
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    <a href="/test-data/airtel_test_medium_100k.csv" download>
                      <Download className="h-4 w-4 mr-2" />
                      Medium Sample (100K records)
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="text-blue-700 border-blue-300 hover:bg-blue-100">
                    <a href="/test-data/airtel_test_large_1m.csv" download>
                      <Download className="h-4 w-4 mr-2" />
                      Large Sample (1M records)
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border p-6" {...walkthroughTarget}>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results {filteredRecords.length !== records.length && `(${filteredRecords.length} of ${records.length})`}
            </h2>
          </div>
          
          <RecordsTable 
            records={filteredRecords} 
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
